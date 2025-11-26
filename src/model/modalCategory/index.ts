import type { BaseEntity } from '@/model'
import type { ProjectMonitorDrawModal } from '@/model/modal'

export interface ProjectMonitorDrawModalCategory extends BaseEntity {
  name: string
  projectUid: string
}

export interface ProjectMonitorDrawModalCategoryForm extends ProjectMonitorDrawModalCategory {}

export interface ProjectMonitorDrawModalCategoryVo extends ProjectMonitorDrawModalCategory {
  drawList: ProjectMonitorDrawModal[]
}
