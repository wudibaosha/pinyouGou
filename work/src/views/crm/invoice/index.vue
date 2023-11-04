<!-- eslint-disable vue/valid-v-bind -->
<template>
  <div>
    <wk-page-header
      :title="config.showModuleName ? '发票管理' : ''"
      :help="getHelpObj(crmType, 'index')"
      :dropdowns="getDefaultHeaderHandes()"
      @command="pageHeaderCommand">
      <template slot="right">
        <el-button
          v-if="saveAuth"
          type="primary"
          @click="createClick">新建发票</el-button>
      </template>
    </wk-page-header>
    <div
      v-empty="!indexAuth"
      xs-empty-icon="nopermission"
      xs-empty-text="暂无权限"
      class="crm-container">
      <wk-table-header
        :search.sync="search"
        :tabs="sceneList"
        :active-tab.sync="sceneId"
        :selection-list="tableSelectionList"
        :operations="handleOperations"
        :condition-type-fun="undefined"
        :fields="getFilterFields"

        :props="tableHeaderProps.props"
        :filter-header-props="tableHeaderProps.filterHeaderProps"
        :filter-form-props="tableHeaderProps.filterFormProps"
        :scene-set-props="tableHeaderProps.sceneSetProps"
        :scene-create-props="tableHeaderProps.sceneCreateProps"
        @tabs-change="sceneSelect"
        @operations-click="tableOperationsClick"
        @event-change="tableHeaderHandle"
        @filter-change="handleFilter"
      />
      <!-- :row-key="`${crmType}Id`" ref="product"  @select="select" @select-all="selectAllFun"-->
      <el-table
        id="crm-table"
        v-loading="loading"
        :row-height="rowHeight"
        :data="list"
        :height="tableHeight"
        :cell-class-name="cellClassName"
        row-key="id"
        :class="crmTableClass"
        :stripe="tableStyleObj.stripe"
      
        :tree-props="{children: 'contractRelationList', hasChildren: 'hasChildren'}"
        use-virtual
        highlight-current-row
        style="width: 100%;"
        @row-click="handleRowClick"
        @sort-change="sortChange"
        @header-dragend="handleHeaderDragend"
        @selection-change="handleSelectionChange">
        <el-table-column
          show-overflow-tooltip
          reserve-selection
          type="selection"
          fixed
          align="center"
          width="55" />
        <el-table-column
          v-for="(item, index) in showfieldList"
          :key="index"
          :fixed="item.isLock === 1"
          :prop="item.prop"
          :label="item.label"
          :width="item.width"
          :class-name="item.width>60 ? 'column' : '' "
          :sortable="item.fieldName=='contractMoney'||item.fieldName=='invoiceMoney'||item.fieldName=='contractRelation'||item.fieldName=='truthRelationMoney'? false:'custom'"
          show-overflow-tooltip>
          <template v-if="item.width>60" slot="otherHeader" slot-scope="scope">
            <el-button
              :icon="item.isLock === 1 ? 'wk wk-unlock' : 'wk wk-lock'"
              class="el-lock-btn"
              type="text"
              @click.stop="fieldFixed(item)" />
            <el-button
              v-if="showFilter(item)"
              class="el-filter-btn"
              type="text"
              icon="wk wk-screening"
              @click.stop="showFilterClick(item)" />
          </template>
          <template slot-scope="{ row, column }">
            <template v-if="item.prop == 'checkStatus'">
              <span :style="getStatusStyle(row.checkStatus)" class="status-mark" />
              <span>{{ getStatusName(row.checkStatus) }}</span>
            </template>
            <template v-else-if="item.prop == 'invoiceType'">
              {{ fieldFormatter(row, column, row[column.property], item) }}
            </template>
            <template v-else-if="item.prop == 'rentStatus'">
              {{ row[column.property] == 0 ?'未报账':'已报账' }}
            </template>
           
            <wk-field-view
              v-else
              :props="item"
              :form-type="item.formType"
              :value="row[column.property]"
            >
              <template>
                {{ fieldFormatter(row, column, row[column.property], item) }}
              </template>
            </wk-field-view>
          </template>
        </el-table-column>
        <el-table-column />
        <el-table-column
          v-if="(canUpdateStatusOpen || canUpdateStatusReturn || canUpdateStatusReset || canRentStatus) && !isRelative"
          :resizable="false"
          label="操作"
          fixed="right"
          width="220">
          <template slot-scope="scope">
            <div v-if="scope.row.contractRelationList" style="display: flex;justify-content: space-between;width: 100%;">
              <!-- <el-button
              
                v-if="canUpdateStatus && scope.row.invoiceStatus != 2 && [1,10].includes(scope.row.checkStatus) &&
                  !scope.row.isRefund"
                :disabled="statusShow(scope.row)"
                type="primary-text"
                style="padding: 0;"
                @click.native="markReceivables(scope)">{{ scope.row.invoiceStatus == 1 ? '退票':'标记为开票' }}</el-button>
              -->
              <el-button
                v-if="canUpdateStatusReturn && scope.row.invoiceStatus == 1 && scope.row.invoiceStatus != 2 && [1,10].includes(scope.row.checkStatus) &&
                  !scope.row.isRefund"
                :disabled="statusShow(scope.row)"
                type="primary-text"
                style="padding: 0;"
                @click.native="markReceivables(scope)">{{'退票' }}</el-button>
             


                <el-button
                v-if="canUpdateStatusOpen && scope.row.invoiceStatus != 1 && scope.row.invoiceStatus != 2 && [1,10].includes(scope.row.checkStatus) &&
                  !scope.row.isRefund"
                :disabled="statusShow(scope.row)"
                type="primary-text"
                style="padding: 0;"
                @click.native="markReceivables(scope)">{{'标记为开票' }}</el-button>
             
              
                <el-button
                v-if="canUpdateStatusReset && scope.row.invoiceStatus == 1 && [1,10].includes(scope.row.checkStatus) &&
                  !scope.row.isRefund"
                :disabled="statusShow(scope.row)"
                type="primary-text"
                style="padding: 0;"
                @click.native="handleEditMarkReceivables(scope)">修改</el-button>
              <el-button
                v-if="(canUpdateStatusOpen || canUpdateStatusReturn) && scope.row.invoiceStatus == 2"
                type="primary-text"
                style="padding: 0;color: red;"
              >已退过票</el-button>
              <el-button
                v-if="(canUpdateStatusOpen || canUpdateStatusReturn) && scope.row.invoiceStatus == 0 && !!scope.row.isRefund && [1,10].includes(scope.row.checkStatus)"
                type="primary-text"
                style="padding: 0;color: red;"
              >退票生成记录</el-button>
              <el-button
                v-if="(canUpdateStatusOpen || canUpdateStatusReturn) && [3].includes(scope.row.checkStatus) && !scope.row.isRefund"
                type="primary-text"
                style="padding: 0;color: #f5bd00;"
              >审核中...</el-button>
              <el-button
                v-if="(canUpdateStatusOpen || canUpdateStatusReturn) && [3].includes(scope.row.checkStatus) && !!scope.row.isRefund"
                type="primary-text"
                style="padding: 0;color: #f5bd00;"
              >退票审核中...</el-button>
              <el-button
                v-if="(canUpdateStatusOpen || canUpdateStatusReturn) && [8].includes(scope.row.checkStatus)"
                type="primary-text"
                style="padding: 0;color: red;"
              >已作废</el-button>
              <el-button
                v-if="canRentStatus && scope.row.invoiceStatus != 2 && !scope.row.isRefund"
                :disabled="scope.row.rentStatus == 1"
                type="primary-text"
                style="padding: 0;"
                @click.native="setRent(scope)">{{ scope.row.rentStatus == 0 ? '填写报账信息':'已填写报账信息' }}</el-button>
              <el-button
                v-if="canRentStatus && scope.row.invoiceStatus == 0 && !!scope.row.isRefund && [1,10].includes(scope.row.checkStatus)"
                type="primary-text"
                style="padding: 0;color: red;"
                @click.native="setRentNum(scope)">修改发票号码</el-button>
            </div>
            <div v-else :style="[{display: 'flex',width: '100%'},{'justify-content':(scope.row&&scope.row.contractRelationList? 'space-between' : 'center')}]">--</div>
          </template>
        </el-table-column>

        <wk-empty
          slot="empty"
          :props="{
            buttonTitle: '新建发票',
            showButton: saveAuth
          }"
          @click="createClick"
        />
        <field-set
          slot="other"
          :crm-type="crmType"
          @change="setSave" />
      </el-table>
      <div class="p-contianer">
        <el-dropdown trigger="click" placement="top">
          <el-button class="dropdown-btn"><i class="el-icon-s-fold" /></el-button>
          <el-dropdown-menu slot="dropdown" class="wk-table-style-dropdown-menu">
            <el-dropdown-item>
              <span @click.stop><el-switch v-model="tableStyleObj.rightBorderShow" />显示竖向分割线</span>
            </el-dropdown-item>
            <el-dropdown-item>
              <span @click.stop><el-switch v-model="tableStyleObj.bottomBorderShow" />显示横向分割线</span>
            </el-dropdown-item>
            <el-dropdown-item>
              <span @click.stop><el-switch v-model="tableStyleObj.stripe" />显示斑马纹</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-pagination
          :current-page="currentPage"
          :page-sizes="pageSizes"
          :page-size.sync="pageSize"
          :total="total"
          :pager-count="5"
          class="p-bar"
          layout="prev, pager, next, sizes, total, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />

          <span class="money-bar">{{ moneyDes }}<i v-if="showBottomMoney" class="wk wk-icon-fill-help wk-help-tips" data-type="11" data-id="133" /></span>
      </div>
    </div>
    <!-- 退票原因 -->
    <el-dialog
      title="退票原因"
      :visible.sync="refundVisible"
      width="500px"
    >
      <el-select
        v-model="refundReason"
        placeholder="请选择退票原因"
        style="width: 100%;">
        <el-option
          v-for="(item, index) in refundReasonOptions"
          :key="index"
          :label="item.label"
          :value="item.value" />
      </el-select>
      <el-input
        v-model="refundReasonText"
        type="textarea"
        style="margin-top: 20px;"
        placeholder="请输入退票理由" />
      <span slot="footer" class="dialog-footer">
        <el-button @click="refundVisible = false">取 消</el-button>
        <el-button type="primary" @click="refundTicket">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 修改退票发票号码 -->
    <el-dialog
      title="修改发票号码"
      :visible.sync="reNumVisible"
      width="30%"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="105px">
        <el-form-item label="发票号码" prop="invoiceNumber">
          <el-input v-model="form.invoiceNumber" />
        </el-form-item>
        <el-form-item label="实际开票日期" prop="realInvoiceDate">
          <el-date-picker
            v-model="form.realInvoiceDate"
            style="width: 100%;"
            value-format="yyyy-MM-dd"
            type="date"
            placeholder="选择日期" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="reNumVisible = false">取 消</el-button>
        <el-button type="primary" @click="reNumTicket">确 定</el-button>
      </span>
    </el-dialog>

    <create
      v-if="isCreate"
      @save-success="refreshList"
      @close="isCreate = false" />
    <!-- 标记为开票 -->
    <mark-invoice
      v-if="markShow"
      :visible.sync="markShow"
      :reset="isResetInvoice"
      :detail="rowDetail"
      @change="handleHandle({
        type: 'reset_invoice_status'
      })"
    />
    <rent-msg
      v-if="rentMsgShow"
      :visible.sync="rentMsgShow"
      :detail="rowDetail"
      @change="handleHandle({
        type: 'reset_invoice_status'
      })"
    />

    <!-- 相关详情页面 -->
    <c-r-m-all-detail
      :id.sync="rowID"
      :visible.sync="showDview"
      :crm-type="rowType"
      :page-list="crmType == rowType ? list : []"
      :page-index.sync="rowIndex"
      class="d-view"
      @handle="handleHandle" />

    <!-- 转移 -->
    <transfer-handle
      v-if="transferDialogShow"
      :props="transferHandleProps"
      :dialog-visible.sync="transferDialogShow"
      @handle="handleHandle" />
  </div>
</template>

<script>
import {
  crmInvoiceDeleteIdsAPI,
  crmInvoiceTransferAPI,
  crmInvoiceStatusUpdateReturnAPI,
  crmUpdateInvoiceNumberAPI,
  crmInvoiceExcelExportAPI
} from '@/api/crm/invoice'
import {
  crmQueryDishonorReasonAPI
} from '@/api/admin/crm'

import Create from './Create'
import MarkInvoice from './components/MarkInvoice'
import RentMsg from './components/RentMsg'
import TransferHandle from '@/components/Page/SelectionHandle/TransferHandle' // 转移
import CRMAllDetail from '@/views/crm/components/CRMAllDetail'

import { floatAdd } from '@/utils'
import TableMixin from '../mixins/Table'
import { getFormFieldShowName } from '@/components/NewCom/WkForm/utils'
import { isArray } from '@/utils/types'
import { separator } from '@/filters/vueNumeralFilter/filters'

export default {
  name: 'InvoiceIndex', // 发票
  components: {
    Create,
    MarkInvoice,
    TransferHandle,
    CRMAllDetail,
    RentMsg
  },
  mixins: [TableMixin],
  props: {
    isRelative: Number // 关联发票时隐藏操作部分
  },
  data() {
    return {
      moneyData: null, // 合同列表金额
      crmType: 'invoice',
      list: [],
      selectionList: [], // 勾选数据 用于全局导出
      isCreate: false,
      rowDetail: {},
      markShow: false,
      isResetInvoice: false,
      // 转移
      transferHandleProps: {},
      transferDialogShow: false,
      showDview: false,
      rentMsgShow: false,
      refundVisible: false,
      reNumVisible: false,
      refundReason: '', // 退票原因
      refundReasonText: '', // 退票理由
      refundReasonOptions: null,
      form: {
        invoiceNumber: '',
        invoiceId: null,
        isRefund: null,
        realInvoiceDate: ''
      },
      rules: {
        invoiceNumber: [
          { required: true, message: '请填写发票号码', trigger: 'change' }
        ],
        realInvoiceDate: [
          { required: true, message: '请选择实际开票日期', trigger: 'change' }
        ]
      },
      ticketRow: null// 退票列表信息
    }
  },
  computed: {
    showBottomMoney() {
      return !this.config.isSelect
    },

    moneyDes() {
      console.log(this.moneyData)
      // 选择数据，隐藏金额信息
      if (!this.showBottomMoney) {
        return ''
      }

      if (!this.moneyData || JSON.stringify(this.moneyData) == '{}') {
        return ''
      }

       const canCheckInvoiceMoney = this.moneyData.hasOwnProperty('invoiceMoney')
    
      let invoiceMoney = 0.0
      

      // 未勾选展示发票总金额信息
      if (this.selectionList.length == 0) {
        invoiceMoney = this.moneyData.invoiceMoney
      
      } else {
        for (let index = 0; index < this.selectionList.length; index++) {
          const element = this.selectionList[index]
          // 1 审核通过的合同
          if (element.checkStatus == 1) {
            if (canCheckInvoiceMoney) {
              invoiceMoney = floatAdd(invoiceMoney, parseFloat(element.thisRelationMoney || 0))
            }
          }
        }

        invoiceMoney = invoiceMoney.toFixed(2)
      }

      let moneyDes = ''
      if (canCheckInvoiceMoney) {
        moneyDes = `项目实际开票总金额：${separator(invoiceMoney || 0)}`
      }

      return moneyDes
    },



    // 是否能操作rentStatus
    canUpdateStatus() {
      console.log(this.crm[this.crmType])
      return this.crm && this.crm[this.crmType] && this.crm[this.crmType].updateInvoiceStatus
    },


    canUpdateStatusOpen() {
      return this.crm && this.crm[this.crmType] && this.crm[this.crmType].updateInvoiceStatusOpen
    },

    canUpdateStatusReturn() {                           
      return this.crm && this.crm[this.crmType] && this.crm[this.crmType].updateInvoiceStatusReturn
    },

    canUpdateStatusReset() {
      console.log(this.crm[this.crmType])                                 
      return this.crm && this.crm[this.crmType] && this.crm[this.crmType].updateInvoiceStatusReset
    },
    // rent
    canRentStatus() {
      return this.crm && this.crm[this.crmType] && this.crm[this.crmType].rentStatus
    },
    showfieldList() {
      console.log(this.fieldList)
      return this.fieldList.filter(item => item.prop !== 'invoiceStatus')
    },
    // 可操作选项
    handleOperations() {
      return this.getOperations([
        'transfer',
        'export',
        'delete'
      ])
    }
  },
  watch: {},
  created() {
  },

  beforeDestroy() {},
  methods: {
    /**
     * @description: 表头事件
     * @param {*} type
     * @return {*}
     */
    tableOperationsClick(type) {
      if (type === 'transfer') {
        this.transferHandleProps = {
        // 场景编辑请求
          request: crmInvoiceTransferAPI,
          params: { ids: this.selectionList.map(item => item[this.crmType + 'Id']) },
          showRemoveType: false, // 是否展示移除操作类型
          // 帮助提示
          help: this.getHelpObj(this.crmType, 'transfer')
        }
        this.transferDialogShow = true
      } else if (type === 'export') {
        // 成交状态
        const extendIdList = []
        this.selectionList.forEach((item) => {
          if (isArray(item.contractRelationList) && item.contractRelationList.length > 0) {
            item.contractRelationList.forEach((son) => {
              extendIdList.push({
                contractId: son.contractId,
                invoiceId: son.invoiceId
              })
            })
          } else {
            extendIdList.push({
              contractId: item.contractId,
              invoiceId: item.invoiceId
            })
          }
        })
        this.$wkExport.export(this.crmType, {
          params: {
            ids: this.selectionList.map(item => item[`${this.crmType}Id`]),
            extendIdList: extendIdList
          },
          request: crmInvoiceExcelExportAPI
        })
      } else if (type == 'delete') {
        this.$confirm('确定要删除吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            crmInvoiceDeleteIdsAPI(this.selectionList.map(item => item.invoiceId))
              .then(res => {
                this.loading = false
                this.$message({
                  type: 'success',
                  message: '删除成功'
                })
                this.handleHandle({
                  type: 'delete'
                })
              })
              .catch(() => {
                this.loading = false
              })
          })
          .catch(() => {})
      } else if (type == 'reset_invoice_status') {
        this.rowDetail = this.selectionList[0]
        this.isResetInvoice = true
        this.markShow = true
      }
    },

    statusShow(status) {
      return ![1, 10].includes(status.checkStatus)
    },

    /**
     * 创建点击
     */
    createClick() {
      this.isCreate = true
    },

    /**
     * 格式化字段
     */
    fieldFormatter(row, column, cellValue, field) {
      if (column.property == 'invoiceType') {
        return {
          1: '增值税专用发票',
          2: '增值税普通发票',
          3: '增值税电子普通发票',
          4: '增值税电子专用发票'
        }[row[column.property]]
      }

      if (field) {
       
        return getFormFieldShowName(field.formType, row[column.property])
      }
      return row[column.property] === '' || row[column.property] === null ? '--' : row[column.property]
    },

    /**
     * 开票操作
     */
    markReceivables(scope) {
      if (scope.row.invoiceStatus == 1) {
        this.refundReason = ''
        this.refundReasonText = ''
        this.getRefundReasonList()
        this.ticketRow = scope
        this.refundVisible = true
        // this.$confirm('确认退票?', '提示', {
        //   confirmButtonText: '确定',
        //   cancelButtonText: '取消',
        //   type: 'warning'
        // }).then(() => {
        //   const params = {}
        //   params.invoiceStatus = 0
        //   params.invoiceId = scope.row.invoiceSonId ? scope.row.invoiceSonId : scope.row.invoiceId
        //   crmInvoiceStatusUpdateAPI(params).then(res => {
        //     this.handleHandle({
        //       type: 'reset_invoice_status'
        //     })
        //   })
        // })
      } else {
        this.rowDetail = scope.row
        this.isResetInvoice = false
        this.markShow = true
      }
    },
    /**
     * 修改开票
     */
    handleEditMarkReceivables(scope) {
      this.rowDetail = scope.row
      this.isResetInvoice = true
      this.markShow = true
    },
    // 退票
    refundTicket() {
      if (this.refundReason) {
        this.$confirm('确认退票?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          const params = {}
          params.invoiceStatus = 2
          params.invoiceId = this.ticketRow.row.invoiceSonId ? this.ticketRow.row.invoiceSonId : this.ticketRow.row.invoiceId
          params.dishonorReason = this.refundReason + ';' + this.refundReasonText
          crmInvoiceStatusUpdateReturnAPI(params).then(res => {
            this.refundVisible = false
            this.$message({
              type: 'success',
              message: '操作成功'
            })
            this.handleHandle({
              type: 'reset_invoice_status'
            })
          })
        })
      } else {
        this.$message.error('请选择退票理由')
      }
    },

    setRentNum(data) {
      this.form = {
        invoiceNumber: '',
        invoiceId: '',
        isRefund: '',
        realInvoiceDate: ''
      }
      this.reNumVisible = true
      this.form.invoiceId = data.row.invoiceId
      this.form.isRefund = data.row.isRefund
      this.form.realInvoiceDate = data.row.realInvoiceDate
    },

    reNumTicket() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          console.log(this.form)
          crmUpdateInvoiceNumberAPI(this.form).then(res => {
            this.$message.success('修改成功')
            this.reNumVisible = false
            this.getList()
          }).catch(() => {
            this.reNumVisible = false
          })
        }
      })
    },

    /**
     * 获取退票原因
     */
    getRefundReasonList() {
      crmQueryDishonorReasonAPI()
        .then(res => {
          this.refundReasonOptions = res.data.map(item => {
            return {
              value: item,
              label: item
            }
          })
        })
        .catch(() => {})
    },

    /**
     * 报账信息
     */
    setRent(scope) {
      this.rowDetail = scope.row
      this.rentMsgShow = true
    },

    /**
     * 改变负责人筛选条件
     */
    changeUserCell(data) {
      this.filterParams.ownerUserId = data.value
      this.refreshList()
    },

    /**
     * 列表操作
     */
    handleCommand(command) {

    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      // if (column.property === 'invoiceApplyNumber' && [1, 10].includes(row.checkStatus) && !!row.isRefund) {
      //   return 'can-visit--underline-invoice can-visit--bold'
      // } else if (column.property === 'invoiceApplyNumber' && [1, 10].includes(row.checkStatus) && !row.isRefund) {
      //   return 'can-visit--underline-invoice-1 can-visit--bold'
      // } else if (column.property === 'invoiceApplyNumber' && !row.isRefund && ![1, 10].includes(row.checkStatus)) {
      //   return 'can-visit--underline can-visit--bold'
      // } else if (column.property === 'invoiceApplyNumber' && ![1, 10].includes(row.checkStatus) && !!row.isRefund) {
      //   return 'can-visit--underline-invoice-round can-visit--bold'
      // }
      if (column.property === 'invoiceApplyNumber' && (Number(row.invoiceMoney) < 0 || Number(row.checkStatus) == 2)) {
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
      } else if (
        column.property === 'customerName' ||
        column.property === 'contractNum' ||
        column.property === 'receivablesNum'
      ) {
        return 'can-visit--underline'
      } else if (column.property === 'relationContractIdsNum' && row.contractId) {
        return 'can-visit--underline'
      } else {
        return ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/table.scss";

.crm-container {
  /deep/ .cell {
    display: flex;
    justify-content: start;
  }

  .status-mark {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin: 8px 2px;
    border-radius: 4px;
  }
}

.invoice-status {
  color: red;
}

.field-set-wrap {
  z-index: 10;
}
</style>