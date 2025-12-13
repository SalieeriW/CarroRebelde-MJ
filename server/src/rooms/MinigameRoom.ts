import { Room, Client } from "colyseus";
import { MinigameState, MinigamePlayer } from "./schema/MinigameState";

export class MinigameRoom extends Room<MinigameState> {
    maxClients = 2;
    public roomCode: string = "";

    onCreate(options: any) {
        try {
            this.setState(new MinigameState());
            
            // Generate or use provided room code
            this.roomCode = options.roomCode || this.generateRoomCode();
            this.state.roomCode = this.roomCode;
            
            // Get selected minigame from options (1-6)
            this.state.selectedMinigame = options.minigameId || 1;
            
            this.state.gamePhase = "waiting";
            this.state.gameData = "{}";
            this.state.score = 0;
            this.state.gameCompleted = false;
            
            // Store room info globally
            if ((global as any).activeMinigameRooms) {
                (global as any).activeMinigameRooms.set(this.roomCode, {
                    roomId: this.roomId,
                    roomCode: this.roomCode,
                    minigameId: this.state.selectedMinigame,
                    players: 0
                });
            }
            
            console.log(`MinigameRoom created with code: ${this.roomCode}, minigame: ${this.state.selectedMinigame}`);

            // Listen for game updates from clients
            this.onMessage("game_update", (client, data) => {
                // Update game state based on client input
                if (this.state.gamePhase === "playing") {
                    this.state.gameData = JSON.stringify(data);
                }
            });

            this.onMessage("player_action", (client, data) => {
                // Handle player actions (movements, clicks, etc.)
                const player = this.state.players.get(client.sessionId);
                if (player && this.state.gamePhase === "playing") {
                    // Broadcast action to all players
                    this.broadcast("player_action", {
                        sessionId: client.sessionId,
                        action: data
                    }, { except: client });
                }
            });

            this.onMessage("start_minigame", (client) => {
                if (this.state.players.size >= 2 && this.state.gamePhase === "waiting") {
                    this.startMinigame();
                }
            });

            this.onMessage("minigame_complete", (client, data) => {
                if (this.state.gamePhase === "playing") {
                    this.state.gameCompleted = true;
                    this.state.score = data.score || 0;
                    this.state.gamePhase = "finished";
                    
                    // Notify all players
                    this.broadcast("minigame_complete", {
                        score: this.state.score,
                        success: data.success || false
                    });
                }
            });
        } catch (error) {
            console.error("Error in MinigameRoom onCreate:", error);
            throw error;
        }
    }

    onJoin(client: Client, options: any) {
        try {
            console.log(`Client ${client.sessionId} joined minigame room ${this.roomCode}`);
            
            const player = new MinigamePlayer();
            player.sessionId = client.sessionId;
            player.connected = true;
            
            // Assign role based on order
            const playerCount = this.state.players.size;
            player.role = playerCount === 0 ? "player1" : "player2";
            
            this.state.players.set(client.sessionId, player);
            
            // Update room info
            if ((global as any).activeMinigameRooms) {
                const roomInfo = (global as any).activeMinigameRooms.get(this.roomCode);
                if (roomInfo) {
                    roomInfo.players = this.state.players.size;
                    (global as any).activeMinigameRooms.set(this.roomCode, roomInfo);
                }
            }
            
            // If both players are here, auto-start
            if (this.state.players.size >= 2 && this.state.gamePhase === "waiting") {
                // Wait a bit for both clients to be ready
                setTimeout(() => {
                    if (this.state.players.size >= 2 && this.state.gamePhase === "waiting") {
                        this.startMinigame();
                    }
                }, 1000);
            }
        } catch (error) {
            console.error("Error in MinigameRoom onJoin:", error);
            throw error;
        }
    }

    onLeave(client: Client, consented: boolean) {
        console.log(`Client ${client.sessionId} left minigame room`);
        this.state.players.delete(client.sessionId);
        
        // Update room info
        if ((global as any).activeMinigameRooms) {
            const roomInfo = (global as any).activeMinigameRooms.get(this.roomCode);
            if (roomInfo) {
                roomInfo.players = this.state.players.size;
                (global as any).activeMinigameRooms.set(this.roomCode, roomInfo);
            }
        }
        
        // If a player leaves during game, reset to waiting
        if (this.state.gamePhase === "playing" && this.state.players.size < 2) {
            this.state.gamePhase = "waiting";
        }
    }

    onDispose() {
        console.log(`MinigameRoom ${this.roomCode} disposed`);
        
        // Remove room from global map
        if ((global as any).activeMinigameRooms) {
            (global as any).activeMinigameRooms.delete(this.roomCode);
        }
    }

    private startMinigame() {
        this.state.gamePhase = "playing";
        this.state.gameCompleted = false;
        this.state.score = 0;
        
        // Set time limit based on minigame (default 60 seconds)
        this.state.timeLeft = 60000;
        
        // Start countdown timer
        const interval = setInterval(() => {
            if (this.state.gamePhase === "playing" && this.state.timeLeft > 0) {
                this.state.timeLeft -= 1000;
                if (this.state.timeLeft <= 0) {
                    clearInterval(interval);
                    this.state.gamePhase = "finished";
                    this.broadcast("time_up", {});
                }
            } else {
                clearInterval(interval);
            }
        }, 1000);
        
        this.broadcast("minigame_started", {
            minigameId: this.state.selectedMinigame,
            timeLimit: this.state.timeLeft
        });
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

