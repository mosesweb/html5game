const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cors = require('cors')
app.use(cors({origin: 'http://localhost:3000'}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('connection');
  socket.on('player pos', (msg) => {
    console.log(msg)
    console.log('player pos: ' + msg);

    io.emit('allplayers', { someProperty: 'some value', otherProperty: 'other value' }); // This will emit the event to all connected sockets
  });

});
server.listen(3330, () => {
  console.log('listening on *:3330');
});