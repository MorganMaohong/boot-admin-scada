import type { ProjectMonitorDraw } from '@/model/draw'
import type { BaseEntity } from '@/model'

export interface ProjectMonitorCategory extends BaseEntity {
  name: string
  projectUid: string
}

export interface ProjectMonitorCategoryForm extends ProjectMonitorCategory {

}

export interface ProjectMonitorCategoryVo extends ProjectMonitorCategory {
  drawList: ProjectMonitorDraw[]
}
