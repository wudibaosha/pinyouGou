<template>
    <div>
      <div style="text-align: right;">
        <el-button :disabled="relativeContacts" type="primary" @click="showRelative = true">添加关联回款</el-button>
      </div>
      <div style="margin-top: 20px;">
        <el-form
          ref="relatedContract"
          :model="list"
          :rules="receivablesRules">
          <el-table
            id="crm-table"
            :data="list.receivables"
            :cell-class-name="cellClassName"
            @row-click="handleRowClick">
            <el-table-column
              v-for="(item,index) in fieldList"
              :key="index"
              :prop="item.prop"
            >
              <template slot="header" slot-scope="scope">
                <el-tooltip :content="item.label" placement="top">
                  <span>{{ item.label }}</span>
                </el-tooltip>
              </template>
              
            </el-table-column>
            <el-table-column
              :resizable="false"
              label="操作"
              :show-overflow-tooltip="true"
              width="80">
              <template slot-scope="{ row, $index }">
                <el-button
                  @click.native="isdelete(row,$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form>
      </div>
      <crm-relative
        v-if="showRelative"
        ref="crmrelative"
        :visible.sync="showRelative"
        :radio="false"
        :selected-data="list"
        :is-related-receivables="true"
        :current-crm-type="crmType"
        :show-types="showTypes"
        :is-relative="isRelative"
        @changeCheckout="checkInfos" />
  
        
  
  
      <!-- 相关详情页面 -->
      <c-r-m-all-detail
        :id.sync="rowID"
        :visible.sync="showDview"
        :crm-type="rowType"
        :page-list="rowType == 'contract' ? list : []"
        :page-index.sync="rowIndex"
      />
  
    </div>
  </template>
  
  <script>
  
  export default {
    name: 'RelatedReceivables',
    components: {
      CrmRelative: () =>
        import('@/components/CreateCom/CrmRelative'),
      CRMAllDetail: () =>
        import('@/views/crm/components/CRMAllDetail')
  
    },
    props: {
      allData: {
        type: Object,
        default: () => {
          return {
            receivables: []
          }
        }
      },
      action: {
        type: Object,
        default: () => {
          return {
            type: 'save',
            id: '',
            data: {}
          }
        }
      },
      relativeContacts: Boolean,
      crmType: String,
      isRelative: [Boolean, Number]
    },
    data() {
      return {
        list: {},
        receivablesRules: {
          price: [
            { required: true, message: '请输入占用金额', trigger: 'change' }
          ]
        },
        showDview: false,
        rowID: null,
        rowType: '',
        rowIndex: 0,
  
        fieldList: [
          {
            label: '回款编号',
            prop: 'number',
            width: 80
          }, {
            label: '回款金额',
            prop: 'money',
            width: 80
          }, 
          // {
          //   label: '发票号码',
          //   prop: 'invoiceNumber',
          //   width: 80
          // }, 
          {
            label: '合同金额',
            prop: 'contractMoney',
            width: 120
          }, {
            label: '未回款金额',
            prop: 'unreceivedMoney',
            width: 120
          }, {
            label: '未开发票',
            prop: 'uninvoicedAmount',
            width: 120
          },
          //  {
          //   label: '已收款金额',
          //   prop: 'receivedMoney',
          //   width: 80
          // },
           {
            label: '回款日期',
            prop: 'returnTime',
            width: 80
          }
        ],
        showRelative: false,
        showTypes: ['receivables'],
  
        dataValue: null
  
      }
    },
    watch: {
      allData: function() {
        this.list = {}
        for (const i in this.allData) {
          if (this.allData[i] && this.allData[i].length > 0) {
            this.$set(this.list, i, this.allData[i])
          }
        }
      }
    },
    mounted() {
      if (this.crmType == 'prject') {
        this.fieldList[3].label = '占用金额'
      }
      // 编辑时勾选
      for (const i in this.allData) {
        if (this.allData[i] && this.allData[i].length > 0) {
          this.$set(this.list, i, this.allData[i])
        }
      }
      this.$emit('checkInfo', this.list)
    },
    methods: {
  
      dataChange(val, $index) {
        
        if (this.crmType == 'invoice') {
          const invoiceItem = this.list.contract[$index]
          if (invoiceItem.uninvoicedAmount && Number(invoiceItem.price) > Number(invoiceItem.uninvoicedAmount)) {
            this.$message.error('项目实际开票金额需小于未开票金额')
          }
        }
          
        this.$emit('checkInfo', this.list)
        
        
      },
  
      isdelete(val, index) {
        this.list.receivables.splice(index, 1)
        this.$emit('checkInfo', this.list)
      },
  
      checkInfos(val) {
        this.list = {}
        for (const i in val.data) {
          if (val.data[i].length > 0) {
            this.$set(this.list, i, val.data[i])
          }
        }
  
        // 项目实际开票金额设为0
        // this.list.contract.forEach(item => {
        //   item.price = 0
        // })
  
        this.$emit('checkInfo', this.list)
      },
  
      /**
       * 通过回调控制class
       */
      cellClassName({ row, column, rowIndex, columnIndex }) {
        if (column.property === 'num') {
          return 'can-visit--underline can-visit--bold'
        } else if (
          column.property === 'customerName' ||
          column.property === 'businessName' ||
          column.property === 'contactsName' ||
          column.property === 'number'
        ) {
          return 'can-visit--underline'
        } else if (column.property === 'money') {
          return 'xr-money'
        } else if (column.property === 'receivedMoney') {
          return 'xr-money green'
        } else if (column.property === 'unreceivedMoney' || 
            column.property === 'uninvoicedAmount') {
          return 'xr-money red'
        } else {
          return ''
        }
      },
  
      /**
       * 列表操作
       * @param {*} row
       * @param {*} column
       * @param {*} event
       */
      handleRowClick(row, column, event) {
        if (column && column.property) {
          if (column.property === 'num') {
            if (!row.relationId) {
              this.rowID = row.contractId
            } else {
              this.rowID = row.relationId
            }
  
            console.log(this.action.type)
            this.rowType = 'contract'
            this.showDview = true
          } else if (column.property === 'customerName') {
            this.rowID = row.customerId
            this.rowType = 'customer'
            this.showDview = true
          } else if (column.property === 'number') {
            this.rowID = row.receivablesdId
            this.rowType = 'receivables'
            this.showDview = true
          } else {
            this.showDview = false
          }
          this.rowIndex = this.getRowIndex()
        }
      },
  
      /**
       * 获取点击行索引
       */
      getRowIndex() {
        let rowIndex = 0
        for (let index = 0; index < this.list.length; index++) {
          const element = this.list[index]
          if (element[`${this.rowType}Id`] === this.rowID) {
            rowIndex = index
            break
          }
        }
        return rowIndex
      }
    }
  }
  </script>
  
  <style scoped lang="scss">
  .add-btn:hover {
    color: $--color-primary;
    background-color: $--button-hover-background-color;
  }
  
  .d-view {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: $--detail-width-base;
    min-width: 950px;
  }
  
  /deep/.el-table {
    th {
      .cell {
        span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
  
  </style>
  