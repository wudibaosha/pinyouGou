<template>
  <div
    class="container"
    xs-empty-icon="nopermission"
    xs-empty-text="暂无权限">
    <div style="float: right;margin-bottom: 10px;">
      <el-button
        icon="el-icon-plus"
        @click="createProjectStart">新建项目转移流程</el-button>
    </div>
    <el-table
      v-loading="loading"
      :data="list"
      :cell-style="cellStyle"
      :cell-class-name="cellClassName"
      :header-cell-style="headerCellStyle"
      height="250"
      stripe
      style="margin-right: 3px;"
      highlight-current-row
      @row-click="handleRowClick">
      <el-table-column
        v-for="(item, index) in fieldList"
        :key="index"
        :prop="item.prop"
        :label="item.label"
        align="center"
        header-align="center"
        show-overflow-tooltip>
        <template slot-scope="{ row, column, $index }">
          <template v-if="item.prop == 'examineStatus'">
            <span :style="getStatusStyle(row.examineStatus)" class="status-mark" />
            <span>{{ getStatusName(row.examineStatus) }}</span>
          </template>
          <wk-field-view
            v-else
            :props="item"
            :form-type="item.formType"
            :value="row[column.property]"
          >
            <template slot-scope="{ data }">
              {{ fieldFormatter(row, column, row[column.property], item) }}
            </template>
          </wk-field-view>
        </template>
      </el-table-column>
    </el-table>
    <div style="float: right;margin-top: 8px;margin-right: 10px;">
      <el-pagination
        :current-page="currentPage"
        :total="total"
        :pager-count="5"
        layout="prev, pager, next, total, jumper"
        @current-change="handleCurrentChange" />
    </div>
    <examine-create-view
      v-if="isCreate"
      :category-id="createInfo.categoryId"
      :type="createInfo.type"
      :category-title="createInfo.categoryTitle"
      :action="createAction"
      :is-customer-detail="true"
      :detail="detail"
      @save-success="refreshList"
      @hiden-view="createHideView" />

    <c-r-m-full-screen-detail
      :id="rowID"
      :visible.sync="showFullDetail"
      :crm-type="rowType"
      @handle="detailHandle" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { examinesQueryExamineIdAPI } from '@/api/examine'
import { oaExamineCustomerIndexAPI } from '@/api/oa/examine'
import { getFormFieldShowName } from '@/components/NewCom/WkForm/utils'
import ExamineCreateView from '@/views/oa/examine//components/ExamineCreateView'
import WkFieldView from '@/components/NewCom/WkForm/WkFieldView'
import CheckStatusMixin from '@/mixins/CheckStatusMixin'

export default {
  name: 'ProjectTransfer',
  components: {
    ExamineCreateView,
    CRMFullScreenDetail: () => import('@/components/CRMFullScreenDetail'),
    WkFieldView
  },
  mixins: [CheckStatusMixin],
  props: {
    show: Boolean,
    detail: Object
  },
  data() {
    return {
      loading: false,
      list: [],
      fieldList: [],
      currentPage: 1,
      pageSizes: 15,
      total: null,

      createAction: { type: 'save' },
      createInfo: null,
      isCreate: false,
      showFullDetail: false,
      rowID: '',
      rowType: ''
    }
  },
  inject: ['rootTabs'],
  computed: {
    ...mapGetters(['crm'])
  },
  watch: {
    show: {
      handler(val) {
        this.getDetail()
      },
      deep: true,
      immediate: true
    },
    'rootTabs.currentName'(val) {
      if (val === 'ProjectStart') {
        this.getDetail()
      }
    }
  },
  mounted() {
    this.fieldList = [
      {
        prop: 'contractNum',
        label: '转出合同编号',
        width: '300'
      },
      // {
      //   prop: 'categoryTitle',
      //   label: '审批类型',
      //   width: '200'
      // },
      {
        prop: 'contractName',
        label: '合同名称',
        width: '200'
      },
      // {
      //   prop: 'examineStatus',
      //   label: '审批状态',
      //   width: '200'
      // },
      // {
      //   prop: 'customerName',
      //   label: '客户联系人',
      //   width: '200'
      // },
      {
        prop: 'contractMoney',
        label: '合同金额',
        width: '200'
      }, {
        prop: 'receivablesMoney',
        label: '回款金额',
        width: '200'
      }, {
        prop: 'receivablesMoney',
        label: '转出金额',
        width: '200'
      }, {
        prop: 'inToContractNum',
        label: '转入合同编号',
        width: '300'
      }, {
        prop: 'intoContractName',
        label: '转入合同名称',
        width: '300'
      }, {
        prop: 'intoContractMoney',
        label: '转入合同金额',
        width: '300'
      }, {
        prop: 'intoReceivablesMoney',
        label: '转入回款金额',
        width: '300'
      }, {
        prop: 'intoMoney',
        label: '转入金额',
        width: '200'
      },
      // {
      //   prop: 'noReceivablesMoney',
      //   label: '未回款金额',
      //   width: '200'
      // },
      {
        prop: 'applyTime',
        label: '申请时间',
        width: '200'
      }, {
        prop: 'applyUserName',
        label: '申请人',
        width: '200'
      }
      //  {
      //   prop: 'applyType',
      //   label: '申请类型',
      //   width: '200'
      // }, {
      //   prop: 'applyMoney',
      //   label: '申请金额',
      //   width: '200'
      // }, {
      //   prop: 'invoicingTime',
      //   label: '预计开票时间',
      //   width: '200'
      // }, {
      //   prop: 'receivablesTime',
      //   label: '预计回款时间',
      //   width: '200'
      // }
    ]
  },
  methods: {

    /**
     * 详情操作
     */
    detailHandle(data) {
      if (data.type === 'delete') {
        this.getDetail()
        this.$nextTick(() => {
          this.$bus.emit('crm-tab-num-update')
        })
      } else {
        this.getDetail()
      }
    },

    /**
     * 刷新列表
     */
    refreshList() {
      this.currentPage = 1
      this.list = []
      this.getDetail()
    },

    /**
     * 创建关闭
     */
    createHideView() {
      this.isCreate = false
    },

    /**
     * 新建项目转移
     */
    createProjectStart() {
      this.isCreate = true
    },

    /**
     * 更改当前页数
     * @param {*} val
     */
    handleCurrentChange(val) {
      this.currentPage = val
      this.getDetail()
    },

    /**
     * 状态颜色
     * @param {*} status
     */
    getStatusStyle(status) {
      return {
        backgroundColor: this.getStatusColor(status)
      }
    },

    /**
     * 格式化字段
     * @param {*} row
     * @param {*} column
     * @param {*} cellValue
     */
    fieldFormatter(row, column, cellValue, field) {
      // 如果需要格式化
      if (column.property === 'isTransform') {
        return ['否', '是'][row[column.property]] || '--'
      }

      if (field) {
        return getFormFieldShowName(field.formType, row[column.property], '--', field)
      }
      return row[column.property] === '' || row[column.property] === null ? '--' : row[column.property]
    },

    getDetail() {
      this.loading = true
      examinesQueryExamineIdAPI({
        oaType: 10
      })
        .then(res => {
          const projectStartExamine = res.data
          this.createInfo = projectStartExamine
          this.createInfo.type = 10
          this.createInfo.categoryId = projectStartExamine.examineId
          this.createInfo.categoryTitle = projectStartExamine.examineName
          const examineId = projectStartExamine.examineId
          oaExamineCustomerIndexAPI({
            limit: 15,
            page: this.currentPage,
            status: '',
            categoryId: examineId,
            customerId: this.detail.customerId
          }).then(res => {
            this.list = res.data.list
            this.total = res.data.totalRow
            this.loading = false
          }).catch(() => {
            this.loading = false
          })
        })
        .catch(() => {
          this.loading = false
        })
    },

    // 当某一行被点击时会触发该事件
    handleRowClick(row, column, event) {
      if (column.property == 'contractNum') {
        this.rowID = row.contractId
        this.rowType = 'contract'
        this.showFullDetail = true
      } else if (column.property == 'categoryTitle') {
        this.rowID = row.examineId
        this.rowType = 'examine'
        this.showFullDetail = true
      }
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (column.property === 'contractNum' || column.property === 'categoryTitle') {
        return 'can-visit--underline'
      } else {
        return ''
      }
    },

    /** 通过回调控制style */
    cellStyle({ row, column, rowIndex, columnIndex }) {
      return { fontSize: '12px', textAlign: 'center', cursor: 'pointer' }
    },

    headerCellStyle({ row, column, rowIndex, columnIndex }) {
      return { fontSize: '12px', textAlign: 'center' }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../../styles/table.scss";

.container {
  position: relative;
}

.wk-customer {
  font-size: 12px;
  color: $--color-primary;
}

.el-table {
  border-top: 1px solid $--border-color-base;
}
</style>
