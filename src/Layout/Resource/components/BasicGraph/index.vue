<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import type { BasicGraph } from '@/model/res/basic'
import SvgIcon from '@/components/SvgIcon/index.vue'
import { DefValues } from '@/Layout/Resource/components'
import { useLayerStore } from '@/stores/module/layer.ts'

const layerStore = useLayerStore()
const data = ref<BasicGraph[]>([
  {
    name: '正方形',
    icon: 'rect',
    id: 1,
    data: {
      width: 100,
      height: 100,
      name: 'square',
    },
  },
  {
    name: '矩形',
    icon: 'rectangle',
    id: 2,
    data: {
      width: 200,
      height: 50,
      borderRadius: 0.1,
      name: 'rectangle',
    },
  },
  {
    name: '圆',
    icon: 'circle',
    id: 3,
    data: {
      width: 100,
      height: 100,
      name: 'circle',
    },
  },
  {
    name: '三角形',
    icon: 'triangle',
    id: 4,
    data: {
      width: 100,
      height: 100,
      name: 'triangle',
    },
  },
  {
    name: '菱形',
    icon: 'diamond',
    id: 5,
    data: {
      width: 100,
      height: 100,
      name: 'diamond',
    },
  },
  {
    name: '五边形',
    icon: 'pentagon',
    id: 6,
    data: {
      width: 100,
      height: 100,
      name: 'pentagon',
    },
  },
  {
    name: '六边形',
    icon: 'hexagon',
    id: 7,
    data: {
      width: 100,
      height: 100,
      name: 'hexagon',
    },
  },
  {
    name: '五角星',
    icon: 'pentagram',
    id: 8,
    data: {
      width: 100,
      height: 100,
      name: 'pentagram',
    },
  },
  {
    name: '左箭头',
    icon: 'arrow-left',
    id: 9,
    data: {
      width: 120,
      height: 60,
      name: 'leftArrow',
    },
  },
  {
    name: '右箭头',
    icon: 'arrow-right',
    id: 10,
    data: {
      width: 120,
      height: 60,
      name: 'rightArrow',
    },
  },
  {
    name: '双向箭头',
    icon: 'twoway-arrow',
    id: 11,
    data: {
      width: 150,
      height: 60,
      name: 'twowayArrow',
    },
  },
  {
    name: '云',
    icon: 'cloud',
    id: 13,
    data: {
      width: 100,
      height: 100,
      name: 'cloud',
    },
  },
  {
    name: '消息框',
    icon: 'msg',
    id: 14,
    data: {
      textTop: -0.1,
      width: 100,
      height: 100,
      name: 'message',
    },
  },
  {
    name: '文件',
    icon: 'file',
    id: 15,
    data: {
      width: 80,
      height: 100,
      name: 'file',
    },
  },
  {
    name: '立方体',
    icon: 'cube',
    id: 18,
    data: {
      width: 60,
      height: 100,
      name: 'cube',
      z: 0.25,
      props: {
        custom: [
          {
            key: 'z',
            label: 'Z',
            type: 'number',
            min: 0,
            placeholder: '<= 1 即宽度的比例',
          },
          {
            key: 'backgroundFront',
            label: '前背景色',
            type: 'color',
          },
          {
            key: 'backgroundUp',
            label: '顶背景色',
            type: 'color',
          },
          {
            key: 'backgroundRight',
            label: '右背景色',
            type: 'color',
          },
        ],
      },
    },
  },
  {
    name: '人',
    icon: 'people',
    id: 19,
    data: {
      width: 70,
      height: 100,
      name: 'people',
    },
  },
  {
    name: '文本',
    icon: 'text',
    id: null,
    data: {
      width: 200,
      height: 50,
      name: 'text',
      text: '文本',
    },
  },
  {
    name: '卡片',
    icon: 'rectangle',
    id: 20,
    data: {
      width: 280,
      height: 180,
      name: 'scadaCard',
      text: '',
      background: '#ffffff',
      color: '#dbe4ef',
      lineWidth: 1,
      borderRadius: 8,
      scadaShadow: true,
    },
  },
  {
    name: '序号圆点',
    icon: 'circle',
    id: 21,
    data: {
      width: 46,
      height: 46,
      name: 'scadaBadge',
      text: '',
      scadaText: '1',
      background: '#0f9f8f',
      color: '#0f9f8f',
      textColor: '#ffffff',
      fontSize: 22,
      fontWeight: 700,
    },
  },
  {
    name: '数值',
    icon: 'text',
    id: 22,
    data: {
      width: 90,
      height: 32,
      name: 'scadaValue',
      text: '',
      textColor: '#0f172a',
      fontSize: 22,
      fontWeight: 700,
      textAlign: 'right',
      textBaseline: 'middle',
      scadaEmptyText: '--',
      scadaPrecision: 2,
    },
  },
  {
    name: '分割线',
    icon: 'line',
    id: 23,
    data: {
      width: 220,
      height: 8,
      name: 'scadaDivider',
      color: '#e2e8f0',
      lineWidth: 1,
      scadaDirection: 'horizontal',
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
  <n-grid :cols="3" x-gap="8" y-gap="8">
    <n-gi v-for="item in data">
      <div class="resource-graph-item" :draggable="true" @dragstart="dragStart($event, item)">
        <SvgIcon :name="item.icon" size="28" />
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
