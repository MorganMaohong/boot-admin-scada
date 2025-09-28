<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { deepClone, LockState, s16, Pen, setHover } from '@meta2d/core'
import { ColorPicker } from 'vue3-colorpicker'
import emitter from '@/utils/eventBus.ts'
import { Eye, EyeOff, Lock, LockOff, LockOpen } from '@vicons/tabler'
import { MdTrash } from '@vicons/ionicons4'
import { SelectionMode, useSelection } from '@/services/selections.ts'

const { select, selections, selects } = useSelection()

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
const structHoverIndex = ref<number | null>(null)
onMounted(() => {
  emitter.on('draw', init)
  emitter.on('reloadDraw', init)
  if (!selections.pen && selections.mode === SelectionMode.File && meta2d.store) init()
  if (tabPaneRef.value) maxTabPaneHeightRef.value = tabPaneRef.value.$el.clientHeight - 60
})

function init() {
  key.value = ''
  data.value = deepClone(meta2d.store.data)
  pens.value = Object.values(meta2d.store.pens)
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
  meta2d.active([pen])
  meta2d.render()
  select([pen])
}

function changeVisible(pen, value: any, index: number) {
  meta2d.setValue({ id: pen.id, visible: value }, { render: true })
  updatePenProp(index, 'visible', value)
}

function removePen(pen, index: number) {
  meta2d.delete([pen], true)
  meta2d.render()
  pens.value.splice(index, 1)
}

function changeLocked(pen, index: number) {
  if (!pen) return
  if (pen.locked === LockState.None) {
    pen.locked = LockState.DisableEdit
    pens.value[index]['locked'] = LockState.DisableEdit
    updatePenProp(index, 'locked', LockState.DisableEdit)
  } else if (pen.locked === LockState.DisableEdit) {
    pen.locked = LockState.Disable
    pens.value[index]['locked'] = LockState.Disable
    updatePenProp(index, 'locked', LockState.Disable)
  } else if (pen.locked === LockState.Disable) {
    pen.locked = LockState.None
    updatePenProp(index, 'locked', LockState.None)
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
      pens.value = Object.values(meta2d.store.pens)
      console.log(pens.value)
      break
  }
}

const getPens = computed(() => {
  if (pens.value) {
    return pens.value.filter((item) => item)
  } else {
    return []
  }
})

function enterStructHoverIndex(p: Pen, idx: number) {
  setHover(p)
  structHoverIndex.value = idx
  meta2d.render()
}

function leaveStructHoverIndex(p: Pen) {
  setHover(p, false)
  structHoverIndex.value = null
  meta2d.render()
}
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
      <n-tab-pane tab="结构" name="struct" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar :style="{ maxHeight: `${maxTabPaneHeightRef}px` }">
          <n-list>
            <n-list-item
              v-for="(item, index) in getPens"
              @click="onCheckPen(item)"
              class="cursor-pointer"
              @mouseenter="enterStructHoverIndex(item, index)"
              @mouseleave="leaveStructHoverIndex(item)"
            >
              <template #suffix>
                <div class="flex gap-2" v-if="item && structHoverIndex === index">
                  <n-popover trigger="hover">
                    <template #trigger>
                      <n-button text @click.stop="changeLocked(item, index)">
                        <template #icon>
                          <n-icon>
                            <LockOpen v-if="item.locked === LockState.None" />
                            <Lock v-else-if="item.locked === LockState.DisableEdit" />
                            <LockOff v-else-if="item.locked === LockState.Disable" />
                          </n-icon>
                        </template>
                      </n-button>
                    </template>
                    <span v-if="item.locked === LockState.None">解锁</span>
                    <span v-else-if="item.locked === LockState.DisableEdit">禁止编辑</span>
                    <span v-else-if="item.locked === LockState.Disable">禁止任何操作</span>
                  </n-popover>

                  <n-button text @click.stop="removePen(item, index)">
                    <template #icon>
                      <n-icon>
                        <MdTrash />
                      </n-icon>
                    </template>
                  </n-button>
                  <n-button text @click.stop="changeVisible(item, !item.visible, index)">
                    <template #icon>
                      <n-icon>
                        <Eye v-if="item.visible" />
                        <EyeOff v-else />
                      </n-icon>
                    </template>
                  </n-button>
                </div>
              </template>
              <div v-if="item">
                {{ item.nickname || item.name }}
              </div>
            </n-list-item>
          </n-list>
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
