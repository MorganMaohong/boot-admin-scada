<template>
  <div id="meta2d" class="bg-gray-100">
    <n-popover
      :show="showMenu"
      :x="menuPosition.x"
      :y="menuPosition.y"
      trigger="manual"
      placement="right-start"
    >
      <n-list style="width: 160px">
        <n-list-item class="cursor-pointer" @click="top">置顶</n-list-item>
        <n-list-item class="cursor-pointer" @click="bottom">置底</n-list-item>
        <n-list-item class="cursor-pointer" @click="up">上一个图层</n-list-item>
        <n-list-item class="cursor-pointer" @click="down">下一个图层</n-list-item>
        <n-list-item class="cursor-pointer" @click="del">删除</n-list-item>
        <n-list-item class="cursor-pointer" @click="undo">撤销</n-list-item>
        <n-list-item class="cursor-pointer" @click="cut">剪切</n-list-item>
        <n-list-item class="cursor-pointer" @click="copy">复制</n-list-item>
        <n-list-item class="cursor-pointer" @click="paste">粘贴</n-list-item>
        <template
          v-if="selections.pen && selections.pen.children && selections.pen.children.length > 0"
        >
          <n-list-item
            class="cursor-pointer"
            @click="unCombine"
            v-if="selections.pen.showChild == undefined"
            >取消组合
          </n-list-item>
          <n-list-item class="cursor-pointer" @click="unCombineState" v-else
            >取消组状态
          </n-list-item>
        </template>
        <template v-else-if="selections.pens && selections.pens.length > 0">
          <n-list-item class="cursor-pointer" @click="combine">组合</n-list-item>
          <n-list-item class="cursor-pointer" @click="combineState">组合成状态</n-list-item>
        </template>
      </n-list>
    </n-popover>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import type { Pen } from '@meta2d/core'
import { Meta2d, register, registerAnchors, registerCanvasDraw, LockState } from '@meta2d/core'
import { flowPens, flowAnchors } from '@meta2d/flow-diagram'
import { activityDiagram, activityDiagramByCtx } from '@meta2d/activity-diagram'
import { classPens } from '@meta2d/class-diagram'
import { sequencePens, sequencePensbyCtx } from '@meta2d/sequence-diagram'
import { register as registerEcharts } from '@meta2d/chart-diagram'
import { formPens, formPath2DPens } from '@meta2d/form-diagram'
import { chartsPens } from '@meta2d/le5le-charts'
import { ftaPens, ftaPensbyCtx, ftaAnchors } from '@meta2d/fta-diagram'
import { useSelection } from '@/services/selections'
import emitter from '@/utils/eventBus.ts'
import { useDrawStore } from '@/stores/module/draw.ts'
import { EventActionEnums } from '@/components/ElementsProps/model'
import { ProjectService } from '@/services/ProjectService.ts'
import { getUrlParams } from '@/utils'
import { useLayerStore } from '@/stores/module/layer.ts'

const drawStore = useDrawStore()
const layerStore = useLayerStore()
const { select, selections, selects } = useSelection()
const showMenu = ref(false)
const menuPosition = ref({
  x: 0,
  y: 0,
})

onMounted(() => {
  drawStore.setTitle()
  emitter.on('draw', init)
})

function init() {
  // 创建实例
  new Meta2d('meta2d')
  // 按需注册图形库
  // 以下为自带基础图形库
  register(flowPens())
  registerAnchors(flowAnchors())
  register(activityDiagram())
  registerCanvasDraw(activityDiagramByCtx())
  register(classPens())
  register(sequencePens())
  registerCanvasDraw(sequencePensbyCtx())
  registerEcharts()
  registerCanvasDraw(formPens())
  register(formPath2DPens()) //版本>=1.0.9
  registerCanvasDraw(chartsPens())
  register(ftaPens())
  registerCanvasDraw(ftaPensbyCtx())
  registerAnchors(ftaAnchors())
  // 注册其他自定义图形库
  // ...

  const draw = drawStore.draw
  if (!draw) {
    window.$message.error('图纸异常')
    return
  }
  layerStore.getDefaultLayer();
  let data = JSON.parse(draw.data)
  // data.bkImage = ''
  meta2d.open(data)

  // 参数设置
  meta2d.store.data.disableScale = false
  meta2d.store.options.autoAnchor = false
  meta2d.store.options.strictScope = true

  meta2d.fitView(true, 5)

  document.addEventListener('fullscreenchange', () => {
    setTimeout(() => {
      meta2d.fitView(true, 5)
    }, 200)
  })

  meta2d.on('active', active)

  meta2d.on('inactive', inactive)
  // 右键菜单
  meta2d.on('contextmenu', showContextMenu)
  // 点击画布
  meta2d.on('click', hideContextMenu)

  console.log('---------------------')
  console.log(meta2d.data())
  console.log('---------------------')
  emitter.emit('meta2d-ready')
  meta2d.on('paste', processPaste)
}

function processPaste(pens: pen[]) {
  debugger
  console.log('新的pen')
  console.log('---------------------')
  console.log('---------------------')
  for (const pen of pens) {
    if (!pen) continue
    if (!pen.events) continue
    if (!pen.key) continue
    for (const e of pen.events) {
      if (
        e.action === EventActionEnums.StartAnimate ||
        e.action === EventActionEnums.PauseAnimate ||
        e.action === EventActionEnums.StopAnimate ||
        e.action === EventActionEnums.SetProps
      ) {
        e.params = pen.id
      }
    }
  }
  meta2d.setValue(pens, { render: true })
}

const active = (pens?: Pen[]) => {
  if (drawStore.isPenDrawLine || drawStore.isPencilDrawLine) return
  select(pens)
  selects(pens)
}

const inactive = () => {
  if (drawStore.isPenDrawLine || drawStore.isPencilDrawLine) return
  select()
}

const showContextMenu = (e) => {
  if (!selections.pens) return
  showMenu.value = true
  menuPosition.value.x = e.e.clientX
  menuPosition.value.y = e.e.clientY
}

function top() {
  if (!selections.pens) return
  meta2d.top(selections.pens)
  meta2d.render()
  showMenu.value = false
}

function bottom() {
  if (!selections.pens) return
  meta2d.bottom(selections.pens)
  meta2d.render()
  showMenu.value = false
}

function up() {
  if (!selections.pens) return
  meta2d.up(selections.pens)
  meta2d.render()
  showMenu.value = false
}

function down() {
  if (!selections.pens) return
  meta2d.down(selections.pens)
  meta2d.render()
  showMenu.value = false
}

function del() {
  if (!selections.pens) return
  meta2d.delete(selections.pens)
  meta2d.render()
  showMenu.value = false
}

function cut() {
  if (!selections.pens) return
  meta2d.cut(selections.pens)
  meta2d.render()
  showMenu.value = false
}

function copy() {
  if (!selections.pens) return
  meta2d.copy(selections.pens)
  meta2d.render()
  showMenu.value = false
}

function paste() {
  meta2d.paste()
  meta2d.render()
  showMenu.value = false
}

function undo() {
  meta2d.undo()
  meta2d.render()
  showMenu.value = false
}

function combine() {
  if (!selections.pens) return
  meta2d.combine(selections.pens)
  meta2d.render()
  showMenu.value = false
}

function combineState() {
  if (!selections.pens) return
  meta2d.combine(selections.pens, 0)
  meta2d.render()
  showMenu.value = false
}

function unCombine() {
  if (!selections.pen) return
  meta2d.uncombine(selections.pen)
  meta2d.render()
  showMenu.value = false
}

function unCombineState() {
  if (!selections.pen) return
  meta2d.uncombine(selections.pen)
  meta2d.render()
  showMenu.value = false
}

const hideContextMenu = () => {
  console.log('hideContextMenu')
  showMenu.value = false
}

onUnmounted(() => {
  meta2d.destroy()
})
</script>
<style lang="postcss" scoped>
#meta2d {
  height: calc(100vh - 80px);
  z-index: 1;
}
</style>
