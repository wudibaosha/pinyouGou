<template>
  <div
    v-loading="loading"
    v-empty="nopermission"
    class="rc-cont"
    xs-empty-icon="nopermission"
    xs-empty-text="暂无权限">
    <el-table
      :data="list"
      :height="tableHeight"
      :cell-class-name="cellClassName"
      stripe
      @row-click="handleRowClick">
      <el-table-column
        v-for="(item, index) in fieldList"
        :key="index"
        :prop="item.prop"
        :label="item.label"
        :formatter="fieldFormatter"
        show-overflow-tooltip />
    </el-table>
    <flexbox class="handle-footer">
      <div class="discount-title">整单折扣（%）：<span class="discount-title-value">{{ totalInfo.discountRate }}</span></div>
      <div class="total-info discount-title">已选中产品：<span class="info-yellow">{{ list.length }}</span>种 总金额：<span class="info-yellow">{{ totalInfo.money }}</span>元</div>
    </flexbox>
    <c-r-m-full-screen-detail
      :id="productId"
      :visible.sync="showFullDetail"
      crm-type="product" />
  </div>
</template>

<script type="text/javascript">
import { crmBusinessProductAPI } from '@/api/crm/business'
import { crmContractProductAPI } from '@/api/crm/contract'
import { separator } from '@/filters/vueNumeralFilter/filters'

export default {
  name: 'RelativeProduct', // 相关产品  可能再很多地方展示 放到客户管理目录下
  components: {
    CRMFullScreenDetail: () => import('@/components/CRMFullScreenDetail')
  },
  mixins: [],
  props: {
    /** 模块ID */
    id: [String, Number],
    /** 联系人人下 新建商机 需要联系人里的客户信息  合同下需要客户和商机信息 */
    detail: {
      type: Object,
      default: () => {
        return {}
      }
    },
    /** 没有值就是全部类型 有值就是当个类型 */
    crmType: {
      type: String,
      default: ''
    },
    /** 是公海 默认是客户 */
    isSeas: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      nopermission: false,
      list: [],
      fieldList: [],
      tableHeight: '400px',
      showFullDetail: false,
      productId: '', // 查看全屏产品详情的 ID
      totalInfo: { money: '0.00', discountRate: '0.00' }
    }
  },
  inject: ['rootTabs'],
  computed: {},
  watch: {
    id(val) {
      this.list = []
      this.getDetail()
    },

    'rootTabs.currentName'(val) {
      if (val === 'RelativeProduct') {
        this.getDetail(false)
      }
    }
  },
  mounted() {
    this.getDetail()
  },
  methods: {
    getFieldList() {
      this.fieldList.push({
        prop: 'productName',
        width: '200',
        label: '产品名称'
      })
      this.fieldList.push({
        prop: 'categoryName',
        width: '200',
        label: '产品类别'
      })
      this.fieldList.push({ prop: 'unit', width: '200', label: '单位' })
      this.fieldList.push({ prop: 'price', width: '200', label: '标准价格' })
      this.fieldList.push({ prop: 'salesPrice', width: '200', label: '售价' })
      this.fieldList.push({ prop: 'num', width: '200', label: '数量' })
      this.fieldList.push({
        prop: 'discount',
        width: '200',
        label: '折扣（%）'
      })
      this.fieldList.push({ prop: 'subtotal', width: '200', label: '合计' })
    },

    fieldFormatter(row, column) {
      if (column.property == 'price' || column.property == 'salesPrice') {
        return separator(row[column.property] || 0)
      }
      return row[column.property]
    },

    getDetail(loading = true) {
      this.loading = loading
      this.getRequest()(this.getParams())
        .then(res => {
          if (this.fieldList.length == 0) {
            this.getFieldList()
          }
          this.nopermission = false
          this.loading = false
          this.list = res.data.list
          this.totalInfo.money = res.data.money
          this.totalInfo.discountRate = res.data.discountRate
        })
        .catch(data => {
          if (data.code == 102) {
            this.nopermission = true
          }
          this.loading = false
        })
    },
    getRequest() {
      if (this.crmType == 'business') {
        return crmBusinessProductAPI
      } else if (this.crmType == 'contract') {
        return crmContractProductAPI
      }
    },
    getParams() {
      if (this.crmType == 'business') {
        return {
          businessId: this.id,
          pageType: 0
        }
      } else if (this.crmType == 'contract') {
        return {
          contractId: this.id,
          pageType: 0
        }
      }
    },

    /**
     * 当某一行被点击时会触发该事件
     */
    handleRowClick(row, column, event) {
      if (column.property == 'productName') {
        this.productId = row.productId
        this.showFullDetail = true
      }
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (column.property === 'productName') {
        return 'can-visit--underline'
      } else {
        return ''
      }
    }
  }
}
</script>
<style lang="scss" scoped>
@import "../styles/relativecrm.scss";

.handle-footer {
  position: relative;
  padding-top: #{$--interval-base * 2};

  .discount-title {
    color: $--color-text-secondary;
  }

  .discount-title-value {
    color: $--color-text-primary;
  }

  .total-info {
    position: absolute;
    top: #{$--interval-base * 2};
    right: 0;

    .info-yellow {
      margin-right: 4px;
      color: $--color-danger;
    }
  }
}
</style>
