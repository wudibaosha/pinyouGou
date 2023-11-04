<template>
  <slide-view
    v-empty="!canShowDetail"
    :listener-ids="listenerIDs"
    :no-listener-ids="noListenerIDs"
    :no-listener-class="noListenerClass"
    :body-style="{padding: 0, height: '100%'}"
    xs-empty-icon="nopermission"
    xs-empty-text="暂无权限"
    @afterEnter="viewAfterEnter"
    @close="hideView">
    <div
      ref="crmDetailMain"
      v-loading="loading"
      class="detail-main no-padding">
      <flexbox
        v-if="canShowDetail && detailData"
        direction="column"
        align="stretch"
        class="d-container">
        <wk-detail-header
          subtitle="合同"
          :class="{'is-shadow': bodyIsScroll}"
          :title="detailData.name"
          :page-list="pageList"
          :dropdowns="handleOperations"
          @command="headerRightClick"
          @pageChange="pageChange"
        >

          <template slot="left">
            <span v-if="detailData.checkStatus == 8" class="is-invalid">（已作废）</span>
            <span v-if="detailData.checkStatus == 5" class="is-invalid">（草稿）</span>
          </template>

          <template slot="right">
            <time-piece v-if="showTimer && isCall" />
            <el-button
              class="wk-premium-info-btn"
              data-type="Signature">
              <i class="wk wk-icon-lightning-solid wk-premium-info-icon" data-type="Signature" />
              <span class="wk-premium-info-label" data-type="Signature">快速签约</span>
            </el-button>
            <el-button
              v-if="showTransfer"
              class="head-handle-button"
              @click="headerRightClick('transfer')">转移</el-button>
            <!-- 加合同状态权限 -->
            <el-button
              v-if="showEdit"
              class="head-handle-button"
              @click="headerRightClick('contract_status')">合同状态</el-button>
            <el-button
              v-if="showEdit"
              class="head-handle-button"
              type="primary"
              @click="headerRightClick('edit')">编辑</el-button>
          </template>
        </wk-detail-header>

        <!-- 标签 -->
        <flexbox
          v-if="tagInfo"
          wrap="wrap"
          class="wk-tags-content">
          <tag-view
            :value="tagInfo.value"
            :max-length="Infinity"
            wrap="wrap">
            <wk-tag
              v-model="tagInfo.value"
              :disabled="tagInfo.disabled"
              :placeholder="tagInfo.placeholder"
              :data="tagInfo"
              :options="tagInfo.setting"
              @change="tagChange($event)">
              <el-tooltip
                slot="reference"
                content="编辑标签"
                effect="dark"
                placement="top">
                <el-button type="icon" size="small" icon="wk wk-icon-label-solid" />
              </el-tooltip>
            </wk-tag>
          </tag-view>
        </flexbox>

        <!-- 快捷创建 -->
        <wk-quick-create-bar
          :list="activityHandle"
          @command="quickCreateClick"
        />

        <div class="d-container-body" @scroll="bodyScroll">
          <detail-head-base :list="headDetails" />
          <relative-stage-records
            :id="id"
            :crm-type="crmType"
            :detail="detailData"
            @handle="detailHeadHandle"
          />
          <flexbox
            class="left-right-wrap"
            :class="{'is-hidden-right': !detailData.examineRecordId }"
            align="stretch">
            <div class="left">
              <el-tabs
                v-model="tabCurrentName"
                nav-mode="more"
              >
                <el-tab-pane
                  v-for="(item, index) in tabNames"
                  :key="index"
                  :label="item.label"
                  :name="item.name"
                  lazy>
                  <template slot="label">
                    <el-badge
                      :value="item.num"
                      :hidden="item.num <= 0"
                      type="undefined">
                      {{ item.label }}
                    </el-badge>
                  </template>
                  <component
                    :is="item.name"
                    :id="id"
                    :ref="item.name"
                    :detail="detailData"
                    :type-list="logTyps"
                    :is-contract="true"

                    :crm-type="crmType"
                    @handle="detailHeadHandle" />
                </el-tab-pane>
              </el-tabs>

            </div>
            <div class="right">
              <examine-info-section
                v-if="detailData.examineRecordId"
                :id="id"
                ref="examineChild"
                :record-id="detailData.examineRecordId"
                :owner-user-id="detailData.ownerUserId"
                examine-type="crm_contract"
                @on-handle="examineHandle" />
            </div>
          </flexbox>
        </div>
      </flexbox>
    </div>

    <!-- 新建编辑 -->
    <c-r-m-all-create
      v-if="crmCreateShow"
      :action="createActionInfo"
      :crm-type="createCRMType"
      :contractid="id"
      @save-success="editSaveSuccess"
      @close="crmCreateShow=false" />

    <!-- 任务创建 -->
    <task-create
      v-if="taskCreateShow"
      :action="taskCreateAction"
      @save="editSaveSuccess"
      @close="taskCreateShow = false"
    />

    <!-- 转移 -->
    <transfer-handle
      v-if="transferDialogShow"
      :props="transferHandleProps"
      :dialog-visible.sync="transferDialogShow"
      @handle="detailHeadHandle({type: 'transfer'})" />

    <!-- 邮寄状态 -->
    <contract-status-handle
      :id="id"
      :value="detailData ? detailData.returnPostStatus : '邮寄状态'"
      :selection-list="[detailData]"
      :visible.sync="contractStatusShow"
      @handle="detailHeadHandle({type: 'contract_status'})" />
  </slide-view>
</template>

<script>
import {
  crmContractReadAPI,
  crmContractDeleteAPI,
  crmContractCancelAPI
} from '@/api/crm/contract'

import SlideView from '@/components/SlideView'
import TransferHandle from '@/components/Page/SelectionHandle/TransferHandle' // 转移
import ContractStatusHandle from '../components/SelectionHandle/ContractStatusHandle' // 合同状态修改操作
import Stage from '../components/Stage' // 阶段记录
import RelativeStageRecords from '../components/RelativeStageRecords' // 阶段记录
import Activity from '../components/Activity' // 活动
import CRMEditBaseInfo from '../components/CRMEditBaseInfo' // 商机基本信息
import RelativeHandle from '../components/RelativeHandle' // 相关操作
import RelativeTeam from '../components/RelativeTeam' // 团队成员
import RelativeProduct from '../components/RelativeProduct' // 团队成员
import RelativeReturnMoney from '../components/RelativeReturnMoney' // 相关回款
import RelativeFiles from '../components/RelativeFiles' // 相关附件
import RelativeVisit from '../components/RelativeVisit' // 回访
import RelativeInvoice from '../components/RelativeInvoice' // 发票
import RelativePrint from '../components/RelativePrint' // 相关打印
import ExamineInfoSection from '@/components/Examine/ExamineInfoSection'
import ContractDetailRelative from './component/ContractDetailRelative' // 关联合同
import ProjectTranfer from './component/ProjectTranfer' // 关联合同
import ProjectStart from '@/views/crm/customer/components/ProjectStart.vue' // 项目提前启动

import CRMAllCreate from '../components/CRMAllCreate' // 新建页面
import TaskCreate from '@/views/oa/taskExamine/task/Create'

import DetailMixin from '../mixins/Detail'
import { separator } from '@/filters/vueNumeralFilter/filters'
// import { getWkDateTime } from '@/utils'

export default {
  // 客户管理 的 合同详情
  name: 'ContractDetail',
  components: {
    SlideView,
    TransferHandle,
    Stage,
    RelativeStageRecords,
    Activity,
    CRMEditBaseInfo,
    RelativeHandle,
    RelativeTeam,
    RelativeProduct,
    RelativeReturnMoney,
    RelativeFiles,
    RelativeVisit,
    RelativeInvoice,
    RelativePrint,
    ExamineInfoSection,
    CRMAllCreate,
    TaskCreate,
    ContractDetailRelative,
    ProjectTranfer,
    ProjectStart,
    ContractStatusHandle
  },
  mixins: [DetailMixin],
  props: {
    // 详情信息id
    id: [String, Number],
    // 监听的dom 进行隐藏详情
    listenerIDs: {
      type: Array,
      default: () => {
        return ['crm-main-container']
      }
    },
    // 不监听
    noListenerIDs: {
      type: Array,
      default: () => {
        return []
      }
    },
    noListenerClass: {
      type: Array,
      default: () => {
        return ['el-table__body']
      }
    }
  },
  data() {
    return {
      // 展示加载loading
      loading: false,
      crmType: 'contract',
      headDetails: [],
      tabCurrentName: 'CRMEditBaseInfo',
      contractStatusShow: false // 邮寄状态修改框
    }
  },
  computed: {
    // 活动操作
    activityHandle() {
      const temps = [
        {
          command: 'task',
          icon: 'wk wk-icon-task-line',
          label: '创建任务',
          auth: 'oa.taskExamine'
        }, {
          command: 'receivables',
          icon: 'wk wk-receivables-line',
          label: '创建回款',
          auth: 'crm.receivables.save'
        }
      ]

      // if (this.canCreateFollowRecord) {
      //   temps = [{
      //     type: 'log',
      //     label: '写跟进'
      //   }].concat(temps)
      // }

      return temps
    },

    // 可操作选项
    handleOperations() {
      return this.getOperations(['print', 'delete', 'cancel', 'copyContract'])
    },

    // tabs
    tabNames() {
      var tempsTabs = []
      if (this.crm.contract && this.crm.contract.read) {
        tempsTabs.push({ label: '详细资料', name: 'CRMEditBaseInfo' })
      }

      tempsTabs.push({ label: '附件', num: this.tabsNumber.fileCount, name: 'RelativeFiles' })
      tempsTabs.push({ label: '关联其他合同', num: this.tabsNumber.contractRelationCount, name: 'ContractDetailRelative' })
     
      if (this.crm.invoice && this.crm.invoice.index) {
        tempsTabs.push({ label: '发票', num: this.tabsNumber.invoiceCount, name: 'RelativeInvoice' })
      }
      if (this.crm.product && this.crm.product.index) {
        tempsTabs.push({ label: '产品', num: this.tabsNumber.productCount, name: 'RelativeProduct' })
      }
      if ((this.crm.receivables && this.crm.receivables.index) || (this.crm.receivablesPlan && this.crm.receivablesPlan.index)) {
        tempsTabs.push({ label: '回款', num: this.tabsNumber.receivablesCount, name: 'RelativeReturnMoney' })
      }
      if (this.crm.visit && this.crm.visit.index) {
        tempsTabs.push({ label: '回访', num: this.tabsNumber.returnVisitCount, name: 'RelativeVisit' })
      }

     
      tempsTabs.push({ label: '项目提前启动', name: 'ProjectStart', num: this.tabsNumber.projectUpCount })
      tempsTabs.push({ label: '项目转移流程', num: this.tabsNumber.projectTransferCount, name: 'ProjectTranfer' })
      tempsTabs.push({ label: '团队成员', num: this.tabsNumber.memberCount, name: 'RelativeTeam' })

      tempsTabs.push({ label: '操作记录', name: 'RelativeHandle' })
      if (this.crm.contract && this.crm.contract.print) {
        tempsTabs.push({ label: '打印记录', name: 'RelativePrint' })
      }
      tempsTabs.push({ label: '活动', name: 'Activity' })
      // if (this.statusShow) {
      //   tempsTabs.unshift({ label: '阶段记录', name: 'RelativeStageRecords' })
      // }
      return tempsTabs
    },

    // 根据记录筛选
    logTyps() {
      return [{
        icon: 'all',
        color: '#2362FB',
        command: '',
        label: '全部活动'
      }, {
        icon: 'contract',
        color: '#FD5B4A',
        command: 6,
        label: '合同'
      }, {
        icon: 'o-task',
        color: '#D376FF',
        command: 11,
        label: '任务'
      }, {
        icon: 'receivables',
        color: '#FFB940',
        command: 7,
        label: '回款'
      }, {
        icon: 'log',
        color: '#5864FF',
        command: 8,
        label: '日志'
      }, {
        icon: 'approve',
        color: '#9376FF',
        command: 9,
        label: '审批'
      }]
    }
  },
  mounted() {
    if (this.crm.contract && this.crm.contract.read) {
      this.tabCurrentName = 'CRMEditBaseInfo'
    }
  },
  methods: {
    /**
     * 详情
     */
    getDetial() {
      this.loading = true
      crmContractReadAPI({
        contractId: this.id
      })
        .then(res => {
          this.loading = false
          // 创建回款计划的时候使用
          const resData = res.data || {}
          this.detailData = resData

          this.headDetails = [
            // { title: '合同编号', value: resData.num },
            { title: '客户联系人', value: resData.customerName },
            { title: '合同金额（元）', value: separator(resData.money || 0) },
            { title: '累计开票金额', value: separator(resData.cumulativeInvoicedAmount || 0) },
            { title: '回款金额（元）', value: separator(resData.receivablesMoney || 0) },
            { title: '负责人', value: resData.ownerUserName }
          ]
        })
        .catch(() => {
          this.loading = false
          this.hideView()
        })
    },

    /**
     * 关闭
     */
    hideView() {
      this.$emit('hide-view')
    },

    /* ------------------------ 头部事件 ------------------------ */
    /**
     * @description: 头部右侧点击事件
     * @param {*}
     * @return {*}
     */
    headerRightClick(type) {
      //转移
      if (type === 'transfer') {
        this.transferDialogShow = true
        //编辑
      } else if (type === 'edit') {
        if (this.detailData.checkStatus !== 5 ) {
        // if (this.detailData.checkStatus !== 100) {
          this.createCRMType = this.crmType
          this.createActionInfo = {
            type: 'update',
            id: this.id,
            batchId: this.detailData.batchId
          }
          this.crmCreateShow = true
        }
        //需回滚
        else if (this.detailData.checkStatus == 1) {
          this.$message.error('已通过的合同作废后才可编辑')
          return false
        } 
        else {
          this.createCRMType = this.crmType
          this.createActionInfo = {
            type: 'update',
            id: this.id,
            batchId: this.detailData.batchId
          }
          this.crmCreateShow = true
        }
      } //删除
      else if (type == 'delete') {
        this.$confirm('确定删除?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            crmContractDeleteAPI([this.id])
              .then(res => {
                this.$message({
                  type: 'success',
                  message: '删除成功'
                })
                this.detailHeadHandle({ type })
              })
              .catch(() => {})
          })
          .catch(() => {})
      } else if (type == 'cancel') {
        let message = '确定要作废此合同吗?'
        if (this.detailData.receivablesCount) {
          message = '合同下有相关回款,确定要作废吗?'
        }
        this.$confirm(message, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            crmContractCancelAPI({
              contractId: this.id
            })
              .then(res => {
                this.$message.success('操作成功')
                this.detailHeadHandle({ type })
              })
              .catch(() => {})
          })
          .catch(() => {})
      } else if (type == 'print') {
        // 打印
        const id = this.detailData[`${this.crmType}Id`]
        const routeData = this.$router.resolve(`/print/?module=${this.crmType}&id=${id}`)
        window.open(routeData.href, '_blank')
      } else if (type == 'copyContract') {
        this.createCRMType = this.crmType
        this.createActionInfo = { type: 'update', title: '复制合同', id: this.id, isCopy: true }
        this.crmCreateShow = true
        console.log(this.createActionInfo,"createActtionInfo")
        console.log(this.createCRMType,"this.createCRMType")
        console.log(this.crmCreateShow,"this.crmCreateShow")        
      } else if (type == 'contract_status') {
        this.contractStatusShow = true
      }
    },

    
    /**
     * 审核操作
     */
    examineHandle(data) {
      this.detailHeadHandle({ type: 'examine' })
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/crmdetail.scss";

.d-container-body {
  margin-top: 8px;
}

.is-invalid {
  color: $--color-text-placeholder;
}
</style>
