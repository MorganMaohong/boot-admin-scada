<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
const root = ref()
defineExpose({ root })
const props = defineProps({
  rounded: { type: Boolean, default: false },
  shadow: { type: Boolean, default: false },
  bgColor: { type: String, default: "#fff" }, // Tailwind 颜色类
  border: { type: Boolean, default: false },
  borderWidth: { type: [String, Number], default: 1 }, // 支持数字和字符串
  borderColor: { type: String, default: "#e4e7ed" }, // Tailwind 颜色类
  padding: { type: [String, Number], default: 2 } // 支持数字和字符串
})

// **计算 class**
const dynamicClass = computed(() => {
  return [props.rounded ? "rounded" : "", `p-${props.padding}`]
    .filter(Boolean) // 过滤空字符串
    .join(" ") // 拼接成字符串
})
onMounted(() => {
  /*  console.log(props.borderWidth)
  console.log(props.border)
  console.log(dynamicClass.value)*/
})
</script>

<template>
  <div
    ref="root"
    :style="{
      backgroundColor: bgColor,
      boxShadow: shadow ? '0px 0px 12px rgba(0, 0, 0, 0.12)' : '',
      outline: border ? borderWidth + 'px solid ' + borderColor : 'none'
    }"
    :class="dynamicClass"
  >
    <slot></slot>
  </div>
</template>

<style scoped lang="scss"></style>
