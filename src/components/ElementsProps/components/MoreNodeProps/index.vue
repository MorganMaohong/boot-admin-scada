<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useSelection } from '@/services/selections.ts'
import {
  AnimationFramesOptions,
  LineDashOptions,
  NodeAlignEnum,
  PenLockedOptions,
  TextAlignEnum,
  TextAlignOptions,
  TextBaselineEnum,
  TextBaselineEnumOptions,
} from '@/components/ElementsProps/model'
import { ColorPicker } from 'vue3-colorpicker'

const { selections } = useSelection()
const selectedPens = computed(() => selections.pens || [])
const selectedCount = computed(() => selectedPens.value.length)
const batchForm = ref({
  animateCycle: '',
  borderWidth: null as number | null,
  fontSize: null as number | null,
  globalAlpha: null as number | null,
  lineDashKey: '',
})

function getSelectedPens() {
  return selectedPens.value.filter((item: any) => item?.id)
}

function batchSetValue(value: Record<string, any>) {
  const pens = getSelectedPens()
  if (pens.length === 0) return
  pens.forEach((item: any) => {
    meta2d.setValue({ id: item.id, ...value }, { render: false })
  })
  meta2d.render()
}

function batchSetBackground(color: string) {
  batchSetValue({
    background: color,
    hoverBackground: color,
    activeBackground: color,
  })
}

function batchSetTextColor(color: string) {
  batchSetValue({
    textColor: color,
    activeColor: color,
    hoverColor: color,
  })
}

function batchSetLineDash(key: string) {
  const option = LineDashOptions.find((item) => item.key === key)
  batchSetValue({
    lineDashKey: key,
    lineDash: option?.value,
  })
}

function batchSetBorderWidth(value: number | null) {
  if (value === null || value === undefined) return
  batchSetValue({
    borderWidth: value,
    lineWidth: value,
  })
}

function batchSetAnimation(key: string) {
  const frames = AnimationFramesOptions.find((item) => item.key === key)
  if (!frames) return
  batchSetValue({
    framesKey: key,
    frameKey: key,
    frames: frames.value,
  })
}

function alignNodes(pos: string) {
  if (!pos) return
  meta2d.alignNodes(pos, getSelectedPens() as any)
  meta2d.render()
}

function alignNodesByFirst(pos: string) {
  if (!pos) return
  meta2d.alignNodesByFirst(pos, meta2d.store.active)
  meta2d.render()
}

function alignNodesByLast(pos: string) {
  if (!pos) return
  meta2d.alignNodesByFirst(pos, meta2d.store.active)
  meta2d.render()
}

function beSameByFirst() {
  meta2d.beSameByFirst(meta2d.store.active)
  meta2d.render()
}

function beSameByLast() {
  meta2d.beSameByLast(meta2d.store.active)
  meta2d.render()
}

function alignText(pos: string) {
  batchSetValue({ textAlign: pos })
}

function alignTextBase(pos: string) {
  batchSetValue({ textBaseline: pos })
}

function spaceBetween() {
  meta2d.spaceBetween(getSelectedPens() as any)
  meta2d.render()
}

function spaceBetweenColumn() {
  meta2d.spaceBetweenColumn(getSelectedPens() as any)
  meta2d.render()
}

function startAnimate() {
  getSelectedPens().forEach((item: any) => meta2d.startAnimate(item.id))
}

function pauseAnimate() {
  getSelectedPens().forEach((item: any) => meta2d.pauseAnimate(item.id))
}

function stopAnimate() {
  getSelectedPens().forEach((item: any) => meta2d.stopAnimate(item.id))
}
</script>

<template>
  <div class="multi-props">
    <n-text depth="3" class="multi-props__count">已选中 {{ selectedCount }} 个图元</n-text>
  </div>
  <n-collapse :default-expanded-names="['appearance', 'text', 'effect', '0']">
    <n-collapse-item title="批量外观" name="appearance">
      <n-form label-placement="left" label-width="92px" label-align="left">
        <n-form-item label="背景颜色">
          <color-picker @update:pureColor="batchSetBackground" />
        </n-form-item>
        <n-form-item label="文本颜色">
          <color-picker @update:pureColor="batchSetTextColor" />
        </n-form-item>
        <n-form-item label="边框颜色">
          <color-picker @update:pureColor="batchSetValue({ color: $event })" />
        </n-form-item>
        <n-form-item label="线条样式">
          <n-select
            v-model:value="batchForm.lineDashKey"
            :options="LineDashOptions"
            value-field="key"
            @update:value="batchSetLineDash"
          />
        </n-form-item>
        <n-form-item label="线条宽度">
          <n-input-number
            v-model:value="batchForm.borderWidth"
            class="w-full"
            :min="0"
            @update:value="batchSetBorderWidth"
          />
        </n-form-item>
        <n-form-item label="透明度">
          <n-input-number
            v-model:value="batchForm.globalAlpha"
            class="w-full"
            :min="0"
            :max="1"
            :step="0.1"
            @update:value="batchSetValue({ globalAlpha: $event })"
          />
        </n-form-item>
        <n-form-item label="默认显示">
          <n-switch @update:value="batchSetValue({ defVisible: $event, visible: $event })" />
        </n-form-item>
        <n-form-item label="锁定状态">
          <n-select :options="PenLockedOptions" @update:value="batchSetValue({ locked: $event })" />
        </n-form-item>
      </n-form>
    </n-collapse-item>
    <n-collapse-item title="批量文字" name="text">
      <n-form label-placement="left" label-width="92px" label-align="left">
        <n-form-item label="文字大小">
          <n-input-number
            v-model:value="batchForm.fontSize"
            class="w-full"
            :min="0"
            @update:value="batchSetValue({ fontSize: $event })"
          />
        </n-form-item>
        <n-form-item label="水平对齐">
          <n-select :options="TextAlignOptions" @update:value="alignText" />
        </n-form-item>
        <n-form-item label="垂直对齐">
          <n-select :options="TextBaselineEnumOptions" @update:value="alignTextBase" />
        </n-form-item>
      </n-form>
    </n-collapse-item>
    <n-collapse-item title="批量动画" name="effect">
      <n-form label-placement="left" label-width="92px" label-align="left">
        <n-form-item label="动画效果">
          <n-select
            :options="AnimationFramesOptions"
            value-field="key"
            @update:value="batchSetAnimation"
          />
        </n-form-item>
        <n-form-item label="循环次数">
          <n-input
            v-model:value="batchForm.animateCycle"
            placeholder="默认无限循环"
            @update:value="batchSetValue({ animateCycle: $event })"
          />
        </n-form-item>
        <n-form-item label="自动播放">
          <n-switch @update:value="batchSetValue({ autoPlay: $event })" />
        </n-form-item>
        <n-form-item label="保持状态">
          <n-switch @update:value="batchSetValue({ keepAnimateState: $event })" />
        </n-form-item>
        <div class="flex gap-2">
          <n-button class="flex-1" type="info" @click="startAnimate">播放</n-button>
          <n-button class="flex-1" type="info" @click="pauseAnimate">暂停</n-button>
          <n-button class="flex-1" type="info" @click="stopAnimate">停止</n-button>
        </div>
      </n-form>
    </n-collapse-item>
    <n-collapse-item title="对齐(参照框)" name="0">
      <div class="flex gap-2 flex-wrap">
        <n-button @click="alignNodes(NodeAlignEnum.left)">左对齐</n-button>
        <n-button @click="alignNodes(NodeAlignEnum.right)">右对齐</n-button>
        <n-button @click="alignNodes(NodeAlignEnum.top)">顶部对齐</n-button>
        <n-button @click="alignNodes(NodeAlignEnum.bottom)">底部对齐</n-button>
        <n-button @click="alignNodes(NodeAlignEnum.center)">垂直居中</n-button>
        <n-button @click="alignNodes(NodeAlignEnum.middle)">水平居中</n-button>
        <n-button @click="spaceBetween">水平等分对齐</n-button>
        <n-button @click="spaceBetweenColumn">垂直等分对齐</n-button>
      </div>
    </n-collapse-item>
    <n-collapse-item title="对齐(参照第一个选中节点)" name="align-first">
      <div class="flex gap-2 flex-wrap">
        <n-button @click="alignNodesByFirst(NodeAlignEnum.left)">左对齐</n-button>
        <n-button @click="alignNodesByFirst(NodeAlignEnum.right)">右对齐</n-button>
        <n-button @click="alignNodesByFirst(NodeAlignEnum.top)">顶部对齐</n-button>
        <n-button @click="alignNodesByFirst(NodeAlignEnum.bottom)">底部对齐</n-button>
        <n-button @click="alignNodesByFirst(NodeAlignEnum.center)">垂直居中</n-button>
        <n-button @click="alignNodesByFirst(NodeAlignEnum.middle)">水平居中</n-button>
        <n-button @click="beSameByFirst">相同大小</n-button>
      </div>
    </n-collapse-item>
    <n-collapse-item title="对齐(参照最后一个选中节点)" name="align-last">
      <div class="flex gap-2 flex-wrap">
        <n-button @click="alignNodesByLast(NodeAlignEnum.left)">左对齐</n-button>
        <n-button @click="alignNodesByLast(NodeAlignEnum.right)">右对齐</n-button>
        <n-button @click="alignNodesByLast(NodeAlignEnum.top)">顶部对齐</n-button>
        <n-button @click="alignNodesByLast(NodeAlignEnum.bottom)">底部对齐</n-button>
        <n-button @click="alignNodesByLast(NodeAlignEnum.center)">垂直居中</n-button>
        <n-button @click="alignNodesByLast(NodeAlignEnum.middle)">水平居中</n-button>
        <n-button @click="beSameByLast">相同大小</n-button>
      </div>
    </n-collapse-item>
    <n-collapse-item title="文本对齐(水平)" name="text-horizontal">
      <div class="flex gap-2 flex-wrap">
        <n-button @click="alignText(TextAlignEnum.leftAlign)">左对齐</n-button>
        <n-button @click="alignText(TextAlignEnum.rightAlign)">右对齐</n-button>
        <n-button @click="alignText(TextAlignEnum.centerAlign)">居中</n-button>
      </div>
    </n-collapse-item>
    <n-collapse-item title="文本对齐(垂直)" name="text-vertical">
      <div class="flex gap-2 flex-wrap">
        <n-button @click="alignTextBase(TextBaselineEnum.top)">顶部对齐</n-button>
        <n-button @click="alignTextBase(TextBaselineEnum.middle)">居中</n-button>
        <n-button @click="alignTextBase(TextBaselineEnum.bottom)">底部对齐</n-button>
      </div>
    </n-collapse-item>
  </n-collapse>
</template>

<style lang="scss" scoped>
.multi-props {
  margin-bottom: 8px;
}

.multi-props__count {
  font-size: 12px;
}
</style>
