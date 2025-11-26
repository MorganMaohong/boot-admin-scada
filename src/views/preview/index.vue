<template>
  <div id="meta2d"></div>
  <template v-if="drawStore.isMobile">
    <n-modal
      v-model:show="showControlVar"
      preset="card"
      title="变量控制"
      :mask-closable="false"
      style="width: 500px"
    >
      <n-form-item label="变量">
        <GatewayVarSelect v-model:model-value="controlVarFormData.key" disabled />
      </n-form-item>
      <n-form-item>
        <n-input v-model:value="controlVarFormData.value" readonly @click="showKey = true" />
      </n-form-item>
      <van-number-keyboard
        :show="showKey"
        @input="onInput"
        @delete="onDelete"
        extra-key="."
        close-button-text="完成"
        @close="showKey = false"
      />
      <template #footer>
        <div class="flex justify-end">
          <n-button @click="writeVar" type="primary">确定</n-button>
        </div>
      </template>
    </n-modal>
  </template>
  <template v-else>
    <n-modal
      v-model:show="showControlVar"
      preset="card"
      title="变量控制"
      :mask-closable="false"
      style="width: 500px"
    >
      <n-form-item label="变量">
        <GatewayVarSelect v-model:model-value="controlVarFormData.key" disabled />
      </n-form-item>
      <n-form-item>
        <n-input v-model:value="controlVarFormData.value" />
      </n-form-item>
      <template #footer>
        <div class="flex justify-end">
          <n-button @click="writeVar" type="primary">确定</n-button>
        </div>
      </template>
    </n-modal>
  </template>
  <n-modal
    v-model:show="drawStore.globalModal.show"
    title="全局弹窗测试"
    preset="card"
    :style="{
      width: drawStore.globalModal.width + 'px',
      height: drawStore.globalModal.height  + 'px',
    }"
    :mask-closable="false"
  >
    <GlobalModalMeta2d />
  </n-modal>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import {
  LockState,
  Meta2d,
  type Pen,
  register,
  registerAnchors,
  registerCanvasDraw,
  setHover,
} from '@meta2d/core'
import { flowAnchors, flowPens } from '@meta2d/flow-diagram'
import { activityDiagram, activityDiagramByCtx } from '@meta2d/activity-diagram'
import { classPens } from '@meta2d/class-diagram'
import { sequencePens, sequencePensbyCtx } from '@meta2d/sequence-diagram'
import { register as registerEcharts } from '@meta2d/chart-diagram'
import { formPens } from '@meta2d/form-diagram'
import { chartsPens } from '@meta2d/le5le-charts'
import { ftaAnchors, ftaPens, ftaPensbyCtx } from '@meta2d/fta-diagram'
import type { Payload } from '@/model'
import { type DataForm, ValueTypeEnum } from '@/components/ElementsProps/model'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { getUrlParams } from '@/utils'
import { useMessage } from 'naive-ui'
import { mqttUtil } from '@/utils/mqttUtil.ts'
import emitter from '@/utils/eventBus.ts'
import GatewayVarSelect from '@/components/ElementsProps/components/GatewayVarSelect/index.vue'
import { VarService } from '@/services/VarService.ts'
import { useDrawStore } from '@/stores/module/draw.ts'
import GlobalModalMeta2d from '@/components/GlobalModalMeta2d/index.vue'

const drawStore = useDrawStore()
window['$message'] = useMessage()

const monitorDraw = ref()
const meta2dOptions: any = {
  rule: true,
}
const showKey = ref(false)
const showControlVar = ref(false)
const controlVarFormData = ref({})
onMounted(() => {
  detectWeChatMiniProgram()
  drawStore.setTitle()
  const params = getUrlParams()
  MonitorDrawService.display(params.projectUid).then((data) => {
    monitorDraw.value = data
    drawStore.topics = monitorDraw.value.topics
    drawStore.snList = monitorDraw.value.snList
    init()
  })
  emitter.on('showControlVar', ({ pen, params }) => {
    showControlVar.value = true
    console.log('接收到 pen:', pen)
    console.log('接收到 params:', params)
    controlVarFormData.value = {
      key: params.key,
      value: '',
    }
  })
})

function onInput(val: string) {
  controlVarFormData.value.value += String(val)
}

function onDelete() {
  controlVarFormData.value.value = controlVarFormData.value.value.slice(0, -1)
}

function init() {
  // 创建实例
  new Meta2d('meta2d', meta2dOptions)

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
  meta2d.setOptions({ disableRuleLine: true })
  meta2d.open(data)
  setDefVisible()

  meta2d.fitView(true, 5)

  document.addEventListener('fullscreenchange', () => {
    setTimeout(() => {
      meta2d.fitView(true, 5)
    }, 200)
  })

  drawStore.selectVarCacheData()
  listenerMqtt()

  meta2d.on('active', (pens) => {
    meta2d.inactive()
    return
  })
  meta2d.on('enter', (pen) => {
    pen.calculative.hover = false
    return
  })
}

function detectWeChatMiniProgram() {
  if ((window as any).__wxjs_environment === 'miniprogram') {
    drawStore.isMobile = true
  }

  document.addEventListener('WeixinJSBridgeReady', function () {
    drawStore.isMobile = (window as any).__wxjs_environment === 'miniprogram'
  })
}

function setDefVisible() {
  const pens = meta2d.data().pens

  // 收集所有组合图元的子图元 ID
  const allChildIds = new Set<string>()
  pens.forEach((pen) => {
    if (pen.children) {
      pen.children.forEach((child) => allChildIds.add(child))
    }
  })

  pens.forEach((pen) => {
    // 如果是子图元，就跳过，不处理它的 visible
    if (allChildIds.has(pen.id)) return
    // 如果pen 已经被隐藏则不需要设置默认隐藏状态
    if (pen.visible === false) return
    // 否则，设置它自己的 visible 状态
    meta2d.setValue({ id: pen.id, visible: pen.defVisible }, { render: true })
  })
}

function listenerMqtt() {
  mqttUtil.createConnection()
  monitorDraw.value.topics.forEach((topic) => {
    mqttUtil.doSubscribe(topic, 0)
  })
  listenerData()
}

function listenerData() {
  if (!mqttUtil.client.value) return
  mqttUtil.client?.value.on('message', (topic: string, message) => {
    // debugger
    const payload: Payload = JSON.parse(message.toString())
    console.log(payload)
    if (!payload) return
    console.log(meta2d.data().pens)
    meta2d.data().pens.forEach((pen) => {
      // debugger
      if (!pen) return
      if (!pen.key) return
      drawStore.cacheData = { ...drawStore.cacheData, ...payload }
      drawStore.process(drawStore.cacheData)
    })
  })
}

function writeVar() {
  VarService.write(controlVarFormData.value.key, controlVarFormData.value.value).then(() => {
    showControlVar.value = false
  })
}

onUnmounted(() => {
  meta2d.destroy()
  monitorDraw.value.topics.forEach((topic) => {
    mqttUtil.doUnSubscribe(topic)
  })
  mqttUtil.destroyConnection()
})
</script>
<style lang="scss" scoped>
#meta2d {
  height: 100vh;
  width: 100vw;
  z-index: 1;
  overflow: hidden;
}
</style>
