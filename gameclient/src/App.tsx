import { useEffect, useState } from 'react'
import logo from './logo.svg'
import './App.css'
import { io } from "socket.io-client";

class MainGame {
  gameArea: myGameArea
  myscore: GameComponent
  myGamePiece: GameComponent
  
  myObstacles: any = [];

  constructor() {
    this.gameArea = new myGameArea();
    this.myscore = new GameComponent("30px", "Consolas", "black", 280, 40, "text", this.gameArea);
    this.myGamePiece = new GameComponent(30, 30, "red", 10, 120, "", this.gameArea);
 }

  updateGameArea = () => {
    var x, height, gap, minHeight, maxHeight, minGap, maxGap;
    for (i = 0; i < this.myObstacles.length; i += 1) {
      if (this.myGamePiece.crashWith(this.myObstacles[i])) {
        return;
      }
    }
    this.gameArea.clear();
    this.gameArea.frameNo += 1;
    if (this.gameArea.frameNo == 1 || this.everyinterval(150)) {
      x = this.gameArea.canvas.width;
      minHeight = 20;
      maxHeight = 200;
      height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
      minGap = 50;
      maxGap = 200;
      gap = Math.floor(Math.random() * (maxGap - minGap + 1) + minGap);
      this.myObstacles.push(new GameComponent(10, height, "green", x, 0, "", this.gameArea));
      this.myObstacles.push(new GameComponent(10, x - height - gap, "green", x, height + gap, "", this.gameArea));
    }
    for (var i = 0; i < this.myObstacles.length; i += 1) {
      this.myObstacles[i].x += -1;
      this.myObstacles[i].update();
    }
    this.myscore.text = "SCORE: " + this.gameArea.frameNo;
    this.myscore.update();
    this.myGamePiece.newPos();
    this.myGamePiece.update();
  }

  everyinterval = (n: any) => {
    if ((this.gameArea.frameNo / n) % 1 == 0) { return true; }
    return false;
  }

  start = () => {
    this.gameArea.canvas.width = 480;
    this.gameArea.canvas.height = 270;
    document.body.insertBefore(this.gameArea.canvas, document.body.childNodes[0]);
    this.gameArea.frameNo = 0;
    this.gameArea.interval = setInterval(this.updateGameArea, 20);
  }
}

class GameComponent {
  type: any
  score: any
  width: any
  height: any
  speedX: any
  speedY: any
  x: any
  y: any
  gravity: any
  gravitySpeed: any
  ctx: any;
  color: any;
  text: string = "score"

  gamearea: myGameArea

  constructor(width: any, height: any, color: any, x: any, y: any, type: any, gamearea: myGameArea) {
    this.type = type;
    this.score = 0;
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;
    this.x = x;
    this.y = y;
    this.gravity = 0;
    this.gravitySpeed = 0;
    this.color = color;
    this.gamearea = gamearea
  }

  update = () => {
    this.ctx = this.gamearea.context;
    if (this.type == "text") {
      this.ctx.font = this.width + " " + this.height;
      this.ctx.fillStyle = this.color;
      this.ctx.fillText(this.text, this.x, this.y);
    } else {
      this.ctx.fillStyle = this.color;
      this.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
  newPos = () => {
    this.gravitySpeed += this.gravity;
    this.x += this.speedX;
    this.y += this.speedY + this.gravitySpeed;
    this.hitBottom();
  }

  hitBottom = () => {
    var rockbottom = this.gamearea.canvas.height - this.height;
    if (this.y > rockbottom) {
      this.y = rockbottom;
      this.gravitySpeed = 0;
    }
  }
  crashWith = (otherobj: any) => {
    var myleft = this.x;
    var myright = this.x + (this.width);
    var mytop = this.y;
    var mybottom = this.y + (this.height);
    var otherleft = otherobj.x;
    var otherright = otherobj.x + (otherobj.width);
    var othertop = otherobj.y;
    var otherbottom = otherobj.y + (otherobj.height);
    var crash = true;
    if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
      crash = false;
    }
    return crash;
  }
}

class myGameArea {
  canvas: any
  context: any
  frameNo: any
  interval: any
  constructor() {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
  }

  clear = () => {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }


}
function App() {
  const [count, setCount] = useState(0)

  const socket = io();
  const ioClient = io("http://localhost:3330", { transports: ['websocket'] });
  ioClient.emit('player move', { map: 4, coords: '0.0' });
  ioClient.on("seq-num", (msg: string) => console.info(msg));

  useEffect(() => {
    var game: MainGame = new MainGame();

    game.start();
  
    const accelerate = (event, n) => {
      game.myGamePiece.gravity = n;
      return;
    }
  });


  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello Vite + React!</p>
        <br />
        <button >ACCELERATE</button>
        <p>Use the ACCELERATE button to stay in the air</p>
        <p>How long can you stay alive?</p>
        <p>
          <button type="button" onClick={() => setCount((count) => count + 1)}>
            count is: {count}
          </button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
        <p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          {' | '}
          <a
            className="App-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
        </p>
      </header>
    </div >
  )
}

export default App
function componentDidMount() {
  throw new Error('Function not implemented.');
}

