<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { Folder16Regular } from '@vicons/fluent'
import { PencilAlt, PenFancy } from '@vicons/fa'
import { Save, Search, View } from '@vicons/carbon'
import { Lock, LockOff, LockOpen, MapPin } from '@vicons/tabler'
import { LineNameEnums, LineNameOptions } from '@/components/ElementsProps/model'
import emitter from '@/utils/eventBus.ts'
import { getUrlParams } from '@/utils'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { useDrawStore } from '@/stores/module/draw.ts'
import { BASE_DRAW, type OptionVo } from '@/model'
import type { ProjectMonitorDrawForm, ProjectMonitorVo } from '@/model/draw'
import type { ProjectMonitorCategoryForm } from '@/model/category'
import { MonitorCategoryService } from '@/services/MonitorCategoryService.ts'
import { LockState, s16 } from '@meta2d/core'
import type { Meta2dStore, Pen, Point } from '@meta2d/core'
import { NButton } from 'naive-ui'
import SvgIcon from '@/components/SvgIcon/index.vue'
import SystemImageCallery from '@/components/SystemImageCallery/index.vue'
import { getAuthToken } from '@/utils/auth'
import { cleanupMeta2dPens } from '@/utils/meta2dPens.ts'
import { markDrawEditSaved, syncDrawStoreDataFromCanvas } from '@/utils/drawEditState.ts'

const isMagnifier = ref<boolean>(false)
const currentLineType = ref<string>('curve')
const isMap = ref(false)
const drawStore = useDrawStore()
const presetOptions = ref<OptionVo[]>([
  { label: '1920 * 1080', value: 0 },
  { label: '1200 * 720', value: 1 },
  { label: '1440 * 900', value: 2 },
])
const fileOptions = ref<OptionVo[]>([
  { label: '新建目录', value: 'createCategory' },
  { label: '新建图纸', value: 'createDraw' },
  { label: '图纸管理', value: 'drawManager' },
  { label: '上传文件', value: 'uploadImage' },
])
const showUpdateCategory = ref<boolean>(false)
const showUpdateDraw = ref<boolean>(false)
const showDrawManager = ref<boolean>(false)
const showDeleteDraw = ref<boolean>(false)
const showDeleteDrawCategory = ref<boolean>(false)
const drawFormData = ref<ProjectMonitorDrawForm>({})
const drawCategoryFormData = ref<ProjectMonitorCategoryForm>({})
const drawData = ref<ProjectMonitorVo>({})
const showUploadImage = ref<boolean>(false)
const tableKey = ref(s16())
const locked = ref()
const showImageGallery = ref(false)
const scale = ref(0)
onMounted(() => {
  emitter.on('meta2d-ready', () => {
    currentLineType.value = meta2d.getOptions().drawingLineName
    meta2d.addDrawLineFn('newLineName', myLineFn)
    if (meta2d.store.data.locked) {
      locked.value = meta2d.store.data.locked
    } else {
      locked.value = LockState.None
      meta2d.store.data.locked = locked.value
      meta2d.render()
    }
    scale.value = meta2d.store.data.scale
  })
})
// store - 表示引擎数据存储
// pen - 当前绘画的连线
// mousedwon - 鼠标按下的初始位置
function myLineFn(store: Meta2dStore, pen: Pen, mousedwon?: Point) {
  pen.lineName = 'curve'
  pen.autoTo = true
  pen.autoFrom = true
  if (!pen.calculative.worldAnchors) {
    pen.calculative.worldAnchors = []
  }
}

function drawPenLine() {
  if (drawStore.isPenDrawLine) {
    drawStore.isPenDrawLine = false
    meta2d.finishDrawLine()
    meta2d.store.options.disableAnchor = false
    window.removeEventListener('keydown', handlePenKeyDown)
  } else {
    drawStore.isPencilDrawLine = false
    drawStore.isPenDrawLine = true
    meta2d.drawLine(meta2d.store.options.drawingLineName)
    window.addEventListener('keydown', handlePenKeyDown)
  }
}

function handlePenKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    console.log('按下 ESC，取消绘画')
    drawStore.isPenDrawLine = false
    meta2d.finishDrawLine()
    meta2d.store.options.disableAnchor = false
    window.removeEventListener('keydown', handlePenKeyDown)
  }
  if (e.key === 'Alt') {
    console.log(meta2d.store.options.drawingLineName)
    let name = ''
    if (meta2d.store.options.drawingLineName === LineNameEnums.curve) {
      name = LineNameEnums.polyline
    } else if (meta2d.store.options.drawingLineName === LineNameEnums.line) {
      name = LineNameEnums.curve
    } else if (meta2d.store.options.drawingLineName === LineNameEnums.polyline) {
      name = LineNameEnums.line
    }
    meta2d.store.options.drawingLineName = name
    currentLineType.value = name
  }
}

function drawPencilLine() {
  if (drawStore.isPencilDrawLine) {
    drawStore.isPencilDrawLine = false
    meta2d.store.options.disableAnchor = false
    meta2d.stopPencil()
    window.removeEventListener('keydown', handlePencilKeyDown)
  } else {
    drawStore.isPencilDrawLine = true
    meta2d.drawingPencil()
    meta2d.store.options.disableAnchor = true
    window.addEventListener('keydown', handlePencilKeyDown)
  }
}

function handlePencilKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    console.log('按下 ESC，取消绘画')
    drawStore.isPencilDrawLine = false
    meta2d.stopPencil()
    meta2d.store.options.disableAnchor = false
    window.removeEventListener('keydown', handlePencilKeyDown)
  }
}

function handleSelectLine(v: string) {
  currentLineType.value = v
  meta2d.store.options.drawingLineName = v
  meta2d.canvas.drawingLineName && (meta2d.canvas.drawingLineName = v)
  meta2d.store.active?.forEach((pen) => {
    meta2d.updateLineType(pen, v)
  })
}

function changeHawkeyeMap() {
  if (isMap.value) {
    // 关闭缩略地图
    meta2d.hideMap()
    isMap.value = false
  } else {
    // 显示缩略地图
    meta2d.showMap()
    isMap.value = true
  }
}

function onView() {
  // 先停止动画，避免数据波动
  meta2d.stopAnimate()

  setTimeout(() => {
    const data = syncDrawStoreDataFromCanvas()
    if (!data) return
    drawStore.draw.data = data

    MonitorDrawService.save(data, drawStore.draw.uid).then(() => {
      markDrawEditSaved(drawStore.draw.uid)
      // 构建预览 URL
      const queryParams = new URLSearchParams({
        projectUid: getUrlParams().projectUid,
        drawUid: drawStore.draw.uid,
      })
      const token = getAuthToken()
      if (token) queryParams.set('accessToken', token)
      const query = queryParams.toString()
      let previewUrl
      if (import.meta.env.MODE === 'development') {
        previewUrl = `${location.origin}${import.meta.env.VITE_PREVIEW_PATH}?${query}`
      } else if (import.meta.env.MODE === 'production') {
        previewUrl = `${location.origin}${import.meta.env.VITE_PREVIEW_PATH}?${query}`
      } else {
        window.$message.error('预览路径出错!')
        return
      }
      // 打开新窗口预览
      window.open(previewUrl, '_blank')
    })
  }, 1000)
}

function showMagnifier() {
  if (isMagnifier.value) {
    isMagnifier.value = false
    meta2d.hideMagnifier()
  } else {
    isMagnifier.value = true
    meta2d.showMagnifier()
  }
}

function save() {
  const data = syncDrawStoreDataFromCanvas()
  if (!data || !drawStore.draw?.uid) return
  drawStore.draw.data = data
  MonitorDrawService.save(data, drawStore.draw.uid).then(() => {
    markDrawEditSaved(drawStore.draw.uid)
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

function showDrawManagerModal() {
  selectDraw()
  showDrawManager.value = true
}

function showDeleteCategoryModal(uid: string) {
  drawCategoryFormData.value.uid = uid
  showDeleteDrawCategory.value = true
}

function showDeleteDrawModal(uid: string) {
  drawFormData.value.uid = uid
  showDeleteDraw.value = true
}

function handleSelectFile(v: string) {
  switch (v) {
    case 'createDraw':
      showUpdateDrawModal('')
      break
    case 'createCategory':
      showUpdateCategoryModal('')
      break
    case 'drawManager':
      showDrawManagerModal()
      break
    case 'uploadImage':
      showUploadImage.value = true
      break
  }
}

function selectDraw() {
  const params = getUrlParams()
  MonitorDrawService.select(params.projectUid).then((res) => {
    drawData.value = res
    tableKey.value = s16()
  })
}

function confirmUpdateDraw() {
  const data = { ...BASE_DRAW }
  // data.width = drawFormData.value.width
  // data.height = drawFormData.value.height
  drawFormData.value.jsonData = JSON.stringify(data)
  MonitorDrawService.addOrUpdate(drawFormData.value).then(() => {
    showUpdateDraw.value = false
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

function changeLocked() {
  if (locked.value === LockState.None) {
    locked.value = LockState.DisableEdit
  } else if (locked.value === LockState.DisableEdit) {
    locked.value = LockState.Disable
  } else if (locked.value === LockState.Disable) {
    locked.value = LockState.None
  }
  meta2d.store.data.locked = locked.value
}

function changeScale(v: number) {
  const canvas = document.getElementById('meta2d') // 你绑定 meta2d 的 canvas 容器
  const center = {
    x: canvas.clientWidth / 2,
    y: canvas.clientHeight / 2,
  }
  meta2d.scale(v, center)
  meta2d.store.data.scale = v
}

function resizeScale() {
  const canvas = document.getElementById('meta2d') // 你绑定 meta2d 的 canvas 容器
  const center = {
    x: canvas.clientWidth / 2,
    y: canvas.clientHeight / 2,
  }
  meta2d.scale(1, center)
  meta2d.store.data.scale = 1
  scale.value = 1
}

function resizeWindow() {
  meta2d.fitView(true, 5)
}

function updatePresetValue(v: number, d: OptionVo) {
  const r = { width: 0, height: 0 }
  switch (v) {
    case 0:
      r.width = 1920
      r.height = 1080
      break
    case 1:
      r.width = 1200
      r.height = 720
      break
    case 2:
      r.width = 1440
      r.height = 720
      break
  }
  drawFormData.value.width = r.width
  drawFormData.value.height = r.height
}

function getToolActionClass(active = false) {
  return ['toolbar-action', active ? 'toolbar-action--active' : '']
}

function getLockLabel() {
  if (locked.value === LockState.DisableEdit) return '预览'
  if (locked.value === LockState.Disable) return '锁定'
  return '编辑'
}
</script>

<template>
  <div class="toolbar-shell">
    <div class="toolbar-group toolbar-group--start">
      <button type="button" :class="getToolActionClass()" @click="save">
        <n-icon size="18">
          <Save />
        </n-icon>
        <span>保存</span>
      </button>
    </div>

    <div class="toolbar-group toolbar-group--center">
      <button
        type="button"
        :class="getToolActionClass(drawStore.isPenDrawLine)"
        @click="drawPenLine"
      >
        <n-icon size="18">
          <PenFancy />
        </n-icon>
        <span>钢笔</span>
      </button>

      <button
        type="button"
        :class="getToolActionClass(drawStore.isPencilDrawLine)"
        @click="drawPencilLine"
      >
        <n-icon size="18">
          <PencilAlt />
        </n-icon>
        <span>铅笔</span>
      </button>

      <button
        type="button"
        :class="getToolActionClass(isMagnifier)"
        @click="showMagnifier"
      >
        <n-icon size="18">
          <Search />
        </n-icon>
        <span>放大镜</span>
      </button>

      <button type="button" :class="getToolActionClass(isMap)" @click="changeHawkeyeMap">
        <n-icon size="18">
          <MapPin />
        </n-icon>
        <span>鹰眼地图</span>
      </button>

      <div class="toolbar-dropdown">
        <n-dropdown
          trigger="hover"
          :options="LineNameOptions"
          v-model:value="currentLineType"
          @select="handleSelectLine"
          key-field="value"
        >
          <button type="button" :class="getToolActionClass()">
            <SvgIcon v-if="currentLineType === LineNameEnums.curve" name="curve" size="18" />
            <SvgIcon v-if="currentLineType === LineNameEnums.line" name="line" size="18" />
            <SvgIcon v-if="currentLineType === LineNameEnums.polyline" name="polyline" size="18" />
            <span>连线</span>
          </button>
        </n-dropdown>
      </div>

      <div class="toolbar-dropdown">
        <n-popover trigger="hover">
          <template #trigger>
            <button type="button" :class="getToolActionClass()">
              <span class="toolbar-scale">{{ Math.floor(scale * 100) }}%</span>
              <span>视图</span>
            </button>
          </template>
          <div class="toolbar-scale-panel">
            <n-input-group>
              <n-input-number v-model:value="scale" @update:value="changeScale" step="0.1" />
              <n-button @click="resizeWindow">窗口大小</n-button>
              <n-button @click="resizeScale">重置</n-button>
            </n-input-group>
          </div>
        </n-popover>
      </div>

      <button type="button" :class="getToolActionClass(showImageGallery)" @click="showImageGallery = true">
        <n-icon size="18">
          <Folder16Regular />
        </n-icon>
        <span>图库</span>
      </button>
    </div>

    <div class="toolbar-group toolbar-group--end">
      <button type="button" :class="getToolActionClass(locked !== LockState.None)" @click="changeLocked">
        <n-icon size="18">
          <LockOpen v-if="locked === LockState.None" />
          <Lock v-else-if="locked === LockState.DisableEdit" />
          <LockOff v-else-if="locked === LockState.Disable" />
        </n-icon>
        <span>{{ getLockLabel() }}</span>
      </button>

      <button type="button" :class="getToolActionClass()" @click="onView">
        <n-icon size="18">
          <View />
        </n-icon>
        <span>预览</span>
      </button>
    </div>
  </div>
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
      <!--      <n-form-item label="预设尺寸">
              <n-select
                v-model:value="drawFormData.preset"
                :options="presetOptions"
                @update:value="updatePresetValue"
              />
            </n-form-item>
            <div class="w-full flex gap-2">
              <n-form-item label="宽度" class="w-full">
                <n-input v-model:value="drawFormData.width" />
              </n-form-item>
              <n-form-item label="高度" class="w-full">
                <n-input v-model:value="drawFormData.height" />
              </n-form-item>
            </div>-->
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
  <n-modal v-model:show="showImageGallery" title="图库管理" preset="card" style="width: 800px">
    <SystemImageCallery />
  </n-modal>
  <n-modal v-model:show="showDrawManager" title="图纸管理" preset="card" style="width: 1000px">
    <div class="flex gap-2 mb-2">
      <n-button @click="showUpdateCategoryModal('')" type="primary">新增分组</n-button>
      <n-button @click="showUpdateDrawModal('')" type="primary">新增图纸</n-button>
    </div>
    <vxe-table
      :key="tableKey"
      :data="drawData.categoryVoList"
      :tree-config="{ childrenField: 'drawList', expandAll: true }"
      max-height="600"
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
              @click="
                row.drawList ? showUpdateCategoryModal(row.uid) : showUpdateDrawModal(row.uid)
              "
              >编辑
            </n-button>
            <n-button
              type="error"
              text
              v-if="!row.def"
              @click="
                row.drawList ? showDeleteCategoryModal(row.uid) : showDeleteDrawModal(row.uid)
              "
              >删除
            </n-button>
          </div>
        </template>
      </vxe-column>
    </vxe-table>
  </n-modal>
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

  <!--  <FastModalUpload v-model:show="showUploadImage" />-->
</template>

<style lang="scss" scoped>
.toolbar-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, auto) minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  width: 100%;
  height: 100%;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: nowrap;
}

.toolbar-group--start {
  justify-content: flex-start;
}

.toolbar-group--center {
  justify-content: center;
  flex-wrap: wrap;
}

.toolbar-group--end {
  justify-content: flex-end;
}

.toolbar-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.toolbar-action:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(148, 163, 184, 0.3);
  color: #fff;
}

.toolbar-action--active {
  background: rgba(22, 119, 255, 0.16);
  border-color: rgba(56, 189, 248, 0.48);
  color: #dbeafe;
}

.toolbar-action:active {
  transform: translateY(1px);
}

.toolbar-dropdown {
  display: inline-flex;
}

.toolbar-scale {
  min-width: 38px;
  text-align: center;
  font-weight: 600;
}

.toolbar-scale-panel {
  min-width: 320px;
}

@media (max-width: 1400px) {
  .toolbar-shell {
    grid-template-columns: auto auto auto;
    gap: 10px;
    min-width: max-content;
    padding: 0;
  }

  .toolbar-group--start,
  .toolbar-group--center,
  .toolbar-group--end {
    justify-content: flex-start;
  }
}
</style>
