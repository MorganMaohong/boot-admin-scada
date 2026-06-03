<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { MdTrash } from '@vicons/ionicons4'
import { Edit } from '@vicons/carbon'
import { MonitorImageService } from '@/services/MonitorImageService.ts'
import { getUrlParams } from '@/utils'
import type {
  MonitorImageCategoryForm,
  ProjectMonitorImage,
  ProjectMonitorImageVo,
  SystemMonitorImage,
  SystemMonitorImageVo,
} from '@/model/image'
import FastUpload from '@/components/FastUpload/index.vue'
import { CanvasLayer, deepClone, LockState } from '@meta2d/core'
import { useLayerStore } from '@/stores/module/layer.ts'
import FormModal from '@/components/FormModal/index.vue'

const layerStore = useLayerStore()
const currentTabValue = ref<string>('system')
const currentValue = ref<string>('')
const currentHoverValue = ref()
const showAddOrUpdateOptions = ref(false)
const showDelete = ref(false)
const systemImageCategory = ref<SystemMonitorImageVo>({ defaultCategoryUid: '', list: [] })
const projectImageCategory = ref<ProjectMonitorImageVo>({ defaultCategoryUid: '', list: [] })
const monitorImageCategoryFormData = ref<MonitorImageCategoryForm>({
  name: '',
  projectUid: '',
  uid: '',
})
const systemImageList = ref<SystemMonitorImage[]>([])
const projectImageList = ref<ProjectMonitorImage[]>([])
const currentImageIndex = ref()
const currentImageValue = ref<string>('')
type MonitorImageItem = SystemMonitorImage | ProjectMonitorImage
interface ImageSize {
  width: number
  height: number
}

const defaultInsertSize: ImageSize = { width: 200, height: 200 }
const maxInsertSize = 240

onMounted(() => {
  selectSystemMonitorImageCategory()
})

function getThumbUrl(image?: MonitorImageItem) {
  return image?.thumbUrl || image?.displayUrl || image?.url || ''
}

function getDisplayUrl(image?: MonitorImageItem) {
  return image?.displayUrl || image?.url || image?.originUrl || ''
}

function getPreviewUrl(image?: MonitorImageItem) {
  return image?.displayUrl || image?.originUrl || image?.url || ''
}

function selectSystemMonitorImageCategory() {
  MonitorImageService.selectSystemMonitorImageCategory().then((data) => {
    systemImageCategory.value = data
    if (!currentValue.value) currentValue.value = systemImageCategory.value.defaultCategoryUid
  })
}

watch(
  () => currentValue.value,
  () => {
    if (currentTabValue.value === 'system') {
      selectSystemMonitorImage()
    } else if (currentTabValue.value === 'project') {
      selectProjectMonitorImage()
    } else {
      return
    }
  },
)

function selectSystemMonitorImage() {
  // debugger
  if (!currentValue.value) return
  MonitorImageService.selectSystemMonitorImage(currentValue.value).then((data) => {
    systemImageList.value = data
  })
}

function selectProjectMonitorImage() {
  if (!currentValue.value) return
  MonitorImageService.selectProjectMonitorImage(currentValue.value).then((data) => {
    projectImageList.value = data
  })
}

function selectProjectMonitorImageCategory() {
  MonitorImageService.selectProjectMonitorImageCategory(getUrlParams().projectUid).then((data) => {
    projectImageCategory.value = data
    if (!currentValue.value) currentValue.value = projectImageCategory.value.defaultCategoryUid
  })
}

function updateValue(v: string) {
  currentValue.value = v
}

function showAddOptionsModal(item: MonitorImageCategoryForm) {
  monitorImageCategoryFormData.value.uid = ''
  monitorImageCategoryFormData.value.name = ''
  if (item && item.uid) {
    monitorImageCategoryFormData.value = deepClone(item)
  }
  showAddOrUpdateOptions.value = true
}

function confirmAddOrUpdateOptions() {
  if (currentTabValue.value === 'system') {
    MonitorImageService.addOrUpdateSystemMonitorImageCategory(
      monitorImageCategoryFormData.value,
    ).then(() => {
      selectSystemMonitorImageCategory()
      showAddOrUpdateOptions.value = false
    })
  } else if (currentTabValue.value === 'project') {
    monitorImageCategoryFormData.value.projectUid = getUrlParams().projectUid
    MonitorImageService.addOrUpdateProjectMonitorImageCategory(
      monitorImageCategoryFormData.value,
    ).then(() => {
      selectProjectMonitorImageCategory()
      showAddOrUpdateOptions.value = false
    })
  } else {
    return
  }
}

function showDeleteModal(uid: string) {
  monitorImageCategoryFormData.value.uid = uid
  showDelete.value = true
}

function updateTabValue(v: string) {
  currentValue.value = null
  if (v === 'system') {
    selectSystemMonitorImageCategory()
  } else if (v === 'project') {
    selectProjectMonitorImageCategory()
  } else {
    return
  }
}

function confirmDelete() {
  showDelete.value = false
  if (currentTabValue.value === 'system') {
    MonitorImageService.deleteSystemMonitorImageCategory(
      monitorImageCategoryFormData.value.uid,
    ).then(() => {
      if (monitorImageCategoryFormData.value.uid === currentValue.value) currentValue.value = ''
      selectSystemMonitorImageCategory()
    })
  } else if (currentTabValue.value === 'project') {
    MonitorImageService.deleteProjectMonitorImageCategory(
      monitorImageCategoryFormData.value.uid,
    ).then(() => {
      if (monitorImageCategoryFormData.value.uid === currentValue.value) currentValue.value = ''
      selectProjectMonitorImageCategory()
    })
  }
}

function beforeUpload(data) {
  if (currentTabValue.value === 'system') {
    MonitorImageService.uploadSystemMonitorImage(currentValue.value, data).then(() => {
      selectSystemMonitorImage()
    })
  } else if (currentTabValue.value === 'project') {
    MonitorImageService.uploadProjectMonitorImage(currentValue.value, data).then(() => {
      selectProjectMonitorImage()
    })
  } else {
    return
  }
}

function updateImageValue(v: string) {
  currentImageValue.value = v
}

function insertImageOption() {}

function getCurrentImage() {
  if (currentTabValue.value === 'system') {
    return systemImageList.value.find((item) => item.uid === currentImageValue.value)
  } else if (currentTabValue.value === 'project') {
    return projectImageList.value.find((item) => item.uid === currentImageValue.value)
  }
}

function getScaledImageSize(size: ImageSize) {
  if (!size.width || !size.height) return defaultInsertSize
  const scale = Math.min(maxInsertSize / size.width, maxInsertSize / size.height, 1)
  return {
    width: Math.round(size.width * scale),
    height: Math.round(size.height * scale),
  }
}

function loadImageSize(url: string) {
  return new Promise<ImageSize>((resolve) => {
    const image = new Image()
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      resolve(defaultInsertSize)
    }
    image.src = url
  })
}

async function getInsertImageSize(image: MonitorImageItem, url: string) {
  if (image.width && image.height) {
    return getScaledImageSize({ width: image.width, height: image.height })
  }
  return getScaledImageSize(await loadImageSize(url))
}

async function insertImage(flag: boolean) {
  const image = getCurrentImage()
  if (!image) {
    window.$message.error('图片不存在')
    return
  }
  const url = getDisplayUrl(image)
  if (!url) {
    window.$message.error('图片地址不存在')
    return
  }
  const size = await getInsertImageSize(image, url)
  const item = {
    x: 100,
    y: 100,
    width: size.width,
    height: size.height,
    name: flag ? 'image' : 'gif',
    image: url,
    locked: LockState.None,
    color: '#00000000',
    background: '#00000000',
    imageRatio: true,
    canvasLayer: CanvasLayer.CanvasMain,
  } as any

  item.layerUid = layerStore.layer.uid

  meta2d.addPen(item, false, false, true)
}

function removeImage() {
  if (currentTabValue.value === 'system') {
    MonitorImageService.deleteSystemMonitorImage(currentImageValue.value).then(() => {
      selectSystemMonitorImage()
      currentImageValue.value = null
      currentImageIndex.value = null
    })
  } else if (currentTabValue.value === 'project') {
    MonitorImageService.deleteProjectMonitorImage(currentImageValue.value).then(() => {
      selectProjectMonitorImage()
      currentImageValue.value = null
      currentImageIndex.value = null
    })
  } else {
    return
  }
}
</script>

<template>
  <div class="gallery-panel">
    <div class="gallery-panel__header">
      <div>
        <div class="gallery-panel__headline">图库资源</div>
        <div class="gallery-panel__caption">统一管理系统图库和项目图库资源</div>
      </div>
    </div>
    <n-tabs
      class="gallery-panel__tabs"
      default-value="system"
      v-model:value="currentTabValue"
      @update:value="updateTabValue"
    >
    <n-tab-pane tab="系统图库" name="system">
      <div class="gallery-layout">
        <div class="gallery-layout__body">
          <div class="gallery-layout__categories">
            <n-scrollbar style="max-height: 360px; overflow: hidden">
              <div
                class="gallery-category-item"
                v-for="(item, index) in systemImageCategory.list"
                :class="{ 'gallery-category-item--active': currentValue === item.uid }"
                @mousemove="currentHoverValue = index"
                @mouseleave="currentHoverValue = null"
                @click="updateValue(item.uid)"
              >
                <div class="gallery-category-item__name">
                  {{ item.name }}
                </div>
                <div
                  class="gallery-category-item__actions"
                  v-if="currentHoverValue === index || currentValue === index"
                >
                  <n-button text @click.stop="showAddOptionsModal(item)">
                    <template #icon>
                      <Edit />
                    </template>
                  </n-button>
                  <n-button text @click.stop="showDeleteModal(item.uid)">
                    <template #icon>
                      <n-icon>
                        <MdTrash />
                      </n-icon>
                    </template>
                  </n-button>
                </div>
              </div>
            </n-scrollbar>
          </div>
          <div class="gallery-layout__images">
            <n-scrollbar style="max-height: 270px">
              <div class="flex flex-col w-full h-full">
                <n-grid x-gap="12" y-gap="12" cols="8" class="flex-1">
                  <n-gi v-for="(item, index) in systemImageList" :key="index">
                    <div
                      class="gallery-image-item"
                      :class="{ 'gallery-image-item--active': currentImageValue === item.uid }"
                      @mousemove="currentImageIndex = index"
                      @mouseleave="currentImageIndex = null"
                      @click="updateImageValue(item.uid)"
                    >
                      <n-popover style="padding: 4px" trigger="hover" placement="right-start">
                        <template #trigger>
                          <n-image :src="getThumbUrl(item)" preview-disabled />
                        </template>
                        <div>
                          <img
                            :src="getPreviewUrl(item)"
                            style="max-width: 200px; max-height: 200px"
                          />
                        </div>
                      </n-popover>
                    </div>
                  </n-gi>
                </n-grid>
              </div>
            </n-scrollbar>
          </div>
        </div>
        <div class="gallery-layout__footer">
          <div class="gallery-layout__footer-left">
            <n-button class="w-full" type="primary" ghost @click="showAddOptionsModal(null)">
              新增选项
            </n-button>
          </div>
          <div class="gallery-layout__footer-actions">
            <FastUpload
              @before-upload="beforeUpload"
              :auto-upload="false"
              v-if="currentValue && systemImageCategory.list.length > 0"
            >
              <n-button type="primary" ghost>上传图片</n-button>
            </FastUpload>
            <n-button type="error" v-if="currentImageValue" @click="removeImage">删除</n-button>
            <n-popconfirm
              v-if="currentImageValue"
              positive-text="图片"
              negative-text="动图"
              @positive-click="insertImage(true)"
              @negative-click="insertImage(false)"
            >
              <template #trigger>
                <n-button type="primary">插入</n-button>
              </template>
              请选择图片类型
            </n-popconfirm>
          </div>
        </div>
      </div>
    </n-tab-pane>
    <n-tab-pane tab="项目图库" name="project">
      <div class="gallery-layout">
        <div class="gallery-layout__body">
          <div class="gallery-layout__categories">
            <n-scrollbar style="max-height: 360px; overflow: hidden">
              <div
                class="gallery-category-item"
                v-for="(item, index) in projectImageCategory.list"
                :class="{ 'gallery-category-item--active': currentValue === item.uid }"
                @mousemove="currentHoverValue = index"
                @mouseleave="currentHoverValue = null"
                @click="updateValue(item.uid)"
              >
                <div class="gallery-category-item__name">
                  {{ item.name }}
                </div>
                <div
                  class="gallery-category-item__actions"
                  v-if="currentHoverValue === index || currentValue === index"
                >
                  <n-button text @click.stop="showAddOptionsModal(item)">
                    <template #icon>
                      <Edit />
                    </template>
                  </n-button>
                  <n-button text @click.stop="showDeleteModal(item.uid)">
                    <template #icon>
                      <n-icon>
                        <MdTrash />
                      </n-icon>
                    </template>
                  </n-button>
                </div>
              </div>
            </n-scrollbar>
          </div>
          <div class="gallery-layout__images">
            <n-scrollbar style="max-height: 270px">
              <div class="flex flex-col w-full h-full">
                <n-grid x-gap="12" y-gap="12" cols="8" class="flex-1">
                  <n-gi v-for="(item, index) in projectImageList" :key="index">
                    <div
                      class="gallery-image-item"
                      :class="{ 'gallery-image-item--active': currentImageValue === item.uid }"
                      @mousemove="currentImageIndex = index"
                      @mouseleave="currentImageIndex = null"
                      @click="updateImageValue(item.uid)"
                    >
                      <n-popover style="padding: 4px" trigger="hover" placement="right-start">
                        <template #trigger>
                          <n-image :src="getThumbUrl(item)" preview-disabled />
                        </template>
                        <div>
                          <img
                            :src="getPreviewUrl(item)"
                            style="max-width: 200px; max-height: 200px"
                          />
                        </div>
                      </n-popover>
                    </div>
                  </n-gi>
                </n-grid>
              </div>
            </n-scrollbar>
          </div>
        </div>
        <div class="gallery-layout__footer">
          <div class="gallery-layout__footer-left">
            <n-button class="w-full" type="primary" ghost @click="showAddOptionsModal(null)">
              新增选项
            </n-button>
          </div>
          <div class="gallery-layout__footer-actions">
            <FastUpload
              @before-upload="beforeUpload"
              :auto-upload="false"
              v-if="currentValue && projectImageCategory.list.length > 0"
            >
              <n-button type="primary" ghost>上传图片</n-button>
            </FastUpload>
            <n-button type="error" v-if="currentImageValue" @click="removeImage">删除</n-button>
            <n-button type="primary" v-if="currentImageValue" @click="insertImage(true)"
              >插入</n-button
            >
          </div>
        </div>
      </div>
    </n-tab-pane>
    </n-tabs>
  </div>

  <FormModal v-model:show="showAddOrUpdateOptions" title="新增选项" size="md" height-mode="auto">
    <n-form-item label="名称">
      <n-input v-model:value="monitorImageCategoryFormData.name" />
    </n-form-item>
    <template #footer>
      <n-button type="primary" @click="confirmAddOrUpdateOptions">确定</n-button>
    </template>
  </FormModal>
  <FormModal
    v-model:show="showDelete"
    title="提示信息"
    size="sm"
    height-mode="auto"
    :mask-closable="false"
  >
    <p>确定删除吗?</p>
    <template #footer>
      <n-button @click="showDelete = false">取消</n-button>
      <n-button type="error" @click="confirmDelete">确定</n-button>
    </template>
  </FormModal>
</template>

<style lang="scss" scoped>
.gallery-panel__header {
  margin-bottom: 12px;
}

.gallery-panel__headline {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.gallery-panel__caption {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.gallery-layout {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.gallery-layout__body {
  display: flex;
  gap: 16px;
  height: 400px;
}

.gallery-layout__categories {
  flex: 0 0 22%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
}

.gallery-layout__images {
  flex: 1;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
}

.gallery-category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.18s ease;
}

.gallery-category-item:hover,
.gallery-category-item--active {
  background-color: #f5f8ff;
}

.gallery-category-item__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-category-item__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.gallery-image-item {
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.gallery-image-item:hover,
.gallery-image-item--active {
  border-color: #bfdbfe;
  background: #f8fbff;
}

.gallery-layout__footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.gallery-layout__footer-left,
.gallery-layout__footer-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 1200px) {
  .gallery-layout__body,
  .gallery-layout__footer {
    flex-direction: column;
  }

  .gallery-layout__categories {
    flex-basis: auto;
  }
}
</style>
