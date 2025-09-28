<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import { ProjectService } from '@/services/ProjectService.ts'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import type { Project } from '@/model/project'
import type { ProjectMonitorDraw, ProjectQuery } from '@/model/draw'
import emitter from '@/utils/eventBus.ts'
import { useDrawStore } from '@/stores/module/draw.ts'
import { getUrlParams } from '@/utils'

const drawStore = useDrawStore()
const currentProjectUid = ref('')
const projectData = ref<Project[]>([])
const drawData = ref<ProjectMonitorDraw[]>([])
const currentDrawHoverIndex = ref()
const projectQueryData = ref<ProjectQuery>({ keyword: '' })
onMounted(() => {
  selectProjectAll()
})

function selectProjectAll() {
  MonitorDrawService.selectProject(projectQueryData.value, getUrlParams().projectUid).then(
    (res) => {
      projectData.value = res
    },
  )
}

function selectDrawByProjectUid() {
  if (!currentProjectUid) return
  MonitorDrawService.selectByProjectUid(currentProjectUid.value).then((res) => {
    drawData.value = res
  })
}

function changeProject(projectUid: string) {
  currentProjectUid.value = projectUid
  selectDrawByProjectUid()
}

function changeDraw(v: string) {
  // debugger
  // 如果传入的 UID 与当前的不同，才更新并通知
  if (drawStore.draw.uid !== v) {
    // 切换时更新保存上一个数据
    // drawStore.draw.data = JSON.stringify(meta2d.data())
    // MonitorDrawService.addOrUpdate(drawStore.draw).then(() => {
    MonitorDrawService.selectByUid(v).then((res) => {
      drawStore.draw = res
      meta2d.open(JSON.parse(drawStore.draw.data))
      meta2d.fitView(true, 5)
      meta2d.render()
      emitter.emit('reloadDraw')
    })
    // })
  }
}
</script>

<template>
  <n-collapse accordion>
    <n-input-group class="p-2">
      <n-input v-model:value="projectQueryData.keyword" />
      <n-button @click="selectProjectAll">搜索</n-button>
    </n-input-group>
    <n-collapse-item
      v-for="(item, index) in projectData"
      :title="item.name"
      :name="item.uid"
      @click="changeProject(item.uid)"
    >
      <n-list v-if="drawData.length > 0">
        <n-list-item
          v-for="(item, index) in drawData"
          :class="
            drawStore.draw.uid === item.uid || currentDrawHoverIndex === index
              ? 'bg-gray-500 cursor-pointer'
              : 'cursor-pointer'
          "
          @mousemove="currentDrawHoverIndex = index"
          @mouseleave="currentDrawHoverIndex = null"
          @click="changeDraw(item.uid)"
        >
          {{ item.name }}
        </n-list-item>
      </n-list>
      <n-empty v-else />
    </n-collapse-item>
  </n-collapse>
</template>

<style lang="scss" scoped>
::v-deep(.n-list) {
  padding-left: 24px;
}

::v-deep(.n-collapse) {
  ::v-deep(.n-collapse-item .n-collapse-item) {
    margin-left: 12px !important;
  }
}
</style>
