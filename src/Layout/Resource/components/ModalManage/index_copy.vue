<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import { NButton } from 'naive-ui'
import type { ProjectMonitorDrawForm, ProjectMonitorVo } from '@/model/draw'
import { getUrlParams } from '@/utils'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { s16 } from '@meta2d/core'
import { MonitorCategoryService } from '@/services/MonitorCategoryService.ts'
import type { ProjectMonitorCategoryForm } from '@/model/category'
import { BASE_DRAW } from '@/model'
import emitter from '@/utils/eventBus.ts'
import { MonitorDrawModalService } from '@/services/MonitorDrawModalService.ts'
import type { ProjectMonitorDrawModalForm, ProjectMonitorModalVo } from '@/model/modal'
import type { ProjectMonitorDrawModalCategoryForm } from '@/model/modalCategory'
import { MonitorDrawModalCategoryService } from '@/services/MonitorDrawModalCategoryService.ts'

const drawData = ref<ProjectMonitorModalVo>({})
const drawFormData = ref<ProjectMonitorDrawModalForm>({})
const drawCategoryFormData = ref<ProjectMonitorDrawModalCategoryForm>({})
const loading = ref<boolean>(false)
const showUpdateCategory = ref<boolean>(false)
const showUpdateDraw = ref<boolean>(false)
const showDeleteDraw = ref<boolean>(false)
const showDeleteDrawCategory = ref<boolean>(false)
const tableKey = ref()

function select() {
  loading.value = true
  const params = getUrlParams()
  MonitorDrawModalService.select(params.projectUid)
    .then((res) => {
      drawData.value = res
      tableKey.value = s16()
    })
    .finally(() => {
      loading.value = false
    })
}

function showUpdateCategoryModal(uid: string) {
  const params = getUrlParams()
  MonitorDrawModalCategoryService.form(params.projectUid, uid).then((res) => {
    drawCategoryFormData.value = res
  })
  showUpdateCategory.value = true
}

function showUpdateDrawModal(uid: string) {
  const params = getUrlParams()
  MonitorDrawModalService.form(params.projectUid, uid).then((res) => {
    drawFormData.value = res
  })
  showUpdateDraw.value = true
}

function showDeleteCategoryModal(uid: string) {
  drawCategoryFormData.value.uid = uid
  showDeleteDrawCategory.value = true
}

function showDeleteDrawModal(uid: string) {
  drawFormData.value.uid = uid
  showDeleteDraw.value = true
}

function confirmUpdateDraw() {
  const data = { ...BASE_DRAW }
  drawFormData.value.jsonData = JSON.stringify(data)
  MonitorDrawModalService.addOrUpdate(drawFormData.value).then(() => {
    showUpdateDraw.value = false
    tableKey.value = s16()
    select()
    emitter.emit('updateModal')
  })
}

function confirmDeleteDraw() {
  MonitorDrawModalService.delete(drawFormData.value.uid).then(() => {
    showDeleteDraw.value = false
    tableKey.value = s16()
    select()
    emitter.emit('updateModal')
  })
}

function confirmDeleteDrawCategory() {
  MonitorDrawModalCategoryService.delete(drawCategoryFormData.value.uid).then(() => {
    showDeleteDrawCategory.value = false
    tableKey.value = s16()
    select()
    emitter.emit('updateModal')
  })
}

function confirmUpdateDrawCategory() {
  MonitorDrawModalCategoryService.addOrUpdate(drawCategoryFormData.value).then(() => {
    showUpdateCategory.value = false
    tableKey.value = s16()
    select()
    emitter.emit('updateModal')
  })
}

onMounted(() => {
  select()
})
</script>

<template>
  <div class="flex gap-2 mb-2">
    <n-button @click="showUpdateCategoryModal('')" type="primary" size="small">新增分组</n-button>
    <n-button @click="showUpdateDrawModal('')" type="primary" size="small">新增图纸</n-button>
  </div>
  <vxe-table
    :loading="loading"
    :key="tableKey"
    :data="drawData.categoryVoList"
    :tree-config="{ childrenField: 'drawList', expandAll: true }"
    max-height="500"
  >
    <vxe-column
      field="name"
      title="名称"
      show-overflow="tooltip"
      tree-node
      width="90%"
    ></vxe-column>
    <vxe-column fixed="right" title="操作" align="center">
      <template #default="{ row }">
        <div class="flex gap-2">
          <n-button
            type="info"
            text
            @click="row.drawList ? showUpdateCategoryModal(row.uid) : showUpdateDrawModal(row.uid)"
            >编辑
          </n-button>
          <n-button
            type="error"
            text
            v-if="!row.def"
            @click="row.drawList ? showDeleteCategoryModal(row.uid) : showDeleteDrawModal(row.uid)"
            >删除
          </n-button>
        </div>
      </template>
    </vxe-column>
  </vxe-table>
  <n-modal
    :mask-closable="false"
    type="error"
    title="警告"
    content="确定删除该图纸吗!"
    positive-text="确定"
    @positive-click="confirmDeleteDraw"
    v-model:show="showDeleteDraw"
    preset="dialog"
  />
  <n-modal
    :mask-closable="false"
    type="error"
    title="警告"
    content="确定删除该分组吗，将会清除所有图纸!"
    positive-text="确定"
    @positive-click="confirmDeleteDrawCategory"
    v-model:show="showDeleteDrawCategory"
    preset="dialog"
  />
  <n-modal v-model:show="showUpdateCategory" title="分组信息" preset="card" style="width: 600px">
    <n-form>
      <n-form-item label="分组名称">
        <n-input v-model:value="drawCategoryFormData.name" />
      </n-form-item>
    </n-form>
    <template #footer>
      <div class="flex justify-end">
        <n-button type="primary" @click="confirmUpdateDrawCategory">确定</n-button>
      </div>
    </template>
  </n-modal>
  <n-modal v-model:show="showUpdateDraw" title="图纸信息" preset="card" style="width: 600px">
    <n-form>
      <n-form-item label="分组">
        <n-select
          v-model:value="drawFormData.categoryUid"
          :options="drawFormData.categoryOptions"
        />
      </n-form-item>
      <n-form-item label="图纸名称">
        <n-input v-model:value="drawFormData.name" />
      </n-form-item>
      <n-form-item label="默认图纸">
        <n-switch v-model:value="drawFormData.def" />
      </n-form-item>
    </n-form>
    <template #footer>
      <div class="flex justify-end">
        <n-button type="primary" @click="confirmUpdateDraw">确定</n-button>
      </div>
    </template>
  </n-modal>
</template>

<style lang="scss" scoped></style>
