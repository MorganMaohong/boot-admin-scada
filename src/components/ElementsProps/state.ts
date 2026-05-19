import { ref } from 'vue'

export type ElementsPropsTab = 'appearance' | 'event' | 'effect' | 'data' | 'structure'

export const elementsPropsActiveTab = ref<ElementsPropsTab>('appearance')

export function resetElementsPropsActiveTab() {
  elementsPropsActiveTab.value = 'appearance'
}
