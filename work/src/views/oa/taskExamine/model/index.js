// 审批表头数据
export const ExamineHeadsModel = [
  {
    name: '审批类型',
    field: 'categoryTitle',
    width: 120
  }, {
    name: '客户联系人',
    field: 'customerName',
    width: 120,
    formType: 'user'
  },{
    name: '合同编号',
    field: 'contractNum',
    width: 120,
    formType: 'text'
  }, {
    name: '合同名称',
    field: 'contractName',
    width: 120,
    formType: 'text'
  },  {
    name: '申请金额',
    field: 'applyMoney',
    width: 120,
    formType: 'text'
  },{
    name: '合同金额',
    field: 'contractMoney',
    width: 120,
    formType: 'number'
  }, {
    name: '回款金额',
    field: 'receivablesMoney',
    width: 120,
    formType: 'number'
  }, {
    name: '应回款金额',
    field: 'noReceivablesMoney',
    width: 120,
    formType: 'number'
  },  {
    name: '申请人',
    field: 'applyUserName',
    width: 120,
    formType: 'text'
  }, {
    name: '申请时间',
    field: 'applyTime',
    width: 120,
    formType: 'text'
  },{
    name: '预计开票时间',
    field: 'invoicingTime',
    width: 120,
    formType: 'text'
  }, {
    name: '预计回款时间',
    field: 'receivablesTime',
    width: 120,
    formType: 'text'
  }, {
    name: '创建日期 ',
    field: 'createTime',
    width: 120
  }, {
    name: '创建人',
    field: 'createUser',
    width: 120,
    formType: 'user'
  }, {
    name: '状态',
    field: 'examineStatus',
    width: 80,
    formType: 'examineStatus'
  },
  
  
  {
    name: '申请状态',
    field: 'thisProjectStatus',
    width: 120,
    formType: 'text'
  },
  {
    name: '转入合同编号',
    field: 'inToContractNum',
    width: 120,
    formType: 'text'
  }, {
    name: '转入合同名称',
    field: 'intoContractName',
    width: 120,
    formType: 'user'
  }, {
    name: '转入合同金额',
    field: 'intoContractMoney',
    width: 120,
    formType: 'number'
  }, {
    name: '转入回款金额',
    field: 'intoReceivablesMoney',
    width: 120,
    formType: 'number'
  }, {
    name: '转入金额',
    field: 'intoMoney',
    width: 120,
    formType: 'number'
  }, {
    name: '转出金额',
    field: 'money',
    width: 120,
    formType: 'number'
  },{
    name: '申请类型',
    field: 'applyType',
    width: 120,
    formType: 'text'
  },  {
    name: '审批内容',
    field: 'content',
    width: 120,
    formType: 'text'
  }, ]
