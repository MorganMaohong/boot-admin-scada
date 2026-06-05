<script lang="ts" setup>
import { computed, ref, useAttrs, useSlots, watch } from "vue"
import { closeFormModalLayer, openFormModalLayer } from "@/utils/form-modal-z-index"

type FormModalSize = "sm" | "md" | "lg" | "xl" | "xxl"
/** fixed：按 size 上限展示，内容区滚动、footer 贴底；auto：随内容增高，不超过 size 上限 */
type FormModalHeightMode = "fixed" | "auto"

/** 各尺寸弹窗高度上限（px）；xxl 接近全屏 */
const FORM_MODAL_SIZE_MAX: Record<FormModalSize, number | null> = {
  sm: 480,
  md: 620,
  lg: 760,
  xl: 880,
  xxl: null
}

const VIEWPORT_MAX = "calc(100vh - 48px)"

function normalizeHeight(value?: number): string | undefined {
  if (value == null || value <= 0) return undefined
  return `${value}px`
}

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    show: boolean
    title?: string
    size?: FormModalSize
    heightMode?: FormModalHeightMode
    /** 覆盖 size 默认高度上限（数字 px），fixed / auto 均生效 */
    height?: number
    loading?: boolean
    maskClosable?: boolean
  }>(),
  {
    size: "md",
    heightMode: "fixed",
    loading: false,
    maskClosable: true
  }
)

const emit = defineEmits<{
  "update:show": [value: boolean]
}>()

const attrs = useAttrs()
const slots = useSlots()

const showModel = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
})

const hasCustomHeight = computed(() => normalizeHeight(props.height) != null)

const modalClass = computed(() => [
  "FormModal",
  `FormModal--${props.size}`,
  `FormModal--height-${props.heightMode}`,
  hasCustomHeight.value ? "FormModal--height-custom" : ""
])

/** 有效高度上限：min(自定义 | size 上限, 视口) */
const modalStyle = computed(() => {
  const customHeight = normalizeHeight(props.height)
  const sizeMax = FORM_MODAL_SIZE_MAX[props.size]
  let maxHeight: string

  if (customHeight) {
    maxHeight = `min(${customHeight}, ${VIEWPORT_MAX})`
  } else if (sizeMax != null && sizeMax > 0) {
    maxHeight = `min(${sizeMax}px, ${VIEWPORT_MAX})`
  } else {
    maxHeight = VIEWPORT_MAX
  }

  return { "--form-modal-max-height": maxHeight }
})

const explicitZIndex = computed(() => {
  const z = attrs.zIndex ?? attrs["z-index"]
  return typeof z === "number" ? z : undefined
})

const modalZIndex = ref(2000)
let activeModalZIndex = 0

watch(showModel, (visible) => {
  if (visible) {
    const layer = openFormModalLayer(explicitZIndex.value)
    modalZIndex.value = layer.modalZIndex
    activeModalZIndex = layer.modalZIndex
    return
  }
  if (!activeModalZIndex) return
  closeFormModalLayer(activeModalZIndex)
  activeModalZIndex = 0
})
</script>

<template>
  <n-modal
    v-bind="attrs"
    v-model:show="showModel"
    preset="card"
    :title="title"
    :mask-closable="maskClosable"
    :class="modalClass"
    :style="modalStyle"
    :z-index="modalZIndex"
  >
    <div class="FormModal__shell">
      <div class="FormModal__body">
        <n-spin v-if="loading" :show="true">
          <slot />
        </n-spin>
        <slot v-else />
      </div>
      <div v-if="slots.footer" class="FormModal__footer">
        <slot name="footer" />
      </div>
    </div>
  </n-modal>
</template>
