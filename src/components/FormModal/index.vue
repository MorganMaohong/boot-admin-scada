<script lang="ts" setup>
import { computed, ref, useAttrs, useSlots, watch } from "vue"
import { closeFormModalLayer, openFormModalLayer } from "@/utils/form-modal-z-index"

type FormModalSize = "sm" | "md" | "lg" | "xl" | "xxl"
/** fixed（默认）：固定高度，内容区滚动，底部按钮贴右下；auto：小表单随内容增高 */
type FormModalHeightMode = "fixed" | "auto"

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    show: boolean
    title?: string
    size?: FormModalSize
    /** 默认 fixed；仅字段极少的小表单用 auto */
    heightMode?: FormModalHeightMode
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

const modalClass = computed(() => [
  "FormModal",
  `FormModal--${props.size}`,
  `FormModal--height-${props.heightMode}`
])

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
