<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Meta2d, register, registerAnchors, registerCanvasDraw, s16 } from '@meta2d/core'
import { flowAnchors, flowPens } from '@meta2d/flow-diagram'
import { activityDiagram, activityDiagramByCtx } from '@meta2d/activity-diagram'
import { classPens } from '@meta2d/class-diagram'
import { sequencePens, sequencePensbyCtx } from '@meta2d/sequence-diagram'
import { register as registerEcharts } from '@meta2d/chart-diagram/src/register'
import { formPens } from '@meta2d/form-diagram'
import { chartsPens } from '@meta2d/le5le-charts'
import { ftaAnchors, ftaPens, ftaPensbyCtx } from '@meta2d/fta-diagram'
import type { ProjectMonitorDraw } from '@/model/draw'
import { installMeta2dSafetyGuards } from '@/utils/meta2dPens.ts'
import { registerScadaPens } from '@/meta2d/scadaPens.ts'

const props = defineProps<{
  draw: ProjectMonitorDraw
}>()

const containerId = `draw-popup-${s16()}`
const canvasRef = ref<HTMLElement | null>(null)
let popupMeta2d: Meta2d | null = null
let removeFullscreenListener: (() => void) | null = null
let resizeObserver: ResizeObserver | null = null
let initScheduled = false

onMounted(() => {
  void nextTick().then(() => {
    setupResizeObserver()
    return scheduleInit()
  })
})

watch(
  () => props.draw?.uid,
  async () => {
    await nextTick()
    void scheduleInit()
  },
)

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  destroy()
})

function getContainer() {
  return canvasRef.value ?? document.getElementById(containerId)
}

function hasContainerSize(el: HTMLElement) {
  return el.clientWidth > 0 && el.clientHeight > 0
}

async function scheduleInit() {
  if (!props.draw?.data || initScheduled) return
  initScheduled = true
  await nextTick()
  requestAnimationFrame(() => {
    initScheduled = false
    const el = getContainer()
    if (!el || !props.draw?.data) return
    if (!hasContainerSize(el)) return
    init()
  })
}

function setupResizeObserver() {
  const el = getContainer()
  if (!el || typeof ResizeObserver === 'undefined') return
  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(() => {
    const target = getContainer()
    if (!target || !props.draw?.data) return
    if (!hasContainerSize(target)) return
    if (!popupMeta2d) {
      init()
      return
    }
    popupMeta2d.resize()
    popupMeta2d.fitView(true, 5)
  })
  resizeObserver.observe(el)
}

function init() {
  if (!props.draw?.data) return
  const el = getContainer()
  if (!el || !hasContainerSize(el)) {
    void scheduleInit()
    return
  }
  destroy()
  popupMeta2d = new Meta2d(containerId, { rule: false })
  installMeta2dSafetyGuards(popupMeta2d)
  registerLibraries()

  const data = JSON.parse(props.draw.data)
  data.locked = 1
  data.disableScale = true
  data.disableTranslate = true
  data.rule = false

  popupMeta2d.setOptions({ disableRuleLine: true })
  popupMeta2d.open(data)
  popupMeta2d.fitView(true, 0)

  const handleFullscreenChange = () => {
    window.setTimeout(() => {
      popupMeta2d?.fitView(true, 5)
    }, 200)
  }
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  removeFullscreenListener = () => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }

  popupMeta2d.on('active', () => {
    popupMeta2d?.inactive()
  })
  popupMeta2d.on('enter', (pen) => {
    pen.calculative.hover = false
  })
}

function destroy() {
  removeFullscreenListener?.()
  removeFullscreenListener = null
  popupMeta2d?.destroy()
  popupMeta2d = null
}

function registerLibraries() {
  register(flowPens())
  registerAnchors(flowAnchors())
  register(activityDiagram())
  registerCanvasDraw(activityDiagramByCtx())
  register(classPens())
  register(sequencePens())
  registerCanvasDraw(sequencePensbyCtx())
  registerEcharts()
  registerCanvasDraw(formPens())
  registerCanvasDraw(chartsPens())
  register(ftaPens())
  registerCanvasDraw(ftaPensbyCtx())
  registerAnchors(ftaAnchors())
  registerScadaPens()
}
</script>

<template>
  <div :id="containerId" ref="canvasRef" class="draw-popup-canvas"></div>
</template>

<style lang="scss" scoped>
.draw-popup-canvas {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
