import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GlobalModalParams, ProjectMonitorDraw } from '@/model/draw'
import { ProjectService } from '@/services/ProjectService.ts'
import { getUrlParams } from '@/utils'
import store from '@/stores'
import { VarService } from '@/services/VarService.ts'
import type { Pen } from '@meta2d/core'
import { type DataForm, ValueTypeEnum } from '@/components/ElementsProps/model'
import type { Payload } from '@/model'

export const useDrawStore = defineStore('draw', () => {
  const draw = ref<ProjectMonitorDraw>({})
  const isPenDrawLine = ref(false)
  const isPencilDrawLine = ref(false)
  const isRotated = ref(false)
  const isMobile = ref(false)
  const topics = ref([])
  const cacheData = ref({})
  const snList = ref([])
  const globalModal = ref<GlobalModalParams>({
    show: false,
    draw: {},
  })
  const setTitle = () => {
    ProjectService.getProjectName(getUrlParams().projectUid).then((res) => {
      document.title = res
    })
  }
  const selectVarCacheData = () => {
    VarService.selectVarCacheDataBySnList(snList.value).then((data) => {
      cacheData.value.data = data
      process(cacheData.value)
    })
  }

  const process = (payload: any) => {
    meta2d.data().pens.forEach((pen) => {
      // debugger
      if (!pen) return
      if (!pen.key) return
      processDatas(pen, pen.datas, payload)
    })
  }

  function processDatas(pen: Pen, datas: DataForm[], payload: Payload) {
    // debugger
    if (!datas) return
    datas.forEach((data) => {
      processCondData(pen, data, payload)
    })
  }

  function processCondData(pen: Pen, data: DataForm, payload: Payload) {
    let value = payload.data[pen.key]
    if (value === null || value === undefined) return
    if (typeof value === 'boolean') {
      value = value ? 1 : 0
    } else if (value === 'false') {
      value = 0
    } else if (value === 'true') {
      value = 1
    }
    if (pen.value !== value) {
      meta2d.setValue({ id: pen.id, value }, { render: false })
    }
    for (const cond of data.condData) {
      const isInRange = cond.min <= value && value <= cond.max

      // 条件存在时，只有值落在范围内才处理
      if (cond.cond && !isInRange) continue

      if (cond.valueType === ValueTypeEnum.varValue) {
        if (pen[cond.prop] === value) continue

        meta2d.setValue({ id: pen.id, [cond.prop]: value }, { render: true })
      }

      if (cond.valueType === ValueTypeEnum.customValue) {
        if (pen[cond.prop] === cond.propValue) continue

        meta2d.setValue({ id: pen.id, [cond.prop]: cond.propValue }, { render: true })
      }
    }
  }

  return {
    draw,
    isPenDrawLine,
    isPencilDrawLine,
    isRotated,
    isMobile,
    setTitle,
    topics,
    cacheData,
    selectVarCacheData,
    snList,
    process,
    globalModal,
  }
})

/** 在 setup 外使用 */
export function useDrawStoreHook() {
  return useDrawStore(store)
}
