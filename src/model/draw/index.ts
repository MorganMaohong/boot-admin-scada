import type { BaseEntity, OptionVo } from '@/model'
import type { ProjectMonitorCategory, ProjectMonitorCategoryVo } from '@/model/category'

export interface ProjectMonitorDraw extends BaseEntity {
  name: string
  projectUid: string
  categoryUid: string
  data: string
  visible: boolean
  def: boolean
  title: string
  width: number
  height: number
}

export interface ProjectMonitorDrawForm extends ProjectMonitorDraw {
  categoryOptions: OptionVo[]
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
  draw: ProjectMonitorDraw
}
