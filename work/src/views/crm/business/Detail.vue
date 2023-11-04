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
          subtitle="商机"
          :class="{'is-shadow': bodyIsScroll}"
          :title="detailData.businessName"
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
            nav-mode="more">
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
                :contacts-id.sync="firstContactsId"
                :is-contact="tabsNumber.contractCount"
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
  crmBusinessReadAPI,
  crmBusinessDeleteAPI
} from '@/api/crm/business'

import SlideView from '@/components/SlideView'
import TransferHandle from '@/components/Page/SelectionHandle/TransferHandle' // 转移
import RelativeStageRecords from '../components/RelativeStageRecords' // 阶段记录
import Activity from '../components/Activity' // 活动
import CRMEditBaseInfo from '../components/CRMEditBaseInfo' // 商机基本信息
import RelativeContract from '../components/RelativeContract' // 相关合同
import RelativeContacts from '../components/RelativeContacts' // 相关联系人
import RelativeHandle from '../components/RelativeHandle' // 相关操作
import RelativeTeam from '../components/RelativeTeam' // 团队成员
import RelativeProduct from '../components/RelativeProduct' // 团队成员
import RelativeFiles from '../components/RelativeFiles' // 相关附件
import RelativePrint from '../components/RelativePrint' // 相关打印

import CRMAllCreate from '../components/CRMAllCreate' // 新建页面
import TaskCreate from '@/views/oa/taskExamine/task/Create'

import DetailMixin from '../mixins/Detail'
import { separator } from '@/filters/vueNumeralFilter/filters'

export default {
  // 客户管理 的 商机详情
  name: 'BusinessDetail',
  components: {
    SlideView,
    TransferHandle,
    RelativeStageRecords,
    Activity,
    CRMEditBaseInfo,
    RelativeContract,
    RelativeContacts,
    RelativeHandle,
    RelativeTeam,
    RelativeProduct,
    RelativeFiles,
    RelativePrint,
    CRMAllCreate,
    TaskCreate
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
      crmType: 'business',
      headDetails: [],
      tabCurrentName: 'Activity',
      // 首要联系人信息
      firstContactsId: ''
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
          command: 'contacts',
          icon: 'wk wk-contacts-line',
          label: '创建联系人',
          auth: 'crm.contacts.save'
        }, {
          command: 'contract',
          icon: 'wk wk-contract-line',
          label: '创建合同',
          auth: 'crm.contract.save'
        }, {
          command: 'receivables',
          icon: 'wk wk-receivables-line',
          label: '创建回款',
          auth: 'crm.receivables.save'
        }
      ]
      const temps2 = [
        {
          command: 'task',
          icon: 'wk wk-icon-task-line',
          label: '创建任务',
          auth: 'oa.taskExamine'
        }, {
          command: 'contacts',
          icon: 'wk wk-contacts-line',
          label: '创建联系人',
          auth: 'crm.contacts.save'
        }, {
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
      if (Number(this.tabsNumber.contractCount) > 0) {
        return temps2
      } else {
        return temps
      }
    },

    // 可操作选项
    handleOperations() {
      return this.getOperations(['print', 'delete'])
    },

    // tabs
    tabNames() {
      var tempsTabs = []
      tempsTabs.push({ label: '活动', name: 'Activity' })
      if (this.crm.business && this.crm.business.read) {
        tempsTabs.push({ label: '详细资料', name: 'CRMEditBaseInfo' })
      }

      if (this.crm.contacts && this.crm.contacts.index) {
        tempsTabs.push({ label: '联系人', num: this.tabsNumber.contactCount, name: 'RelativeContacts' })
      }

      if (this.crm.contract && this.crm.contract.index) {
        tempsTabs.push({ label: '合同', num: this.tabsNumber.contractCount, name: 'RelativeContract' })
      }

      if (this.crm.product && this.crm.product.index) {
        tempsTabs.push({ label: '产品', num: this.tabsNumber.productCount, name: 'RelativeProduct' })
      }

      tempsTabs.push({ label: '团队成员', num: this.tabsNumber.memberCount, name: 'RelativeTeam' })
      tempsTabs.push({ label: '附件', num: this.tabsNumber.fileCount, name: 'RelativeFiles' })
      tempsTabs.push({ label: '操作记录', name: 'RelativeHandle' })
      if (this.crm.business && this.crm.business.print) {
        tempsTabs.push({ label: '打印记录', name: 'RelativePrint' })
      }
      return tempsTabs
    },

    /**
     * 根据记录筛选
     */
    logTyps() {
      return [{
        icon: 'all',
        color: '#2362FB',
        command: '',
        label: '全部活动'
      }, {
        icon: 'customer',
        color: '#487DFF',
        command: 2,
        label: '客户'
      }, {
        icon: 'o-task',
        color: '#D376FF',
        command: 11,
        label: '任务'
      }, {
        icon: 'business',
        color: '#FB9323',
        command: 5,
        label: '商机'
      }, {
        icon: 'contract',
        color: '#FD5B4A',
        command: 6,
        label: '合同'
      }, {
        icon: 'contacts',
        color: '#27BA4A',
        command: 3,
        label: '联系人'
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
  mounted() {},
  methods: {
    /**
     * 详情
     */
    getDetial() {
      this.firstContactsId = ''
      this.loading = true
      crmBusinessReadAPI({
        businessId: this.id
      })
        .then(res => {
          this.loading = false
          const resData = res.data || {}
          this.detailData = resData
          this.firstContactsId = this.detailData.contactsId

          const money = resData.money || 0
          this.headDetails = [{ title: '客户联系人', value: resData.customerName },
            { title: '商机金额（元）', value: money > 0 ? separator(money) : '' },
            { title: '商机组', value: resData.typeName },
            { title: '负责人', value: resData.ownerUserName },
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
            crmBusinessDeleteAPI([this.id])
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
      } else if (type == 'print') {
        // 打印
        const id = this.detailData[`${this.crmType}Id`]
        const routeData = this.$router.resolve(`/print/?module=${this.crmType}&id=${id}`)
        window.open(routeData.href, '_blank')
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

/* stylelint-disable-next-line scss/dollar-variable-pattern */
$--state-height: 34px;

.busi-state-main {
  padding-top: #{$--interval-base * 2};
  background-color: white;
}

.busi-state {
  position: relative;
  z-index: 1;
  padding-left: 20px;
  overflow-x: auto;
  overflow-y: hidden;

  a {
    flex-shrink: 0;
  }
}

.busi-state-item {
  position: relative;
  min-width: 120px;
  height: $--state-height;
  padding: 0 16px;
  margin-right: $--interval-base;
  line-height: $--state-height;
  text-align: center;

  .state-circle {
    position: absolute;
    z-index: -1;
    width: $--state-height;
    height: $--state-height;
    background-color: white;
    border-radius: $--border-radius-base;
  }

  .state-arrow {
    position: absolute;
    width: $--state-height;
    height: $--state-height;
    background-color: white;
    transform: scale(0.707) rotate(45deg);
  }
}

.state-undo {
  background-color: $--color-n20;

  .state-circle {
    background-color: white;
  }

  .state-arrow {
    background-color: white;
  }

  .arrow-right {
    background-color: $--color-n20;
  }
}

.state-doing {
  color: $--color-success;
  background-color: white;
  border-top: 1px solid $--color-success;
  border-bottom: 1px solid $--color-success;

  .circle-left {
    background-color: white;
    border-color: $--color-success;
  }

  .circle-right {
    top: -1px;
    background-color: white;
    border-color: $--color-success;
    border-style: solid;
    border-top-width: 1px;
    border-right-width: 1px;
    border-bottom-width: 1px;
  }

  .arrow-left {
    top: -1px;
    left: -17px;
    background-color: white;
    border-color: $--color-success;
    border-top: 1px solid $--color-success;
    border-right: 1px solid $--color-success;
  }

  .arrow-right {
    top: -1px;
    right: -17px;
    background-color: white;
    border-color: $--color-success;
    border-top: 1px solid $--color-success;
    border-right: 1px solid $--color-success;
  }
}

.state-suc {
  color: white;
  background-color: $--color-success;

  .circle-left {
    background-color: $--color-success;
    border-color: $--color-success;
  }

  .circle-right {
    background-color: $--color-success;
    border-color: $--color-success;
  }

  .arrow-left {
    background-color: white;
    border-color: $--color-success;
  }

  .arrow-right {
    background-color: $--color-success;
    border-color: $--color-success;
  }
}

.state-fail {
  color: white;
  background-color: $--color-danger;

  .circle-left {
    background-color: $--color-danger;
    border-color: $--color-danger;
  }

  .circle-right {
    background-color: $--color-danger;
    border-color: $--color-danger;
  }

  .arrow-left {
    background-color: white;
    border-color: $--color-danger;
  }

  .arrow-right {
    background-color: $--color-danger;
    border-color: $--color-danger;
  }
}

.state-invalid {
  background-color: $--color-n30;

  .state-circle {
    background-color: $--color-n30;
    border-color: $--color-n30;
  }

  .state-arrow {
    background-color: $--color-n30;
    border-color: $--color-n30;
  }

  .circle-left {
    background-color: $--color-n30;
    border-color: $--color-n30;
  }

  .circle-right {
    background-color: $--color-n30;
    border-color: $--color-n30;
  }

  .arrow-left {
    background-color: white;
    border-color: $--color-n30;
  }

  .arrow-right {
    background-color: $--color-n30;
    border-color: $--color-n30;
  }
}

.arrow-right {
  top: 0;
  right: -17px;
  z-index: 1;
}

.arrow-left {
  top: 0;
  left: -17px;
}

.circle-right {
  top: 0;
  right: -15.5px;
  z-index: 1;
}

.circle-left {
  top: 0;
  left: -17px;
}

/** 状态操作布局 */
.state-handel-cont {
  font-size: 13px;

  .state-handel-item {
    padding: 10px 0;
    cursor: pointer;

    .state-handel-item-img {
      display: block;
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      margin-right: 8px;
      border-radius: 8px;
    }

    .state-handel-item-name {
      flex: 1;
    }

    .state-handel-item-value {
      flex-shrink: 0;
    }
  }

  .state-handel-item:hover {
    background-color: #f7f8fa;
  }
}
</style>
