import CollisionDetector from "./collision-detector.js"
import Observable from "./observable.js"
import { playerStates } from "./player-states.js"
import Sprite from "./sprite.js"
import { spriteTags } from "./sprite.js"
import GameObject from "./game-object.js"

const gameStates = {
    RUNNING: "running",
    PAUSED: "paused",
    GAMEOVER: "gameover",
    END: "end"
}

export class GameWorld extends Observable {
    #currentScene
    #gameState
    constructor(player, ui, input) {
        super()
        this.canvas = document.getElementById("game-screen__canvas")
        this.ctx = this.canvas.getContext("2d")

        this.isReady = false
        this.isPaused = false
        this.lastTime = 0
        this.deltaTime = 1

        this.comboCounter = 0
        // console.log(this)
    }

    static createGameObject(config) {
        return new GameObject(config)
    }

    get gameState() {
        return this.#gameState
    }

    set gameState(gameState) {
        this.#gameState = gameState
        this.notify({ gameState: this.#gameState })
    }

    get currentScene() {
        return this.#currentScene
    }

    set currentScene(scene) {
        this.#currentScene = scene
        this.notify({ currentScene: this.#currentScene })
    }

    init(player, input, ui) {
        this.player = player
        this.ui = ui
        this.input = input
        if (this.player && this.ui && this.input) {
            this.isReady = true
        }
    }

    loop(timeStamp) {
        // console.log("in loop function")
        if (!this.isReady) {
            console.error("Player, input and/or ui not defined for GameWorld")
        }
        if (!this.currentScene) {
            console.error("No currentScene defined for Gameworld loop")
            return
        }
        console.log(this.isPaused)
        if (this.isPaused === false) {
            // console.log(deltaTime)

            this.deltaTime = (timeStamp - this.lastTime) / 1000
            this.lastTime = timeStamp

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
            // ui.timerHUD.innerText = Math.floor(currentScene.music.duration - currentScene.music.currentTime)


            this.currentScene.update(this.deltaTime)
            this.player.update(this.input, this.deltaTime, 475, 270)
            console.log(this.player.velocityY)
            // console.log(this.player.isAlive)
            // console.log(this.player)
            if (this.currentScene.music.currentTime >= 0) {
                // Only detect collisions when player is alive
                if (this.player.isAlive === true) {
                    // console.log(currentScene.spawners)
                    if (this.currentScene.spawners) {
                        this.currentScene.spawners.forEach((spawner) => {

                            let collider = CollisionDetector.detectBoxCollision(this.player, spawner.objectPool.poolArray)
                            // console.log(spawner.objectPool.poolArray)
                            if (collider) {
                                console.log("collision")
                                if (collider.spriteTag === spriteTags.WIENER) {
                                    // console.log(this.player.stats.health)
                                    this.calculateCombo()
                                    this.player.stats.health += collider.healthValue

                                    this.player.stats.score += collider.pointValue
                                    // this.ui.elements.scoreRemaining.innerText = "\ " + (2500 - this.player.stats.score) + " to progress"
                                    this.ui.elements.scoreRemaining.innerText = `( ${2500 - this.player.stats.score} remaining)` //"\ " + (2500 - this.player.stats.score) + " to progress"

                                    if (this.player.stats.score >= 5000) {
                                        // ui.scoreCounterHUD.style.color = "var(--clr-purple)"
                                        // ui.scoreStatusHUD.innerText = "Next Level Unlocked!"
                                        this.player.stats.progress = 1
                                    }
                                    // calculateCombo()
                                } else if (collider.spriteTag === spriteTags.POO) {
                                    console.log("💩")
                                    this.resetCombo()
                                    this.player.stats.health += collider.healthValue
                                    if (this.player.stats.health <= 0) {
                                        this.player.isAlive = false
                                    }

                                } else if (collider.spriteTag === spriteTags.GULL) {
                                    console.log("🐦")
                                }



                            }
                        })
                    }
                } else {
                    console.log("gameloop: player is dead")
                    this.player.isAlive = false
                    this.player.setState[playerStates.DEAD]
                    // console.log("player.dx", this.player.dx)
                    // console.log("player.dy", this.player.dy)
                    // console.log(this.player.isOutOfBounds())
                    // if (this.player.isOutOfBounds() === true) {
                    //     this.player.isAlive = true
                    // }
                    // this.player.stats.lives--
                    // this.player.isAlive = false

                    // if (this.player.stats.lives > 1) {
                    //     // ui.livesCounterHUD.innerText = "x" + this.playerLives

                    // } else if (this.player.stats.lives = 1) {
                    //     // ui.livesCounterHUD.innerText = ""
                    // } else if (this.player.stats.lives <= 0) {
                    //     endGame()
                    // }


                }

            } else {
                console.log("showing endScreen")
                this.ui.show(this.ui.endsceneScreen)
            }

            this.currentScene.draw(this.ctx)
            this.player.draw(this.ctx)


            requestAnimationFrame(this.loop.bind(this))
        } else {
            this.pauseGame()
            console.log("game is paused")
        }

    }

    stopGame() {
        console.log("game has stopped")
    }

    message(data) {
        // console.log(this.constructor.name + " received :", data)
    }

    pauseGame() {
        if (this.isPaused) {
            // this.notify({ gameState: "paused" })
            this.ui.showUI("paused")
            this.musicPausedTime = this.currentScene.music.currentTime
            this.currentScene.music.pause()
        }
        else {
            this.ui.showUI("play")
            this.currentScene.music.currentTime = this.musicPausedTime
            this.currentScene.music.play()
            this.loop(this.lastTime)
            this.isPaused = false
        }
    }

    calculateCombo() {
        this.comboCounter++
        if (this.comboCounter > 0 && this.comboCounter <= 5) {
            for (let i = 1; i <= this.comboCounter; i++) {
                let nthChildSelector = `:nth-child(${i})`
                let nthChildSelectorString = nthChildSelector.toString()
                // console.log(nthChildSelectorString)
                let letter = this.ui.elements.hudCombo.querySelector(nthChildSelectorString)
                // console.dir(letter)
                letter.style.color = "var(--clr-sky-blue)"
                letter.style.opacity = "100%"
            }
        } else if (this.comboCounter > 5 && this.comboCounter <= 10) {
            for (let i = 6; i <= this.comboCounter; i++) {
                let nthChildSelectorIndex = i - 5
                let nthChildSelector = `:nth-child(${nthChildSelectorIndex})`
                let nthChildSelectorString = nthChildSelector.toString()
                // console.log(nthChildSelectorString)
                let letter = this.ui.elements.hudCombo.querySelector(nthChildSelectorString)
                // console.dir(letter)
                letter.style.color = "var(--clr-purple)"
                letter.style.opacity = "100%"
            }
        }
        if (this.comboCounter < 5) {
            this.player.speedMultiplier = 1
        } else if (this.comboCounter >= 5 && this.comboCounter < 10) {
            this.player.speedMultiplier = 1.5
        } else if (this.comboCounter >= 10) {
            this.player.speedMultiplier = 2
        }


        if (this.comboCounter === 10) {
            console.log("COMBO!!!")
        }
    }

    resetCombo() {
        this.comboCounter = 0
        this.player.speedMultiplier = 1
        let letters = this.ui.elements.hudCombo.querySelectorAll("span")
        letters.forEach((letter) => {
            letter.style.color = ""
            letter.style.opacity = "50%"
        })
    }

}

