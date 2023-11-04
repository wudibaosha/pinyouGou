<template>
  <div v-loading="loading" class="rc-cont">
    <template v-if="titleShow">
      <div
        v-if="!isSeas"
        class="rc-head">
        <el-button
          icon="el-icon-plus"
          @click="createClick('title')">新建发票抬头</el-button>
      </div>
      <el-table
        :data="titleList"
        :height="tableHeight"
        stripe>
        <el-table-column
          v-for="(item, index) in titleFieldList"
          :key="index"
          :prop="item.prop"
          :label="item.label"
          :width="item.width"
          :formatter="titleFieldFormatter"
          show-overflow-tooltip />
        <el-table-column
          label="操作"
          width="100"
          fixed="right">
          <template slot-scope="scope">
            <el-button
              type="primary-text"
              style="padding: 0;"
              @click="handleTitle('edit', scope)">编辑</el-button>
            <el-button
              type="primary-text"
              style="padding: 0;"
              @click="handleTitle('delete', scope)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <div
      class="rc-head margin-top-base2">
      <el-button
        v-if="!isSeas && invoiceSave"
        icon="el-icon-plus"
        @click="createClick('invoice')">新建发票</el-button>
    </div>
    <el-table
      :data="invoiceList"
      :height="mainTableHeight"
      :cell-class-name="cellClassName"
      stripe
      @row-click="handleRowClick">
      <el-table-column
        v-for="(item, index) in fieldList"
        :key="index"
        :prop="item.prop"
        :label="item.label"
        :width="item.width"
        :fixed="item.fixed"
        show-overflow-tooltip>
        <template slot-scope="{ row, column }">
          <template v-if="item.prop == 'checkStatus'">
            <span :style="getStatusStyle(row.checkStatus)" class="status-mark" />
            <span>{{ getStatusName(row.checkStatus) }}</span>
          </template>
          <template
            v-else>
            {{ invoicefieldFormatter(row, column) }}
          </template>
        </template>
      </el-table-column>
      <el-table-column
        v-if="invoiceUpdateInvoiceStatus"
        :resizable="false"
        label="操作"
        fixed="right"
        width="100">
        <template slot-scope="scope">
          <el-button
            :disabled="scope.row.invoiceStatus == 1 || scope.row.checkStatus !== 1"
            type="primary-text"
            style="padding: 0;"
            @click="markReceivables(scope)">{{ scope.row.invoiceStatus == 1 ? '已开票':'标记为开票' }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <c-r-m-full-screen-detail
      :id="showFullId"
      :visible.sync="showFullDetail"
      crm-type="invoice"
      @handle="detailHandle" />
    <create
      v-if="isCreate"
      :action="createAction"
      @save-success="getInvoiceList"
      @close="isCreate=false" />
    <invoice-title-set
      :visible.sync="titleCreateShow"
      :customer-id="id"
      :detail="titleDetail"
      @change="getTitleList" />
    <mark-invoice
      :visible.sync="markShow"
      :detail="rowDetail"
      @change="getInvoiceList"
    />
  </div>
</template>

<script type="text/javascript">
import {
  crmCustomerInvoiceAPI,
  crmCustomerInvoiceInfoAPI
} from '@/api/crm/customer'
import { crmContractQueryInvoiceAPI } from '@/api/crm/receivables'
import { crmContractInvoiceAPI } from '@/api/crm/contract'
import { crmInvoiceDeleteInvoiceInfoAPI } from '@/api/crm/invoice'

import CheckStatusMixin from '@/mixins/CheckStatusMixin'
import { separator } from '@/filters/vueNumeralFilter/filters'
import InvoiceTitleSet from '../invoice/components/InvoiceTitleSet'
import MarkInvoice from '../invoice/components/MarkInvoice'
import Create from '../invoice/Create'
import { mapGetters } from 'vuex'
import { getPermissionByKey } from '@/utils'

export default {
  name: 'RelativeInvoice', // 相关回访

  components: {
    Create,
    InvoiceTitleSet,
    MarkInvoice,
    CRMFullScreenDetail: () => import('@/components/CRMFullScreenDetail')
  },

  mixins: [CheckStatusMixin],

  props: {
    /** 模块ID */
    id: [String, Number],
    /** 没有值就是全部类型 有值就是当个类型 */
    crmType: {
      type: String,
      default: ''
    },
    /** 是公海 默认是客户 */
    isSeas: {
      type: Boolean,
      default: false
    },
    /** 客户和 合同下 可新建 抬头 */
    detail: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },

  data() {
    return {
      loading: false,
      invoiceList: [], // 发票列表
      fieldList: [],
      tableHeight: '250px',
      showFullDetail: false,
      showFullId: '', // 查看全屏详情的 ID
      createAction: null,
      isCreate: false, // 新建发票发票
      titleList: [],
      titleFieldList: [],

      titleCreateShow: false,
      titleDetail: null,

      rowDetail: {},
      markShow: false
    }
  },

  inject: ['rootTabs'],

  computed: {
    ...mapGetters(['crm']),
    // 发票title展示
    titleShow() {
      return this.crmType === 'customer'
    },

    // 发票列表高
    mainTableHeight() {
      return this.titleShow ? '250px' : '400px'
    },

    invoiceSave() {
      return !!getPermissionByKey('crm.invoice.save')
    },
    // 是否能操作
    invoiceUpdateInvoiceStatus() {
      return !!getPermissionByKey('crm.invoice.updateInvoiceStatus')
    }
  },

  watch: {
    id(val) {
      this.invoiceList = []
      this.titleList = []
      this.getInvoiceList()
      this.getTitleList()
    },

    'rootTabs.currentName'(val) {
      if (val === 'RelativeInvoice') {
        this.getInvoiceList(false)
        this.getTitleList(false)
      }
    }
  },

  mounted() {
    this.titleFieldList = [
      { prop: 'titleType', width: '120', label: '抬头类型' },
      { prop: 'invoiceTitle', width: '120', label: '开票抬头' },
      { prop: 'taxNumber', width: '120', label: '纳税人识别号' },
      { prop: 'depositBank', width: '120', label: '开户行' },
      { prop: 'depositAccount', width: '120', label: '开户账号' },
      { prop: 'depositAddress', width: '120', label: '开票地址' },
      { prop: 'telephone', width: '120', label: '电话' },
      { prop: 'ownerUserName', width: '120', label: '创建人' },
      { prop: 'createTime', width: '120', label: '创建时间' }
    ]

    this.getTitleList()

    this.fieldList = [
      { prop: 'invoiceApplyNumber', width: '120', label: '发票申请编号', fixed: 'left'},
      // { prop: 'contractNum', width: '120', label: '合同编号' },
      // { prop: 'contractMoney', width: '120', label: '合同金额' },
      { prop: 'invoiceMoney', width: '120', label: '票面金额' },
      { prop: 'thisRelationMoney', width: '120', label: '项目实际开票金额' },
      { prop: 'fieldZoumrs', width: '120', label: '公司归属' },
      // { prop: 'invoiceDate', width: '120', label: '开票日期' },
      { prop: 'realInvoiceDate', width: '120', label: '实际开票日期' },
      { prop: 'invoiceType', width: '120', label: '开票类型' },
      { prop: 'invoiceNumber', width: '120', label: '发票号码' },
      { prop: 'invoiceTitle', width: '120', label: '开票抬头' },
      { prop: 'fieldBojoyc', width: '120', label: '发票内容' },
      // { prop: 'logisticsNumber', width: '120', label: '物流单号' },
      { prop: 'ownerUserName', width: '120', label: '负责人' },
      { prop: 'dishonorReason', width: '120', label: '退票原因' },
      { prop: 'remark', width: '120', label: '备注'},
      { prop: 'checkStatus', width: '120', label: '审核状态' }
    ]
    this.getInvoiceList()
  },

  methods: {
    /**
     * 抬头列表
     */
    getTitleList(loading = true) {
      if (this.titleShow) {
        this.loading = loading
        crmCustomerInvoiceInfoAPI({ customerId: this.id, pageType: 0 })
          .then(res => {
            this.loading = false
            this.titleList = res.data.list
            console.log(this.titleList)
          })
          .catch(() => {
            this.loading = false
          })
      }
    },

    /**
     * 发票列表
     */
    getInvoiceList(loading = true) {
      this.loading = loading
      const request = {
        customer: crmCustomerInvoiceAPI,
        contract: crmContractInvoiceAPI,
        receivables: crmContractQueryInvoiceAPI
      }[this.crmType]

      const params = { pageType: 0 }
      params[`${this.crmType}Id`] = this.id
      request(params)
        .then(res => {
          this.loading = false
          const resData = res.data || {}
          this.invoiceList = resData.list || []
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
    /**
     * 当某一行被点击时会触发该事件
     */
    handleRowClick(row, column, event) {
      if (column.property == 'invoiceApplyNumber') {
        this.showFullId = row.invoiceId
        this.showFullDetail = true
      }
    },

    /**
     * 新建发票和抬头
     */
    createClick(type) {
      if (type == 'invoice') {
        if (this.crmType === 'customer') {
          this.createAction = { type: 'relative', crmType: this.crmType, data: {
            customer: this.detail,
            contactsName: this.detail.contactsName,
            contactsMobile: this.detail.contactsMobile,
            contactsAddress: this.detail.contactsAddress
          }}
        } else if (this.crmType === 'contract') {
          this.createAction = { type: 'relative', crmType: this.crmType, data: {
            customer: {
              customerName: this.detail.customerName,
              customerId: this.detail.customerId
            },
            contract: this.detail,
            contactsName: this.detail.contactsName,
            contactsMobile: this.detail.contactsMobile,
            contactsAddress: this.detail.contactsAddress
          }}
        } else if (this.crmType === 'receivables') {
          this.createAction = { type: 'relative', crmType: this.crmType, data: {
            customer: {
              customerName: this.detail.customerName,
              customerId: this.detail.customerId
            },
            receivables: this.detail
          }}
        }
        this.isCreate = true
      } else if (type == 'title') {
        this.titleDetail = null
        this.titleCreateShow = true
      }
    },

    /**
     * 编辑操作
     */
    handleTitle(type, item) {
      if (type == 'edit') {
        this.titleDetail = item.row
        this.titleCreateShow = true
      } else if (type == 'delete') {
        this.$confirm('您确定要删除吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            crmInvoiceDeleteInvoiceInfoAPI({
              infoId: item.row.infoId
            })
              .then(res => {
                this.titleList.splice(item.$index, 1)
                this.$message.success('删除成功')
              })
              .catch(() => {})
          })
          .catch(() => {})
      }
    },

    /**
     * 发票格式化字段
     */
    invoicefieldFormatter(row, column) {
      if (column.property == 'invoiceType') {
        return {
          1: '增值税专用发票',
          2: '增值税普通发票',
          3: '增值税电子普通发票',
          4: '增值税电子专用发票'
        }[row[column.property]]
      } else if (column.property == 'contractMoney' || column.property == 'invoiceMoney' || column.property == 'thisRelationMoney') {
        return separator(row[column.property] || 0)
      }
      return row[column.property] === '' || row[column.property] === null ? '--' : row[column.property]
    },

    /**
     * 抬头格式化字段
     */
    titleFieldFormatter(row, column) {
      if (column.property === 'titleType') {
        return {
          1: '单位',
          2: '个人'
        }[row[column.property]]
      }
      return row[column.property] === '' || row[column.property] === null ? '--' : row[column.property]
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (column.property === 'invoiceApplyNumber' && Number(row.invoiceMoney) < 0) {
        return 'can-visit--underline-invoice can-visit--bold'
      } else if (column.property === 'invoiceApplyNumber' && row.invoiceStatus === 2) {
        return 'can-visit--underline-invoice can-visit--bold'
      } else if (column.property === 'invoiceApplyNumber' && [8].includes(row.checkStatus)) {
        return 'can-visit--underline-invoice can-visit--bold'
      } else if (column.property === 'invoiceApplyNumber' && [1, 10].includes(row.checkStatus) && !!row.isRefund) {
        return 'can-visit--underline-invoice can-visit--bold'
      } else if (column.property === 'invoiceApplyNumber' && [1, 10].includes(row.checkStatus) && !row.isRefund) {
        return 'can-visit--underline-invoice-1 can-visit--bold'
      } else if (column.property === 'invoiceApplyNumber' && !row.isRefund && ![1, 10].includes(row.checkStatus)) {
        return 'can-visit--underline-invoice-1 can-visit--bold'
      } else if (column.property === 'invoiceApplyNumber' && ![1, 10].includes(row.checkStatus) && !!row.isRefund) {
        return 'can-visit--underline-invoice-1 can-visit--bold'
      } else {
        return ''
      }
    },

    /**
     * @description: 状态颜色
     * @param {*} status
     * @return {*}
     */
    getStatusStyle(status) {
      return {
        backgroundColor: this.getStatusColor(status)
      }
    },

    /**
     * 详情操作
     */
    detailHandle(data) {
      if (data.type === 'delete') {
        this.getInvoiceList()
        this.$nextTick(() => {
          this.$bus.emit('crm-tab-num-update')
        })
      } else {
        this.getInvoiceList()
      }
    },

    /**
     * 开票操作
     */
    markReceivables(scope) {
      this.rowDetail = scope.row
      this.markShow = true
    }
  }
}
</script>
<style lang="scss" scoped>
@import "../styles/relativecrm.scss";
@import "../styles/table.scss";
</style>
