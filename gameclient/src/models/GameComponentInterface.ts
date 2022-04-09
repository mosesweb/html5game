import { GameArea } from "./gameArea"
import { MoveStatus } from "./MoveStatus"

export interface GameComponentInterface {
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
    text: string 
    canCrash: boolean
    canCrush: boolean
    gamearea: GameArea
    movingStatus: MoveStatus
}