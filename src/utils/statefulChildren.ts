export interface ChildStateValueItem {
  childId: string
  value: string | number
}

function getPenId(pen: any) {
  return pen?.id ? String(pen.id) : ''
}

function normalizeStateValue(value: any) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function toChildIds(pen: any) {
  if (!Array.isArray(pen?.children)) return []
  return pen.children.map((childId: any) => String(childId)).filter(Boolean)
}

export function getChildStateValues(pen: any): ChildStateValueItem[] {
  const childIds = toChildIds(pen)
  if (childIds.length === 0) return []

  const storedValues = Array.isArray(pen?.childStateValues) ? pen.childStateValues : []
  const valueMap = new Map<string, string | number>()

  storedValues.forEach((item: any, index: number) => {
    const childId = item?.childId ? String(item.childId) : childIds[index]
    if (!childId) return
    valueMap.set(childId, item?.value ?? index)
  })

  return childIds.map((childId, index) => ({
    childId,
    value: valueMap.has(childId) ? valueMap.get(childId)! : index,
  }))
}

export function ensureChildStateValues(pen: any) {
  const nextValues = getChildStateValues(pen)
  const currentValues = Array.isArray(pen?.childStateValues) ? pen.childStateValues : []

  if (currentValues.length !== nextValues.length) {
    return { values: nextValues, changed: true }
  }

  const changed = nextValues.some((item, index) => {
    const current = currentValues[index]
    return (
      String(current?.childId || '') !== item.childId ||
      normalizeStateValue(current?.value) !== normalizeStateValue(item.value)
    )
  })

  return { values: nextValues, changed }
}

export function resolveShowChildIndex(
  pen: any,
  desiredValue: any,
): { matched: boolean; index?: number } {
  const childStateValues = getChildStateValues(pen)
  if (childStateValues.length === 0) {
    return { matched: false }
  }

  const normalizedDesiredValue = normalizeStateValue(desiredValue)
  const mappedIndex = childStateValues.findIndex(
    (item) => normalizeStateValue(item.value) === normalizedDesiredValue,
  )
  if (mappedIndex >= 0) {
    return { matched: true, index: mappedIndex }
  }

  if (typeof desiredValue === 'number' && Number.isInteger(desiredValue)) {
    if (desiredValue >= 0 && desiredValue < childStateValues.length) {
      return { matched: true, index: desiredValue }
    }
  }

  if (typeof desiredValue === 'string' && desiredValue.trim() !== '') {
    const numericValue = Number(desiredValue)
    if (
      Number.isInteger(numericValue) &&
      numericValue >= 0 &&
      numericValue < childStateValues.length
    ) {
      return { matched: true, index: numericValue }
    }
  }

  return { matched: false }
}

export function getShowChildStateValue(pen: any) {
  const showChild = pen?.showChild
  const childStateValues = getChildStateValues(pen)
  if (!childStateValues.length) return showChild

  if (typeof showChild === 'number' && childStateValues[showChild]) {
    return childStateValues[showChild].value
  }

  const resolved = resolveShowChildIndex(pen, showChild)
  if (resolved.matched && resolved.index !== undefined) {
    return childStateValues[resolved.index]?.value
  }

  return showChild
}
