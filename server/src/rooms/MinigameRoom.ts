import { Room, Client } from "colyseus";
import { MinigameState, MinigamePlayer } from "./schema/MinigameState";

export class MinigameRoom extends Room<MinigameState> {
    maxClients = 4; // Aumentar para soportar más jugadores
    public roomCode: string = "";
    private roleAssignments: { [minigameId: number]: string[] } = {
        1: ["drawer", "guesser"], // Pictionary
        2: ["player1", "player2"], // Genérico
        3: ["wordSeer", "wordTyper"], // Wordle cooperativo
        4: ["player1", "player2"],
        5: ["player1", "player2"],
        6: ["player1", "player2"]
    };

    onCreate(options: any) {
        this.setState(new MinigameState());
        
        this.roomCode = options.roomCode || this.generateRoomCode();
        this.state.roomCode = this.roomCode;
        this.state.selectedMinigame = options.minigameId || 1;
        this.state.gamePhase = "waiting";
        
        console.log(`MinigameRoom created: ${this.roomCode}, game: ${this.state.selectedMinigame}`);
        console.log(`🆔 Room ID: ${this.roomId}`);

        if ((global as any).activeMinigameRooms) {
            (global as any).activeMinigameRooms.set(this.roomCode, {
                roomId: this.roomId,
                roomCode: this.roomCode,
                minigameId: this.state.selectedMinigame,
                players: 0
            });
            console.log(`✅ Room registered in activeMinigameRooms`);
        } else {
            console.error('❌ activeMinigameRooms not available!');
        }
        
        // Manejar acciones de jugadores
        this.onMessage("player_action", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || this.state.gamePhase !== "playing") return;
            
            // Validar que el jugador tenga el rol correcto para la acción
            if (data.type === "draw" && player.role === "drawer") {
                // Broadcast a todos excepto el que envió
                this.broadcast("drawing_update", {
                    sessionId: client.sessionId,
                    data: data.drawingData
                }, { except: client });
            } else if (data.type === "guess" && player.role === "guesser") {
                this.handleGuess(client, data.guess);
            } else if (data.type === "word_input" && player.role === "wordTyper") {
                this.broadcast("word_update", {
                    letter: data.letter,
                    position: data.position
                });
            }
        });

        this.onMessage("start_minigame", (client) => {
            if (this.canStart()) {
                this.startMinigame();
            }
        });

        this.onMessage("minigame_complete", (client, data) => {
            if (this.state.gamePhase === "playing") {
                this.completeMinigame(data);
            }
        });
    }

    onJoin(client: Client, options: any) {
        console.log(`Client ${client.sessionId} joining room ${this.roomCode}`);
        
        const player = new MinigamePlayer();
        player.sessionId = client.sessionId;
        player.connected = true;
        
        // Asignar rol basado en el minijuego y orden de llegada
        const playerCount = this.state.players.size;
        const roles = this.roleAssignments[this.state.selectedMinigame] || ["player1", "player2"];
        player.role = roles[playerCount % roles.length];
        
        this.state.players.set(client.sessionId, player);
        
        console.log(`Assigned role: ${player.role} to ${client.sessionId}`);
        
        // Auto-start si todos están listos
        if (this.canStart()) {
            setTimeout(() => {
                if (this.canStart()) {
                    this.startMinigame();
                }
            }, 2000); // Dar tiempo para que todos carguen
        }
    }

    onLeave(client: Client, consented: boolean) {
        console.log(`Client ${client.sessionId} left`);
        
        const player = this.state.players.get(client.sessionId);
        if (player) {
            player.connected = false;
        }
        
        // Si alguien se va durante el juego, pausar
        if (this.state.gamePhase === "playing" && this.getConnectedCount() < 2) {
            this.state.gamePhase = "paused";
            this.broadcast("game_paused", { reason: "player_left" });
        }
        
        // Limpiar después de 30 segundos si no vuelve
        setTimeout(() => {
            if (player && !player.connected) {
                this.state.players.delete(client.sessionId);
            }
        }, 30000);
    }

    private canStart(): boolean {
        const minPlayers = this.getMinPlayersForMinigame(this.state.selectedMinigame);
        return this.getConnectedCount() >= minPlayers && 
               this.state.gamePhase === "waiting";
    }

    private getMinPlayersForMinigame(minigameId: number): number {
        // Algunos minijuegos requieren roles específicos
        switch (minigameId) {
            case 1: // Pictionary
            case 3: // Wordle cooperativo
                return 2;
            default:
                return 2;
        }
    }

    private getConnectedCount(): number {
        let count = 0;
        this.state.players.forEach(p => {
            if (p.connected) count++;
        });
        return count;
    }

    private startMinigame() {
        this.state.gamePhase = "playing";
        this.state.gameCompleted = false;
        this.state.score = 0;
        this.state.timeLeft = 60000;
        
        // Inicializar datos específicos del minijuego
        const gameData = this.initializeMinigameData(this.state.selectedMinigame);
        this.state.gameData = JSON.stringify(gameData);
        
        // Timer
        const interval = setInterval(() => {
            if (this.state.gamePhase === "playing" && this.state.timeLeft > 0) {
                this.state.timeLeft -= 1000;
                if (this.state.timeLeft <= 0) {
                    clearInterval(interval);
                    this.completeMinigame({ success: false, timeout: true });
                }
            } else {
                clearInterval(interval);
            }
        }, 1000);
        
        this.broadcast("minigame_started", {
            minigameId: this.state.selectedMinigame,
            timeLimit: this.state.timeLeft,
            roles: this.getRolesMap()
        });
    }

    private getRolesMap(): { [sessionId: string]: string } {
        const map: { [sessionId: string]: string } = {};
        this.state.players.forEach((player, sessionId) => {
            map[sessionId] = player.role;
        });
        return map;
    }

    private initializeMinigameData(minigameId: number): any {
        switch (minigameId) {
            case 1: // Pictionary
                return {
                    word: this.getRandomWord(),
                    currentDrawer: this.getPlayerByRole("drawer"),
                    currentGuesser: this.getPlayerByRole("guesser")
                };
            case 3: // Wordle
                return {
                    word: this.getRandomWord(5), // Palabra de 5 letras
                    attempts: 0,
                    maxAttempts: 6
                };
            default:
                return {};
        }
    }

    private getPlayerByRole(role: string): string | null {
        let result: string | null = null;
        this.state.players.forEach((player, sessionId) => {
            if (player.role === role) {
                result = sessionId;
            }
        });
        return result;
    }

    private handleGuess(client: Client, guess: string) {
        const gameData = JSON.parse(this.state.gameData);
        const correct = guess.toLowerCase() === gameData.word.toLowerCase();
        
        this.broadcast("guess_result", {
            guess: guess,
            correct: correct,
            guesser: client.sessionId
        });
        
        if (correct) {
            this.completeMinigame({ success: true, score: 100 });
        }
    }

    private completeMinigame(data: any) {
        this.state.gameCompleted = true;
        this.state.score = data.score || 0;
        this.state.gamePhase = "finished";
        
        this.broadcast("minigame_complete", {
            score: this.state.score,
            success: data.success || false
        });
        
        // Dar tiempo para ver resultados antes de limpiar
        setTimeout(() => {
            this.disconnect();
        }, 5000);
    }

    private getRandomWord(length?: number): string {
        const words = length === 5 
            ? ["GATOS", "PERRO", "CASAS", "LIBRO", "MUNDO"]
            : ["gato", "perro", "casa", "árbol", "coche"];
        return words[Math.floor(Math.random() * words.length)];
    }

    private generateRoomCode(): string {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
}