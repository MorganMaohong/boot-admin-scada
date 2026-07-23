import { register, registerCanvasDraw, type Pen } from '@meta2d/core'

export const ScadaPenNames = {
  card: 'scadaCard',
  badge: 'scadaBadge',
  value: 'scadaValue',
  divider: 'scadaDivider',
} as const

const SCADA_PEN_NAME_SET = new Set<string>(Object.values(ScadaPenNames))
interface CanvasGifState {
  canvas: any
  decodeToken: number
  decodedFrame?: CanvasImageSource & { close?: () => void; duration?: number }
  decoder?: { close?: () => void; decode: (options: any) => Promise<any>; tracks: any }
  failed: boolean
  frameCount: number
  frameIndex: number
  image: HTMLImageElement
  loaded: boolean
  pen: Pen & Record<string, any>
  timer?: number
  url: string
}

const canvasGifStates = new Map<string, CanvasGifState>()

let registered = false

export function registerScadaPens() {
  // Meta2d 默认 gif 会创建独立 DOM，无法插入 Canvas 内部的图层顺序。
  // 保留 gif 名称和数据结构，仅将路径渲染替换为 Canvas 绘制。
  register({ gif: () => new Path2D() })
  if (registered) return
  registerCanvasDraw({
    gif: drawCanvasGif,
    text: drawSpacingText,
    [ScadaPenNames.card]: drawScadaCard,
    [ScadaPenNames.badge]: drawScadaBadge,
    [ScadaPenNames.value]: drawScadaValue,
    [ScadaPenNames.divider]: drawScadaDivider,
  })
  registered = true
}

function drawCanvasGif(ctx: CanvasRenderingContext2D, pen: Pen & Record<string, any>) {
  const url = String(pen.image || '')
  const rect = pen.calculative?.worldRect
  if (!url || !rect) return

  const state = getCanvasGifState(pen, url)
  if (!state.loaded) return

  let x = rect.x
  let y = rect.y
  let width = rect.width
  let height = rect.height
  const decodedFrame = state.decodedFrame as any
  const naturalWidth =
    Number(decodedFrame?.displayWidth || decodedFrame?.codedWidth) || state.image.naturalWidth
  const naturalHeight =
    Number(decodedFrame?.displayHeight || decodedFrame?.codedHeight) || state.image.naturalHeight
  if (pen.imageRatio && naturalWidth && naturalHeight) {
    const ratio = Math.min(
      rect.width / naturalWidth,
      rect.height / naturalHeight,
    )
    width = naturalWidth * ratio
    height = naturalHeight * ratio
    x += (rect.width - width) / 2
    y += (rect.height - height) / 2
  }

  ctx.drawImage(state.decodedFrame || state.image, x, y, width, height)
}

function getCanvasGifState(pen: Pen & Record<string, any>, url: string) {
  const key = getCanvasGifKey(pen)
  const current = canvasGifStates.get(key)
  if (current?.url === url) {
    current.pen = pen
    current.canvas = pen.calculative.canvas
    return current
  }
  if (current) disposeCanvasGifState(key, current)

  const image = new Image()
  const crossOrigin =
    pen.crossOrigin || pen.calculative?.canvas?.store?.options?.crossOrigin || 'anonymous'
  if (!url.startsWith('data:') && !url.startsWith('blob:')) {
    image.crossOrigin = crossOrigin
  }
  image.decoding = 'async'

  const state: CanvasGifState = {
    canvas: pen.calculative.canvas,
    decodeToken: 0,
    failed: false,
    frameCount: 0,
    frameIndex: 0,
    image,
    loaded: false,
    pen,
    url,
  }
  canvasGifStates.set(key, state)
  installCanvasGifDestroy(pen)

  image.onload = () => {
    if (canvasGifStates.get(key) !== state) return
    state.loaded = true
    state.canvas?.render?.(true)
  }
  image.onerror = () => {
    if (canvasGifStates.get(key) !== state) return
    // 保留失败状态，避免每次 Canvas 重绘都重新发起同一请求。
    state.failed = true
  }
  image.src = resolveCanvasGifUrl(pen, url)
  startCanvasGifDecoder(key, state)
  return state
}

async function startCanvasGifDecoder(key: string, state: CanvasGifState) {
  const ImageDecoderClass = (globalThis as any).ImageDecoder
  if (!ImageDecoderClass) return
  const token = ++state.decodeToken

  try {
    const data = await loadCanvasGifBytes(resolveCanvasGifUrl(state.pen, state.url))
    if (canvasGifStates.get(key) !== state || token !== state.decodeToken) return
    const type = detectAnimatedImageType(data)
    if (!type || !(await ImageDecoderClass.isTypeSupported(type))) return

    const decoder = new ImageDecoderClass({ data, type })
    await decoder.tracks.ready
    if (canvasGifStates.get(key) !== state || token !== state.decodeToken) {
      decoder.close?.()
      return
    }

    state.decoder = decoder
    state.frameCount = Math.max(1, Number(decoder.tracks.selectedTrack?.frameCount || 1))
    state.frameIndex = 0
    decodeCanvasGifFrame(key, state, token)
  } catch {
    // 解码不支持或网络暂时失败时，保留首帧，不影响画布其他图元。
  }
}

async function decodeCanvasGifFrame(key: string, state: CanvasGifState, token: number) {
  if (
    canvasGifStates.get(key) !== state ||
    token !== state.decodeToken ||
    !state.decoder
  ) {
    return
  }

  try {
    const result = await state.decoder.decode({ frameIndex: state.frameIndex })
    if (canvasGifStates.get(key) !== state || token !== state.decodeToken) {
      result.image?.close?.()
      return
    }

    state.decodedFrame?.close?.()
    state.decodedFrame = result.image
    state.loaded = true
    state.canvas?.render?.(true)
    state.frameIndex = (state.frameIndex + 1) % state.frameCount

    if (state.frameCount <= 1) return

    const duration = Math.max(20, Number(result.image?.duration || 50_000) / 1000)
    state.timer = window.setTimeout(() => {
      decodeCanvasGifFrame(key, state, token)
    }, duration)
  } catch {
    state.failed = true
  }
}

async function loadCanvasGifBytes(url: string) {
  if (url.startsWith('data:')) {
    const commaIndex = url.indexOf(',')
    if (commaIndex < 0) throw new Error('Invalid animated image data URL')
    const meta = url.slice(0, commaIndex)
    const body = url.slice(commaIndex + 1)
    if (meta.includes(';base64')) {
      const binary = atob(body)
      const bytes = new Uint8Array(binary.length)
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
      }
      return bytes
    }
    return new TextEncoder().encode(decodeURIComponent(body))
  }

  const response = await fetch(url, { credentials: 'omit', mode: 'cors' })
  if (!response.ok) throw new Error(`Animated image request failed: ${response.status}`)
  return new Uint8Array(await response.arrayBuffer())
}

function detectAnimatedImageType(data: Uint8Array) {
  if (
    data.length >= 6 &&
    String.fromCharCode(...data.slice(0, 6)).startsWith('GIF8')
  ) {
    return 'image/gif'
  }
  if (
    data.length >= 8 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  ) {
    return 'image/png'
  }
  if (
    data.length >= 12 &&
    String.fromCharCode(...data.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...data.slice(8, 12)) === 'WEBP'
  ) {
    return 'image/webp'
  }
  return ''
}

function resolveCanvasGifUrl(pen: Pen & Record<string, any>, url: string) {
  const cdn = pen.calculative?.canvas?.store?.options?.cdn
  if (!cdn || url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) {
    return url
  }
  return cdn + url
}

function getCanvasGifKey(pen: Pen & Record<string, any>) {
  const storeId = pen.calculative?.canvas?.store?.id || 'default'
  return `${storeId}-${pen.id}`
}

function installCanvasGifDestroy(pen: Pen & Record<string, any>) {
  if (pen.calculative?.canvasGifDestroyInstalled) return
  pen.calculative.canvasGifDestroyInstalled = true
  const previousDestroy = pen.onDestroy
  pen.onDestroy = (destroyedPen: Pen) => {
    const key = getCanvasGifKey(destroyedPen as Pen & Record<string, any>)
    const state = canvasGifStates.get(key)
    if (state) disposeCanvasGifState(key, state)
    previousDestroy?.(destroyedPen)
  }
}

function disposeCanvasGifState(key: string, state: CanvasGifState) {
  if (canvasGifStates.get(key) === state) canvasGifStates.delete(key)
  state.decodeToken += 1
  if (state.timer) window.clearTimeout(state.timer)
  state.decodedFrame?.close?.()
  state.decoder?.close?.()
  state.image.onload = null
  state.image.onerror = null
}

export function isScadaAtomPen(pen?: Pen | Record<string, any>) {
  return Boolean(pen?.name && SCADA_PEN_NAME_SET.has(String(pen.name)))
}

export function isScadaValuePen(pen?: Pen | Record<string, any>) {
  return pen?.name === ScadaPenNames.value
}

export function normalizeScadaAtomPen(pen: Record<string, any>) {
  if (!isScadaAtomPen(pen)) return null

  const patch: Record<string, any> = {}
  if (pen.name === ScadaPenNames.badge && !pen.scadaText && pen.text) {
    patch.scadaText = pen.text
  }
  if (pen.name === ScadaPenNames.value && pen.value === undefined && pen.text) {
    patch.value = pen.text
  }
  if (pen.text) {
    patch.text = ''
  }

  return Object.keys(patch).length ? patch : null
}

function drawSpacingText(ctx: CanvasRenderingContext2D, pen: Pen & Record<string, any>) {
  if (!pen.scadaText) return
  const rect = pen.calculative?.worldTextRect || pen.calculative?.worldRect
  if (!rect) return

  const lines = String(pen.scadaText).split('\n')
  const scale = getScale(pen)
  const fontSize = Number(pen.calculative?.fontSize || pen.fontSize || 16)
  const lineHeight = Number(pen.lineHeight || pen.calculative?.lineHeight || 1.2)
  const rowHeight = fontSize * lineHeight
  const textHeight = lines.length * rowHeight
  const align = pen.textAlign || 'left'
  const baseline = pen.textBaseline || 'top'
  const spacing = Number(pen.letterSpacing || 0) * scale

  let startY = rect.y
  if (baseline === 'middle') {
    startY = rect.y + (rect.height - textHeight) / 2
  } else if (baseline === 'bottom') {
    startY = rect.y + rect.height - textHeight
  }

  ctx.save()
  ctx.fillStyle = pen.textColor || pen.color || '#222222'
  ctx.font = buildFont(pen, fontSize)
  ctx.textBaseline = 'top'

  lines.forEach((line, index) => {
    const width = measureTextWithSpacing(ctx, line, spacing)
    let x = rect.x
    if (align === 'center') {
      x = rect.x + (rect.width - width) / 2
    } else if (align === 'right') {
      x = rect.x + rect.width - width
    }
    fillTextWithSpacing(ctx, line, x, startY + index * rowHeight, spacing)
  })
  ctx.restore()
}

function drawScadaCard(ctx: CanvasRenderingContext2D, pen: Pen & Record<string, any>) {
  const rect = pen.calculative?.worldRect
  if (!rect) return

  const scale = getScale(pen)
  const radius = resolveRadius(pen, rect.width, rect.height, scale)
  const shadowEnabled = pen.scadaShadow !== false

  ctx.save()
  if (shadowEnabled) {
    ctx.shadowColor = pen.scadaShadowColor || 'rgba(15, 23, 42, 0.12)'
    ctx.shadowBlur = Number(pen.scadaShadowBlur ?? 16) * scale
    ctx.shadowOffsetX = Number(pen.scadaShadowOffsetX ?? 0) * scale
    ctx.shadowOffsetY = Number(pen.scadaShadowOffsetY ?? 8) * scale
  }

  drawRoundRect(ctx, rect.x, rect.y, rect.width, rect.height, radius)
  ctx.fillStyle = pen.background || '#ffffff'
  ctx.fill()
  ctx.shadowColor = 'transparent'

  if ((pen.lineWidth ?? pen.borderWidth ?? 1) > 0) {
    ctx.strokeStyle = pen.color || '#dbe4ef'
    ctx.lineWidth = Math.max(1, Number(pen.lineWidth || pen.borderWidth || 1) * scale)
    ctx.stroke()
  }
  ctx.restore()
}

function drawScadaBadge(ctx: CanvasRenderingContext2D, pen: Pen & Record<string, any>) {
  const rect = pen.calculative?.worldRect
  if (!rect) return

  const scale = getScale(pen)
  const radius = Math.min(rect.width, rect.height) / 2
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  const text = resolveDisplayText(pen)

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fillStyle = pen.background || '#0f9f8f'
  ctx.fill()

  if ((pen.lineWidth ?? pen.borderWidth ?? 0) > 0) {
    ctx.strokeStyle = pen.color || '#0f9f8f'
    ctx.lineWidth = Math.max(1, Number(pen.lineWidth || pen.borderWidth || 1) * scale)
    ctx.stroke()
  }

  ctx.fillStyle = pen.textColor || '#ffffff'
  ctx.font = buildFont(pen, Math.min(rect.width, rect.height) * 0.48)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cx, cy)
  ctx.restore()
}

function drawScadaValue(ctx: CanvasRenderingContext2D, pen: Pen & Record<string, any>) {
  const rect = pen.calculative?.worldRect
  if (!rect) return

  const rawValue = pen.value ?? pen.text
  const text = formatValue(rawValue, pen.scadaPrecision, pen.scadaEmptyText || '--')

  ctx.save()
  ctx.fillStyle = pen.textColor || '#0f172a'
  ctx.font = buildFont(pen, rect.height * 0.62)
  ctx.textAlign = pen.textAlign || 'right'
  ctx.textBaseline = pen.textBaseline || 'middle'
  ctx.fillText(text, getTextX(rect, pen.textAlign), getTextY(rect, pen.textBaseline))
  ctx.restore()
}

function drawScadaDivider(ctx: CanvasRenderingContext2D, pen: Pen & Record<string, any>) {
  const rect = pen.calculative?.worldRect
  if (!rect) return

  const scale = getScale(pen)
  const vertical = pen.scadaDirection === 'vertical'
  const x1 = vertical ? rect.x + rect.width / 2 : rect.x
  const y1 = vertical ? rect.y : rect.y + rect.height / 2
  const x2 = vertical ? rect.x + rect.width / 2 : rect.x + rect.width
  const y2 = vertical ? rect.y + rect.height : rect.y + rect.height / 2

  ctx.save()
  ctx.strokeStyle = pen.color || '#e2e8f0'
  ctx.lineWidth = Math.max(1, Number(pen.lineWidth || pen.borderWidth || 1) * scale)
  if (Array.isArray(pen.lineDash)) {
    ctx.setLineDash(pen.lineDash.map((item: number) => item * scale))
  }
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.restore()
}

function resolveDisplayText(pen: Record<string, any>) {
  const value = pen.scadaText ?? pen.value ?? pen.text
  if (value === undefined || value === null || value === '') return ''
  return String(value)
}

function formatValue(value: unknown, precision: unknown, emptyText: string) {
  if (value === undefined || value === null || value === '') return emptyText
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value)
  if (precision === undefined || precision === null || precision === '') return String(value)
  return num.toFixed(Math.max(0, Math.min(6, Number(precision) || 0)))
}

function buildFont(pen: Record<string, any>, fallbackSize: number) {
  const size = Math.max(8, Number(pen.fontSize || fallbackSize || 16))
  const weight = pen.fontWeight || 700
  const family = pen.fontFamily || 'Arial'
  return `${weight} ${size}px ${family}`
}

function measureTextWithSpacing(ctx: CanvasRenderingContext2D, text: string, spacing: number) {
  if (!text) return 0
  return (
    Array.from(text).reduce((total, char) => total + ctx.measureText(char).width, 0) +
    Math.max(0, text.length - 1) * spacing
  )
}

function fillTextWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
) {
  let offset = 0
  Array.from(text).forEach((char) => {
    ctx.fillText(char, x + offset, y)
    offset += ctx.measureText(char).width + spacing
  })
}

function getTextX(rect: { x: number; width: number }, align?: string) {
  if (align === 'left') return rect.x
  if (align === 'center') return rect.x + rect.width / 2
  return rect.x + rect.width
}

function getTextY(rect: { y: number; height: number }, baseline?: string) {
  if (baseline === 'top') return rect.y
  if (baseline === 'bottom') return rect.y + rect.height
  return rect.y + rect.height / 2
}

function getScale(pen: Pen & Record<string, any>) {
  return pen.calculative?.canvas?.store?.data?.scale || 1
}

function resolveRadius(pen: Record<string, any>, width: number, height: number, scale: number) {
  const rawRadius = Number(pen.borderRadius ?? pen.scadaRadius ?? 8)
  const radius =
    rawRadius > 0 && rawRadius <= 1 ? Math.min(width, height) * rawRadius : rawRadius * scale
  return Math.min(radius, width / 2, height / 2)
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
