import request from '@/utils/request'

/**
 * 审批类型前台排序
 * @param {*} data
 */
export function oaAllExamineCategorySortAPI(data) {
  return request({
    url: 'oaExamineCategory/saveOrUpdateOaExamineSort',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 审批新建
 * @param {*} data
 */
export function oaExamineSaveAndUpdateAPI(data) {
  return request({
    url: 'oaExamine/setOaExamine',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 我发起的审批
 * @param {*} data
 */
export function oaExamineMyCreateIndexAPI(data) {
  return request({
    url: 'oaExamine/myInitiate',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 我审批的
 * @param {*} data
 */
export function oaExamineMyExamineIndexAPI(data) {
  return request({
    url: 'oaExamine/myOaExamine',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 审批删除
 * @param {*} data
 */
export function oaExamineDeleteAPI(data) {
  return request({
    url: 'oaExamine/deleteOaExamine',
    method: 'post',
    data: data
  })
}

/**
 * 审批详情
 * @param {*} examineId
 */
export function oaExamineReadAPI(examineId) {
  return request({
    url: `oaExamine/queryOaExamineInfo/${examineId}`,
    method: 'post'
  })
}

// 新建的审批流
/**
 * CRM合同回款创建时候的审批流
 * @param {*} data
 */
export function oaCreateExamineFlowAPI(data) {
  return request({
    url: 'oaExamine/queryExaminStep',
    method: 'post',
    data: data
  })
}

/**
 * 审批详情 基本信息
 * @param {*} data
 */
export function oaExamineGetFieldAPI(data) {
  return request({
    url: 'oaExamine/getField',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 办公下 审批的审批信息
 * @param {*} data
 */
export function oaExamineFlowStepListAPI(data) {
  return request({
    url: 'oaExamine/queryExamineRecordList',
    method: 'post',
    data: data
  })
}

/**
 * 审批导出
 * @param {*} data
 */
export function oaExamineExportAPI(data) {
  return request({
    url: 'oaExamine/export ',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    responseType: 'blob'
  })
}

/**
 * 客户下的oa审批
 * @param {*} data
 */
export function oaExamineCustomerIndexAPI(data) {
  return request({
    url: 'oaExamine/myInitiateByCusomerId',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}
/**
   * HYL
   * 根据合同id查找oa_examine表中关联的审批单
   */
export function getContractTwoMoneyAPI(data) {
  return request({
    url: 'oaExamine/getContractTwoMoney',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}