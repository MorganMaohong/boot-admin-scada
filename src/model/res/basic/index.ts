export interface BasicGraph {
  name: string
  icon: string
  id?: number | null
  data: BasicGraphData
}

export interface BasicGraphData {
  [key: string]: any
  text?: string
  width: number
  height: number
  name: string
}
