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
          subtitle="回款计划"
          :class="{'is-shadow': bodyIsScroll}"
          :title="detailData.num"
          :page-list="pageList"
          :dropdowns="handleOperations"
          @command="headerRightClick"
          @pageChange="pageChange"
        >

          <template slot="right">
            <time-piece v-if="showTimer && isCall" />
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
  </slide-view>
</template>

<script>
import {
  crmReceivablesPlanReadAPI,
  crmReceivablesPlanDeleteAPI
} from '@/api/crm/receivablesPlan'

import SlideView from '@/components/SlideView'
import RelativeStageRecords from '../components/RelativeStageRecords' // 阶段记录
import CRMEditBaseInfo from '../components/CRMEditBaseInfo' // 产品基本信息
import RelativeFiles from '../components/RelativeFiles' // 相关附件
import RelativeHandle from '../components/RelativeHandle' // 相关操作

import CRMAllCreate from '../components/CRMAllCreate' // 新建页面
import Sections from '../components/Sections'

import DetailMixin from '../mixins/Detail'
import { separator } from '@/filters/vueNumeralFilter/filters'

export default {
  // 回款计划详情
  name: 'ReceivablesPlanDetail',
  components: {
    SlideView,
    RelativeStageRecords,
    CRMEditBaseInfo,
    RelativeFiles,
    RelativeHandle,
    CRMAllCreate,
    Sections
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
      crmType: 'receivablesPlan',
      headDetails: [
        { title: '客户联系人', value: '', field: 'customerName' },
        { title: '合同编号', value: '', field: 'contractNum' },
        { title: '计划回款金额', value: '', field: 'money', isMoney: true },
        { title: '计划回款日期', value: '', field: 'returnDate' },
        { title: '实际回款金额', value: '', field: 'realReceivedMoney', isMoney: true }
      ],
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
      const tempsTabs = [
        { label: '详细资料', name: 'CRMEditBaseInfo' },
        { label: '附件', num: this.tabsNumber.fileCount, name: 'RelativeFiles' },
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
      crmReceivablesPlanReadAPI(this.id)
        .then(res => {
          this.loading = false
          this.detailData = res.data || {}

          this.headDetails.forEach(item => {
            const itemValue = this.detailData[item.field]
            if (item.isMoney) {
              item.value = separator(itemValue || 0)
            } else {
              item.value = itemValue
            }
          })
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
      if (type === 'edit') {
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
            crmReceivablesPlanDeleteAPI([this.id])
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
