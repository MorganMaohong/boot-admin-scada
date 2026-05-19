<script lang="ts" setup>
import { computed } from 'vue'
import {
  ComparisonOptions,
  EventActionEnums,
  EventActionOptions,
  EventNameOptions,
  GlobalFnEnums,
  GlobalFnOptions,
  LinkOpenOptions,
  PresetJsOptions,
  PresetJsPropOptions,
  TriggerComparisonPropOptions,
  TriggerEnum,
  type EventForm,
} from '@/components/ElementsProps/model/index.ts'
import { useDisplayLabels } from '@/components/ElementsProps/useDisplayLabels.ts'

const props = defineProps<{
  value: EventForm
}>()
const { resolveDrawLabel, resolveModalLabel, resolvePenLabel, resolveVariableLabel } =
  useDisplayLabels()

const summaryRows = computed(() => {
  const rows: Array<{ label: string; value: string; accent?: boolean }> = [
    {
      label: '事件类型',
      value: getLabel(EventNameOptions, props.value.name),
    },
  ]

  if (props.value.action === EventActionEnums.GlobalFn) {
    rows.push({
      label: '函数名称',
      value: getLabel(GlobalFnOptions, props.value.value),
      accent: true,
    })

    const params = props.value.params
    switch (props.value.value) {
      case GlobalFnEnums.openDraw:
        rows.push({
          label: '参数',
          value: resolveDrawLabel(params),
        })
        break
      case GlobalFnEnums.openModal:
        rows.push({
          label: '参数',
          value: resolveModalLabel(params),
        })
        break
      case GlobalFnEnums.writeVar:
        rows.push({
          label: '变量',
          value: resolveVariableLabel(params?.key),
        })
        rows.push({
          label: '设置值',
          value:
            params?.prop === 'custom'
              ? formatValue(params?.value, '未设置')
              : `读取图元属性：${getLabel(PresetJsPropOptions, params?.prop)}`,
        })
        break
      case GlobalFnEnums.controlVar:
        rows.push({
          label: '变量',
          value: resolveVariableLabel(params?.key),
        })
        break
    }
  } else {
    rows.push({
      label: '事件行为',
      value: getLabel(EventActionOptions, props.value.action),
      accent: true,
    })

    if (props.value.action === EventActionEnums.Link) {
      rows.push({ label: '链接地址', value: formatValue(props.value.value, '未设置') })
      rows.push({
        label: '打开方式',
        value: getLabel(LinkOpenOptions, props.value.params),
      })
    }

    if (props.value.action === EventActionEnums.SetProps) {
      const value =
        props.value.value && typeof props.value.value === 'object' ? props.value.value : {}
      rows.push({
        label: '目标',
        value: resolvePenLabel(props.value.params),
      })
      rows.push({
        label: '属性项',
        value: `${Object.keys(value).length} 项`,
      })
    }

    if (
      props.value.action === EventActionEnums.StartAnimate ||
      props.value.action === EventActionEnums.PauseAnimate ||
      props.value.action === EventActionEnums.StopAnimate
    ) {
      rows.push({
        label: '目标',
        value: resolvePenLabel(props.value.value),
      })
    }

    if (props.value.action === EventActionEnums.JS) {
      rows.push({
        label: '脚本',
        value: props.value.presetJsKey ? getPresetJsLabel(props.value.presetJsKey) : '自定义代码',
      })
    }
  }

  if (props.value.trigger === TriggerEnum.comparison && props.value.where) {
    rows.push({
      label: '触发条件',
      value: [
        getLabel(TriggerComparisonPropOptions, props.value.where.key),
        getLabel(ComparisonOptions, props.value.where.comparison),
        formatValue(props.value.where.value, '未设置'),
      ]
        .filter(Boolean)
        .join(' '),
    })
  }

  return rows.filter((item) => item.value && item.value !== '未知')
})

function formatValue(value: unknown, fallback = '无') {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getLabel(options: Array<{ label?: string; value?: any }>, value: unknown) {
  if (value === undefined || value === null || value === '') return '未设置'
  return options.find((item) => item.value === value)?.label || String(value)
}

function getPresetJsLabel(value: string) {
  return PresetJsOptions.find((item) => item.key === value)?.label || value
}

</script>

<template>
  <div class="summary-card">
    <div class="summary-grid">
      <div
        v-for="item in summaryRows"
        :key="`${item.label}-${item.value}`"
        class="summary-row"
        :class="{
          'summary-row--accent': item.accent,
          'summary-row--wide': item.value.length > 18,
        }"
      >
        <div class="summary-row__label">{{ item.label }}</div>
        <div class="summary-row__value">{{ item.value }}</div>
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.summary-row {
  min-height: 58px;
  padding: 9px 10px;
  border-radius: 8px;
  background: #f8fafc;
}

.summary-row--accent {
  background: #eff6ff;
}

.summary-row--wide {
  grid-column: 1 / -1;
}

.summary-row__label {
  margin-bottom: 4px;
  font-size: 11px;
  color: #6b7280;
  line-height: 1.35;
}

.summary-row__value {
  font-size: 12px;
  line-height: 1.55;
  color: #111827;
  word-break: break-all;
}

@media (max-width: 360px) {
  .summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .summary-row--wide {
    grid-column: auto;
  }
}
</style>
