const Sketch = require('sketch-js')
const { GUI } = require('dat-gui')
const sortPoints = require('./sortPoints')

const color = `rgb(60, 60, 60)`
const container = document.body.appendChild(document.createElement('div'))
const ctx = Sketch.create({ container })

const settings = {
  leafSizeInherit: 0.6,
  speed: 5,
  leafSize: 100,
  spawnInherit: 0.5,
  spawnProbability: 0.5,
  branchAngle: 0.5
}

let branches

ctx.setup = ctx.resize = function () {
  branches = [createBranch()]
}

ctx.update = function () {
  branches.filter(({ ttl }) => ttl >= 0).forEach((branch) => {
    const { positions, direction, ttl, spawn } = branch
    const lastPosition = positions[positions.length - 1]
    positions.push([
      Math.cos(direction) * settings.speed + lastPosition[0],
      Math.sin(direction) * settings.speed + lastPosition[1]
    ])
    if (Math.random() < spawn) {
      branches.push(createBranch(branch))
    }
    branch.direction = updateDirection(direction)
    branch.ttl = updateTTL(ttl)
    branch.spawn = updateSpawn(spawn)
  })
}

ctx.draw = function () {
  // branches.forEach(({ positions }) => drawLine(ctx, positions, color))

  const leafOutline = branches.reduce((line, branch) => {
    line.push(branch.positions[branch.positions.length - 1])
    return line
  }, [])
  leafOutline.sort()
  drawLine(ctx, sortPoints(leafOutline), color)
}

const gui = new GUI()
// gui.add(settings, 'speed', 0, 5).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'leafSize', 5, 1000).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'leafSizeInherit', 0, 1).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'spawnProbability', 0, 1).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'spawnInherit', 0, 1).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'branchAngle', 0, 1).onChange(ctx.setup.bind(ctx))

// ------------ functions

const updateDirection = (direction) => direction
const updateTTL = (ttl) => ttl - 1
const updateSpawn = (spawn) => spawn

function createBranch (parent = {}) {
  return {
    direction: parent.direction ? parent.direction + (Math.random() - 0.5) * Math.PI * settings.branchAngle : Math.PI * 1.5,
    positions: [parent.positions ? parent.positions[parent.positions.length - 1] : [ctx.width / 2, ctx.height - 100]],
    ttl: parent.ttl !== undefined ? parent.ttl * settings.leafSizeInherit : settings.leafSize / settings.speed,
    spawn: parent.spawn ? parent.spawn * settings.spawnInherit : settings.spawnProbability
  }
}

function drawLine (ctx, positions, color) {
  ctx.beginPath()
  ctx.moveTo(positions[0][0], positions[0][1])
  positions.slice(1).forEach(p => ctx.lineTo(p[0], p[1]))
  ctx.strokeStyle = color
  ctx.stroke()
}
