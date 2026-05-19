<script lang="ts" setup>
import { computed } from 'vue'
import { useDisplayLabels } from '@/components/ElementsProps/useDisplayLabels.ts'

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
const { resolveVariableLabel } = useDisplayLabels()
const resolvedVariableLabel = computed(() => resolveVariableLabel(props.value?.key))
const resolvedTitle = computed(() => {
  if (props.value?.name) return props.value.name
  if (resolvedVariableLabel.value && resolvedVariableLabel.value !== '未设置') {
    return resolvedVariableLabel.value
  }
  if (props.value?.key) return props.value.key
  return '未命名数据'
})
const shouldShowVariableDesc = computed(() => {
  if (!props.value?.key) return false
  const variableLabel = resolvedVariableLabel.value
  if (!variableLabel || variableLabel === '未设置') return false
  return variableLabel !== resolvedTitle.value
})

const isAutoSync = computed(
  () => (props.value as DataForm & { autoSync?: boolean })?.autoSync === true,
)
const ruleSummaries = computed(() => {
  return (props.value?.condData || []).map((item, index) => ({
    key: `${index}-${item.prop}-${item.valueType}`,
    title: `规则 ${index + 1}`,
    range: item.cond ? `${item.min} ~ ${item.max}` : '始终生效',
    propLabel: getOptionsLabel(PropOptions, item.prop),
    valueTypeLabel: getOptionsLabel(ValueOptions, item.valueType),
    valueLabel:
      item.valueType === ValueTypeEnum.varValue ? '跟随变量值' : formatCustomValue(item.propValue),
  }))
})

function formatCustomValue(value: unknown) {
  if (value === undefined || value === null || value === '') return '未设置'
  if (typeof value === 'boolean') return value ? '是' : '否'
  return String(value)
}
</script>

<template>
  <div class="summary-card">
    <div class="summary-card__header">
      <div>
        <div class="summary-card__title">{{ resolvedTitle }}</div>
        <div v-if="shouldShowVariableDesc" class="summary-card__desc">
          变量：{{ resolvedVariableLabel }}
        </div>
      </div>
      <div v-if="isAutoSync" class="summary-badge">默认同步</div>
    </div>
    <div class="summary-rule" v-for="item in ruleSummaries" :key="item.key">
      <div class="summary-rule__header">
        <div class="summary-rule__title">{{ item.title }}</div>
        <div class="summary-rule__range">{{ item.range }}</div>
      </div>
      <div class="summary-grid">
        <div class="summary-cell">
          <div class="summary-cell__label">映射属性</div>
          <div class="summary-cell__value">{{ item.propLabel }}</div>
        </div>
        <div class="summary-cell">
          <div class="summary-cell__label">取值方式</div>
          <div class="summary-cell__value">{{ item.valueTypeLabel }}</div>
        </div>
        <div class="summary-cell summary-cell--full">
          <div class="summary-cell__label">设置值</div>
          <div class="summary-cell__value">{{ item.valueLabel }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.summary-card {
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
}

.summary-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.summary-card__title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  line-height: 1.35;
}

.summary-card__desc {
  margin-top: 4px;
  font-size: 11px;
  color: #6b7280;
  line-height: 1.5;
  word-break: break-all;
}

.summary-badge {
  height: fit-content;
  padding: 3px 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  white-space: nowrap;
}

.summary-rule + .summary-rule {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
}

.summary-rule__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.summary-rule__title {
  font-size: 12px;
  font-weight: 600;
  color: #111827;
}

.summary-rule__range {
  font-size: 11px;
  color: #6b7280;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.summary-cell {
  min-height: 58px;
  padding: 9px 10px;
  border-radius: 8px;
  background: #f8fafc;
}

.summary-cell--full {
  grid-column: 1 / -1;
}

.summary-cell__label {
  margin-bottom: 4px;
  font-size: 11px;
  color: #6b7280;
  line-height: 1.35;
}

.summary-cell__value {
  font-size: 12px;
  line-height: 1.55;
  color: #111827;
  word-break: break-all;
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
