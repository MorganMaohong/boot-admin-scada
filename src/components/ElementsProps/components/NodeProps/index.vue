<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, toRaw, watch } from 'vue'
import { useSelection } from '@/services/selections'
import EventProps from '@/components/ElementsProps/components/EventProps/index.vue'
import DataProps from '@/components/ElementsProps/components/DataProps/index.vue'
import DataFormProps from '@/components/ElementsProps/components/DataFormProps/index.vue'
import EventFormProps from '@/components/ElementsProps/components/EventFormProps/index.vue'
import GatewayVarSelect from '@/components/ElementsProps/components/GatewayVarSelect/index.vue'
import { MdTrash } from '@vicons/ionicons4'
import { Copy, Edit } from '@vicons/carbon'
import { cloneDeep } from 'lodash'
import {
  AnimationFramesOptions,
  type DataForm,
  type EventForm,
  type NodeAnimationForm,
  PenLockedOptions,
  PresetJsKeyEnums,
  PropEnums,
  type Tags,
  TextAlignOptions,
  TextBaselineEnumOptions,
  TriggerEnum,
  ValueTypeEnum,
} from '@/components/ElementsProps/model'
import { LockState, s8 } from '@meta2d/core'
import { ColorPicker } from 'vue3-colorpicker'
import { Eye, EyeOff, Lock, LockOff, LockOpen } from '@vicons/tabler'

const { select, selections, selects } = useSelection()
const KEY = ref('')
const pen = ref<any>(null)
// 位置数据。当前版本位置需要动态计算获取
const rect = ref<any>(null)
const tabPaneRef = ref()
const maxTabPaneHeightRef = ref()
const lineDashs = [undefined, [5, 5]]
const events = ref<EventForm[]>([])
const eventFormData = ref<EventForm>({})
const datas = ref<DataForm[]>([])
const dataFormData = ref<DataForm>({})
const showUpdateData = ref(false)
const showUpdateEvent = ref(false)
const animationFormData = ref<NodeAnimationForm>({
  animateCycle: 0,
  animateInterval: 0,
  frames: [],
  keepAnimateState: false,
})
const pens = ref([])
const structHoverIndex = ref<number | null>(null)

onMounted(() => {
  pens.value = Object.values(meta2d.store.pens)
  getPen()
  console.log(tabPaneRef.value)
  maxTabPaneHeightRef.value = tabPaneRef.value.$el.clientHeight - 20
})

const eventNames = computed(() => {
  return events.value.map((item) => item.id)
})

const dataNames = computed(() => {
  return datas.value.map((item) => item.id)
})

// 监听选中不同图元
const watcher = watch(() => selections.pen.id, getPen)

function getPen() {
  pen.value = selections.pen
  rect.value = meta2d.getPenRect(pen.value)

  if (pen.value.globalAlpha == undefined) {
    pen.value.globalAlpha = 1
  }
  if (!pen.value.nickname) {
    pen.value.nickname = pen.value.name
    changePen(pen.value.nickname, 'nickname')
  }
  if (pen.value.locked === undefined || pen.value.locked === null) {
    pen.value.locked = LockState.None
    changePen(LockState.None, 'locked')
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
  // debugger
  const v: any = { id: pen.value.id }
  if (prop === 'dash') {
    v.lineDash = lineDashs[value]
  } else {
    v[prop] = value
  }
  meta2d.setValue(v, { render: true })
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

function showCopyEventModal(data: EventForm) {
  debugger
  const rawData = toRaw(data)
  const clone = cloneDeep(rawData)
  clone.id = ''
  showUpdateEventModal(clone)
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

function removeEvent(idx: number) {
  const v: any = { id: pen.value.id }
  events.value.splice(idx, 1)
  v['events'] = events.value
  meta2d.setValue(v, { render: true })
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
  debugger
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
      condData: [
        {
          cond: true,
          max: 0,
          min: 0,
          valueType: ValueTypeEnum.customValue,
          prop: PropEnums.background,
          propValue: '#000000',
        },
      ],
    }
  }
  showUpdateData.value = true
}

function showCopyDataModal(data: DataForm) {
  const rawData = toRaw(data)
  const clone = cloneDeep(rawData)
  clone.id = ''
  showUpdateDataModal(clone)
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

function changePenAnimation(v: string) {
  console.log(v)
  const frames = AnimationFramesOptions.find((item) => item.key === v)
  const p: any = { id: pen.value.id }
  if (frames) {
    p['frameKey'] = v
    p['frames'] = frames.value
    meta2d.setValue(p, { render: true })
  }
}

const penChildrenOptions = computed(() => {
  if (pen.value.children && pen.value.children.length > 0) {
    let options = []
    pen.value.children.forEach((item, index) => {
      const p = meta2d.findOne(item)
      if (p) options.push({ label: p.title || index, value: index })
    })
    if (options.length > 0) return options
    return null
  }
  return null
})

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

function changeBackground(color: string) {
  pen.value.background = color
  pen.value.hoverBackground = color
  pen.value.activeBackground = color
  const { id, background, hoverBackground, hoverColor, activeBackground, activeColor } = pen.value
  meta2d.setValue(
    { id, background, hoverBackground, hoverColor, activeBackground, activeColor },
    { render: true },
  )
}

function changeTextColor(color: string) {
  pen.value.textColor = color
  pen.value.activeColor = color
  pen.value.hoverColor = color
  const { id, hoverColor, activeColor, textColor } = pen.value
  meta2d.setValue({ id, hoverColor, activeColor, textColor }, { render: true })
}

onUnmounted(() => {
  watcher()
})
</script>
<template>
  <div class="w-full h-full" :key="KEY">
    <n-tabs default-value="appearance" @update:value="updateTabs">
      <n-tab-pane name="appearance" tab="外观" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar :style="{ maxHeight: `${maxTabPaneHeightRef}px` }">
          <n-form label-placement="left" label-width="100px" label-align="left" v-if="pen && rect">
            <n-collapse :default-expanded-names="['1', '2', '3']">
              <n-collapse-item title="样式" name="2">
                <n-form-item label="背景颜色">
                  <color-picker
                    v-model:pureColor="pen.background"
                    @update:pureColor="changeBackground($event)"
                  />
                </n-form-item>
                <n-form-item label="文本颜色">
                  <color-picker
                    v-model:pureColor="pen.textColor"
                    @update:pureColor="changeTextColor($event)"
                  />
                </n-form-item>
                <n-form-item label="悬停背景颜色">
                  <color-picker
                    v-model:pureColor="pen.hoverBackground"
                    @update:pureColor="changePen($event, 'hoverBackground')"
                  />
                </n-form-item>
                <n-form-item label="悬停颜色">
                  <color-picker
                    v-model:pureColor="pen.hoverColor"
                    @update:pureColor="changePen($event, 'hoverColor')"
                  />
                </n-form-item>
                <n-form-item label="选中背景颜色">
                  <color-picker
                    v-model:pureColor="pen.activeBackground"
                    @update:pureColor="changePen($event, 'activeBackground')"
                  />
                </n-form-item>
                <n-form-item label="选中颜色">
                  <color-picker
                    v-model:pureColor="pen.activeColor"
                    @update:pureColor="changePen($event, 'activeColor')"
                  />
                </n-form-item>
                <n-form-item label="线条样式">
                  <n-select
                    :options="[
                      {
                        label: '实线',
                        value: 0,
                      },
                      {
                        label: '虚线',
                        value: 1,
                      },
                    ]"
                    v-model:value="pen.dash"
                    @update:value="changePen($event, 'dash')"
                  ></n-select>
                </n-form-item>
                <!--                <n-form-item label="线条渐变">
                                  <n-select
                                    :options="[
                                      {
                                        label: '无',
                                        value: 0
                                      },
                                      {
                                        label: '线性渐变',
                                        value: 1
                                      },
                                      {
                                        label: '发散渐变',
                                        value: 1
                                      },
                                    ]"
                                    v-model:value="pen.strokeType"
                                    @update:value="changePen($event, 'dash')"
                                  ></n-select>
                                </n-form-item>-->
                <n-form-item label="边框颜色">
                  <color-picker
                    v-model:pureColor="pen.color"
                    @update:pureColor="changePen($event, 'color')"
                  />
                </n-form-item>
                <n-form-item label="线条宽度">
                  <n-input-number
                    v-model:value="pen.borderWidth"
                    @update:value="changePen($event, 'lineWidth')"
                    min="0"
                  />
                </n-form-item>
                <n-form-item label="默认显示">
                  <n-switch
                    v-model:value="pen.defVisible"
                    @update:value="changePen($event, 'defVisible')"
                  />
                </n-form-item>
              </n-collapse-item>
              <n-collapse-item title="文字" name="3">
                <n-input
                  type="textarea"
                  v-model:value="pen.text"
                  @update:value="changePen($event, 'text')"
                  class="mb-[12px]"
                />
                <n-form-item label="文字大小">
                  <n-input-number
                    v-model:value="pen.fontSize"
                    @update:value="changePen($event, 'fontSize')"
                    min="0"
                  />
                </n-form-item>
                <n-form-item label="水平对齐">
                  <n-select
                    :options="TextAlignOptions"
                    @update:value="changePen($event, 'textAlign')"
                  />
                </n-form-item>
                <n-form-item label="垂直对齐">
                  <n-select
                    :options="TextBaselineEnumOptions"
                    @update:value="changePen($event, 'textBaseline')"
                  />
                </n-form-item>
              </n-collapse-item>
              <n-collapse-item title="位置和大小" name="1">
                <n-form-item label="宽">
                  <n-input-number
                    v-model:value="rect.width"
                    @update:value="changePen($event, 'width')"
                  />
                </n-form-item>
                <n-form-item label="高">
                  <n-input-number
                    v-model:value="rect.height"
                    @update:value="changePen($event, 'height')"
                  />
                </n-form-item>
                <n-form-item label="X">
                  <n-input-number v-model:value="rect.x" @update:value="changePen($event, 'x')" />
                </n-form-item>
                <n-form-item label="Y">
                  <n-input-number v-model:value="rect.y" @update:value="changePen($event, 'y')" />
                </n-form-item>
                <n-form-item label="锁定宽高比">
                  <n-switch v-model:value="pen.ratio" @update:value="changePen($event, 'ratio')" />
                </n-form-item>
                <n-form-item label="锁定图片宽高比">
                  <n-switch
                    v-model:value="pen.imageRatio"
                    @update:value="changePen($event, 'imageRatio')"
                  />
                </n-form-item>
                <n-form-item label="锁定状态">
                  <n-select
                    :options="PenLockedOptions"
                    v-model:value="pen.locked"
                    @update:value="changePen($event, 'locked')"
                  />
                </n-form-item>
                <n-form-item label="圆角">
                  <n-input-number
                    v-model:value="pen.borderRadius"
                    @update:value="changePen($event, 'borderRadius')"
                  />
                </n-form-item>
                <n-form-item label="旋转">
                  <n-input-number
                    v-model:value="pen.rotate"
                    @update:value="changePen($event, 'rotate')"
                  />
                </n-form-item>
                <n-form-item label="内边距-左">
                  <n-input-number
                    v-model:value="pen.paddingLeft"
                    @update:value="changePen($event, 'paddingLeft')"
                    min="0"
                  />
                </n-form-item>
                <n-form-item label="内边距-右">
                  <n-input-number
                    v-model:value="pen.paddingRight"
                    @update:value="changePen($event, 'paddingRight')"
                    min="0"
                  />
                </n-form-item>
                <n-form-item label="内边距-上">
                  <n-input-number
                    v-model:value="pen.paddingTop"
                    @update:value="changePen($event, 'paddingTop')"
                    min="0"
                  />
                </n-form-item>
                <n-form-item label="内边距-下">
                  <n-input-number
                    v-model:value="pen.paddingBottom"
                    @update:value="changePen($event, 'paddingBottom')"
                    min="0"
                  />
                </n-form-item>
                <n-form-item label="进度">
                  <n-input-number
                    v-model:value="pen.progress"
                    @update:value="changePen($event, 'progress')"
                    step="0.01"
                    min="0"
                    max="1"
                  />
                </n-form-item>
                <n-form-item label="进度颜色">
                  <color-picker
                    v-model:pureColor="pen.progressColor"
                    @update:pureColor="changePen($event, 'progressColor')"
                  />
                </n-form-item>
                <n-form-item label="垂直进度">
                  <n-switch
                    v-model:value="pen.verticalProgress"
                    @update:value="changePen($event, 'verticalProgress')"
                  />
                </n-form-item>
                <n-form-item label="反向进度">
                  <n-switch
                    v-model:value="pen.reverseProgress"
                    @update:value="changePen($event, 'reverseProgress')"
                  />
                </n-form-item>
                <n-form-item label="水平翻转">
                  <n-switch v-model:value="pen.flipX" @update:value="changePen($event, 'flipX')" />
                </n-form-item>
                <n-form-item label="垂直翻转">
                  <n-switch v-model:value="pen.flipY" @update:value="changePen($event, 'flipY')" />
                </n-form-item>
                <n-form-item label="输入框">
                  <n-switch v-model:value="pen.input" @update:value="changePen($event, 'input')" />
                </n-form-item>
                <n-form-item label="状态值" v-if="penChildrenOptions">
                  <n-select
                    :options="penChildrenOptions"
                    v-model:value="pen.showChild"
                    @update:value="changePen($event, 'showChild')"
                  />
                </n-form-item>
              </n-collapse-item>
            </n-collapse>
          </n-form>
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
      <n-tab-pane name="effect" tab="动画">
        <n-form label-placement="left" label-width="auto">
          <n-form-item label="动画效果">
            <n-select
              :options="AnimationFramesOptions"
              value-field="key"
              v-model:value="pen.framesKey"
              @update:value="changePenAnimation"
            />
          </n-form-item>
          <n-form-item label="循环次数">
            <n-input
              placeholder="默认无限循环"
              v-model:value="pen.animateCycle"
              @update:value="changePen($event, 'animateCycle')"
            />
          </n-form-item>
          <n-form-item label="下个动画">
            <n-input />
          </n-form-item>
          <n-form-item label="自动播放">
            <n-switch v-model:value="pen.autoPlay" @update:value="changePen($event, 'autoPlay')" />
          </n-form-item>
          <n-form-item label="保持动画状态">
            <n-switch
              v-model:value="pen.keepAnimateState"
              @update:value="changePen($event, 'keepAnimateState')"
            />
          </n-form-item>
          <div class="flex w-full justify-center gap-2">
            <n-button class="flex-1" type="info" @click="startAnimate">播放</n-button>
            <n-button class="flex-1" type="info" @click="pauseAnimate">暂停</n-button>
            <n-button class="flex-1" type="info" @click="stopAnimate">停止</n-button>
          </div>
        </n-form>
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
          <div class="w-full flex mb-4 mt-4">
            <n-button class="flex-1" type="primary" @click="showUpdateDataModal(null)">
              添加数据
            </n-button>
          </div>
          <n-collapse :default-expanded-names="dataNames">
            <n-collapse-item
              :title="`数据${index + 1}`"
              v-for="(item, index) in datas"
              :name="item.id"
            >
              <template #header-extra>
                <div class="flex w-full gap-2">
                  <n-button text @click.stop="showUpdateDataModal(item)">
                    <template #icon>
                      <Edit />
                    </template>
                  </n-button>
                  <n-button text @click.stop="showCopyDataModal(item)">
                    <template #icon>
                      <Copy />
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
