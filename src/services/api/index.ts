const apiPrefix = {
  monitorDraw: '/project/monitorDraw',
  monitorDrawModal: '/project/monitorDrawModal',
  monitorCategory: '/project/monitorCategory',
  monitorDrawModalCategory: '/project/monitorDrawModalCategory',
  variable: '/comport/variable',
  file: '/file',
  monitorImage: '/project/monitorImage',
  monitorLayer: '/project/monitorDraw/layer',
  project: '/project',
}

export const monitorDrawApi = {
  add: { url: `${apiPrefix.monitorDraw}/add`, permission: '' },
  update: { url: `${apiPrefix.monitorDraw}/update`, permission: '' },
  save: { url: `${apiPrefix.monitorDraw}/save`, permission: '' },
  delete: { url: `${apiPrefix.monitorDraw}/delete`, permission: '' },
  form: { url: `${apiPrefix.monitorDraw}/form`, permission: '' },
  select: { url: `${apiPrefix.monitorDraw}/select`, permission: '' },
  display: { url: `${apiPrefix.monitorDraw}/display`, permission: '' },
  options: { url: `${apiPrefix.monitorDraw}/options`, permission: '' },
  getAllGatewayVar: { url: `${apiPrefix.monitorDraw}/getAllGatewayVar`, permission: '' },
  uploadFile: { url: `${apiPrefix.monitorDraw}/upload`, permission: '' },
  images: { url: `${apiPrefix.monitorDraw}/images`, permission: '' },
  selectByProjectUid: { url: `${apiPrefix.monitorDraw}/selectByProjectUid`, permission: '' },
  selectByUid: { url: `${apiPrefix.monitorDraw}/selectByUid`, permission: '' },
  selectProject: { url: `${apiPrefix.monitorDraw}/selectProject`, permission: '' },

  addModal: { url: `${apiPrefix.monitorDraw}/addModal`, permission: '' },
  updateModal: { url: `${apiPrefix.monitorDraw}/updateModal`, permission: '' },
  formModal: { url: `${apiPrefix.monitorDraw}/modalForm`, permission: '' },
  selectModal: { url: `${apiPrefix.monitorDraw}/selectModal`, permission: '' },
  modalOptions: { url: `${apiPrefix.monitorDraw}/modalOptions`, permission: '' },
}

export const monitorCategoryApi = {
  add: { url: `${apiPrefix.monitorCategory}/add`, permission: '' },
  addModal: { url: `${apiPrefix.monitorCategory}/addModal`, permission: '' },
  update: { url: `${apiPrefix.monitorCategory}/update`, permission: '' },
  delete: { url: `${apiPrefix.monitorCategory}/delete`, permission: '' },
  form: { url: `${apiPrefix.monitorCategory}/form`, permission: '' },
}

export const variableApi = {
  selectGroup: {
    url: `${apiPrefix.variable}/selectGroup`,
    permission: 'comport:variable:selectGroup:gatewayUid',
  },
  form: { url: `${apiPrefix.variable}/form`, permission: '' },
  add: { url: `${apiPrefix.variable}/add`, permission: 'comport:variable:add' },
  update: { url: `${apiPrefix.variable}/update`, permission: 'comport:variable:update' },
  copy: { url: `${apiPrefix.variable}/copy`, permission: 'comport:variable:copy:uid' },
  delete: { url: `${apiPrefix.variable}/delete`, permission: 'comport:variable:delete:uid' },
  deletePatch: { url: `${apiPrefix.variable}/delete`, permission: 'comport:variable:delete:patch' },
  write: { url: `${apiPrefix.variable}/write`, permission: 'comport:variable:write:varUid:value' },
  uploadVarExcel: {
    url: `${apiPrefix.variable}/uploadVarExcel`,
    permission: 'comport:variable:uploadVarExcel:gatewayUid:groupUid',
  },
  exportVarExcel: {
    url: `${apiPrefix.variable}/exportVarExcel`,
    permission: 'comport:variable:exportVarExcel:gatewayUid',
  },
  downloadTemplate: {
    url: `${apiPrefix.variable}/downloadTemplate`,
    permission: 'comport:variable:downloadTemplate',
  },
  select: { url: `${apiPrefix.variable}/select`, permission: 'comport:variable:select' },
  selectVarCacheData: { url: `${apiPrefix.variable}/selectVarCacheData`, permission: '' },
  selectWxMini: {
    url: `${apiPrefix.variable}/selectWxMini`,
    permission: 'comport:variable:selectWxMini',
  },
  varInfo: { url: `${apiPrefix.variable}/varInfo`, permission: 'comport:variable:varInfo:uid' },
}

export const fileApi = {
  uploadFile: { url: `${apiPrefix.file}/upload`, permission: '' },
}

export const projectApi = {
  selectList: { url: `${apiPrefix.project}/selectList`, permission: 'project:selectList' },
  select: { url: `${apiPrefix.project}/select`, permission: 'project:select' },
  info: { url: `${apiPrefix.project}/info`, permission: 'project:info:projectUid' },
  form: { url: `${apiPrefix.project}/form`, permission: '' },
  update: { url: `${apiPrefix.project}/update`, permission: 'project:update' },
  add: { url: `${apiPrefix.project}/add`, permission: 'project:add' },
  delete: { url: `${apiPrefix.project}/delete`, permission: 'project:delete:uid' },
  unBindGateway: {
    url: `${apiPrefix.project}/unBindGateway`,
    permission: 'project:unBindGateway:gatewayUid',
  },
  bindGateway: { url: `${apiPrefix.project}/bindGateway`, permission: 'project:bindGateway' },
  gatewayInfo: {
    url: `${apiPrefix.project}/gatewayInfo`,
    permission: 'project:gatewayInfo:projectUid',
  },
  selectAll: {
    url: `${apiPrefix.project}/selectAll`,
    permission: 'project:selectAll:projectUid',
  },
  getProjectName: {
    url: `${apiPrefix.project}/getProjectName`,
    permission: '',
  },
}

export const monitorImageApi = {
  selectSystemMonitorImageCategory: {
    url: `${apiPrefix.monitorImage}/selectSystemMonitorImageCategory`,
    permission: '',
  },
  selectSystemMonitorImage: {
    url: `${apiPrefix.monitorImage}/selectSystemMonitorImage`,
    permission: '',
  },
  selectProjectMonitorImageCategory: {
    url: `${apiPrefix.monitorImage}/selectProjectMonitorImageCategory`,
    permission: '',
  },
  addProjectMonitorImageCategory: {
    url: `${apiPrefix.monitorImage}/addProjectMonitorImageCategory`,
    permission: '',
  },
  updateProjectMonitorImageCategory: {
    url: `${apiPrefix.monitorImage}/updateProjectMonitorImageCategory`,
    permission: '',
  },
  deleteProjectMonitorImageCategory: {
    url: `${apiPrefix.monitorImage}/deleteProjectMonitorImageCategory`,
    permission: '',
  },
  uploadProjectMonitorImage: {
    url: `${apiPrefix.monitorImage}/uploadProjectMonitorImage`,
    permission: '',
  },
  deleteProjectMonitorImage: {
    url: `${apiPrefix.monitorImage}/deleteProjectMonitorImage`,
    permission: '',
  },
  selectProjectMonitorImage: {
    url: `${apiPrefix.monitorImage}/selectProjectMonitorImage`,
    permission: '',
  },
  addSystemMonitorImageCategory: {
    url: `${apiPrefix.monitorImage}/addSystemMonitorImageCategory`,
    permission: '',
  },
  updateSystemMonitorImageCategory: {
    url: `${apiPrefix.monitorImage}/updateSystemMonitorImageCategory`,
    permission: '',
  },
  deleteSystemMonitorImageCategory: {
    url: `${apiPrefix.monitorImage}/deleteSystemMonitorImageCategory`,
    permission: '',
  },
  uploadSystemMonitorImage: {
    url: `${apiPrefix.monitorImage}/uploadSystemMonitorImage`,
    permission: '',
  },
  deleteSystemMonitorImage: {
    url: `${apiPrefix.monitorImage}/deleteSystemMonitorImage`,
    permission: '',
  },
}

export const monitorLayerApi = {
  add: {
    url: `${apiPrefix.monitorLayer}/add`,
    permission: '',
  },
  copy: {
    url: `${apiPrefix.monitorLayer}/copy`,
    permission: '',
  },
  delete: {
    url: `${apiPrefix.monitorLayer}/delete`,
    permission: '',
  },
  update: {
    url: `${apiPrefix.monitorLayer}/update`,
    permission: '',
  },
  select: {
    url: `${apiPrefix.monitorLayer}/select`,
    permission: '',
  },
  selectDefault: {
    url: `${apiPrefix.monitorLayer}/selectDefault`,
    permission: '',
  },
  changeDefaultLayer: {
    url: `${apiPrefix.monitorLayer}/changeDefaultLayer`,
    permission: '',
  },
  sort: {
    url: `${apiPrefix.monitorLayer}/sort`,
    permission: '',
  },
}

export const monitorDrawModalApi = {
  add: { url: `${apiPrefix.monitorDrawModal}/add`, permission: '' },
  update: { url: `${apiPrefix.monitorDrawModal}/update`, permission: '' },
  delete: { url: `${apiPrefix.monitorDrawModal}/delete`, permission: '' },
  form: { url: `${apiPrefix.monitorDrawModal}/form`, permission: '' },
  select: { url: `${apiPrefix.monitorDrawModal}/select`, permission: '' },
  selectByUid: { url: `${apiPrefix.monitorDrawModal}/selectByUid`, permission: '' },
}

export const monitorDrawModalCategoryApi = {
  add: { url: `${apiPrefix.monitorDrawModalCategory}/add`, permission: '' },
  update: { url: `${apiPrefix.monitorDrawModalCategory}/update`, permission: '' },
  delete: { url: `${apiPrefix.monitorDrawModalCategory}/delete`, permission: '' },
  form: { url: `${apiPrefix.monitorDrawModalCategory}/form`, permission: '' },
}
