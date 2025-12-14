import { Client, Room } from "colyseus";
import { MinigamePlayer, MinigameState } from "./schema/MinigameState";

export class MinigameRoom extends Room<MinigameState> {
  maxClients = 4;
  public roomCode: string = "";
  private roleAssignments: { [minigameId: number]: string[] } = {
    1: ["drawer", "guesser"],
    4: ["player1", "player2"],
  };

  onCreate(options: any) {
    this.setState(new MinigameState());

    this.roomCode = options.roomCode || this.generateRoomCode();
    this.state.roomCode = this.roomCode;
    this.state.selectedMinigame = options.minigameId || 4;
    this.state.gamePhase = "waiting";

    this.onMessage("game_update", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (
        player &&
        player.role === "player1" &&
        this.state.gamePhase === "playing"
      ) {
        this.state.gameData = JSON.stringify(data);
      }
    });

    this.onMessage("player_action", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (
        player &&
        this.state.gamePhase === "playing" &&
        data.type === "minigame4_input"
      ) {
        const gd = JSON.parse(this.state.gameData || "{}");
        gd.m4 = gd.m4 || {};
        gd.m4.inputs = gd.m4.inputs || {};

        gd.m4.inputs[client.sessionId] = data.payload;

        this.state.gameData = JSON.stringify(gd);
      }
    });

    this.onMessage("start_minigame", () => {
      if (this.canStart()) this.startMinigame();
    });
  }

  onJoin(client: Client, options: any) {
    const player = new MinigamePlayer();
    player.sessionId = client.sessionId;
    player.connected = true;

    const playerCount = this.state.players.size;
    const roles = this.roleAssignments[this.state.selectedMinigame] || [
      "player1",
      "player2",
    ];
    player.role = roles[playerCount % roles.length];

    this.state.players.set(client.sessionId, player);

    if (this.canStart()) {
      setTimeout(() => {
        if (this.canStart()) this.startMinigame();
      }, 1000);
    }
  }

  onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (player) player.connected = false;
  }

  private canStart(): boolean {
    return this.state.players.size >= 2 && this.state.gamePhase === "waiting";
  }

  private getConnectedCount(): number {
    let count = 0;
    // FIX: tipado explícito del parámetro 'p'
    this.state.players.forEach((p: MinigamePlayer) => {
      if (p.connected) count++;
    });
    return count;
  }

  private startMinigame() {
    this.state.gamePhase = "playing";
    this.state.gameCompleted = false;

    this.state.gameData = JSON.stringify({ m4: { inputs: {}, state: null } });

    this.broadcast("minigame_started", {
      minigameId: this.state.selectedMinigame,
      roles: this.getRolesMap(),
    });
  }

  private getRolesMap(): { [sessionId: string]: string } {
    const map: { [sessionId: string]: string } = {};
    // FIX: tipado explícito de los parámetros 'player' y 'sessionId'
    this.state.players.forEach((player: MinigamePlayer, sessionId: string) => {
      map[sessionId] = player.role;
    });
    return map;
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
