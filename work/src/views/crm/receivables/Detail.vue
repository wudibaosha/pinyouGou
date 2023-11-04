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
          subtitle="回款"
          :class="{'is-shadow': bodyIsScroll}"
          :title="detailData.number"
          :page-list="pageList"
          :dropdowns="handleOperations"
          @command="headerRightClick"
          @pageChange="pageChange"
        >

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
            <div class="right">
              <examine-info-section
                v-if="detailData.examineRecordId"
                :id="id"
                :record-id="detailData.examineRecordId"
                :owner-user-id="detailData.ownerUserId"
                examine-type="crm_receivables"
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
  crmReceivablesReadAPI,
  crmReceivablesDeleteAPI
} from '@/api/crm/receivables'

import SlideView from '@/components/SlideView'
import TransferHandle from '@/components/Page/SelectionHandle/TransferHandle' // 转移
import RelativeStageRecords from '../components/RelativeStageRecords' // 阶段记录
import CRMEditBaseInfo from '../components/CRMEditBaseInfo' // 基本信息
import RelativeFiles from '../components/RelativeFiles' // 相关附件
import RelativeHandle from '../components/RelativeHandle' // 相关操作
import RelativePrint from '../components/RelativePrint' // 相关打印
import RelativeTeam from '../components/RelativeTeam' // 团队成员
import RelativeInvoice from '../components/RelativeInvoice'
import RelativeProject from '../components/RelativeProject'
import CRMAllCreate from '../components/CRMAllCreate' // 新建页面
import ExamineInfoSection from '@/components/Examine/ExamineInfoSection'

import DetailMixin from '../mixins/Detail'
import { separator } from '@/filters/vueNumeralFilter/filters'

export default {
  // 客户管理 的 回款详情
  name: 'ReceivablesDetail',
  components: {
    SlideView,
    TransferHandle,
    RelativeStageRecords,
    CRMEditBaseInfo,
    RelativeFiles,
    RelativeHandle,
    RelativePrint,
    RelativeTeam,
    ExamineInfoSection,
    CRMAllCreate,
    RelativeInvoice,
    RelativeProject
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
      crmType: 'receivables',
      // 名称
      name: '',
      headDetails: [],
      tabCurrentName: 'CRMEditBaseInfo'
    }
  },
  computed: {
    // 可操作选项
    handleOperations() {
      return this.getOperations(['print', 'delete'])
    },

    // tabs
    tabNames() {
      var tempsTabs = [{ label: '详细资料', name: 'CRMEditBaseInfo' }]

      tempsTabs.push({ label: '团队成员', num: this.tabsNumber.memberCount, name: 'RelativeTeam' })
      tempsTabs.push({ label: '发票', num: this.tabsNumber.invoiceCount, name: 'RelativeInvoice' })
      tempsTabs.push({ label: '项目申请', num: this.tabsNumber.projectCount, name: 'RelativeProject' })
      tempsTabs.push({
        label: '附件', num: this.tabsNumber.fileCount,
        name: 'RelativeFiles'
      })

      if (this.crm.receivables && this.crm.receivables.print) {
        tempsTabs.push({ label: '打印记录', name: 'RelativePrint' })
      }

      tempsTabs.push({ label: '操作记录', name: 'RelativeHandle' })
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
      crmReceivablesReadAPI({
        id: this.id
      })
        .then(res => {
          this.loading = false
          const resData = res.data || {}
          this.name = resData.number
          this.detailData = resData

          this.headDetails = [
            { title: '客户联系人', value: resData.customerName },
            { title: '合同金额', value: separator(resData.contractMoney || 0) },
            // { title: '合同名称', value: resData.contractName },
            { title: '回款日期', value: resData.returnTime },
            { title: '回款金额', value: separator(resData.money || 0) },
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

    /**
     * 审核操作
     */
    examineHandle() {
      this.detailHeadHandle({ type: 'examine' })
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
        if (this.detailData.checkStatus === 3) {
          // this.createCRMType = this.crmType
          // this.createActionInfo = {
          //   type: 'update',
          //   id: this.id,
          //   batchId: this.detailData.batchId
          // }
          this.crmCreateShow = true
          this.$message.error('审核中的回款通过、拒绝或撤回之后才可编辑')
          return false
        } else if (this.detailData.checkStatus === 1 || this.detailData.checkStatus === 2 || this.detailData.checkStatus === 4 || this.detailData.checkStatus === 5) {
          this.createCRMType = this.crmType
          this.createActionInfo = {
            type: 'update',
            id: this.id,
            batchId: this.detailData.batchId
          }
          this.crmCreateShow = true
        } else {
          this.$message.error('回款只有在通过、拒绝、撤回、未提交状态下才可编辑')
          return false
        }
      } else if (type == 'delete') {
        this.$confirm('确定删除?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            crmReceivablesDeleteAPI([this.id])
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
</style>
