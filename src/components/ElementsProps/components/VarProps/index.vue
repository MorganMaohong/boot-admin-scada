<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import type { DataForm } from '@/components/ElementsProps/model'
import request from '@/utils/request.ts'
import type { OptionVo } from '@/model'

const props = defineProps<{
  key: string
}>()
const emit = defineEmits(['update:value'])
const data = ref()
onMounted(() => {
  const url = `/project/getAllGatewayVar/01JR756JZA8VRDHG357YZQSGRF`
  request({ url: url, method: 'post' }).then((res) => {
    console.log(res)
    data.value = res.data
  })
})

function updateSelectValue(varOptions: [], k: []) {
  if (k && k.length > 0) {
    varItem.value = varOptions.find((item) => item.value === k[0])
  }
}

function updateValue() {
  emit('update:value', varItem.value)
}
</script>

<template>
  <!--  <div class="relative">
      <n-collapse :expanded-names="defaultNames">
        <n-collapse-item v-for="(item, index) in data" :title="item.label" :name="item.value">
          <n-tree
            :selected-keys="[varItem.value]"
            :data="item.varOptions"
            key-field="value"
            block-node
            @update-selected-keys="updateSelectValue(item.varOptions, $event)"
          ></n-tree>
        </n-collapse-item>
      </n-collapse>
      <div class="absolute flex justify-end">
        <n-button type="primary" @click="updateValue">确定</n-button>
      </div>
    </div>-->
</template>

<style lang="scss" scoped></style>
