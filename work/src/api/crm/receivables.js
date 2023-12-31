import request from '@/utils/request'

/**
 * 新建回款
 * @param {*} data
 */
export function crmReceivablesSaveAPI(data) {
  const url = data.entity && data.entity.receivablesId ? 'update' : 'add'
  return request({
    url: 'crmReceivables/' + url,
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 回款列表
 * @param {*} data
 */
export function crmReceivablesIndexAPI(data) {
  return request({
    url: 'crmReceivables/queryPageList',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}



export function crmReceivablesUpdateReturnTimeAPI(data) {
  return request({
    url: 'crmReceivables/updateReturnTime',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}
/**
 * 删除
 * @param {*} data
 *
 */
export function crmReceivablesDeleteAPI(data) {
  return request({
    url: 'crmReceivables/deleteByIds',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}


/**
 * 回款下项目申请
 * @param {*} data
 */
export function crmReceivablesQueryProjectAPI(data) {
  return request({
    url: 'crmReceivables/queryProjectApplyByReceivablesId',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 回款详情
 * @param {*} data
 */
export function crmReceivablesReadAPI(data) {
  return request({
    url: `crmReceivables/queryById/${data.id}`,
    method: 'post'
  })
}

/**
 * 回款计划删除
 * @param {*} data
 */
export function crmReceivablesPlanDeleteAPI(data) {
  return request({
    url: 'crmReceivablesPlan/deleteByIds',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 回款列表
 * @param {*} data
 *
 */
export function crmReceivablesFileListAPI(data) {
  return request({
    url: 'crmReceivables/queryFileList',
    method: 'post',
    data: data
  })
}

/**
 * tab数量
 * @param {*} data
 *
 */
export function crmReceivablesNumAPI(data) {
  return request({
    url: 'crmReceivables/num',
    method: 'post',
    data: data
  })
}

/**
 * 导出
 * @param {*} data
 */
export function crmReceivablesExcelExportAPI(data) {
  return request({
    url: 'crmReceivables/batchExportExcel',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    responseType: 'blob',
    timeout: 60000
  })
}

export function crmReceivablesExcelAllExportAPI(data) {
  return request({
    url: 'crmReceivables/allExportExcel',
    method: 'post',
    data: data,
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 转移
 * @param {*} data
 */
export function crmReceivablesTransferAPI(data) {
  return request({
    url: 'crmReceivables/changeOwnerUser',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 回款计划创建
 * @param {*} data
 */
export function crmReceivablesPlanSaveAPI(data) {
  const url = data.entity && data.entity.receivablesPlanId ? 'update' : 'add'
  return request({
    url: 'crmReceivablesPlan/' + url,
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}
// 团队操作
/**
 * 团队成员创建
 * @param {*} data
 */
export function crmReceivablesSettingTeamSaveAPI(data) {
  return request({
    url: 'crmReceivables/addMembers',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

export function crmReceivablesSettingTeamDeleteAPI(data) {
  return request({
    url: 'crmReceivables/deleteMembers',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

export function crmReceivablesTeamMembersAPI(data) {
  return request({
    url: `crmReceivables/getMembers/${data.id}`,
    method: 'post'
  })
}

export function crmReceivablesUpdateMembersAPI(data) {
  return request({
    url: 'crmReceivables/updateMembers',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 退出团队
 * @param {*} data
 */
export function crmReceivablesExitTeamAPI(data) {
  return request({
    url: `crmReceivables/exitTeam/${data.id}`,
    method: 'post'
  })
}

/**
 * 查询回款下其他关联合同
 * @param {*} data
 */
export function crmContractQueryInvoiceAPI(data) {
  return request({
    url: 'crmReceivables/queryInvoiceByReceivablesId',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}
