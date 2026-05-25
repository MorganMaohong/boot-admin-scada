import {
  type DataForm,
  EventActionEnums,
  GlobalFnEnums,
  type EventForm,
} from '@/components/ElementsProps/model'

const SELF_TARGET_PARAMS_ACTIONS = new Set<number>([EventActionEnums.SetProps])
const SELF_TARGET_VALUE_ACTIONS = new Set<number>([
  EventActionEnums.StartAnimate,
  EventActionEnums.PauseAnimate,
  EventActionEnums.StopAnimate,
])

function ensureEventParams(event: EventForm) {
  if (!event.params || typeof event.params !== 'object') {
    event.params = {}
    return true
  }
  return false
}

export function syncEventsWithPenBinding(
  events: EventForm[] = [],
  options: {
    penId?: string
    varKey?: string
    forceVarKey?: boolean
    sourcePenId?: string
  },
) {
  const { penId = '', varKey = '', forceVarKey = false, sourcePenId = '' } = options
  let changed = false

  events.forEach((event) => {
    if (!event || typeof event !== 'object') return

    if (
      SELF_TARGET_PARAMS_ACTIONS.has(event.action) &&
      penId &&
      (forceVarKey || (sourcePenId && event.params === sourcePenId))
    ) {
      event.params = penId
      changed = true
    }

    if (
      SELF_TARGET_VALUE_ACTIONS.has(event.action) &&
      penId &&
      (forceVarKey || (sourcePenId && event.value === sourcePenId))
    ) {
      event.value = penId
      changed = true
    }

    if (
      event.action === EventActionEnums.GlobalFn &&
      (event.value === GlobalFnEnums.writeVar || event.value === GlobalFnEnums.controlVar)
    ) {
      changed = ensureEventParams(event) || changed
      if (varKey && (forceVarKey || !event.params.key) && event.params.key !== varKey) {
        event.params.key = varKey
        changed = true
      }
    }
  })

  return changed
}

export function syncDatasWithPenBinding(
  datas: Array<DataForm & { autoSync?: boolean }> = [],
  options: {
    varKey?: string
    autoSyncName?: string
    fallbackName?: string
    forceVarKey?: boolean
  },
) {
  const {
    varKey = '',
    autoSyncName = '默认值同步',
    fallbackName = '',
    forceVarKey = false,
  } = options
  let changed = false

  datas.forEach((item) => {
    if (!item || typeof item !== 'object') return

    if (varKey && (forceVarKey || !item.key) && item.key !== varKey) {
      item.key = varKey
      changed = true
    }

    if (item.autoSync === true) {
      if (item.name !== autoSyncName) {
        item.name = autoSyncName
        changed = true
      }
      return
    }

    if (!item.name && fallbackName) {
      item.name = fallbackName
      changed = true
    }
  })

  return changed
}
