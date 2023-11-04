<template>
  <div class="container crm-detail-head">
    <flexbox
      class="t-section"
      align="stretch">
      <!-- <img
        :src="crmIcon"
        class="t-section__hd"> -->
      <div class="t-section__bd">
        <div class="type-name">{{ typeName }}</div>
        <flexbox class="type-content" justify="space-between">
          <flexbox style="width: auto;">
            <el-tooltip
              :disabled="!name"
              :content="name"
              effect="dark"
              placement="top-start">
              <span class="name">{{ name }}</span>
            </el-tooltip><slot name="name" />
            <el-button-group v-if="pageList && pageList.length > 1" class="wk-header-page-btn">
              <el-button type="subtle" icon="el-icon-arrow-left" @click="$emit('pageChange', 'left')" />
              <el-button type="subtle" icon="el-icon-arrow-right" @click="$emit('pageChange', 'right')" />
            </el-button-group>
          </flexbox>
          <div class="right-handle">
            <slot name="appreciation-business" />
            <slot name="appreciation-call" />
            <slot name="appreciation-signature" />
            <el-button
              v-if="showTransfer"
              class="head-handle-button"
              @click="handleTypeClick('transfer')">转移</el-button>

            <el-button
              v-if="showEdit"
              class="head-handle-button"
              type="primary"
              @click="handleTypeClick('edit')">编辑</el-button>

            <el-button
              v-if="showGet"
              class="head-handle-button"
              type="primary"
              @click="handleTypeClick('get')">领取</el-button>

            <el-button
              v-if="showAlloc"
              class="head-handle-button"
              @click="handleTypeClick('alloc')">分配</el-button>

            <el-button
              v-if="showDealStatus"
              class="head-handle-button"
              @click="handleTypeClick('deal_status')">更改成交状态</el-button>

            <el-dropdown
              v-if="permissionMoreTypes && permissionMoreTypes.length > 0"
              trigger="click"
              @command="handleTypeClick">
              <el-button
                icon="el-icon-more"
                class="dropdown-btn" />
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item
                  v-for="(item, index) in permissionMoreTypes"
                  :key="index"
                  :command="item.type">{{ item.name }}</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </flexbox>
      </div>
      <time-piece v-if="showTimer && isCall" />
    </flexbox>
    <!-- 标签 -->
    <flexbox
      v-if="tagInfo"
      wrap="wrap"
      class="tags">
      <tag-view
        :value="tagInfo.value"
        :max-length="Infinity"
        wrap="wrap"
        class="tag-view">
        <wk-tag
          v-model="tagInfo.value"
          :disabled="tagInfo.disabled"
          :placeholder="tagInfo.placeholder"
          :data="tagInfo"
          :options="tagInfo.setting"
          @change="commonChange($event)">
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
    <div v-if="!isSeas && handles && handles.length" class="main-handle">
      <template v-for="(item, index) in handles">
        <el-button
          v-if="getAuthByStr(item.auth)"
          :key="index"
          :icon="['wk wk-add', 'wk wk-icon-task', 'wk wk-icon-tips', 'wk wk-icon-task', 'wk wk-icon-task-state'][index]"
          @click="handleClick(item.type)">{{ item.label }}</el-button>
      </template>
    </div>

    <div v-if="headDetails && headDetails.length >0" class="abstract">
      <flexbox
        align="stretch">
        <div
          v-for="(item,index) in headDetails"
          :key="index"
          class="abstract-item">
          <div class="abstract-title">{{ item.title }}<i v-if="item.helpObj" class="wk wk-icon-fill-help wk-help-tips" :data-type="item.helpObj.type" :data-id="item.helpObj.id" /></div>
          <div v-if="item.addShow" class="abstract-value">
            <el-button
              icon="el-icon-plus"
              type="text"
              style="padding: 0;"
              @click="handleClick('contacts')">添加</el-button>
          </div>
          <div v-else class="abstract-value text-one-line ">
            <span v-if="item.showPhone" class="phone-item">
              <i class="wk wk-circle-iphone" /> {{ item.value }}
            </span>
            <el-tooltip v-else :disabled="!item.value" :content="item.value" class="text-one-line" effect="dark" placement="top">
              <span><span v-if="item.showIcon" :class="item.icon" style="margin-right: 4px;" /><span>{{ item.value }}</span></span>
            </el-tooltip>
          </div>
        </div>
      </flexbox>
    </div>
    <slot />
    <!-- 转移 -->
    <transfer-handle
      v-if="transferDialogShow"
      :props="transferHandleProps"
      :dialog-visible.sync="transferDialogShow"
      @handle="handleCallBack" />

    <!-- 客户分配 -->
    <alloc-handle
      :crm-type="crmType"
      :pool-id="poolId"
      :selection-list="[detail]"
      :dialog-visible.sync="allocDialogShow"
      @handle="handleCallBack" />

    <!-- 成交状态 -->
    <deal-status-handle
      :value="detail.dealStatus"
      :selection-list="[detail]"
      :visible.sync="dealStatusShow"
      @handle="handleCallBack" />

    <!-- 放入公海 -->
    <put-pool-handle
      :visible.sync="putPoolShow"
      :selection-list="[detail]"
      @handle="handleCallBack" />

    <!-- CRM相关新建 -->
    <c-r-m-all-create
      v-if="crmCreateShow"
      :crm-type="createCRMType"
      :action="createActionInfo"
      @save-success="createCRMSuccess"
      @close="createCRMClose" />

    <!-- 任务创建 -->
    <task-create
      v-if="taskCreateShow"
      :action="createAction"
      @save="createCRMSuccess"
      @close="taskCreateShow = false"
    />
  </div>
</template>
<script type="text/javascript">
import { mapGetters } from 'vuex'
import {
  crmLeadsTransformAPI,
  crmLeadsDeleteAPI,
  crmLeadsTransferAPI
} from '@/api/crm/leads'
import {
  crmCustomerLockAPI,
  crmCustomerDeleteAPI,
  crmCustomerPoolDeleteAPI,
  crmCustomerReceiveAPI,
  crmCustomerTransferAPI
} from '@/api/crm/customer'
import {
  crmContactsDeleteAPI,
  crmContactsTransferAPI
} from '@/api/crm/contacts'
import {
  crmBusinessDeleteAPI,
  crmBusinessTransferAPI
} from '@/api/crm/business'
import {
  crmContractDeleteAPI,
  crmContractCancelAPI,
  crmContractTransferAPI
} from '@/api/crm/contract'
import {
  crmReceivablesDeleteAPI,
  crmReceivablesTransferAPI
} from '@/api/crm/receivables'
import { crmReceivablesPlanDeleteAPI } from '@/api/crm/receivablesPlan'
import {
  crmMarketingIsEnableAPI,
  crmMarketingDeleteAPI
} from '@/api/crm/marketing'
import { crmReturnVisitDeleteAPI } from '@/api/crm/visit'
import {
  crmProductStatusAPI,
  crmProductDeleteAPI,
  crmProductTransferAPI
} from '@/api/crm/product'

import {
  crmInvoiceDeleteIdsAPI,
  crmInvoiceTransferAPI
} from '@/api/crm/invoice'
import {
  filedUpdateTableFieldAPI
} from '@/api/crm/common'

import TransferHandle from '@/components/Page/SelectionHandle/TransferHandle' // 转移
import AllocHandle from './SelectionHandle/AllocHandle' // 公海分配操作
import DealStatusHandle from './SelectionHandle/DealStatusHandle' // 客户状态修改操作
import TimePiece from '../../../callCenter/TimePiece'
import PutPoolHandle from './SelectionHandle/PutPoolHandle' // 放入公海
import CRMAllCreate from '@/views/crm/components/CRMAllCreate'
import TaskCreate from '@/views/oa/taskExamine/task/Create'

import { objDeepCopy } from '@/utils'
import TagView from '@/components/NewCom/WkTag/TagView' // 标签
import WkTag from '@/components/NewCom/WkTag'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import { getPermissionByKey } from '@/utils'
import { getCrmHelpObj } from '../utils'

export default {
  name: 'CRMDetailHead',
  components: {
    TransferHandle,
    AllocHandle,
    TimePiece,
    DealStatusHandle,
    PutPoolHandle,
    CRMAllCreate,
    TaskCreate,
    TagView,
    WkTag
  },
  props: {
    // 模块ID
    id: [String, Number],
    poolId: [String, Number],
    // 公海权限
    poolAuth: Object,
    // 没有值就是全部类型 有值就是当个类型
    crmType: {
      type: String,
      default: ''
    },
    // 辅助 使用
    isSeas: {
      type: Boolean,
      default: false
    },
    // 操作按钮
    handles: {
      type: Array,
      default: () => {
        return []
      }
    },
    // 联系人人下 新建商机 需要联系人里的客户信息  合同下需要客户和商机信息 合同作废需要合同状态
    detail: {
      type: Object,
      default: () => {
        return {}
      }
    },
    // 呼出信息
    modelData: {
      type: Object,
      default: () => {
        return {}
      }
    },
    pageList: Array,
    // 摘要
    headDetails: Array,
    // 标签数据
    tagInfo: null
  },
  data() {
    return {
      moreTypes: [], // 更多操作
      transferHandleProps: {},
      transferDialogShow: false, // 转移操作
      allocDialogShow: false, // 公海分配操作提示框
      dealStatusShow: false, // 成交状态修改框
      putPoolShow: false, // 客户放入公海

      // CRM相关新建
      crmCreateShow: false,
      createActionInfo: { type: 'relative', crmType: this.crmType, data: {}},
      createCRMType: '',
      // 任务新建
      taskCreateShow: false,
      createAction: {
        type: 'save'
      }
    }
  },
  computed: {
    ...mapGetters(['crm']),
    crmIcon() {
      return require(`@/assets/img/crm/${this.crmType}.png`)
    },
    showTimer() {
      return this.$store.state.crm.showTimer
    },
    // 只有正在通话的页面才能展示时间
    isCall() {
      if (this.modelData) {
        if (this.modelData.modelId == this.id && this.modelData.model === this.crmType) {
          return true
        } else {
          return false
        }
      } else {
        return true
      }
    },
    typeName() {
      return (
        {
          leads: '线索',
          customer: '客户',
          contacts: '联系人',
          product: '产品',
          business: '商机',
          contract: '合同',
          receivables: '回款',
          receivablesPlan: '回款计划',
          marketing: '活动',
          visit: '回访',
          invoice: '发票'
        }[this.crmType] || ''
      )
    },
    name() {
      if (this.crmType === 'receivables') {
        return this.detail.number
      } else if (this.crmType === 'customer') {
        return this.detail.customerName
      } else if (this.crmType === 'business') {
        return this.detail.businessName
      } else if (this.crmType === 'marketing') {
        return this.detail.marketingName
      } else if (this.crmType === 'visit') {
        return this.detail.visitNumber
      } else if (this.crmType === 'invoice') {
        return this.detail.invoiceApplyNumber
      } else if (this.crmType === 'receivablesPlan') {
        return this.detail.num
      }
      return this.detail.name
    },
    // 展示转移
    showTransfer() {
      if (
        this.crmType === 'customer' ||
         this.crmType === 'marketing' ||
         this.crmType === 'visit' ||
        this.isSeas
      ) {
        return false
      }

      if (this.crmType === 'contract') {
        return (
          this.detail &&
          this.detail.checkStatus != 8 &&
          this.crm[this.crmType].transfer
        )
      }

      return this.crm[this.crmType].transfer
    },
    showEdit() {
      //  8 已作废 的合同可以编辑
      return this.isSeas ? false : this.crm[this.crmType].update
    },

    // 展示领取
    showGet() {
      return this.isSeas && this.whetherTypeShowByPermision('get')
    },

    // 展示分配
    showAlloc() {
      return this.isSeas && this.whetherTypeShowByPermision('alloc')
    },

    /**
     * 客户是否锁定
     */
    isLock() {
      if (this.detail) {
        return this.detail.status == 2 // 1是正常 2 是锁定
      }
      return false
    },

    /**
     * 展示成交按钮
     */
    showDealStatus() {
      return (
        !this.isSeas &&
        this.crmType == 'customer' &&
        this.crm[this.crmType].dealStatus
      )
    },

    /**
     * 权限内的更多按钮
     */
    permissionMoreTypes() {
      return this.moreTypes.filter(item => {
        return this.whetherTypeShowByPermision(item.type)
      })
    }
  },
  watch: {
    isSeas() {
      this.moreTypes = this.getSelectionHandleItemsInfo()
    }
  },
  mounted() {
    this.moreTypes = this.getSelectionHandleItemsInfo()
  },
  methods: {
    getAuthByStr(auth) {
      if (!auth) return true
      return getPermissionByKey(auth)
    },

    /**
     * 标签操作
     */
    commonChange(value) {
      const params = {
        id: this.id,
        batchId: this.detail.batchId,
        label: this.isSeas ? crmTypeModel['pool'] : crmTypeModel[this.crmType],
        list: [this.tagInfo]
      }
      filedUpdateTableFieldAPI(params)
        .then(res => {
          this.$emit('handle', { type: 'tag_change' })
        })
        .catch(() => {
          this.$emit('handle', { type: 'tag_change' })
        })
    },
    /** 更多操作 */
    handleTypeClick(type) {
      // alert(1)
      if (type == 'edit') {
        // 编辑
        this.$emit('handle', { type: 'edit' })
      } else if (type == 'transfer') {
        // 转移
        this.transferHandleProps = {
        // 场景编辑请求
          request: {
            leads: crmLeadsTransferAPI,
            customer: crmCustomerTransferAPI,
            contacts: crmContactsTransferAPI,
            product: crmProductTransferAPI,
            business: crmBusinessTransferAPI,
            contract: crmContractTransferAPI,
            receivables: crmReceivablesTransferAPI,
            invoice: crmInvoiceTransferAPI
          }[this.crmType],
          params: { ids: [this.detail[this.crmType + 'Id']] },
          showChangeOwner: this.crmType === 'customer', // 同时变更负责人
          showRemoveType: !['leads', 'product', 'invoice'].includes(this.crmType), // 是否展示移除操作类型
          // 帮助提示
          help: getCrmHelpObj(this.crmType, 'transfer')
        }
        this.transferDialogShow = true
      } else if (
        type == 'transform' ||
        type == 'delete' ||
        type == 'lock' ||
        type == 'unlock' ||
        type == 'start' ||
        type == 'disable' ||
        type == 'state_start' ||
        type == 'state_disable' ||
        type == 'get' ||
        type == 'cancel'
      ) {
        var message = ''
        if (type == 'transform') {
          message = '确定将这些线索转换为客户吗?'
        } else if (type == 'delete') {
          message = this.isSeas ? '若客户下有联系人，联系人将一并删除。确定删除？' : '确定删除?'
        } else if (type == 'lock') {
          message = '确定要锁定该客户吗？锁定后将不会掉入公海。'
        } else if (type == 'unlock') {
          message = '确定要解锁该客户吗？'
        } else if (type == 'start') {
          message = '确定要上架该产品吗?'
        } else if (type == 'disable') {
          message = '确定要下架该产品吗?'
        } else if (type == 'state_start') {
          message = '确定要启用该活动吗?'
        } else if (type == 'state_disable') {
          message = '确定要停用该活动吗?'
        } else if (type == 'get') {
          message = '确定要领取该客户吗?'
        } else if (type == 'cancel') {
          message = '确定要作废此合同吗?'
          if (this.detail.receivablesCount) {
            message = '合同下有相关回款,确定要作废吗?'
          }
        }

        this.$confirm(message, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.confirmHandle(type)
          })
          .catch(() => {})
      } else if (type == 'alloc') {
        // 公海分配操作
        this.allocDialogShow = true
      } else if (type == 'deal_status') {
        // 客户成交状态操作
        this.dealStatusShow = true
      } else if (type == 'put_seas') {
        // 客户放入公海
        this.putPoolShow = true
      } else if (type == 'print') {
        // 打印
        const id = this.detail[`${this.crmType}Id`]
        const routeData = this.$router.resolve(`/print/?module=${this.crmType}&id=${id}`)
        window.open(routeData.href, '_blank')
      } else if (type == 'copyContract') {
        this.$emit('handle-click', { type })
      }
    },
    confirmHandle(type) {
      if (type === 'lock' || type === 'unlock') {
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
            this.$set(this.detail, 'status', status)
            this.$emit('handle', { type: type })
          })
          .catch(() => {})
      } else if (type === 'transform') {
        crmLeadsTransformAPI([this.id])
          .then(res => {
            this.$message({
              type: 'success',
              message: '转化成功'
            })
            // 刷新待办
            this.$store.dispatch('GetMessageNum')

            this.$emit('handle', { type: type })
          })
          .catch(() => {})
      } else if (type === 'start' || type === 'disable') {
        crmProductStatusAPI({
          ids: [this.id],
          status: type === 'start' ? '1' : '0'
        })
          .then(res => {
            this.$message({
              type: 'success',
              message: '操作成功'
            })
            this.$emit('handle', { type: type })
          })
          .catch(() => {})
      } else if (type === 'state_start' || type === 'state_disable') {
        crmMarketingIsEnableAPI({
          marketingIds: this.id,
          status: type === 'state_start' ? 1 : 0
        })
          .then(res => {
            this.$message({
              type: 'success',
              message: '操作成功'
            })
            this.$emit('handle', { type: type })
          })
          .catch(() => {})
      } else if (type === 'delete') {
        const request = {
          leads: crmLeadsDeleteAPI,
          customer: this.isSeas ? crmCustomerPoolDeleteAPI : crmCustomerDeleteAPI,
          contacts: crmContactsDeleteAPI,
          business: crmBusinessDeleteAPI,
          contract: crmContractDeleteAPI,
          receivables: crmReceivablesDeleteAPI,
          receivablesPlan: crmReceivablesPlanDeleteAPI,
          marketing: crmMarketingDeleteAPI,
          visit: crmReturnVisitDeleteAPI,
          product: crmProductDeleteAPI,
          invoice: crmInvoiceDeleteIdsAPI
        }[this.crmType]
        const params = {}
        if (this.isSeas) {
          params.poolId = this.poolId
        }
        params.ids = [this.id]
        request(this.isSeas ? params : params.ids)
          .then(res => {
            this.$message({
              type: 'success',
              message: '删除成功'
            })
            this.$emit('handle', { type: type })
          })
          .catch(() => {})
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

            this.$emit('handle', { type: type })
          })
          .catch(() => {})
      } else if (type === 'cancel') {
        crmContractCancelAPI({
          contractId: this.id
        })
          .then(res => {
            this.$message.success('操作成功')
            this.$emit('handle', { type })
          })
          .catch(() => {})
      }
    },
    // 子组件 回调的 结果
    handleCallBack(data) {
      this.$emit('handle', { type: data.type })
    },

    /** 更多操作 */
    /** 获取展示items */
    getSelectionHandleItemsInfo() {
      const handleInfos = {
        transfer: {
          name: '转移',
          type: 'transfer',
          icon: 'transfer'
        },
        transform: {
          name: '转化为客户',
          type: 'transform',
          icon: 'transform'
        },
        export: {
          name: '导出选中',
          type: 'export',
          icon: 'export'
        },
        delete: {
          name: '删除',
          type: 'delete',
          icon: 'delete'
        },
        put_seas: {
          name: '放入公海',
          type: 'put_seas',
          icon: 'seas'
        },
        lock: {
          name: '锁定',
          type: 'lock',
          icon: 'lock'
        },
        unlock: {
          name: '解锁',
          type: 'unlock',
          icon: 'unlock'
        },
        add_user: {
          name: '添加团队成员',
          type: 'add_user',
          icon: 'add'
        },
        delete_user: {
          name: '移除团队成员',
          type: 'delete_user',
          icon: 'remove'
        },
        alloc: {
          name: '分配',
          type: 'alloc',
          icon: 'alloc'
        },
        get: {
          name: '领取',
          type: 'get',
          icon: 'receive'
        },
        start: {
          name: '上架',
          type: 'start',
          icon: 'shelves'
        },
        disable: {
          name: '下架',
          type: 'disable',
          icon: 'sold-out'
        },
        state_start: {
          name: '启用',
          type: 'state_start',
          icon: 'activation'
        },
        state_disable: {
          name: '停用',
          type: 'state_disable',
          icon: 'remove'

        },
        deal_status: {
          name: '更改成交状态',
          type: 'deal_status',
          icon: 's-status'
        },
        cancel: {
          name: '合同作废',
          type: 'cancel',
          icon: 'invalid'
        },
        print: {
          name: '打印',
          type: 'print',
          icon: 'print'
        },
        copyContract: {
          name: '复制合同',
          type: 'copyContract',
          icon: 'icon-double-note'
        }
      }
      if (this.crmType == 'leads') {
        return this.forSelectionHandleItems(handleInfos, [
          'transform',
          'delete'
        ])
      } else if (this.crmType == 'customer') {
        if (this.isSeas) {
          return this.forSelectionHandleItems(handleInfos, [
            'delete'
          ])
        } else {
          return this.forSelectionHandleItems(handleInfos, [
            'transfer',
            'put_seas',
            'lock',
            'unlock',
            'delete'
          ])
        }
      } else if (this.crmType == 'contacts') {
        return this.forSelectionHandleItems(handleInfos, ['delete'])
      } else if (this.crmType == 'business') {
        return this.forSelectionHandleItems(handleInfos, ['print', 'delete'])
      } else if (this.crmType == 'contract') {
        return this.forSelectionHandleItems(handleInfos, ['print', 'delete', 'cancel', 'copyContract'])
      } else if (this.crmType == 'receivables') {
        return this.forSelectionHandleItems(handleInfos, ['print', 'delete'])
      } else if (this.crmType == 'product') {
        return this.forSelectionHandleItems(handleInfos, ['delete', 'start', 'disable'])
      } else if (this.crmType == 'marketing') {
        return this.forSelectionHandleItems(handleInfos, [
          'state_start',
          'state_disable',
          'delete'
        ])
      } else if (this.crmType == 'visit') {
        return this.forSelectionHandleItems(handleInfos, [
          'delete'
        ])
      } else if (this.crmType == 'invoice') {
        return this.forSelectionHandleItems(handleInfos, [
          'delete'
        ])
      } else if (this.crmType == 'receivablesPlan') {
        return this.forSelectionHandleItems(handleInfos, [
          'delete'
        ])
      }
      return []
    },
    forSelectionHandleItems(handleInfos, array) {
      var tempsHandles = []
      for (let index = 0; index < array.length; index++) {
        tempsHandles.push(handleInfos[array[index]])
      }
      return tempsHandles
    },

    /**
     * 判断是否展示
     */
    whetherTypeShowByPermision(type) {
      if (!this.crm || !this.crm[this.crmType]) {
        return
      }

      if (type == 'transfer') {
        return this.crm[this.crmType].transfer
      } else if (type == 'transform') {
        return this.crm[this.crmType].transform
      } else if (type == 'export') {
        if (this.isSeas) {
          if (this.poolId) {
            return this.poolAuth.excelexport
          }
          return this.crm.pool && this.crm.pool.excelexport
        }
        return this.crm[this.crmType].excelexport
      } else if (type == 'delete') {
        if (this.isSeas) {
          if (this.poolId) {
            return this.poolAuth && this.poolAuth.delete
          }
          return this.crm.pool && this.crm.pool.delete && this.poolId
        }
        return this.crm[this.crmType].delete
      } else if (type == 'put_seas') {
        // 放入公海(客户)
        return this.crm[this.crmType].putinpool
      } else if (type == 'lock' || type == 'unlock') {
        // 锁定解锁(客户)
        return this.crm[this.crmType].lock
      } else if (type == 'add_user' || type == 'delete_user') {
        // 添加 移除团队成员
        return this.crm[this.crmType].teamsave
      } else if (type == 'alloc') {
        // 分配(公海)
        if (this.poolId) {
          return this.poolAuth && this.poolAuth.distribute
        }
        return this.crm.pool && this.crm.pool.distribute
      } else if (type == 'get') {
        // 领取(公海)
        if (this.poolId) {
          return this.poolAuth && this.poolAuth.receive
        }
        return this.crm.pool && this.crm.pool.receive && this.poolId
      } else if (type == 'start' || type == 'disable') {
        // 上架 下架(产品)
        return this.crm[this.crmType].status
      } else if (type == 'deal_status') {
        // 客户状态修改
        return this.crm[this.crmType].dealStatus
      } else if (type == 'cancel') {
        // 合同作废 1 通过 10 正常
        if (this.crm[this.crmType].discard && (this.detail.checkStatus === 1 || this.detail.checkStatus === 10)) {
          return true
        }
        return false
      } else if (type == 'state_start' || type == 'state_disable') {
        // 活动停用/启用
        return this.crm[this.crmType].updateStatus
      } else if (type == 'print') {
        // 打印
        return this.crm[this.crmType].print
      } else if (type == 'copyContract') {
        // 合同复制
        return this.crm[this.crmType].save
      }

      return true
    },

    /**
     * 上下页切换
     */
    pageChange(type) {
      this.$emit('pageChange', type)
    },

    // 顶部新建按钮操作
    /**
     * 操作点击
     */
    handleClick(type) {
      if (type == 'task') {
        const relatedObj = {}
        relatedObj[this.crmType] = [this.detail]
        const relatedObjIds = {}
        relatedObjIds[`${this.crmType}Ids`] = [this.id]

        const params = {}
        params[`${this.crmType}Ids`] = this.id

        this.createAction = {
          type: 'save',
          data: {
            relatedObj: relatedObj,
            relatedObjIds: relatedObjIds
          },
          params: params
        }
        this.taskCreateShow = true
      } else {
        const aciton = { type: 'relative', crmType: this.crmType, data: {}}
        if (this.crmType == 'contacts') {
          aciton.data['customer'] = objDeepCopy(this.detail)
          // 联系人下新建商机直接关联
          if (type == 'business') {
            aciton.relativeData = {
              contactsId: this.detail.contactsId
            }
          }
        } else if (this.crmType == 'customer') {
          aciton.data['customer'] = objDeepCopy(this.detail)
        } else if (this.crmType == 'business') {
          aciton.data['customer'] = objDeepCopy(this.detail)
          aciton.data['business'] = objDeepCopy(this.detail)
          // 商机下新建联系人直接关联
          if (type == 'contacts') {
            aciton.relativeData = {
              businessId: this.detail.businessId
            }
          }
        } else if (this.crmType == 'contract') {
          aciton.data['customer'] = objDeepCopy(this.detail)
          aciton.data['contract'] = objDeepCopy(this.detail)
        }

        this.createActionInfo = aciton
        this.createCRMType = type
        this.crmCreateShow = true
      }
    },

    /**
     * CRM新建成功
     */
    createCRMSuccess() {
      this.$emit('create-success')
    },

    /**
     * 创建关闭
     */
    createCRMClose() {
      this.crmCreateShow = false
    }
  }
}
</script>

<style lang="scss">
.wk-header-page-btn {
  flex-shrink: 0;
  margin-left: #{$--interval-base * 3};

  .el-button + .el-button {
    margin-left: $--interval-base !important;
  }

  .el-button {
    padding: 6px;

    i {
      font-weight: bold;
    }
  }
}
</style>

<style lang="scss" scoped>
@import "../styles/table.scss";

.container {
  position: relative;
  background-color: white;
}

.t-section {
  position: relative;
  min-height: 60px;

  &__hd {
    display: block;
    width: 40px;
    height: 40px;
    margin-right: 15px;
  }

  &__bd {
    flex: 1;
    width: 0;

    .type-name {
      margin-bottom: 2px;
      font-size: $--font-size-base;
      color: $--color-text-secondary;
    }

    .type-content {
      .name {
        display: box;
        overflow: hidden;
        font-size: $--font-size-xxlarge;
        font-weight: $--font-weight-bold;
        text-overflow: ellipsis;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
      }

      .tag-view {
        margin-left: 5px;
      }

      .wk-edit {
        margin-left: 5px;
        cursor: pointer;
      }
    }

    .right-handle {
      font-size: 0;

      .dropdown-btn {
        padding: 8px;
        margin-left: $--interval-base;
      }
    }
  }
}

// 标签
.tags {
  margin-bottom: 8px;
}

.head-handle-button {
  & + & {
    margin-left: $--interval-base;
  }

  /deep/ i {
    margin-right: 5px;
    font-size: 13px;
  }
}

.abstract {
  position: relative;
  margin-top: #{$--interval-base * 2};

  .vux-flexbox {
    padding: #{$--interval-base * 2};
    background-color: $--color-n20;
    border-radius: $--border-radius-base;
  }

  &-item {
    flex: 0 0 20%;
    overflow: hidden;

    & + & {
      padding-left: $--interval-base;
    }
  }

  &-title {
    color: $--color-text-secondary;
  }

  &-value {
    min-height: 14px;
    margin-top: #{$--interval-base};
  }
}

.main-handle {
  /deep/ .el-button {
    i {
      font-size: 14px;
    }
  }
}

.phone-item {
  color: $--color-g300;

  i {
    margin-right: #{$--interval-base / 2};
  }
}
</style>
