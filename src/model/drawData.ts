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
