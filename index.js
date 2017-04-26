const Sketch = require('sketch-js')
const { GUI } = require('dat-gui')
// const newArray = require('new-array')
const { triangulate } = require('delaunay')

const container = document.body.appendChild(document.createElement('div'))
const ctx = Sketch.create({ container })
const startPosition = [ctx.width / 2, ctx.height - 100]
const colors = [
  [82, 191, 144],
  [73, 171, 129],
  [65, 152, 115],
  [57, 133, 100],
  [49, 114, 86]
]

const settings = {
  canvasSize: 100,
  leafCount: 10,
  leafSizeInherit: 0.6,
  speed: 2,
  leafSize: 100,
  spawnInherit: 0.5,
  spawnProbability: 0.5,
  branchAngle: 0.5
}

let leaves

ctx.setup = ctx.resize = function () {
  leaves = []
  ctx.start()
}

ctx.update = function () {
  const center = [ctx.width / 2, ctx.height / 2]
  if (leaves.length < settings.leafCount && Math.random() < 0.08) {
    const direction = Math.random() * Math.PI * 2
    const dist = Math.pow(Math.random(), 0.5) * settings.canvasSize
    const position = [
      Math.cos(direction) * dist + center[0],
      Math.sin(direction) * dist + center[1]
    ]
    const leaf = createLeaf(position, direction)
    leaves.push(leaf)
  }

  for (let leaf of leaves) {
    updateLeaf(leaf)
  }

  const growingLeaves = leaves.filter(({ branches }) => {
    return branches.filter(({ ttl }) => ttl > 0).length
  })
  if (!growingLeaves.length && leaves.length === settings.leafCount) ctx.stop()
}

ctx.draw = function () {
  for (let leaf of leaves) {
    drawLeaf(ctx, leaf)
  }
}

const gui = new GUI()
gui.add(settings, 'speed', 0, 5).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'leafCount', 1, 100).step(1).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'canvasSize', 1, 300).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'leafSize', 5, 1000).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'leafSizeInherit', 0, 1).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'spawnProbability', 0, 1).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'spawnInherit', 0, 1).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'branchAngle', 0, 1).onChange(ctx.setup.bind(ctx))
gui.add({ redraw: () => ctx.setup() }, 'redraw')

// ------------ functions

const updateDirection = (direction) => direction
const updateTTL = (ttl) => ttl - 1
const updateSpawn = (spawn) => spawn

function createBranch (parent = {}) {
  return {
    direction: parent.direction ? parent.direction + (Math.random() - 0.5) * Math.PI * settings.branchAngle : Math.PI * 1.5,
    positions: [parent.positions ? parent.positions[parent.positions.length - 1] : startPosition],
    ttl: parent.ttl !== undefined ? parent.ttl * settings.leafSizeInherit : settings.leafSize / settings.speed,
    spawn: parent.spawn ? parent.spawn * settings.spawnInherit : settings.spawnProbability
  }
}

function createLeaf (position, direction) {
  return {
    branches: [createBranch({ positions: [position], direction })]
  }
}

function updateLeaf (leaf) {
  const { branches } = leaf
  const growingBranches = branches.filter(({ ttl }) => ttl >= 0)
  growingBranches.forEach((branch) => {
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

function drawLeaf (ctx, leaf) {
  const { branches } = leaf
  const leafOutline = branches.reduce((line, branch) => {
    line.push(branch.positions[branch.positions.length - 1])
    return line
  }, [])

  leafOutline.push(leaf.branches[0].positions[0])

  const indices = triangulate(leafOutline)
  const points = indices.map(idx => leafOutline[idx])
  for (let i = 0; i < points.length; i += 3) {
    const rgb = colors[Math.random() * colors.length | 0]
    const color = `rgba(${rgb.join(', ')}, 0.7)`
    const tri = [
      points[i],
      points[i + 1],
      points[i + 2]
    ]
    drawTriangle(ctx, tri, color)
  }

  branches.forEach(({ positions }) => drawLine(ctx, positions, `rgba(250, 250, 250, 0.35)`))
}

function drawLine (ctx, positions, color) {
  if (!positions.length) return
  ctx.beginPath()
  ctx.moveTo(positions[0][0], positions[0][1])
  positions.slice(1).forEach(p => ctx.lineTo(p[0], p[1]))
  ctx.strokeStyle = color
  ctx.stroke()
}

function drawTriangle (ctx, points, color) {
  if (points.length !== 3) {
    console.warn(`triangle has only ${points.length} points`)
    return
  }
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  ctx.lineTo(points[1][0], points[1][1])
  ctx.lineTo(points[2][0], points[2][1])
  ctx.lineTo(points[0][0], points[0][1])
  ctx.fillStyle = color
  ctx.fill()
}
