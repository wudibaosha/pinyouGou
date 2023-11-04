import moment from 'moment'

export function getDate(initDate, type) {
  const isMonth = ['year', 'lastYear', 'quarter', 'lastQuarter'].includes(type)
  const [year, month] = initDate.split('-')
  let next = ''
  if (isMonth) {
    // next = moment(initDate).subtract(-1, 'month').format('YYYY-MM-DD')
    const lastDate = moment(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD')
    return [initDate, lastDate]
  } else {
    // next = moment(initDate).subtract(-1, 'days').format('YYYY-MM-DD')
    next = `${initDate} 23:59:59`
    return [`${initDate} 00:00:00`, next]
  }
}
