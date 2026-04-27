import type { BaseEntity } from '@/model'

export interface MonitorImageCategoryBase extends BaseEntity {
  name: string
}

export interface MonitorImageBase extends BaseEntity {
  url: string
  filename: string
  originUrl?: string
  displayUrl?: string
  thumbUrl?: string
  size?: number
  width?: number
  height?: number
  contentType?: string
}

export interface SystemMonitorImageCategory extends MonitorImageCategoryBase {}

export interface SystemMonitorImage extends MonitorImageBase {}

export interface ProjectMonitorImageCategory extends MonitorImageCategoryBase {
  projectUid: string
}

export interface ProjectMonitorImage extends MonitorImageBase {}

export interface ProjectMonitorImageVo {
  list: ProjectMonitorImageCategory[]
  defaultCategoryUid: string
}

export interface SystemMonitorImageVo {
  list: SystemMonitorImageCategory[]
  defaultCategoryUid: string
}

export interface MonitorImageCategoryForm {
  name: string
  projectUid: string
  uid: string
}
