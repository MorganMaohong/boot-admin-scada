<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import { NButton } from 'naive-ui'
import type { ProjectMonitorDraw, ProjectMonitorDrawForm, ProjectMonitorVo } from '@/model/draw'
import { getUrlParams } from '@/utils'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { s16 } from '@meta2d/core'
import { MonitorCategoryService } from '@/services/MonitorCategoryService.ts'
import type { ProjectMonitorCategoryForm } from '@/model/category'
import { BASE_DRAW } from '@/model'
import emitter from '@/utils/eventBus.ts'
import type { FormInstance } from 'vant'

const drawData = ref<ProjectMonitorVo>({})
const drawFormData = ref<ProjectMonitorDrawForm>({})
const drawCategoryFormData = ref<ProjectMonitorCategoryForm>({})
const loading = ref<boolean>(false)
const showUpdateCategory = ref<boolean>(false)
const showUpdateDraw = ref<boolean>(false)
const showDeleteDraw = ref<boolean>(false)
const showDeleteDrawCategory = ref<boolean>(false)
const tableKey = ref()
const formRef = ref<FormInst>({})
const formRule = {
  categoryUid: {
    required: true,
    message: '请选择分组',
    trigger: 'change',
    type: 'string',
  },
  name: {
    required: true,
    message: '请输入弹窗名称',
    trigger: ['input', 'blur'],
  },
  title: {
    required: true,
    message: '请输入弹窗标题',
    trigger: ['input', 'blur'],
  },
  width: {
    required: true,
    message: '请输入宽度',
    trigger: ['input', 'blur'],
    type: 'number',
  },
  height: {
    required: true,
    message: '请输入高度',
    trigger: ['input', 'blur'],
    type: 'number',

  },
}

function selectDraw() {
  loading.value = true
  const params = getUrlParams()
  MonitorDrawService.selectModal(params.projectUid)
    .then((res) => {
      drawData.value = res
      tableKey.value = s16()
    })
    .catch(() => {
      drawData.value = {
        categoryVoList: [],
        defCategory: {},
        defDraw: {},
      }
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
  drawFormData.value = createDrawForm(uid)
  showUpdateDraw.value = true
}

function createDrawForm(uid = ''): ProjectMonitorDrawForm {
  const params = getUrlParams()
  const categoryOptions = getCategoryOptions()
  const draw = uid ? findDraw(uid) : null
  const defaultCategoryUid = categoryOptions[0]?.value || ''

  return {
    ...(draw || {}),
    uid,
    projectUid: params.projectUid,
    categoryUid: draw?.categoryUid || defaultCategoryUid,
    name: draw?.name || '',
    title: draw?.title || '',
    width: draw?.width || 800,
    height: draw?.height || 600,
    visible: draw?.visible ?? true,
    def: draw?.def ?? false,
    data: draw?.data || '',
    jsonData: draw?.data || JSON.stringify(BASE_DRAW),
    categoryOptions,
  } as ProjectMonitorDrawForm
}

function getCategoryOptions() {
  return (drawData.value.categoryVoList || []).map((item) => ({
    label: item.name,
    value: item.uid,
  }))
}

function findDraw(uid: string): ProjectMonitorDraw | null {
  for (const category of drawData.value.categoryVoList || []) {
    const draw = category.drawList?.find((item) => item.uid === uid)
    if (draw) return draw
  }
  return null
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
  formRef.value.validate((valid) => {
    if (valid) return
    if (!drawFormData.value.jsonData) {
      drawFormData.value.jsonData = JSON.stringify(BASE_DRAW)
    }
    MonitorDrawService.addOrUpdateModal(drawFormData.value).then(() => {
      showUpdateDraw.value = false
      tableKey.value = s16()
      selectDraw()
      emitter.emit('updateDraw')
    })
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
  MonitorCategoryService.addOrUpdateModal(drawCategoryFormData.value).then(() => {
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
  <div class="flex gap-2 mb-2">
    <n-button @click="showUpdateCategoryModal('')" type="primary" size="small">新增分组</n-button>
    <n-button @click="showUpdateDrawModal('')" type="primary" size="small">新增弹窗图纸</n-button>
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
  <n-modal v-model:show="showUpdateDraw" title="弹窗信息" preset="card" style="width: 600px">
    <n-form ref="formRef" :model="drawFormData" :rules="formRule">
      <n-grid cols="2" x-gap="12">
        <n-gi span="2">
          <n-form-item label="分组" path="categoryUid">
            <n-select
              v-model:value="drawFormData.categoryUid"
              :options="drawFormData.categoryOptions"
            />
          </n-form-item>
        </n-gi>
        <n-gi span="2">
          <n-form-item label="弹窗名称" path="name">
            <n-input v-model:value="drawFormData.name" />
          </n-form-item>
        </n-gi>
        <n-gi span="2">
          <n-form-item label="弹窗标题" path="title">
            <n-input v-model:value="drawFormData.title" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="宽度" path="width">
            <n-input-number
              v-model:value="drawFormData.width"
              :show-button="false"
              class="w-full"
            />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="高度" path="height">
            <n-input-number
              v-model:value="drawFormData.height"
              :show-button="false"
              class="w-full"
            />
          </n-form-item>
        </n-gi>
      </n-grid>
    </n-form>
    <template #footer>
      <div class="flex justify-end">
        <n-button type="primary" @click="confirmUpdateDraw">确定</n-button>
      </div>
    </template>
  </n-modal>
</template>

<style lang="scss" scoped></style>
