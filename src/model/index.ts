import type { Meta2dData } from '@meta2d/core'

export interface OptionKeyVo {
  label: string
  value: any
  key: any
}

export interface Payload {
  sn: string
  data: object
  timestamp: number
}

export interface BaseEntity {
  id: number
  createTime: string
  updateTime: string
  uid: string
}

export interface BaseEntityLd {
  id: number
  createTime?: string
  updateTime?: string
  uid: string
  delete?: boolean
}

export interface BaseLink {
  id: number
}

export interface PageQuery {
  currentPage: number
  pageSize: number
}

export interface PageVo<T, E> {
  currentPage: number
  pageSize: number
  count: number
  list: T[]
  extraData: E
}

export interface TreeOptionVo {
  /**
   * 子集
   */
  children?: TreeOptionVo[]
  /**
   * 标题
   */
  label?: string
  /**
   * 内容
   */
  value?: any

  [property: string]: any
}

export interface OptionVo {
  /**
   * 标题
   */
  label?: string
  /**
   * 内容
   */
  value?: any

  [property: string]: any
}

export const BASE_DRAW: Meta2dData = {
  x: 0,
  y: 0,
  scale: 1,
  // width: 0,
  // height: 0,
  pens: [],
  origin: {
    x: 0,
    y: 0,
  },
  center: {
    x: 0,
    y: 0,
  },
  background:"#ffffff",
  paths: {},
  version: '1.0.79',
  dataPoints: [],
}
