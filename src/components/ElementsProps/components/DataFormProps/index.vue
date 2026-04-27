<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import {
  type CondItem,
  type DataForm,
  PropEnums,
  PropOptions,
  ValueOptions,
  ValueTypeEnum,
} from '@/components/ElementsProps/model'
import { Add, Close } from '@vicons/carbon'
import type { FormInst } from 'naive-ui'
import GatewayVarSelect from '@/components/ElementsProps/components/GatewayVarSelect/index.vue'
import { ColorPicker } from 'vue3-colorpicker'
import { useSelection } from '@/services/selections'

const props = defineProps<{
  value: DataForm
}>()
const emit = defineEmits(['update:value'])
const { selections } = useSelection()
const dataFormData = ref<DataForm>({})
const formRef = ref<FormInst>()
const formRules = {
  name: {
    required: true,
    message: '请输入名称',
    trigger: ['blur'],
  },
  key: {
    required: true,
    message: '请选择变量',
    trigger: ['change'],
  },
}

onMounted(() => {
  dataFormData.value = props.value
  syncCurrentPenVar()
  console.log(dataFormData.value)
})

function syncCurrentPenVar(force = false) {
  const currentPen = selections.pen
  if (!currentPen?.key) return
  if (force || !dataFormData.value.key) {
    dataFormData.value.key = currentPen.key
  }
  if (force || !dataFormData.value.name) {
    dataFormData.value.name = currentPen.nickname || currentPen.name || currentPen.key
  }
}

function updateValue() {
  console.log(dataFormData.value)
  formRef.value?.validate((valid) => {
    if (valid) return
    syncCurrentPenVar()
    if (!dataFormData.value.key) {
      window.$message.error('请先绑定变量')
      return
    }
    if (dataFormData.value.condData.length === 0) {
      window.$message.error('至少有一个条件运算')
      return
    }
    emit('update:value', dataFormData.value)
  })
}

function addCondData() {
  const condItem: CondItem = {
    cond: true,
    max: 0,
    min: 0,
    valueType: ValueTypeEnum.customValue,
    prop: PropEnums.background,
    propValue: undefined,
  }
  dataFormData.value.condData.push(condItem)
}

function removeCondData(idx: number) {
  dataFormData.value.condData.splice(idx, 1)
}

function updateProp(item: CondItem, idx: number) {
  item.propValue = undefined
  dataFormData.value.condData[idx] = item
}
</script>

<template>
  <n-form ref="formRef" :model="dataFormData" :rules="formRules">
    <n-form-item label="变量" path="key">
      <GatewayVarSelect
        v-model:model-value="dataFormData.key"
        v-model:model-name="dataFormData.name"
      />
    </n-form-item>
    <div class="relative mb-2" v-for="(item, index) in dataFormData.condData" :key="index">
      <div class="absolute -top-3 right-0 flex gap-2">
        <n-button text @click="addCondData" v-if="index === 0">
          <template #icon>
            <n-icon color="green" size="24">
              <Add />
            </n-icon>
          </template>
        </n-button>
        <n-button text @click="removeCondData(index)">
          <template #icon>
            <n-icon color="red" size="24">
              <Close />
            </n-icon>
          </template>
        </n-button>
      </div>
      <n-form-item label="条件运算" label-placement="left">
        <n-switch v-model:value="item.cond" />
      </n-form-item>
      <div class="flex w-full gap-2" v-if="item.cond">
        <n-form-item label="最小值" class="w-full">
          <n-input-number v-model:value="item.min" :show-button="false" class="w-full" />
        </n-form-item>
        <n-form-item label="最大值" class="w-full">
          <n-input-number v-model:value="item.max" :show-button="false" class="w-full" />
        </n-form-item>
      </div>
      <n-form-item label="属性" class="w-full">
        <n-select
          :options="PropOptions"
          v-model:value="item.prop"
          class="w-full"
          @update:value="updateProp(item, index)"
        />
      </n-form-item>
      <div class="flex w-full gap-2">
        <n-form-item label="值类型" class="w-full">
          <n-select :options="ValueOptions" v-model:value="item.valueType" />
        </n-form-item>
        <template
          v-if="
            item.prop === PropEnums.background ||
            item.prop === PropEnums.borderColor ||
            item.prop === PropEnums.progressColor ||
            item.prop === PropEnums.textColor
          "
        >
          <n-form-item
            label="值"
            class="w-full"
            v-if="item.valueType === ValueTypeEnum.customValue"
          >
            <color-picker v-model:pureColor="item.propValue" />
          </n-form-item>
        </template>
        <template
          v-if="
            item.prop === PropEnums.text ||
            item.prop === PropEnums.x ||
            item.prop === PropEnums.y ||
            item.prop === PropEnums.width ||
            item.prop === PropEnums.height ||
            item.prop === PropEnums.showChild
          "
        >
          <n-form-item
            label="值"
            class="w-full"
            v-if="item.valueType === ValueTypeEnum.customValue"
          >
            <n-input class="w-full" v-model:value="item.propValue" />
          </n-form-item>
        </template>
        <template v-if="item.prop === PropEnums.visible || item.prop === PropEnums.checked">
          <n-form-item
            label="值"
            class="w-full"
            v-if="item.valueType === ValueTypeEnum.customValue"
          >
            <n-switch v-model:value="item.propValue" />
          </n-form-item>
        </template>
        <template v-if="item.prop === PropEnums.progress || item.prop === PropEnums.rotate">
          <n-form-item
            label="值"
            class="w-full"
            v-if="item.valueType === ValueTypeEnum.customValue"
          >
            <n-input-number class="w-full" v-model:value="item.propValue" />
          </n-form-item>
        </template>
      </div>
      <n-divider v-if="dataFormData.condData.length > 1" />
    </div>
    <div class="flex justify-end">
      <n-button type="primary" @click="updateValue">确定</n-button>
    </div>
  </n-form>
</template>

<style lang="scss" scoped></style>
