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
          subtitle="客户"
          :class="{'is-shadow': bodyIsScroll}"
          :title="detailData.customerName"
          :page-list="pageList"
          :dropdowns="handleOperations"
          @command="headerRightClick"
          @pageChange="pageChange"
        >

          <template slot="left">
            <i v-if="detailData.status == 2" class="wk wk-circle-password" />
            <el-tooltip v-if="!isSeasDetail" :content="detailData.star == 0 ? '添加关注' : '取消关注'" effect="dark" placement="top">
              <i
                v-if="detailData.star == 0"
                class="el-icon-star-off focus-icon"
                @click="toggleStar()" />
              <i
                v-else
                class="wk wk-focus-on focus-icon active"
                @click="toggleStar()" />
            </el-tooltip>
          </template>

          <template slot="right">
            <time-piece v-if="showTimer && isCall" />
            <el-button
              class="wk-premium-info-btn"
              data-type="Call">
              <i class="wk wk-icon-lightning-solid wk-premium-info-icon" data-type="Call" />
              <span class="wk-premium-info-label" data-type="Call">呼叫中心</span>
            </el-button>

            <el-button
              v-if="showEdit"
              class="head-handle-button"
              type="primary"
              @click="headerRightClick('edit')">编辑</el-button>
            <el-button
              v-if="showGet"
              class="head-handle-button"
              type="primary"
              @click="headerRightClick('get')">领取</el-button>

            <el-button
              v-if="showAlloc"
              class="head-handle-button"
              @click="headerRightClick('alloc')">分配</el-button>
            <el-button
              v-if="showDealStatus"
              class="head-handle-button"
              @click="headerRightClick('deal_status')">更改成交状态</el-button>
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
          v-if="!isSeasDetail"
          :list="activityHandle"
          @command="quickCreateClick"
        />

        <div class="d-container-body" @scroll="bodyScroll">
          <detail-head-base :list="headDetails" @action="headAction" />
          <relative-stage-records
            :id="id"
            :is-seas="isSeasDetail"
            :crm-type="crmType"
            :detail="detailData"
            @handle="detailHeadHandle"
          />
          <flexbox class="left-right-wrap" align="stretch">
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
                  <!-- 工商信息 -->
                  <business-info-view
                    v-if="item.name === 'BusinessInfoView'"
                    :name="detailData.customerName"
                    style="padding: 0;"
                    :props="{ fillBtnShow: false, isFixed: false, style: {padding: 0, marginBottom: '16px'}, closeShow: false }"
                  />
                  <component
                    :is="item.name"
                    v-else
                    :id="id"
                    :ref="item.name"
                    :detail="detailData"
                    :type-list="logTyps"
                    :pool-id="poolId"
                    :is-seas="isSeasDetail"
                    :crm-type="crmType"
                    :contacts-id.sync="firstContactsId"
                    :ignore-fields="['customerName']"
                    @handle="detailHeadHandle" />
                </el-tab-pane>
              </el-tabs>

            </div>
            <div class="right">
              <wk-head-section label="客户摘要">
                <div class="abstract">
                  <wk-section-item
                    v-for="(item, index) in abstractList"
                    :key="index"
                    :label="item.title">
                    <i
                      v-if="item.helpType"
                      slot="otherLabel"
                      class="wk wk-icon-fill-help wk-help-tips"
                      :data-type="item.helpType"
                      :data-id="item.helpId"
                      @click.stop="" />
                    {{ getDigestFieldValue(item) }}
                  </wk-section-item>
                </div>
              </wk-head-section>
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
      @save-success="editSaveSuccess"
      @close="crmCreateShow=false" />

    <!-- 转移 -->
    <transfer-handle
      v-if="transferDialogShow"
      :props="transferHandleProps"
      :dialog-visible.sync="transferDialogShow"
      @handle="detailHeadHandle({type: 'transfer'})" />

      <!-- 数据迁移 -->
    <data-transfer-handle
      v-if="dataTransferDialogShow"
      :props="transferHandleProps"
      :customerArray = "customerArray"
      :customerId = "id"
      :dialog-visible.sync="dataTransferDialogShow"
      @handle="detailHeadHandle({type: 'dataTransfer'})" />

    <!-- 客户分配 -->
    <alloc-handle
      :crm-type="crmType"
      :pool-id="poolId"
      :selection-list="[detailData]"
      :dialog-visible.sync="allocDialogShow"
      @handle="detailHeadHandle({type: 'alloc'})" />

    <!-- 成交状态 -->
    <deal-status-handle
      :value="detailData ? detailData.dealStatus : 0"
      :selection-list="[detailData]"
      :visible.sync="dealStatusShow"
      @handle="detailHeadHandle({type: 'deal_status'})" />

    <!-- 放入公海 -->
    <put-pool-handle
      :visible.sync="putPoolShow"
      :selection-list="[detailData]"
      @handle="detailHeadHandle({type: 'put_seas'})" />

    <!-- 任务创建 -->
    <task-create
      v-if="taskCreateShow"
      :action="taskCreateAction"
      @save="editSaveSuccess"
      @close="taskCreateShow = false"
    />
  </slide-view>
</template>

<script>
import {
  crmCustomerReadAPI,
  crmCustomerLockAPI,
  crmCustomerDeleteAPI,
  crmCustomerSameNameAPI,
  crmCustomerPoolDeleteAPI,
  crmCustomerReceiveAPI
} from '@/api/crm/customer'

import SlideView from '@/components/SlideView'
import TransferHandle from '@/components/Page/SelectionHandle/TransferHandle' // 转移
import DataTransferHandle from '@/components/Page/SelectionHandle/DataTransferHandle' // 数据转移
import DealStatusHandle from '../components/SelectionHandle/DealStatusHandle' // 客户状态修改操作
import PutPoolHandle from '../components/SelectionHandle/PutPoolHandle' // 放入公海
import AllocHandle from '../components/SelectionHandle/AllocHandle' // 公海分配操作

import RelativeStageRecords from '../components/RelativeStageRecords' // 阶段记录
import Activity from '../components/Activity' // 活动
import CRMEditBaseInfo from '../components/CRMEditBaseInfo' // 基本信息
import RelativeContacts from '../components/RelativeContacts' // 相关联系人
import RelativeBusiness from '../components/RelativeBusiness' // 相关商机
import RelativeContract from '../components/RelativeContract' // 相关合同
import RelativeReturnMoney from '../components/RelativeReturnMoney' // 相关回款
import RelativeFiles from '../components/RelativeFiles' // 相关附件
import RelativeHandle from '../components/RelativeHandle' // 相关操作
import RelativeTeam from '../components/RelativeTeam' // 团队成员
import RelativeVisit from '../components/RelativeVisit' // 回访
import RelativeInvoice from '../components/RelativeInvoice' // 发票
import RelativeCallRecord from '../components/RelativeCallRecord' // 呼叫记录
import RelativeAddress from '../components/RelativeAddress' // 相关地址
import RelativeExamine from '../components/RelativeExamine' // 相关费用
import RelativeForwhomCustomer from '../components/RelativeForwhomCustomer' // 上下级客户
import BusinessInfoView from '@/components/Premium/BusinessInfo/View'
import ProjectStart from './components/ProjectStart' // 项目提前启动
import ProjectTransfer from './components/ProjectTransfer'// 项目转移流程

import CRMAllCreate from '../components/CRMAllCreate' // 新建页面
import TaskCreate from '@/views/oa/taskExamine/task/Create'

import DetailMixin from '../mixins/Detail'
import { mapGetters } from 'vuex'
import { separator } from '@/filters/vueNumeralFilter/filters'

export default {
  // 客户管理 的 客户详情
  name: 'CustomerDetail',
  components: {
    SlideView,
    TransferHandle,
    DealStatusHandle,
    PutPoolHandle,
    AllocHandle,
    Activity,
    RelativeStageRecords,
    CRMEditBaseInfo,
    RelativeContacts,
    RelativeBusiness,
    RelativeContract,
    RelativeReturnMoney,
    RelativeFiles,
    RelativeHandle,
    RelativeTeam,
    RelativeVisit,
    CRMAllCreate,
    RelativeInvoice,
    RelativeCallRecord,
    RelativeAddress,
    RelativeExamine,
    RelativeForwhomCustomer,
    BusinessInfoView,
    TaskCreate,
    ProjectStart,
    ProjectTransfer,
    DataTransferHandle
    
  },
  mixins: [DetailMixin],
  props: {
    // 详情信息id
    id: [String, Number],
    poolId: [String, Number],
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
    },
    /** 呼出信息 */
    modelData: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      // 展示加载loading
      loading: false,
      crmType: 'customer',
      headDetails: [],
      tabCurrentName: 'Activity',
      // 活动操作
      // 首要联系人信息
      firstContactsId: '',
      customerArray: [],
      // 公海规则权限
      poolAuth: {},
      // 客户摘要字段
      abstractList: [
        { title: '跟进次数', field: 'activityCount', helpType: '8', helpId: '156', units: '次' },
        { title: '未跟进时长', field: 'notFollowUpDay', units: '天' },
        { title: '商机数量', field: 'businessCount' },
        { title: '商机总额', field: 'businessMoney', helpType: '8', helpId: '157', units: '元', isMoney: true },
        { title: '成交次数', field: 'contractCount', units: '次' },
        { title: '成交总额', field: 'contractMoney', units: '元', isMoney: true },
        { title: '回款总额', field: 'receivablesMoney', units: '元', isMoney: true },
        { title: '未回款总额', field: 'receivablesUnreceivedMoney', units: '元', isMoney: true },
        { title: '开票总额', field: 'invoiceMoney', units: '元', isMoney: true }
      ],

      // 工商信息
      businessInfoViewShow: false,
      allocDialogShow: false, // 公海分配操作提示框
      dealStatusShow: false, // 成交状态修改框
      putPoolShow: false // 客户放入公海
    }
  },
  computed: {
    // 展示成交状态
    showDealStatus() {
      return !this.isSeasDetail && this.$auth('crm.customer.dealStatus')
    },

    // 展示领取
    showGet() {
      return this.isSeasDetail && this.getOperationsPermision('get')
    },

    // 展示分配
    showAlloc() {
      return this.isSeasDetail && this.getOperationsPermision('alloc')
    },

    // 活动操作
    activityHandle() {
      const temps = [
        {
          command: 'task',
          icon: 'wk wk-icon-task-line',
          label: '创建任务',
          auth: 'oa.taskExamine'
        },
        {
          command: 'contacts',
          icon: 'wk wk-contacts-line',
          label: '创建联系人',
          auth: 'crm.contacts.save'
        },
        {
          command: 'business',
          icon: 'wk wk-business-line',
          label: '创建商机',
          auth: 'crm.business.save'
        },
        {
          command: 'contract',
          icon: 'wk wk-contract-line',
          label: '创建合同',
          auth: 'crm.contract.save'
        },
        {
          command: 'receivables',
          icon: 'wk wk-receivables-line',
          label: '创建回款',
          auth: 'crm.receivables.save'
        }
      ]

      // if (this.canCreateFollowRecord) {
      //   temps = [{
      //     command: 'log',
      //     label: '写跟进'
      //   }].concat(temps)
      // }

      return temps.filter(item => {
        return !item.auth || this.$auth(item.auth)
      })
    },

    // 可操作选项
    handleOperations() {
      return this.getOperations(this.isSeasDetail ? ['delete'] : [
        'transfer',
        'dataTransfer',
        'put_seas',
        'lock',
        'unlock',
        'delete'
      ])
    },

    // tabs
    tabNames() {
      var tempsTabs = []
      tempsTabs.push({ label: '活动', name: 'Activity' })
      if (this.crm.customer && this.crm.customer.read) {
        tempsTabs.push({ label: '详细资料', name: 'CRMEditBaseInfo' })
      }
      // tempsTabs.push({ label: '工商信息', name: 'BusinessInfoView' })
      if (this.crm.contacts && this.crm.contacts.index) {
        tempsTabs.push({ label: '联系人', name: 'RelativeContacts', num: this.tabsNumber.contactCount })
      }

      tempsTabs.push({ label: '团队成员', name: 'RelativeTeam', num: this.tabsNumber.memberCount })

      if (this.crm.business && this.crm.business.index) {
        tempsTabs.push({ label: '商机', name: 'RelativeBusiness', num: this.tabsNumber.businessCount })
      }

      if (this.crm.contract && this.crm.contract.index) {
        tempsTabs.push({ label: '合同', name: 'RelativeContract', num: this.tabsNumber.contractCount })
      }
      if ((this.crm.receivables && this.crm.receivables.index) || (this.crm.receivablesPlan && this.crm.receivablesPlan.index)) {
        tempsTabs.push({ label: '回款', name: 'RelativeReturnMoney', num: this.tabsNumber.receivablesCount })
      }
      if (this.crm.invoice && this.crm.invoice.index) {
        tempsTabs.push({ label: '发票', name: 'RelativeInvoice', num: this.tabsNumber.invoiceCount })
      }
      if (this.crm.visit && this.crm.visit.index) {
        tempsTabs.push({ label: '回访', name: 'RelativeVisit', num: this.tabsNumber.returnVisitCount })
      }

      tempsTabs.push({ label: '项目提前启动', name: 'ProjectStart', num: this.tabsNumber.projectUpCount })
      tempsTabs.push({ label: '项目转移流程', name: 'ProjectTransfer', num: this.tabsNumber.projectTransferCount })

      tempsTabs.push({ label: '客户地址', name: 'RelativeAddress' })
      tempsTabs.push({ label: '费用', name: 'RelativeExamine' })
      tempsTabs.push({ label: '上下级客户', name: 'RelativeForwhomCustomer' })

      if (this.$store.state.crm.isCall) {
        tempsTabs.push({ label: '呼叫记录', name: 'RelativeCallRecord', num: this.tabsNumber.callRecordCount })
      }
      tempsTabs.push({ label: '附件', name: 'RelativeFiles', num: this.tabsNumber.fileCount })
      tempsTabs.push({ label: '操作记录', name: 'RelativeHandle', num: 0 })
      return tempsTabs
    },

    // 根据记录筛选
    logTyps() {
      let logTypslist = []
      logTypslist = [
        {
          icon: 'all',
          color: '#2362FB',
          command: '',
          label: '全部活动'
        },
        {
          icon: 'customer',
          color: '#487DFF',
          command: 2,
          label: '客户'
        },
        {
          icon: 'o-task',
          color: '#D376FF',
          command: 11,
          label: '任务'
        },
        {
          icon: 'business',
          color: '#FB9323',
          command: 5,
          label: '商机'
        },
        {
          icon: 'contract',
          color: '#FD5B4A',
          command: 6,
          label: '合同'
        },
        {
          icon: 'contacts',
          color: '#27BA4A',
          command: 3,
          label: '联系人'
        },
        {
          icon: 'receivables',
          color: '#FFB940',
          command: 7,
          label: '回款'
        },
        {
          icon: 'log',
          color: '#5864FF',
          command: 8,
          label: '日志'
        },
        {
          icon: 'approve',
          color: '#9376FF',
          command: 9,
          label: '审批'
        }
      ]
      if (this.$store.state.crm.isCall) {
        logTypslist.push({
          icon: 'phone',
          color: '#9376FF',
          command: 13,
          label: '呼叫记录'
        })
      }
      return logTypslist
    }
  },
  watch: {},
  mounted() {

  },
  methods: {
    /**
     * 详情
     */
    getDetial() {
      this.firstContactsId = ''
      this.loading = true
      const params = {
        customerId: this.id
      }

      if (this.poolId) {
        params.poolId = this.poolId
      }

      crmCustomerReadAPI(params)
        .then(res => {
          this.loading = false
          const resData = res.data || {}
          this.detailData = resData
          this.firstContactsId = this.detailData.contactsId
          // 公海权限
          this.poolAuth = resData.poolAuthList || {}
          // 负责人
          const headDetails = [{ title: '客户级别', value: '' },
            { title: '成交状态', value: '' },
            { title: '负责人', value: '' },
            { title: '首要联系人', value: '' }]
          headDetails[0].value = this.detailData.level

          const dealItem = headDetails[1]
          if (this.detailData.dealStatus === null || this.detailData.dealStatus === '' || this.detailData.dealStatus === undefined) {
            dealItem.showIcon = false
            dealItem.value = ''
          } else {
            dealItem.showIcon = true
            if (this.detailData.dealStatus == 1) {
              dealItem.icon = 'deal-suc'
              dealItem.style = {
                fontSize: '14px',
                color: '#20b559',
                marginRight: '3px'
              }
              dealItem.value = '已成交'
            } else {
              dealItem.icon = 'deal-un'
              dealItem.style = {
                fontSize: '14px',
                color: '#f95a5a',
                marginRight: '3px'
              }
              dealItem.value = '未成交'
            }
          }

          headDetails[2].title = this.isSeasDetail ? '' : '负责人'
          headDetails[2].value = this.detailData.ownerUserName
          const contactObj = headDetails[3]
          if (this.firstContactsId) {
            contactObj.value = this.detailData.contactsName
            headDetails.push({
              showPhone: true,
              title: '首要联系人电话',
              value: this.detailData.contactsMobile,
              helpObj: {
                type: '8',
                id: '103'
              }
            })
          } else if (!this.isSeasDetail) {
            contactObj.addShow = true
            contactObj.addType = 'contacts'
            contactObj.helpObj = {
              type: '8',
              id: '103'
            }
          }

          this.headDetails = headDetails
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

    /**
     * 格式化客户摘要字段值
     * @param item
     * @return {string}
     */
    getDigestFieldValue(item) {
      if (!this.detailData || !this.detailData.digest) return ''
      let value = this.detailData.digest[item.field]
      if (item.isMoney) {
        value = separator(value)
      }
      return `${value}${item.units || ''}`
    },

    /* ------------------------ 头部事件 ------------------------ */

    /**
     * 首要联系人添加
     */
    addChieflyContacts() {
      this.createCRMType = 'contacts'
      this.createActionInfo = {
        type: 'relative',
        crmType: this.crmType,
        data: { customer: this.detailData }
      }
      this.crmCreateShow = true
    },

    /**
     * 详情头部操作
     */
    headAction(type) {
      if (type === 'contacts-add') {
        this.quickCreateClick('contacts')
      }
    },

    /**
     * @description: 头部右侧点击事件
     * @param {*}
     * @return {*}
     */
    headerRightClick(type) {
      if (type === 'transfer') {
        this.transferDialogShow = true
      } else if (type === 'edit') {
        this.createCRMType = this.crmType
        this.createActionInfo = {
          type: 'update',
          id: this.id,
          batchId: this.detailData.batchId
        }
        this.crmCreateShow = true
      } else if (type === 'deal_status') {
        this.dealStatusShow = true
      } else if (type == 'put_seas') {
        // 客户放入公海
        this.putPoolShow = true
      } else if (type === 'lock' || type === 'unlock') {
        this.$confirm({
          lock: '确定要锁定该客户吗？锁定后将不会掉入公海。',
          unlock: '确定要解锁该客户吗？'
        }[type], '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            const status = type === 'lock' ? 2 : 1 // 1是正常 2 是锁定
            crmCustomerLockAPI({
              status,
              ids: this.id
            })
              .then(res => {
                this.$message({
                  type: 'success',
                  message: '操作成功'
                })
                this.$set(this.detailData, 'status', status)
                this.detailHeadHandle({ type })
              })
              .catch(() => {})
          })
          .catch(() => {})
      } else if (type == 'delete') {
        if (this.isSeasDetail) {
          this.$confirm('若客户下有联系人，联系人将一并删除。确定删除？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          })
            .then(() => {
              crmCustomerPoolDeleteAPI({
                poolId: this.poolId,
                ids: [this.id]
              })
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
        } else {
          this.$confirm('确定删除?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          })
            .then(() => {
              crmCustomerDeleteAPI([this.id])
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
        }
      } else if (type == 'alloc') {
        // 公海分配操作
        this.allocDialogShow = true
      } else if (type === 'get') {
        // 领取
        crmCustomerReceiveAPI({
          ids: [this.id],
          poolId: this.poolId
        })
          .then(res => {
            this.$message({
              type: 'success',
              message: '操作成功'
            })
            // 刷新待办
            this.$store.dispatch('GetMessageNum')

            this.detailHeadHandle({ type })
          })
          .catch(() => {})
      } else if (type === 'dataTransfer') {
       
        crmCustomerSameNameAPI(this.id)
          .then( res=>{
            this.customerArray = res.data
            this.dataTransferDialogShow = true
          } )
        
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/crmdetail.scss";

.d-container-body {
  margin-top: 8px;
}

.slide-fade-leave-active {
  will-change: transform;
  transition: all 0.1s;
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.wk-circle-password {
  padding: 2px;
  margin-left: 5px;
  font-size: 12px;
  color: white;
  background-color: #f56c6c;
  border-radius: 3px;
  transform: scale(0.6);
}

// 摘要
.abstract {
  .el-tooltip {
    margin-left: 3px;
  }
}
</style>
