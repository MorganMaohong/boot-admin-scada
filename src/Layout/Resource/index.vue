<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import { deepClone } from '@meta2d/core'
import BasicGraph from '@/Layout/Resource/components/BasicGraph/index.vue'
import FormGraph from '@/Layout/Resource/components/FormGraph/index.vue'
import SvgGraph from '@/Layout/Resource/components/SvgGraph/index.vue'
import ImageGraph from '@/Layout/Resource/components/ImageGraph/index.vue'
import Draw from '@/Layout/Resource/components/Draw/index.vue'
import DrawManage from '@/Layout/Resource/components/DrawManage/index.vue'
import Modal from '@/Layout/Resource/components/Modal/index.vue'
import ModalManage from '@/Layout/Resource/components/ModalManage/index.vue'
import Project from '@/Layout/Resource/components/Project/index.vue'
import Test from '@/Layout/Resource/components/test/index.vue'
import { OverflowMenuHorizontal } from '@vicons/carbon'
import FormModal from '@/components/FormModal/index.vue'

const showModalManage = ref(false)
const showDrawManage = ref(false)
const modalManageKey = ref(0)
const drawManageKey = ref(0)
const defExpandNames = ref(['1', '2', '3'])

function openDrawManage() {
  drawManageKey.value += 1
  showDrawManage.value = true
}

function openModalManage() {
  modalManageKey.value += 1
  showModalManage.value = true
}
</script>

<template>
  <n-scrollbar class="resource-panel__scroll">
    <n-collapse class="resource-panel__collapse" :default-expanded-names="defExpandNames">
      <n-collapse-item title="图纸" name="1">
        <template #header-extra>
          <button type="button" class="resource-panel__more" @click.stop="openDrawManage">
            <n-icon size="18">
              <OverflowMenuHorizontal />
            </n-icon>
          </button>
        </template>
        <div class="resource-menu-scroll">
          <Draw />
        </div>
      </n-collapse-item>
      <n-collapse-item title="弹窗" name="2">
        <template #header-extra>
          <button
            type="button"
            class="resource-panel__more"
            @click.stop="openModalManage"
          >
            <n-icon size="18">
              <OverflowMenuHorizontal />
            </n-icon>
          </button>
        </template>
        <div class="resource-menu-scroll">
          <Modal />
        </div>
      </n-collapse-item>
      <n-collapse-item title="基础图形" name="3">
        <BasicGraph />
      </n-collapse-item>
      <n-collapse-item title="表单控件" name="4">
        <FormGraph />
      </n-collapse-item>
      <n-collapse-item title="参考项目" name="5">
        <Project />
      </n-collapse-item>
    </n-collapse>
  </n-scrollbar>
  <FormModal v-model:show="showDrawManage" title="图纸管理" size="xl">
    <DrawManage v-if="showDrawManage" :key="drawManageKey" />
  </FormModal>
  <FormModal v-model:show="showModalManage" title="弹窗管理" size="xl">
    <ModalManage v-if="showModalManage" :key="modalManageKey" />
  </FormModal>
</template>

<style lang="scss" scoped>
.resource-menu-scroll {
  max-height: min(360px, 42vh);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.resource-panel__scroll {
  height: 100%;
}

.resource-panel__collapse {
  padding: 2px;
}

.resource-panel__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.resource-panel__more:hover {
  background: rgba(148, 163, 184, 0.12);
  color: #0f172a;
}

::v-deep(.resource-panel__collapse .n-collapse-item) {
  margin-bottom: 6px;
  border: 1px solid #eef2f7;
  border-radius: 10px;
  background: #fff;
}

::v-deep(.resource-panel__collapse .n-collapse-item:last-child) {
  margin-bottom: 0;
}

::v-deep(.resource-panel__collapse .n-collapse-item__header) {
  min-height: 44px;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  background: #fff;
}

::v-deep(.resource-panel__collapse .n-collapse-item__content-wrapper) {
  border-top: 1px solid #f1f5f9;
}

::v-deep(.resource-panel__collapse .n-collapse-item__content-inner) {
  padding: 12px;
}

::v-deep(.resource-panel .n-menu) {
  background: transparent;
}

::v-deep(.resource-panel .n-menu .n-menu-item-content),
::v-deep(.resource-panel .n-menu .n-submenu .n-submenu-children .n-menu-item-content) {
  margin: 2px 0;
  border-radius: 8px;
  color: #334155;
}

::v-deep(.resource-panel .n-menu .n-menu-item-content:hover),
::v-deep(.resource-panel .n-menu .n-submenu .n-menu-item-content:hover) {
  background: rgba(37, 99, 235, 0.08);
  color: #0f172a;
}

::v-deep(.resource-panel .n-menu .n-menu-item-content--selected) {
  background: rgba(34, 197, 94, 0.1);
  color: #166534;
  font-weight: 600;
}
</style>
