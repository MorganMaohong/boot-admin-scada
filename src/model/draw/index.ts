import type { BaseEntity, OptionVo } from '@/model'
import type { ProjectMonitorCategory, ProjectMonitorCategoryVo } from '@/model/category'

export interface ProjectMonitorDraw extends BaseEntity {
  name: string
  projectUid: string
  categoryUid: string
  data: string
  visible: boolean
  def: boolean
}

export interface ProjectMonitorDrawForm extends ProjectMonitorDraw {
  categoryOptions: OptionVo[]
  width: number
  height: number
  jsonData: string
}

export interface ProjectMonitorSaveForm {
  data: string
}

export interface ProjectMonitorVo {
  defDraw: ProjectMonitorDraw
  defCategory: ProjectMonitorCategory
  categoryVoList: ProjectMonitorCategoryVo[]
}

export interface ProjectMonitorDrawDisplay {
  draw: ProjectMonitorDraw
  topics: string[]
}

export interface ProjectQuery {
  keyword: string
}

export interface GlobalModalParams {
  show: boolean
  width: number
  height: number
  title?: string
}
