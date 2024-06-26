"use strict";

// Import required classes and utility functions
import CollisionDetector from "./collision-detector.js";
import Observable from "./observable.js";
import { gameStateKeys } from "./constants.js";
import { playerStates } from "./player-state.js";
import { GameScene } from "./game-scene.js";
import { typeWriter, animateBlur, getRandomInt } from "./utils.js";
import { Enemy } from "./enemy.js";
import { scene00Config } from "./cfg/scene00.cfg.js";
import { scene01Config } from "./cfg/scene01.cfg.js";

export const musicStateKeys = {
    PAUSED: "paused",
    PLAYING: "playing",
    STOPPED: "stopped",
    READY: "ready"
};


export default class GameWorld extends Observable {
    #gameState;
    #scenes;
    #currentScene;
    #currentRanking;
    #timeRemaining;
    #isNextSceneReady = false;

    // set #deltaTime to 1 to avoid a NaN error when dividing by 0 when starting the game loop
    static #deltaTime = 1;

    constructor(player, ui, input) {
        super();

        this.#currentScene = {
            intervalId: null
        };
        this.#currentRanking = 0;
        this.#gameState = gameStateKeys.TITLE;
        this.#scenes = [];


        this.isReady = false;
        this.player = player;
        this.ui = ui;
        this.input = input;

        if (this.player && this.ui && this.input) {
            this.isReady = true;
        }

        this.#isNextSceneReady = false;

        this.canvas = document.getElementById("game-screen__canvas");
        this.ctx = this.canvas.getContext("2d");

        this.lastTime = 0;
        this.comboCounter = 0;
    }


    // Getter/setter for private #gameState variable
    get gameState() {
        return this.#gameState;
    }

    set gameState(gameState) {
        this.#gameState = gameState;
        this.notify({ gameState: this.#gameState });
    }

    // Getter/setter for private #currentScene variable
    get currentScene() {
        return this.#currentScene;
    }

    set currentScene(scene = null) {
        const sceneIndex = this.player.stats.progress;
        this.#currentScene = this.#scenes[sceneIndex];
        // this.#currentScene = scene
        this.notify({ currentScene: this.#currentScene });
    }

    get scenes() {
        return this.#scenes;
    }

    get currentRanking() {
        return this.#currentRanking;
    }

    set currentRanking(value) {
        this.#currentRanking = value;
        this.notify({ 'current-ranking': this.#currentRanking });
    }

    // Getter for private static #deltaTime variable 
    // (No setter defined, as #deltaTime should only be set by the GameWorld class in the game loop)
    static get deltaTime() {
        return GameWorld.#deltaTime;
    }


    // Method to add scene to game instance
    addScene(gameScene) {
        if (gameScene instanceof GameScene) {
            this.#scenes.push(gameScene);
            console.log(`✔️ ${gameScene.constructor.name} added to scenes array (${gameScene.name})`);
            // console.dir(gameScene)
        } else {
            console.warn("Invalid scene type. Expected GameScene.");
        }
    }

    // 🔁 Here it is. The... MAIN. GAME. LOOP 👾
    loop(timeStamp, scene = this.currentScene) {

        // 💂‍♀️ Guard clauses to exit the loop if any of the conditions are met

        // unless the gameState is "play", we shouldn't run the loop
        if (this.#gameState !== gameStateKeys.PLAY) {
            // console.warn("Game state isn't in play state");
            return;
        }

        // if there is no reference to player, input, or UI
        if (!this.isReady) {
            console.error("Player, input and/or UI not defined for GameWorld");
            return;
        }

        // if currentScene hasn't been declared for some reason
        if (!scene) {
            console.error("No currentScene defined for Gameworld loop");
            return;
        }

        // // if the game is paused, we don't want to run the loop
        // if (this.isPaused) {
        //     return;
        // }

        // if the scene has ended, we should exit the loop
        if (this.isSceneOver) {
            this.endScene();
            console.log("Game scene has ended");
            return;
        }

        // if the music has ended, we should be at the end of the scene, and gameplay should stop
        if (scene.music.currentTime === 0) {
            console.log("Music has ended, scene is over");
            this.endScene();
            return;
        }

        // If the player has died, we don't exit the loop (through return statement), 
        // but we do want to set the player state to trigger animation 
        // and stats changes
        if (!this.player.stats.isAlive) {
            // this.player.stats.isAlive = false
            this.player.setState(playerStates.DEAD);
            // console.log("Player is Dead")
            if (this.currentScene.name === "Beach Sheds") {
                this.isPaused = true;
                this.gameState = gameStateKeys.POPUP;
                this.pauseGame();
                this.runPopup();
            } else {
                this.player.isResetting = false;
                this.resetPlayer();

            }
        }




        // Timekeeping, setting deltaTime with each frame
        GameWorld.#deltaTime = (timeStamp - this.lastTime) / 1000;
        this.lastTime = timeStamp;

        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update the currentScene(includes background layers, player sprite and spawned items)
        scene.update(GameWorld.#deltaTime, this.input);

        // Detect collisions by calling CollisionDetector (using AABB algorithm)
        if (this.player.stats.isAlive === true) {
            this.detectCollisions();
            this.detectProjectileCollisions();
            this.detectPlayerByEnemies();
        }

        // console.log("player.dy = ", this.player.dy)

        // Draw the scene to the canvas
        scene.draw(this.ctx,
            {
                background: true,
                spawners: true,
                player: true
            });

        // requestAnimationFrame to get next frame
        requestAnimationFrame(this.loop.bind(this));


    }

    resetPlayer() {
        // Check if the player is already resetting
        if (!this.player.isResetting) {
            // Use arrow function to keep "this" context
            setTimeout(() => {
                // Make sure "this" refers to the player
                if (this.player && this.player.currentState && typeof this.player.currentState.exit === 'function') {
                    this.player.currentState.exit();
                }
            }, 2000); // Delay the exit call by 2000 ms
            // Set flag indicating that player reset has started
            this.player.isResetting = true;
        }
    }


    detectCollisions() {
        let colliders = this.spawner.getAllSpawnedObjects();
        // console.log(colliders)

        // console.log("colliders: ", colliders.length)
        if (colliders.length !== 0 || colliders !== undefined) {
            colliders.forEach((collider) => {
                const playerInRange = collider.detectPlayer({ 'dx': this.player.dx, 'dy': this.player.dy });
                if (playerInRange) {

                    let collisionObject = CollisionDetector.detectBoxCollision(this.player, collider);
                    if (collisionObject) {
                        // console.log(collisionObject)
                        this.notify(collisionObject);
                    }
                }
            });

        }
    }

    detectPlayerByEnemies() {
        let enemies = this.spawner.getAllEnemies();
        if (enemies.length === 0 || !enemies) {
            // console.log("No enemies detected")
        }
        enemies.forEach((enemy) => {
            if (enemy.detectPlayer({ 'dx': this.player.dx, 'dy': this.player.dy }, 150)) {
                enemy.launchProjectile({ velocityX: 10, velocityY: getRandomInt(100, 300) });
            }
        });
    }

    detectProjectileCollisions() {
        let enemies = this.spawner.getAllEnemies();
        // console.log(enemies)
        if (enemies.length !== 0 || enemies !== undefined) {
            enemies.forEach((enemy) => {
                if (enemy instanceof Enemy) {
                    // enemy.launchProjectile({ velocityX: 0, velocityY: getRandomInt(50, 300) })
                    // console.dir(enemy.projectile)
                    let collisionProjectileObject = CollisionDetector.detectBoxCollision(this.player, enemy.projectile);
                    // if (collisionProjectileObject) console.dir(collisionProjectileObject)
                    if (collisionProjectileObject) {
                        this.notify(collisionProjectileObject);
                    }
                }
            });
        }
    }

    startGame = () => {

        // console.log(player.stats)
        // console.log(this.ui)

        // scene01.layers[0].filter = "none"


        // this.initScene()

        this.gameState = gameStateKeys.INTRO;
        // this.ui.showUI(this.gameState)

        const superNantendo = document.getElementById("ui--super-nantendo");
        superNantendo.classList.add("teal-bg");
        // canvas.classList.remove("hidden")

        this.currentScene = this.scenes[0];
        this.runIntro();


        // console.log(this.currentScene)

    };








    stopGame() {
        console.log("game has stopped");
    }


    pauseGame() {
        if (this.isPaused) {
            // console.log(this.gameState)
            this.pauseMusic();
            switch (this.#gameState) {
                case gameStateKeys.PAUSED_BY_PLAYER:
                    this.ui.toggleUI("paused");
                    break;
                case gameStateKeys.LEVEL_END:
                    this.ui.toggleUI("level-end");
                    break;
                default:
                    console.warn("No UI defined for gamestate: " + this.#gameState);
            }



        }
        else {
            this.gameState = gameStateKeys.PLAY;
            this.ui.toggleUI("play");
            // this.music.currentTime = this.musicPausedTime

            this.playMusic();
            this.loop(this.lastTime);
            this.isPaused = false;
        }
    }


    endScene() {
        // Clear the interval timers for the scene and goals
        clearInterval(this.goalCheckIntervalId);
        clearInterval(this.sceneTimeIntervalId);
        clearInterval(this.#currentScene.intervalId);

        // reset the spawner
        this.spawner.reset();


        // Set gameState to SCENE_END and SceneOver flag to true
        this.isSceneOver = true;
        this.gameState = gameStateKeys.SCENE_END;

        // set isPaused flag to true and pause the game
        this.isPaused = true;
        this.pauseGame();


        this.player.stats.progress += 1;
        console.log("winner winner chicken dinner");
        // console.log("player progress after set: " + this.player.stats.progress)

        this.loadScene(scene01Config);
        const currentSceneIndex = this.player.stats.progress;
        this.currentScene = this.#scenes[currentSceneIndex];




        // this.ui.showUI(this.gameState)
        // const sceneEndContainer = document.getElementById("scene-end--container")
        // sceneEndContainer.className = ''
        this.ui.showUI(gameStateKeys.SCENE_END);

        // window and chicken animations
        const sceneEndContainerDIV = this.ui.elements.sceneEndContainer.querySelector("div");
        setTimeout(() => { sceneEndContainerDIV.style.transform = "translateY(0px)"; }, 50);
        setTimeout(() => { this.ui.elements.excitedChicken.style.transform = "rotate(-15deg) translate(0px,50px) scale(100%)"; }, 50);

        // Display level stats
        document.getElementById("scene-wieners").textContent = this.player.stats.wienersCollected;
        document.getElementById("scene-score").textContent = this.player.stats.score;
        document.getElementById("scene-blessings").textContent = this.player.stats.seagullBlessingsReceived;


        document.getElementById("next-scene-button").addEventListener("click", (e) => {

            this.startScene();


        });

        document.getElementById("goto-shop-button").addEventListener("click", (e) => {

            this.runShop();


        });


    }

    initSceneGoals() {

        // console.log(this.currentScene.goals.gold)
        this.sceneGoals = {};

        // Check if the goals property exists and is not undefined
        if (this.currentScene.goals && Object.keys(this.currentScene.goals).length > 0) {
            // Iterate over the entries of the goals object
            Object.entries(this.currentScene.goals).forEach(([key, value]) => {
                // console.log(key, value)
                this.sceneGoals[key] = value;
                // console.log("✔️ Scene goals are set")

            });
        } else {
            // If goals is undefined or has no keys, it's considered empty
            console.warn("Scene has no goals or goals property is undefined");
        }
        // console.log(this.sceneGoals)
    }

    // if (this.currentScene.goals.bronze.type === "score") {
    //     this.scoreGoal = this.currentScene.goals.bronze.value
    //     console.log(this.scoreGoal)
    // }


    initSceneEvents() {
        const spriteLayer = this.currentScene && this.currentScene.spriteLayer;
        if (!spriteLayer) {
            console.error('Sprite layer is not defined.');
            return;
        }

        const { eventTimeline } = spriteLayer;
        if (eventTimeline) {
            eventTimeline.forEach((event) => {
                try {
                    setTimeout(() => {
                        this.spawner.startSpawningObjects(
                            event.objectType,
                            event.objectId,
                            event.totalSpawnCount,
                            event.spawningDuration,
                            event.resetConfig
                        );
                    }, event.startTime * 1000);

                } catch (error) {
                    console.error(`Error during event processing: ${error.message}`);
                }
            });
        }
    }

    initScene() {
        this.initSceneGoals();
        this.initSceneEvents();
    }


    playMusic() {
        this.music.play();
        // console.log(`this.music.play  = ${this.music.play}`);
        this.musicState = musicStateKeys.PLAYING;
    }

    pauseMusic() {
        // console.log(`window.audioContext: ${window.audioContext}`);
        if (this.music && !this.music.paused) {
            this.music.pause();
            this.musicState = musicStateKeys.PAUSED;
        }
    }

    stopMusic() {
        this.music.stop();
        this.musicState = musicStateKeys.PAUSED;
    }



    // Method to load and ready scene and add to GameWorld instance
    loadScene(sceneConfig) {
        try {
            // sceneConfig imported from cfg directory
            const scene = new GameScene(sceneConfig, this.player);

            // Add scene to game instance
            this.addScene(scene);

            // Ensure spriteLayer exists before adding spawner
            if (scene.spriteLayer) {
                scene.spriteLayer.spawner = this.spawner;
            } else {
                console.error("spriteLayer does not exist on the scene object");
            }

            // set nextSceneReady flag to true, log to console
            this.#isNextSceneReady = true;
            console.log(`✅ %cScene is loaded and ready: ${scene.name}`, `color: green;`);
        } catch (error) {
            console.error("Could not load next scene", error);
        }
    }



    startScene = (scene = this.currentScene) => {

        // if (scene === undefined) scene = this.currentScene
        // console.log(this)
        // console.log(this.currentScene)
        // TODO: fix, temporarily running scene1 first
        this.isSceneOver = false;
        // console.log(scene)
        // this.loadScene(scene01Config)

        // console.log(`ℹ️ %ccurrent scene is: ${this.currentScene.name}`, `color:blue;`)
        this.initSceneGoals();
        this.initSceneEvents();
        // console.log(this.currentScene)
        this.player.setBounds(scene.spriteLayer.playerBounds);
        // console.log(scene.playerBounds)
        // this.player.bounds = scene.playerBounds

        const playMusic = () => {
            if (scene.hasOwnProperty("music")) {

                if (scene.isMusicLoaded) {
                    this.music = scene.music;

                    // Add the ability to adjust volume to the slider
                    const musicVolumeSlider = this.ui.elements.musicRange;
                    const musicElement = this.music;
                    // console.log(scene.isMusicLoaded)
                    musicVolumeSlider.addEventListener("input", (e) => {
                        const volumeValue = e.target.value;
                        musicElement.volume = volumeValue / 100;
                    });

                    // Start playing music
                    scene.music.play();



                }
            }
        };

        const placesPlayer = () => {
            this.player.stats.score = 0;
            this.player.stats.healthMax = 100;
            this.player.stats.health = 100;
            this.player.stats.wienersCollected = 0;
            this.player.stats.isAlive = true;
            this.currentRanking = null;
            this.player.stats.scoreKeeper.comboCounter = 0;

        };

        const curtainUp = () => {
            this.gameState = gameStateKeys.PLAY;
            this.ui.showUI(this.gameState);
            this.isPaused = false;
            this.loop(0);
        };

        const checkGoal = () => {

            if (!this.isSceneOver) {
                if ((this.player.stats.score >= this.sceneGoals.bronze.value) && (this.currentRanking < 1)) {
                    // console.log(`%cYou won! ⭐️`, `color:orange`);
                    this.currentRanking++;
                    this.notify({ 'current-ranking': '⭐️' });
                } else if ((this.player.stats.score >= this.sceneGoals.silver.value) && (this.currentRanking === 1)) {
                    // console.log(`%cYou won! ⭐️⭐️`, `color:orange`);
                    this.currentRanking++;
                    this.notify({ 'current-ranking': '⭐️⭐️' });
                } else if ((this.player.stats.score >= this.sceneGoals.gold.value) && (this.currentRanking === 2)) {
                    // console.log(`%cYou won! ⭐️⭐️⭐️`, `color: orange`);
                    this.currentRanking++;
                    this.notify({ 'current-ranking': '⭐️⭐️⭐️' });
                }
            }
        };


        const notifyTimeRemaining = () => {
            // console.log("running notifyTimeRemaining")
            if (this.music !== undefined) {
                this.#timeRemaining = this.music.duration - this.music.currentTime;
                this.notify({ "time-remaining": Math.floor(this.#timeRemaining) });
                if (this.#timeRemaining <= 0) {
                    console.log("Out of Time ⌛️");
                    clearInterval(this.sceneTimeIntervalId);
                    clearInterval(this.goalCheckIntervalId);
                    this.gameState = gameStateKeys.SCENE_END;
                    this.isPaused = true;
                    this.pauseGame();
                    this.endScene();
                }

            }
            // console.log(`time remaining: ${Math.floor(this.#timeRemaining)}`)
        };


        // Check for goal every 0.5 seconds
        this.goalCheckIntervalId = setInterval(checkGoal, 500);

        // Send observers the time remaining every 1s
        this.sceneTimeIntervalId = setInterval(notifyTimeRemaining, 1000);


        // console.log(`ℹ️ %cplayer progress is ${this.player.stats.progress}`, `color:blue`)

        // Call the functions in the desired order

        setTimeout(placesPlayer, 1000);
        setTimeout(playMusic, 500);
        setTimeout(curtainUp, 1000);
    };

    runGameOver() {
        this.ui.toggle("gameover");
    }

    runPopup() {

        this.ui.showUI("cutscene");



        this.ui.hide(this.ui.elements.titleScreen);
        this.ui.hide(this.ui.elements.shopScreen);
        this.ui.show(this.ui.elements.popupScreen);
        this.ui.show(this.ui.elements.popupTibbo);


        setTimeout(() => { this.ui.elements.popupDialog.style.transform = "translateY(0)"; }, 500);
        setTimeout(() => { this.ui.elements.popupTibbo.style.transform = "translateY(0px)"; }, 700);

        this.currentScene.draw(this.ctx,
            {
                background: false,
                spawners: true,
                player: true
            });
        setTimeout(() => { animateBlur(this.currentScene, this.ctx, 0.5, 2, 0.2); }, 1000);
        const dialogText = document.querySelector('#popup-dialog div').textContent;
        typeWriter('popup-dialog', dialogText, 25);
        // console.log("player.stats.isAlive: " + this.player.stats.isAlive)


        document.getElementById("popup-dialog").addEventListener("pointerdown", () => {
            const rainGearPrice = this.player.stats.totalScore + this.player.stats.scoreKeeper.currentScore;
            console.log(rainGearPrice);
            let dialogText = `Looks like you could use that rain gear. I can sell it to you for ${rainGearPrice} points.`;
            typeWriter('popup-dialog', dialogText, 25);
            this.player.altAppearance = true;


            setTimeout(() => { this.ui.elements.popupDialog.style.transform = "translateY(400px)"; }, 500);
            setTimeout(() => { this.ui.elements.popupTibbo.style.transform = "translateY(475px)"; }, 700);
            setTimeout(() => { animateBlur(this.currentScene, this.ctx, 0, 0, 0.1); }, 1000);
            setTimeout(() => {
                this.startScene();
                this.player.stats.hasBuff = true;
                this.player.startNewLife();

            }, 2500);
        }, { once: true });

    }

    runIntro() {
        // console.log("in runIntro")
        // console.log(this.ui)
        this.setState = gameStateKeys.INTRO;
        // console.log(this.player.stats)



        // console.dir(this.currentScene)

        this.ui.showUI("intro");
        // this.ui.showUI(this.gameState)
        // this.ui.showUI(this.gameState)



        // this.ui.hide(this.ui.elements.titleScreen)
        // this.ui.hide(this.ui.elements.shopScreen)
        // this.ui.show(this.ui.elements.introScreen)

        // this.ui.show(this.ui.elements.popupNan)
        setTimeout(() => { this.ui.elements.introDialog.style.transform = "translateY(0)"; }, 500);
        setTimeout(() => { this.ui.elements.popupNan.style.transform = "translateY(0px)"; }, 700);

        this.loadScene(scene00Config);


        // TODO: temporary disable to test scene01
        const currentSceneIndex = this.player.stats.progress;
        this.currentScene = this.#scenes[currentSceneIndex];
        this.currentScene = this.#scenes[0];

        this.currentScene.draw(this.ctx,
            {
                background: false,
                spawners: true,
                player: true
            });

        setTimeout(() => { animateBlur(this.currentScene, this.ctx, 0.5, 2, 0.2); }, 1000);
        // const dialogText = document.querySelector('#intro-dialog div').textContent
        // typeWriter('intro-dialog', dialogText, 25)
        // console.log("player.stats.isAlive: " + this.player.stats.isAlive)

        document.getElementById("intro-screen").addEventListener("pointerdown", () => {
            this.endIntro();
            // setTimeout(() => { this.ui.elements.introDialog.style.transform = "translateY(300px)"; }, 500);
            // setTimeout(() => { this.ui.elements.popupNan.style.transform = "translateY(475px)"; }, 700);
            // setTimeout(animateBlur(this.currentScene, this.ctx, 0, 0, 0.1), 1000);
            // setTimeout(this.startScene(this.scenes[0]), 1300);
        }, { once: true });
    }

    endIntro() {
        setTimeout(() => { this.ui.elements.introDialog.style.transform = "translateY(300px)"; }, 500);
        setTimeout(() => { this.ui.elements.popupNan.style.transform = "translateY(475px)"; }, 700);
        setTimeout(animateBlur(this.currentScene, this.ctx, 0, 0, 0.1), 1000);
        setTimeout(this.startScene(this.scenes[0]), 1300);
    }



    receiveUpdate(data) {
        // console.log("gameworld received :", data)
    }



}

