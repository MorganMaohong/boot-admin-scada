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

const drawData = ref<ProjectMonitorVo>({})
const drawFormData = ref<ProjectMonitorDrawForm>({})
const drawCategoryFormData = ref<ProjectMonitorCategoryForm>({})
const loading = ref<boolean>(false)
const showUpdateCategory = ref<boolean>(false)
const showUpdateDraw = ref<boolean>(false)
const showDeleteDraw = ref<boolean>(false)
const showDeleteDrawCategory = ref<boolean>(false)
const tableKey = ref()

function selectDraw() {
  loading.value = true
  const params = getUrlParams()
  MonitorDrawService.select(params.projectUid)
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
  MonitorCategoryService.form(params.projectUid, uid).then((res) => {
    drawCategoryFormData.value = res
  })
  showUpdateCategory.value = true
}

function showUpdateDrawModal(uid: string) {
  const params = getUrlParams()
  MonitorDrawService.form(params.projectUid, uid).then((res) => {
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
  MonitorDrawService.addOrUpdate(drawFormData.value).then(() => {
    showUpdateDraw.value = false
    tableKey.value = s16()
    selectDraw()
    emitter.emit('updateDraw')
  })
}

function confirmDeleteDraw() {
  MonitorDrawService.delete(drawFormData.value.uid).then(() => {
    showDeleteDraw.value = false
    tableKey.value = s16()
    selectDraw()
    emitter.emit('updateDraw')
  })
}

function confirmDeleteDrawCategory() {
  MonitorCategoryService.delete(drawCategoryFormData.value.uid).then(() => {
    showDeleteDrawCategory.value = false
    tableKey.value = s16()
    selectDraw()
    emitter.emit('updateDraw')
  })
}

function confirmUpdateDrawCategory() {
  MonitorCategoryService.addOrUpdate(drawCategoryFormData.value).then(() => {
    showUpdateCategory.value = false
    tableKey.value = s16()
    selectDraw()
    emitter.emit('updateDraw')
  })
}

onMounted(() => {
  selectDraw()
})
</script>

<template>
  <div class="manage-panel">
    <div class="manage-panel__toolbar">
      <div class="manage-panel__title">
        <div class="manage-panel__headline">图纸目录</div>
        <div class="manage-panel__caption">管理分组、默认图纸和目录结构</div>
      </div>
      <div class="manage-panel__actions">
        <n-button @click="showUpdateCategoryModal('')" type="primary" ghost>新增分组</n-button>
        <n-button @click="showUpdateDrawModal('')" type="primary">新增图纸</n-button>
      </div>
    </div>

    <div class="manage-table-shell">
      <vxe-table
        class="manage-table"
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
        <vxe-column fixed="right" title="操作" align="center" width="140">
          <template #default="{ row }">
            <div class="manage-table__row-actions">
              <n-button
                type="primary"
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
    </div>
  </div>
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
    <div class="manage-modal">
      <n-form label-placement="top">
        <n-form-item label="分组名称">
          <n-input v-model:value="drawCategoryFormData.name" />
        </n-form-item>
      </n-form>
    </div>
    <template #footer>
      <div class="manage-modal__footer">
        <n-button type="primary" @click="confirmUpdateDrawCategory">确定</n-button>
      </div>
    </template>
  </n-modal>
  <n-modal v-model:show="showUpdateDraw" title="图纸信息" preset="card" style="width: 600px">
    <div class="manage-modal">
      <n-form label-placement="top">
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
    </div>
    <template #footer>
      <div class="manage-modal__footer">
        <n-button type="primary" @click="confirmUpdateDraw">确定</n-button>
      </div>
    </template>
  </n-modal>
</template>

<style lang="scss" scoped>
.manage-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.manage-panel__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.manage-panel__headline {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.manage-panel__caption {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.manage-panel__actions {
  display: flex;
  gap: 8px;
}

.manage-table-shell {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.manage-table__row-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.manage-modal {
  padding-top: 4px;
}

.manage-modal__footer {
  display: flex;
  justify-content: flex-end;
}

::v-deep(.manage-table .vxe-table--header-wrapper) {
  background: #f8fafc;
}

::v-deep(.manage-table .vxe-header--column) {
  font-weight: 600;
  color: #334155;
}

::v-deep(.manage-table .vxe-body--row:hover) {
  background: #f8fbff;
}

::v-deep(.manage-table .vxe-body--column) {
  height: 46px;
  color: #1f2937;
}
</style>
