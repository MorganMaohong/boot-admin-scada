import { onMounted, ref } from 'vue'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { getUrlParams } from '@/utils'
import { isScreenPreviewMode } from '@/utils/displayAccess'

type LabelMap = Record<string, string>
const MISSING_VARIABLE_LABEL = '变量未匹配，请重新选择'

const variableLabelCache = new Map<string, LabelMap>()
const drawLabelCache = new Map<string, LabelMap>()
const modalLabelCache = new Map<string, LabelMap>()
const loadPromiseCache = new Map<string, Promise<void>>()

function flattenOptions(options: any[], map: LabelMap = {}) {
  ;(options || []).forEach((item) => {
    if (!item) return

    const value = item.value ?? item.uid ?? item.key
    const label = item.label ?? item.name ?? item.title

    if (value !== undefined && value !== null && label) {
      map[String(value)] = String(label)
    }

    if (Array.isArray(item.children) && item.children.length > 0) {
      flattenOptions(item.children, map)
    }
  })

  return map
}

function getPenLabelById(id: string) {
  if (!id) return ''
  const targetPen = meta2d?.store?.pens?.[id]
  if (!targetPen) return id
  return targetPen.nickname || targetPen.name || targetPen.id || id
}

export function useDisplayLabels() {
  const projectUid = getUrlParams().projectUid || ''
  const variableLabels = ref<LabelMap>(variableLabelCache.get(projectUid) || {})
  const drawLabels = ref<LabelMap>(drawLabelCache.get(projectUid) || {})
  const modalLabels = ref<LabelMap>(modalLabelCache.get(projectUid) || {})

  async function loadLabels() {
    if (!projectUid || isScreenPreviewMode()) return

    if (!loadPromiseCache.has(projectUid)) {
      loadPromiseCache.set(
        projectUid,
        Promise.all([
          MonitorDrawService.getAllGatewayVar(projectUid),
          MonitorDrawService.options(projectUid),
          MonitorDrawService.modalOptions(projectUid),
        ])
          .then(([gatewayVars, drawOptions, modalOptions]) => {
            const nextVariableLabels = flattenOptions(gatewayVars || [])
            const nextDrawLabels = flattenOptions(drawOptions || [])
            const nextModalLabels = flattenOptions(modalOptions || [])

            variableLabelCache.set(projectUid, nextVariableLabels)
            drawLabelCache.set(projectUid, nextDrawLabels)
            modalLabelCache.set(projectUid, nextModalLabels)

            variableLabels.value = nextVariableLabels
            drawLabels.value = nextDrawLabels
            modalLabels.value = nextModalLabels
          })
          .catch(() => {
            loadPromiseCache.delete(projectUid)
          }),
      )
    }

    await loadPromiseCache.get(projectUid)

    variableLabels.value = variableLabelCache.get(projectUid) || {}
    drawLabels.value = drawLabelCache.get(projectUid) || {}
    modalLabels.value = modalLabelCache.get(projectUid) || {}
  }

  function resolveVariableLabel(value: unknown) {
    if (value === undefined || value === null || value === '') return '未设置'
    return variableLabels.value[String(value)] || MISSING_VARIABLE_LABEL
  }

  function resolveDrawLabel(value: unknown) {
    if (value === undefined || value === null || value === '') return '未设置'
    return drawLabels.value[String(value)] || String(value)
  }

  function resolveModalLabel(value: unknown) {
    if (value === undefined || value === null || value === '') return '未设置'
    return modalLabels.value[String(value)] || String(value)
  }

  function resolvePenLabel(value: unknown) {
    if (value === undefined || value === null || value === '') return '当前图元'
    return getPenLabelById(String(value))
  }

  onMounted(() => {
    void loadLabels()
  })

  return {
    loadLabels,
    variableLabels,
    resolveDrawLabel,
    resolveModalLabel,
    resolvePenLabel,
    resolveVariableLabel,
  }
}
