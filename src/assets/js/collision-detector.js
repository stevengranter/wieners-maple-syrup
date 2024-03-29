
export default class CollisionDetector {

  constructor() { }

  detectBoxCollision(subject, objectsArray) {
    // console.log(subject)

    for (let i = 0; i < objectsArray.length; i++) {
      let object = objectsArray[i].data
      if (
        subject.dx + subject.dWidth >= object.dx &&
        subject.dx <= object.dx + object.dWidth &&
        subject.dy + subject.dHeight >= object.dy &&
        subject.dy <= object.dy + object.dHeight
      ) {
        if (!object.isScored) {
          let scoreObject = {}
          // console.dir(object)
          scoreObject.healthValue = object.healthValue
          scoreObject.pointValue = object.pointValue
          object.isScored = true
          object.isVisible = false
          return object
        } else {
          return false
        }

      }



    }


  }
}
