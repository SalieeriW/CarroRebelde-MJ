import { MapSchema, Schema, type } from "@colyseus/schema"; // CAMBIADO: Map a MapSchema

export class MinigamePlayer extends Schema {
  @type("string") sessionId: string = "";
  @type("string") role: string = "";
  @type("boolean") connected: boolean = true;
  @type("number") score: number = 0;
}

export class MinigameState extends Schema {
  @type("string") roomCode: string = "";
  @type("number") selectedMinigame: number = 0;
  @type("string") gamePhase: string = "waiting";
  @type("boolean") gameCompleted: boolean = false;
  @type("number") score: number = 0;
  @type("number") timeLeft: number = 0;

  @type("string") gameData: string = "";

  @type({ map: MinigamePlayer })
  players = new MapSchema<MinigamePlayer>(); // CAMBIADO: Usar MapSchema e inicializar
}
