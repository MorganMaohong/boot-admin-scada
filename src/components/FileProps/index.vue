<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { deepClone, LockState, s16 } from '@meta2d/core'
import { ColorPicker } from 'vue3-colorpicker'
import emitter from '@/utils/eventBus.ts'
import { SelectionMode, useSelection } from '@/services/selections.ts'
import StructureTree from '@/components/StructureTree/index.vue'
import { useDrawStore } from '@/stores/module/draw.ts'

const { select, selections, selects } = useSelection()
const drawStore = useDrawStore()

// 图纸数据
const pens = ref([])
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
onMounted(() => {
  emitter.on('draw', init)
  emitter.on('reloadDraw', init)
  if (!selections.pen && selections.mode === SelectionMode.File && meta2d.store) init()
  if (tabPaneRef.value) maxTabPaneHeightRef.value = tabPaneRef.value.$el.clientHeight - 60
})

function init() {
  key.value = ''
  data.value = deepClone(meta2d.store.data)
  pens.value = meta2d.data().pens || []
  options.value = deepClone(meta2d.store.options)
  options.value.ruleColor = data.value.ruleColor
  key.value = s16()
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
  const currentPen = meta2d.findOne(pen?.id) || meta2d.store.pens?.[pen?.id]
  if (!currentPen) return
  meta2d.active([currentPen])
  meta2d.render()
  select([currentPen])
}

function findPenIndex(pen: any) {
  return pens.value.findIndex((item: any) => item?.id === pen?.id)
}

function changeVisible(pen) {
  const index = findPenIndex(pen)
  let v = false
  if (pen.visible == false || pen.visible == true) {
    v = !pen.visible
  }
  meta2d.setValue({ id: pen.id, visible: v }, { render: true })
  if (index >= 0) updatePenProp(index, 'visible', v)
}

function removePen(pen) {
  const index = findPenIndex(pen)
  meta2d.delete([pen], true)
  meta2d.render()
  if (index >= 0) {
    pens.value.splice(index, 1)
  }
}

function changeLocked(pen) {
  const index = findPenIndex(pen)
  if (!pen) return
  if (pen.locked === LockState.None) {
    pen.locked = LockState.DisableEdit
    if (index >= 0) {
      pens.value[index]['locked'] = LockState.DisableEdit
      updatePenProp(index, 'locked', LockState.DisableEdit)
    }
  } else if (pen.locked === LockState.DisableEdit) {
    pen.locked = LockState.Disable
    if (index >= 0) {
      pens.value[index]['locked'] = LockState.Disable
      updatePenProp(index, 'locked', LockState.Disable)
    }
  } else if (pen.locked === LockState.Disable) {
    pen.locked = LockState.None
    if (index >= 0) updatePenProp(index, 'locked', LockState.None)
  }
  meta2d.setValue({ id: pen.id, locked: pen.locked }, { render: true })
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
      pens.value = meta2d.data().pens || []
      console.log(pens.value)
      break
  }
}

function handleSorted() {
  pens.value = [...(meta2d.data().pens || [])]
}

const getPens = computed(() => {
  if (pens.value) {
    return pens.value.filter((item) => item)
  } else {
    return []
  }
})
</script>

<template>
  <div class="w-full h-full">
    <n-tabs default-value="file" :key="key" @update:value="updateTabs">
      <n-tab-pane tab="图纸" name="file" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar :style="{ maxHeight: `${maxTabPaneHeightRef}px` }">
          <n-form label-placement="left" label-width="auto" label-align="left">
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
        </n-scrollbar>
      </n-tab-pane>
      <n-tab-pane tab="布局" name="layout" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar :style="{ maxHeight: `${maxTabPaneHeightRef}px` }"></n-scrollbar>
      </n-tab-pane>
      <n-tab-pane tab="图层" name="struct" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar :style="{ maxHeight: `${maxTabPaneHeightRef}px` }">
          <StructureTree
            :draw-uid="drawStore.draw.uid"
            :pens="getPens"
            :current-pen-id="selections.pen?.id"
            @select-pen="onCheckPen"
            @change-visible="changeVisible"
            @change-locked="changeLocked"
            @remove-pen="removePen"
            @sorted="handleSorted"
          />
        </n-scrollbar>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style lang="scss" scoped>
::v-deep(.n-tabs) {
  height: 100%;
}

::v-deep(.n-tabs-tab-pad) {
  width: 26px;
}
</style>
