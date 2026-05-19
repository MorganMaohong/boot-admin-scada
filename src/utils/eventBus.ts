// src/utils/eventBus.ts
import mitt from 'mitt'

type Events = {
  'meta2d-ready': void
  draw: void
  pensSorted: void
  updateDraw: void
  updateModal: void
  reloadDraw: void
  showControlVar: void
}

const emitter = mitt<Events>()

export default emitter
