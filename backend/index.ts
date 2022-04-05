import { Socket } from "socket.io";

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cors = require('cors')

class GameCharacter {
  x: number = 0;
  y: number = 0;
  name: string = ""
}

var players: GameCharacter[] = [];

app.use(cors({ origin: 'http://localhost:3000' }))

app.get('/', (req: any, res: any) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket: Socket) => {
  // console.log('connection');
  var obj = new GameCharacter();
  obj.x = 0;
  obj.y = 0;
  obj.name = socket.id;
  socket.on('player connect', (msg: any) => {
    console.log("hello connected person")
    players.push(obj);
  });

  socket.on('player pos', (msg: any) => {
    let playerIndex: number = players.findIndex(p => p.name == socket.id)
    if (playerIndex !== -1) {
      const updatedPlayer: GameCharacter = players[playerIndex]
      updatedPlayer.x = msg.x
      updatedPlayer.y = msg.y
      players[playerIndex] = updatedPlayer;
    }
    io.emit('players location', players);
  });

  socket.on('disconnect', (msg: any) => {
    const disconnectedId = socket.id;
    console.log("DISCONNECT " + socket.id);
    players.splice(players.findIndex(p => p.name == socket.id), 1)
    io.emit('players location', players);
    io.emit('player disconnected', disconnectedId);

  });

});
server.listen(3330, () => {
  console.log('listening on *:3330');
});