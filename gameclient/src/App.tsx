import { useEffect, useState } from 'react'
import logo from './logo.svg'
import './App.css'
import { io } from "socket.io-client";
import { fromEvent, map, Observable, switchMap, takeUntil } from 'rxjs';

class MainGame {
  gameArea: GameArea
  myscore: GameComponent
  myGamePiece: GameCharacter
  otherPlayer: GameCharacter

  myObstacles: GameComponent[] = [];
  keys: any = [];
  click: boolean = false;
  addedspecial: boolean = false;
  ioClient = io("http://localhost:3330", { transports: ['websocket'] });

  constructor() {
    this.gameArea = new GameArea();
    this.myscore = new GameComponent("30px", "Consolas", "black", 280, 40, "text", this.gameArea);
    this.myGamePiece = new GameCharacter(30, 30, "red", 10, 120, "", this.gameArea);
    this.myGamePiece.gravity = 0;

    this.otherPlayer = new GameCharacter(30, 30, "black", 10, 120, "", this.gameArea);


    console.log("main game")
    this.gameArea.down$.subscribe((d: boolean[]) => {
      this.keys = d;
    });
    this.gameArea.up$.subscribe(d => {
      this.clearmove();
    });
    // mouse click
    this.gameArea.clickup$.subscribe((d: boolean) => {
      this.click = true;
    });
    this.gameArea.clickdown$.subscribe((d: boolean) => {
      this.click = false;
    });


  }
  clearmove() {
    this.myGamePiece.speedX = 0;
    this.myGamePiece.speedY = 0;
  }

  scoretext: string = "score ";
  updateGameArea = () => {
    var x, height, gap, minHeight, maxHeight, minGap, maxGap;
    for (i = 0; i < this.myObstacles.filter(m => m.cancrash).length; i += 1) {
      if (this.myGamePiece.crashWith(this.myObstacles.filter(m => m.cancrash)[i])) {
        console.log("crash!")
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
      minGap = 100;
      maxGap = 200;
      gap = Math.floor(Math.random() * (maxGap - minGap + 1) + minGap);
      this.myObstacles.push(new GameComponent(10, height, "green", x, 0, "", this.gameArea));
      this.myObstacles.push(new GameComponent(10, x - height - gap, "green", x, height + gap, "", this.gameArea));
      console.log("here..")
    }
    for (var i = 0; i < this.myObstacles.length; i += 1) {
      if (this.myObstacles[i].cancrash)
        this.myObstacles[i].x += -1; // move obstacle x <--
      this.myObstacles[i].update();
    }
    this.scoretext = "score (" + this.myObstacles.length + ") "

    this.myscore.text = this.scoretext + this.gameArea.frameNo;
    this.myscore.update();
    this.myGamePiece.newPos();
    this.myGamePiece.update();
    this.otherPlayer.update();
    
    this.ioClient.emit('player pos', {x: this.myGamePiece.x, y: this.myGamePiece.y});

    if (this.keys["KeyW"] || this.keys["KeyUp"]) {
      this.myGamePiece.speedY = -1;
    }
    if (this.keys["KeyD"] || this.keys["KeyRight"]) {
      this.myGamePiece.speedX = 1;
    }
    if (this.keys["KeyS"] || this.keys["KeyDown"]) {
      this.myGamePiece.speedY = 1;
    }
    if (this.keys["KeyA"] || this.keys["KeyLeft"]) {
      this.myGamePiece.speedX = -1;
    }
    if (this.keys["Space"]) {
      {
        //this.myGamePiece.speedX = 19;

        console.log(this.myObstacles)
        console.log("special!")
        this.myscore.text = "SCORaaaEaa: " + this.gameArea.frameNo;
        this.myscore.update();
        this.myObstacles.push(new BallComponent(10, 10, "red", this.myGamePiece.x + 50, this.myGamePiece.y, "", this.gameArea));
        console.log(this.myObstacles)
        this.addedspecial = true;
      }
    }
    // on click
    if (this.click) {
      if (!this.addedspecial) {

      }
    }
  }

  everyinterval = (n: any) => {
    if ((this.gameArea.frameNo / n) % 1 == 0) { return true; }
    return false;
  }

  start = () => {

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
  cancrash: boolean = true;

  gamearea: GameArea

  constructor(width: any, height: any, color: any, x: any, y: any, type: any, gamearea: GameArea) {
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
class GameCharacter extends GameComponent {
  accelerate = (n) => {
    this.gravity = n;
    return;
  }
}

class BallComponent extends GameComponent {
  cancrash = false;
  update = () => {
    this.x += 1; // move obstacle x -->
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
}

class GameArea {
  canvas: HTMLCanvasElement
  context: any
  frameNo: any
  interval: any
  key: string = ""
  keys: boolean[] = []
  down$: Observable<any>
  up$: Observable<boolean[]>

  clickdown$: Observable<boolean>
  clickup$: Observable<boolean>

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1680;
    this.canvas.height = 570; this.context = this.canvas.getContext("2d");

    this.down$ = fromEvent(document, 'keydown', (e: any) => {
      if (e.repeat) return this.keys;
      this.keys[e.code] = true;
      console.log("hey " + e.code)
      console.log(this.keys)
      return this.keys;
    })
    this.up$ = fromEvent(document, 'keyup', (e: any) => {
      this.keys[e.code] = false;

      return this.keys;
    })
    this.clickdown$ = fromEvent(document, 'mousedown', (e: any) => {
      return true;
    });
    this.clickup$ = fromEvent(document, 'mouseup', (e: any) => {
      return false;
    });
  }

  clear = () => {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  controlDown = (event: KeyboardEvent) => {
    this.key = event.code
  };
  controlUp = (event: KeyboardEvent) => {
    this.key = ""
  };

}
function App() {
  const [count, setCount] = useState(0)

  var socket = io();
  var ioClient = io("http://localhost:3330", { transports: ['websocket'] });

  // ioClient.on("seq-num", (msg: string) => console.info(msg));
  useEffect(() => {
    ioClient.on('allplayers', (msg) => {
      console.log("all!!")
      console.log(msg);
    });

    var game: MainGame;
    game = new MainGame();
    game.start();
  }, []);

  return (
    <div className="App">
      <header >
        <p>
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

