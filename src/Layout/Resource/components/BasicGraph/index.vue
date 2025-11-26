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
  <n-grid :cols="3" x-gap="4" y-gap="4">
    <n-gi v-for="item in data">
      <div
        class="flex flex-col justify-center items-center p-2 hovers"
        :draggable="true"
        @dragstart="dragStart($event, item)"
      >
        <SvgIcon :name="item.icon" size="28" />
        <div class="text-xs w-full text-center whitespace-nowrap overflow-hidden text-ellipsis">
          {{ item.name }}
        </div>
      </div>
    </n-gi>
  </n-grid>
</template>

<style lang="scss" scoped>
.hovers {
  border: 1px solid transparent;
}

.hovers:hover {
  border: 1px solid #1b56fd;
}
</style>
