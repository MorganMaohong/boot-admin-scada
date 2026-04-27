import type { OptionKeyVo, OptionVo } from '@/model/index.ts'
import { extractFunctionBody, getUrlParams } from '@/utils/index.ts'
import { LineAnimateType, LockState } from '@meta2d/core'

export enum PropEnums {
  background = 'background',
  borderColor = 'borderColor',
  textColor = 'textColor',
  text = 'text',
  x = 'x',
  y = 'y',
  width = 'width',
  height = 'height',
  visible = 'visible',
  progress = 'progress',
  progressColor = 'progressColor',
  value = 'value',
  rotate = 'rotate',
  disabled = 'disabled',
  checked = 'checked',
  showChild = 'showChild',
}

export enum TypeEnums {
  text = 'text',
  number = 'number',
  color = 'color',
  textarea = 'textarea',
  select = 'select',
  switch = 'switch',
  json = 'json',
  slider = 'slider',
}

export enum ConditionEnums {
  x_gt_y = 'x > y',
  x_gte_y = 'x >= y',
  x_lt_y = 'x < y',
  x_lte_y = 'x <= y',
  x_eq_y = 'x == y',
  x_neq_y = 'x != y',
  x_between_icl_icu = 'y <= x && x <= z',
  x_between_icl_ecu = 'y <= x && x < z',
  x_between_ecl_icu = 'y < x && x <= z',
  x_between_ecl_ecu = 'y < x && x < z',
}

export const ConditionOptions: OptionVo[] = [
  { label: 'x > y', value: ConditionEnums.x_gt_y },
  { label: 'x >= y', value: ConditionEnums.x_gte_y },
  { label: 'x < y', value: ConditionEnums.x_lt_y },
  { label: 'x <= y', value: ConditionEnums.x_lte_y },
  { label: 'x = y', value: ConditionEnums.x_eq_y },
  { label: 'x != y', value: ConditionEnums.x_neq_y },
  { label: 'y <= x <= z', value: ConditionEnums.x_between_icl_icu },
  { label: 'y <= x < z', value: ConditionEnums.x_between_icl_ecu },
  { label: 'y < x <= z', value: ConditionEnums.x_between_ecl_icu },
  { label: 'y < x < z', value: ConditionEnums.x_between_ecl_ecu },
]

export interface DataForm {
  id: string
  name: string
  key: string
  value: string
  condData: CondItem[]
}

export interface CondItem {
  cond: boolean
  min: number
  max: number
  prop: string
  valueType: string
  propValue: any
}

export enum ValueTypeEnum {
  varValue = 'varValue',
  customValue = 'customValue',
}

export const ValueOptions: OptionVo[] = [
  { label: '变量值', value: ValueTypeEnum.varValue },
  { label: '自定义值', value: ValueTypeEnum.customValue },
]

export const PropOptions: OptionVo[] = [
  { label: '背景颜色', value: PropEnums.background },
  { label: '边框颜色', value: PropEnums.borderColor },
  { label: '文字颜色', value: PropEnums.textColor },
  { label: '文本', value: PropEnums.text },
  { label: 'x', value: PropEnums.x },
  { label: 'y', value: PropEnums.y },
  { label: '宽度', value: PropEnums.width },
  { label: '高度', value: PropEnums.height },
  { label: '显示', value: PropEnums.visible },
  { label: '进度', value: PropEnums.progress },
  { label: '进度颜色', value: PropEnums.progressColor },
  { label: '值', value: PropEnums.value },
  { label: '旋转', value: PropEnums.rotate },
  { label: '禁用', value: PropEnums.disabled },
  { label: '选中', value: PropEnums.checked },
  { label: '状态切换', value: PropEnums.showChild },
]

export function getOptionsLabel(options: OptionVo[], key: string): string {
  const item = options.find((item) => item.value === key)
  if (!item) return '未知'
  return <string>item.label
}

export function getOptionsKeyValue(options: OptionKeyVo[], key: string): string {
  const item = options.find((item) => item.key === key)
  if (!item) return '未知'
  return item.value
}

export const TypeOptions: OptionVo[] = [
  { label: '字符串', value: TypeEnums.text },
  { label: '数字', value: TypeEnums.number },
  { label: '颜色', value: TypeEnums.color },
  { label: '多行文本', value: TypeEnums.textarea },
  { label: '下拉框', value: TypeEnums.select },
  { label: '开关', value: TypeEnums.switch },
  // { label: 'Json', value: TypeEnums.json },
  { label: '滑块', value: TypeEnums.slider },
]

export enum EventNameEnums {
  enter = 'enter',
  leave = 'leave',
  active = 'active',
  inactive = 'inactive',
  click = 'click',
  dblclick = 'dblclick',
  mousedown = 'mousedown',
  mouseup = 'mouseup',
  valueUpdate = 'valueUpdate',
}

export enum EventActionEnums {
  Link = 0,
  SetProps = 1,
  StartAnimate = 2,
  PauseAnimate = 3,
  StopAnimate = 4,
  JS = 5, //Function
  GlobalFn = 6,
  Emit = 7,
  StartVideo = 8,
  PauseVideo = 9,
  StopVideo = 10,
  SendPropData = 11,
  SendVarData = 12,
  Navigator = 13,
  Dialog = 14,
  SendData = 15, //数据源选择
  PostMessage = 16, //发送场景数据
  PostMessageToParent = 17, //向父窗口发送消息
  Message = 18,
  SendVarDataJS = 19,
}

export enum TriggerEnum {
  none = 'none',
  comparison = 'comparison',
}

export enum ComparisonEnum {
  gt = '>',
  gte = '>=',
  lt = '<',
  lte = '<=',
  eq = '==',
  neq = '!=',
  in = '[)',
  notIn = '![)',
  belong = '[]',
  notBelong = '![]',
}

export const EventNameOptions: OptionVo[] = [
  { label: '鼠标进入', value: EventNameEnums.enter },
  { label: '鼠标离开', value: EventNameEnums.leave },
  { label: '选中', value: EventNameEnums.active },
  { label: '取消选中', value: EventNameEnums.inactive },
  { label: '单击', value: EventNameEnums.click },
  { label: '双击', value: EventNameEnums.dblclick },
  { label: '鼠标按下', value: EventNameEnums.mousedown },
  { label: '鼠标抬起', value: EventNameEnums.mouseup },
  { label: '值变化', value: EventNameEnums.valueUpdate },
]

export const EventActionOptions: OptionVo[] = [
  { label: '打开链接', value: EventActionEnums.Link },
  { label: '更改属性', value: EventActionEnums.SetProps },
  { label: '执行动画', value: EventActionEnums.StartAnimate },
  { label: '暂停动画', value: EventActionEnums.PauseAnimate },
  { label: '停止动画', value: EventActionEnums.StopAnimate },
  { label: '执行JS代码', value: EventActionEnums.JS },
  { label: '执行全局函数', value: EventActionEnums.GlobalFn },
  // { label: '发送消息', value: EventActionEnums.Emit },
  // { label: '播放视频', value: EventActionEnums.StartVideo },
  // { label: '暂停视频', value: EventActionEnums.PauseVideo },
  // { label: '停止视频', value: EventActionEnums.StopVideo },
  // { label: '发送图元数据', value: EventActionEnums.SendData },
  // { label: '发送绑定变量', value: EventActionEnums.SendVarData },
  // { label: '发送变量数据', value: EventActionEnums.SendVarDataJS },
  // { label: '对话框', value: EventActionEnums.Dialog },
]

export const PresetJsPropOptions: OptionVo[] = [
  { label: '文字', value: PropEnums.text },
  { label: '值', value: PropEnums.value },
  { label: '进度值', value: PropEnums.progress },
  { label: '选中值', value: PropEnums.checked },
  { label: '自定义', value: 'custom' },
]

export enum PresetJsKeyEnums {
  writeVarValue = 'writeVarValue',
}

function writeVarValueFn() {
  debugger
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  const result: Record<string, string> = {}

  for (const [key, value] of urlParams.entries()) {
    result[key] = value
  }
  const cookieToken = document.cookie
    .split('; ')
    .find((item) => item.startsWith('x-token='))
    ?.split('=')[1]
  const accessToken =
    result.accessToken ||
    (cookieToken ? decodeURIComponent(cookieToken) : '') ||
    localStorage.getItem('x-token') ||
    sessionStorage.getItem('x-token') ||
    ''

  console.log('pen:', pen)
  console.log('params:', params)
  let value = params.value
  if (params.prop != 'custom') value = pen[params.prop]
  // fetch(`https://bohao.wang/api/comport/variable/write/${params.key}/${params.value}`, {
  fetch(`/api/comport/variable/write/${params.key}/${value}`, {
    method: 'POST',
    headers: {
      satoken: accessToken,
    },
  })
    .then((response) => response.json())
    .then((result) => {
      console.log('成功响应:', result)
      if (result.code == 0) {
        if (result.msg) window.$message.success(result.msg)
      } else {
        if (result.msg) window.$message.error(result.msg)
      }
    })
    .catch((error) => {
      console.error('请求出错:', error)
    })
}

export enum PresetJsCodeEnums {
  writeVarValue = extractFunctionBody(writeVarValueFn),
}

export const PresetJsOptions: OptionKeyVo[] = [
  {
    label: '写入变量值',
    value: PresetJsCodeEnums.writeVarValue,
    key: PresetJsKeyEnums.writeVarValue,
  },
]

export const TriggerOptions: OptionVo[] = [
  { label: '无', value: TriggerEnum.none },
  { label: '关系运算', value: TriggerEnum.comparison },
]

export const TriggerComparisonPropOptions: OptionVo[] = [
  { label: '文字', value: PropEnums.text },
  { label: '值', value: PropEnums.value },
  { label: '进度值', value: PropEnums.progress },
]

export const ComparisonOptions: OptionVo[] = [
  { label: '大于', value: ComparisonEnum.gt },
  { label: '大于等于', value: ComparisonEnum.gte },
  { label: '小于', value: ComparisonEnum.lt },
  { label: '小于等于', value: ComparisonEnum.lte },
  { label: '等于', value: ComparisonEnum.eq },
  { label: '不等于', value: ComparisonEnum.neq },
  { label: '介于', value: ComparisonEnum.belong },
  { label: '不介于', value: ComparisonEnum.notBelong },
  { label: '属于', value: ComparisonEnum.in },
  { label: '不属于', value: ComparisonEnum.notIn },
]

export const LinkOpenOptions: OptionVo[] = [
  { label: '新窗口打开', value: '_blank' },
  { label: '覆盖当前页面', value: 'self' },
]

export interface EventForm {
  id: string
  title: string
  name: string
  action: number
  value: any
  params: any
  presetJsKey: string
  where: {
    type: string
    key: string
    comparison: string
    value: any
  }
  trigger: string
  setValue: string
}

export interface SetPropsItem {
  key: string
  value: any
}

export interface NodeAnimationForm {
  // 时长
  duration: number
  // 循环次数
  animateCycle: number
  // 保持动哈状态
  keepAnimateState: boolean
  autoPlay: boolean
  // 动画帧
  frames: []
  framesKey: string
}

export interface LineAnimationForm {
  // 时长
  duration: number
  // 循环次数
  animateCycle: number
  // 保持动哈状态
  keepAnimateState: boolean
  autoPlay: boolean
  // 动画帧
  frames: []
  framesKey: string
}

const enum AnimationEnum {
  jump_up_and_down = 'jump_up_and_down',
  swing_left_and_right = 'swing_left_and_right',
  zoom_in_and_out = 'zoom_in_and_out',
  flashing = 'flashing',
  rotate = 'rotate',
}

export const AnimationFramesOptions: OptionKeyVo[] = [
  {
    label: '上下跳动',
    key: AnimationEnum.jump_up_and_down,
    value: [
      { duration: 300, y: -20 },
      { duration: 300, y: 20 },
      { duration: 300, y: 0 },
    ],
  },
  {
    label: '左右摇摆',
    key: AnimationEnum.swing_left_and_right,
    value: [
      { duration: 300, rotate: -10 },
      { duration: 300, rotate: 10 },
      { duration: 300, rotate: 0 },
    ],
  },
  {
    label: '放大缩小',
    key: AnimationEnum.zoom_in_and_out,
    value: [
      { duration: 500, scale: 1.2 },
      { duration: 500, scale: 0.8 },
      { duration: 500, scale: 1 },
    ],
  },
  {
    label: '闪烁',
    key: AnimationEnum.flashing,
    value: [
      { duration: 500, visible: false },
      { duration: 500, visible: true },
    ],
  },
  {
    label: '旋转',
    key: AnimationEnum.rotate,
    value: [{ duration: 1000, rotate: 360 }],
  },
]

export const LineDashEnums = {
  solid: undefined,
  dashed: [10, 6], // 原[5,5]，适合 lineWidth 2~4，调大适合粗线
  dotted: [2, 6], // 原[1,4]，点和点之间更清晰
  dashDot: [14, 6, 3, 6], // 保留长短节奏，间距更大
  denseDashDot: [8, 3, 2, 3], // 稍微放宽间隔
}

export enum LineDashKeyEnums {
  solid = 'solid', // 实线
  dashed = 'dashed', // 虚线 - - - -
  dotted = 'dotted', // 点线 ····
  dashDot = 'dashDot', // 长短交错 ———·———
  denseDashDot = 'denseDashDot', // 更密集的组合 -·-·-·
}

export const LineDashOptions: OptionKeyVo[] = [
  { label: '实线', value: LineDashEnums.solid, key: LineDashKeyEnums.solid },
  { label: '虚线', value: LineDashEnums.dashed, key: LineDashKeyEnums.dashed },
  { label: '点线', value: LineDashEnums.dotted, key: LineDashKeyEnums.dotted },
  { label: '长短交错', value: LineDashEnums.dashDot, key: LineDashKeyEnums.dashDot },
  { label: '点线交错', value: LineDashEnums.denseDashDot, key: LineDashKeyEnums.denseDashDot },
]

export enum LineNameEnums {
  curve = 'curve',
  line = 'line',
  polyline = 'polyline',
}

export const LineNameOptions: OptionVo[] = [
  { label: '曲线', value: LineNameEnums.curve },
  { label: '直线', value: LineNameEnums.line },
  { label: '折线', value: LineNameEnums.polyline },
]

export enum LineGradientEnums {
  none = 'none',
  gradient = 'gradient',
}

export const LineGradientOptions: OptionVo[] = [
  { label: '无', value: 'none' },
  { label: '渐变', value: 'gradient' },
]

export const LineAnimationOptions: OptionVo[] = [
  { label: '水流', value: LineAnimateType.Normal },
  { label: '水珠流动', value: LineAnimateType.Beads },
  { label: '圆点', value: LineAnimateType.Dot },
  { label: '箭头', value: LineAnimateType.Arrow },
  { label: '水滴', value: LineAnimateType.WaterDrop },
]

export enum GlobalFnEnums {
  openDraw = 'openDraw',
  writeVar = 'writeVar',
  controlVar = 'controlVar',
  openFullScreen = 'openFullScreen',
  openModal = 'openModal',
}

export const GlobalFnOptions: OptionVo[] = [
  { label: '打开图纸', value: GlobalFnEnums.openDraw },
  { label: '写入变量值', value: GlobalFnEnums.writeVar },
  { label: '显示变量控制', value: GlobalFnEnums.controlVar },
  { label: '显示全屏', value: GlobalFnEnums.openFullScreen },
  { label: '打开弹窗', value: GlobalFnEnums.openModal },
]

export const PenLockedOptions: OptionVo[] = [
  { label: '未锁定', value: LockState.None },
  { label: '禁止编辑图元', value: LockState.DisableEdit },
  { label: '禁止移动图元', value: LockState.DisableMove },
  { label: '禁止图元操作', value: LockState.Disable },
]

export interface Tags {
  value: string
  key: string
}

export enum TextAlignEnum {
  leftAlign = 'left',
  centerAlign = 'center',
  rightAlign = 'right',
}

export const TextAlignOptions: OptionVo[] = [
  { label: '左对齐', value: TextAlignEnum.leftAlign },
  { label: '居中', value: TextAlignEnum.centerAlign },
  { label: '右对齐', value: TextAlignEnum.rightAlign },
]

export enum TextBaselineEnum {
  top = 'top',
  middle = 'middle',
  bottom = 'bottom',
}

export const TextBaselineEnumOptions: OptionVo[] = [
  { label: '顶部对齐', value: TextBaselineEnum.top },
  { label: '居中', value: TextBaselineEnum.middle },
  { label: '底部对齐', value: TextBaselineEnum.bottom },
]

export enum NodeAlignEnum {
  left = 'left',
  right = 'right',
  top = 'top',
  bottom = 'bottom',
  center = 'center',
  middle = 'middle',
}
