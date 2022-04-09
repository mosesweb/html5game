import { useEffect, useState } from 'react'
import logo from './logo.svg'
import './App.css'
import { io } from "socket.io-client";
import { concat, fromEvent, interval, map, Observable, range, Subject, switchMap, take, takeUntil } from 'rxjs';
import React from 'react';
import { MoveStatus } from './models/MoveStatus';
import { GameComponentInterface } from './models/GameComponentInterface';
import { GameArea } from './models/gameArea';
class BackEndGameCharacter {
  x: number = 0;
  y: number = 0;
  name: string = ""
  imagesrc: string = "";
  isWalking: boolean = false;
}
class MainGame {
  gameArea: GameArea
  myscore: GameComponent
  myGamePiece: GameCharacter
  otherPlayers: GameCharacter[] = []

  myObstacles: GameComponent[] = [];
  mySpaceships: SpaceShipComponent[] = [];
  mySpaceships$: Subject<SpaceShipComponent> = new Subject<SpaceShipComponent>();


  keys: any = [];
  click: boolean = false;
  addedspecial: boolean = false;
  ioClient = io("http://localhost:3330", { transports: ['websocket'] });

  createSpaceShip = () => {
    // Ships
    // const timer = interval(1000).pipe(take(4));
    // const sequence = range(1, 10);
    // const result = concat(timer, sequence);
    // result.subscribe(x => {
    //   console.log(x + " x1...");
    //   // this.balls.push(new BallComponent(10, 10, "green", this.x, this.y, "", this.gamearea, this.width, MoveStatus.WalkingLeft, true));
    //   // this.balls$.next(new BallComponent(10, 10, "green", this.x, this.y, "", this.gamearea, this.width, MoveStatus.WalkingLeft, true));
    // });

    console.log("create")
    //this.mySpaceships.push(new SpaceShipComponent(10, 50, "white", 1550, Math.random() * this.gameArea.canvas.height, "", this.gameArea));
    
    this.mySpaceships$.next(new SpaceShipComponent(10, 50, "white", Math.random() * this.gameArea.canvas.width, Math.random() * this.gameArea.canvas.height, "", this.gameArea));

  }

  constructor() {
    this.gameArea = new GameArea();
    this.myscore = new GameComponent("30px", "Consolas", "white", 280, 40, "text", this.gameArea);

    // character connect
    this.ioClient.emit("player connect", "hi");
    this.ioClient.on("players location", (socketMessage: BackEndGameCharacter[]) => {

      for (var i = 0; i < socketMessage.length; i++) {
        //if(socketMessage.id)
        let characterIndex = this.otherPlayers.findIndex(o => o.name == socketMessage[i].name);
        if (characterIndex == -1) {
          console.log("no find!")
          console.log(socketMessage[i]);

          let character = new GameCharacter(30, 30, "black", 0, 0, "", this.gameArea);
          character.name = socketMessage[i].name;
          this.otherPlayers.push(character);
        } else {
          // client found in list of players
          this.otherPlayers[characterIndex].x = socketMessage[i].x;
          this.otherPlayers[characterIndex].y = socketMessage[i].y;
          this.otherPlayers[characterIndex].image.src = socketMessage[i].imagesrc;
          this.otherPlayers[characterIndex].isWalking = socketMessage[i].isWalking;

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

    this.myGamePiece = new GameCharacter(30, 30, "green", Math.random() * 500, Math.random() * 100, "", this.gameArea);
    this.myGamePiece.gravity = 0;

    console.log("main game")

    this.gameArea.down$.subscribe((d: boolean[]) => {
      this.keys = d;

      if (this.keys["Space"]) {
        {
          console.log(this.myObstacles)
          console.log("special!")
          this.myscore.update();
          this.myGamePiece.ballsShooted++;
          console.log(this.myGamePiece.ballsShooted);
          this.myObstacles.push(new BallComponent(10, 10, "red", this.myGamePiece.x, this.myGamePiece.y, "", this.gameArea, this.myGamePiece.width, this.myGamePiece.movingStatus));
          console.log(this.myObstacles)
          this.addedspecial = true;
        }
      }
    });


    this.mySpaceships.forEach(m => {
      console.log(m.balls);
    })

    this.mySpaceships.forEach(s => {
      // s.balls$.subscribe((b: BallComponent) => {
      //   console.log(b);
      //   console.log("ball...")
      //   this.myObstacles.push(b)
      // })
    })

    this.mySpaceships$.subscribe((d: SpaceShipComponent) => {
      console.log("add ship")
      console.log(d);
      d.balls$.subscribe((b: BallComponent) => {
        console.log(b);
        console.log("ball...")
        this.myObstacles.push(b)
      })
      this.mySpaceships.push(d);
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
  gameover = false;
  updateGameArea = () => {
    if(this.gameover)
      return;

    var x, height, gap, minHeight, maxHeight, minGap, maxGap;

    const balls = this.myObstacles.filter(o => o.canCrush);
    const canCrashObstacles = this.myObstacles.filter(m => m.canCrash);
    for (i = 0; i < canCrashObstacles.length; i += 1) {

      if (balls.length > 0) {

        const ballThatHitSpaceShip = balls.filter(b => !b.isNpc).findIndex(b => b.crashWith(this.mySpaceships[i]));
        if (ballThatHitSpaceShip !== -1) {
          console.log("crash!")
          this.mySpaceships.filter(m => m.canCrash)[i].color = "yellow"
          const ballIndex = this.mySpaceships.findIndex(m => m == balls.filter(b => b.isNpc)[ballThatHitSpaceShip])

          // remove yellow marked (damanged) obstacles
         this.mySpaceships = this.mySpaceships.filter(m => m.color != "yellow"); // can be improved
        }
      }

      // we crash with spaceship
      let group = this.mySpaceships
      group.forEach(g  => {
        if(this.myGamePiece.crashWith(g)) {
          g.color = "purple"
          console.log("game over!")
          this.gameover= true;
          return;
        }
      });
      // we shot them..
      let group2 = this.myObstacles.filter(m => m.isNpc)
      group2.forEach(g  => {
        if(this.myGamePiece.crashWith(g)) {
          g.color = "purple"
          console.log("game over!")
          this.gameover= true;
          return;
        }
      });
      
    }

    this.gameArea.clear();
    this.gameArea.setBg();
    this.gameArea.frameNo += 1;
    if (this.gameArea.frameNo == 1 || this.everyinterval(150)) {

      this.createSpaceShip()

      x = this.gameArea.canvas.width;
      minHeight = 20;
      maxHeight = 200;
      minGap = 100;
      maxGap = 200;
      gap = Math.floor(Math.random() * (maxGap - minGap + 1) + minGap);

      this.myObstacles.push(new GameComponent(10, height, "green", x, 0, "", this.gameArea));
      // this.myObstacles.push(new GameComponent(10, x - height - gap, "green", x, height + gap, "", this.gameArea));


    }

    for (var i = 0; i < this.myObstacles.length; i += 1) {
      if (this.myObstacles[i].canCrash)
        this.myObstacles[i].x += -1; // move obstacle x <--
      this.myObstacles[i].update();
    }

    for (var i = 0; i < this.mySpaceships.length; i += 1) {
      if (this.mySpaceships[i].canCrash)
        this.mySpaceships[i].x += -1; // move obstacle x <--
      this.mySpaceships[i].update();
    }
    this.scoretext = "score (" + this.otherPlayers.filter(o => o.isUs).length + ") " + this.myGamePiece.movingStatus.toString()

    this.myscore.text = this.scoretext + this.myObstacles.filter(m => m.canCrash || m.canCrush).length;
    this.myscore.update();
    this.myGamePiece.newPos();
    this.myGamePiece.update();

    this.ioClient.emit('player pos', this.myGamePiece); // set our position to web socket server who broadcast it

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

class GameComponent implements GameComponentInterface {
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
  canCrash: boolean = true;
  canCrush: boolean = false;
  canHitPlayer: boolean = false;
  gamearea: GameArea
  movingStatus: MoveStatus = MoveStatus.Idle
  isShip = false;
  isNpc = false;

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

    if (this.speedX > 0) {
      this.movingStatus = MoveStatus.WalkingRight
    }
    if (this.speedX < 0) {
      this.movingStatus = MoveStatus.WalkingLeft
    }
    if (this.speedY < 0) {
      this.movingStatus = MoveStatus.WalkingUp
    }
    if (this.speedY > 0) {
      this.movingStatus = MoveStatus.WalkingDown
    }
    this.hitBottom();
  }

  hitBottom = () => {
    var rockbottom = this.gamearea.canvas.height - this.height;
    if (this.y > rockbottom) {
      this.y = rockbottom;
      this.gravitySpeed = 0;
    }
  }
  crashWith = (otherobj: GameComponent) => {
    if (!otherobj)
      return false;
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
  imagesrc: string;
  ballsShooted: number = 0;

  constructor(width: any, height: any, color: any, x: any, y: any, type: any, gamearea: GameArea) {
    super(width, height, color, x, y, type, gamearea);
    this.image = new Image();
    this.image.src = "src/img/smiley.gif";
    this.imagesrc = "src/img/smiley.gif";
  }

  update = () => {
    this.ctx.fillStyle = this.color;
    if (this.isWalking)
      this.image.src = "src/img/angry.gif";
    else
      this.image.src = "src/img/smiley.gif";

    this.imagesrc = this.image.src;
    this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height)
  }

  accelerate = (n) => {
    this.gravity = n;
    return;
  }
}

class SpaceShipComponent extends GameComponent {
  canCrash: boolean = true;
  canCrush: boolean = false;
  isShip = true;
  image: HTMLImageElement;
  imagesrc: string;
  balls: BallComponent[] = [];
  balls$: Subject<BallComponent> = new Subject<BallComponent>();
  constructor(width: any, height: any, color: any, x: any, y: any, type: any, gamearea: GameArea) {
    super(width, height, color, x, y, type, gamearea);
    this.image = new Image();
    this.image.src = "src/img/16425.gif";
    this.imagesrc = "src/img/16425.gif";

  }
  shootBall() {
    const timer = interval(1000).pipe(take(4));
    const sequence = range(1, 10);
    const result = concat(timer, sequence);
    result.subscribe(x => {
      console.log(x + " x...");
     this.balls.push(new BallComponent(10, 10, "green", this.x, this.y, "", this.gamearea, this.width, MoveStatus.WalkingLeft, true));
     this.balls$.next(new BallComponent(10, 10, "green", this.x, this.y, "", this.gamearea, this.width, MoveStatus.WalkingLeft, true));
    });
  }

  everyinterval = (n: any) => {
    if ((this.gamearea.frameNo / n) % 1 == 0) { return true; }
    return false;
  }

  ballShoot = false;
  update = () => {
    if (this.ballShoot === false) {
      this.shootBall();
      this.ballShoot = true;
    }
    this.ctx.fillStyle = this.color;
    this.imagesrc = this.image.src;
    this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height)
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class BallComponent extends GameComponent {
  canCrash: boolean = false;
  canCrush: boolean = true;
  canHitPlayer = true;
  gameCharacterMoveStatus: MoveStatus = MoveStatus.Idle;
  gameCharacterWidth: number = 0;
  constructor(width: any, height: any, color: any, x: any, y: any, type: any, gamearea: GameArea, gameCharacterWidth: number, gameCharacterMoveStatus: MoveStatus, isNpc = false) {
    super(width, height, color, x, y, type, gamearea);
    this.isNpc = isNpc;

    this.gameCharacterMoveStatus = gameCharacterMoveStatus;
    this.gameCharacterWidth = gameCharacterWidth;

    // if (this.gameCharacterMoveStatus == MoveStatus.WalkingRight)
    //   this.x += 50; // set start position of the ball relative to the gamecharacter's x pos
    // if (this.gameCharacterMoveStatus == MoveStatus.WalkingLeft)
    //   this.x -= 50;
    // if (this.gameCharacterMoveStatus == MoveStatus.WalkingUp)
    //   this.y -= 50;
    // if (this.gameCharacterMoveStatus == MoveStatus.WalkingDown)
    //   this.y += 50;
  }

  // update function
  update = () => {
    this.ctx = this.gamearea.context as CanvasRenderingContext2D;
    let xDirection = 0;
    let yDirection = 0;
    this.ctx.fillStyle = this.color;

    switch (this.gameCharacterMoveStatus) {
      case MoveStatus.WalkingRight:
        xDirection = 1;
        this.x += xDirection; // move obstacle x --> or <--
        this.x += 5;
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
        break;

      case MoveStatus.WalkingLeft:
        xDirection += -1;
        this.x += xDirection; // move obstacle x --> or <--
        this.x -= 5;
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
        break;

      case MoveStatus.WalkingUp:
        yDirection += -1;
        this.y += yDirection;
        this.y -= 5;
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
        break;

      case MoveStatus.WalkingDown:
        yDirection += 1;
        this.y += yDirection;
        this.y += 5;
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
        break;

      default:
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
        break;
    }
  }

  crashWith = (otherobj: any): boolean => {
    if (!otherobj)
      return false;
    var myleft = this.x;
    var myright = this.x + (this.width);
    var mytop = this.y;
    var mybottom = this.y + (this.height);
    var otherleft = otherobj.x;
    var otherright = otherobj.x + (otherobj.width);
    var othertop = otherobj.y;
    var otherbottom = otherobj.y + (otherobj.height);
    var crash = true;
    if (crash) {
      var text = new GameComponent("30px", "Consolas", "black", 580, 40, "crash", this.gamearea);
      text.update();
    }
    if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
      crash = false;
    }
    return crash;
  }
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

function randomDelay(arg0: number, arg1: number): any {
  throw new Error('Function not implemented.');
}
