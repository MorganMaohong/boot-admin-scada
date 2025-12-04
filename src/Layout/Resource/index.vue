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

const showModalManage = ref(false)
const showDrawManage = ref(false)
const defExpandNames = ref(['1', '2', '3'])
</script>

<template>
  <n-collapse :default-expanded-names="defExpandNames">
    <n-collapse-item title="图纸" name="1">
      <template #header-extra>
        <n-icon size="24" @click.stop="showDrawManage = true">
          <OverflowMenuHorizontal />
        </n-icon>
      </template>
      <Draw />
    </n-collapse-item>
    <n-collapse-item title="弹窗" name="2">
      <template #header-extra>
        <n-icon size="24" @click.stop="showModalManage = true">
          <OverflowMenuHorizontal />
        </n-icon>
      </template>
      <Modal />
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
  <n-modal
    v-model:show="showDrawManage"
    style="width: 800px; height: 500px"
    preset="card"
    title="图纸管理"
  >
    <DrawManage />
  </n-modal>
  <n-modal
    v-model:show="showModalManage"
    style="width: 800px; height: 500px"
    preset="card"
    title="弹窗管理"
  >
    <ModalManage />
  </n-modal>
</template>

<style lang="scss" scoped></style>
