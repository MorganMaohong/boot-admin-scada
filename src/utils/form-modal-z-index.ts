import zIndexManager from "vdirs/es/zindexable/z-index-manager"

/** 弹窗内浮层（预览、下拉等）相对弹窗 z-index 的偏移 */
export const FORM_MODAL_OVERLAY_OFFSET = 1000

export type FormModalLayer = {
  modalZIndex: number
  overlayZIndex: number
}

const openModalZIndices: number[] = []
let managerPatched = false

function patchZIndexManager(): void {
  if (managerPatched) return
  managerPatched = true

  const originalSquash = zIndexManager.squashState.bind(zIndexManager)
  zIndexManager.squashState = function squashStateWithFormModalFloor() {
    originalSquash()
    syncZIndexFloor()
  }

  const originalRearrange = zIndexManager.rearrange.bind(zIndexManager)
  zIndexManager.rearrange = function rearrangeWithFormModalFloor() {
    originalRearrange()
    syncZIndexFloor()
  }
}

/** FormModal 打开期间，防止 Naive UI 浮层关闭后 z-index 回退到与弹窗同级 */
function syncZIndexFloor(): void {
  if (!openModalZIndices.length) return
  const floor = Math.max(...openModalZIndices) + 1
  if (zIndexManager.nextZIndex < floor) {
    zIndexManager.nextZIndex = floor
  }
}

function syncOverlayCssVar(): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  if (!openModalZIndices.length) {
    root.classList.remove("FormModal--overlay-active")
    root.style.removeProperty("--form-modal-overlay-z-index")
    return
  }
  root.classList.add("FormModal--overlay-active")
  const overlayZ = Math.max(...openModalZIndices.map((z) => z + FORM_MODAL_OVERLAY_OFFSET))
  root.style.setProperty("--form-modal-overlay-z-index", String(overlayZ))
}

/** 打开 FormModal：分配弹窗层级，并保证内部浮层始终在其上方 */
export function openFormModalLayer(explicit?: number): FormModalLayer {
  patchZIndexManager()
  const modalZIndex = typeof explicit === "number" ? explicit : zIndexManager.nextZIndex++
  openModalZIndices.push(modalZIndex)
  syncZIndexFloor()
  if (zIndexManager.nextZIndex <= modalZIndex) {
    zIndexManager.nextZIndex = modalZIndex + 1
  }
  syncOverlayCssVar()
  return {
    modalZIndex,
    overlayZIndex: modalZIndex + FORM_MODAL_OVERLAY_OFFSET
  }
}

/** 关闭 FormModal：释放层级占位 */
export function closeFormModalLayer(modalZIndex: number): void {
  const index = openModalZIndices.lastIndexOf(modalZIndex)
  if (index >= 0) openModalZIndices.splice(index, 1)
  syncZIndexFloor()
  syncOverlayCssVar()
}
