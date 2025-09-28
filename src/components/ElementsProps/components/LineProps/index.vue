<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, toRaw, watch } from 'vue'
import { useSelection } from '@/services/selections.ts'
import {
  type DataForm,
  type EventForm,
  getOptionsKeyValue,
  type LineAnimationForm,
  LineAnimationOptions,
  LineDashOptions,
  LineGradientEnums,
  LineGradientOptions,
  PresetJsKeyEnums,
  PropEnums,
  TriggerEnum,
} from '@/components/ElementsProps/model'
import { ColorPicker } from 'vue3-colorpicker'
import { Copy, Edit } from '@vicons/carbon'
import DataProps from '@/components/ElementsProps/components/DataProps/index.vue'
import { MdTrash } from '@vicons/ionicons4'
import { LockState, s8 } from '@meta2d/core'
import DataFormProps from '@/components/ElementsProps/components/DataFormProps/index.vue'
import EventFormProps from '@/components/ElementsProps/components/EventFormProps/index.vue'
import EventProps from '@/components/ElementsProps/components/EventProps/index.vue'
import { Eye, EyeOff, Lock, LockOff, LockOpen } from '@vicons/tabler'
import GatewayVarSelect from '@/components/ElementsProps/components/GatewayVarSelect/index.vue'
import { cloneDeep } from 'lodash'

const { select, selections, selects } = useSelection()
const KEY = ref('')
const pen = ref<any>({})
// 位置数据。当前版本位置需要动态计算获取
const rect = ref<any>({})
const tabPaneRef = ref()
const maxTabPaneHeightRef = ref()
const events = ref<EventForm[]>([])
const eventFormData = ref<EventForm>({})
const datas = ref<DataForm[]>([])
const dataFormData = ref<DataForm>({})
const showUpdateData = ref(false)
const showUpdateEvent = ref(false)
const animationFormData = ref<LineAnimationForm>({
  animateCycle: 0,
  animateInterval: 0,
  frames: [],
  keepAnimateState: false,
})
const pens = ref([])
const structHoverIndex = ref<number | null>(null)
const tags = ref([])
onMounted(() => {
  pens.value = Object.values(meta2d.store.pens)
  getPen()
  maxTabPaneHeightRef.value = tabPaneRef.value.$el.clientHeight - 20
})

const eventNames = computed(() => {
  return events.value.map((item) => item.id)
})

const dataNames = computed(() => {
  return datas.value.map((item) => item.id)
})

const watcher = watch(() => selections.pen.id, getPen)

function getPen() {
  pen.value = selections.pen
  if (pen.value.globalAlpha == undefined) {
    pen.value.globalAlpha = 1
  }
  rect.value = meta2d.getPenRect(pen.value)
  if (!pen.value.lineGradientKey) {
    pen.value.lineGradientKey = LineGradientEnums.none
  }
  if (!pen.value.animateSpan) {
    pen.value.animateSpan = 1
    changePen(pen.value.animateSpan, 'animateSpan')
  }
  if (pen.value.locked === undefined || pen.value.locked === null) {
    pen.value.locked = LockState.None
    changePen(LockState.None, 'locked')
  }
  if (!pen.value.nickname) {
    pen.value.nickname = pen.value.name
    changePen(pen.value.nickname, 'nickname')
  }
  if (pen.value.visible === undefined || pen.value.visible === null) {
    pen.value.visible = true
    changePen(true, 'visible')
  }
  if (pen.value.defVisible === undefined || pen.value.defVisible === null) {
    pen.value.defVisible = true
    changePen(true, 'defVisible')
  }
  events.value = pen.value.events || []
  datas.value = pen.value.datas || []

  for (const key in pen.value) {
    if (animationFormData.value.hasOwnProperty(key)) {
      animationFormData.value[key] = pen.value[key]
    }
  }
  KEY.value = s8()
}

function changePen(value: any, prop: string) {
  const v: any = { id: pen.value.id }
  if (prop === 'lineGradientKey') {
    v['color'] = '#000000'
  }
  if (prop === 'lineGradientColors') {
    v['strokeType'] = 1
  }
  v[prop] = value
  meta2d.setValue(v, { render: true })
}

function changeLineDash(k: string) {
  const v: any = { id: pen.value.id }
  v['lineDashKey'] = k
  v['lineDash'] = getOptionsKeyValue(LineDashOptions, k)
  meta2d.setValue(v, { render: true })
}

function changeLineGradientKey(k: string) {
  const v: any = { id: pen.value.id }
  v['lineGradientKey'] = k
  if (k === LineGradientEnums.none) {
    v['lineGradientColors'] = ''
    v['strokeType'] = 0
  } else if (k === LineGradientEnums.gradient) {
    v['color'] = '#000000'
  } else {
    return
  }
  meta2d.setValue(v, { render: true })
}

function startAnimate() {
  meta2d.startAnimate(pen.value.id)
}

function pauseAnimate() {
  meta2d.pauseAnimate(pen.value.id)
}

function stopAnimate() {
  meta2d.stopAnimate(pen.value.id)
}

function addOrUpdateData(data: DataForm) {
  if (data.id) {
    const v: any = { id: pen.value.id }
    const index = datas.value.findIndex((item) => item.id === data.id)
    if (index >= 0) {
      datas.value[index] = data
      v['datas'] = datas.value
      meta2d.setValue(v, { render: true })
    }
  } else {
    data.id = s8()
    const v: any = { id: pen.value.id }
    datas.value.push(data)
    v['datas'] = datas.value
    meta2d.setValue(v, { render: true })
  }
  showUpdateData.value = false
}

function removeData(idx: number) {
  const v: any = { id: pen.value.id }
  datas.value.splice(idx, 1)
  v['datas'] = datas.value
  meta2d.setValue(v, { render: true })
}

function showUpdateDataModal(data: DataForm) {
  // console.log("sss")
  // debugger
  if (!pen.value.key) {
    window.$message.error('请先绑定变量!')
    return
  }
  if (data) {
    dataFormData.value = data
  } else {
    dataFormData.value = {
      id: '',
      key: '',
      name: '',
      value: '',
      varParams: {
        label: '',
        value: '',
      },
      condData: [{ min: 0, max: 1, prop: PropEnums.background, propValue: '#000000' }],
    }
  }
  showUpdateData.value = true
}

function showUpdateEventModal(data: EventForm) {
  if (data) {
    eventFormData.value = data
  } else {
    eventFormData.value = {
      action: undefined,
      id: '',
      name: undefined,
      params: {},
      title: '',
      trigger: TriggerEnum.none,
      presetJsKey: PresetJsKeyEnums.writeVarValue,
      value: '',
      isPresetJs: true,
      where: {
        comparison: '',
        key: '',
        type: '',
        value: '',
      },
    }
  }
  showUpdateEvent.value = true
}

function addOrUpdateEvent(data: EventForm) {
  if (data.id) {
    const v: any = { id: pen.value.id }
    const index = events.value.findIndex((item) => item.id === data.id)
    if (index >= 0) {
      events.value[index] = data
      v['events'] = events.value
      meta2d.setValue(v, { render: true })
    }
  } else {
    data.id = s8()
    const v: any = { id: pen.value.id }
    events.value.push(data)
    v['events'] = events.value
    meta2d.setValue(v, { render: true })
  }
  showUpdateEvent.value = false
}

function showCopyEventModal(data: EventForm) {
  const rawData = toRaw(data)
  const clone = cloneDeep(rawData)
  clone.id = ''
  showUpdateEventModal(clone)
}

function removeEvent(idx: number) {
  const v: any = { id: pen.value.id }
  events.value.splice(idx, 1)
  v['events'] = events.value
  meta2d.setValue(v, { render: true })
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

onUnmounted(() => {
  watcher()
})
</script>

<template>
  <div class="w-full h-full" :key="KEY">
    <n-tabs default-value="appearance">
      <n-tab-pane name="appearance" tab="外观" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar :style="{ maxHeight: `${maxTabPaneHeightRef}px` }">
          <n-collapse :expanded-names="['layout']">
            <n-collapse-item title="样式" name="layout">
              <n-form label-placement="left" label-width="120px" label-align="left">
                <n-form-item label="线条样式">
                  <n-select
                    :options="LineDashOptions"
                    v-model:value="pen.lineDashKey"
                    value-field="key"
                    @update:value="changeLineDash"
                  />
                </n-form-item>
                <!--                <n-form-item label="平滑度"></n-form-item>-->
                <n-form-item label="线条渐变">
                  <n-select
                    :options="LineGradientOptions"
                    v-model:value="pen.lineGradientKey"
                    @update:value="changeLineGradientKey"
                  />
                </n-form-item>
                <n-form-item label="颜色" v-if="pen.lineGradientKey === LineGradientEnums.none">
                  <color-picker
                    v-model:pureColor="pen.color"
                    @update:pureColor="changePen($event, 'color')"
                  />
                </n-form-item>
                <n-form-item
                  label="渐变颜色"
                  v-else-if="pen.lineGradientKey === LineGradientEnums.gradient"
                >
                  <color-picker
                    v-model:gradientColor="pen.lineGradientColors"
                    use-type="gradient"
                    shape="circle"
                    format="rgb"
                    @update:gradientColor="changePen($event, 'lineGradientColors')"
                  />
                </n-form-item>
                <!--                <n-form-item label="浮动颜色"></n-form-item>-->
                <!--                <n-form-item label="选中颜色"></n-form-item>-->
                <n-form-item label="线条宽度">
                  <n-input-number
                    v-model:value="pen.borderWidth"
                    @update:value="changePen($event, 'borderWidth')"
                    min="1"
                  />
                </n-form-item>
                <!--                <n-form-item label="边框颜色"></n-form-item>-->
                <!--                <n-form-item label="边框宽度"></n-form-item>-->
                <!--                <n-form-item label="背景"></n-form-item>-->
                <!--                <n-form-item label="背景颜色"></n-form-item>-->
                <!--                <n-form-item label="浮动背景颜色"></n-form-item>-->
                <!--                <n-form-item label="选中背景颜色"></n-form-item>-->
                <!--                <n-form-item label="透明度"></n-form-item>-->
                <!--                <n-form-item label="锚点颜色"></n-form-item>-->
                <n-form-item label="锚点半径">
                  <n-input-number
                    v-model:value="pen.anchorRadius"
                    @update:value="changePen($event, 'anchorRadius')"
                    min="1"
                  />
                </n-form-item>
                <n-form-item label="默认显示">
                  <n-switch
                    v-model:value="pen.defVisible"
                    @update:value="changePen($event, 'defVisible')"
                  />
                </n-form-item>
                <!--                <n-form-item label="阴影颜色"></n-form-item>-->
                <!--                <n-form-item label="阴影模糊"></n-form-item>-->
                <!--                <n-form-item label="阴影X偏移"></n-form-item>-->
                <!--                <n-form-item label="阴影Y偏移"></n-form-item>-->
                <!--                <n-form-item label="文字阴影"></n-form-item>-->
                <!--                <n-form-item label="滤镜"></n-form-item>-->
                <!--                <n-form-item label="控制点1X"></n-form-item>-->
                <!--                <n-form-item label="控制点1Y"></n-form-item>-->
              </n-form>
            </n-collapse-item>
          </n-collapse>
        </n-scrollbar>
      </n-tab-pane>
      <n-tab-pane name="event" tab="事件" ref="tabPaneRef" class="w-full h-full">
        <n-scrollbar :style="{ maxHeight: `${maxTabPaneHeightRef}px` }" class="p-2 right-0">
          <n-form label-placement="left" label-width="100px" label-align="left">
            <n-form-item label="ID">
              <n-text>{{ pen.id }}</n-text>
            </n-form-item>
            <n-form-item label="名称" v-if="!pen.key">
              <n-input v-model:value="pen.nickname" @update:value="changePen($event, 'nickname')" />
            </n-form-item>
            <n-form-item label="绑定变量" label-placement="top">
              <GatewayVarSelect v-model:model-value="pen.key" v-model:model-name="pen.nickname" />
            </n-form-item>
          </n-form>
          <div class="flex w-full">
            <n-button class="flex-1" type="primary" @click="showUpdateEventModal(null)">
              添加事件
            </n-button>
          </div>
          <n-divider />
          <n-collapse :default-expanded-names="eventNames">
            <n-collapse-item
              v-for="(item, index) in events"
              :title="`事件${index + 1}`"
              :name="item.id"
            >
              <template #header-extra>
                <div class="flex w-full gap-2">
                  <n-button text @click.stop="showUpdateEventModal(item)">
                    <template #icon>
                      <Edit />
                    </template>
                  </n-button>
                  <n-button text @click.stop="showCopyEventModal(item)">
                    <template #icon>
                      <Copy />
                    </template>
                  </n-button>
                  <n-button text type="error" @click="removeEvent(index)">
                    <template #icon>
                      <MdTrash />
                    </template>
                  </n-button>
                </div>
              </template>
              <EventProps :value="item" />
            </n-collapse-item>
          </n-collapse>
        </n-scrollbar>
      </n-tab-pane>
      <n-tab-pane name="effect" tab="动画" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar :style="{ maxHeight: `${maxTabPaneHeightRef}px` }">
          <n-form label-align="left" label-width="100px" label-placement="left">
            <n-form-item label="动画效果">
              <n-select
                v-model:value="pen.lineAnimateType"
                :options="LineAnimationOptions"
                @update:value="changePen($event, 'lineAnimateType')"
              />
            </n-form-item>
            <n-form-item label="动画线宽">
              <n-input-number
                v-model:value="pen.lineWidth"
                @update:value="changePen($event, 'lineWidth')"
              />
            </n-form-item>
            <n-form-item label="动画颜色">
              <color-picker
                v-model:pureColor="pen.animateColor"
                @update:pureColor="changePen($event, 'animateColor')"
              />
            </n-form-item>
            <n-form-item label="动画发光">
              <n-switch />
            </n-form-item>
            <n-form-item label="动画速度">
              <n-input-number
                v-model:value="pen.animateSpan"
                @update:value="changePen($event, 'animateSpan')"
                :show-button="false"
                min="0"
                max="5"
              />
            </n-form-item>
            <n-form-item label="反向流动">
              <n-switch
                v-model:value="pen.animateReverse"
                @update:value="changePen($event, 'animateReverse')"
              />
            </n-form-item>
            <n-form-item label="循环次数">
              <n-input
                placeholder="默认无限循环"
                v-model:value="pen.animateCycle"
                @update:value="changePen($event, 'animateCycle')"
              />
            </n-form-item>
            <n-form-item label="下个动画"></n-form-item>
            <n-form-item label="自动播放">
              <n-switch
                v-model:value="pen.autoPlay"
                @update:value="changePen($event, 'autoPlay')"
              />
            </n-form-item>
            <n-form-item label="保持动画状态">
              <n-switch
                v-model:value="pen.keepAnimateState"
                @update:value="changePen($event, 'keepAnimateState')"
              />
            </n-form-item>
            <n-form-item label="线性播放">
              <n-switch v-model:value="pen.linear" @update:value="changePen($event, 'linear')" />
            </n-form-item>
            <div class="flex gap-2 justify-center">
              <n-button class="flex-1" type="info" @click="startAnimate">播放</n-button>
              <n-button class="flex-1" type="info" @click="pauseAnimate">暂停</n-button>
              <n-button class="flex-1" type="info" @click="stopAnimate">停止</n-button>
            </div>
          </n-form>
        </n-scrollbar>
      </n-tab-pane>
      <n-tab-pane name="data" tab="数据" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar :style="{ maxHeight: `${maxTabPaneHeightRef}px` }">
          <n-form label-placement="left" label-width="100px" label-align="left">
            <n-form-item label="ID">
              <n-text>{{ pen.id }}</n-text>
            </n-form-item>
            <n-form-item label="名称" v-if="!pen.key">
              <n-input v-model:value="pen.nickname" @update:value="changePen($event, 'nickname')" />
            </n-form-item>
            <n-form-item label="绑定变量" label-placement="top">
              <GatewayVarSelect v-model:model-value="pen.key" v-model:model-name="pen.nickname" />
            </n-form-item>
          </n-form>
          <div class="w-full flex mb-4">
            <n-button class="flex-1" type="primary" @click="showUpdateDataModal(null)">
              添加数据
            </n-button>
          </div>
          <n-collapse :expanded-names="dataNames">
            <n-collapse-item :title="item.name" v-for="(item, index) in datas" :name="item.id">
              <template #header-extra>
                <div class="flex gap-2">
                  <n-button text @click.stop="showUpdateDataModal(item)">
                    <template #icon>
                      <Edit />
                    </template>
                  </n-button>
                  <n-button text @click.stop="removeData(index)">
                    <template #icon>
                      <MdTrash />
                    </template>
                  </n-button>
                </div>
              </template>
              <DataProps :value="item" />
            </n-collapse-item>
          </n-collapse>
        </n-scrollbar>
      </n-tab-pane>
      <n-tab-pane name="structure" tab="结构" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar :style="{ maxHeight: `${maxTabPaneHeightRef}px` }">
          <n-list>
            <n-list-item
              v-for="(item, index) in getPens"
              @click="onCheckPen(item)"
              class="cursor-pointer"
              @mouseenter="structHoverIndex = index"
              @mouseleave="structHoverIndex = null"
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
              <div v-if="item" :class="item.id === pen.id ? 'text-blue-600' : ''">
                {{ item.nickname || item.name }}
              </div>
            </n-list-item>
          </n-list>
        </n-scrollbar>
      </n-tab-pane>
    </n-tabs>
  </div>
  <n-modal
    v-model:show="showUpdateData"
    preset="card"
    :title="dataFormData.id ? '编辑动作' : '新增动作'"
    style="width: 1000px"
    :mask-closable="false"
  >
    <DataFormProps :value="dataFormData" @update:value="addOrUpdateData" />
  </n-modal>
  <n-modal
    v-model:show="showUpdateEvent"
    preset="card"
    :title="eventFormData.id ? '编辑事件' : '新增事件'"
    style="width: 800px"
    :mask-closable="false"
  >
    <EventFormProps :value="eventFormData" @update:value="addOrUpdateEvent" />
  </n-modal>
</template>

<style lang="scss" scoped>
::v-deep(.n-tabs) {
  height: 100%;
}

::v-deep(.n-tabs-tab-pad) {
  width: 26px;
}

::v-deep(
  .n-scrollbar > .n-scrollbar-rail.n-scrollbar-rail--vertical--right,
  .n-scrollbar + .n-scrollbar-rail.n-scrollbar-rail--vertical--right
) {
  right: 0 !important;
}

::v-deep(
  .n-collapse .n-collapse-item .n-collapse-item__content-wrapper .n-collapse-item__content-inner
) {
  padding-left: 20px !important;
}
</style>
