import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const collapsed = ref(false)
  const targetPicker = ref<{
    active: boolean
    sourcePenId: string
    targetField: 'params' | 'value' | null
    pickedPenId: string
  }>({
    active: false,
    sourcePenId: '',
    targetField: null,
    pickedPenId: '',
  })

  function startTargetPick(sourcePenId: string, targetField: 'params' | 'value') {
    targetPicker.value = {
      active: true,
      sourcePenId,
      targetField,
      pickedPenId: '',
    }
  }

  function completeTargetPick(pickedPenId: string) {
    targetPicker.value = {
      ...targetPicker.value,
      active: false,
      pickedPenId,
    }
  }

  function cancelTargetPick() {
    targetPicker.value = {
      ...targetPicker.value,
      active: false,
      pickedPenId: '',
    }
  }

  function consumeTargetPick() {
    targetPicker.value = {
      active: false,
      sourcePenId: '',
      targetField: null,
      pickedPenId: '',
    }
  }

  return {
    collapsed,
    targetPicker,
    startTargetPick,
    completeTargetPick,
    cancelTargetPick,
    consumeTargetPick,
  }
})
