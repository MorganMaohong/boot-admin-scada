<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { deepClone, LockState, s16 } from '@meta2d/core'
import { ColorPicker } from 'vue3-colorpicker'
import emitter from '@/utils/eventBus.ts'
import { SelectionMode, useSelection } from '@/services/selections.ts'
import StructureTree from '@/components/StructureTree/index.vue'
import { useDrawStore } from '@/stores/module/draw.ts'
import {
  cleanupMeta2dPens,
  collectValidMeta2dPens,
  getRuntimeMeta2dPen,
  removeMeta2dPens,
} from '@/utils/meta2dPens.ts'

const { select, selections, selects } = useSelection()
const drawStore = useDrawStore()

// 图纸数据
const pens = ref<any[]>([])
const data = ref({
  grid: false,
  gridSize: 20,
  gridRotate: 0,
  gridColor: '',
  name: '',
  background: '',
  color: '',
  ruleColor: '',
})

// 画布选项
const options = ref({
  rule: false,
  background: '',
  ruleColor: '',
})
const tabPaneRef = ref()
const maxTabPaneHeightRef = ref(0)
const key = ref('0')
const activeTab = ref('file')
const structureTreeScrollVersion = ref(0)
onMounted(() => {
  emitter.on('draw', init)
  emitter.on('reloadDraw', init)
  emitter.on('pensSorted', handleSorted)
  if (!selections.pen && selections.mode === SelectionMode.File && meta2d.store) init()
  if (tabPaneRef.value) maxTabPaneHeightRef.value = tabPaneRef.value.$el.clientHeight - 20
})

function init() {
  key.value = ''
  activeTab.value = 'file'
  cleanupMeta2dPens({ render: false })
  data.value = deepClone(meta2d.store.data)
  syncPens()
  options.value = deepClone(meta2d.store.options)
  options.value.ruleColor = data.value.ruleColor
  key.value = s16()
}

function syncPens() {
  pens.value = [...collectValidMeta2dPens(meta2d.data().pens || []).pens]
}

function setRuleData() {
  meta2d.setRule({ rule: data.value.rule })
  meta2d.render()
}

function setGridData() {
  meta2d.setGrid(data.value)
  meta2d.render()
}

function setBackgroundColor(v: string) {
  meta2d.setBackgroundColor(v)
  meta2d.render()
}

function setData(v: any, prop: string) {
  meta2d.store.data[prop] = v
  meta2d.render()
}

function onCheckPen(pen) {
  const currentPen = getRuntimeMeta2dPen(pen)
  if (!currentPen) return
  meta2d.active([currentPen])
  meta2d.render()
  select([currentPen])
}

function findPenIndex(pen: any) {
  return pens.value.findIndex((item: any) => item?.id === pen?.id)
}

function changeVisible(pen) {
  const currentPen = getRuntimeMeta2dPen(pen)
  if (!currentPen) {
    syncPens()
    return
  }
  const index = findPenIndex(currentPen)
  let v = false
  if (currentPen.visible == false || currentPen.visible == true) {
    v = !currentPen.visible
  }
  meta2d.setValue({ id: currentPen.id, visible: v }, { render: true })
  if (index >= 0) updatePenProp(index, 'visible', v)
}

function removePen(pen) {
  const currentPen = getRuntimeMeta2dPen(pen)
  if (!currentPen) {
    syncPens()
    return
  }
  const index = findPenIndex(currentPen)
  removeMeta2dPens([currentPen], { render: true })
  if (index >= 0) {
    pens.value.splice(index, 1)
  }
  emitter.emit('pensSorted')
}

function changeLocked(pen) {
  const currentPen = getRuntimeMeta2dPen(pen)
  if (!currentPen) {
    syncPens()
    return
  }
  const index = findPenIndex(currentPen)
  if (currentPen.locked === LockState.None) {
    currentPen.locked = LockState.DisableEdit
    if (index >= 0) {
      pens.value[index]['locked'] = LockState.DisableEdit
      updatePenProp(index, 'locked', LockState.DisableEdit)
    }
  } else if (currentPen.locked === LockState.DisableEdit) {
    currentPen.locked = LockState.Disable
    if (index >= 0) {
      pens.value[index]['locked'] = LockState.Disable
      updatePenProp(index, 'locked', LockState.Disable)
    }
  } else if (currentPen.locked === LockState.Disable) {
    currentPen.locked = LockState.None
    if (index >= 0) updatePenProp(index, 'locked', LockState.None)
  }
  meta2d.setValue({ id: currentPen.id, locked: currentPen.locked }, { render: true })
}

function updatePenProp(index: number, key: string, value: any) {
  pens.value[index] = {
    ...pens.value[index],
    [key]: value,
  }
}

function updateTabs(key: string) {
  switch (key) {
    case 'struct':
      syncPens()
      structureTreeScrollVersion.value += 1
      break
  }
}

function handleSorted() {
  syncPens()
}

onUnmounted(() => {
  emitter.off('draw', init)
  emitter.off('reloadDraw', init)
  emitter.off('pensSorted', handleSorted)
})

const getPens = computed(() => {
  if (pens.value) {
    return pens.value.filter((item) => item)
  } else {
    return []
  }
})
</script>

<template>
  <div class="file-props">
    <n-tabs v-model:value="activeTab" :key="key" class="file-props__tabs" @update:value="updateTabs">
      <n-tab-pane tab="图纸" name="file" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar class="file-props__scroll" :style="{ maxHeight: `${maxTabPaneHeightRef}px` }">
          <div class="file-props__section">
            <div class="file-props__section-title">画布设置</div>
            <div class="file-props__section-desc">调整网格、标尺和背景颜色</div>
          <n-form
            class="file-props__form"
            label-placement="left"
            label-width="auto"
            label-align="left"
          >
            <n-form-item label="网格">
              <n-switch v-model:value="data.grid" @update:value="setGridData" />
            </n-form-item>
            <n-form-item label="网格大小">
              <n-input-number
                v-model:value="data.gridSize"
                :disabled="!data.grid"
                @update:value="setGridData"
              />
            </n-form-item>
            <n-form-item label="网格角度">
              <n-input-number v-model:value="data.gridRotate" @update:value="setGridData" />
            </n-form-item>
            <n-form-item label="网格颜色">
              <color-picker v-model:pureColor="data.gridColor" @update:pureColor="setGridData" />
            </n-form-item>
            <n-form-item label="标尺">
              <n-switch v-model:value="data.rule" @update:value="setRuleData" />
            </n-form-item>
            <n-form-item label="标尺颜色">
              <color-picker v-model:pureColor="options.ruleColor" @update:pureColor="setRuleData" />
            </n-form-item>
            <n-form-item label="背景颜色">
              <color-picker
                v-model:pureColor="data.background"
                @update:pureColor="setBackgroundColor"
              />
            </n-form-item>
            <!--            <n-form-item label="pc端自动缩放">
                          <n-switch
                            v-model:value="data.autoSizeinPc"
                            @update:value="setData($event, 'autoSizeinPc')"
                          />
                        </n-form-item>
                        <n-form-item label="移动端自动缩放">
                          <n-switch
                            v-model:value="data.autoSizeinMobile"
                            @update:value="setData($event, 'autoSizeinMobile')"
                          />
                        </n-form-item>
                        <n-form-item label="预览不充满窗口">
                          <n-switch
                            v-model:value="data.previewUnScale"
                            @update:value="setData($event, 'previewUnScale')"
                          />
                        </n-form-item>-->
          </n-form>
          </div>
        </n-scrollbar>
      </n-tab-pane>
      <n-tab-pane tab="布局" name="layout" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar class="file-props__scroll" :style="{ maxHeight: `${maxTabPaneHeightRef}px` }">
          <div class="file-props__empty">
            <div class="file-props__empty-title">布局设置</div>
            <div class="file-props__empty-desc">这一块后面再接着整理。</div>
          </div>
        </n-scrollbar>
      </n-tab-pane>
      <n-tab-pane tab="图层" name="struct" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar
          class="structure-tree-tab-scrollbar file-props__scroll"
          :style="{ maxHeight: `${maxTabPaneHeightRef}px` }"
        >
          <div class="file-props__section">
            <div class="file-props__section-title">图层与图元</div>
            <div class="file-props__section-desc">管理显隐、锁定和层级顺序</div>
            <StructureTree
              :draw-uid="drawStore.draw.uid"
              :pens="getPens"
              :current-pen-id="selections.pen?.id"
              :scroll-to-selection-version="structureTreeScrollVersion"
              @select-pen="onCheckPen"
              @change-visible="changeVisible"
              @change-locked="changeLocked"
              @remove-pen="removePen"
              @sorted="handleSorted"
            />
          </div>
        </n-scrollbar>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style lang="scss" scoped>
.file-props {
  height: 100%;
}

::v-deep(.n-tabs) {
  height: 100%;
}

::v-deep(.file-props__tabs .n-tabs-nav) {
  padding: 0 14px;
}

::v-deep(.file-props__tabs .n-tabs-tab) {
  font-size: 14px;
  font-weight: 600;
}

::v-deep(.file-props__tabs .n-tab-pane) {
  padding-top: 8px;
}

::v-deep(.n-tabs-tab-pad) {
  width: 26px;
}

.file-props__scroll {
  padding: 0 10px 18px;
}

::v-deep(.file-props__scroll .n-scrollbar-content) {
  padding-bottom: 18px;
}

.file-props__section {
  padding: 12px 8px 4px;
  background: #fff;
}

.file-props__section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.file-props__section-desc {
  margin-top: 4px;
  margin-bottom: 14px;
  font-size: 12px;
  color: #64748b;
}

.file-props__empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 160px;
  padding: 20px 16px;
  border: 1px dashed #dbe4f0;
  border-radius: 14px;
  background: #f8fafc;
}

.file-props__empty-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.file-props__empty-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

::v-deep(.file-props__form .n-form-item) {
  padding: 10px 0;
  margin-bottom: 0;
  border-bottom: 1px solid #eef2f7;
}

::v-deep(.file-props__form .n-form-item:last-child) {
  border-bottom: 0;
}

::v-deep(.file-props__form .n-form-item-label) {
  font-weight: 500;
  color: #334155;
}

::v-deep(.file-props__tabs .n-tabs-nav-scroll-wrapper) {
  border-bottom: 1px solid #eef2f7;
}

::v-deep(.file-props__tabs .n-tabs-tab) {
  padding-bottom: 12px;
}

::v-deep(.structure-tree-tab-scrollbar .n-scrollbar-content) {
  padding-right: 4px;
  padding-bottom: 18px;
}
</style>
