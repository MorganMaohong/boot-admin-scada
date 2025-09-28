<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import type { BasicGraph } from '@/model/res/basic'
import SvgIcon from '@/components/SvgIcon/index.vue'
import { parseSvg } from '@meta2d/svg'
import { deepClone, LockState } from '@meta2d/core'
import FastUpload from '@/components/FastUpload/index.vue'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { DefValues } from '@/Layout/Resource/components'

const data = ref<any[]>([
  {
    id: null,
    data: {
      name: 'rectangle',
      width: 100,
      height: 100,
      html: `
    <table id="myTable" class="vxe-table">
      <thead><tr><th>姓名</th><th>年龄</th></tr></thead>
      <tbody><tr><td>张三</td><td>28</td></tr></tbody>
    </table>
  `,
    },
  },
])
onMounted(() => {})
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

  // 拖拽事件
  if (e instanceof DragEvent) {
    // 设置拖拽数据
    e.dataTransfer?.setData('Meta2d', JSON.stringify(elem.data))
  } else {
    // 支持单击添加图元。平板模式
    meta2d.canvas.addCaches = [elem.data]
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
