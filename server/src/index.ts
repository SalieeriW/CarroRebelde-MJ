import { Server } from "colyseus";
import cors from "cors"; // IMPORTADO
import express from "express";
import { createServer } from "http";
import { MinigameRoom } from "./rooms/MinigameRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors()); // USADO
app.use(express.json());

// 1. Crear el servidor HTTP
const gameServer = new Server({
  server: createServer(app),
});

// 2. Registrar la sala
gameServer.define("minigame_room", MinigameRoom);

// Opcional: Ruta de salud
app.get("/", (req, res) => {
  res.send("Colyseus server running.");
});

// 3. Iniciar el servidor
gameServer
  .listen(port)
  .then(() => {
    console.log(`🚀 Colyseus server listening on http://localhost:${port}`);
  })
  .catch((err) => {
    console.error("Colyseus server failed to start:", err);
  });
