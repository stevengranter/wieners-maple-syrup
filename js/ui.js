"use strict"

import { toCamelCase } from "./utils.js"
export default class UI {
    constructor(dataAttributes, player) {
        this.init(dataAttributes)
        this.elements = this.uiElements // FIX: for older code that references elements property
        this.toggleUI = this.showUI
    }




    init(dataAttributes) {
        dataAttributes.forEach((attribute) => {
            // console.log(attribute)

            let uiDOMElements = document.querySelectorAll(`[${attribute}="true"]`)

            let elements = new Object()
            for (let i = 0; i < uiDOMElements.length; i++) {
                let currentElement = uiDOMElements[i]
                let elementKey = currentElement.id
                let camelCaseKey = toCamelCase(elementKey)
                elements[camelCaseKey] = currentElement

            }

            // console.log(elements)
            // console.log(typeof elements)
            let propertyName = this.convertDataAttribute(attribute)
            this[propertyName] = elements
            // console.log(this)
            return elements

        })

    }

    update() {

    }


    receiveUpdate(data, sender) {
        // console.log("ui received:")
        // console.dir(data)
        // console.log(data)
        // Checking for undefined here instead of falsey values, as we want to 
        // still update if the value is equal to 0
        if (data.comboCounter !== undefined) {
            this.updateComboDisplay(data)
        } else if (data.score !== undefined) {
            this.updateTextContent("score", data.score)
        } else if ((data.health !== undefined) && (sender === "Stats")) {
            this.updateStyleAttribute("health", "width", data.health + "%")
            this.updateStyleAttribute("health", "backgroundColor", this.numberToColorVar(data.health))
        } else if (data["time-remaining"]) {
            this.updateTextContent("time-remaining", data['time-remaining'])
        } else if (data.lives !== undefined) {
            this.updateTextContent("lives", data.lives)
        } else if (data["current-ranking"] !== undefined) {
            this.updateTextContent("current-ranking", data["current-ranking"])
            // this.show(this.elements.banner)
            // this.updateTextContent("banner", data["current-ranking"])
            // setTimeout(() => {
            //     this.hide(this.elements.banner)
            // }, 2000)
        } else if (data['game-state'] !== undefined) {
            console.log(data['game-state'])
            this.hide(this.elements.titleScreen)
            this.show(this.elements.introScreen)
            // this.toggleUI(data['game-state'], true)
        }
    }

    numberToColorVar(number) {
        if (number <= 100 && number >= 50) {
            return "var(--clr-green)"
        }
        else if (number < 50 && number >= 25) {
            return "var(--clr-orange)"
        } else {
            return "var(--clr-red)"
        }
    }

    updateTextContent(elementId, value) {
        // console.log(elementId, value)
        document.getElementById(elementId).textContent = value
    }

    updateStyleAttribute(elementId, styleAttribute, value) {
        document.getElementById(elementId).style[styleAttribute] = value
    }


    updateComboDisplay(data) {
        if (data.comboCounter > 0 && data.comboCounter <= 5) {
            for (let i = 1; i <= data.comboCounter; i++) {
                let nthChildSelector = `:nth-child(${i})`
                let nthChildSelectorString = nthChildSelector.toString()
                // console.log(nthChildSelectorString)
                let letter = this.elements.hudCombo.querySelector(nthChildSelectorString)
                // console.dir(letter)
                letter.style.color = "var(--clr-sky-blue)"
                letter.style.opacity = "100%"
            }
        } else if (data.comboCounter > 5 && data.comboCounter <= 10) {
            for (let i = 6; i <= data.comboCounter; i++) {
                let nthChildSelectorIndex = i - 5
                let nthChildSelector = `:nth-child(${nthChildSelectorIndex})`
                let nthChildSelectorString = nthChildSelector.toString()
                // console.log(nthChildSelectorString)
                let letter = this.elements.hudCombo.querySelector(nthChildSelectorString)
                // console.dir(letter)
                letter.style.color = "var(--clr-purple)"
                letter.style.opacity = "100%"
            }
        } else if (data.comboCounter <= 0) {
            // console.log("combo counter UI should reset")
            let letters = this.elements.hudCombo.querySelectorAll("span")
            letters.forEach((letter) => {
                letter.style.color = ""
                letter.style.opacity = "50%"
            })
        }
    }




    convertDataAttribute(attribute) {
        // Remove 'data-' prefix and split the remaining string by '-'
        let parts = attribute.replace('data-', '').split('-')

        // Capitalize the first letter of each part after the first one
        for (let i = 1; i < parts.length; i++) {
            parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1)
        }

        // Join all parts together and append '-elements' at the end
        return parts.join('') + 'Elements'
    }

    // public: set element to show by setting visibility and display properties
    showElement(element) {
        // element.style.visibility = "show"
        element.style.display = ""
        element.classList.remove("hidden")
        element.style.pointerEvents = "auto" // TODO: 
    }

    // public: set element to hide by setting visibility and display properties
    hideElement(element) {
        // element.style.visibility = "hidden"
        // element.classList = "hidden"
        element.style.display = "none"
        element.style.pointerEvents = "none" // TODO: 

    }

    // public: Shows UI by state argument passed to function, 
    // first calls hideUI() to hide all elements that do *not* have that state
    showUI(state) {
        this.hideUI(state)
        const elements = document.querySelectorAll(`[data-gamestate~="${state}"]`)
        elements.forEach((element) => {
            this.showElement(element)
        })

    }

    // private: Hides UI elements that do not have the state passed
    // viu the argument by iterating over all data-gamestate elements
    // and filtering 
    hideUI(state) {
        // select all elements that have the data-gamestate attribute
        const allElements = document.querySelectorAll('[data-gamestate]')
        // Filter out elements that include state arg in their data-gamestate attribute
        const filteredElements = Array.from(allElements).filter(element => {
            const gameStates = element.getAttribute('data-gamestate').split(' ')
            return !gameStates.includes(state)
        })

        filteredElements.forEach((element) => {
            this.hideElement(element)
        })
    }


    // show(element) {
    //     element.style.display = "block"
    //     element.style.visibility = "visible"
    //     element.classList.remove("hidden")
    //     element.classList.add("block")
    // }

    // hide(element) {
    //     element.style.display = "none"
    //     element.style.visibility = "hidden"
    //     element.classList.add("hidden")
    //     element.classList.remove("block")
    // }

    toggleUI(gameState, isActive = true) {
        for (let key in this.elements) {
            let element = this.elements[key]
            if (element.dataset !== undefined) {
                if (element.dataset.gamestate !== undefined) {
                    const gameStateArray = element.dataset.gamestate.split(' ')
                    // console.log(gameStateArray)
                    if (gameStateArray.includes(gameState) && isActive === true) {
                        // console.log("now showing: ", element.id)

                        this.show(element)
                        element.style = "pointer-events:auto" // TODO: 

                    } else {
                        // console.log("now hiding: ", element.id)
                        this.hide(element)
                        element.style = "pointer-events:none" // TODO: 

                    }
                }
            }
        }
    }





}

