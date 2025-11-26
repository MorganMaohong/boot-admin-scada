import type { Pen } from '@meta2d/core'
import { reactive } from 'vue'

export enum SelectionMode {
  File,
  Pen,
}

const selections = reactive<{
  mode: SelectionMode
  pen?: Pen
  pens?: Pen[]
}>({
  // 选中对象类型：0 - 画布；1 - 单个图元
  mode: SelectionMode.File,
  pen: undefined,
  pens: undefined,
})

export const useSelection = () => {
  const select = (pens?: Pen[]) => {
    if (!pens) {
      selections.mode = SelectionMode.File
      selections.pen = undefined
    } else {
      if (pens.length === 0) {
        selections.mode = SelectionMode.File
        selections.pen = undefined
        return
      }
      selections.mode = SelectionMode.Pen
      selections.pen = pens[0]
    }
  }

  const selects = (pens?: Pen[]) => {
    // debugger
    if (!pens || pens.length === 0) return
    selections.pens = pens
  }
  return {
    selections,
    select,
    selects,
  }
}
