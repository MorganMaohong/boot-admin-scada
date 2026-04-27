<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Meta2d, register, registerAnchors, registerCanvasDraw } from '@meta2d/core'
import { flowAnchors, flowPens } from '@meta2d/flow-diagram'
import { activityDiagram, activityDiagramByCtx } from '@meta2d/activity-diagram'
import { classPens } from '@meta2d/class-diagram'
import { sequencePens, sequencePensbyCtx } from '@meta2d/sequence-diagram'
import { register as registerEcharts } from '@meta2d/chart-diagram/src/register'
import { formPens } from '@meta2d/form-diagram'
import { chartsPens } from '@meta2d/le5le-charts'
import { ftaAnchors, ftaPens, ftaPensbyCtx } from '@meta2d/fta-diagram'
import { getUrlParams } from '@/utils'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { useDrawStore } from '@/stores/module/draw.ts'

let meta2ds = null
const monitorDraw = ref()
const meta2dOptions: any = {
  rule: true,
}
const drawStore = useDrawStore()
onMounted(() => {
  monitorDraw.value = drawStore.globalModal.draw
  if (drawStore.globalModal.show) {
    init()
  }
})

watch(
  () => drawStore.globalModal.draw,
  async () => {
    monitorDraw.value = drawStore.globalModal.draw
    if (drawStore.globalModal.show) {
      await nextTick()
      init()
    }
  },
  { deep: true },
)

onUnmounted(() => {
  meta2ds?.destroy()
  meta2ds = null
})


function init() {
  if (!monitorDraw.value?.data) return
  meta2ds?.destroy()
  // 创建实例
  meta2ds = new Meta2d('meta3d', meta2dOptions)

  // 按需注册图形库
  // 以下为自带基础图形库
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

  // 注册其他自定义图形库
  // ...

  let data = JSON.parse(monitorDraw.value.data)
  data.locked = 1
  data.disableScale = true
  data.disableTranslate = true
  data.rule = false
  meta2ds.setOptions({ disableRuleLine: true })
  meta2ds.open(data)

  meta2ds.fitView(true, 0)

  document.addEventListener('fullscreenchange', () => {
    setTimeout(() => {
      meta2ds.fitView(true, 5)
    }, 200)
  })

  meta2ds.on('active', (pens) => {
    meta2ds.inactive()
    return
  })
  meta2ds.on('enter', (pen) => {
    pen.calculative.hover = false
    return
  })
}
</script>

<template>
  <div id="meta3d" style="width: 100%; height: 100%"></div>
</template>

<style lang="scss" scoped></style>
