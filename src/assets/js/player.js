import { StandingLeft, StandingRight, WalkingLeft, WalkingRight, JumpingLeft, JumpingRight, Dead } from "./state.js"
import { Sprite } from "./sprite.js"
import { SpriteAnimation } from "./sprite.js"

export default class Player extends Sprite {
    constructor(context, dx, dy, dWidth, dHeight, spriteSheetObj, canvasWidth, canvasHeight) {



        super(context, dx, dy, dWidth, dHeight, spriteSheetObj)



        this.states = [new StandingLeft(this), new StandingRight(this), new WalkingLeft(this), new WalkingRight(this), new JumpingLeft(this), new JumpingRight(this), new Dead(this)]
        this.stateHistory = []

        // currentState is at index 0 of states array
        this.currentState = this.states[0]

        this.image = spriteSheetObj.spriteImageObj.image

        this.fps = 16
        this.frameTimer = 0
        this.frameInterval = 1000 / this.fps

        this.gameWidth = canvasWidth
        this.gameHeight = canvasHeight
        this.floorHeight = 30

        this.velocityX = 0
        this.velocityY = 0
        this.weight = 1

        this.speedX = 0
        this.speedY = 0

        const initialmaxSpeedX = 25
        this.maxSpeedX = initialmaxSpeedX
        this.speedBonus = 0

        this.currentHealth = 100
        this.currentScore = 0
        this.currentLives = 1
        this.currentProgress = 0

        this.isAlive = true


    }

    setState(state) {
        this.currentState = this.states[state]
        this.currentState.enter()
    }

    resetPlayer() {
        this.isAlive = true
        this.currentHealth = 100
        this.setState(0)
    }


    update(input, deltaTime) {
        if (this.isAlive) {
            if (this.frameTimer > this.frameInterval) {
                if (this.spriteSheetObj.frameX < this.spriteSheetObj.endFrame) {

                    this.spriteSheetObj.frameX += 1
                    this.frameTimer = 0
                } else {
                    this.spriteSheetObj.frameX = 0
                    this.frameTimer = 0
                }
            } else {
                this.frameTimer += 16

            }
            // this.dx += this.velocityX
            this.dy += Math.floor(this.velocityY)

            this.currentState.handleInput(input)

            //horizontal movement
            // this.velocityX = this.speedX * this.velocity

            this.dx += ((this.speedX) * this.velocityX) * deltaTime
            // console.log(deltaTime * 1000)

            //
            if (this.dx <= 0) this.dx = 0
            else if (this.dx >= this.gameWidth - this.dWidth) this.dx = Math.floor(this.gameWidth - this.dWidth)

            // vertical movement
            this.dy += this.velocityY
            if (!this.onGround()) {
                this.velocityY += this.weight
            } else {
                this.velocityY = 0
            }
            // Prevent player from falling through floor
            if (this.dy > this.gameHeight - this.dHeight) this.dy = Math.floor(this.gameHeight - this.dHeight - this.floorHeight)
        } else {
            this.dy -= 2

        }
    }

    draw(context) {

        // console.log(spriteSheet)
        // draw sprite to canvas
        // console.log("in player.draw()")
        if (this.isVisible) {
            if (!this.isAlive) { context.filter = "opacity(65%) grayscale(100) blur(0.5px)" }
            // if (this.dx <= 75) this.dx = 75
            // if (this.dx >= 325) this.dx = 325
            context.drawImage(

                this.spriteImageObj.image,
                this.spriteImageObj.sWidth * this.spriteSheetObj.frameX,
                this.spriteImageObj.sHeight * this.spriteSheetObj.frameY, //this.spriteImageObj.sHeight, // * 0,
                this.spriteImageObj.sWidth,
                this.spriteImageObj.sHeight,
                Math.floor(this.dx),
                Math.floor(this.dy),
                Math.floor(this.dWidth),
                Math.floor(this.dHeight)
            )
        }
        context.filter = "none"

    }

    // Utility classes

    onGround() {
        return this.dy >= this.gameHeight - this.dHeight - this.floorHeight
    }

    // Score-keeping
    initScore(score) {
        scoreDisplay.innerHTML = String(currentScore).padStart(4, "0")
    }

    updateScore(object) {
        this.currentScore += object.pointValue
        return this.currentScore
    }



    updateHealth(object) {
        if (object) {
            this.currentHealth += object.healthValue
            if (this.currentHealth > 100) this.currentHealth = 100
            if (this.currentHealth <= 0) {
                this.currentHealth = 0
                this.isAlive = false
                this.setState(6)
                console.log(this.currentState)
                this.weight = 0
                this.currentLives--
                if (this.currentLives >= 1) {
                    setTimeout(() => {
                        this.resetPlayer()
                    }, "3000")
                } else {
                    console.log("Game Over")
                }
            }
            return this.currentHealth
        }
    }

    updateLives(number) {
        this.currentLives += number
    }


}



