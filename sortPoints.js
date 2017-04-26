module.exports = function sortPoints (points) {
  const newPath = [points[0]]
  points = points.slice(1)
  while (points.length) {
    const curPt = newPath[newPath.length - 1]
    let nextPt
    for (let pt of points) {
      if (!nextPt || squaredDistance(curPt, pt) < squaredDistance(curPt, nextPt)) {
        nextPt = pt
      }
    }
    const nextPtIdx = points.indexOf(nextPt)
    points.splice(nextPtIdx, 1)
    newPath.push(nextPt)
  }
  return newPath
}

function squaredDistance (pt1, pt2) {
  const dx = pt2[0] - pt1[0]
  const dy = pt2[1] - pt1[1]
  return dx * dx + dy * dy
}
