<template>
  <div>

    <div style="margin-top: 20px;">
      <el-table
        id="crm-table"
        :data="list"
        :cell-class-name="cellClassName"
        @row-click="handleRowClick">
        <el-table-column
          v-for="(item,index) in fieldList"
          :key="index"
          :prop="item.prop"
          :label="item.label"
        />

      </el-table>
    </div>
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
import { crmContractQueryOtherContractAPI } from '@/api/crm/contract'

export default {
  name: 'ContractDetailRelative',
  components: {
    CRMAllDetail: () =>
      import('@/views/crm/components/CRMAllDetail')

  },
  props: {
    isContract: {
      type: Boolean,
      default: false
    },
    detail: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      list: [],

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
          label: '已收款金额',
          prop: 'receivedMoney',
          width: 80
        }, {
          label: '应收款金额',
          prop: 'unreceivedMoney',
          width: 80
        }
      ]

    }
  },
  inject: ['rootTabs'],
  watch: {
    'rootTabs.currentName'(val) {
      if (val === 'ContractDetailRelative') {
        this.getContractOther()
      }
    }
  },
  mounted() {
    this.getContractOther()
  },
  methods: {

    getContractOther() {
      const params = {
        pageType: 0,
        contractId: this.detail.contractId
      }
      crmContractQueryOtherContractAPI(params).then(res => {
        this.list = res.data.list
        // this.$set(this.list, 'contract', res.data.list)
      })
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
      if (column.property === 'num') {
        this.rowID = row.contractId
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

</style>
