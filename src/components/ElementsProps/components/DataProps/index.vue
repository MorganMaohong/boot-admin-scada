<script lang="ts" setup>
import { computed, onMounted } from 'vue'

import {
  type DataForm,
  getOptionsLabel,
  PropOptions,
  ValueOptions,
  ValueTypeEnum,
} from '@/components/ElementsProps/model'

const props = defineProps<{
  value: DataForm
}>()

const emit = defineEmits(['update:value'])
const condNames = computed(() => {
  return props.value?.condData?.map((_, index) => index) || []
})

function updateValue(v: any, prop: string) {
  emit('update:value', v, prop)
}

onMounted(() => {
  console.log(props.value)
})
</script>

<template>
  <n-form label-placement="left" label-width="auto">
    <!--    <n-form-item label="变量名称">
          <n-text>ssss</n-text>
        </n-form-item>-->
    <template v-for="(item, index) in value.condData">
      <n-form label-placement="left" label-width="auto">
        <div class="ml-4">
          <template v-if="item.cond">
            <n-form-item label="最小值">
              <n-text>{{ item.min }}</n-text>
            </n-form-item>
            <n-form-item label="最大值">
              <n-text>{{ item.max }}</n-text>
            </n-form-item>
          </template>
          <n-form-item label="属性">
            <n-text>{{ getOptionsLabel(PropOptions, item.prop) }}</n-text>
          </n-form-item>
          <n-form-item label="值类型">
            <n-text>{{ getOptionsLabel(ValueOptions, item.valueType) }}</n-text>
          </n-form-item>
          <template v-if="item.valueType === ValueTypeEnum.customValue">
            <n-form-item label="值">
              <n-text>{{ item.propValue }}</n-text>
            </n-form-item>
          </template>
          <template v-else-if="item.valueType === ValueTypeEnum.varValue">
            <n-form-item label="值">
              <n-text>变量值</n-text>
            </n-form-item>
          </template>
        </div>
      </n-form>
    </template>
  </n-form>
</template>

<style lang="scss" scoped>
::v-deep(.n-collapse .n-collapse-item .n-collapse-item) {
  margin-left: 4px !important;
}
</style>
