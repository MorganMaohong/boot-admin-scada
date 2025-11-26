import type { ProjectMonitorDraw } from '@/model/draw'
import type { BaseEntity, OptionVo } from '@/model'
import type { ProjectMonitorCategory, ProjectMonitorCategoryVo } from '@/model/category'
import type { ProjectMonitorDrawModalCategoryVo } from '@/model/modalCategory'

export interface ProjectMonitorDrawModal extends ProjectMonitorDraw {
  width: number
  height: number
  title: string
}

export interface ProjectMonitorDrawModalForm extends ProjectMonitorDrawModal {
  categoryOptions: OptionVo[]
  jsonData: string
}

export interface ProjectMonitorModalVo {
  categoryVoList: ProjectMonitorDrawModalCategoryVo[]
}
