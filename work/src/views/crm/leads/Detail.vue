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
          subtitle="线索"
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
          v-if="activityHandle.length > 0"
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
            class="top-padding"
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
              <!-- 工商信息 -->
              <business-info-view
                v-if="item.name === 'BusinessInfoView'"
                :name="detailData.leadsName"
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
                :crm-type="crmType"
                :ignore-fields="['leadsName']"
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
  crmLeadsReadAPI,
  crmLeadsDeleteAPI,
  crmLeadsTransformAPI
} from '@/api/crm/leads'

import SlideView from '@/components/SlideView'
import TransferHandle from '@/components/Page/SelectionHandle/TransferHandle' // 转移
import RelativeStageRecords from '../components/RelativeStageRecords' // 阶段记录
import Activity from '../components/Activity'
import ImportInfo from '../components/ImportInfo' // 重要信息
import CRMEditBaseInfo from '../components/CRMEditBaseInfo' // 线索基本信息
import RelativeFiles from '../components/RelativeFiles' // 相关附件
import RelativeHandle from '../components/RelativeHandle' // 相关操作
import BusinessInfoView from '@/components/Premium/BusinessInfo/View'

import CRMAllCreate from '../components/CRMAllCreate' // 新建页面
import DetailMixin from '../mixins/Detail'

export default {
  // 线索管理 的 线索详情
  name: 'LeadsDetail',
  components: {
    SlideView,
    TransferHandle,
    RelativeStageRecords,
    Activity,
    CRMEditBaseInfo,
    RelativeFiles,
    RelativeHandle,
    ImportInfo,
    CRMAllCreate,
    BusinessInfoView
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
      crmType: 'leads',
      headDetails: [],
      tabCurrentName: 'Activity'
    }
  },
  computed: {
    /**
     * 活动操作
     */
    activityHandle() {
      const temps = []

      // if (this.canCreateFollowRecord) {
      //   temps = [{
      //     type: 'log',
      //     label: '写跟进'
      //   }]
      // }

      return temps
    },

    /**
     * 根据记录筛选
     */
    logTyps() {
      let logTypslist = []
      logTypslist = [
        {
          icon: 'all',
          color: '#2362FB',
          command: '',
          label: '全部活动'
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
    },

    // 可操作选项
    handleOperations() {
      return this.getOperations(['transform', 'delete'])
    },

    /**
     * tabs
     */
    tabNames() {
      const tempsTabs = [
        { label: '活动', name: 'Activity' },
        { label: '详细资料', name: 'CRMEditBaseInfo' },
        { label: '工商信息', name: 'BusinessInfoView' },
        { label: '附件', name: 'RelativeFiles', num: this.tabsNumber.fileCount },
        { label: '操作记录', name: 'RelativeHandle' }
      ]
      return tempsTabs
    }
  },
  mounted() {},
  methods: {
    /**
     * 详情
     */
    getDetial() {
      this.loading = true
      crmLeadsReadAPI(this.id)
        .then(res => {
          const resData = res.data || {}
          this.detailData = resData

          this.headDetails = [
            { title: '线索来源', value: resData.source },
            { title: '手机', value: resData.mobile },
            { title: '负责人', value: resData.ownerUserName },
            { title: '创建时间', value: resData.createTime }
          ]
          this.loading = false
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
            crmLeadsDeleteAPI([this.id])
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
      } else if (type == 'transform') {
        this.$confirm('确定将这些线索转换为客户吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            crmLeadsTransformAPI([this.id])
              .then(res => {
                this.$message({
                  type: 'success',
                  message: '转化成功'
                })
                // 刷新待办
                this.$store.dispatch('GetMessageNum')

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

.import-info {
  height: 100%;
  overflow: auto;
}
</style>
