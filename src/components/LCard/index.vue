<script setup lang="ts">
import { computed, onMounted } from "vue"

const props = defineProps({
  rounded: { type: Boolean, default: false },
  shadow: { type: Boolean, default: false },
  bgColor: { type: String, default: "#fff" },
  border: { type: Boolean, default: false },
  borderWidth: { type: [String, Number], default: 1 },
  borderColor: { type: String, default: "#e4e7ed" },
  padding: { type: [String, Number], default: 2 },
  dividerColor: { type: String, default: "#e4e7ed" },
  dividerHeight: { type: String, default: "1px" },
  headerDivider: { type: Boolean, default: true },
  footerDivider: { type: Boolean, default: true }
})
// **计算 class**
const dynamicClass = computed(() => {
  return [props.rounded ? "rounded" : "", `p-${props.padding}`]
    .filter(Boolean) // 过滤空字符串
    .join(" ") // 拼接成字符串
})
onMounted(() => {
  console.log(props.borderWidth)
  console.log(props.border)
  console.log(dynamicClass.value)
})
</script>

<template>
  <div
    :style="{
      backgroundColor: bgColor,
      boxShadow: shadow ? '0px 0px 12px rgba(0, 0, 0, 0.12)' : '',
      outline: border ? borderWidth + 'px solid ' + borderColor : 'none'
    }"
    :class="dynamicClass"
    class="flex flex-col"
  >
    <!-- 头部内容插槽 -->
    <div v-if="$slots.header">
      <slot name="header"></slot>
    </div>

    <!-- 头部分割线 -->
    <div v-if="$slots.header && headerDivider" class="w-full h-[1px] bg-[#e4e7ed]"></div>

    <!-- 主体内容插槽 -->
    <div v-if="$slots.default" class="flex-1">
      <slot></slot>
    </div>

    <!-- 主体和尾部分割线 -->
    <div v-if="$slots.footer && footerDivider" class="w-full h-[1px] bg-[#e4e7ed]"></div>

    <!-- 尾部内容插槽 -->
    <div v-if="$slots.footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
