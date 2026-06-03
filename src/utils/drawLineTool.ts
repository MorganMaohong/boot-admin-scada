import { LineNameEnums } from '@/components/ElementsProps/model'
import { useDrawStoreHook } from '@/stores/module/draw.ts'
import { useSelection } from '@/services/selections.ts'

export type DrawLineToolMode = 'pen' | 'pencil'

type DrawLineToolCallbacks = {
  onLineTypeChange?: (name: string) => void
}

let keydownHandler: ((e: KeyboardEvent) => void) | null = null
let callbacks: DrawLineToolCallbacks = {}

function clearCanvasSelection() {
  const { select, selects } = useSelection()
  select()
  selects()
  meta2d?.inactive?.()
}

function removeKeydownHandler() {
  if (!keydownHandler) return
  window.removeEventListener('keydown', keydownHandler)
  keydownHandler = null
}

function cyclePenLineType() {
  if (typeof meta2d === 'undefined') return
  const current = meta2d.store.options.drawingLineName
  let name = ''
  if (current === LineNameEnums.curve) {
    name = LineNameEnums.polyline
  } else if (current === LineNameEnums.line) {
    name = LineNameEnums.curve
  } else if (current === LineNameEnums.polyline) {
    name = LineNameEnums.line
  }
  if (!name) return
  meta2d.store.options.drawingLineName = name
  if (meta2d.canvas.drawingLineName) {
    meta2d.canvas.drawingLineName = name
  }
  callbacks.onLineTypeChange?.(name)
}

function installKeydownHandler() {
  removeKeydownHandler()
  keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      exitLineDrawTools()
      return
    }
    const drawStore = useDrawStoreHook()
    if (e.key === 'Alt' && drawStore.isPenDrawLine) {
      cyclePenLineType()
    }
  }
  window.addEventListener('keydown', keydownHandler)
}

/** 退出钢笔/铅笔画线模式，并取消工具栏激活状态 */
export function exitLineDrawTools() {
  const drawStore = useDrawStoreHook()
  if (!drawStore.isPenDrawLine && !drawStore.isPencilDrawLine) return

  if (drawStore.isPenDrawLine) {
    drawStore.isPenDrawLine = false
    meta2d?.finishDrawLine?.()
  }
  if (drawStore.isPencilDrawLine) {
    drawStore.isPencilDrawLine = false
    meta2d?.stopPencil?.()
  }

  if (meta2d?.store?.options) {
    meta2d.store.options.disableAnchor = false
  }
  removeKeydownHandler()
  callbacks = {}
}

export function isLineDrawToolActive() {
  const drawStore = useDrawStoreHook()
  return drawStore.isPenDrawLine || drawStore.isPencilDrawLine
}

/** 钢笔工具悬停说明（对齐 meta2d 文档） */
export const PEN_LINE_TOOL_HELP = {
  title: '钢笔连线',
  lines: [
    '点击图元锚点依次添加路径点，连续绘制连线',
    '绘制中 Alt：切换曲线 / 折线 / 直线',
    '绘制中 Enter、Esc、右键：结束当前连线',
    '选中连线 Enter：闭合 / 断开连线',
    '控制点上 Shift：切换手柄类型（镜像 / 对称 / 任意）',
    '连线锚点 H：增加控制点；D：删除控制点',
    'Esc：退出钢笔模式（结束绘制并取消工具激活）',
  ],
} as const

/** 铅笔工具悬停说明 */
export const PENCIL_LINE_TOOL_HELP = {
  title: '铅笔涂鸦',
  lines: [
    '按住鼠标拖动任意涂鸦，松开结束当前笔画',
    'Esc：退出铅笔模式',
  ],
} as const

/** 进入钢笔画线模式；若已在钢笔模式则退出 */
export function togglePenLineTool(options: DrawLineToolCallbacks = {}) {
  const drawStore = useDrawStoreHook()
  if (drawStore.isPenDrawLine) {
    exitLineDrawTools()
    return
  }

  exitLineDrawTools()
  callbacks = options
  clearCanvasSelection()

  drawStore.isPenDrawLine = true
  if (meta2d?.store?.options) {
    meta2d.store.options.disableAnchor = false
    meta2d.store.options.autoAnchor = true
  }
  meta2d?.drawLine?.(meta2d.store.options.drawingLineName)
  installKeydownHandler()
}

/** 进入铅笔画线模式；若已在铅笔模式则退出 */
export function togglePencilLineTool(options: DrawLineToolCallbacks = {}) {
  const drawStore = useDrawStoreHook()
  if (drawStore.isPencilDrawLine) {
    exitLineDrawTools()
    return
  }

  exitLineDrawTools()
  callbacks = options
  clearCanvasSelection()

  drawStore.isPencilDrawLine = true
  if (meta2d?.store?.options) {
    meta2d.store.options.disableAnchor = true
  }
  meta2d?.drawingPencil?.()
  installKeydownHandler()
}
