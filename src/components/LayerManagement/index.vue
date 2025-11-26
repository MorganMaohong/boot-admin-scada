<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { LockTwotone, UnlockTwotone } from '@vicons/antd'
import { MonitorLayerService } from '@/services/MonitorLayerService.ts'
import { useDrawStore } from '@/stores/module/draw.ts'
import type { ProjectMonitorLayer, ProjectMonitorLayerForm } from '@/model/layer'
import { resetRef } from '@/utils'
import { useLayerStore } from '@/stores/module/layer.ts'
import { LockState } from '@meta2d/core'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'

const drawStore = useDrawStore()
const layerStore = useLayerStore()
const data = ref<ProjectMonitorLayer[]>([])
const showAddOrUpdate = ref(false)
const layerForm = ref<ProjectMonitorLayerForm>({})
const loading = ref(false)
const showCopy = ref(false)
onMounted(() => {
  select()
})

function select() {
  loading.value = true
  MonitorLayerService.select(drawStore.draw.uid)
    .then((res) => {
      console.log(res)
      data.value = res
    })
    .finally(() => {
      loading.value = false
    })
}

function showAddOrUpdateModal(isUpdate: boolean) {
  layerForm.value = resetRef(layerForm.value)
  if (isUpdate) {
    layerForm.value = { ...layerStore.layer }
    showAddOrUpdate.value = true
  } else {
    showAddOrUpdate.value = true
  }
}

function addOrUpdate() {
  if (!layerForm.value.name) {
    window.$message.error('请输入完整名称')
    return
  } else {
    layerForm.value.drawUid = drawStore.draw.uid
    layerForm.value.projectUid = drawStore.draw.projectUid
    MonitorLayerService.addOrUpdate(layerForm.value)
      .then((res) => {
        select()
        showAddOrUpdate.value = false
      })
      .finally(() => {
        layerForm.value = resetRef(layerForm.value)
      })
  }
}

function changeDefaultLayer(layerUid: string) {
  MonitorLayerService.changeDefaultLayer(drawStore.draw.uid, layerUid).then(() => {
    layerStore.getDefaultLayer()
    select()
  })
}

function save() {
  drawStore.draw.data = JSON.stringify(meta2d.data())
  MonitorDrawService.save(drawStore.draw.data, drawStore.draw.uid)
}

function getLayerPens(layerUid: string) {
  const pens = meta2d.data().pens
  console.log(pens)
  // 预先建立索引
  const layerPensMap = new Map()
  pens.forEach((pen) => {
    if (!layerPensMap.has(pen.layerUid)) {
      layerPensMap.set(pen.layerUid, [])
    }
    layerPensMap.get(pen.layerUid).push(pen)
  })

  // 查询时直接获取 - O(1) 时间复杂度
  return layerPensMap.get(layerUid) || []
}

function updateLayerCheck(layer: ProjectMonitorLayerForm) {
  console.log(layer)
  MonitorLayerService.addOrUpdate(layer).then((res) => {
    select()
    const layerPens = getLayerPens(layer.uid)
    layerPens.forEach((pen) => {
      meta2d.setValue({ id: pen.id, visible: layer.visible })
      meta2d.render()
    })
    save()
  })
}

function updateLayerLock(layer: ProjectMonitorLayerForm, locked: boolean) {
  layer.locked = locked
  MonitorLayerService.addOrUpdate(layer).then((res) => {
    select()
    const layerPens = getLayerPens(layer.uid)
    layerPens.forEach((pen) => {
      meta2d.setValue({ id: pen.id, locked: layer.locked ? LockState.Disable : LockState.None })
      meta2d.render()
    })
    save()
  })
}

function deleteLayer() {
  MonitorLayerService.delete(layerStore.layer.uid)
    .then((res) => {
      select()
      const layerPens = getLayerPens(layerStore.layer.uid)
      meta2d.delete(layerPens)
      save()
    })
    .finally(() => {
      layerStore.getDefaultLayer()
    })
}

function showCopyModal() {
  layerForm.value = resetRef(layerForm.value)
  layerForm.value = { ...layerStore.layer }
  layerForm.value.id = null
  layerForm.value.uid = null
  layerForm.value.name = null
  layerForm.value.defaultLayer = false
  showCopy.value = true
}

function onCopyClick() {
  // 复制pen属性
  MonitorLayerService.copy(layerForm.value).then((res) => {
    const copyLayer = res
    const pens = getLayerPens(layerStore.layer.uid)
    pens.forEach((pen) => {
      pen.id = null
      pen.layerUid = copyLayer.uid
      meta2d.addPen(pen)
    })
    save()
    showCopy.value = false
  })
}
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <div class="flex-1">
      <n-scrollbar style="max-height: 285px">
        <n-list bordered>
          <n-list-item
            class="cursor-pointer"
            :style="[item.defaultLayer && { backgroundColor: '#c1c1c1' }]"
            v-for="(item, index) in data"
            :key="index"
            @click.stop="changeDefaultLayer(item.uid)"
          >
            <div class="flex items-center gap-2">
              <n-icon size="16">
                <LockTwotone v-if="item.locked" @click.stop="updateLayerLock(item, false)" />
                <UnlockTwotone v-else @click.stop="updateLayerLock(item, true)" />
              </n-icon>
              <n-checkbox v-model:checked="item.visible" @click.stop="updateLayerCheck(item)" />
              <div>{{ item.name }}</div>
            </div>
          </n-list-item>
        </n-list>
      </n-scrollbar>
    </div>
    <div class="flex gap-2 justify-end mt-2">
      <n-button size="small" @click="deleteLayer()">删除</n-button>
      <n-button size="small" @click="showAddOrUpdateModal(true)">编辑</n-button>
      <n-button size="small" @click="showCopyModal">复制</n-button>
      <n-button size="small" @click="showAddOrUpdateModal(false)">新增</n-button>
      <!--      <n-icon size="24">
              <LayersFilled />
            </n-icon>
            <n-icon size="24">
              <LayersFilled />
            </n-icon>
            <n-icon size="24">
              <LayersFilled />
            </n-icon>
            <n-icon size="24">
              <LayersFilled />
            </n-icon>
            <n-icon size="24">
              <LayersFilled />
            </n-icon>-->
    </div>
    <n-modal v-model:show="showAddOrUpdate" preset="card" style="width: 300px">
      <n-input v-model:value="layerForm.name" />
      <div class="flex justify-end mt-2">
        <n-button size="small" @click="addOrUpdate">确定</n-button>
      </div>
    </n-modal>
    <n-modal v-model:show="showCopy" preset="card" style="width: 300px">
      <n-input v-model:value="layerForm.name" />
      <div class="flex justify-end mt-2">
        <n-button size="small" @click="onCopyClick">确定</n-button>
      </div>
    </n-modal>
  </div>
</template>

<style lang="scss" scoped></style>
