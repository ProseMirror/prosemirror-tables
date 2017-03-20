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

  static get(table) {
    return readFromCache(table) || addToCache(table, computeMap(table))
  }
}
exports.TableMap = TableMap

function computeMap(table) {
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
        let cell = rowNode.child(i)
        if (i + cell.attrs.rowspan - 1 >= row) rowWidth += cell.attrs.colspan
      }
    }
    for (let i = 0; i < rowNode.childCount; i++) {
      let cell = rowNode.child(i)
      rowWidth += cell.attrs.colspan
      if (cell.attrs.rowspan > 1) hasRowSpan = true
    }
    if (width == -1) {
      width = rowWidth
    } else if (width != rowWidth) {
      width = Math.max(width, rowWidth)
    }
  }
  return width
}
