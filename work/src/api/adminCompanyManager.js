import request from '@/utils/request'

/**
 * 根据域名查询logo和名称
 * @param {*} data
 */
export function adminCompanyManagerQueryLogoAPI(data) {
  return request({
    url: 'adminConfig/queryCompanyLogo',
    method: 'post',
    data: data
  })
}
