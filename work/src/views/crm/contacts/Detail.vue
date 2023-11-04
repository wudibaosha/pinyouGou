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
          subtitle="联系人"
          :class="{'is-shadow': bodyIsScroll}"
          :title="detailData.name"
          :page-list="pageList"
          :dropdowns="handleOperations"
          @command="headerRightClick"
          @pageChange="pageChange"
        >

          <template slot="left">
            <el-tooltip :content="detailData.star == 0 ? '添加关注' : '取消关注'" effect="dark" placement="top">
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
              v-if="showTransfer"
              class="head-handle-button"
              @click="headerRightClick('transfer')">转移</el-button>
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
          <el-tabs
            v-model="tabCurrentName"
            nav-mode="more"
            class="top-padding">
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
                :crm-type="crmType"
                @handle="detailHeadHandle" />
            </el-tab-pane>
          </el-tabs>
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
  </slide-view>
</template>

<script>
import {
  crmContactsReadAPI,
  crmContactsDeleteAPI
} from '@/api/crm/contacts'

import SlideView from '@/components/SlideView'
import TransferHandle from '@/components/Page/SelectionHandle/TransferHandle' // 转移
import Activity from '../components/Activity' // 活动
import ContactsImport from './components/ContactsImport' // 重要信息
import CRMEditBaseInfo from '../components/CRMEditBaseInfo' // 联系人基本信息
import RelativeStageRecords from '../components/RelativeStageRecords' // 阶段记录
import RelativeBusiness from '../components/RelativeBusiness' // 相关商机
import RelativeHandle from '../components/RelativeHandle' // 相关操作
import RelativeFiles from '../components/RelativeFiles' // 相关附件
import RelativeTeam from '../components/RelativeTeam' // 团队成员

import CRMAllCreate from '../components/CRMAllCreate' // 新建页面
import TaskCreate from '@/views/oa/taskExamine/task/Create'
import DetailMixin from '../mixins/Detail'

export default {
  // 联系人管理 的 联系人详情
  name: 'ContactsDetail',
  components: {
    SlideView,
    TransferHandle,
    RelativeStageRecords,
    Activity,
    CRMEditBaseInfo,
    RelativeBusiness,
    RelativeHandle,
    RelativeFiles,
    RelativeTeam,
    CRMAllCreate,
    TaskCreate,
    ContactsImport
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
    },
    // 呼出信息
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
      crmType: 'contacts',
      headDetails: [],
      tabCurrentName: 'Activity'
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
        }
        // {
        //   command: 'business',
        //   icon: 'wk wk-business-line',
        //   label: '创建商机',
        //   auth: 'crm.business.save'
        // }, {
        //   command: 'contract',
        //   icon: 'wk wk-contract-line',
        //   label: '创建合同',
        //   auth: 'crm.contract.save'
        // }, {
        //   command: 'receivables',
        //   icon: 'wk wk-receivables-line',
        //   label: '创建回款',
        //   auth: 'crm.receivables.save'
        // }
      ]

      // if (this.canCreateFollowRecord) {
      //   temps = [{
      //     command: 'log',
      //     label: '写跟进'
      //   }].concat(temps)
      // }

      return temps
    },

    // 可操作选项
    handleOperations() {
      return this.getOperations(['delete'])
    },

    // tabs
    tabNames() {
      var tempsTabs = []
      tempsTabs.push({ label: '活动', name: 'Activity' })
      if (this.crm.contacts && this.crm.contacts.read) {
        tempsTabs.push({ label: '详细资料', name: 'CRMEditBaseInfo' })
      }

      tempsTabs.push({ label: '团队成员', name: 'RelativeTeam', num: this.tabsNumber.memberCount })

      if (this.crm.business && this.crm.business.index) {
        tempsTabs.push({ label: '商机', name: 'RelativeBusiness', num: this.tabsNumber.businessCount })
      }
      tempsTabs.push({ label: '附件', name: 'RelativeFiles', num: this.tabsNumber.fileCount })
      tempsTabs.push({ label: '操作记录', name: 'RelativeHandle', num: 0 })
      // if (this.statusShow) {
      //   tempsTabs.unshift({ label: '阶段记录', name: 'RelativeStageRecords' })
      // }
      return tempsTabs
    },

    // 根据记录筛选
    logTyps() {
      let logTypslist = []
      logTypslist = [{
        icon: 'all',
        color: '#2362FB',
        command: '',
        label: '全部活动'
      }, {
        icon: 'contacts',
        color: '#27BA4A',
        command: 3,
        label: '联系人'
      }, {
        icon: 'o-task',
        color: '#D376FF',
        command: 11,
        label: '任务'
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
      if (this.$store.state.crm.isCall) {
        logTypslist.push({
          icon: 'phone',
          color: '#9376FF',
          command: 13,
          label: '呼叫记录'
        })
      }
      return logTypslist
    },

    // 客户ID
    customerId() {
      return this.detailData ? this.detailData.customerId || '' : ''
    }
  },
  mounted() {},
  methods: {
    /**
     * 详情
     */
    getDetial() {
      this.loading = true
      crmContactsReadAPI({
        contactsId: this.id
      })
        .then(res => {
          this.loading = false
          const resData = res.data || {}
          this.detailData = resData
          // 负责人
          this.headDetails = [{ title: '客户联系人', value: resData.customerName },
            { title: '职务', value: resData.post },
            { title: '手机', value: resData.mobile },
            { title: '创建时间', value: resData.createTime }]
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
      } else if (type == 'delete') {
        this.$confirm('确定删除?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            crmContactsDeleteAPI([this.id])
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
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/crmdetail.scss";

.d-container-body {
  margin-top: 8px;
}
</style>
