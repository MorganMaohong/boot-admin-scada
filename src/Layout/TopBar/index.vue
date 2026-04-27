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
import { LockState, Meta2dStore, Pen, Point, s16 } from '@meta2d/core'
import { NButton } from 'naive-ui'
import SvgIcon from '@/components/SvgIcon/index.vue'
import SystemImageCallery from '@/components/SystemImageCallery/index.vue'
import { getAuthToken } from '@/utils/auth'

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
    const data: any = meta2d.data()
    drawStore.draw.data = JSON.stringify(data)

    MonitorDrawService.save(drawStore.draw.data, drawStore.draw.uid).then(() => {
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
  drawStore.draw.data = JSON.stringify(meta2d.data())
  MonitorDrawService.save(drawStore.draw.data, drawStore.draw.uid)
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
</script>

<template>
  <div class="flex w-full h-full items-center px-4 gap-12">
    <!-- 编辑操作 -->
    <div class="flex justify-start items-center gap-8">
      <!--      <div class="flex flex-col cursor-pointer items-center">
              <n-dropdown
                trigger="hover"
                :options="fileOptions"
                @select="handleSelectFile"
                key-field="value"
              >
                <div class="flex flex-col items-center">
                  <n-icon size="20">
                    <Folder16Regular />
                  </n-icon>
                  <div class="text-xs">文件</div>
                </div>
              </n-dropdown>
            </div>-->
      <!--      <div class="flex flex-col cursor-pointer items-center">-->
      <!--        <n-icon size="20">-->
      <!--          <Edit />-->
      <!--        </n-icon>-->
      <!--        <div class="text-xs">编辑</div>-->
      <!--      </div>-->
      <div class="flex flex-col cursor-pointer items-center" @click="save">
        <n-icon size="20">
          <Save />
        </n-icon>
        <div class="text-xs">保存</div>
      </div>
    </div>
    <!-- 画布操作 -->
    <div class="flex justify-center items-center gap-8 flex-1">
      <div
        class="flex flex-col cursor-pointer items-center"
        @click="drawPenLine"
        :style="{
          color: drawStore.isPenDrawLine ? ' #1677ff' : '',
        }"
      >
        <n-icon size="20">
          <PenFancy />
        </n-icon>
        <div class="text-xs">钢笔</div>
      </div>
      <div
        class="flex flex-col cursor-pointer items-center"
        @click="drawPencilLine"
        :style="{
          color: drawStore.isPencilDrawLine ? ' #1677ff' : '',
        }"
      >
        <n-icon size="20">
          <PencilAlt />
        </n-icon>
        <div class="text-xs">铅笔</div>
      </div>
      <div class="flex flex-col cursor-pointer items-center" @click="showMagnifier">
        <n-icon size="20">
          <Search />
        </n-icon>
        <div class="text-xs">放大镜</div>
      </div>
      <div class="flex flex-col cursor-pointer items-center" @click="changeHawkeyeMap">
        <n-icon size="20">
          <MapPin />
        </n-icon>
        <div class="text-xs">鹰眼地图</div>
      </div>
      <!--      <div class="flex flex-col cursor-pointer items-center">
              <n-icon size="20">
                <Folder16Regular />
              </n-icon>
              <div class="text-xs">起点</div>
            </div>
            <div class="flex flex-col cursor-pointer items-center">
              <n-icon size="20">
                <Folder16Regular />
              </n-icon>
              <div class="text-xs">终点</div>
            </div>-->
      <div class="cursor-pointer">
        <n-dropdown
          trigger="hover"
          :options="LineNameOptions"
          v-model:value="currentLineType"
          @select="handleSelectLine"
          key-field="value"
        >
          <div class="flex flex-col items-center">
            <SvgIcon v-if="currentLineType === LineNameEnums.curve" name="curve" size="20" />
            <SvgIcon v-if="currentLineType === LineNameEnums.line" name="line" size="20" />
            <SvgIcon v-if="currentLineType === LineNameEnums.polyline" name="polyline" size="20" />
            <div class="text-xs">连线</div>
          </div>
        </n-dropdown>
      </div>
      <!--      <div class="flex flex-col cursor-pointer items-center">
              <n-icon size="20">
                <Folder16Regular />
              </n-icon>
              <div class="text-xs">线宽</div>
            </div>-->
      <div>
        <n-popover trigger="hover">
          <template #trigger>
            <div class="flex flex-col cursor-pointer items-center">
              <n-text style="color: #fff">{{ Math.floor(scale * 100) }}%</n-text>
              <div class="text-xs">视图</div>
            </div>
          </template>
          <n-input-group>
            <n-input-number v-model:value="scale" @update:value="changeScale" step="0.1" />
            <n-button @click="resizeWindow">窗口大小</n-button>
            <n-button @click="resizeScale">重置</n-button>
          </n-input-group>
        </n-popover>
      </div>
      <div class="flex flex-col cursor-pointer items-center" @click="showImageGallery = true">
        <n-icon size="20">
          <Folder16Regular />
        </n-icon>
        <div class="text-xs">图库</div>
      </div>
    </div>
    <!-- 其他操作 -->
    <div class="flex justify-end items-center gap-8">
      <div class="flex flex-col cursor-pointer items-center" @click="changeLocked">
        <n-icon size="20">
          <LockOpen v-if="locked === LockState.None" />
          <Lock v-else-if="locked === LockState.DisableEdit" />
          <LockOff v-else-if="locked === LockState.Disable" />
        </n-icon>
        <div class="text-xs" v-if="locked === LockState.None">编辑</div>
        <div class="text-xs" v-else-if="locked === LockState.DisableEdit">预览</div>
        <div class="text-xs" v-else-if="locked === LockState.Disable">锁定</div>
      </div>
      <!--      <div class="flex flex-col cursor-pointer items-center">
              <n-icon size="20">
                <Folder16Regular />
              </n-icon>
              <div class="text-xs">编辑</div>
            </div>-->
      <div class="flex flex-col cursor-pointer items-center" @click="onView">
        <n-icon size="20">
          <View />
        </n-icon>
        <div class="text-xs">预览</div>
      </div>
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

<style lang="scss" scoped></style>
