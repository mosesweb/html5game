import { useEffect, useState } from 'react'
import logo from './logo.svg'
import './App.css'
import { io } from "socket.io-client";
import { fromEvent, map, Observable, switchMap, takeUntil } from 'rxjs';
import React from 'react';
class BackEndGameCharacter {
  x: number = 0;
  y: number = 0;
  name: string = ""
}
class MainGame {
  gameArea: GameArea
  myscore: GameComponent
  myGamePiece: GameCharacter
  otherPlayers: GameCharacter[] = []

  myObstacles: GameComponent[] = [];
  keys: any = [];
  click: boolean = false;
  addedspecial: boolean = false;
  ioClient = io("http://localhost:3330", { transports: ['websocket'] });

  constructor() {
    this.gameArea = new GameArea();
    this.myscore = new GameComponent("30px", "Consolas", "black", 280, 40, "text", this.gameArea);

    // character connect
    this.ioClient.emit("player connect", "hi");
    this.ioClient.on("players location", (socketMessage: BackEndGameCharacter[]) => {

      for (var i = 0; i < socketMessage.length; i++) {
        //if(socketMessage.id)
        let characterIndex = this.otherPlayers.findIndex(o => o.name == socketMessage[i].name);
        if (characterIndex == -1) {
          console.log("no find!")
          console.log(socketMessage[i].name);

          let character = new GameCharacter(30, 30, "black", Math.random() * 100, Math.random() * 100, "", this.gameArea);
          character.name = socketMessage[i].name;
          this.otherPlayers.push(character);
        } else {
          // If it is not this client (ourselves)
          this.otherPlayers[characterIndex].x = socketMessage[i].x;
          this.otherPlayers[characterIndex].y = socketMessage[i].y;

          const usIndex = this.otherPlayers.findIndex(o => o.name == this.ioClient.id)
          if (usIndex !== -1) {
            this.otherPlayers[usIndex].isUs = true
          }
        }
      }
    })
    this.ioClient.on("player disconnected", (socketId: string) => {
      let characterIndex = this.otherPlayers.findIndex(o => o.name == socketId);
      if (characterIndex !== -1) {
        this.otherPlayers.splice(characterIndex, 1);
      }
    });

    this.myGamePiece = new GameCharacter(30, 30, "green", 0, 0, "", this.gameArea);
    this.myGamePiece.gravity = 0;

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
    this.gameArea.setBg();
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
    }

    for (var i = 0; i < this.myObstacles.length; i += 1) {
      if (this.myObstacles[i].cancrash)
        this.myObstacles[i].x += -1; // move obstacle x <--
      this.myObstacles[i].update();
    }
    this.scoretext = "score (" + this.otherPlayers.filter(o => o.isUs).length + ") "

    this.myscore.text = this.scoretext + this.gameArea.frameNo;
    this.myscore.update();
    this.myGamePiece.newPos();
    this.myGamePiece.update();

    this.ioClient.emit('player pos', this.myGamePiece); // move to faster interval

    this.otherPlayers.forEach(o => {
      if (!o.isUs)
        o.update();
    })

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
    if (this.myGamePiece.speedX != 0 || this.myGamePiece.speedY != 0) {
      this.myGamePiece.isWalking = true;
    }
    else
      this.myGamePiece.isWalking = false;
      
    if (this.keys["Space"]) {
      {
        console.log(this.myObstacles)
        console.log("special!")
        this.myscore.text = "SCORaaaEaa: " + this.gameArea.frameNo;
        this.myscore.update();
        this.myObstacles.push(new BallComponent(10, 10, "red", this.myGamePiece.x + 50, this.myGamePiece.y, "", this.gameArea));
        console.log(this.myObstacles)
        this.addedspecial = true;
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
  ctx: CanvasRenderingContext2D;
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
    this.ctx = this.gamearea.context as CanvasRenderingContext2D;
  }

  update = () => {
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
  name: string = "";
  isUs: boolean = false;
  isWalking: boolean = false;
  image: HTMLImageElement;

  constructor(width: any, height: any, color: any, x: any, y: any, type: any, gamearea: GameArea) {
    super(width, height, color, x, y, type, gamearea);
    this.image = new Image();
    this.image.src = "src/img/smiley.gif";
  }
  update = () => {
    this.ctx.fillStyle = this.color;
    // this.ctx.fillRect(this.x, this.y, this.width, this.height);
    if (this.isWalking)
      this.image.src = "src/img/angry.gif";
    else
      this.image.src = "src/img/smiley.gif";

    this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height)
  }

  accelerate = (n) => {
    this.gravity = n;
    return;
  }
}
class BallComponent extends GameComponent {
  cancrash = false;
  update = () => {
    this.x += 1; // move obstacle x -->
    this.ctx = this.gamearea.context as CanvasRenderingContext2D;

    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class GameArea {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  frameNo: any
  interval: any
  key: string = ""
  keys: boolean[] = []
  down$: Observable<any>
  up$: Observable<boolean[]>

  clickdown$: Observable<boolean>
  clickup$: Observable<boolean>
  canvasChild: HTMLCanvasElement;
  background: HTMLImageElement;
  // contextChild: CanvasRenderingContext2D;

  constructor() {
    // this.canvas = getCanvasElementById("gamecanvas")
    this.canvas = document.createElement("canvas") as HTMLCanvasElement;
    this.canvas.id = "bg"

    this.canvasChild = document.createElement("canvas") as HTMLCanvasElement;
    this.canvasChild.id = "game"
    //  this.canvas.appendChild(this.canvasChild);
    console.log(this.canvas);
    this.canvas.width = 1680;
    this.canvas.height = 570;

    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    // this.contextChild = this.canvasChild.getContext("2d") as CanvasRenderingContext2D;

    // this.contextChild.fillRect(10, 10, 100, 100)

    this.background = new Image();
    this.background.src = "src/img/grass.png";
    this.background.onload = () => {

    }

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

  setBg = () => {
    // for color
    // this.context.fillStyle = "blue";
    // this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // for single image this.context.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height);
    const pattern = this.context.createPattern(this.background, 'repeat');
    this.context.fillStyle = pattern as CanvasPattern;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height); // context.fillRect(x, y, width, height);


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

  useEffect(() => {
    var game: MainGame;
    game = new MainGame();
    game.start();
    console.log("ONCE")
  }, []);

  return (
    <div className="App">
      <header >
        {/* <canvas width={1680} id="gamecanvas"></canvas> */}
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

