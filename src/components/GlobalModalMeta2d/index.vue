<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
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

const monitorDraw = ref()
const meta2dOptions: any = {
  rule: true,
}
const drawStore = useDrawStore(0)
onMounted(() => {
  const params = getUrlParams()
  MonitorDrawService.display(params.projectUid).then((data) => {
    monitorDraw.value = data
    drawStore.topics = monitorDraw.value.topics
    drawStore.snList = monitorDraw.value.snList
    init()
  })
})

function init() {
  // 创建实例
  const meta2ds = new Meta2d('meta3d', meta2dOptions)

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
  let data = JSON.parse(monitorDraw.value.draw.data)
  data.locked = 1
  data.disableScale = true
  data.disableTranslate = true
  data.rule = false
  meta2ds.setOptions({ disableRuleLine: true })
  meta2ds.open(data)

  meta2ds.fitView(true, 5)

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
  <div
    id="meta3d"
    :style="{
      width: drawStore.globalModal.width - 50 + 'px',
      height: drawStore.globalModal.height - 100 + 'px',
    }"
  ></div>
</template>

<style lang="scss" scoped></style>
