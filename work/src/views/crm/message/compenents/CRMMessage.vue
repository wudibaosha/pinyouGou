<template>
  <div
    v-if="(!lazy || loaded) || show"
    v-show="show"
    class="ec-container">
    <div class="title">{{ infoTitle }}
      <el-tooltip
        v-if="infoTips"
        :content="infoTips"
        effect="dark"
        placement="top">
        <i class="wk wk-help wk-help-tips" />
      </el-tooltip>
    </div>
    <div class="option-bar">
      <el-tabs
        v-if="showOptions"
        v-model="optionsType"
        @tab-click="refreshList">
        <el-tab-pane
          v-for="item in options"
          :key="item.value"
          :label="item.name"
          :name="item.value">
          <template slot="label">
            <span>{{ item.name }}</span><span
              v-if="item.num"
              style="position: absolute;top: 11px;"
              class="el-badge__content el-badge__content--primary">{{ item.num }}</span>
          </template>
        </el-tab-pane>
      </el-tabs>
      <flexbox
        v-if="selectionList.length == 0"
        justify="space-between"
        class="selection-bar">
        <div>
          <el-select
            v-if="showSubType"
            v-model="isSubType"
            style="width: 200px;"
            mode="no-border"
            @change="refreshList">
            <el-option
              v-for="item in [{name: '我的', value: 1}, {name: '我下属的', value: 2}]"
              :key="item.value"
              :label="item.name"
              :value="item.value" />
          </el-select>
        </div>

        <div>
          <el-button
            v-if="showFilterView"
            type="subtle"
            class="filter-button"
            icon="wk wk-screening"
            @click="getFilterFieldInfo">高级筛选</el-button>
          <!-- <el-button
            :disabled="!canMark"
            type="subtle"
            icon="wk wk-tag"
            @click="allMarkReadClick">全部标记已处理</el-button> -->
        </div>
      </flexbox>
      <flexbox
        v-else
        class="selection-bar">
        <div class="selected—title">已选中<span class="selected—count">{{ selectionList.length }}</span>项</div>
        <flexbox class="selection-items-box">
          <el-button
            v-for="(item, index) in selectionButtonList"
            :key="index"
            :icon="item.icon"
            size="medium"
            @click="selectionBarClick(item.type)">{{ item.name }}</el-button>
        </flexbox>
      </flexbox>
    </div>
    <filter-content
      v-if="filterObj.form && filterObj.form.length > 0"
      :obj="filterObj"
      @delete="handleDeleteField" />
    <div v-loading="loading" style="position: relative;">
      <el-table
        id="crm-table"
        :data="list"
        :height="tableHeight"
        :cell-class-name="cellClassName"
        :class="WKConfig.tableStyle.class"
        :stripe="WKConfig.tableStyle.stripe"
        highlight-current-row
        style="width: 100%;"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange">
        <el-table-column
          :selectable="selectionDisabled"
          show-overflow-tooltip
          fixed
          type="selection"
          align="center"
          width="55" />
        <el-table-column
          v-if="showCall"
          :resizable="false"
          prop="call"
          fixed
          label=""
          width="55">

         

          <template
            slot="header"
            slot-scope="slot">
            <i
              class="el-icon-phone"
              style="color: #2486e4;cursor: not-allowed; opacity: 0.5;" />
          </template>
          <template slot-scope="scope">
            <el-popover
              placement="right"
              width="500"
              popper-class="no-padding-popover"
              trigger="click"
              @show="showData(scope.row)"
              @hiden="showCount = -1">
              <call-center
                :scope="scope"
                :show="showCallCenter(scope.row)"
                :crm-type="rowType"
                @changeType="changeCRMType" />
              <el-button
                slot="reference"
                :style="{'opacity' :scope.$index >= 0 ? 1 : 0}"
                type="primary"
                class="wk-call-btn"
                icon="el-icon-phone"
                circle
                @click.stop="callCheckClick($event,scope,scope.$index)" />
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column
          v-for="(item, index) in fieldList"
          :fixed="item.fieldName == 'invoiceApplyNumber'"
          :key="`column${index}`"
          :prop="item.field"
          :label="item.name"
          :min-width="item.width"
          show-overflow-tooltip>

      
          <template slot-scope="{ row, column, $index }">
            <template v-if="item.field == 'dealStatus'">
              <span :class="row[item.field] | dealIcon" />
              <span>{{ row[item.field] | dealName }}</span>
            </template>
            <template v-else-if="item.field == 'status' && crmType === 'customer'">
              <i
                v-if="row.status == 2"
                class="wk wk-circle-password customer-lock" />
            </template>
            <template v-else-if="item.field == 'checkStatus' || item.field == 'examineStatus'">
              <span :style="getStatusStyle(row[item.field])" class="status-mark" />
              <span>{{ getStatusName(row[item.field]) }}</span>
            </template>
            <template v-else-if="item.field == 'invoiceType'">
              {{ fieldFormatter(row, column, row[column.property], item) }}
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
        <el-table-column
          v-if="canUpdateStatus"
          :resizable="false"
          label="操作"
          fixed="right"
          width="240">
          <template slot-scope="{ row }">
            <el-tag 
            size="medium"
            v-if="row.fieldTag!='' && row.fieldTag!=null"
              closable
              :disable-transitions="false"
              @close="handleClose(row)">
              {{row.fieldTag}}
            </el-tag>  
            <el-input
              class="input-new-tag"
              v-if="inputVisible && (row.invoiceId == selectedInvoiceId || row.contractId == selectedInvoiceId) && (crmType == 'invoice'||crmType == 'contract')"
              v-model="inputValue"
              ref="saveTagInput"
              size="small"
              @keyup.enter.native="handleInputConfirm"
              @blur="handleInputConfirm(row)">
            </el-input>
            <el-button v-if="(crmType == 'invoice'||crmType == 'contract') && (row.fieldTag=='' || row.fieldTag==null) && (inputVisible == false || row.invoiceId != selectedInvoiceId) " class="button-new-tag" size="small" @click="showInput(row)">添加标签</el-button>
         
            <el-button
              type="success"
              size="medium"
              icon="wk wk-success"
              @click="examineHandle(1, row)">通过</el-button>
            <el-button
              type="danger"
              size="medium"
              icon="wk wk-close"
              @click="examineHandle(2, row)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="p-contianer">
      <el-pagination
        :current-page="currentPage"
        :page-sizes="pageSizes"
        :page-size.sync="pageSize"
        :total="total"
        class="p-bar"
        background
        layout="prev, pager, next, sizes, total, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
    </div>

    <filter-form
      :field-list="filterFieldList"
      :dialog-visible.sync="showFilter"
      :obj="filterObj"
      :props="filterFormProps"
      @filter="handleFilter" />

    <!-- 相关详情页面 -->
    <c-r-m-all-detail
      v-if="crmType !== 'examine' || !isCustomer"
      :id="rowID"
      :visible.sync="showDview"
      :crm-type="rowType"
      :model-data="modelData"
      @handle="getList" />
    <!-- 列表操作 -->
    <examine-detail
      v-if="crmType === 'examine' && showDview && isCustomer"
      :id="rowID"
      :no-listener-class="['el-table__body']"
      class="d-view"
      @hide-view="showDview=false"
      @handle="getList" />

    <!-- 审批操作 -->
    <examine-handle
      v-if="examineHandleShow"
      :field-form="fieldForm"
      :field-list="fieldList2"
      :show="examineHandleShow"
      :status="examineHandleInfo.status"
      @close="examineHandleShow = false"
      @confirm="examinConfirm" />
  </div>
</template>

<script>
import crmTypeModel from '@/views/crm/model/crmTypeModel'
import { filterIndexfieldsAPI } from '@/api/crm/common'

import { filedGetFieldAPI } from '@/api/crm/common'
import { crmLeadsSetFollowAPI } from '@/api/crm/leads'
import { crmCustomerSetFollowAPI } from '@/api/crm/customer'
import { crmInvoiceUpdateTag, crmInvoiceDeleteTag } from '@/api/crm/invoice'
import { crmContractUpdateTag, crmContractDeleteTag } from '@/api/crm/contract'
import {
  crmMessagAllDealAPI,
  crmMessagzealByIdAPI
} from '@/api/crm/message'
import { examineRecordBatchAuditAPI } from '@/api/examine'
import { crmContractBatchUpdatePriceRangeAPI } from '@/api/crm/contract'
import FilterForm from '@/components/Page/FilterForm'
import FilterContent from '@/components/Page/FilterForm/FilterContent'
import CRMAllDetail from '@/views/crm/components/CRMAllDetail'
import ExamineDetail from '@/views/oa/examine/components/ExamineDetail'
import WkFieldView from '@/components/NewCom/WkForm/WkFieldView'
import TableMixin from '@/views/crm/mixins/Table'
import CallCenter from '@/callCenter/CallCenter'
import MessageTableMixin from '../mixins/MessageTable'
import ExamineHandle from '@/components/Examine/ExamineHandle'

export default {
  /** 客户管理 的待审核系统 */
  name: 'CRMMessage',

  components: {
    FilterForm,
    FilterContent,
    CRMAllDetail,
    ExamineDetail,
    CallCenter,
    WkFieldView,
    ExamineHandle
    
  },
  filters: {
    dealIcon(statu) {
      return statu == 1 ? 'deal-suc' : 'deal-un'
    },

    dealName(statu) {
      return statu == 1 ? '已成交' : '未成交'
    }
  },

  mixins: [MessageTableMixin],

  props: {
    // crm类型
    crmType: {
      type: String,
      default: ''
    },
    // crm某个类型下的类型数据
    infoType: {
      type: String,
      default: ''
    },

    infoTitle: {
      type: String,
      default: ''
    },

    infoTips: {
      type: String,
      default: ''
    },

    // 表头
    infoHeads: Array,

    // 标示信息
    iconData: Object,

    // 展示的时候 才发请求
    show: Boolean,

    // 待办模块 用于 标记
    model: Number,
    lazy: Boolean
  },

  data() {
    return {
      fieldForm: {},
      fieldList2:[],
      fieldList: [],
      inputValue: '',
      selectedInvoiceId: '',
      selectedContractId: '',
      inputVisible: false,
      optionsType: '0',
      options: [],
      isSubType: 1, // 是否是下属
      /** 高级筛选 */
      showFilter: false, // 控制筛选框
      filterFieldList: [],
      filterObj: { form: [] }, // 筛选确定数据
      /** 勾选数据操作 */
      selectionList: [], // 勾选的数据
      /** 控制详情展示 */
      rowID: '', // 行信息
      rowType: '', // 详情类型
      showDview: false,
      showCount: -1, // 储存客户id作为展示的标识
      modelData: {}, // 储存电话信息作为详情展示通话的依据
      loaded: false,
      // 审批
      examineHandleInfo: { status: 1 }, // 1 审核通过 2 审核拒绝 4 已撤回
      examineHandleShow: false, // 审核操作
      filterFormProps: {
        showExport: false, // 控制是否展示外露按钮
        showSaveScene: false
      },
      isCustomer: false
    }
  },
  computed: {
    // 展示勾选框
    showFollow() {
      if (this.infoType == 'followLeads' || this.infoType == 'followCustomer') {
        return true
      }

      return false
    },

    // 操作按钮列表
    selectionButtonList() {
      const temps = this.showFollow ? [{
        name: '已跟进',
        type: 'follow',
        icon: 'wk wk-edit'
      }] : []

      if (this.crmType != 'invoice') {
        temps.push({
          name: '标记已处理',
          type: 'mark-deal',
          icon: 'wk wk-tag'
        })
      }

      if (this.canUpdateStatus) {
        temps.push({
          name: '通过',
          type: 'examine-success',
          icon: 'wk wk-icon-success-line'
        })
        temps.push({
          name: '拒绝',
          type: 'examine-reject',
          icon: 'wk wk-icon-close-line'
        })
      }
      return temps
    },

    // 展示筛选
    showFilterView() {
      if (this.crmType == 'receivablesPlan' ||
      this.crmType == 'examine') {
        return false
      }
      return true
    },

    // 展示审核状态
    showCheckStatus() {
      if (this.crmType == 'contract' || this.crmType == 'receivables') {
        return true
      }
      return false
    },

    // 展示客户池天数
    showPoolDay() {
      if (this.crmType == 'customer') {
        return true
      }
      return false
    },

    // 展示我的/下属筛选
    showSubType() {
      if (
        this.infoType == 'todayCustomer' ||
        this.infoType == 'todayBusiness' ||
        this.infoType == 'todayLeads' ||
        this.infoType == 'putInPoolRemind' ||
        this.infoType == 'returnVisitRemind' ||
        this.infoType == 'followLeads' ||
        this.infoType == 'followCustomer'
      ) {
        return true
      }
      return false
    },

    /**
     * 能标记
     */
    canMark() {
      if (this.options.length) {
        if (this.showSubType && this.showOptions) {
          return this.optionsType == '1' && this.isSubType == 1
        }

        if (this.showSubType) {
          return this.isSubType == 1
        }

        if (this.showOptions) {
          return this.optionsType == '1'
        }
        return false
      }

      return true
    },

    // 权限
    showCall() {
      if (
        this.infoType == 'todayCustomer' ||
        this.infoType == 'followLeads' ||
        this.infoType == 'todayLeads' ||
        this.infoType == 'putInPoolRemind' ||
        this.infoType == 'followCustomer') {
        return this.$store.state.crm.isCall
      }
      return false
    },

    // 能进行审批
    canUpdateStatus() {
      if (
        this.infoType == 'checkContract' ||
        this.infoType == 'checkReceivables' ||
        this.infoType == 'checkInvoice' ||
        this.infoType == 'checkOaTypeIds') {
        return this.optionsType === '1' // 待审核
      }
      return false
    }
  },

  watch: {
    show: {
      handler() {
        if (this.show) {
          this.loaded = true
          this.initInfo()
        }
      },
      immediate: true
    }
  },

  methods: {
   
    removeTagRequest(crmType) {
      return {
        'invoice': crmInvoiceDeleteTag,
        'contract': crmContractDeleteTag
      }[crmType]
    },
    handleClose(row) {
      let request = this.removeTagRequest(this.crmType)
      let sceneId = this.crmType + 'Id'
      request({
        [sceneId]: row[`${this.crmType}Id`],
        
      }).then(res => {
        // this.titleList.splice(item.$index, 1)
       
        this.refreshList()
      })
    },
    showInput(row,index) {
        this.inputVisible = true;
      
        if (this.crmType == 'contract'){
       
          this.selectedInvoiceId = row.contractId
        }
        if (this.crmType == 'invoice') {
          this.selectedInvoiceId = row.invoiceId
        }
        
        this.$nextTick(_ => {
          this.$refs.saveTagInput.$refs.input.focus();
        });
      },

    updateTagRequest(crmType) {
      return {
        'invoice': crmInvoiceUpdateTag,
        'contract': crmContractUpdateTag
      }[crmType]
    },
    handleInputConfirm(row) {
        let inputValue = this.inputValue;
        if (inputValue == "") {
          this.inputVisible = false;
         
          this.inputValue = '';
        }else{
          let sceneId = this.crmType + 'Id'
       

          let request = this.updateTagRequest(this.crmType)
         
          request({
            [sceneId]: row[`${this.crmType}Id`],
            'fieldTag':inputValue
          }).then(res => {
            // this.titleList.splice(item.$index, 1)
           
            this.refreshList()
            this.inputVisible = false;
         
            this.inputValue = ''; 
          })
           
          
        }
        
        
      },
    /**
     * 进入初始化信息
     */
    initInfo() {
      this.options = this.getOption()

      if (this.showOptions && this.options.length > 0) {
        this.optionsType = this.options[0].value
      }

      // 固定表头
      if (this.infoHeads) {
        this.fieldList = this.infoHeads
      }

      this.initTableHead()
    },

    /**
     * 初始化表头数据
     */
    initTableHead() {
      this.currentPage = 1
      if (this.fieldList.length == 0) {
        this.getFieldList()
      } else {
        this.getList()
        this.$store.dispatch('GetMessageNum')
      }
    },

    /**
     * 刷新列表
     */
    refreshList() {
      this.currentPage = 1
      if (this.fieldList.length > 0) {
        this.getList()
      } else {
        this.getFieldList()
      }
    },

    /**
     * 勾选数据
     */
    handleSelectionChange(val) {
      this.selectionList = val // 勾选的行
    },

    /**
     * 勾选后的操作
     */
    selectionBarClick(type) {
      if (type == 'follow') {
        this.$confirm('您确定此操作吗？操作“已跟进”之后，数据的最后跟进时间将自动更新为当前时间', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            const request = {
              followLeads: crmLeadsSetFollowAPI,
              followCustomer: crmCustomerSetFollowAPI
            }[this.infoType]
            request(
              this.selectionList
                .map(item => item[this.crmType + 'Id'])
            )
              .then(res => {
                this.$message.success('操作成功')
                this.refreshList()

                this.$emit('on-handle', {
                  type: 'follow',
                  value: this.selectionList.length,
                  infoType: this.infoType
                })

                this.requestNumCount()
              })
              .catch(() => {})
          })
          .catch(() => {})
      } else if (type == 'mark-deal') {
        const params = { model: this.model }
        params.list = this.selectionList
          .map(item => {
            const temp = {}
            const fieldKey = `${this.crmType}Id`
            temp.typeId = item[fieldKey]
            // 待进入公海提醒 需要的公海id
            if (this.infoType == 'putInPoolRemind') {
              temp.poolIds = item.poolIds
            }
            return temp
          })
        crmMessagzealByIdAPI(params).then(res => {
          this.$message.success('操作成功')
          this.getList()
          this.requestNumCount()
        }).catch(() => {})
      } else if (type == 'examine-success') {
        this.examineHandleInfo.status = 1
        this.examineHandleInfo.data = this.selectionList
        this.examineHandleShow = true
      } else if (type == 'examine-reject') {
        this.examineHandleInfo.status = 2
        this.examineHandleInfo.data = this.selectionList
        this.examineHandleShow = true
      }
    },

    /**
     * 获取高级筛选字段数据后展示
     */
    getFilterFieldInfo() {
      filterIndexfieldsAPI({
        label: crmTypeModel[this.crmType]
      })
        .then(res => {
          this.filterFieldList = res.data || []
          this.showFilter = true
        })
        .catch(() => {})
    },

    /**
     * 选择筛选字段
     */
    handleFilter(form) {
      this.filterObj = form
      this.showFilter = false
      this.updateTableHeight()
      this.refreshList()
    },

    /**
     * 删除筛选字段
     */
    handleDeleteField(data) {
      this.filterObj = data.obj
      this.updateTableHeight()
      this.refreshList()
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (
        (column.property === 'name' && this.crmType != 'contract') ||
        (column.property === 'categoryTitle' && this.crmType === 'examine') ||
        column.property === 'number' ||
        column.property === 'leadsName' ||
        column.property === 'customerName' ||
        column.property === 'businessName' ||
        column.property === 'contactsName' ||
        column.property === 'receivablesNum' ||
        column.property === 'num' ||
        column.property === 'visitNumber' ||
        column.property === 'invoiceApplyNumber'
      ) {
        return 'can-visit--underline'
      } else {
        return ''
      }
    },
    /**
     * pover 显示时触发
     */
    showData(val) {
      if (
        this.infoType == 'todayCustomer' ||
        this.infoType == 'followCustomer' ||
        this.infoType == 'putInPoolRemind') {
        this.showCount = val.customerId
        this.rowType = 'customer'
      } else if (this.infoType == 'followLeads' || this.infoType == 'todayLeads') {
        this.showCount = val.leadsId
        this.rowType = 'leads'
      }
    },
    /**
       * 查看详情
       * @param val
       */
    changeCRMType(val) {
      this.rowType = val.type
      this.rowID = val.id

      this.modelData = {
        modelId: val.id,
        model: val.type
      }

      this.showDview = true

      let callOutData = {
        modelId: val.id,
        model: val.type
      }
      callOutData = JSON.stringify(callOutData)
      localStorage.setItem('callOutData', callOutData)
    },
    /**
     * 解决povper重复的bug
    */
    callCheckClick(e, scope) {
      this.list.forEach(item => {
        this.$set(item, 'callShow', false)
      })
      this.$set(scope.row, 'callShow', !scope.row.callShow)
      const popoverEl = e.target.parentNode
      popoverEl.__vue__.showPopper = !scope.row.callShow
    },
    /**
     * 展示呼出页面
     */
    showCallCenter(row) {
      if (
        this.infoType == 'todayCustomer' ||
        this.infoType == 'followCustomer' ||
        this.infoType == 'putInPoolRemind') {
        if (row.customerId === this.showCount) {
          return true
        }
      } else if (this.infoType == 'followLeads' || this.infoType == 'todayLeads') {
        if (row.leadsId === this.showCount) {
          return true
        }
      }
      return false
    },
    /**
     * 全部标记为已读
     */
    allMarkReadClick() {
      crmMessagAllDealAPI({
        model: this.model
      }).then(res => {
        this.$message.success('操作成功')
        this.requestNumCount()
        this.getList()
      }).catch(() => {})
    },

    /**
     * 不能进行勾选操作
     */
    selectionDisabled() {
      return this.canMark
    },

    /**
     * 获取option
     */
    getOption() {
      if (this.infoType == 'todayCustomer' ||
        this.infoType == 'todayBusiness' ||
        this.infoType == 'todayLeads') {
        return [
          { name: '今日需联系', value: '1', num: 0, isMenuNum: true },
          { name: '已逾期', value: '2', num: 0, key: 'overtime' },
          { name: '已联系', value: '3', num: 0 }
        ]
      } else if (
        this.infoType == 'followLeads' ||
        this.infoType == 'followCustomer'
      ) {
        return [{ name: '待跟进', value: '1', num: 0, isMenuNum: true }, { name: '已跟进', value: '2', num: 0 }]
      } else if (
        this.infoType == 'checkContract' ||
        this.infoType == 'checkReceivables' ||
        this.infoType == 'checkInvoice' ||
        this.infoType == 'checkOaTypeIds'
      ) { // isList 读取列表返回数量
        return [{ name: '待审核', value: '1', num: 0, isList: true }, { name: '已审核', value: '2', num: 0 }]
      } else if (this.infoType == 'remindReceivablesPlan') {
        return [
          { name: '待回款', value: '1', num: 0, isMenuNum: true },
          { name: '已回款', value: '2', num: 0 },
          { name: '已逾期', value: '3', num: 0, key: 'overtime' }
        ]
      } else if (this.infoType == 'endContract') {
        return [{ name: '即将到期', value: '1', num: 0, isMenuNum: true }, { name: '已到期', value: '2', num: 0 }]
      }

      return []
    },

    /**
     * 审批操作
     */
    /**
     * 撤回审核 通过 拒绝
     */
    examineHandle(status, data) {
      
      this.examineHandleInfo.status = status
      this.examineHandleInfo.data = [data]
      this.examineHandleShow = true

      if (this.infoType === 'checkContract') {
        // console.log(data)
        filedGetFieldAPI({label: 6, id: data.contractId}).then( res=>{
          let fieldList = res.data
          fieldList.forEach((element, index) => {
            this.fieldList2[index] = element.filter(item=>item.name == '价格区间')
          });
          this.fieldList2 = this.fieldList2.filter(item=>item.length>0)
          this.fieldList2.map(item=>{
            item.map(i => {
              i.field = i.fieldName
              this.fieldForm[i.fieldName] = i.value
              console.log(i)
            })
          })
        })
      }
    },

    /**
     * 审批确定
     */
    examinConfirm(content,content2) {
      if (this.examineHandleInfo.data) {
        
        
        const { data, status } = this.examineHandleInfo
       
        if (this.crmType == 'contract'){
          
          crmContractBatchUpdatePriceRangeAPI({
            prices: data.map(item => {
              return {
                contractId: item[`${this.crmType}Id`],
                priceRange: content2,
              }
            })
          }).then(res => {})
        }
        examineRecordBatchAuditAPI({
          examineBOS: data.map(item => {
            return {
              typeId: item[`${this.crmType}Id`],
              recordId: item.examineRecordId,
              status: status,
              remarks: content
            }
          })
        }).then(res => {
          this.$message.success('操作成功')
          this.getList()
          this.requestNumCount()
          this.examineHandleShow = false
        }).catch(() => {})
      }
    },

    /**
     * 待办事项
     */
    requestNumCount() {
      this.$store
        .dispatch('GetMessageNum')
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "../../styles/table.scss";

/** 场景和筛选 */
.filtrate-button {
  display: inline-block;
  margin-left: 10px;
  cursor: pointer;

  &-img {
    width: 12px;
    margin: 0 5px;
    vertical-align: middle;
  }
}

/deep/ th.column > .cell {
  padding-right: 50px;

  .el-lock-btn {
    position: absolute;
    color: #c0c4cc;

    &:hover {
      color: $--color-primary;
    }
  }

  .el-lock-btn {
    right: 25px;
    visibility: hidden;
  }

  
  &:hover {
    .el-lock-btn {
      visibility: visible;
    }
  }
}

.el-table .el-table__cell.is-center > .cell {
  justify-content: center;
}



.filtrate-button:hover {
  color: $--color-primary;
}

.ec-container {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 24px 24px 0;
  overflow: hidden;
}

.title {
  font-size: 24px;

  .wk-help {
    margin-left: 5px;
    font-size: 16px;
  }
}

.option-bar {
  padding: 16px 0 8px;

  // .el-tabs {
  //   width: 280px;
  //   /deep/ .el-tabs__header {
  //     margin: 0;
  //     .el-tabs__nav-wrap::after {
  //       display: none;
  //     }
  //   }
  // }

  // .el-badge {
  //   line-height: initial;
  // }
}

/** 勾选操作 */
.selection-bar {
  min-height: 34px;

  .selected—title {
    flex-shrink: 0;
    padding-right: 20px;
    font-weight: $--font-weight-semibold;

    .selected—count {
      color: $--color-primary;
    }
  }
}

.selection-items-box {
  padding: 0 15px;
  overflow-x: auto;
  overflow-y: hidden;

  /deep/ .el-button {
    i {
      margin-right: 5px;
    }
  }
}

.el-button--primary.is-plain {
  background-color: white;
}

.el-button--primary.is-plain:focus,
.el-button--primary.is-plain:active,
.el-button--primary.is-plain:hover {
  color: $--color-primary;
}

</style>
