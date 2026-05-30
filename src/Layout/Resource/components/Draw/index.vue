<script lang="ts" setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { getUrlParams } from '@/utils'
import { useDrawStore } from '@/stores/module/draw.ts'
import emitter from '@/utils/eventBus.ts'
import type { ProjectMonitorDraw, ProjectMonitorVo } from '@/model/draw'
import { s16 } from '@meta2d/core'
import { useLayerStore } from '@/stores/module/layer.ts'
import { isDrawEditDirty } from '@/utils/drawEditState.ts'
import { saveCurrentDraw, switchDrawByUid } from '@/utils/switchDraw.ts'

const layerStore = useLayerStore()
const drawStore = useDrawStore()
const data = ref<ProjectMonitorVo>({
  categoryVoList: [],
  defCategory: {},
  defDraw: {},
})
const currentDrawValue = ref('')
const key = ref(s16())
const menuDrawUid = ref('')
const showSwitchConfirm = ref(false)
const pendingSwitchUid = ref('')
const switchSaving = ref(false)

watch(
  () => drawStore.draw?.uid,
  (uid) => {
    menuDrawUid.value = uid || ''
  },
  { immediate: true },
)

onMounted(() => {
  select()
  emitter.on('updateDraw', () => {
    select()
  })
})

function select() {
  const params = getUrlParams()
  MonitorDrawService.select(params.projectUid)
    .then((res) => {
      data.value = res
    })
    .finally(async () => {
      if (!drawStore.draw || !currentDrawValue.value) {
        currentDrawValue.value = data.value.defDraw.uid
        drawStore.draw = data.value.defDraw
        await layerStore.ensureDefaultLayer(drawStore.draw.uid, drawStore.draw.projectUid)
        await nextTick()
        emitter.emit('draw')
        key.value = s16()
      }
    })
}

function onMenuUpdate(nextUid: string) {
  const currentUid = drawStore.draw?.uid
  if (!nextUid || nextUid === currentUid) return
  pendingSwitchUid.value = nextUid
  if (
    isDrawEditDirty(drawStore.draw?.data, drawStore.draw?.uid, {
      referencePreviewUid: drawStore.referencePreviewUid,
      editContextDrawData: drawStore.editContextDrawData,
    })
  ) {
    showSwitchConfirm.value = true
    menuDrawUid.value = currentUid || ''
    return
  }
  void switchDrawByUid(nextUid, drawStore, layerStore)
}

function cancelSwitch() {
  showSwitchConfirm.value = false
  pendingSwitchUid.value = ''
  menuDrawUid.value = drawStore.draw?.uid || ''
}

async function switchWithoutSave() {
  const nextUid = pendingSwitchUid.value
  showSwitchConfirm.value = false
  pendingSwitchUid.value = ''
  if (!nextUid) return
  await switchDrawByUid(nextUid, drawStore, layerStore)
}

async function switchWithSave() {
  const nextUid = pendingSwitchUid.value
  if (!nextUid || !drawStore.draw?.uid) return
  switchSaving.value = true
  try {
    await saveCurrentDraw(drawStore)
    showSwitchConfirm.value = false
    pendingSwitchUid.value = ''
    await switchDrawByUid(nextUid, drawStore, layerStore)
  } finally {
    switchSaving.value = false
  }
}
</script>

<template>
  <n-menu
    class="resource-menu"
    :key="key"
    :options="data.categoryVoList"
    label-field="name"
    key-field="uid"
    children-field="drawList"
    :value="menuDrawUid"
    @update:value="onMenuUpdate"
    default-expand-all
  />
  <n-modal
    v-model:show="showSwitchConfirm"
    preset="card"
    title="切换图纸"
    style="width: 420px"
    :mask-closable="false"
  >
    <p class="switch-draw-tip">当前图纸有未保存的修改，切换前是否保存？</p>
    <template #footer>
      <div class="switch-draw-actions">
        <n-button @click="cancelSwitch">取消</n-button>
        <n-button @click="switchWithoutSave">不保存</n-button>
        <n-button type="primary" :loading="switchSaving" @click="switchWithSave">保存</n-button>
      </div>
    </template>
  </n-modal>
</template>

<style lang="scss" scoped>
.resource-menu {
  --n-item-height: 38px;
  --n-item-color-active: transparent;
  --n-item-text-color-active: #0f172a;
  --n-item-icon-color-active: #0f172a;
  --n-arrow-color: #64748b;
}

.switch-draw-tip {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #475569;
}

.switch-draw-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
