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
          subtitle="发票"
          :class="{'is-shadow': bodyIsScroll}"
          :title="detailData.invoiceApplyNumber"
          :page-list="pageList"
          :dropdowns="handleOperations"
          @command="headerRightClick"
          @pageChange="pageChange"
        >
          <template slot="left">
            <span v-if="detailData.checkStatus == 8" class="is-invalid">（已作废）</span>
            <span v-if="[3].includes(detailData.checkStatus) && !!detailData.isRefund" class="is-invalid">（退票审核中...）</span>
            <span v-if="detailData.invoiceStatus == 0 && !!detailData.isRefund && [1,10].includes(detailData.checkStatus)" class="is-invalid">（退票生成记录）</span>
            <span v-if="[3].includes(detailData.checkStatus) && !detailData.isRefund" class="is-invalid">（审核中...）</span>
            <span v-if="detailData.invoiceStatus == 2 && !detailData.isRefund" class="is-invalid">（已退过票）</span>
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
                    :other-list="baseDetailList"
                    :ignore-fields="['invoiceType']"
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
                examine-type="crm_invoice"
                @on-handle="examineHandle" />
            </div>
          </flexbox>
        </div>
      </flexbox>
    </div>

    <!-- 退票原因 -->
    <el-dialog
      title="退票原因"
      :visible.sync="refundVisible"
      append-to-body
      width="500px"
    >
      <el-select
        v-model="refundReason"
        placeholder="请选择退票原因"
        style="width: 100%;">
        <el-option
          v-for="(item, index) in refundReasonOptions"
          :key="index"
          :label="item.label"
          :value="item.value" />
      </el-select>
      <el-input
        v-model="refundReasonText"
        type="textarea"
        style="margin-top: 20px;"
        placeholder="请输入退票理由" />
      <span slot="footer" class="dialog-footer">
        <el-button @click="refundVisible = false">取 消</el-button>
        <el-button type="primary" @click="refundTicket">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 新建编辑 -->
    <create
      v-if="crmCreateShow"
      :action="createActionInfo"
      :detail="detailData"
      @save-success="editSaveSuccess"
      @close="crmCreateShow = false" />

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
  crmInvoiceReadAPI,
  crmInvoiceDeleteIdsAPI,
  crmInvoiceDiscardAPI
} from '@/api/crm/invoice'
import {
  crmQueryDishonorReasonAPI
} from '@/api/admin/crm'

import SlideView from '@/components/SlideView'
import TransferHandle from '@/components/Page/SelectionHandle/TransferHandle' // 转移
import RelativeStageRecords from '../components/RelativeStageRecords' // 阶段记录
import CRMEditBaseInfo from '../components/CRMEditBaseInfo' // 基本信息
import InvoiceDetailRelative from './components/InvoiceDetailRelative' // 基本信息
import RelativeFiles from '../components/RelativeFiles' // 相关附件
import RelativeHandle from '../components/RelativeHandle' // 相关操作
import ExamineInfoSection from '@/components/Examine/ExamineInfoSection'
import Create from './Create'

import DetailMixin from '../mixins/Detail'
import { separator } from '@/filters/vueNumeralFilter/filters'

export default {
  // 学员管理 的 发票详情
  name: 'InvoiceDetail',
  components: {
    SlideView,
    TransferHandle,
    RelativeStageRecords,
    CRMEditBaseInfo,
    RelativeFiles,
    RelativeHandle,
    ExamineInfoSection,
    Create,
    InvoiceDetailRelative
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
      crmType: 'invoice',
      // 名称
      name: '',
      headDetails: [],
      refundVisible: false,
      reNumVisible: false,
      refundReason: '', // 退票原因
      refundReasonText: '', // 退票理由
      refundReasonOptions: null,
      tabCurrentName: 'CRMEditBaseInfo',
      baseDetailList: [] // 基本详情list
    }
  },
  computed: {
    // 可操作选项
    handleOperations() {
      const operations = ['delete']
      if (this.detailData.invoiceStatus == 1 && this.detailData.checkStatus !== 8 && [1, 10].includes(this.detailData.checkStatus)) {
        operations.push('back_invioce')
      }
      if (this.$auth(`crm.${this.crmType}.discard`) && this.detailData.checkStatus == 1 && [1, 10].includes(this.detailData.checkStatus)) {
        operations.push('cancelInvoice')
      }
      return this.getOperations(operations)
    },

    // tabs
    tabNames() {
      var tempsTabs = [
        { label: '详细资料', name: 'CRMEditBaseInfo' },
        { label: '关联其他合同', name: 'InvoiceDetailRelative', num: this.tabsNumber.contractRelationCount },
        { label: '项目申请', num: this.tabsNumber.projectCount, name: 'RelativeProject' },
        {
          label: '附件', num: this.tabsNumber.fileCount,
          name: 'RelativeFiles'
        },
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
      crmInvoiceReadAPI(this.id)
        .then(res => {
          this.loading = false
          const resData = res.data || {}
          this.name = resData.invoiceNumber
          this.detailData = resData
          this.getBaseList(resData)

          // 负责人
          this.headDetails = [
            { title: '客户联系人', value: resData.customerName },
            // { title: '开票金额', value: separator(resData.invoiceMoney || 0) },
            { title: '发票号码', value: resData.invoiceNumber },
            { title: '实际开票日期', value: resData.realInvoiceDate }
          ]
        })
        .catch(() => {
          this.loading = false
          this.hideView()
        })
    },

    /**
     * 获取基本信息数据
     */
    getBaseList(data) {
      this.baseDetailList = [
        {
          name: '发票信息',
          list: [
            {
              name: '抬头类型',
              formType: 'text',
              value: {
                1: '单位',
                2: '个人'
              }[data.titleType]
            },
            {
              name: '开票抬头',
              formType: 'text',
              value: data.invoiceTitle
            },
            {
              name: '纳税人识别号',
              formType: 'text',
              value: data.taxNumber
            },
            {
              name: '开户行',
              formType: 'text',
              value: data.depositBank
            },
            {
              name: '开户账号',
              formType: 'text',
              value: data.depositAccount
            },
            {
              name: '开票地址',
              formType: 'text',
              value: data.depositAddress
            },
            {
              name: '电话',
              formType: 'text',
              value: data.telephone
            }
          ]
        },
        {
          name: '邮寄信息',
          list: [
            {
              name: '联系人',
              formType: 'text',
              value: data.contactsName
            },
            {
              name: '联系方式',
              formType: 'text',
              value: data.contactsMobile
            },
            {
              name: '邮寄地址',
              formType: 'text',
              value: data.contactsAddress || []
            }
          ]
        }
      ]
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

    /**
     * 获取退票原因
     */
    getRefundReasonList() {
      crmQueryDishonorReasonAPI()
        .then(res => {
          this.refundReasonOptions = res.data.map(item => {
            return {
              value: item,
              label: item
            }
          })
        })
        .catch(() => {})
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
        // if (this.detailData.checkStatus === 3) {
        //   this.$message.error('审核中的发票通过、拒绝或撤回之后才可编辑')
        //   return false
        // } else if (this.detailData.checkStatus === 1 || this.detailData.checkStatus === 2 || this.detailData.checkStatus === 4 || this.detailData.checkStatus === 8) {
          this.createCRMType = this.crmType
          this.createActionInfo = {
            type: 'update',
            id: this.id,
            batchId: this.detailData.batchId,
            detail: this.detailData
          }
          this.crmCreateShow = true
        // } else {
        //   this.$message.error('发票只有在通过、拒绝或撤回状态下才可编辑')
        //   return false
        // }
      } else if (type == 'delete') {
        this.$confirm('确定删除?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            crmInvoiceDeleteIdsAPI([this.id])
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
      } else if (type == 'cancelInvoice') {
        this.$confirm('确定撤销审批此发票么?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            crmInvoiceDiscardAPI({
              invoiceId: this.id
            })
              .then(res => {
                this.$message.success('操作成功')
                this.detailHeadHandle({ type })
              })
              .catch(() => {})
          })
          .catch(() => {})
      } else if (type == 'back_invioce') {
        this.refundReason = ''
        this.refundReasonText = ''
        this.getRefundReasonList()
        this.refundVisible = true
        // this.$confirm('确定退票?', '提示', {
        //   confirmButtonText: '确定',
        //   cancelButtonText: '取消',
        //   type: 'warning'
        // }).then(() => {
        //   const params = {}
        //   params.invoiceStatus = 0
        //   params.invoiceId = this.detailData.invoiceId
        //   crmInvoiceStatusUpdateAPI(params).then(res => {
        //     this.getDetial()
        //     this.$message.success('操作成功')
        //     this.detailHeadHandle({
        //       type: 'back_invioce'
        //     })
        //   }).catch(() => {})
        // })
      }
    },

    // 退票
    refundTicket() {
      if (this.refundReason) {
        this.$confirm('确认退票?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          const params = {}
          params.invoiceStatus = 2
          params.invoiceId = this.id
          params.dishonorReason = this.refundReason + ';' + this.refundReasonText
          crmInvoiceStatusUpdateReturnAPI(params).then(res => {
            this.refundVisible = false
            this.$message({
              type: 'success',
              message: '操作成功'
            })
            this.detailHeadHandle({
              type: 'update'
            })
          })
        })
      } else {
        this.$message.error('请选择退票理由')
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
