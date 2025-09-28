<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import { useSelection } from '@/services/selections.ts'
import {
  NodeAlignEnum,
  TextAlignEnum,
  TextBaselineEnum,
  TextBaselineEnumOptions,
} from '@/components/ElementsProps/model'
import type { Pen } from '@meta2d/core'

const { selections } = useSelection()

function alignNodes(pos: string) {
  if (!pos) return
  meta2d.alignNodes(pos, selections.pens)
}

function alignNodesByFirst(pos: string) {
  if (!pos) return
  meta2d.alignNodesByFirst(pos, meta2d.store.active)
}

function alignNodesByLast(pos: string) {
  if (!pos) return
  meta2d.alignNodesByFirst(pos, meta2d.store.active)
}

function beSameByFirst() {
  meta2d.beSameByFirst(meta2d.store.active)
}

function beSameByLast() {
  meta2d.beSameByLast(meta2d.store.active)
}

function alignText(pos: string) {
  selections.pens.forEach((item: Pen) => {
    meta2d.setValue({ id: item.id, textAlign: pos }, { render: true })
  })
}

function alignTextBase(pos: string) {
  selections.pens.forEach((item: Pen) => {
    meta2d.setValue({ id: item.id, textBaseline: pos }, { render: true })
  })
}

function spaceBetween() {
  meta2d.spaceBetween(selections.pens)
}

function spaceBetweenColumn() {
  meta2d.spaceBetweenColumn(selections.pens)
}
</script>

<template>
  <n-collapse :default-expanded-names="['0', '1', '2']">
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
    <n-collapse-item title="对齐(参照第一个选中节点)" name="1">
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
    <n-collapse-item title="对齐(参照最后一个选中节点)" name="2">
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
    <n-collapse-item title="文本对齐(水平)" name="1">
      <div class="flex gap-2 flex-wrap">
        <n-button @click="alignText(TextAlignEnum.leftAlign)">左对齐</n-button>
        <n-button @click="alignText(TextAlignEnum.rightAlign)">右对齐</n-button>
        <n-button @click="alignText(TextAlignEnum.centerAlign)">居中</n-button>
      </div>
    </n-collapse-item>
    <n-collapse-item title="文本对齐(垂直)" name="1">
      <div class="flex gap-2 flex-wrap">
        <n-button @click="alignTextBase(TextBaselineEnum.top)">顶部对齐</n-button>
        <n-button @click="alignTextBase(TextBaselineEnum.middle)">居中</n-button>
        <n-button @click="alignTextBase(TextBaselineEnum.bottom)">底部对齐</n-button>
      </div>
    </n-collapse-item>
  </n-collapse>
</template>

<style lang="scss" scoped></style>
