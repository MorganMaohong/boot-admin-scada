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
import { deepClone, LockState } from '@meta2d/core'

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
onMounted(() => {
  selectSystemMonitorImageCategory()
})

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
  } else {
    return
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

function insertImage() {
  let url = ''
  if (currentTabValue.value === 'system') {
    const image = systemImageList.value.find((item) => item.uid === currentImageValue.value)
    if (!image) {
      window.$message.error('图片不存在')
      return
    }
    url = image.url
  } else if (currentTabValue.value === 'project') {
    const image = projectImageList.value.find((item) => item.uid === currentImageValue.value)
    if (!image) {
      window.$message.error('图片不存在')
      return
    }
    url = image.url
  } else {
    return
  }
  const item = {
    x: 100,
    y: 100,
    name: '矩形',
    width: 200,
    height: 200,
    name: 'rectangle',
    image: url,
    locked: LockState.None,
    color: '#00000000',
    background: '#00000000',
    imageRatio: true,
  }
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
  <n-tabs default-value="system" v-model:value="currentTabValue" @update:value="updateTabValue">
    <n-tab-pane tab="系统图库" name="system">
      <div class="w-full h-full flex flex-col">
        <div class="flex p-2 gap-12" style="height: 400px">
          <div class="basis-1/5">
            <n-scrollbar style="max-height: 360px; overflow: hidden">
              <div
                class="flex justify-between items-center"
                v-for="(item, index) in systemImageCategory.list"
                :class="
                  currentValue === item.uid
                    ? 'p-2 cursor-pointer image-option image-option-active'
                    : 'p-2 cursor-pointer image-option'
                "
                @mousemove="currentHoverValue = index"
                @mouseleave="currentHoverValue = null"
                @click="updateValue(item.uid)"
              >
                <div>
                  {{ item.name }}
                </div>
                <div
                  class="flex items-center gap-2"
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
          <div class="basis-4/5">
            <n-scrollbar style="max-height: 270px">
              <div class="flex flex-col w-full h-full">
                <n-grid x-gap="12" y-gap="12" cols="8" class="flex-1">
                  <n-gi v-for="(item, index) in systemImageList" :key="index">
                    <div
                      :class="
                        currentImageValue === item.uid
                          ? 'p-2 cursor-pointer image-option image-option-active'
                          : 'p-2 cursor-pointer image-option'
                      "
                      @mousemove="currentImageIndex = index"
                      @mouseleave="currentImageIndex = null"
                      @click="updateImageValue(item.uid)"
                    >
                      <n-popover style="padding: 4px" trigger="hover" placement="right-start">
                        <template #trigger>
                          <n-image :src="item.url" preview-disabled />
                        </template>
                        <div>
                          <img :src="item.url" style="max-width: 200px; max-height: 200px" />
                        </div>
                      </n-popover>
                    </div>
                  </n-gi>
                </n-grid>
              </div>
            </n-scrollbar>
          </div>
        </div>
        <div class="flex justify-between">
          <div>
            <n-button class="w-full" type="info" @click="showAddOptionsModal(null)">
              新增选项
            </n-button>
          </div>
          <div class="flex gap-2">
            <FastUpload
              @before-upload="beforeUpload"
              :auto-upload="false"
              v-if="currentValue && systemImageCategory.list.length > 0"
            >
              <n-button type="info">上传图片</n-button>
            </FastUpload>
            <n-button type="error" v-if="currentImageValue" @click="removeImage">删除</n-button>
            <n-button type="primary" v-if="currentImageValue" @click="insertImage">插入</n-button>
          </div>
        </div>
      </div>
    </n-tab-pane>
    <n-tab-pane tab="项目图库" name="project">
      <div class="w-full h-full flex flex-col">
        <div class="flex p-2 gap-12" style="height: 400px">
          <div class="basis-1/5">
            <n-scrollbar style="max-height: 360px; overflow: hidden">
              <div
                class="flex justify-between items-center"
                v-for="(item, index) in projectImageCategory.list"
                :class="
                  currentValue === item.uid
                    ? 'p-2 cursor-pointer image-option image-option-active'
                    : 'p-2 cursor-pointer image-option'
                "
                @mousemove="currentHoverValue = index"
                @mouseleave="currentHoverValue = null"
                @click="updateValue(item.uid)"
              >
                <div>
                  {{ item.name }}
                </div>
                <div
                  class="flex items-center gap-2"
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
          <div class="basis-4/5">
            <n-scrollbar style="max-height: 270px">
              <div class="flex flex-col w-full h-full">
                <n-grid x-gap="12" y-gap="12" cols="8" class="flex-1">
                  <n-gi v-for="(item, index) in projectImageList" :key="index">
                    <div
                      :class="
                        currentImageValue === item.uid
                          ? 'p-2 cursor-pointer image-option image-option-active'
                          : 'p-2 cursor-pointer image-option'
                      "
                      @mousemove="currentImageIndex = index"
                      @mouseleave="currentImageIndex = null"
                      @click="updateImageValue(item.uid)"
                    >
                      <n-popover style="padding: 4px" trigger="hover" placement="right-start">
                        <template #trigger>
                          <n-image :src="item.url" preview-disabled />
                        </template>
                        <div>
                          <img :src="item.url" style="max-width: 200px; max-height: 200px" />
                        </div>
                      </n-popover>
                    </div>
                  </n-gi>
                </n-grid>
              </div>
            </n-scrollbar>
          </div>
        </div>
        <div class="flex justify-between">
          <div>
            <n-button class="w-full" type="info" @click="showAddOptionsModal(null)">
              新增选项
            </n-button>
          </div>
          <div class="flex gap-2">
            <FastUpload
              @before-upload="beforeUpload"
              :auto-upload="false"
              v-if="currentValue && projectImageCategory.list.length > 0"
            >
              <n-button type="info">上传图片</n-button>
            </FastUpload>
            <n-button type="error" v-if="currentImageValue" @click="removeImage">删除</n-button>
            <n-button type="primary" v-if="currentImageValue" @click="insertImage">插入</n-button>
          </div>
        </div>
      </div>
    </n-tab-pane>
  </n-tabs>

  <n-modal
    v-model:show="showAddOrUpdateOptions"
    preset="card"
    style="width: 600px"
    title="新增选项"
  >
    <n-form-item label="名称">
      <n-input v-model:value="monitorImageCategoryFormData.name" />
    </n-form-item>
    <template #footer>
      <div class="flex w-full justify-end">
        <n-button type="primary" @click="confirmAddOrUpdateOptions">确定</n-button>
      </div>
    </template>
  </n-modal>
  <n-modal
    :mask-closable="false"
    v-model:show="showDelete"
    preset="dialog"
    type="error"
    title="提示信息"
    content="确定删除吗?"
    positive-text="确定"
    @positive-click="confirmDelete"
  ></n-modal>
</template>

<style lang="scss" scoped>
.image-option:hover {
  background-color: #f5f7fa;
}

.image-option-active {
  background-color: #f5f7fa;
}
</style>
