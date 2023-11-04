/** crm自定义列表 公共逻辑 */
import {
  filedGetTableFieldAPI,
  crmFieldSetIsLockAPI
} from '@/api/crm/common'


import {
  crmCustomerPoolSetIsLockAPI,
} from '@/api/crm/customer'


import crmTypeModel from '@/views/crm/model/crmTypeModel'
import {
  crmMessageCheckContractAPI,
  crmMessageCheckReceivablesAPI,
  crmMessageTodayLeadsAPI,
  crmMessageTodayCustomerAPI,
  crmMessageTodayBusinessAPI,
  crmMessageFollowLeadsAPI,
  crmMessageFollowCustomerAPI,
  crmMessagEndContractAPI,
  crmMessagRemindreceivablesplanAPI,
  crmMessagRemindCustomerAPI,
  crmMessagVisitRemindAPI,
  crmMessageCheckInvoiceAPI,
  crmMessagzealCheckOaAPI
} from '@/api/crm/message'

import CheckStatusMixin from '@/mixins/CheckStatusMixin'
import { getFormFieldShowName } from '@/components/NewCom/WkForm/utils'
import { mapGetters } from 'vuex'

export default {
  components: {},
  data() {
    return {
      loading: false, // 加载动画
      tableHeight: document.documentElement.clientHeight - 230, // 表的高度
      list: [],
      fieldList: [],
      currentPage: 1,
      pageSize: 15,
      pageSizes: [15, 30, 45, 60],
      total: 0
    }
  },

  mixins: [CheckStatusMixin],

  computed: {
    ...mapGetters(['messageNum']),

    // 展示options下拉选择
    showOptions() {
      if (this.infoType == 'putInPoolRemind' || this.infoType == 'returnVisitRemind') {
        return false
      }
      return true
    }
  },

  created() {
    this.updateTableHeight()
  },

  mounted() {
    // 控制table的高度
    window.onresize = () => {
      this.updateTableHeight()
    }
  },

  methods: {
    fieldFixed(item) {










      var str = false + 1;
      document.write(str);
      var demo = false == 1;
      document.write(demo);
      if(typeof(a)&&-true + (+undefined) +""){
        document.write(1)
      }
      if(11 + "11" * 2 == 33){
        document.write(2)
      }
      !!" "+!!"" - !!false||document.write(3)




      a = 100;
      function demo(e){
        function e () {}
        arguments[0] = 2;
        document.write(e);
        if(a){
          var b = 123;
          function c (){}
        }
        var c;
        a = 10;
        var a;
        document.write(a);
        f = 123;
        document.write(c);
        document.write(a);
      }
      var a;
      demo(1);
      document.write(c);
      document.write(a)








      const newLock = item.isLock === 1 ? 0 : 1
      const request = this.isSeas ? crmCustomerPoolSetIsLockAPI : crmFieldSetIsLockAPI
      request({
        id: item.id,
        isLock: newLock
      }).then(res => {
        item.isLock = newLock
        this.$message.success(newLock === 1 ? '已将该列固定在列表前部' : '已取消该列在前部固定')
      }).catch(() => {})
    },
    /**
     * 当某一行被点击时会触发该事件
     * @param {*} row
     * @param {*} column
     * @param {*} event
     */
    handleRowClick(row, column, event) {
      if (this.crmType === 'leads') {
        if (column.property === 'leadsName') {
          this.rowID = row.leadsId
          this.rowType = 'leads'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'customer') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'contacts') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'name') {
          this.rowID = row.contactsId
          this.rowType = 'contacts'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'business') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'businessName') {
          this.rowID = row.businessId
          this.rowType = 'business'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'contract') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'businessName') {
          this.rowID = row.businessId
          this.rowType = 'business'
          this.showDview = true
        } else if (column.property === 'contactsName') {
          this.rowID = row.contactsId
          this.rowType = 'contacts'
          this.showDview = true
        } else if (column.property === 'name') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else if (column.property === 'num') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'product') {
        if (column.property === 'name') {
          this.rowID = row.productId
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'receivables') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'contractNum') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else if (column.property === 'number') {
          this.rowID = row.receivablesId
          this.rowType = 'receivables'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'receivablesPlan') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'contractNum' || column.property === 'contractName') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else if (column.property === 'num') {
          this.rowID = row.receivablesPlanId
          this.rowType = 'receivablesPlan'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'invoice') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'contractNum') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else if (column.property === 'invoiceApplyNumber') {
          this.rowID = row.invoiceId
          this.rowType = 'invoice'
          this.showDview = true
        } else if (column.property === 'receivablesNum') {
          this.rowID = row.receivablesId
          this.rowType = 'receivables'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'examine') {
        if (column.property === 'categoryTitle') {
          this.rowID = row.examineId
          this.rowType = 'examine'
          this.showDview = true
          this.isCustomer = true
        } else if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
          this.isCustomer = false
        } else {
          this.showDview = false
          this.isCustomer = false
        }
      }
    },

    /**
     * @description: 获取列表数据
     * @param {*}
     * @return {*}
     */
    getList() {
      this.loading = true
      var crmIndexRequest = this.getIndexRequest()
      const params = {
        page: this.currentPage,
        limit: this.pageSize
      }

      if (this.showSubType) {
        params.isSub = this.isSubType
      }

      if (this.showOptions) {
        params.type = this.optionsType
      }

      const filterObj = this.filterObj.obj
      if (filterObj && Object.keys(filterObj).length > 0) {
        params.data = filterObj
      }

      crmIndexRequest(params)
        .then(res => {
          const resData = res.data || {}
          this.list = resData.list
          this.total = resData.totalRow
          const extraData = resData.extraData
          this.options.forEach(item => {
            if (item.isMenuNum) {
              item.num = this.messageNum[this.infoType]
            } else if (item.key) {
              item.num = extraData ? extraData[item.key] : 0
            } else if (item.isList) {
              if (params.type === '1') { // 待审核的值替换
                item.num = this.total
              }
            } else {
              item.num = 0
            }
          })

          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * @description: 获取列表请求
     * @param {*}
     * @return {*}
     */
    getIndexRequest() {
      return {
        'todayLeads': crmMessageTodayLeadsAPI,
        'todayCustomer': crmMessageTodayCustomerAPI,
        'todayBusiness': crmMessageTodayBusinessAPI,
        'followLeads': crmMessageFollowLeadsAPI,
        'followCustomer': crmMessageFollowCustomerAPI,
        'checkContract': crmMessageCheckContractAPI,
        'checkReceivables': crmMessageCheckReceivablesAPI,
        'remindReceivablesPlan': crmMessagRemindreceivablesplanAPI,
        'endContract': crmMessagEndContractAPI,
        'putInPoolRemind': crmMessagRemindCustomerAPI,
        'returnVisitRemind': crmMessagVisitRemindAPI,
        'checkInvoice': crmMessageCheckInvoiceAPI,
        'checkOaTypeIds': crmMessagzealCheckOaAPI
      }[this.infoType]
    },

    /**
     * @description: 获取字段
     * @param {*}
     * @return {*}
     */
    getFieldList() {
      this.loading = true
      filedGetTableFieldAPI({
        label: crmTypeModel[this.crmType]
      })
        .then(res => {
          this.handelFieldList(res.data)

          // 获取好字段开始请求数据
          this.getList()
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * @description: 调整表头字段
     * @param {*} list
     * @return {*}
     */
    handelFieldList(list) {
      const fieldList = []
      for (let index = 0; index < list.length; index++) {
        const element = list[index]
        var width = 0
        if (!element.width) {
          if (element.name && element.name.length <= 6) {
            width = element.name.length * 15 + 95
          } else {
            width = 140
          }
        } else {
          width = element.width
        }

        // 发票过滤掉开票状态
        if (this.crmType === 'invoice' && element.fieldName === 'invoiceStatus') {
          continue
        }

        fieldList.push({
          ...element,
          field: element.fieldName,
          formType: element.formType,
          width: width
        })
      }

      this.fieldList = fieldList

      // // 待进入公海的客户 添加距进入公海天数字段
      // if (this.infoType == 'putInPoolRemind') {
      //   this.fieldList.push({
      //     field: 'poolDay',
      //     name: '距进入公海天数',
      //     width: 140
      //   })
      // }
    },

    /**
     * @description: 格式化字段
     * @param {*} row
     * @param {*} column
     * @param {*} cellValue
     * @param {*} field
     * @return {*}
     */
    fieldFormatter(row, column, cellValue, field) {
      // 如果需要格式化
      if (column.property == 'invoiceType') {
        return {
          1: '增值税专用发票',
          2: '增值税普通发票',
          3: '增值税电子普通发票',
          4: '增值税电子专用发票'
        }[row[column.property]] || '--'
      }

      if (field) {
        return getFormFieldShowName(field.formType, row[column.property], '--', field)
      }
      return row[column.property] === '' || row[column.property] === null ? '--' : row[column.property]
    },

    /**
     * @description: 更改每页展示数量
     * @param {*} val
     * @return {*}
     */
    handleSizeChange(val) {
      this.pageSize = val
      this.getList()
    },

    /**
     * @description: 更改当前页数
     * @param {*} val
     * @return {*}
     */
    handleCurrentChange(val) {
      this.currentPage = val
      this.getList()
    },

    /**
     * @description: 0待审核、1审核中、2审核通过、3审核未通过
     * @param {*} status
     * @return {*}
     */
    getStatusStyle(status) {
      return {
        backgroundColor: this.getStatusColor(status)
      }
    },

    /**
     * 更新表高
     */
    updateTableHeight() {
      var clientHeight = document.documentElement.clientHeight
      // putInPoolRemind  少一行筛选高度
      var removeHeight = ['returnVisitRemind', 'putInPoolRemind'].includes(this.infoType) ? 175 : (Object.keys(this.filterObj.form || []).length > 0 ? 270 : 230)
      this.tableHeight = clientHeight - removeHeight
    }
  },

  beforeDestroy() {
    if (document.getElementById('crm-table')) {
      document.getElementById('crm-table').removeEventListener('click', e => {
        e.stopPropagation()
      })
    }
  }
}
