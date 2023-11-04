<template>
  <div
    v-if="statusShow"
    v-loading="loading"
    class="main relative-stage-records">
    <flexbox
      class="header"
      align="stretch"
    >
      <!-- <div>
          当前阶段：
          <span class="stage-name">{{ stageName }}</span>
        </div> -->
      <!-- 阶段状态 -->
      <stage
        v-if="status.settingList.length > 0"
        :id="id"
        :status="status"
        :is-seas="isSeas"
        :crm-type="crmType"
        :detail="detail"
        @handleStatuResult="handleStatuResult"
        @change="statusChange" />

      <div class="stage-handel">
        <i v-if="helpObj" class="wk wk-icon-fill-help wk-help-tips" :data-type="helpObj.type" :data-id="helpObj.id" />
        <el-button
          v-if="showAdvance && statusInfo.flowName"
          type="primary"
          size="medium"
          @click="advanceClick">
          推进至阶段【{{ statusInfo.flowName }}】
        </el-button>
        <i v-if="showUnfold" :class="['wk', isUnfold ? 'wk-shrink' : 'wk-full']" style="cursor: pointer;" @click="isUnfold = !isUnfold" />
      </div>

    </flexbox>
    <div v-if="showStage && isUnfold" class="body">
      <!-- 阶段工作 -->
      <div
        v-if="statusInfo.taskData && statusInfo.taskData.length>0"
        class="stage-section">
        <div class="stage-section__hd">阶段工作</div>
        <div class="stage-section__bd">
          <el-checkbox-group
            v-model="taskCheckVal"
            :disabled="!editAuth || isSeas"
            class="task">
            <el-checkbox
              v-for="(item,index) in statusInfo.taskData"
              :key="index"
              :label="index"
              class="task-item">
              <span v-if="item.isNull && editAuth" class="isNull">*</span>
              <span class="task-item-name">
                {{ item.taskName }}
                <span
                  v-if="item.isOk"
                  class="time">
                  {{ item.createUserName }}于{{ fifterTime(item.createTime) }}完成
                </span>
              </span>
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

      <!-- 表单信息 -->
      <div
        v-if="fieldList.length>0"
        class="stage-section">
        <div class="stage-section__hd">表单信息</div>
        <div class="stage-section__bd">
          <el-form
            ref="fieldForm"
            :model="fieldForm"
            :rules="fieldRules"
            :validate-on-rule-change="false"
            label-position="top">
            <el-form-item
              v-for="(item, index) in fieldList"
              :key="index"
              :item="item"
              :index="index"
              :field-from="fieldForm"
              :disabled="item.disabled"
              style-percent="50"
              :class="[{'is-block': isBlockShowField(item)}, `is-${item.formType}`]">
              <span v-if="item.formType != 'field_group'" slot="label">
                {{ item.name }}
              </span>
              <template v-if="editAuth">
                <wk-field
                  :item="item"
                  :index="index"
                  :disabled="isSeas"
                  :field-from="fieldForm"
                  @change="formChange"
                />
              </template>
              <flexbox
                v-else
                align="stretch"
                style="width: 100%;"
                class="form-item__value">
                <wk-field-view
                  :props="item"
                  :form-type="item.formType"
                  :value="item.value">
                  <template slot-scope="{ data }">
                    <span>{{ getCommonShowValue(data) }}</span>
                  </template>
                </wk-field-view>
              </flexbox>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 审批流 -->
      <div
        v-if="showApply"
        class="stage-section">
        <div class="stage-section__hd">审核信息<el-tooltip
          v-if="flowRemarks"
          :content="flowRemarks"
          effect="dark"
          placement="top">
          <i class="wk wk-help wk-help-tips" />
        </el-tooltip></div>
        <div class="stage-section__bd">
          <wk-approval-flow-apply
            :data="wkFlowList"
            class="flow"
          />
        </div>
      </div>

      <!-- 审核操作 -->
      <div
        v-if="showExamine"
        class="stage-section">
        <div class="stage-section__bd">
          <examine-info
            :id="id"
            :record-id="statusInfo.examineRecordId"
            :owner-user-id="detail.ownerUserId"
            placement="top"
            class="examine-info"
            @on-handle="examineHandle" />
        </div>
      </div>

      <div v-if="!isSeas" class="footer">
        <el-button
          @click="replayClick">反馈（{{ replyTotal }}）</el-button>
        <el-button
          v-if="draftAuth"
          @click="handleConfirm(true)">保存草稿</el-button>
        <el-button
          v-if="editAuth"
          type="primary"
          @click="handleConfirm(false)">提交</el-button>
      </div>
      <div
        v-if="showReply"
        class="reply-wrapper">
        <reply-comment
          v-if="editAuth"
          ref="f_reply"
          v-loading="commentLoading"
          @toggle="closeOtherReply"
          @reply="handleReply" />
        <comment-list
          v-if="replyList.length > 0"
          ref="comment_list"
          :props="commentListProps"
          :list="replyList"
          :show-control="editAuth"
          @delete="deleteComment"
          @close-other-reply="$refs.f_reply.toggleFocus(true)" />
      </div>
    </div>
  </div>
</template>
<script>
import {
  crmFlowQueryFlowSettingListAPI,
  crmFlowQueryFlowDataInfoAPI,
  crmFlowQueryCommentListAPI,
  crmFlowSetCommentAPI,
  crmFlowDeleteCommentAPI,
  crmFlowSaveFlowDataAPI,
  crmFlowUpdateFlowDataStatusAPI
} from '@/api/crm/common'

import Stage from '../Stage' // 阶段状态
import ReplyComment from '@/components/ReplyComment'
import CommentList from '@/components/CommentList'
import WkFormItem from '@/components/NewCom/WkForm/WkFormItem'

import CustomFieldsMixin from '@/mixins/CustomFields'
import crmTypeModel from '@/views/crm/model/crmTypeModel'
import { timeToFormatTime } from '@/utils'
import Mixin from './Mixin'
import { objDeepCopy } from '../../../../utils'

export default {
  name: 'RelativeStageRecords',
  components: {
    Stage,
    ReplyComment,
    CommentList,
    WkFormItem
  },
  mixins: [CustomFieldsMixin, Mixin],
  props: {
    // 模块ID
    id: [String, Number],
    // 是公海 默认是客户
    isSeas: {
      type: Boolean,
      default: false
    },
    // 没有值就是全部类型 有值就是单个类型
    crmType: {
      type: String,
      default: ''
    },
    // 详情信息
    detail: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      loading: false,
      isUnfold: true, // 展开

      taskCheckVal: [], // 选中 阶段工作
      status: { // 全部阶段
        settingList: [] // 列表
      },

      stageFinalStatus: '', // 到完成阶段后不允许操作  1 成功 2 失败 3 无效 4 冻结 0 进行中
      selStatusId: '', // 选择的阶段id
      statusInfo: {}, // 阶段详情

      /** 表单字段 */
      fieldList: [],
      fieldForm: {},
      fieldRules: {},

      // 审批信息
      flowRemarks: '',
      wkFlowList: null, // 有值有审批流

      showReply: false, // 展示反馈
      replyList: [], // 反馈列表
      commentLoading: false // 评论加载
    }
  },
  computed: {
    // 是否展示阶段
    statusShow() {
      return this.status.settingList.length > 0
    },
    // 编辑权限
    editAuth() { // 选择的阶段Id等于当前阶段、有审批当前阶段审核状态为未通过、无审批当前状态为未完成
      return this.selStatusId == this.status.dataId &&
      (this.statusInfo.examineStatus == 0 ||
      this.statusInfo.examineStatus == 2 ||
      this.statusInfo.examineStatus == 4) &&
       (this.statusInfo.status == 0 || this.statusInfo.status == 2) &&
       this.stageFinalStatus == 0 // status 0 初始化  2 草稿 stageFinalStatus 0 进行中
    },
    // 展示保存草稿按钮
    draftAuth() {
      return this.editAuth && ((this.statusInfo.fieldData &&
      this.statusInfo.fieldData.length > 0) ||
       (this.statusInfo.taskData &&
       this.statusInfo.taskData.length > 0))
    },
    // 是否展示当前阶段信息
    showStage() {
      return (this.statusInfo.fieldData &&
      this.statusInfo.fieldData.length > 0) ||
       (this.statusInfo.taskData &&
       this.statusInfo.taskData.length > 0) ||
        (this.statusInfo.examineId && this.statusInfo.examineId != '0')
    },
    // 展示审批流
    showApply() {
      return (this.statusInfo.examineStatus === 0 ||
      this.statusInfo.examineStatus == 2 ||
      this.statusInfo.examineStatus == 4) &&
      this.wkFlowList
    },
    // 展示审批
    showExamine() {
      return (this.statusInfo.examineStatus === 1 ||
      this.statusInfo.examineStatus === 2 ||
      this.statusInfo.examineStatus === 3) &&
      //  this.statusInfo.examineStatus === 4)
      this.statusInfo.examineRecordId
    },
    // 展示推进按钮
    showAdvance() {
      return !this.isSeas && this.selStatusId !== this.status.dataId &&
      (this.status.finalStatus == 0 || this.status.finalStatus == 4) // 进行中 0  4 冻结
    },
    // 正在进行阶段名称
    stageName() {
      if (this.status.finalStatus && this.status.finalStatus != 0) {
        if (this.crmType == 'business') {
          return {
            1: '赢单',
            2: '输单',
            3: '无效',
            4: '冻结'
          }[this.status.finalStatus]
        } else {
          return {
            1: this.status.successName,
            2: this.status.failedName
          }[this.status.finalStatus]
        }
      } else if (this.status.settingList.length > 0 && this.status.dataId) {
        return this.status.settingList.find(item => { return item.id == this.status.dataId }).flowName
      } else {
        return ''
      }
    },
    // 展示展示  当前阶段有数据的时候 展示
    showUnfold() {
      return (this.statusInfo.taskData && this.statusInfo.taskData.length > 0) ||
       (this.fieldList.length > 0) ||
      this.showApply ||
      this.showExamine ||
      this.showReply
    },
    // 评论数量
    replyTotal() {
      let num = 0
      this.replyList.forEach(item => {
        num++
        num += item.childCommentList.length || 0
      })
      return num || this.statusInfo.commentNum
    },

    // 帮助信息
    helpObj() {
      return {
        leads: {
          type: '7',
          id: '105'
        }, contacts: {
          type: '9',
          id: '106'
        }, business: {
          type: '10',
          id: '107'
        }, contract: {
          type: '11',
          id: '108'
        }, receivables: {
          type: '12',
          id: '109'
        }, invoice: {
          type: '13',
          id: '110'
        }, visit: {
          type: '14',
          id: '111'
        }, product: {
          type: '15',
          id: '112'
        }
      }[this.crmType] || null
    },

    // 评论列表配置
    commentListProps() {
      return {
        addRequest: crmFlowSetCommentAPI, // 添加请求和参数
        addParams: { dataId: this.selStatusId },
        replyKey: 'replyId', // 日志 任务 pid  阶段 replyId
        replyValueKey: 'user.userId', // 获取值的keys 日志 任务 userId  阶段 user.userId
        deleteRequest: crmFlowDeleteCommentAPI, // 删除请求和参数
        deleteParams: null
      }
    }
  },
  watch: {
    id(val) {
      this.getStatusList()
    }
  },
  mounted() {
    this.getStatusList()
  },
  methods: {
    /**
     * 获取阶段状态
     */
    getStatusList() {
      this.loading = true
      crmFlowQueryFlowSettingListAPI({
        label: crmTypeModel[this.crmType],
        typeId: this.id
      })
        .then(res => {
          this.loading = false
          const data = res.data
          this.status = objDeepCopy(data)
          this.status.settingList = []
          this.selStatusId = data.dataId // 当前进行中的阶段
          this.stageFinalStatus = data.finalStatus // 终点状态 完结后禁止编辑
          this.handleStatus(data, data.finalStatus, data.dataId, data.settingList, data.statusRemark)
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 处理阶段状态数据
     * finalStatus 最终阶段值
     * dataId 当前阶段id
     * settingList 阶段数据
     */
    handleStatus(data, finalStatus, dataId, settingList, statusRemark) {
      if (settingList && settingList.length > 0) {
        const isdoing = finalStatus == 0
        let isdoingIndex = -1
        for (let index = 0; index < settingList.length; index++) {
          const item = settingList[index]
          if (isdoing) {
            if (item.id == dataId) {
              isdoingIndex = index
              if (item.status == 1) {
                item['class'] = 'state-suc'
              } else {
                item['class'] = 'state-doing'
              }
            } else {
              item['class'] = isdoingIndex >= 0 ? 'state-undo' : 'state-suc'
            }
          } else {
            if (item.id == dataId) {
              isdoingIndex = index
              item['class'] = 'state-suc'
            } else {
              item['class'] = isdoingIndex >= 0 ? 'state-invalid' : 'state-suc'
            }
          }
          this.status.settingList.push(item)
        }

        const overItem = { type: finalStatus }
        if (finalStatus == 0) {
          overItem.name = '结束'
          overItem['overIcon'] = ['el-icon-arrow-down', 'el-icon--right']
          if (isdoingIndex == settingList.length - 1 && this.status.settingList[isdoingIndex].status == 1) {
            overItem['class'] = 'state-doing'
          } else {
            if (this.status.settingList.length > 0 && dataId != 0) {
              // 有推进状态 才会有下一阶段
              this.status.settingList[isdoingIndex].class = 'state-doing'
            }
            overItem['class'] = 'state-undo'
          }
        } else if (finalStatus == 1) {
          overItem.name = data.successName || '赢单'
          overItem.title = data.successName || '赢单'// 详情标题 和 内容
          overItem.detail = `${data.successName || '赢单'}率100%`
          overItem.rate = 100
          overItem['overIcon'] = ['el-icon-check', 'el-icon--right']
          overItem['class'] = 'state-suc'
        } else if (finalStatus == 2) {
          overItem.name = data.failedName || '输单'
          overItem.title = `${data.successName || '赢单'}率0%`
          overItem.detail = statusRemark
          overItem.rate = 0
          overItem.remark = this.status.remark
          overItem['overIcon'] = ['el-icon-circle-close', 'el-icon--right']
          overItem['class'] = 'state-fail'
        } else if (finalStatus == 3) {
          overItem.name = '无效'
          overItem.title = '赢单率0%'
          overItem.detail = statusRemark
          overItem.rate = 0
          overItem.remark = this.status.remark
          overItem['overIcon'] = ['el-icon-remove-outline', 'el-icon--right']
          overItem['class'] = 'state-invalid'
        } else if (finalStatus == 4) {
          overItem.name = '冻结'
          overItem.title = '赢单率0%'
          overItem.detail = statusRemark
          overItem.rate = 0
          overItem.remark = this.status.remark
          overItem['overIcon'] = ['el-icon-remove-outline', 'el-icon--right']
          overItem['class'] = 'state-invalid'
        }
        this.status.settingList.push(overItem)
      }
      this.getStatusInfo(this.status.dataId)
    },

    /**
     * 获取阶段详情
     */
    getStatusInfo(dataId) {
      if (!dataId) return
      this.loading = true
      this.fieldList = []
      this.replyList = []
      this.taskCheckVal = []
      // this.statusInfo = {} // 请求后清理
      this.showReply = false
      this.wkFlowList = null
      crmFlowQueryFlowDataInfoAPI({ dataId })
        .then(res => {
          const resData = res.data
          this.statusInfo = resData // 保证处理字段数据的时候 this.editAuth 值正常

          resData.taskData.forEach((item, index) => {
            if (item.isOk == 1) {
              this.taskCheckVal.push(index)
            }
          })
          this.fieldEdit(resData)
          if (resData.examineId) { // 获取审批流
            this.initWkFlowData(
              {
                params: { examineId: resData.examineId }
              },
              (res) => {
                this.wkFlowList = res.list
                this.flowRemarks = res.resData ? res.resData.remarks : ''
              }
            )
          }
          this.statusInfo = resData
          this.loading = false
        })
        .catch(() => {
          this.statusInfo = {} // 出错置空
          this.loading = false
        })
    },
    /**
     * 编辑字段
    */
    fieldEdit(data) {
      const { fieldData, status } = data

      const fieldList = []
      const fieldRules = {}
      const fieldForm = {}

      fieldData.forEach(item => {
        const temp = this.getFormItemDefaultProperty(item)
        // 是否能编辑权限  叠加阶段的编辑权限
        if (this.editAuth) {
          fieldRules[temp.field] = this.getRules(item)
        }
        // 是否可编辑
        temp.disabled = !this.editAuth
        // 特殊字段允许多选
        this.getItemRadio(item, temp)
        // 获取默认值
        fieldForm[temp.field] = this.getItemValue(item, null, status == 0 ? 'save' : 'update') // 0 初始化是保存 1 2 草稿和完成 都展示编辑值读取value
        fieldList.push(temp)
      })
      this.fieldList = fieldList
      this.fieldForm = fieldForm
      this.fieldRules = fieldRules
      // 移除校验结果
      this.$nextTick(() => {
        if (this.fieldList.length !== 0 && this.$refs.fieldForm) {
          this.$refs.fieldForm.clearValidate()
        }
      })
    },
    /**
     * 状态推进
     */
    advanceClick() {
      if (this.statusInfo.status == 1) {
        this.$confirm('更改阶段将删除已完成阶段的阶段记录，确定更改?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.advanceRequest({ dataId: this.selStatusId, finalStatus: null })
          })
          .catch(() => {

          })
      } else {
        this.advanceRequest({ dataId: this.selStatusId, finalStatus: null })
      }
    },
    /**
     * 修改状态请求
     */
    advanceRequest(params) {
      this.loading = true
      crmFlowUpdateFlowDataStatusAPI(params)
        .then(res => {
          this.$message.success('操作成功')
          this.getStatusList()
          this.loading = false
          this.$emit('handle', { type: 'stage-change' })
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 阶段状态 改变操作
     */
    statusChange(item) {
      this.selStatusId = item.id
      this.getStatusInfo(item.id)
      // this.$emit('handle', { type: 'stage-change' })
    },
    /**
     * 完结状态
     */
    handleStatuResult(item) {
      if (this.crmType === 'business') {
        if (item.type == 2 || item.type == 3) {
          const message = '请填写' + item.name + '原因：'
          const title = item.name + '原因'
          this.$prompt(message, title, {
            inputType: 'text',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            closeOnClickModal: false
          })
            .then(({ value }) => {
              this.advanceRequest({
                dataId: this.status.dataId,
                finalStatus: item.type,
                remark: value
              })
            })
            .catch(() => {})
        } else {
          this.advanceRequest({
            dataId: this.status.dataId,
            finalStatus: item.type
          })
        }
      } else {
        this.advanceRequest({ dataId: this.status.dataId, finalStatus: item.type })
      }
    },
    /**
     * 审核操作
     */
    examineHandle(data) {
      this.$emit('handle', { type: 'stage-change' })
      this.getStatusList()
    },
    /**
     * 提交
     */
    async handleConfirm(isDraft = false) {
      this.loading = true
      const params = {}
      // 表单校验
      if (this.statusInfo.fieldData.length > 0) {
        // 草稿忽略表单规则
        if (isDraft) {
          params.fieldData = this.getSubmiteParams([].concat.apply([], this.fieldList), this.fieldForm, null, true, []).field
        } else {
          const pass = await this.validForm(this.$refs.fieldForm)
          if (!pass) {
            this.loading = false
            return
          }
          params.fieldData = this.getSubmiteParams([].concat.apply([], this.fieldList), this.fieldForm, null, true, []).field
        }
      }
      // 任务校验
      if (this.statusInfo.taskData.length > 0) {
        const taskData = objDeepCopy(this.statusInfo.taskData)
        const errList = []
        taskData.forEach((item, index) => {
          if (this.taskCheckVal.includes(index)) {
            item.isOk = 1
          } else {
            item.isOk = 0
            if (item.isNull) {
              errList.push(item.taskName)
            }
          }
        })
        if (!isDraft && errList.length > 0) {
          this.$message.error(`阶段工作${errList.join(',')}为必做`)
          this.loading = false
          return
        }
        params.taskData = taskData
      }
      // 审批流校验
      if (!isDraft) { // 保存草稿不校验
        const wkFlowResult = this.validateWkFlowData(this.wkFlowList)
        if (wkFlowResult.pass) {
          if (wkFlowResult.data) {
            params.examineFlowData = wkFlowResult.data
            params.examineFlowData.categoryId = params.examineFlowData.examineId
          }
        } else {
          this.loading = false
          this.$message.error('请完善审批信息')
          return
        }
      }

      this.submiteParams(params, isDraft)
    },

    /**
     * 提交数据
     */
    submiteParams(params, isDraft) {
      const request = crmFlowSaveFlowDataAPI
      params.id = this.statusInfo.id // 阶段id
      params.flowId = this.statusInfo.flowId // 阶段流程id
      params.status = isDraft ? 2 : 1 // 2保存草稿  1提交
      request(params).then((res) => {
        this.getStatusList()
      })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 验证表单
     */
    validForm(fieldForm) {
      return new Promise((resolve, _) => {
        fieldForm.validate(valid => {
          resolve(valid)
        })
      })
    },

    /**
     * 评论点击
     */
    replayClick() {
      this.showReply = !this.showReply
      if (this.replyList.length == 0) {
        this.getCommentList()
      }
    },
    /**
       * 获取回复列表
       */
    getCommentList() {
      crmFlowQueryCommentListAPI({
        id: this.statusInfo.id
      })
        .then(res => {
          const list = res.data || []
          this.replyList = list
        })
        .catch(() => {})
    },
    /**
       * 日志评论
       */
    handleReply(data) {
      this.commentLoading = true
      crmFlowSetCommentAPI({
        content: data,
        ...this.commentListProps.addParams
      }).then(res => {
        res.data.user = {
          userId: this.userInfo.userId,
          realname: this.userInfo.realname,
          img: this.userInfo.img
        }
        res.data.childCommentList = []
        this.replyList.push(res.data)
        this.$refs.f_reply.commentsTextarea = ''
        this.commentLoading = false
      }).catch(() => {
        this.commentLoading = false
      })
    },
    /**
       * 删除评论
       */
    deleteComment(index) {
      this.replyList.splice(index, 1)
    },
    /**
       *  关闭评论
       */
    closeOtherReply(flag) {
      if (!flag && this.$refs.comment_list) {
        this.$refs.comment_list.closeReply()
      }
    },
    /**
     * 格式化时间
     */
    fifterTime(time) {
      return timeToFormatTime(time, 'YYYY-MM-DD HH:mm:ss')
    }
  }
}
</script>
<style lang="scss" scoped>
.main {
  position: relative;
  overflow-y: auto;
  overflow-y: overlay;

  .header {
    .stage-state-main {
      flex: 1;
    }

    .stage-handel {
      flex-shrink: 0;
      margin-left: 16px;
    }
  }

  .body {
    margin-top: 16px;

    .task {
      .task-item {
        display: block;
        margin-bottom: 8px;

        /deep/ .el-checkbox__label {
          font-size: 14px !important;
          color: $--color-black !important;
        }

        .isNull {
          color: $--color-r300;
        }

        .time {
          color: $--color-text-secondary;
        }
      }
    }

    .wk-help-tips {
      margin-left: 8px;
    }

    /deep/ .content {
      padding: 0;
    }

    .b-cell {
      padding: 0 10px;
    }

    .footer {
      font-size: 0;
      text-align: right;
    }

    .reply-wrapper {
      padding: 20px 20px 10px;
      margin-top: 12px;
      background-color: #f9f9f9;
      border-top: $--border-base;
    }
  }
}

/** 表单信息 */
.form-item__value {
  min-height: 22px;
  line-height: 1.5;
  word-break: break-all;
  word-wrap: break-word;
  white-space: pre-wrap;

  .wk-field-view {
    flex: 1;
    width: 0;
  }
}

.el-form {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -12px;
}

.el-form-item {
  width: 50%;
  padding: 0 12px 12px;
  margin-bottom: 0;
}

.is-block {
  width: 50% !important;
}

// 块效果
.stage-section {
  &__hd {
    font-size: 16px;
  }

  &__bd {
    margin-top: 16px;
  }

  & + & {
    margin-top: 16px;
  }
}
</style>
