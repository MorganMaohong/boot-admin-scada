<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import { deepClone } from '@meta2d/core'
import BasicGraph from '@/Layout/Resource/components/BasicGraph/index.vue'
import FormGraph from '@/Layout/Resource/components/FormGraph/index.vue'
import SvgGraph from '@/Layout/Resource/components/SvgGraph/index.vue'
import ImageGraph from '@/Layout/Resource/components/ImageGraph/index.vue'
import Draw from '@/Layout/Resource/components/Draw/index.vue'
import Project from '@/Layout/Resource/components/Project/index.vue'
import Test from '@/Layout/Resource/components/test/index.vue'
</script>

<template>
  <n-collapse :default-expanded-names="['4', '1', '2', '3', '5']">
    <n-collapse-item title="图纸管理" name="4">
      <Draw />
    </n-collapse-item>
    <n-collapse-item title="基础图形" name="1">
      <BasicGraph />
    </n-collapse-item>
    <n-collapse-item title="表单控件" name="2">
      <FormGraph />
    </n-collapse-item>
    <n-collapse-item title="参考项目" name="6">
      <Project />
    </n-collapse-item>
    <n-collapse-item title="测试" name="7">
      <Test />
    </n-collapse-item>
  </n-collapse>
</template>

<style lang="scss" scoped></style>
