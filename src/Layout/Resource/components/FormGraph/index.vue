<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import type { BasicGraph } from '@/model/res/basic'
import SvgIcon from '@/components/SvgIcon/index.vue'
import { DefValues } from '@/Layout/Resource/components'
import { useLayerStore } from '@/stores/module/layer.ts'
const layerStore = useLayerStore()
const data = ref([
  {
    id: null,
    name: '时间',
    icon: 'time',
    data: {
      name: 'time',
      x: 100,
      y: 100,
      width: 300,
      height: 40,
      text: '当前时间',
      lineWidth: 0,
      fillZero: true,
      timeFormat: '`${year}-${month}-${day} ${hours}:${minutes}:${seconds} 星期${week}`',
    },
  },
  {
    id: null,
    name: '单选框',
    icon: 'radio',
    data: {
      name: 'radio',
      x: 100,
      y: 100,
      width: 150,
      height: 100,
      direction: 'vertical',
      checked: '选项二',
      options: [
        { text: '选项一', background: '#ff0000' },
        { text: '选项二', background: '#00ff00' },
        { text: '选项三', background: '#0000ff' },
      ],
    },
  },
  {
    id: null,
    name: '复选框',
    icon: 'checkbox',
    data: {
      name: 'checkbox',
      x: 100,
      y: 100,
      width: 30,
      height: 30,
      checked: true,
      // isForbidden: true,
      value: '选项一',
    },
  },
  {
    id: null,
    name: '选择器',
    icon: 'switch',
    data: {
      name: 'switch',
      x: 100,
      y: 100,
      height: 30,
      width: 60,
      checked: false,
      offColor: '#BFBFBF',
      onColor: '#1890ff',
      disableOffColor: '#E5E5E5',
      disableOnColor: '#A3D3FF',
      //disable: true,
    },
  },
  {
    id: null,
    name: '滑动输入条',
    icon: 'slider',
    data: {
      name: 'slider',
      x: 100,
      y: 100,
      width: 300,
      height: 30,
      value: 10,
      textWidth: 50,
      barHeight: 4,
      min: 0,
      max: 100,
      color: '#1890ff',
      background: '#D4D6D9',
      textColor: '#222222',
      unit: '%',
    },
  },
  {
    id: null,
    name: '按钮',
    icon: 'button',
    data: {
      name: 'rectangle',
      x: 100,
      y: 100,
      width: 80,
      height: 30,
      borderRadius: 0.2,
      text: '按钮',
      background: '#1890ff',
      color: '#1890ff',
      textColor: '#ffffff',
      activeBackground: '#40a9ff', //选中
      activeColor: '#40a9ff',
      activeTextColor: '#ffffff',
      hoverBackground: '#40a9ff', //鼠标经过
      hoverColor: '#40a9ff',
      hoverTextColor: '#ffffff',
    },
  },
  {
    id: null,
    name: '输入框',
    icon: 'input',
    data: {
      name: 'rectangle',
      x: 100,
      y: 100,
      height: 50,
      width: 200,
      input: true,
      borderRadius: 0.05,
      ellipsis: true,
      text: '输入数据',
      textAlign: 'left',
      color: '#D9D9D9FF',
      textColor: '#000000FF',
      hoverTextColor: '#000000FF',
      activeTextColor: '#000000FF',
      textLeft: 10,
    },
  },
  {
    id: null,
    name: '选择框',
    icon: 'select',
    data: {
      x: 100,
      y: 100,
      height: 50,
      width: 200,
      name: 'rectangle',
      borderRadius: 0.05,
      ellipsis: true,
      text: '选项1',
      textAlign: 'left',
      color: '#D9D9D9FF',
      textColor: '#000000FF',
      hoverTextColor: '#000000FF',
      activeTextColor: '#000000FF',
      textLeft: 10,
      // dropdownList: ["选项1", "选项2", "选项3"],
      dropdownList: [
        { text: '选项1', background: '#ff0000' },
        { text: '选项2', background: '#00ff00' },
        { text: '选项3', background: '#0000ff' },
      ],
    },
  },
  {
    id: null,
    name: '位按钮',
    icon: 'bit',
    data: {
      x: 100,
      y: 100,
      height: 50,
      width: 200,
      name: 'rectangle',
      borderRadius: 0.05,
    },
  },
])
onMounted(() => {
  // 合并 sss 到每个 data 中
  data.value = data.value.map((item) => ({
    ...item,
    data: {
      ...item.data,
      ...DefValues,
    },
  }))
})
const dragStart = (e: any, elem: any) => {
  if (!elem) {
    return
  }
  meta2d.combine()
  e.stopPropagation()

  const data = { ...elem.data }
  data.layerUid = layerStore.layer.uid

  // 拖拽事件
  if (e instanceof DragEvent) {
    // 设置拖拽数据
    e.dataTransfer?.setData('Meta2d', JSON.stringify(data))
  } else {
    // 支持单击添加图元。平板模式
    meta2d.canvas.addCaches = [data]
  }
}
</script>

<template>
  <n-grid :cols="3" x-gap="12" y-gap="12">
    <n-gi v-for="item in data">
      <div
        class="resource-graph-item"
        :draggable="true"
        @dragstart="dragStart($event, item)"
      >
        <SvgIcon :name="item.icon" size="32" />
        <div class="resource-graph-item__label">
          {{ item.name }}
        </div>
      </div>
    </n-gi>
  </n-grid>
</template>

<style lang="scss" scoped>
.resource-graph-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 82px;
  padding: 10px 6px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  cursor: grab;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease,
    background-color 0.18s ease;
}

.resource-graph-item:hover {
  border-color: #22c55e;
  background: #f0fdf4;
}

.resource-graph-item__label {
  width: 100%;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 1.4;
  color: #334155;
}
</style>
