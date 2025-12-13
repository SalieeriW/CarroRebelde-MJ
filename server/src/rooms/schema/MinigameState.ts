import { Schema, type, MapSchema } from "@colyseus/schema";

export class MinigamePlayer extends Schema {
    @type("string") sessionId: string = "";
    @type("boolean") connected: boolean = true;
    @type("string") role: string = ""; // Puede ser "player1", "player2", etc.
}

export class MinigameState extends Schema {
    @type({ map: MinigamePlayer }) players = new MapSchema<MinigamePlayer>();
    @type("string") gamePhase: string = "waiting"; // waiting, playing, finished
    @type("number") selectedMinigame: number = 0; // 1-6
    @type("string") roomCode: string = ""; // Código compartido para que ambos se unan
    @type("string") gameData: string = "{}"; // JSON string con datos del minijuego específico
    @type("number") score: number = 0; // Puntuación cooperativa
    @type("boolean") gameCompleted: boolean = false;
    @type("number") timeLeft: number = 0; // Tiempo restante en ms
}

