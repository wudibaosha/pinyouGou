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
          subtitle="确认结算金额"
          :class="{'is-shadow': bodyIsScroll}"
          :title="detailData.customerName"
          :page-list="pageList"
          :dropdowns="handleOperations"
          @command="headerRightClick"
          @pageChange="pageChange"
        >

          <template slot="right">
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

        <div class="d-container-body" @scroll="bodyScroll">
          <detail-head-base :list="headDetails" />
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
  crmSettlementReadAPI,
  crmSettlementDeleteAPI
} from '@/api/crm/settlement'

import SlideView from '@/components/SlideView'
import TransferHandle from '@/components/Page/SelectionHandle/TransferHandle' // 转移
import CRMEditBaseInfo from '../components/CRMEditBaseInfo' // 基本信息
import RelativeHandle from '../components/RelativeHandle' // 相关操作
import RelativeFiles from '../components/RelativeFiles' // 相关附件
import RelativeTeam from '../components/RelativeTeam' // 团队成员

import CRMAllCreate from '../components/CRMAllCreate' // 新建页面
import TaskCreate from '@/views/oa/taskExamine/task/Create'
import DetailMixin from '../mixins/Detail'

export default {
  name: 'SettlementDetail',
  components: {
    SlideView,
    TransferHandle,
    CRMEditBaseInfo,
    RelativeHandle,
    RelativeFiles,
    RelativeTeam,
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
      crmType: 'settlement',
      headDetails: [],
      tabCurrentName: 'CRMEditBaseInfo'
    }
  },
  computed: {

    // 可操作选项
    handleOperations() {
      return this.getOperations(['delete'])
    },

    // tabs
    tabNames() {
      var tempsTabs = []
      console.log(this.detailData)
      if (this.crm.settlement && this.crm.settlement.read) {
        tempsTabs.push({ label: '详细资料', name: 'CRMEditBaseInfo' })
      }

      tempsTabs.push({ label: '团队成员', name: 'RelativeTeam', num: this.tabsNumber.memberCount })

      tempsTabs.push({ label: '附件', name: 'RelativeFiles', num: this.tabsNumber.fileCount })
      tempsTabs.push({ label: '操作记录', name: 'RelativeHandle', num: 0 })
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
      crmSettlementReadAPI({
        settlementId: this.id
      })
        .then(res => {
          this.loading = false
          const resData = res.data || {}
          this.detailData = resData
          // 负责人
          this.headDetails = [
            { title: '确认结算金额编号', value: resData.num },
            { title: '确认结算金额金额', value: resData.money },
            { title: '负责人', value: resData.ownerUserName },
            { title: '创建时间', value: resData.createTime }
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
            crmSettlementDeleteAPI([this.id])
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
