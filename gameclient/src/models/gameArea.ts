import { Observable } from "rxjs/internal/Observable"
import { fromEvent } from "rxjs/internal/observable/fromEvent"

export class GameArea {
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
    background: HTMLImageElement;
    // contextChild: CanvasRenderingContext2D;
  
    constructor() {
      // this.canvas = getCanvasElementById("gamecanvas")
      this.canvas = document.createElement("canvas") as HTMLCanvasElement;
      this.canvas.id = "bg"
  
      console.log(this.canvas);
      this.canvas.width = 1680;
      this.canvas.height = 570;
  
      this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
      this.background = new Image();
      this.background.src = "src/img/seamless space_0.png";
  
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