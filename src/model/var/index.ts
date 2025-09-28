import type { BaseEntity, BaseEntityLd, OptionVo, PageQuery } from "@/model"

export interface Var extends BaseEntityLd {
  name: string
  svdUid: string
  adsOffset: string
  svdUid2?: string
  adsOffset2?: string
  value?: string
  dataTypeUid: string
  dataAccuracy: string
  linearCalcEnable?: boolean
  slope?: string
  intercept?: string
  linerOutDt?: string
  rwType: string
  unit?: string
  groupUid: string
  comportUid: string
  storeType: string
  effectiveRangeEnable?: boolean
  maxRangeValue?: string
  minRangeValue?: string
  remark?: string
  copyIncrement?: number
}

export interface VarComportGroupData {
  defaultGroupUid?: string
  groupList?: VarComportGroupVo[]
}

export interface VarComportGroupVo {
  name?: string
  type?: string
  uid?: string
}

export interface VarQuery extends PageQuery {
  gatewayUid?: string
  groupUid?: string
  name?: string
  dataTypeUid?: string
  comportUid?: string
}

export interface VarVo extends Var {
  address?: string
  dataTypeName?: string
  rwName?: string
  storeName?: string
  controlValue?: string
}

export interface VarQueryData {
  storeOptions?: OptionVo[]
  comportOptions?: OptionVo[]
  dataTypeOptions?: OptionVo[]
}

export interface VarForm extends Var {
  varAddressOptionMap?: Record<string, OptionVo>
  svd2Options?: Record<string, OptionVo>
  dataTypeOptions?: Record<string, OptionVo>
  linerOutOptions?: OptionVo[]
  rwOptions?: OptionVo[]
  dataAccuracyOptions?: OptionVo[]
  comportOptions?: OptionVo[]
  storeOptions?: OptionVo[]
  periodicForm?: VarPeriodicForm
  conditionalForm?: VarConditionalForm
  transformForm?: VarTransformForm
}

export interface GatewayBase extends BaseEntity {
  gatewaySn?: string
  gatewayUid?: string
}

export interface VarStoreBase extends GatewayBase {
  varUid?: string
  dataTypeUid?: string
}

export interface VarPeriodic {
  periodicTime?: number
  periodicTimestamp?: number
  lastTimestamp?: number
  timeunit?: string
}

export interface VarPeriodicForm extends VarPeriodic {
  varName?: string
  timeunitName?: string
  options: OptionVo[]
}

export interface VarConditional {
  cond?: string
  y?: string
  z?: string
}

export interface VarConditionalForm {
  varName?: string
  condName?: string
  options: OptionVo[]
}

export interface VarTransform {
  fluctuationCap?: string
  fluctuationLower?: string
}

export interface VarTransformForm {
  varName?: string
}

export interface UpdateVarByGroupForm {
  varUidList?: string[]
  sourceGroupUid?: string
  targetGroupUid?: string
}

export interface VarGroup extends GatewayBase {
  name?: string
  def?: boolean
  sort?: number
}
