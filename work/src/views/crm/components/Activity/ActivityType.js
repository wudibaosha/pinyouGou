export default {
  filters: {

  },

  methods: {
    /**
     * 获取CRM关键字
     */
    getActivityType(activityType) {
      // 1 线索 2 客户 3 联系人 4 产品 5 商机 6 合同 7 回款 8 日志 9 审批 10 日程 11 任务 12 发邮件
      return {
        1: 'leads',
        2: 'customer',
        3: 'contacts',
        4: 'product',
        5: 'business',
        6: 'contract',
        7: 'receivables',
        8: 'log',
        9: 'examine',
        11: 'task'
      }[activityType]
    },

    getActivityTypeName(activityType) {
      // 1 线索 2 客户 3 联系人 4 产品 5 商机 6 合同 7 回款 8 日志 9 审批 10 日程 11 任务 12 发邮件
      return {
        1: '线索',
        2: '客户',
        3: '联系人',
        4: '产品',
        5: '商机',
        6: '合同',
        7: '回款',
        8: '日志',
        9: '审批',
        10: '日程',
        11: '任务',
        12: '发邮件',
        13: '通话记录',
        14: '回款计划'
      }[activityType]
    },

    getRecordLogTypeName(type) {
      if (!type) {
        return '跟进记录'
      }
      // 活动类型 1 跟进记录 2 创建记录 3 阶段更改 4 外勤签到
      return {
        1: '跟进记录',
        2: '创建记录',
        3: '阶段更改',
        4: '外勤签到',
        5: '通话记录'
      }[type]
    }
  }
}
