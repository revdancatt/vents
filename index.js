/* global preloadImagesTmr fxhash fxrand fxpreview palettes */

//
//  fxhash - Vents
//
//
//  HELLO!! Code is copyright revdancatt (that's me), so no sneaky using it for your
//  NFT projects.
//  But please feel free to unpick it, and ask me questions. A quick note, this is written
//  as an artist, which is a slightly different (and more storytelling way) of writing
//  code, than if this was an engineering project. I've tried to keep it somewhat readable
//  rather than doing clever shortcuts, that are cool, but harder for people to understand.
//
//  You can find me at...
//  https://twitter.com/revdancatt
//  https://instagram.com/revdancatt
//  https://youtube.com/revdancatt
//

const ratio = 1
// const startTime = new Date().getTime() // so we can figure out how long since the scene started
let drawn = false
let highRes = false // display high or low res
const features = {}
let resizeTmr = null
let thumbnailTaken = false

window.$fxhashFeatures = {}

const hexToRgb = (hex) => {
  const result = /([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  }
}

const rgbToHsl = (rgb) => {
  rgb.r /= 255
  rgb.g /= 255
  rgb.b /= 255
  const max = Math.max(rgb.r, rgb.g, rgb.b)
  const min = Math.min(rgb.r, rgb.g, rgb.b)
  let h
  let s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rgb.r:
        h = (rgb.g - rgb.b) / d + (rgb.g < rgb.b ? 6 : 0)
        break
      case rgb.g:
        h = (rgb.b - rgb.r) / d + 2
        break
      case rgb.b:
        h = (rgb.r - rgb.g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100
  }
}

const decideThings = (index) => {
  const tileColour1 = features.palette.colors[Math.floor(fxrand() * features.palette.colors.length)]
  let tileColour2 = features.palette.colors[Math.floor(fxrand() * features.palette.colors.length)]
  while (tileColour2 === tileColour1) {
    tileColour2 = features.palette.colors[Math.floor(fxrand() * features.palette.colors.length)]
  }

  // Now put the tile in, with the draw and colour
  features.tileMap[index].drawMe = true
  features.tileMap[index].ventType = 'none'
  features.tileMap[index].borderSize = 0.2
  features.tileMap[index].tileColour1 = tileColour1
  features.tileMap[index].tileColour2 = tileColour2

  if (features.layoutMode === 'Random') {
    // Now we need to figure out if we are going to put a vent in this tile
    if (fxrand() < features.placementChance) {
      // We are going to place a vent
      if (fxrand() < features.innyChance) {
        // We are going to place an inny
        features.tileMap[index].ventType = 'in'
      } else {
        // We are going to place an outy
        features.tileMap[index].ventType = 'out'
      }
    }
  }
  // If we're all in...
  if (features.layoutMode === 'All In Everywhere All At Once') features.tileMap[index].ventType = 'in'
  // If we're all out...
  if (features.layoutMode === 'All Out Everywhere All At Once') features.tileMap[index].ventType = 'out'

  // If we're in a pattern then work out what to do
  if (features.layoutMode === 'Pattern') {
    // if it's a checkerboard pattern, then we need to do that
    if (features.pattern === 'Checkerboard') {
      const x = parseInt(index.split(',')[0], 10) / 4
      const y = parseInt(index.split(',')[1], 10) / 4
      let isChecked = false
      // Now work out if we are on an even or odd column
      if (parseInt(x, 10) % 2 === 0) isChecked = true
      // Now work out if we are on an even or odd row
      if (parseInt(y, 10) % 2 === 0) isChecked = !isChecked
      // If startOnZero then we need to flip the check
      if (features.startOnZero) isChecked = !isChecked

      // Based on the subPattern we need to do different things
      if (features.subPattern === 'Inny') if (isChecked) features.tileMap[index].ventType = 'in'
      if (features.subPattern === 'Outy') if (isChecked) features.tileMap[index].ventType = 'out'
      if (features.subPattern === 'Flip') {
        if (isChecked) {
          features.tileMap[index].ventType = 'in'
        } else {
          features.tileMap[index].ventType = 'out'
        }
      }
    }
  }
  // Work out the size of the border if needed
  if (features.borderSize === 'Large') features.tileMap[index].borderSize = 0.33
  if (features.borderSize === 'Small') features.tileMap[index].borderSize = 0.1
  if (features.borderSize === 'Tiny') features.tileMap[index].borderSize = 0.05
  if (features.borderSize === 'None') features.tileMap[index].borderSize = 0.0
  if (features.borderSize === 'Random') features.tileMap[index].borderSize = fxrand() * (0.33 - 0.05) + 0.05

  // If the out vent would overlap the one below too much, then we flip it to be in
  if (features.tileMap[index].borderSize < 0.1 && features.tileMap[index].ventType === 'out') {
    features.tileMap[index].ventType = 'in'
  }
}

//  Work out what all our features are
const makeFeatures = () => {
  // Pick a random number of tiles between 3 and 6
  features.tiles = Math.floor(fxrand() * 6) + 2
  features.scaleDown = features.tiles * 2 / (features.tiles * 2 + 1)
  features.layoutMode = 'Random'
  features.placementChance = 0
  features.innyChance = 0.5
  features.firstDivisionChance = 0.1
  features.secondDivisionChance = 0.1

  if (fxrand() < 0.20) features.layoutMode = 'Pattern'

  // If the layout mode is Pattern, then we need to work out what pattern we're going to use
  if (features.layoutMode === 'Pattern') {
    // There is a chance it's checkerboard
    if (fxrand() < 0.999) {
      features.pattern = 'Checkerboard'
      // What type of checkerboard?
      features.subPattern = 'Flip'
      if (fxrand() < 0.75) {
        features.subPattern = 'Inny'
        if (fxrand() < 0.5) features.subPattern = 'Outy'
      }
      // Do we start on the first or second tile?
      features.startOnZero = fxrand() < 0.5
      // If it's checkerboard, then we want to make sure there's no divisions
      features.firstDivisionChance = 0
    }
  }

  // The vent has a size
  features.borderSize = 'Normal'
  // Most of the time the vent size is normal, but sometimes we'll do something different
  if (fxrand() < 0.5) {
    // There's a chance we make the border smaller
    if (fxrand() < 0.2) {
      features.borderSize = 'Small'
      if (fxrand() < 0.66) {
        if (fxrand() < 0.5) {
          features.borderSize = 'Tiny'
        } else {
          features.borderSize = 'None'
        }
      }
    } else {
      features.borderSize = 'Large'
    }
    // After all that, there's still a 10% chance we'll make it random
    if (fxrand() < 0.1 && features.layoutMode !== 'Pattern') features.borderSize = 'Random'
  }

  // If we are random, there's a small chance we'll do something different
  if (fxrand() > 0.8) {
    // It could be the everything everywhere thing
    if (fxrand() > 0.0) {
      // Either all in or all out
      if (fxrand() > 0.5) {
        features.layoutMode = 'All In Everywhere All At Once'
      } else {
        features.layoutMode = 'All Out Everywhere All At Once'
      }
    }
  }

  if (features.layoutMode === 'Random') {
    // Pick the chance of something being placed
    features.placementChance = fxrand() * 0.6 + 0.2
    // And now the chance it'll be an "inny" or an "outy"
    features.innyChance = fxrand() * 0.8 + 0.1
    // There is a 10% chance we'll make them either all in or all out
    if (fxrand() < 0.1) {
      features.innyChance = 0
      if (fxrand() < 0.5) features.innyChance = 1
    }
  }

  // The final grid map will be 4x the number of tiles
  features.tileMap = {}
  // Grab a random palette
  features.palette = palettes[Math.floor(fxrand() * palettes.length)]
  // Loop through y and x for the number of tiles
  for (let y = 0; y < features.tiles; y++) {
    for (let x = 0; x < features.tiles; x++) {
      const level = 0
      const tileSize = 4
      // We can do recursion, but it's a pain in the ass to debug, so we are going to do this
      // in a gnarly long way
      // Put the current level into the tileMap, to do this we loop from the x, y multiplied by the tileSize
      // these are ones we don't draw, but I do want to keep track of the level
      for (let level0y = y * tileSize; level0y < y * tileSize + tileSize; level0y++) {
        for (let level0x = x * tileSize; level0x < x * tileSize + tileSize; level0x++) {
          features.tileMap[`${level0x},${level0y}`] = {
            level,
            drawMe: false
          }
        }
      }

      // Decide if we are going to split this tile up, if not just make a good solid tile
      if (fxrand() > features.firstDivisionChance) {
        // Don't split the tile
        const index = `${x * tileSize},${y * tileSize}`
        features.tileMap[index].tileSize = 4
        decideThings(index)
      } else {
        // Split the tile
        for (let stepy = 0; stepy <= 2; stepy += 2) {
          for (let stepx = 0; stepx <= 2; stepx += 2) {
            // But we may split it even more
            if (fxrand() > features.secondDivisionChance) {
              const index = `${x * tileSize + stepx},${y * tileSize + stepy}`
              features.tileMap[index].tileSize = 2
              decideThings(index)
            } else {
              // Split it even more
              for (let stepy2 = 0; stepy2 <= 1; stepy2++) {
                for (let stepx2 = 0; stepx2 <= 1; stepx2++) {
                  const index = `${x * tileSize + stepx + stepx2},${y * tileSize + stepy + stepy2}`
                  features.tileMap[index].tileSize = 1
                  decideThings(index)
                }
              }
            }
          }
        }
      }
    }
  }

  // Sometimes we just show the wireframe
  features.showWireframe = fxrand() < 0.05
  // And we want to store randomness to use for the wireframes
  features.wireframeRandomness = []
  for (let i = 0; i < 500000; i++) features.wireframeRandomness.push(fxrand() - 0.5)

  // Sometimes we show noise
  features.showNoise = fxrand() < 0.5
  // We want 10,000 random points
  features.noisePoints = []
  for (let i = 0; i < 500000; i++) {
    features.noisePoints.push({
      x: fxrand(),
      y: fxrand(),
      shade: fxrand() < 0.5 ? 255 : 0
    })
  }
}

//  Call the above make features, so we'll have the window.$fxhashFeatures available
//  for fxhash
makeFeatures()
const copyFeatures = JSON.parse(JSON.stringify(features))
delete copyFeatures.tileMap
delete copyFeatures.noisePoints
console.table(copyFeatures)

const init = async () => {
  //  I should add a timer to this, but really how often to people who aren't
  //  the developer resize stuff all the time. Stick it in a digital frame and
  //  have done with it!
  window.addEventListener('resize', async () => {
    //  If we do resize though, work out the new size...
    clearTimeout(resizeTmr)
    resizeTmr = setTimeout(async () => {
      await layoutCanvas()
    }, 100)
  })

  //  Now layout the canvas
  await layoutCanvas()
}

const layoutCanvas = async () => {
  const wWidth = window.innerWidth
  const wHeight = window.innerHeight
  let cWidth = wWidth
  let cHeight = cWidth * ratio
  if (cHeight > wHeight) {
    cHeight = wHeight
    cWidth = wHeight / ratio
  }
  const canvas = document.getElementById('target')
  if (highRes) {
    canvas.height = 8192
    canvas.width = 8192 / ratio
  } else {
    canvas.width = Math.min((8192 / 2), cWidth * 2)
    canvas.height = Math.min((8192 / ratio / 2), cHeight * 2)
    //  Minimum size to be half of the high rez cersion
    if (Math.min(canvas.width, canvas.height) < 8192 / 2) {
      if (canvas.width < canvas.height) {
        canvas.height = 8192 / 2
        canvas.width = 8192 / 2 / ratio
      } else {
        canvas.width = 8192 / 2
        canvas.height = 8192 / 2 / ratio
      }
    }
  }

  // Round the canvas size to take into account the number of tiles
  const roundingValue = features.tiles * 4 * 100 / features.scaleDown
  canvas.width = Math.floor(canvas.width / roundingValue) * roundingValue
  canvas.height = Math.floor(canvas.height / roundingValue) * roundingValue

  canvas.style.position = 'absolute'
  canvas.style.width = `${cWidth}px`
  canvas.style.height = `${cHeight}px`
  canvas.style.left = `${(wWidth - cWidth) / 2}px`
  canvas.style.top = `${(wHeight - cHeight) / 2}px`

  //  And draw it!!
  drawCanvas()
}

const drawCanvas = async () => {
  //  Let the preloader know that we've hit this function at least once
  drawn = true

  // Grab all the canvas stuff
  const canvas = document.getElementById('target')
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = '#ECE3D0'
  ctx.fillRect(0, 0, w, h)

  ctx.lineWidth = w / (500 * features.tiles)

  // const maxMiniTiles = features.tiles * 4
  const miniTileWidth = w / (features.tiles * 4)
  const miniTileHeight = h / (features.tiles * 4)

  ctx.save()
  ctx.scale(features.scaleDown, features.scaleDown)
  ctx.translate(w / features.tiles / 4, h / features.tiles / 4)
  let wireframeRandomPointer = 0
  const wireframeLoop = 5
  const wMod = features.tiles * 40

  // Now we need to loop through the tileMap and draw the tiles
  for (let y = features.tiles * 4 - 1; y >= 0; y--) {
    for (let x = features.tiles * 4 - 1; x >= 0; x--) {
      const thisTile = features.tileMap[`${x},${y}`]
      if (thisTile.drawMe) {
        // Work out the four corners of the tile
        const corners = {
          tl: {
            x: x * miniTileWidth,
            y: y * miniTileHeight
          }
        }
        corners.tr = {
          x: corners.tl.x + (thisTile.tileSize * miniTileWidth),
          y: corners.tl.y
        }
        corners.bl = {
          x: corners.tl.x,
          y: corners.tl.y + (thisTile.tileSize * miniTileHeight)
        }
        corners.br = {
          x: corners.tl.x + (thisTile.tileSize * miniTileWidth),
          y: corners.tl.y + (thisTile.tileSize * miniTileHeight)
        }

        // Now work out the positions of the inner corners
        // First we need to define the border size as a percent, let's say 25%
        const innerCorners = {
          tl: {
            x: corners.tl.x + ((corners.tr.x - corners.tl.x) * thisTile.borderSize),
            y: corners.tl.y + ((corners.bl.y - corners.tl.y) * thisTile.borderSize)
          },
          tr: {
            x: corners.tr.x - ((corners.tr.x - corners.tl.x) * thisTile.borderSize),
            y: corners.tr.y + ((corners.br.y - corners.tr.y) * thisTile.borderSize)
          },
          bl: {
            x: corners.bl.x + ((corners.br.x - corners.bl.x) * thisTile.borderSize),
            y: corners.bl.y - ((corners.bl.y - corners.tl.y) * thisTile.borderSize)
          },
          br: {
            x: corners.br.x - ((corners.br.x - corners.bl.x) * thisTile.borderSize),
            y: corners.br.y - ((corners.br.y - corners.tr.y) * thisTile.borderSize)
          }
        }

        // Now we want the shadow, we need to set how wide that will be, as a percentage of the tile
        const shadowWidth = 0.1
        const shadownDownSize = (innerCorners.bl.y - innerCorners.tl.y) * shadowWidth
        const shadowAcrossSize = (innerCorners.tr.x - innerCorners.tl.x) * shadowWidth * 2

        // We are going to create a gradient from the top left corner to the bottom left corner
        // from tileColour1 to tileColour2
        const gradient = ctx.createLinearGradient(corners.tl.x, corners.tl.y, corners.tl.x, corners.bl.y)
        gradient.addColorStop(0, thisTile.tileColour1.value)
        gradient.addColorStop(1, thisTile.tileColour2.value)
        ctx.fillStyle = gradient
        ctx.strokeStyle = gradient
        if (features.showWireframe) {
          ctx.beginPath()
          for (let i = 0; i < wireframeLoop; i++) {
            ctx.moveTo(corners.tl.x + (features.wireframeRandomness[wireframeRandomPointer + 0] * w / wMod), corners.tl.y + (features.wireframeRandomness[wireframeRandomPointer + 1] * w / wMod))
            ctx.lineTo(corners.tr.x + (features.wireframeRandomness[wireframeRandomPointer + 2] * w / wMod), corners.tr.y + (features.wireframeRandomness[wireframeRandomPointer + 3] * w / wMod))
            ctx.lineTo(corners.br.x + (features.wireframeRandomness[wireframeRandomPointer + 4] * w / wMod), corners.br.y + (features.wireframeRandomness[wireframeRandomPointer + 5] * w / wMod))
            ctx.lineTo(corners.bl.x + (features.wireframeRandomness[wireframeRandomPointer + 6] * w / wMod), corners.bl.y + (features.wireframeRandomness[wireframeRandomPointer + 7] * w / wMod))
            ctx.lineTo(corners.tl.x + (features.wireframeRandomness[wireframeRandomPointer + 0] * w / wMod), corners.tl.y + (features.wireframeRandomness[wireframeRandomPointer + 1] * w / wMod))
            wireframeRandomPointer += 8
          }
          ctx.stroke()
        } else {
          ctx.beginPath()
          ctx.moveTo(corners.tl.x, corners.tl.y)
          ctx.lineTo(corners.tr.x, corners.tr.y)
          ctx.lineTo(corners.br.x, corners.br.y)
          ctx.lineTo(corners.bl.x, corners.bl.y)
          ctx.closePath()
          ctx.fill()
        }

        // If the vent is going in or out, we need to set the gradient to be reversed
        let innerGradient = null
        let innerGradientDark = null
        let topColourHSL = null
        if (thisTile.ventType === 'in' || thisTile.ventType === 'out') {
          innerGradient = ctx.createLinearGradient(innerCorners.tl.x, innerCorners.tl.y, innerCorners.tl.x, innerCorners.bl.y)
          innerGradientDark = ctx.createLinearGradient(innerCorners.tl.x, innerCorners.tl.y, innerCorners.tl.x, innerCorners.bl.y)
          topColourHSL = rgbToHsl(hexToRgb(features.tileMap[`${x},${y}`].tileColour1.value))
          // if the vent is going in, we want to make the top darker
          if (thisTile.ventType === 'in') {
            innerGradient.addColorStop(0, `hsl(${topColourHSL.h}, ${topColourHSL.s}%, ${Math.max(topColourHSL.l * 0.25, 10)}%)`)
            innerGradient.addColorStop(1, features.tileMap[`${x},${y}`].tileColour1.value)
            innerGradientDark.addColorStop(0, `hsl(${topColourHSL.h}, ${topColourHSL.s}%, ${Math.max(topColourHSL.l * 0.25, 10)}%)`)
            innerGradientDark.addColorStop(1, `hsl(${topColourHSL.h}, ${topColourHSL.s}%, ${Math.max(topColourHSL.l * 0.75, 10)}%)`)
          }
          // if the vent is going out, we want to make the bottom lighter
          if (thisTile.ventType === 'out') {
            innerGradient.addColorStop(0, features.tileMap[`${x},${y}`].tileColour1.value)
            innerGradient.addColorStop(1, `hsl(${topColourHSL.h}, ${topColourHSL.s}%, ${Math.min(topColourHSL.l * 1.75, 90)}%)`)
            innerGradientDark.addColorStop(0, `hsl(${topColourHSL.h}, ${topColourHSL.s}%, ${Math.max(topColourHSL.l * 0.5, 10)}%)`)
            innerGradientDark.addColorStop(1, `hsl(${topColourHSL.h}, ${topColourHSL.s}%, ${Math.max(topColourHSL.l * 0.75, 10)}%)`)
          }
        }
        ctx.fillStyle = innerGradient
        ctx.strokeStyle = innerGradientDark

        // Now draw the inner tile
        // If the vent is going in, then we need to draw the inner tile and then the shadow
        if (thisTile.ventType === 'in') {
          if (features.showWireframe) {
            ctx.beginPath()
            for (let i = 0; i < wireframeLoop; i++) {
              ctx.moveTo(innerCorners.tl.x + (features.wireframeRandomness[wireframeRandomPointer + 0] * w / wMod), innerCorners.tl.y + (features.wireframeRandomness[wireframeRandomPointer + 1] * w / wMod))
              ctx.lineTo(innerCorners.tr.x + (features.wireframeRandomness[wireframeRandomPointer + 2] * w / wMod), innerCorners.tr.y + (features.wireframeRandomness[wireframeRandomPointer + 3] * w / wMod))
              ctx.lineTo(innerCorners.br.x + (features.wireframeRandomness[wireframeRandomPointer + 4] * w / wMod), innerCorners.br.y + (features.wireframeRandomness[wireframeRandomPointer + 5] * w / wMod))
              ctx.lineTo(innerCorners.bl.x + (features.wireframeRandomness[wireframeRandomPointer + 6] * w / wMod), innerCorners.bl.y + (features.wireframeRandomness[wireframeRandomPointer + 7] * w / wMod))
              ctx.lineTo(innerCorners.tl.x + (features.wireframeRandomness[wireframeRandomPointer + 0] * w / wMod), innerCorners.tl.y + (features.wireframeRandomness[wireframeRandomPointer + 1] * w / wMod))
              wireframeRandomPointer += 8
            }
            ctx.stroke()

            // Top shadow
            ctx.beginPath()
            for (let i = 0; i < wireframeLoop; i++) {
              ctx.moveTo(innerCorners.tr.x + (features.wireframeRandomness[wireframeRandomPointer + 0] * w / wMod), innerCorners.tr.y + (features.wireframeRandomness[wireframeRandomPointer + 1] * w / wMod))
              ctx.lineTo(innerCorners.tr.x - shadowAcrossSize + (features.wireframeRandomness[wireframeRandomPointer + 2] * w / wMod), innerCorners.tr.y + shadownDownSize + (features.wireframeRandomness[wireframeRandomPointer + 3] * w / wMod))
              ctx.lineTo(innerCorners.tl.x + (features.wireframeRandomness[wireframeRandomPointer + 4] * w / wMod), innerCorners.tl.y + shadownDownSize + (features.wireframeRandomness[wireframeRandomPointer + 5] * w / wMod))
              wireframeRandomPointer += 6
            }
            ctx.stroke()

            // Side shadow
            ctx.lineStyle = 'rgba(0,0,0,0.66)'
            ctx.beginPath()
            for (let i = 0; i < wireframeLoop; i++) {
              ctx.moveTo(innerCorners.tr.x - shadowAcrossSize + (features.wireframeRandomness[wireframeRandomPointer + 0] * w / wMod), innerCorners.tr.y + shadownDownSize + (features.wireframeRandomness[wireframeRandomPointer + 1] * w / wMod))
              ctx.lineTo(innerCorners.br.x + (features.wireframeRandomness[wireframeRandomPointer + 2] * w / wMod), innerCorners.br.y + (features.wireframeRandomness[wireframeRandomPointer + 3] * w / wMod))
              wireframeRandomPointer += 4
            }
            ctx.stroke()
          } else {
            ctx.beginPath()
            ctx.moveTo(innerCorners.tl.x, innerCorners.tl.y)
            ctx.lineTo(innerCorners.tr.x, innerCorners.tr.y)
            ctx.lineTo(innerCorners.br.x, innerCorners.br.y)
            ctx.lineTo(innerCorners.bl.x, innerCorners.bl.y)
            ctx.closePath()
            ctx.fill()

            // Draw the shadow down first
            ctx.fillStyle = 'rgba(0,0,0,0.66)'
            ctx.beginPath()
            ctx.moveTo(innerCorners.tl.x, innerCorners.tl.y)
            ctx.lineTo(innerCorners.tr.x, innerCorners.tr.y)
            ctx.lineTo(innerCorners.tr.x - shadowAcrossSize, innerCorners.tr.y + shadownDownSize)
            ctx.lineTo(innerCorners.tl.x, innerCorners.tl.y + shadownDownSize)
            ctx.closePath()
            ctx.fill()

            // Draw the side shadow
            ctx.fillStyle = 'rgba(0,0,0,0.33)'
            ctx.beginPath()
            ctx.moveTo(innerCorners.tr.x, innerCorners.tr.y)
            ctx.lineTo(innerCorners.br.x, innerCorners.br.y)
            ctx.lineTo(innerCorners.tr.x - shadowAcrossSize, innerCorners.tr.y + shadownDownSize)
            ctx.closePath()
            ctx.fill()
          }
        }

        // If the vent is going out, we need to draw it slightly differently
        if (thisTile.ventType === 'out') {
          if (features.showWireframe) {
            ctx.beginPath()
            for (let i = 0; i < wireframeLoop; i++) {
              ctx.moveTo(innerCorners.tl.x + (features.wireframeRandomness[wireframeRandomPointer + 0] * w / wMod), innerCorners.tl.y + (features.wireframeRandomness[wireframeRandomPointer + 1] * w / wMod))
              ctx.lineTo(innerCorners.tr.x + (features.wireframeRandomness[wireframeRandomPointer + 2] * w / wMod), innerCorners.tr.y + (features.wireframeRandomness[wireframeRandomPointer + 3] * w / wMod))
              ctx.lineTo(innerCorners.br.x + shadowAcrossSize + (features.wireframeRandomness[wireframeRandomPointer + 4] * w / wMod), innerCorners.br.y + (features.wireframeRandomness[wireframeRandomPointer + 5] * w / wMod))
              ctx.lineTo(innerCorners.bl.x + shadowAcrossSize + (features.wireframeRandomness[wireframeRandomPointer + 6] * w / wMod), innerCorners.bl.y + (features.wireframeRandomness[wireframeRandomPointer + 7] * w / wMod))
              ctx.lineTo(innerCorners.tl.x + (features.wireframeRandomness[wireframeRandomPointer + 0] * w / wMod), innerCorners.tl.y + (features.wireframeRandomness[wireframeRandomPointer + 1] * w / wMod))
              wireframeRandomPointer += 8
            }
            ctx.stroke()

            ctx.beginPath()
            for (let i = 0; i < wireframeLoop; i++) {
              ctx.moveTo(innerCorners.br.x + shadowAcrossSize + (features.wireframeRandomness[wireframeRandomPointer + 0] * w / wMod), innerCorners.br.y + (features.wireframeRandomness[wireframeRandomPointer + 1] * w / wMod))
              ctx.lineTo(innerCorners.br.x + (features.wireframeRandomness[wireframeRandomPointer + 2] * w / wMod), innerCorners.br.y + shadownDownSize + (features.wireframeRandomness[wireframeRandomPointer + 3] * w / wMod))
              ctx.lineTo(innerCorners.bl.x + (features.wireframeRandomness[wireframeRandomPointer + 4] * w / wMod), innerCorners.bl.y + shadownDownSize + (features.wireframeRandomness[wireframeRandomPointer + 5] * w / wMod))
              ctx.lineTo(innerCorners.bl.x + shadowAcrossSize + (features.wireframeRandomness[wireframeRandomPointer + 0] * w / wMod), innerCorners.bl.y + (features.wireframeRandomness[wireframeRandomPointer + 1] * w / wMod))
              wireframeRandomPointer += 6
            }
            ctx.stroke()

            ctx.beginPath()
            for (let i = 0; i < wireframeLoop; i++) {
              ctx.moveTo(innerCorners.tl.x + (features.wireframeRandomness[wireframeRandomPointer + 0] * w / wMod), innerCorners.tl.y + (features.wireframeRandomness[wireframeRandomPointer + 1] * w / wMod))
              ctx.lineTo(innerCorners.bl.x + (features.wireframeRandomness[wireframeRandomPointer + 2] * w / wMod), innerCorners.bl.y + shadownDownSize + (features.wireframeRandomness[wireframeRandomPointer + 3] * w / wMod))
              wireframeRandomPointer += 4
            }
            ctx.stroke()
          } else {
            ctx.beginPath()
            ctx.moveTo(innerCorners.tl.x, innerCorners.tl.y)
            ctx.lineTo(innerCorners.tr.x, innerCorners.tr.y)
            ctx.lineTo(innerCorners.br.x + shadowAcrossSize, innerCorners.br.y)
            ctx.lineTo(innerCorners.bl.x + shadowAcrossSize, innerCorners.bl.y)
            ctx.closePath()
            ctx.fill()

            // Draw the shadow down first
            ctx.fillStyle = 'rgba(0,0,0,0.8)'
            ctx.beginPath()
            ctx.moveTo(innerCorners.bl.x + shadowAcrossSize, innerCorners.bl.y)
            ctx.lineTo(innerCorners.br.x + shadowAcrossSize, innerCorners.br.y)
            ctx.lineTo(innerCorners.br.x, innerCorners.br.y + shadownDownSize)
            ctx.lineTo(innerCorners.bl.x, innerCorners.bl.y + shadownDownSize)
            ctx.closePath()
            ctx.fill()

            // Draw the side shadow
            ctx.fillStyle = 'rgba(0,0,0,0.33)'
            ctx.beginPath()
            ctx.moveTo(innerCorners.tl.x, innerCorners.tl.y)
            ctx.lineTo(innerCorners.bl.x + shadowAcrossSize, innerCorners.bl.y)
            ctx.lineTo(innerCorners.bl.x, innerCorners.bl.y + shadownDownSize)
            ctx.closePath()
            ctx.fill()
          }
        }
      }
    }
  }

  ctx.restore()

  // If there's noise then we need to add it
  if (features.showNoise) {
    // Work out the offset
    const offset = w / 3000
    // Loop throught the noise points and add them
    for (let i = 0; i < features.noisePoints.length; i++) {
      ctx.fillStyle = `rgba(${features.noisePoints[i].shade},${features.noisePoints[i].shade},${features.noisePoints[i].shade},0.05)`
      ctx.fillRect((features.noisePoints[i].x * w) - offset, (features.noisePoints[i].y * h) - offset, offset * 2, offset * 2)
    }
  }

  if (!thumbnailTaken) {
    thumbnailTaken = true
    fxpreview()
  }
}

const autoDownloadCanvas = async (showHash = false) => {
  const element = document.createElement('a')
  element.setAttribute('download', `Vent_${fxhash}`)
  element.style.display = 'none'
  document.body.appendChild(element)
  let imageBlob = null
  imageBlob = await new Promise(resolve => document.getElementById('target').toBlob(resolve, 'image/png'))
  element.setAttribute('href', window.URL.createObjectURL(imageBlob, {
    type: 'image/png'
  }))
  element.click()
  document.body.removeChild(element)
}

//  KEY PRESSED OF DOOM
document.addEventListener('keypress', async (e) => {
  e = e || window.event
  // Save
  if (e.key === 's') autoDownloadCanvas()

  //   Toggle highres mode
  if (e.key === 'h') {
    highRes = !highRes
    console.log('Highres mode is now', highRes)
    await layoutCanvas()
  }

  // If the key is n, toggle the noise
  if (e.key === 'n') {
    features.showNoise = !features.showNoise
    console.log('Noise is now', features.showNoise)
    await layoutCanvas()
  }
})
//  This preloads the images so we can get access to them
// eslint-disable-next-line no-unused-vars
const preloadImages = () => {
  if (!drawn) {
    clearInterval(preloadImagesTmr)
    init()
  }
}
