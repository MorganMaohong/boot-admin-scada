const apiPrefix = {
  monitorDraw: '/project/monitorDraw',
  monitorCategory: '/project/monitorCategory',
  variable: '/comport/variable',
  file: '/file',
  monitorImage: '/project/monitorImage',
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
}

export const monitorCategoryApi = {
  add: { url: `${apiPrefix.monitorCategory}/add`, permission: '' },
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
