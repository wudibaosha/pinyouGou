/**
     * @description: 获取帮助信息
     * @param {*} crmType 模块
     * @param {*} type 具体类型 filterForm 不传 返回整个帮助对象
     * @return {*}
     */
export function getCrmHelpObj(module, type, isSeas) {
  const helpObj = {
    leads: {
      type: '7',
      index: '24', // 列表帮助提示
      filterForm: '59', // 高级筛选
      filterFormExport: '68', // 高级筛选 外露
      sceneSet: '50', // 场景设置
      sceneCreate: '59', // 场景创建
      transfer: '80' // 转移
    },
    customer: {
      type: '8',
      index: isSeas ? '118' : '25',
      filterForm: '60',
      filterFormExport: '69',
      sceneSet: '51',
      sceneCreate: '60',
      transfer: '81',
      teamReadOnly: '101',
      teamReadWrite: '102'
    },
    contacts: {
      type: '9',
      index: '26',
      filterForm: '61',
      filterFormExport: '70',
      sceneSet: '52',
      sceneCreate: '61',
      transfer: '82',
      teamReadOnly: '122',
      teamReadWrite: '126'
    },
    business: {
      type: '10',
      index: '27',
      filterForm: '62',
      filterFormExport: '71',
      sceneSet: '53',
      sceneCreate: '62',
      transfer: '83',
      teamReadOnly: '123',
      teamReadWrite: '127'
    },
    contract: {
      type: '11',
      index: '28',
      filterForm: '63',
      filterFormExport: '72',
      sceneSet: '54',
      sceneCreate: '63',
      transfer: '84',
      teamReadOnly: '124',
      teamReadWrite: '128'
    },
    receivables: {
      type: '12',
      index: '29',
      filterForm: '64',
      filterFormExport: '73',
      sceneSet: '55',
      sceneCreate: '64',
      transfer: '85',
      teamReadOnly: '125',
      teamReadWrite: '129'
    },
    invoice: {
      type: '13',
      index: '30',
      filterForm: '65',
      filterFormExport: '74',
      sceneSet: '56',
      sceneCreate: '65',
      transfer: '86'
    },
    visit: {
      type: '14',
      index: '31',
      filterForm: '66',
      filterFormExport: '75',
      sceneSet: '57',
      sceneCreate: '66',
      transfer: '87'
    },
    product: {
      type: '15',
      index: '32',
      filterForm: '67',
      filterFormExport: '76',
      sceneSet: '58',
      sceneCreate: '67'
    },
    marketing: {
      type: '16',
      index: '33',
      filterForm: '67',
      filterFormExport: '76',
      sceneSet: '58',
      sceneCreate: '67'
    },
    unit: {
      type: '16',
      index: '33',
      filterForm: '67',
      filterFormExport: '76',
      sceneSet: '58',
      sceneCreate: '67'
    }
  }[module]
  if (type) {
    return helpObj ? {
      type: helpObj.type,
      id: helpObj[type]
    } : null
  } else {
    return helpObj
  }
}
