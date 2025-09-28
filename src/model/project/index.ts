import type { BaseEntity, BaseEntityLd, PageQuery, TreeOptionVo } from '@/model'

/**
 * ProjectListQuery，项目分页查询条件
 */
export interface ProjectListQuery extends PageQuery {
  groupUid?: string
  name?: string
}

/**
 * ProjectListVo，项目分页查询list
 */
export interface ProjectListVo {
  createColumn?: string
  /**
   * 组uid
   */
  groupUid: string
  /**
   * Id
   */
  id?: number
  /**
   * 名称
   */
  name: string
  /**
   * 备注
   */
  remark?: string
  /**
   * 唯一uid 操作更新等操作需要
   */
  uid?: string
  updateColumn?: string

  [property: string]: any
}

/**
 * ProjectListQueryData，项目分页查询数据
 */
export interface ProjectListQueryData {
  treeGroupOptions?: TreeOptionVo[]

  [property: string]: any
}

/**
 * ProjectSponsorForm
 */
export interface ProjectSponsorForm {
  projectUid?: string
  sourceDeptUidList?: string[]
  sourcePostUidList?: string[]
  sourceRoleUidList?: string[]
  sourceUserUidList?: string[]

  [property: string]: any
}

export interface ProjectDispatchForm {
  projectUid?: string
  sourceUidList?: string[]
  deptList?: any[]
  deptUserMap?: Record<string, any[]>

  [property: string]: any
}

/**
 * ProjectOrderFlowsForm
 */
export interface ProjectOrderFlowsForm {
  edges?: string
  nodes?: string
  projectUid?: string

  [property: string]: any
}

/**
 * ProjectReviewTypeForm
 */
export interface ProjectReviewTypeForm {
  nodeId?: string
  projectUid?: string
  reviewIsNullType?: string
  reviewPeople?: string
  reviewType?: string

  [property: string]: any
}

/**
 * ProjectReviewForm
 */
export interface ProjectReviewForm {
  nodeId?: string
  projectUid?: string
  sourceUserUidList?: string[]

  [property: string]: any
}

export interface Project extends BaseEntityLd {
  name?: string
  remark?: string
  groupUid?: string
}

export interface ProjectVo {
  defaultValue?: string
  tree?: ProjectTree[]
}

export interface ProjectQuery {
  keyword?: string
}

export interface ProjectForm extends Project {
  groupTreeOptions?: TreeOptionVo[]
}

export interface ProjectTree extends ProjectGroupTempVo {
  children?: ProjectTree[]
}

export interface ProjectGroupTempVo {
  label?: string
  value?: string
  group?: boolean
  parentUid?: string
  createTime?: string
  updateTime?: string
}

export interface ProjectGroup extends BaseEntity {
  name?: string
  sort?: number
  parentUid?: string
}

export interface ProjectGroupForm extends ProjectGroup {
  treeOptions?: TreeOptionVo[]
}
