export default {
  leads: 1,
  customer: 2,
  contacts: 3,
  product: 4,
  business: 5,
  contract: 6,
  receivables: 7,
  receivablesPlan: 8,
  pool: 9,
  marketing: 10,
  visit: 17,
  invoice: 18,
  settlement: 19,
  unit: 20,
  project: 21,

  keyToTypeData: {
    leads: 1,
    customer: 2,
    contacts: 3,
    product: 4,
    business: 5,
    contract: 6,
    receivables: 7,
    receivablesPlan: 8,
    pool: 9,
    visit: 17,
    invoice: 18,
    settlement: 19,
    unit: 20,
    project: 21
  },

  typeToKeyData: {
    1: 'leads',
    2: 'customer',
    3: 'contacts',
    4: 'product',
    5: 'business',
    6: 'contract',
    7: 'receivables',
    8: 'receivablesPlan',
    9: 'pool',
    17: 'visit',
    18: 'invoice',
    19: 'settlement',
    20: 'unit',
    21: 'project'
  },

  typeToNameData: {
    1: '线索',
    2: '客户',
    3: '联系人',
    4: '产品',
    5: '商机',
    6: '合同',
    7: '回款',
    8: '回款计划',
    9: '公海',
    17: '回访',
    18: '发票',
    19: '确认结算金额',
    20: '单位',
    21: '项目申请管理'
  },

  keyToNameData: {
    leads: '线索',
    customer: '客户',
    contacts: '联系人',
    product: '产品',
    business: '商机',
    contract: '合同',
    receivables: '回款',
    receivablesPlan: '回款计划',
    pool: '公海',
    visit: '回访',
    invoice: '发票',
    settlement: '确认结算金额',
    unit: '单位',
    project: '申请管理'
  },
  labelToType: {
    1: 'crmLeads',
    2: 'crmCustomer',
    3: 'crmContacts',
    4: 'crmProduct',
    5: 'crmBusiness',
    6: 'crmContract',
    7: 'crmReceivables',
    8: 'crmReceivablesPlan',
    9: 'crmPool',
    17: 'crmReturnVisit',
    18: 'crmInvoice',
    19: 'crmSettlement',
    20: 'crmUnit',
    21: 'crmProject'
  },

  convertKeyToType: function(key) {
    return this.keyToTypeData[key]
  },

  convertTypeToKey: function(type) {
    return this.typeToKeyData[type]
  },

  convertTypeToName: function(type) {
    if (typeof type === 'string') {
      type = parseInt(type)
    }
    return this.typeToNameData[type]
  },

  convertKeyToName: function(key) {
    return this.keyToNameData[key]
  }
}
