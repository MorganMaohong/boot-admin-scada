<script lang="ts" setup>
import { computed, defineProps, withDefaults } from "vue"

// 定义传递的组件参数接口
interface Props {
  prefix?: string // 图标的前缀，默认是 "icon"
  name: string // 必填，指定图标的名称
  size?: string // 图标大小，可选，例如 "24px" 或 "2em"
  color?: string // 图标颜色，可选
}

// 定义默认参数
const props = withDefaults(defineProps<Props>(), {
  prefix: "icon", // 默认前缀
  size: "1em", // 默认大小
  color: "" // 默认颜色为空，继承父级 color
})

// 动态生成 SVG 的引用 ID
const symbolId = computed(() => `#${props.prefix}-${props.name}`)
</script>

<template>
  <!-- 使用动态样式控制大小和颜色 -->
  <svg
    class="svg-icon"
    aria-hidden="true"
    :style="{ width: props.size, height: props.size, fill: props.color || 'currentColor' }"
  >
    <use :href="symbolId" />
  </svg>
</template>

<style lang="scss" scoped>
.svg-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  fill: currentColor;
  overflow: hidden;
}
</style>
