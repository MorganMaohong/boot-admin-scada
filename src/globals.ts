// src/globals.ts

// 定义函数
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { getUrlParams } from '@/utils'
import { VarService } from '@/services/VarService.ts'
import emitter from '@/utils/eventBus.ts'
import { LockState } from '@meta2d/core'
import { mqttUtil } from '@/utils/mqttUtil.ts'
import { useDrawStoreHook } from '@/stores/module/draw.ts'

const drawStore = useDrawStoreHook()

export function openDraw(pen: any, params: any) {
  // drawStore.topics.forEach((topic) => {
  //   mqttUtil.doUnSubscribe(topic, 0)
  // })
  MonitorDrawService.form(getUrlParams().projectUid, params).then((res) => {
    const dj = JSON.parse(res.data)
    dj.rule = false
    dj.locked = LockState.DisableEdit
    dj.disableScale = !drawStore.isMobile
    dj.disableTranslate = !drawStore.isMobile
    meta2d.store.options.disableDock = true
    meta2d.open(dj)
    setDefVisible()
    meta2d.fitView(true, 5)
    meta2d.render()
    drawStore.selectVarCacheData()
  })
}

function setDefVisible() {
  const pens = meta2d.data().pens

  // 收集所有组合图元的子图元 ID
  const allChildIds = new Set<string>()
  pens.forEach((pen) => {
    if (pen.children) {
      pen.children.forEach((child) => allChildIds.add(child))
    }
  })

  pens.forEach((pen) => {
    // 如果是子图元，就跳过，不处理它的 visible
    if (allChildIds.has(pen.id)) return

    // 否则，设置它自己的 visible 状态
    meta2d.setValue({ id: pen.id, visible: pen.defVisible }, { render: true })
  })
}

export function writeVar(pen: any, params: any) {
  let value
  if (params.prop === 'custom') {
    value = params.value
  } else {
    value = pen[params.prop]
  }
  VarService.write(params.key, value).then(() => {})
}

export function controlVar(pen: any, params: any) {
  emitter.emit('showControlVar', { pen, params })
}

export function openFullScreen(pen: any, params: any) {
  const doc: any = document
  const element = document.documentElement

  if (
    !doc.fullscreenElement &&
    !doc.webkitFullscreenElement &&
    !doc.mozFullScreenElement &&
    !doc.msFullscreenElement
  ) {
    // 当前不是全屏，进入全屏
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen()
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen()
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen()
    }
  } else {
    // 当前是全屏，退出全屏
    if (doc.exitFullscreen) {
      doc.exitFullscreen()
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen()
    } else if (doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen()
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen()
    }
  }
  // window.parent.postMessage({ type: 'REQUEST_FULLSCREEN' }, '*')
}

export function openModal(pen: any, params: any) {
  console.log('openModal', pen, params)
  drawStore.globalModal.show = true
}

// 注册到 globalThis
;(globalThis as any).openDraw = openDraw
;(globalThis as any).writeVar = writeVar
;(globalThis as any).controlVar = controlVar
;(globalThis as any).openFullScreen = openFullScreen
;(globalThis as any).openModal = openModal
