/**
     * type   1 客户 2 商机 3 合同 4 回款 5 跟进记录
     *
     * 表头数据
     * 客户：客户联系人、成交状态、最后跟进时间、创建时间、负责人
     * 商机：商机名称、商机阶段、最后跟进时间、创建时间、负责人
     * 合同：合同名称、合同状态、创建时间、公司签约人
     * 回款：回款编号、回款时间、负责人
     */
export function getReportFieldList(type) {
  return {
    customer: [
      {
        label: '客户联系人',
        prop: 'customerName'
      },
      {
        label: '成交状态',
        prop: 'dealStatus'
      },
      {
        label: '最后跟进时间',
        prop: 'lastTime'
      },
      {
        label: '创建时间',
        prop: 'createTime'
      },
      {
        label: '负责人',
        prop: 'ownerUserName'
      }
    ],
    business: [
      {
        label: '商机名称',
        prop: 'businessName'
      },
      {
        label: '商机阶段',
        prop: 'statusName'
      },
      {
        label: '最后跟进时间',
        prop: 'lastTime'
      },
      {
        label: '创建时间',
        prop: 'createTime'
      },
      {
        label: '负责人',
        prop: 'ownerUserName'
      }
    ],
    contract: [
      {
        label: '合同名称',
        prop: 'name'
      },
      {
        label: '合同状态',
        prop: 'checkStatus'
      },
      {
        label: '创建时间',
        prop: 'createTime'
      },
      {
        label: '公司签约人',
        prop: 'companyUserName'
      }
    ],
    receivables: [
      {
        label: '回款编号',
        prop: 'number'
      },
      {
        label: '回款时间',
        prop: 'returnTime'
      },
      {
        label: '负责人',
        prop: 'ownerUserName'
      }
    ]
  }[type]
}
