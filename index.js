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

/*
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
*/
//  Work out what all our features are
const makeFeatures = () => {
  // Pick a random number of tiles between 3 and 6
  features.tiles = Math.floor(fxrand() * 3) + 3

  // The final grid map will be 4x the number of tiles
  features.tileMap = {}
  // Grab a random palette
  features.palette = palettes[Math.floor(fxrand() * palettes.length)]
  // Loop through y and x for the number of tiles
  for (let y = 0; y < features.tiles; y++) {
    for (let x = 0; x < features.tiles; x++) {
      const level = 0
      const tileSize = 4
      const tileColour1 = features.palette.colors[Math.floor(fxrand() * features.palette.colors.length)]
      let tileColour2 = features.palette.colors[Math.floor(fxrand() * features.palette.colors.length)]
      while (tileColour2 === tileColour1) {
        tileColour2 = features.palette.colors[Math.floor(fxrand() * features.palette.colors.length)]
      }
      // We can do recursion, but it's a pain in the ass to debug, so we are going to do this
      // in a gnarly long way
      // Decide if we are going to split this tile up, if not just make a good solid tile
      if (fxrand() > 0) {
        // Don't split the tile
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
        // Now put the tile in, with the draw and colour
        features.tileMap[`${x * tileSize},${y * tileSize}`].drawMe = true
        features.tileMap[`${x * tileSize},${y * tileSize}`].tileColour1 = tileColour1
        features.tileMap[`${x * tileSize},${y * tileSize}`].tileColour2 = tileColour2
        features.tileMap[`${x * tileSize},${y * tileSize}`].tileSize = 4
      } else {
        // Split the tile
      }
    }
  }
}

//  Call the above make features, so we'll have the window.$fxhashFeatures available
//  for fxhash
makeFeatures()
console.log(features)

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
  const roundingValue = features.tiles * 4
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

  // const maxMiniTiles = features.tiles * 4
  const miniTileWidth = w / (features.tiles * 4)
  const miniTileHeight = h / (features.tiles * 4)

  // Now we need to loop through the tileMap and draw the tiles
  for (let y = 0; y < features.tiles * 4; y++) {
    for (let x = 0; x < features.tiles * 4; x++) {
      if (features.tileMap[`${x},${y}`].drawMe) {
        // Work out the four corners of the tile
        const corners = {
          tl: {
            x: x * miniTileWidth,
            y: y * miniTileHeight
          }
        }
        corners.tr = {
          x: corners.tl.x + (features.tileMap[`${x},${y}`].tileSize * miniTileWidth),
          y: corners.tl.y
        }
        corners.bl = {
          x: corners.tl.x,
          y: corners.tl.y + (features.tileMap[`${x},${y}`].tileSize * miniTileHeight)
        }
        corners.br = {
          x: corners.tl.x + (features.tileMap[`${x},${y}`].tileSize * miniTileWidth),
          y: corners.tl.y + (features.tileMap[`${x},${y}`].tileSize * miniTileHeight)
        }

        // Now work out the positions of the inner corners
        // First we need to define the border size as a percent, let's say 25%
        const borderSize = 0.2
        const innerCorners = {
          tl: {
            x: corners.tl.x + ((corners.tr.x - corners.tl.x) * borderSize),
            y: corners.tl.y + ((corners.bl.y - corners.tl.y) * borderSize)
          },
          tr: {
            x: corners.tr.x - ((corners.tr.x - corners.tl.x) * borderSize),
            y: corners.tr.y + ((corners.br.y - corners.tr.y) * borderSize)
          },
          bl: {
            x: corners.bl.x + ((corners.br.x - corners.bl.x) * borderSize),
            y: corners.bl.y - ((corners.bl.y - corners.tl.y) * borderSize)
          },
          br: {
            x: corners.br.x - ((corners.br.x - corners.bl.x) * borderSize),
            y: corners.br.y - ((corners.br.y - corners.tr.y) * borderSize)
          }
        }

        // We are going to create a gradient from the top left corner to the bottom left corner
        // from tileColour1 to tileColour2
        const gradient = ctx.createLinearGradient(corners.tl.x, corners.tl.y, corners.tl.x, corners.bl.y)
        gradient.addColorStop(0, features.tileMap[`${x},${y}`].tileColour1.value)
        gradient.addColorStop(1, features.tileMap[`${x},${y}`].tileColour2.value)
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.moveTo(corners.tl.x, corners.tl.y)
        ctx.lineTo(corners.tr.x, corners.tr.y)
        ctx.lineTo(corners.br.x, corners.br.y)
        ctx.lineTo(corners.bl.x, corners.bl.y)
        ctx.closePath()
        ctx.fill()

        // Reverse the gradient
        const innerGradient = ctx.createLinearGradient(innerCorners.tl.x, innerCorners.tl.y, innerCorners.tl.x, innerCorners.bl.y)
        innerGradient.addColorStop(0, features.tileMap[`${x},${y}`].tileColour2.value)
        innerGradient.addColorStop(1, features.tileMap[`${x},${y}`].tileColour1.value)
        ctx.fillStyle = innerGradient
        ctx.beginPath()
        ctx.moveTo(innerCorners.tl.x, innerCorners.tl.y)
        ctx.lineTo(innerCorners.tr.x, innerCorners.tr.y)
        ctx.lineTo(innerCorners.br.x, innerCorners.br.y)
        ctx.lineTo(innerCorners.bl.x, innerCorners.bl.y)
        ctx.closePath()
        ctx.fill()

        // Now I want a little inset point so I can add shadows, this is going to be 1/2 of a quarter of the tile down from the inner Tile top
        // and a quarter of the tile across from the inner tile left
        /*
        const insetX = innerTileX + innerTileWidth - (innerTileWidth / 4)
        const insetY = innerTileY + (innerTileHeight / 8)
        // The shadow on the left is going to be 33% black
        ctx.fillStyle = 'rgba(0,0,0,0.33)'
        ctx.beginPath()
        ctx.moveTo(innerTileX + innerTileWidth, innerTileY)
        ctx.lineTo(insetX, insetY)
        ctx.lineTo(innerTileX + innerTileWidth, innerTileY + innerTileHeight)
        ctx.closePath()
        ctx.fill()
        // Now do the shadow in the upper part of the inset
        ctx.fillStyle = 'rgba(0,0,0,0.66)'
        ctx.beginPath()
        ctx.moveTo(innerTileX, innerTileY)
        ctx.lineTo(innerTileX + innerTileWidth, innerTileY)
        ctx.lineTo(insetX, insetY)
        ctx.lineTo(innerTileX, insetY)
        ctx.closePath()
        ctx.fill()
        */
      }
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
})
//  This preloads the images so we can get access to them
// eslint-disable-next-line no-unused-vars
const preloadImages = () => {
  if (!drawn) {
    clearInterval(preloadImagesTmr)
    init()
  }
}
