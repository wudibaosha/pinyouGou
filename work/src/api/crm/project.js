import request from '@/utils/request'
/**
 * 列表
 * @param {*} data
 */
export function crmProjectIndexAPI(data) {
    return request({
      url: 'crmProject/queryPageList',
      method: 'post',
      data: data,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    })
  }

  export function crmProjectBatchNumDownloadExcelAPI(data) {
    return request({
      url: 'crmProject/batchNum/downloadExcel',
      method: 'post',
      data: data,
      responseType: 'blob'
    })
  }

  

  /**
 * 详情
 * @param {*} projectId
 */
export function crmProjectReadAPI(projectId) {
  return request({
    url: `crmProject/queryById/${projectId}`,
    method: 'post'
  })
}


/**
 * 删除
 * @param {*} data
 *
 */
export function crmProjectDeleteAPI(data) {
  return request({
    url: 'crmProject/deleteByIds',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}


/**
 * 商机相关产品
 * @param {*} data
 */
export function crmProjectReceivablesAPI(data) {
  return request({
    url: 'crmProject/queryReceivables',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

  /**
 * 新建
 * @param {*} data
 */
export function crmProjectSaveAPI(data) {
  const url = data.entity && data.entity.projectId ? 'update' : 'add'
  return request({
    url: 'crmProject/' + url,
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}
  /**
 * 导入
 * @param {*} data
 *
 */
export function contractNumImportAPI(data) {
  var param = new FormData()
  Object.keys(data).forEach(key => {
    param.append(key, data[key])
  })
  return request({
    url: 'crmProject/batchNum/uploadExcel',
    method: 'post',
    data: param,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}



export function getStartMoneyByBatchNumAPI(data) {
  return request({
    url: 'crmProject/getStartMoneyByBatchNum/'+data.batchNum+'/'+data.deliverMoney,
    method: 'post',
  })
}

/**
 * 项目申请下回款
 * @param {*} data
 */
export function crmReceivablesQueryProjectApplyAPI(data) {
  return request({
    url: 'crmProject/queryReceivablesByProjectApplyId',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}


  /**
 * 导入
 * @param {*} data
 *
 */
  export function getFieldValueByIdAPI(param) {
    
    return request({
      url: 'crmProject/getFieldValueById',
      method: 'post',
      data: param,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    })
  }