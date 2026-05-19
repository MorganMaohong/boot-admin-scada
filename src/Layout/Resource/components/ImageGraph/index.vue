<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import type { BasicGraph } from '@/model/res/basic'
import SvgIcon from '@/components/SvgIcon/index.vue'
import { parseSvg } from '@meta2d/svg'
import { CanvasLayer, deepClone, LockState } from '@meta2d/core'
import FastUpload from '@/components/FastUpload/index.vue'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { DefValues } from '@/Layout/Resource/components'
import { useLayerStore } from '@/stores/module/layer.ts'
const layerStore = useLayerStore()
const data = ref<any[]>([])
onMounted(() => {
  MonitorDrawService.images().then((res) => {
    res.forEach((url) => {
      data.value.push({
        id: null,
        name: '矩形',
        icon: '',
        data: {
          width: 200,
          height: 200,
          name: 'rectangle',
          image: url,
          locked: LockState.None,
          color: '#00000000',
          background: '#00000000',
          imageRatio: true,
          canvasLayer: CanvasLayer.CanvasMain,
        },
      })
    })
  })
})
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
      <n-image :src="item.data.image" :draggable="true" @dragstart="dragStart($event, item)" />
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
