<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { getUrlParams } from '@/utils'
import { useDrawStore } from '@/stores/module/draw.ts'
import emitter from '@/utils/eventBus.ts'
import type { ProjectMonitorDraw, ProjectMonitorVo } from '@/model/draw'
import { s16 } from '@meta2d/core'
import { useLayerStore } from '@/stores/module/layer.ts'
const layerStore = useLayerStore()
const drawStore = useDrawStore()
const data = ref<ProjectMonitorVo>({
  categoryVoList: [],
  defCategory: {},
  defDraw: {},
})
const currentDrawValue = ref('')
const key = ref(s16())
onMounted(() => {
  select()
  emitter.on('updateDraw', () => {
    select()
  })
})

function select() {
  const params = getUrlParams()
  MonitorDrawService.selectModal(params.projectUid)
    .then((res) => {
      data.value = res
    })
    .finally(() => {
      key.value = s16()
      /*if (!drawStore.draw || !currentDrawValue.value) {
        currentDrawValue.value = data.value.defDraw.uid
        drawStore.draw = data.value.defDraw
        emitter.emit('draw')
        key.value = s16()
      }*/
    })
}

function changeDraw(v: string) {
  // 如果传入的 UID 与当前的不同，才更新并通知
  if (drawStore.draw.uid !== v) {
    // 切换时更新保存上一个数据
    // drawStore.draw.data = JSON.stringify(meta2d.data())
    // MonitorDrawService.save(drawStore.draw.data, drawStore.draw.uid).then(() => {
    MonitorDrawService.selectByUid(v).then((res) => {
      drawStore.draw = res
      meta2d.open(JSON.parse(drawStore.draw.data))
      meta2d.fitView(true, 0)
      meta2d.render()
      emitter.emit('reloadDraw')
      // })
    }).finally(() => {
      layerStore.getDefaultLayer();
    })
  }
}
</script>

<template>
  <n-menu
    :key="key"
    :options="data.categoryVoList"
    :render-label="
      (option) => {
        return option.name
      }
    "
    key-field="uid"
    children-field="drawList"
    @update:value="changeDraw"
    default-expand-all
    v-model:value="drawStore.draw.uid"
  ></n-menu>
</template>

<style lang="scss" scoped></style>
