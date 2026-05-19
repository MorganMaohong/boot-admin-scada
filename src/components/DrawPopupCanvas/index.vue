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

const props = defineProps<{
  draw: ProjectMonitorDraw
}>()

const containerId = `draw-popup-${s16()}`
let popupMeta2d: Meta2d | null = null
let removeFullscreenListener: (() => void) | null = null

onMounted(() => {
  init()
})

watch(
  () => props.draw?.uid,
  async () => {
    await nextTick()
    init()
  },
)

onUnmounted(() => {
  destroy()
})

function init() {
  if (!props.draw?.data) return
  destroy()
  popupMeta2d = new Meta2d(containerId, { rule: false })
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
}
</script>

<template>
  <div :id="containerId" class="draw-popup-canvas"></div>
</template>

<style lang="scss" scoped>
.draw-popup-canvas {
  width: 100%;
  height: 100%;
}
</style>
