import request from '@/utils/request'

/**
 * 新建编辑
 * @param {*} data
 */
export function crmInvoiceSaveAPI(data) {
  const url = data.entity && data.entity.invoiceId ? 'update' : 'add'
  return request({
    url: 'crmInvoice/' + url,
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 编辑
 * @param {*} data
 */
export function crmInvoiceUpdateAPI(data) {
  return request({
    url: 'crmInvoice/update',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}


/**
 * 发票下项目申请
 * @param {*} data
 */
export function crmRInvoiceQueryProjectAPI(data) {
  return request({
    url: 'crmInvoice/queryProjectApplyByInvoiceId',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}


/**
 * 退票
 * @param {*} data
 */
export function crmInvoiceStatusUpdateReturnAPI(data) {
  return request({
    url: 'crmInvoice/updateInvoiceStatusReturn',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 标注已开发票
 * @param {*} data
 */
export function crmInvoiceStatusUpdateOpenAPI(data) {
  return request({
    url: 'crmInvoice/updateInvoiceStatusOpen',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 修改退票发票号码
 * @param {*} data
 */
export function crmUpdateInvoiceNumberAPI(data) {
  return request({
    url: 'crmInvoice/updateInvoiceNumber',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 发票作废
 * @param {*} data
 */
export function crmInvoiceDiscardAPI(data) {
  return request({
    url: 'crmInvoice/invoiceDiscard',
    method: 'post',
    data: data
  })
}

/**
 * 重置发票信息
 * @param {*} data
 */
export function crmInvoiceStatusResetAPI(data) {
  return request({
    url: 'crmInvoice/resetInvoiceStatus',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 填写报账信息
 * @param {*} data
 */
export function crmInvoiceRentMsgAPI(data) {
  return request({
    url: 'crmInvoice/updateRentStatus',
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
export function crmInvoiceIndexAPI(data) {
  return request({
    url: 'crmInvoice/queryPageList',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

// 发票详情
export function crmInvoiceReadAPI(invoiceId) {
  return request({
    url: `crmInvoice/queryById/${invoiceId}`,
    method: 'post'
  })
}

/**
 * 附件列表
 * @param {*} data
 *
 */
export function crmInvoiceFileListAPI(data) {
  return request({
    url: 'crmInvoice/queryFileList',
    method: 'post',
    data: data
  })
}

/**
 * 转移
 * @param {*} data
 */
export function crmInvoiceTransferAPI(data) {
  return request({
    url: 'crmInvoice/changeOwnerUser',
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
export function crmInvoiceDeleteIdsAPI(data) {
  return request({
    url: 'crmInvoice/deleteByIds',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 发票规则信息
 * @param {*} data
 */
export function crmInvoiceNumberConfigAPI(data) {
  return request({
    url: 'crmNumberSetting/queryInvoiceNumberSetting',
    method: 'post',
    data: data
  })
}

/**
 * 新建发票信息
 * @param {*} data
 */
export function crmInvoiceSaveInvoiceInfoAPI(data) {
  return request({
    url: 'crmInvoice/saveInvoiceInfo',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 编辑发票信息
 * @param {*} data
 */
export function crmInvoiceUpdateInvoiceInfoAPI(data) {
  return request({
    url: 'crmInvoice/updateInvoiceInfo',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      
    }
  })
}


export function test1(data) {
  return request({
    url: 'crmInvoice/test1',
    method: 'post',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      
    }
  });
}
// export function test2(data) {
//   return request({
//     url: 'crmInvoice/test1',
//     method: 'post',
//     data: data,
//     headers: {
//       'Content-Type': 'application/json;charset=UTF-8'
//     }
//   })
// }


/**
 * 删除发票信息
 * @param {*} data
 */
export function crmInvoiceDeleteInvoiceInfoAPI(data) {
  return request({
    url: 'crmInvoice/deleteInvoiceInfo',
    method: 'post',
    data: data
  })
}

/**
 * 全部导出
 * @param {*} data
 */
export function crmInvoiceExcelAllExportAPI(data) {
  return request({
    url: 'crmInvoice/allExportExcel',
    method: 'post',
    data: data,
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 查询发票下其他关联合同
 * @param {*} data
 */
export function crmInvoiceQueryOtherContractAPI(data) {
  return request({
    url: 'crmInvoice/queryContractListByInvoiceId',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 新建回款发票列表
 * @param {*} data
 */
export function crmReceivablesAPI(data) {
  if (data.searchList) {
    delete data['searchList']
  }
  return request({
    url: 'crmReceivables/queryInvoiceByContractId',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 导出选中
 * @param {*} data
 */
export function crmInvoiceExcelExportAPI(data) {
  return request({
    url: 'crmInvoice/batchExportExcel',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    responseType: 'blob'
  })
}

/**
 * 根据发票id给对应发票添加标签信息
 * @param {*} data
 */
export function crmInvoiceUpdateTag(data) {
  return request({
    url: 'crmInvoice/updateTagById',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 根据发票id删除标签信息
 * @param {*} data
 */
export function crmInvoiceDeleteTag(data) {
  return request({
    url: 'crmInvoice/deleteTagById',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}
