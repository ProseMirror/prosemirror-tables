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

class TableMap {
  constructor(width, height, map, problems) {
    this.width = width
    this.height = height
    this.map = map
    this.problems = problems
  }

  locate(pos) {
    for (let i = 0; i < this.map.length; i++) {
      let off = this.map[i]
      if (off == pos) return i
      if (off > pos) return i - 1
    }
    return this.map.length
  }

  colCount(pos) {
    return this.locate(pos) % (this.width + 1)
  }

  rowCount(pos) {
    return (this.locate(pos) / (this.width + 1)) | 0
  }

  moveCellPos(pos, axis, dir) {
    let place = this.locate(pos)
    if (axis == "horiz") {
      if (place % (this.width + 1) == (dir < 0 ? 0 : this.width)) return null
      for (;;) {
        let next = this.map[place += dir]
        if (next != pos) return next
      }
    } else {
      let row = (this.locate(pos) / this.width) | 0
      for (;;) {
        place += dir * (this.width + 1)
        if (dir < 0 ? place < 0 : place >= this.map.length) return null
        let next = this.map[place]
        if (next != pos) return next
      }
    }
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
  for (let i = 0, e = (width + 1) * height; i < e; i++) map[i] = 0

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
    map[mapPos++] = pos
    let expectedPos = (row + 1) * (width + 1)
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
        let cell = rowNode.child(i)
        if (i + cell.attrs.rowspan - 1 >= row) rowWidth += cell.attrs.colspan
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
