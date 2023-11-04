import request from '@/utils/request'
/**
 * 活动创建
 * @param {*} data
 */
export function crmUnitSaveAPI(data) {
    return request({
      url: 'crmUnit/add',
      method: 'post',
      data: data,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    })
  }

  export function crmInvoiceInfoExcelAllExportAPI(data) {
    return request({
      url: 'crmUnit/allExportExcel',
      method: 'post',
      data: data,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      },
      responseType: 'blob'
    })
  }

  export function crmUnitDeleteAPI(data) {
    return request({
      url: 'crmInvoice/deleteInvoiceInfos',
      method: 'post',
      data: data,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    })
  }
  

  export function crmUnitUpdateAPI(data) {
    return request({
      url: 'crmInvoice/updateInvoiceInfo',
      method: 'post',
      data: data,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    })
  }

  export function crmUnitIndexAPI(data) {
    return request({
      // url: 'crmUnit/queryPageList',
      url:'crmCustomer/queryInvoiceInfo',
      method: 'post',
      data: data,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    })
  }
  /**
 * 删除发票抬头信息
 * @param {*} data
 */
export function crmInvoiceDeleteInvoiceInfoAPI(data) {
  return request({
    url: 'crmInvoice/deleteInvoiceInfo',
    method: 'post',
    data: data
  })
}

  export function crmUnitExcelExportAPI(data) {
    return request({
      url: 'crmUnit/batchExportExcel',
      method: 'post',
      data: data,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      },
      responseType: 'blob'
    })
  }

  

  export function crmUnitDownloadExcelAPI(data) {
    return request({
      url: 'crmUnit/downloadExcel',
      method: 'post',
      data: data,
      responseType: 'blob'
    })
  }
  
  export function crmUnitExcelImportAPI(data) {
    var param = new FormData()
    Object.keys(data).forEach(key => {
      param.append(key, data[key])
    })
    return request({
      url: 'crmUnit/uploadExcel',
      method: 'post',
      data: param,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  