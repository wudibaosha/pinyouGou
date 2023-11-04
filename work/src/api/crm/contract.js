import request from '@/utils/request'

/**
 * 新建合同
 * @param {*} data
 */
export function crmContractSaveAPI(data) {
  const url = data.entity && data.entity.contractId ? 'update' : 'add'
  return request({
    url: 'crmContract/' + url,
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 根据客户id查询合同编号
 * @param {*} data
 */
export function crmContractQueryNumAPI(data) {
  return request({
    url: 'crmContract/queryCrmContractNum',
    method: 'post',
    data: data
  })
}

/**
 * 列表
 * @param {*} data
 */
export function crmContractIndexAPI(data) {
  return request({
    url: 'crmContract/queryPageList',
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
 */
export function crmContractDeleteAPI(data) {
  return request({
    url: 'crmContract/deleteByIds',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 详情
 * @param {*} data
 */
export function crmContractReadAPI(data) {
  return request({
    url: `crmContract/queryById/${data.contractId}`,
    method: 'post'
  })
}

/**
 * 合同相关产品
 * @param {*} data
 * contract_id
 */
export function crmContractProductAPI(data) {
  return request({
    url: 'crmContract/queryProductListByContractId',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 转移
 * @param {*} data
 */
export function crmContractTransferAPI(data) {
  return request({
    url: 'crmContract/changeOwnerUser',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}


export function fileAPI(data) {
  return request({
    url: 'crmContract/relateFile/'+data.id+'/'+data.batchId,
    method: 'post'
  })
}

/**
 * 合同下回款
 * @param {*} data
 */
export function crmContractQueryReceivablesAPI(data) {
  return request({
    url: 'crmContract/qureyReceivablesListByContractId',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 合同下回款计划
 * @param {*} data
 */
export function crmContractQueryReceivablesPlanAPI(data) {
  return request({
    url: 'crmContract/queryReceivablesPlanListByContractId',
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
export function crmContractSettingTeamSaveAPI(data) {
  return request({
    url: 'crmContract/addMembers',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

export function crmContractSettingTeamDeleteAPI(data) {
  return request({
    url: 'crmContract/deleteMembers',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

export function crmContractTeamMembersAPI(data) {
  return request({
    url: `crmContract/getMembers/${data.id}`,
    method: 'post'
  })
}

export function crmContractUpdateMembersAPI(data) {
  return request({
    url: 'crmContract/updateMembers',
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
export function crmContractExitTeamAPI(data) {
  return request({
    url: `crmContract/exitTeam/${data.id}`,
    method: 'post'
  })
}

/**
 * 新建回款查询回款计划
 * @param {*} data
 */
export function crmQueryReceivablesPlansByContractIdAPI(data) {
  return request({
    url: 'crmContract/queryReceivablesPlansByContractId',
    method: 'post',
    data: data
  })
}

/**
 * 作废
 * @param {*} data
 */
export function crmContractCancelAPI(data) {
  return request({
    url: 'crmContract/contractDiscard',
    method: 'post',
    data: data
  })
}

/**
 * 附件列表
 * @param {*} data
 *
 */
export function crmContractFileListAPI(data) {
  return request({
    url: 'crmContract/queryFileList',
    method: 'post',
    data: data
  })
}

/**
 * tab数量
 * @param {*} data
 *
 */
export function crmContractNumAPI(data) {
  return request({
    url: 'crmContract/num',
    method: 'post',
    data: data
  })
}

/**
 * 合同导出
 * @param {*} data
 */
export function crmContractExcelExportAPI(data) {
  return request({
    url: 'crmContract/batchExportExcel',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    responseType: 'blob',
    timeout: 60000
  })
}

export function crmContractExcelAllExportAPI(data) {
  return request({
    url: 'crmContract/allExportExcel',
    method: 'post',
    data: data,
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 回访
 * @param {*} data
 */
export function crmContractQueryVisitAPI(data) {
  return request({
    url: 'crmContract/queryReturnVisit',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 产品下合同
 * @param {*} data
 */
export function crmContractQueryListByProductIdAPI(data) {
  return request({
    url: 'crmContract/queryListByProductId',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 分页查询发票
 * @param {*} data
 */
export function crmContractInvoiceAPI(data) {
  return request({
    url: 'crmContract/queryInvoiceByContractId',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 查询合同下其他关联合同
 * @param {*} data
 */
export function crmContractQueryOtherContractAPI(data) {
  return request({
    url: 'crmContract/queryContractListByContractId',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 根据发票id给对应发票添加标签信息
 * @param {*} data
 */
export function crmContractUpdateTag(data) {
  return request({
    url: 'crmContract/updateTagById',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 根据合同id删除标签信息
 * @param {*} data
 */
export function crmContractDeleteTag(data) {
  return request({
    url: 'crmContract/deleteTagById',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}



/**
 * 根据合同id更新项目提前启动金额
 * @param {*} data
 */
export function crmContractUpdateStartMoneyAPI(data) {
  return request({
    url: 'crmContract/updateStartMoney',
    method: 'post',
    data: data,
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}



export function crmContractgetPriceRangeAPI(data) {
  return request({
    url: 'crmContract/getPriceRange',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}


export function crmContractUpdatePriceRangeAPI(data) {
  return request({
    url: 'crmContract/updatePriceRange',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}


export function crmContractBatchUpdatePriceRangeAPI(data) {
  return request({
    url: 'crmContract/batchUpdatePriceRange',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 合同相关回款
 * @param {*} data
 */
export function crmContractReceivablesAPI(data) {
  return request({
    url: 'crmContract/queryReceivables',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}