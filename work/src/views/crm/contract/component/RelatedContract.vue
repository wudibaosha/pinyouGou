<template>
  <div>
    <div style="text-align: right;">
      <el-button :disabled="relativeContacts" type="primary" @click="showRelative = true">添加关联合同</el-button>
    </div>
    <div style="margin-top: 20px;">
      <el-form
        ref="relatedContract"
        :model="list"
        :rules="crmType == 'invoice'?invoiceRules:contractRules">
        <el-table
          id="crm-table"
          :data="list.contract"
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
            <template
              slot-scope="{ row, $index }"
            >
              <el-form-item
                v-if="item.prop == 'price'"
                :prop="`contract[${$index}].price`"
                :rules="crmType == 'invoice'?invoiceRules.price:contractRules.price"
                style="margin-bottom: 0;">
                <el-input-number
                  v-model="row.price"
                  placeholder=""
                  :controls="false"
                  style="width: 100%;"
                  @change="dataChange(row,$index)" />
              </el-form-item>
              <span v-else>{{ row[item.prop] }}</span>
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
      :is-related-contract="true"
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
  name: 'RleatedContract',
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
          contract: []
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
      contractRules: {
        price: [
          { required: true, message: '请输入关联预付款合同金额', trigger: 'change' }
        ]
      },
      invoiceRules: {
        price: [
          { required: true, message: '请输入项目实际开票金额', trigger: 'change' }
        ]
      },
      showDview: false,
      rowID: null,
      rowType: '',
      rowIndex: 0,

      fieldList: [
        {
          label: '合同编号',
          prop: 'num',
          width: 80
        }, {
          label: '合同名称',
          prop: 'name',
          width: 80
        }, {
          label: '客户联系人',
          prop: 'customerName',
          width: 80
        }, {
          label: '关联预付款合同金额',
          prop: 'price',
          width: 120
        }, {
          label: '累计开票金额',
          prop: 'truthRelationMoney',
          width: 120
        }, {
          label: '未开票金额',
          prop: 'uninvoicedAmount',
          width: 120
        }, {
          label: '已收款金额',
          prop: 'receivedMoney',
          width: 80
        }, {
          label: '应收款金额',
          prop: 'unreceivedMoney',
          width: 80
        }, {
          label: '合同总金额',
          prop: 'money',
          width: 80
        }
      ],
      showRelative: false,
      showTypes: ['contract'],

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
    if (this.crmType == 'invoice') {
      this.fieldList[3].label = '项目实际开票金额'
    }
   
    console.log(this.list, this.allData)
    for (const i in this.allData) {
      if (this.allData[i] && this.allData[i].length > 0) {
        this.$set(this.list, i, this.allData[i])
      }
    }
    this.$emit('checkInfo', this.list)
  },
  methods: {

    dataChange(val, $index) {
      
      if (this.crmType == 'contract') {
        if (val.typesName == 3 || val.typesName == 4) {
          if (this.list.contract[$index].price) {
            if (this.list.contract[$index].price > val.money) {
              this.$message.error(`不能大于${val.types}的金额`)
            }
          }
        }
      }
      if (this.crmType == 'invoice') {
        const invoiceItem = this.list.contract[$index]
        if (invoiceItem.uninvoicedAmount && Number(invoiceItem.price) > Number(invoiceItem.uninvoicedAmount)) {
          this.$message.error('项目实际开票金额需小于未开票金额')
        }
      }
        
      this.$emit('checkInfo', this.list)
      
      
    },

    isdelete(val, index) {
      this.list.contract.splice(index, 1)
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
        column.property === 'contactsName'
      ) {
        return 'can-visit--underline'
      } else if (column.property === 'money') {
        return 'xr-money'
      } else if (column.property === 'receivedMoney') {
        return 'xr-money green'
      } else if (column.property === 'unreceivedMoney') {
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
        //  undefined '1681289887350050816'
          // if (this.action.type == 'save') {
          //   this.rowID = row.contractId
          // } else {
          //   this.rowID = row.relationId
          // }
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
