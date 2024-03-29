

export default class Spawner {

    constructor(spawnInterval = 5, objectPool) {
        this.spawnInterval = spawnInterval * 1000 // multiply to get milliseconds
        this.objectPool = objectPool
        this.timeSinceSpawn = 0
    }

    update(deltaTime, playerVelocityX = 0, playerVelocityY = 0) {
        this.timeSinceSpawn += deltaTime * 1000
        //console.log(this.timeSinceSpawn)
        if (this.timeSinceSpawn >= this.spawnInterval) {
            let element = this.objectPool.getElement()
            if (element.data.setInitialPosition) {
                element.data.setInitialPosition()
            }
            if (element.data.setInitialVelocity) {
                element.data.setInitialVelocity()
            }

            // element.data.update()
            this.timeSinceSpawn = 0
        }

        for (let i = 0; i < this.objectPool.poolArray.length; i++) {
            if (!this.objectPool.poolArray[i].free) {
                // if (this.objectPool.poolArray[i].free == false) {

                this.objectPool.poolArray[i].data.update(deltaTime, playerVelocityX, playerVelocityY)
            }
            // }
        }
    }

    draw(context) {

        for (let i = 0; i < this.objectPool.poolArray.length; i++) {
            if (this.objectPool.poolArray[i].free === false) {
                const element = this.objectPool.poolArray[i]
                if (element.data.dx < 500 && element.data.dx > -50 && element.data.dy > -50 && element.data.dy < 275) {
                    element.data.draw(context)
                    // console.log(element)
                }
                else {
                    this.objectPool.releaseElement(element)
                    // console.log('Just released:')
                    // console.log(element)
                }
            }
        }
    }

    getActiveObjects() {
        let numActiveObjects = 0
        for (let e = 0; e < this.objectPool.poolArray.length; e++) {
            if (this.objectPool.poolArray[e].free == false) {
                numActiveObjects = numActiveObjects + 1
            }

        }
        return numActiveObjects
    }

    getFreeObjects() {
        let numFreeObjects = 0
        for (let e = 0; e < this.objectPool.poolArray.length; e++) {
            if (this.objectPool.poolArray[e].free == true) {
                numFreeObjects = numFreeObjects + 1
            }

        }
        return numFreeObjects
    }


}

