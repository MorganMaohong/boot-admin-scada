<template>
  <div id="meta2d" v-if="showMeta2d" />
  <div class="flex justify-center items-center w-full h-full" v-else>
    <Svg404 class="max-w-[32rem] max-h-[32rem] w-full h-full" />
  </div>
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
      <n-form-item label="变量值">
        <n-input
          v-model:value="controlVarFormData.value"
          readonly
          placeholder="请输入要写入的值"
          @click="showKey = true"
        />
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
          <n-button @click="closeControlVar">取消</n-button>
          <n-button
            @click="writeVar"
            type="primary"
            class="ml-2"
            :loading="controlVarSubmitting"
            :disabled="!canSubmitControlVar"
          >
            确定
          </n-button>
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
      <n-form-item label="变量值">
        <n-input
          v-model:value="controlVarFormData.value"
          placeholder="请输入要写入的值"
          @keydown.enter.prevent="writeVar"
        />
      </n-form-item>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="closeControlVar">取消</n-button>
          <n-button
            @click="writeVar"
            type="primary"
            class="ml-2"
            :loading="controlVarSubmitting"
            :disabled="!canSubmitControlVar"
          >
            确定
          </n-button>
        </div>
      </template>
    </n-modal>
  </template>
  <div v-if="drawStore.globalModal.show">
    <n-modal
      v-model:show="drawStore.globalModal.show"
      :title="drawStore.globalModal.draw.title"
      preset="card"
      :style="modalStyle"
      content-style="padding: 0;"
      transform-origin="center"
      :mask-closable="false"
      :show-mask="false"
    >
      <GlobalModalMeta2d />
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { LockState, Meta2d, register, registerAnchors, registerCanvasDraw } from '@meta2d/core'
import { flowAnchors, flowPens } from '@meta2d/flow-diagram'
import { activityDiagram, activityDiagramByCtx } from '@meta2d/activity-diagram'
import { classPens } from '@meta2d/class-diagram'
import { sequencePens, sequencePensbyCtx } from '@meta2d/sequence-diagram'
import { register as registerEcharts } from '@meta2d/chart-diagram'
import { formPens } from '@meta2d/form-diagram'
import { chartsPens } from '@meta2d/le5le-charts'
import { ftaAnchors, ftaPens, ftaPensbyCtx } from '@meta2d/fta-diagram'
import type { Payload } from '@/model'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { getUrlParams } from '@/utils'
import { useMessage } from 'naive-ui'
import { mqttUtil } from '@/utils/mqttUtil.ts'
import emitter from '@/utils/eventBus.ts'
import GatewayVarSelect from '@/components/ElementsProps/components/GatewayVarSelect/index.vue'
import { VarService } from '@/services/VarService.ts'
import { useDrawStore } from '@/stores/module/draw.ts'
import Svg404 from '@/assets/error-page/404.svg?component'
import GlobalModalMeta2d from '@/components/GlobalModalMeta2d/index.vue' // vite-svg-loader 插件的功能

const drawStore = useDrawStore()
window['$message'] = useMessage()
const meta2dOptions: any = {
  rule: true,
}
const modalStyle = computed(() => ({
  width: drawStore.globalModal.draw.width + 'px',
  height: drawStore.globalModal.draw.height + 'px',
}))
const showKey = ref(false)
const monitorDraw = ref()
const showControlVar = ref(false)
const controlVarFormData = ref({
  key: '',
  value: '',
  currentValue: '',
})
const controlVarSubmitting = ref(false)
const showMeta2d = ref(true)
const resizeTimer = ref(0)
const canSubmitControlVar = computed(() => {
  const value = controlVarFormData.value.value
  return value !== undefined && value !== null && String(value).trim() !== ''
})

function resize() {
  console.log('xxxxx')
  if (resizeTimer.value) clearTimeout(resizeTimer.value)

  resizeTimer.value = window.setTimeout(() => {
    console.log('移动完成')
    // window.$message.error('移动完成!!')
    meta2d.fitView(true, 5)
  }, 200)
}

onMounted(() => {
  detectWeChatMiniProgram()
  drawStore.setTitle()
  const params = getUrlParams()
  MonitorDrawService.display(params.projectUid)
    .then((data) => {
      monitorDraw.value = data
      drawStore.topics = monitorDraw.value.topics
      drawStore.snList = monitorDraw.value.snList
      init()
    })
    .catch(() => {
      showMeta2d.value = false
    })
  window.addEventListener('resize', resize)
  emitter.on('showControlVar', ({ pen, params }) => {
    showControlVar.value = true
    controlVarFormData.value = {
      key: params.key,
      value: pen?.value !== undefined && pen?.value !== null ? String(pen.value) : '',
      currentValue: pen?.value !== undefined && pen?.value !== null ? String(pen.value) : '',
    }
  })
})

function detectWeChatMiniProgram() {
  if ((window as any).__wxjs_environment === 'miniprogram') {
    drawStore.isMobile = true
  }

  document.addEventListener('WeixinJSBridgeReady', function () {
    drawStore.isMobile = (window as any).__wxjs_environment === 'miniprogram'
  })
}

function onInput(val: string) {
  controlVarFormData.value.value += String(val)
}

function onDelete() {
  controlVarFormData.value.value = controlVarFormData.value.value.slice(0, -1)
}

function closeControlVar() {
  showKey.value = false
  showControlVar.value = false
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
  let data = JSON.parse(monitorDraw.value.draw.data)
  data.locked = LockState.DisableEdit
  data.disableScale = !drawStore.isMobile
  data.disableTranslate = !drawStore.isMobile
  data.rule = false
  meta2d.setOptions({ disableRuleLine: true })
  meta2d.open(data)

  setDefVisible()
  // meta2d.fitView(false, 0)
  meta2d.fitView(true, 5)
  // meta2d.centerView()
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
    const payload: Payload = JSON.parse(message.toString())
    console.log(payload)
    if (!payload) return
    drawStore.cacheData = { ...drawStore.cacheData, ...payload }
    drawStore.process(drawStore.cacheData)
  })
}

function writeVar() {
  if (!canSubmitControlVar.value || controlVarSubmitting.value) return
  controlVarSubmitting.value = true
  VarService.write(controlVarFormData.value.key, controlVarFormData.value.value)
    .then(() => {
      closeControlVar()
    })
    .finally(() => {
      controlVarSubmitting.value = false
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
