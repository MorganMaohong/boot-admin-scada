<template>
  <div id="meta2d"></div>
  <DisplayModal
    :show="showControlVar"
    title="变量控制"
    width="500px"
    :mask-closable="false"
    @update:show="showControlVar = $event"
  >
    <div class="control-var-form">
      <label class="control-var-field">
        <span class="control-var-label">变量</span>
        <input :value="controlVarFormData.key" class="control-var-input control-var-input--readonly" readonly />
      </label>
      <label class="control-var-field">
        <span class="control-var-label">变量值</span>
        <input
          v-model="controlVarFormData.value"
          :readonly="drawStore.isMobile"
          class="control-var-input"
          placeholder="请输入要写入的值"
          @click="drawStore.isMobile && (showKey = true)"
          @keydown.enter.prevent="writeVar"
        />
      </label>
    </div>
    <van-number-keyboard
      v-if="drawStore.isMobile"
      :show="showKey"
      @input="onInput"
      @delete="onDelete"
      extra-key="."
      close-button-text="完成"
      @close="showKey = false"
    />
    <template #footer>
      <div class="control-var-actions" :class="{ 'control-var-actions--mobile': drawStore.isMobile }">
        <button type="button" class="control-var-button" @click="closeControlVar">取消</button>
        <button
          type="button"
          class="control-var-button control-var-button--primary"
          :disabled="controlVarSubmitting || !canSubmitControlVar"
          @click="writeVar"
        >
          {{ controlVarSubmitting ? '处理中...' : '确定' }}
        </button>
      </div>
    </template>
  </DisplayModal>
  <DrawPopupHost v-if="drawPopupStore.show" />
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'
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
import { type DataForm, ValueTypeEnum } from '@/model/drawData.ts'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { getUrlParams } from '@/utils'
import { mqttUtil } from '@/utils/mqttUtil.ts'
import emitter from '@/utils/eventBus.ts'
import { VarService } from '@/services/VarService.ts'
import { useDrawStore } from '@/stores/module/draw.ts'
import { useDrawPopupStore } from '@/stores/module/drawPopup.ts'
import DrawPopupHost from '@/components/DrawPopupHost/index.vue'
import DisplayModal from '@/components/DisplayModal.vue'
import { installMeta2dSafetyGuards } from '@/utils/meta2dPens.ts'

const drawStore = useDrawStore()
const drawPopupStore = useDrawPopupStore()
const VanNumberKeyboard = defineAsyncComponent(async () => {
  await import('vant/lib/index.css')
  const mod = await import('vant')
  return mod.NumberKeyboard
})
const monitorDraw = ref()
const meta2dOptions: any = {
  rule: true,
}
const showKey = ref(false)
const showControlVar = ref(false)
const controlVarFormData = ref({
  key: '',
  value: '',
  currentValue: '',
})
const controlVarSubmitting = ref(false)
const resizeTimer = ref(0)
const canSubmitControlVar = computed(() => {
  const value = controlVarFormData.value.value
  return value !== undefined && value !== null && String(value).trim() !== ''
})

function resize() {
  if (resizeTimer.value) clearTimeout(resizeTimer.value)
  resizeTimer.value = window.setTimeout(() => {
    meta2d.fitView(true, 5)
  }, 200)
}

watch(
  () => drawStore.globalModal.show,
  () => {
    window.addEventListener('resize', resize)
  },
)

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
  new Meta2d('meta2d', meta2dOptions)
  installMeta2dSafetyGuards()

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

  const data = JSON.parse(monitorDraw.value.draw.data)
  data.locked = 1
  data.disableScale = true
  data.disableTranslate = true
  data.rule = false
  meta2d.setOptions({ disableRuleLine: true })
  meta2d.open(data)
  setDefVisible()

  meta2d.fitView(true, 0)

  document.addEventListener('fullscreenchange', () => {
    setTimeout(() => {
      meta2d.fitView(true, 0)
    }, 200)
  })

  drawStore.selectVarCacheData()
  listenerMqtt()

  meta2d.on('active', () => {
    meta2d.inactive()
  })
  meta2d.on('enter', (pen) => {
    pen.calculative.hover = false
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
  const allChildIds = new Set<string>()
  pens.forEach((pen) => {
    if (pen.children) {
      pen.children.forEach((child) => allChildIds.add(child))
    }
  })

  pens.forEach((pen) => {
    if (allChildIds.has(pen.id)) return
    if (pen.visible === false) return
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
    if (!payload) return
    meta2d.data().pens.forEach((pen) => {
      if (!pen) return
      if (!pen.key) return
      drawStore.cacheData = { ...drawStore.cacheData, ...payload }
      drawStore.process(drawStore.cacheData)
    })
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

.control-var-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.control-var-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-var-label {
  font-size: 13px;
  line-height: 1.4;
  color: #475569;
}

.control-var-input {
  width: 100%;
  min-height: 40px;
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.4;
  color: #0f172a;
  background: #fff;
  outline: none;
}

.control-var-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.control-var-input--readonly {
  background: #f8fafc;
  color: #64748b;
}

.control-var-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.control-var-actions--mobile {
  gap: 8px;
}

.control-var-button {
  min-width: 76px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  font-size: 14px;
}

.control-var-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.control-var-button--primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}
</style>
