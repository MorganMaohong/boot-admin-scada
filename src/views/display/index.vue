<template>
  <div id="meta2d" v-if="showMeta2d" />
  <div v-else class="flex justify-center items-center w-full h-full">
    <Svg404 class="max-w-[32rem] max-h-[32rem] w-full h-full" />
  </div>
  <DisplayModal
    class="control-var-modal"
    :class="{ 'control-var-modal--mobile': drawStore.isMobile }"
    :show="showControlVar"
    title="变量控制"
    :width="drawStore.isMobile ? '84%' : '400px'"
    :height="drawStore.isMobile ? 'calc(100vh - 8px)' : undefined"
    :mask-closable="false"
    :closable="drawStore.isMobile"
    @update:show="showControlVar = $event"
  >
    <template v-if="showControlVar">
      <div class="control-var-form" :class="{ 'control-var-form--mobile': drawStore.isMobile }">
        <label class="control-var-field">
          <span class="control-var-label">变量</span>
          <input
            :value="controlVarDisplayName"
            class="control-var-input control-var-input--readonly"
            readonly
          />
        </label>
        <label class="control-var-field">
          <span class="control-var-label">变量值</span>
          <input
            v-model="controlVarFormData.value"
            :readonly="drawStore.isMobile"
            class="control-var-input"
            placeholder="请输入要写入的值"
            @click="drawStore.isMobile && openMobileKeypad()"
            @keydown.enter.prevent="writeVar"
          />
        </label>
      </div>
      <div v-if="drawStore.isMobile && showKey" class="control-var-keypad" @dblclick.prevent>
        <div class="control-var-keypad__keys">
          <button type="button" class="control-var-keypad__key" @click="onInput('1')">1</button>
          <button type="button" class="control-var-keypad__key" @click="onInput('2')">2</button>
          <button type="button" class="control-var-keypad__key" @click="onInput('3')">3</button>
          <button
            type="button"
            class="control-var-keypad__key control-var-keypad__key--delete"
            aria-label="删除"
            @click="onDelete"
          >
            ⌫
          </button>
          <button type="button" class="control-var-keypad__key" @click="onInput('4')">4</button>
          <button type="button" class="control-var-keypad__key" @click="onInput('5')">5</button>
          <button type="button" class="control-var-keypad__key" @click="onInput('6')">6</button>
          <button type="button" class="control-var-keypad__key" @click="toggleSign">+/-</button>
          <button type="button" class="control-var-keypad__key" @click="onInput('7')">7</button>
          <button type="button" class="control-var-keypad__key" @click="onInput('8')">8</button>
          <button type="button" class="control-var-keypad__key" @click="onInput('9')">9</button>
          <button type="button" class="control-var-keypad__key" @click="onInput('.')">.</button>
          <button
            type="button"
            class="control-var-keypad__key control-var-keypad__key--zero"
            @click="onInput('0')"
          >
            0
          </button>
          <button
            type="button"
            class="control-var-keypad__key control-var-keypad__key--confirm"
            :disabled="controlVarSubmitting || !canSubmitControlVar"
            @click="writeVar"
          >
            {{ controlVarSubmitting ? '处理中...' : '确定' }}
          </button>
        </div>
      </div>
    </template>
    <template v-if="!drawStore.isMobile" #footer>
      <div class="control-var-actions">
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
import { isScreenPreviewMode } from '@/utils/displayAccess'
import { mqttUtil } from '@/utils/mqttUtil.ts'
import emitter from '@/utils/eventBus.ts'
import { VarService } from '@/services/VarService.ts'
import { useDrawStore } from '@/stores/module/draw.ts'
import { useDrawPopupStore } from '@/stores/module/drawPopup.ts'
import { useDisplayLabels } from '@/components/ElementsProps/useDisplayLabels.ts'
import Svg404 from '@/assets/error-page/404.svg?component'
import DrawPopupHost from '@/components/DrawPopupHost/index.vue'
import DisplayModal from '@/components/DisplayModal.vue'
import { installMeta2dSafetyGuards } from '@/utils/meta2dPens.ts'
import { registerScadaPens } from '@/meta2d/scadaPens.ts'

const drawStore = useDrawStore()
const drawPopupStore = useDrawPopupStore()
const { variableLabels } = useDisplayLabels()
const meta2dOptions: any = {
  rule: true,
}
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
const fitViewTimer = ref(0)
let fullscreenChangeHandler: (() => void) | null = null
let controlVarHandler:
  | ((payload: { pen?: { value?: string | number | null }; params: { key: string } }) => void)
  | null = null
const canSubmitControlVar = computed(() => {
  const value = controlVarFormData.value.value
  return value !== undefined && value !== null && String(value).trim() !== ''
})
const controlVarDisplayName = computed(() => {
  const key = controlVarFormData.value.key
  if (!key) return ''
  return variableLabels.value[String(key)] || key
})
const keypadFresh = ref(true)
let metaRegistered = false

function runFitView(delay = 0) {
  if (fitViewTimer.value) clearTimeout(fitViewTimer.value)
  fitViewTimer.value = window.setTimeout(() => {
    meta2d.fitView(true, 5)
  }, delay)
}

function resize() {
  if (resizeTimer.value) clearTimeout(resizeTimer.value)
  resizeTimer.value = window.setTimeout(() => {
    runFitView()
  }, 200)
}

onMounted(() => {
  detectWeChatMiniProgram()
  const params = getUrlParams()
  const screenPreview = isScreenPreviewMode()
  if (!screenPreview) {
    drawStore.setTitle()
  }
  MonitorDrawService.display(params.projectUid)
    .then((data) => {
      monitorDraw.value = data
      drawStore.topics = monitorDraw.value.topics
      drawStore.snList = monitorDraw.value.snList
      if (screenPreview && data.projectName) {
        document.title = data.projectName
      }
      try {
        init()
        if (screenPreview && data.varCacheData) {
          drawStore.cacheData = { data: data.varCacheData }
          drawStore.process(drawStore.cacheData)
        }
      } catch (error) {
        console.error('[scada-display] 初始化失败', error)
        window.$message?.error('组态画面初始化失败，请检查控制台错误')
      }
    })
    .catch((error) => {
      console.error('[scada-display] 加载画面失败', error)
      showMeta2d.value = false
    })
  window.addEventListener('resize', resize)
  if (!screenPreview) {
    controlVarHandler = ({ pen, params }) => {
      showControlVar.value = true
      controlVarFormData.value = {
        key: params.key,
        value: pen?.value !== undefined && pen?.value !== null ? String(pen.value) : '',
        currentValue: pen?.value !== undefined && pen?.value !== null ? String(pen.value) : '',
      }
      keypadFresh.value = true
      showKey.value = drawStore.isMobile
    }
    emitter.on('showControlVar', controlVarHandler)
  }
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
  controlVarFormData.value.value = keypadFresh.value
    ? String(val)
    : `${controlVarFormData.value.value}${String(val)}`
  keypadFresh.value = false
}

function onDelete() {
  controlVarFormData.value.value = controlVarFormData.value.value.slice(0, -1)
  keypadFresh.value = false
}

function toggleSign() {
  const value = controlVarFormData.value.value
  if (!value) return
  controlVarFormData.value.value = value.startsWith('-') ? value.slice(1) : `-${value}`
  keypadFresh.value = false
}

function openMobileKeypad() {
  keypadFresh.value = true
  showKey.value = true
}

function closeControlVar() {
  showKey.value = false
  showControlVar.value = false
}

function init() {
  if (!monitorDraw.value?.draw?.data) {
    showMeta2d.value = false
    return
  }

  new Meta2d('meta2d', meta2dOptions)
  installMeta2dSafetyGuards()

  if (!metaRegistered) {
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
    metaRegistered = true
  }
  // Meta2d 每次新建实例都会重置内置 gif 路径，需要重新覆盖为 Canvas GIF。
  registerScadaPens()

  const data = JSON.parse(monitorDraw.value.draw.data)
  data.locked = LockState.DisableEdit
  data.disableScale = !drawStore.isMobile
  data.disableTranslate = !drawStore.isMobile
  data.rule = false
  meta2d.setOptions({ disableRuleLine: true })
  meta2d.open(data)

  setDefVisible()
  runFitView()
  fullscreenChangeHandler = () => {
    runFitView(200)
  }
  document.addEventListener('fullscreenchange', fullscreenChangeHandler)
  if (!isScreenPreviewMode()) {
    drawStore.selectVarCacheData()
  }
  window.setTimeout(() => {
    listenerMqtt()
  }, 250)

  meta2d.on('active', () => {
    meta2d.inactive()
  })

  meta2d.on('enter', (pen) => {
    pen.calculative.hover = false
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
  if (resizeTimer.value) clearTimeout(resizeTimer.value)
  if (fitViewTimer.value) clearTimeout(fitViewTimer.value)
  meta2d.destroy()
  if (controlVarHandler) {
    emitter.off('showControlVar', controlVarHandler)
  }
  if (fullscreenChangeHandler) {
    document.removeEventListener('fullscreenchange', fullscreenChangeHandler)
  }
  monitorDraw.value?.topics?.forEach((topic) => {
    mqttUtil.doUnSubscribe(topic)
  })
  mqttUtil.destroyConnection()
  window.removeEventListener('resize', resize)
})
</script>

<style lang="scss" scoped>
#meta2d {
  height: 100vh;
  width: 100%;
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
  min-width: 0;
  flex: 1;
}

.control-var-form--mobile {
  flex-direction: row;
  gap: 16px;
  margin: 0;
  padding: 10px 12px 12px;
  background: #fff;
}

.control-var-form--mobile .control-var-field {
  width: 0;
  flex: 1 1 0;
}

.control-var-form--mobile .control-var-label {
  font-size: 14px;
  color: #334155;
}

.control-var-form--mobile .control-var-input {
  min-height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  font-size: 16px;
}

.control-var-form--mobile .control-var-field:last-child .control-var-input {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.control-var-label {
  font-size: 13px;
  line-height: 1.4;
  color: #475569;
}

.control-var-input {
  box-sizing: border-box;
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

.control-var-keypad {
  margin-top: 6px;
  padding: 8px 12px 10px;
  border-radius: 12px;
  background: #f1f5f9;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

:global(.display-modal.control-var-modal--mobile .display-modal__panel) {
  width: 94vw !important;
  height: calc(100vh - 8px) !important;
  max-height: calc(100vh - 8px) !important;
}

:global(.display-modal.control-var-modal--mobile .display-modal__body) {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  padding: 6px 8px 8px;
  overflow: hidden;
}

:global(.display-modal.control-var-modal--mobile .display-modal__header) {
  position: relative;
  justify-content: center;
  padding: 6px 12px;
}

:global(.display-modal.control-var-modal--mobile .display-modal__title) {
  flex: none;
  text-align: center;
  font-size: 18px;
}

:global(.display-modal.control-var-modal--mobile .display-modal__close) {
  position: absolute;
  right: 14px;
}

.control-var-keypad__keys {
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.control-var-keypad__key {
  min-height: 0;
  height: auto;
  border: 0;
  border-radius: 10px;
  background: #fff;
  color: #0f172a;
  font-size: 21px;
  line-height: 1;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.control-var-keypad__key:active {
  background: #dbeafe;
}

.control-var-keypad__key--delete {
  font-size: 24px;
}

.control-var-keypad__key--zero {
  grid-column: span 3;
}

.control-var-keypad__key--confirm {
  background: #2563eb;
  color: #fff;
  font-size: 16px;
}

.control-var-keypad__key--confirm:disabled {
  opacity: 0.55;
}

.control-var-modal--mobile .control-var-keypad {
  display: flex;
  flex: 1;
  min-height: 0;
  width: auto;
  margin: 6px 0 0;
}

@media (max-height: 480px) {
  .control-var-form--mobile {
    gap: 8px;
    padding: 4px 8px 6px;
  }

  .control-var-form--mobile .control-var-label {
    font-size: 12px;
  }

  .control-var-form--mobile .control-var-input {
    min-height: 32px;
    padding: 4px 8px;
    font-size: 14px;
  }

  .control-var-keypad {
    padding: 6px 8px 8px;
  }

  .control-var-keypad__keys {
    gap: 6px;
  }
}
</style>
