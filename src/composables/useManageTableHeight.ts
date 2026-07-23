import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

/** 管理弹窗内 vxe-table 高度：随容器 ResizeObserver 自适应，保证内部滚动 */
export function useManageTableHeight(containerRef: Ref<HTMLElement | null>, min = 400) {
  const height = ref(min)
  let observer: ResizeObserver | null = null

  const sync = () => {
    const el = containerRef.value
    if (!el) return
    height.value = Math.max(min, el.clientHeight)
  }

  const bind = () => {
    observer?.disconnect()
    observer = null
    sync()
    if (typeof ResizeObserver === 'undefined' || !containerRef.value) return
    observer = new ResizeObserver(sync)
    observer.observe(containerRef.value)
  }

  onMounted(() => {
    void nextTick(bind)
  })

  watch(containerRef, () => {
    void nextTick(bind)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return height
}
