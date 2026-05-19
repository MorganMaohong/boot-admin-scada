import { Meta2d } from '@meta2d/core'
import type { DisplayMessageApi } from '@/stores/displayMessage'

declare global {
  let meta2d: Meta2d
  let C2S: any
  interface Window {
    $message: DisplayMessageApi
  }
}
