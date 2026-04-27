import type { BaseEntity } from '@/model'

export interface ProjectMonitorLayer extends BaseEntity {
  name: string
  drawUid: string
  locked: boolean
  visible: boolean
  pens: string
  projectUid: string
  defaultLayer: boolean
  sort: number
}

export interface ProjectMonitorLayerForm extends ProjectMonitorLayer {}
