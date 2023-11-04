import request from '@/utils/request'

/**
 * 列表
 * @param {*} data
 */
export function crmSettlementIndexAPI(data) {
  return request({
    url: 'crmSettlement/queryPageList',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 导出
 * @param {*} data
 * Contacts_id 联系人ID
 */
export function crmSettlementExcelExportAPI(data) {
  return request({
    url: 'crmSettlement/batchExportExcel',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    responseType: 'blob'
  })
}

export function crmSettlementExcelAllExportAPI(data) {
  return request({
    url: 'crmSettlement/allExportExcel',
    method: 'post',
    data: data,
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

/**
 * 新建确认结算金额
 * @param {*} data
 */
export function crmSettlementSaveAPI(data) {
  var url = data.entity && data.entity.settlementId ? 'update' : 'add'
  return request({
    url: 'crmSettlement/' + url,
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
export function crmSettlementDeleteAPI(data) {
  return request({
    url: 'crmSettlement/deleteByIds',
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
export function crmSettlementReadAPI(data) {
  return request({
    url: `crmSettlement/queryById/${data.settlementId}`,
    method: 'post'
  })
}

/**
 * 联系人转移
 * @param {*} data
 */
export function crmSettlementTransferAPI(data) {
  return request({
    url: 'crmSettlement/changeOwnerUser',
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
export function crmSettlementExcelImportAPI(data) {
  var param = new FormData()
  Object.keys(data).forEach(key => {
    param.append(key, data[key])
  })
  return request({
    url: 'crmSettlement/uploadExcel',
    method: 'post',
    data: param,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 导入模板下载
 * @param {*} data
 *
 */
export const crmSettlementExcelDownloadURL = process.env.VUE_APP_BASE_API + 'crmSettlement/downloadExcel'
export function crmSettlementDownloadExcelAPI(data) {
  return request({
    url: 'crmSettlement/downloadExcel',
    method: 'post',
    data: data,
    responseType: 'blob'
  })
}

/**
 * 附件列表
 * @param {*} data
 *
 */
export function crmSettlementFileListAPI(data) {
  return request({
    url: 'crmSettlement/queryFileList',
    method: 'post',
    data: data
  })
}

/**
 * tab数量
 * @param {*} data
 *
 */
export function crmSettlementNumAPI(data) {
  return request({
    url: 'crmSettlement/num',
    method: 'post',
    data: data
  })
}

// 团队操作
/**
 * 团队成员创建
 * @param {*} data
 */
export function crmSettlementSettingTeamSaveAPI(data) {
  return request({
    url: 'crmSettlement/addMembers',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

export function crmSettlementSettingTeamDeleteAPI(data) {
  return request({
    url: 'crmSettlement/deleteMembers',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

export function crmSettlementTeamMembersAPI(data) {
  return request({
    url: `crmSettlement/getMembers/${data.id}`,
    method: 'post'
  })
}

export function crmSettlementUpdateMembersAPI(data) {
  return request({
    url: 'crmSettlement/updateMembers',
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
export function crmSettlementExitTeamAPI(data) {
  return request({
    url: `crmSettlement/exitTeam/${data.id}`,
    method: 'post'
  })
}
