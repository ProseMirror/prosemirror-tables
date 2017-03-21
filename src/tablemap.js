let readFromCache, addToCache
if (typeof WeakMap != "undefined") {
  let cache = new WeakMap
  readFromCache = key => cache.get(key)
  addToCache = (key, value) => {
    cache.set(key, value)
    return value
  }
} else {
  let cache = [], cacheSize = 10, cachePos = 0
  readFromCache = key => {
    for (let i = 0; i < cache.length; i += 2)
      if (cache[i] == key) return cache[i + 1]
  }
  addToCache = (key, value) => {
    if (cachePos == cacheSize) cachePos = 0
    cache[cachePos++] = key
    return cache[cachePos++] = value
  }
}

const cellSize = {left: 0, top: 0, right: 0, bottom: 0}
function returnSize(left, top, right, bottom) {
  cellSize.left = left
  cellSize.right = right
  cellSize.top = top
  cellSize.bottom = bottom
  return cellSize
}

class TableMap {
  constructor(width, height, map, problems) {
    this.width = width
    this.height = height
    this.map = map
    this.problems = problems
  }

  findCell(pos) {
    for (let i = 0; i < this.map.length; i++) {
      let curPos = this.map[i]
      if (curPos != pos) continue
      let left = i % this.width, top = (i / this.width) | 0
      let right = left + 1, bottom = top + 1
      for (let j = 1; right < this.width && this.map[i + j] == curPos; j++) right++
      for (let j = 1; bottom < this.height && this.map[i + (this.width * j)] == curPos; j++) bottom++
      return returnSize(left, top, right, bottom)
    }
    throw new RangeError("No cell with offset " + pos + " found")
  }

  colCount(pos) {
    for (let i = 0; i < this.map.length; i++)
      if (this.map[i] == pos) return i % this.width
    throw new RangeError("No cell with offset " + pos + " found")
  }

  nextCell(pos, axis, dir) {
    let {left, right, top, bottom} = this.findCell(pos)
    if (axis == "horiz") {
      if (dir < 0 ? left == 0 : right == this.width) return null
      return this.map[top * this.width + (dir < 0 ? left - 1 : right)]
    } else {
      if (dir < 0 ? top == 0 : bottom == this.height) return null
      return this.map[left + this.width * (dir < 0 ? top - 1 : bottom)]
    }
  }

  cellsInRect(a, b) {
    let {left: leftA, right: rightA, top: topA, bottom: bottomA} = this.findCell(a)
    let {left: leftB, right: rightB, top: topB, bottom: bottomB} = this.findCell(b)
    let left = Math.min(leftA, leftB), right = Math.max(rightA, rightB)
    let top = Math.min(topA, topB), bottom = Math.max(bottomA, bottomB)
    let result = []
    for (let row = top; row < bottom; row++) {
      for (let col = left; col < right; col++) {
        let pos = this.map[row * this.width + col]
        if (result.indexOf(pos) == -1) result.push(pos)
      }
    }
    return result
  }

  static get(table) {
    return readFromCache(table) || addToCache(table, computeMap(table))
  }
}
exports.TableMap = TableMap

function computeMap(table) {
  if (table.type.name != "table") throw new RangeError("Not a table node: " + table.type.name)
  let width = findWidth(table), height = table.childCount
  let map = [], mapPos = 0, problems = null
  for (let i = 0, e = width * height; i < e; i++) map[i] = 0

  for (let row = 0, pos = 0; row < height; row++) {
    let rowNode = table.child(row)
    pos++
    for (let i = 0; i < rowNode.childCount; i++) {
      let cellNode = rowNode.child(i), {colspan, rowspan} = cellNode.attrs
      while (map[mapPos] != 0) mapPos++
      for (let h = 0; h < rowspan; h++) {
        let start = mapPos + (h * width)
        for (let w = 0; w < colspan; w++) {
          if (map[start + w] == 0)
            map[start + w] = pos
          else
            (problems || (problems = [])).push({type: "collision", row, pos, n: colspan - w})
        }
      }
      mapPos += colspan
      pos += cellNode.nodeSize
    }
    let expectedPos = (row + 1) * width
    if (mapPos != expectedPos) {
      ;(problems || (problems = [])).push({type: "missing", row, n: expectedPos - mapPos})
      mapPos = expectedPos
    }
    pos++
  }

  return new TableMap(width, height, map, problems)
}

function findWidth(table) {
  let width = -1, hasRowSpan = false
  for (let row = 0; row < table.childCount; row++) {
    let rowNode = table.child(row), rowWidth = 0
    if (hasRowSpan) for (let j = 0; j < row; j++) {
      let prevRow = table.child(j)
      for (let i = 0; i < prevRow.childCount; i++) {
        let cell = prevRow.child(i)
        if (j + cell.attrs.rowspan > row) rowWidth += cell.attrs.colspan
      }
    }
    for (let i = 0; i < rowNode.childCount; i++) {
      let cell = rowNode.child(i)
      rowWidth += cell.attrs.colspan
      if (cell.attrs.rowspan > 1) hasRowSpan = true
    }
    if (width == -1)
      width = rowWidth
    else if (width != rowWidth)
      width = Math.max(width, rowWidth)
  }
  return width
}
