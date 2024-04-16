import CollisionDetector from "./collision-detector.new.js"
import Observable from "./observable.js"
import { playerStates } from "./player-state.js"
import { spriteTags } from "./sprite.js"
import GameObject from "./game-object.js"
import { GameScene } from "./game-scene.js"
import { typeWriter, animateBlur } from "./utils.js"

export const gameStateKeys = {
    TITLE: "title",
    START: "start",
    INTRO: "intro",
    PLAY: "play",
    PAUSED_BY_PLAYER: "paused-by-player",
    SCENE_END: "scene-end",
    GAMEOVER: "game-over",
    END: "game-end",
    CREDITS: "credits",
}

export const musicStateKeys = {
    PAUSED: "paused",
    PLAYING: "playing",
    STOPPED: "stopped",
    READY: "ready"
}

export class GameWorld extends Observable {
    #currentScene
    #gameState
    #timeRemaining
    #scenes
    constructor(player, ui, input) {
        super()

        this.#scenes = []
        this.isReady = false
        this.player = player
        this.ui = ui
        this.input = input

        if (this.player && this.ui && this.input) {
            this.isReady = true
        }


        this.canvas = document.getElementById("game-screen__canvas")
        this.ctx = this.canvas.getContext("2d")



        this.#gameState = gameStateKeys.TITLE


        this.lastTime = 0
        this.deltaTime = 1

        this.comboCounter = 0

        window.gameWorld = this
        // console.log(window)
        // console.log(this)

        this.#currentScene = {
            intervalId: null
        }


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

    notifyTimeRemaining() {
        if (this.music !== undefined) {
            this.#timeRemaining = this.music.duration - this.music.currentTime
            this.notify({ "time-remaining": Math.floor(this.#timeRemaining) })
        }
        // console.log(`time remaining: ${Math.floor(this.#timeRemaining)}`)
    }




    addScene(gameScene) {
        if (gameScene instanceof GameScene) {
            this.#scenes.push(gameScene)
            console.log("Game scene added")
        } else {
            console.warn("Invalid scene type. Expected GameScene.")
        }
    }


    loop(timeStamp) {
        // console.log("in loop 01")
        // console.log(this.currentScene)
        if (!this.isReady) {
            console.error("Player, input and/or ui not defined for GameWorld")
        }
        if (this.currentScene === undefined) {
            console.error("No currentScene defined for Gameworld loop")
            return
        }
        if (this.isPaused === false) {
            this.deltaTime = (timeStamp - this.lastTime) / 1000
            this.lastTime = timeStamp

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

            // console.log(this.player.velocityX)
            this.currentScene.update(this.deltaTime, this.input)
            // this.player.update(this.input, this.deltaTime)



            if (this.currentScene.music.currentTime >= 0) {
                // Only detect collisions when player is alive
                if (this.player.isAlive === true) {

                    // console.log(this.currentScene.spriteLayer.spawners)

                    this.currentScene.spriteLayer.spawners.forEach((spawner) => {
                        // console.log(spawner)
                        let colliders = spawner.getAllSpawnedObjects()

                        // console.log("colliders: ", colliders.length)
                        if (colliders.length !== 0 || colliders !== undefined) {
                            colliders.forEach((collider) => {
                                let collisionObject = CollisionDetector.detectBoxCollision(this.player, collider)
                                if (collisionObject != undefined) {
                                    // console.log(collisionObject)
                                    this.notify(collisionObject)

                                }


                            })
                        }
                    })




                    // if (this.currentScene.spawners) {
                    //     this.currentScene.spawners.forEach((spawner) => {

                    //         spawner.spawnedObjects.forEach((object) => {
                    //             let collider = CollisionDetector.detectBoxCollision(this.player, object)



                    //             if (collider) {
                    //                 // console.log("collision")
                    //                 if (collider.spriteTag === spriteTags.WIENER) {
                    //                     // console.log(this.player.stats.health)
                    //                     this.calculateCombo()
                    //                     this.player.stats.health += collider.healthValue
                    //                     this.player.stats.score += collider.pointValue
                    //                     this.player.stats.wienersCollected++

                    //                     // this.ui.elements.scoreRemaining.innerText = "\ " + (2500 - this.player.stats.score) + " to progress"
                    //                     // console.log(this.player.stats.progress)
                    //                     if (this.player.stats.progress === 0) {
                    //                         this.ui.elements.scoreRemaining.innerText = `( ${1000 - this.player.stats.score} remaining)` //"\ " + (2500 - this.player.stats.score) + " to progress"

                    //                         if (this.player.stats.score >= 1000) {
                    //                             // ui.scoreCounterHUD.style.color = "var(--clr-purple)"
                    //                             // ui.scoreStatusHUD.innerText = "Next Level Unlocked!"


                    //                             this.endScene()
                    //                         }
                    //                     } else {
                    //                         this.ui.elements.scoreRemaining.innerText = `( ${10000 - this.player.stats.score} remaining)` //"\ " + (2500 - this.player.stats.score) + " to progress"

                    //                         if (this.player.stats.score >= 10000) {
                    //                             // ui.scoreCounterHUD.style.color = "var(--clr-purple)"
                    //                             // ui.scoreStatusHUD.innerText = "Next Level Unlocked!"


                    //                             this.endScene()
                    //                         }
                    //                     }
                    //                     // calculateCombo()
                    //                 } else if (collider.spriteTag === spriteTags.POO) {
                    //                     // console.log("💩")
                    //                     this.resetCombo()
                    //                     this.player.stats.health += collider.healthValue
                    //                     this.player.stats.seagullBlessingsReceived++
                    //                     if (this.player.stats.health <= 0) {
                    //                         this.player.isAlive = false
                    //                     }

                    //                 } else if (collider.spriteTag === spriteTags.GULL) {
                    //                     // console.log("🐦")
                    //                 }

                    //             }

                    //         })
                    //     })
                    // }
                } else {
                    // console.log("gameloop: player is dead")
                    this.player.isAlive = false
                    this.player.setState(playerStates.DEAD)

                }

            } else {
                // console.log("showing endScreen")
                this.ui.show(this.ui.endsceneScreen)
            }
            this.currentScene.draw(this.ctx, true, true, true)

            // this.player.draw(this.ctx)


            requestAnimationFrame(this.loop.bind(this))
        } else {
            // this.pauseGame()
            console.log("game is paused")
        }

    }



    startGame = () => {

        // console.log(player.stats)
        // console.log(this.ui)

        // scene01.layers[0].filter = "none"


        this.initScene()

        this.gameState = gameStateKeys.PLAY
        this.ui.toggleUI(this.gameState)

        const superNantendo = document.getElementById("ui--super-nantendo")
        superNantendo.classList.add("teal-bg")
        // canvas.classList.remove("hidden")

        this.currentScene = game.scenes[0]

        // console.log(this.currentScene)

    }




    initScene() {

    }




    stopGame() {
        console.log("game has stopped")
    }



    endScene() {
        // Pause the game and the music
        this.isPaused = true
        clearInterval(this.#currentScene.intervalId)
        this.pauseMusic()
        // console.log("player progress before set: " + this.player.stats.progress)
        this.player.stats.progress += 1
        console.log("winner winner chicken dinner")
        // console.log("player progress after set: " + this.player.stats.progress)


        this.gameState = gameStateKeys.SCENE_END
        this.ui.toggleUI(this.gameState)

        // window and chicken animations
        const sceneEndContainerDIV = this.ui.elements.sceneEndContainer.querySelector("div")
        setTimeout(() => { sceneEndContainerDIV.style.transform = "translateY(0px)" }, 50)
        setTimeout(() => { this.ui.elements.excitedChicken.style.transform = "rotate(-15deg) translate(0px,50px) scale(100%)" }, 50)

        // Display level stats
        document.getElementById("scene-wieners").textContent = this.player.stats.wienersCollected
        document.getElementById("scene-score").textContent = this.player.stats.score
        document.getElementById("scene-blessings").textContent = this.player.stats.seagullBlessingsReceived


        document.getElementById("next-scene-button").addEventListener("click", (e) => {



            this.runShop()

            // console.log("next scene button clicked")
        })


    }

    initSceneGoals() {
        if (this.currentScene.goals.bronze.type === "score") {
            this.scoreGoal = this.currentScene.goals.bronze.value
            console.log(this.scoreGoal)
        }
    }



    startScene = () => {

        // TODO: fix
        const sceneIndex = this.player.stats.progress
        this.currentScene = this.#scenes[sceneIndex]
        this.initSceneGoals()

        const playMusic = () => {
            if (this.currentScene.hasOwnProperty("music")) {
                if (this.currentScene.isMusicLoaded) {
                    // console.log("music is loaded")
                    this.music = this.currentScene.music

                    this.playMusic()
                }
            }
        }

        const placesPlayer = () => {
            this.player.stats.lives = 3
            this.player.stats.score = 0
            this.player.stats.healthMax = 100
            this.player.stats.health = 100
            this.player.stats.wienersCollected = 0
            this.player.isAlive = true
        }

        const curtainUp = () => {
            this.gameState = gameStateKeys.PLAY
            this.ui.toggleUI(this.gameState)
            this.isPaused = false
            this.pauseGame()
            this.loop(0, this.#currentScene)
        }

        const checkGoal = () => {
            // console.log(this.player)
            if (this.player.stats.score >= this.scoreGoal) {
                console.log("You won! 🥳")
                clearInterval(intervalId)
                this.endScene()

            }
        }


        // Check for goal every 0.5 seconds
        const intervalId = setInterval(checkGoal, 500)


        console.log("player.progress" + this.player.stats.progress)

        // Call the functions in the desired order
        playMusic()
        placesPlayer()
        curtainUp()
    }


    runIntro() {

        // console.log(this.ui)

        // console.log(this.player.stats)

        const currentSceneIndex = this.player.stats.progress
        this.currentScene = this.#scenes[currentSceneIndex]
        // console.dir(this.currentScene)

        this.ui.toggleUI("cutscene")



        this.ui.hide(this.ui.elements.titleScreen)
        this.ui.hide(this.ui.elements.shopScreen)
        this.ui.show(this.ui.elements.introScreen)

        this.ui.show(this.ui.elements.popupNan)
        setTimeout(() => { this.ui.elements.introDialog.style.transform = "translateY(0)" }, 500)
        setTimeout(() => { this.ui.elements.popupNan.style.transform = "translateY(0px)" }, 700)
        // function animateBlur(blurValue, maxBlur, step) 

        this.currentScene.draw(this.ctx, false, true, true)
        setTimeout(() => { animateBlur(this.currentScene, this.ctx, 0.5, 2, 0.2) }, 1000)
        const dialogText = document.querySelector('#intro-dialog div').textContent
        typeWriter('intro-dialog', dialogText, 25)

        document.getElementById("intro-dialog").addEventListener("pointerdown", () => {
            setTimeout(() => { this.ui.elements.introDialog.style.transform = "translateY(400px)" }, 500)
            setTimeout(() => { this.ui.elements.popupNan.style.transform = "translateY(475px)" }, 700)
            setTimeout(() => { animateBlur(this.currentScene, this.ctx, 0, 0, 0.1) }, 1000)
            setTimeout(() => this.startScene(), 1300)
        })
    }

    runShop() {

        this.ui.toggleUI("cutscene")
        this.ui.hide(this.ui.elements.titleScreen)
        this.ui.show(this.ui.elements.shopScreen)
        this.ui.hide(this.ui.elements.introScreen)
        console.log(this.ui)
        let dialogText = document.querySelector('#shop-dialog div').textContent
        typeWriter('shop-dialog', dialogText, 25)

        document.getElementById("item-rainbonnet").querySelector(".buy-button").addEventListener("pointerdown", () => {
            let dialogText = "You don't have enough points for that. I can't just be giving stuff away now can I?"
            typeWriter('shop-dialog', dialogText, 25)
            setTimeout(() => {
                typeWriter('shop-dialog', "Sorry, come back once you get some more points.", 25)
            }, 5000) // Delay the second message by 10 seconds
        })



        // setTimeout(() => { this.ui.elements.shopDialog.style.transform = "translateY(-600px)" }, 100)




    }


    receiveUpdate(data) {
        console.log("gameworld received :", data)
    }

    pauseGame() {
        if (this.isPaused) {
            // console.log(this.gameState)
            this.pauseMusic()
            switch (this.#gameState) {
                case gameStateKeys.PAUSED_BY_PLAYER:
                    this.ui.toggleUI("paused")
                    break
                case gameStateKeys.LEVEL_END:
                    this.ui.toggleUI("level-end")
                    break
                default:
                    console.warn("No UI defined for gamestate: " + this.#gameState)
            }



        }
        else {
            this.ui.toggleUI("play")
            // this.music.currentTime = this.musicPausedTime

            this.playMusic()
            this.loop(this.lastTime)
            this.isPaused = false
        }
    }

    playMusic() {
        this.music.play()
        this.musicState = musicStateKeys.PLAYING
    }

    pauseMusic() {
        this.music.pause()
        this.musicState = musicStateKeys.PAUSED
    }

    stopMusic() {
        this.music.stop()
        this.musicState = musicStateKeys.PAUSED
    }

    // toggleMusic() {
    //     if (this.musicStarted === false) {
    //         this.playMusic()
    //         this.musicPaused = false
    //         this.musicStarted = true
    //         this.countDown(this.music.duration)
    //     }
    //     else if (this.musicPaused === false) {
    //         this.pauseMusic()
    //         this.musicPaused = true
    //     } else {
    //         this.playMusic()
    //         this.musicPaused = false
    //     }
    // }

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
            // console.log("COMBO!!!")
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

