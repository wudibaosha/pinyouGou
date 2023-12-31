import request from '@/utils/request'

/**
 * 城市分布分析
 */
export function biAchievementAnalysisAPI(data) {
  return request({
    url: 'biRanking/addressAnalyse',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

export function biAchievementPortraitAPI(data) {
  const type = data.type_analyse
  if (type === 'industry') {
    return request({
      url: 'biRanking/portrait',
      method: 'post',
      data: data,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    })
  } else if (type === 'level') {
    return request({
      url: 'biRanking/portraitLevel',
      method: 'post',
      data: data,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    })
  } else if (type === 'source') {
    return request({
      url: 'biRanking/portraitSource',
      method: 'post',
      data: data,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    })
  }
}

