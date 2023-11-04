<template>
  <xr-create
    :loading="loading"
    :title="title"
    @close="hidenView"
    @save="saveClick">
    <!-- 基本信息 -->
    <create-sections title="基本信息">
      <el-form
        ref="crmForm"
        :model="fieldForm"
        :rules="fieldRules"
        :validate-on-rule-change="false"
        class="wk-form"
        label-position="top">
        <wk-form-items
          v-for="(children, index) in fieldList"
          :key="index"
          :field-from="fieldForm"
          :field-list="children"
          :ignore-fields="['money']"
          @change="formChange"
        >
          <template slot-scope="{ data }">
            <crm-relative-cell
              v-if="data && data.formType == 'customer'"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              relative-type="customer"
              @value-change="otherChange($event, data)"
            />
            <crm-relative-cell
              v-if="data && data.formType == 'contract'"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              :relation="data.relation"
              :relative-type="data.formType"
              @value-change="otherChange($event, data)"
            />
            <crm-relative-cell
              v-if="data && data.formType == 'intoContract'"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              relative-type="contract"
              @value-change="otherChange($event, data)"
            />
            <xh-expenses
              v-if="data && data.formType == 'examine_cause'"
              :value="fieldForm[data.field]"
              @value-change="otherChange($event, data)"
            />
            <xh-leaves
              v-if="data && data.formType == 'business_cause'"
              :value="fieldForm[data.field]"
              @value-change="otherChange($event, data)"
            />
            <div v-if="data.field == 'money'" style="position: relative;line-height: normal;">
              <el-input
                v-model="fieldForm[data.field]"
                :disabled="data.disabled"
                :maxlength="804"
                @input="formChange(data, index, $event )">
                <!-- <template slot="append" >
                  <el-button
                    type="text"
                    class="wk-premium-info-btn"
                    style="padding-right: 5px;">
                    <i class="wk wk-icon-lightning-solid wk-premium-info-icon" />
                    <span class="wk-premium-info-label" data-type="Bill">发票扫描</span>
                  </el-button>
                </template> -->
              </el-input>
            </div>
          </template>
        </wk-form-items>
      </el-form>
    </create-sections>

    <!-- 图片附件 -->
    <div class="img-accessory">
      <div class="img-box">
        <el-upload
          ref="imageUpload"
          :action="crmFileSaveUrl"
          :headers="httpHeader"
          :data="{type: 'img', batchId: batchId}"
          :on-preview="handleFilePreview"
          :before-remove="beforeRemove"
          :on-success="imgFileUploadSuccess"
          :file-list="imgFileList"
          name="file"
          multiple
          accept="image/*"
          list-type="picture-card">
          <el-button class="add-img" type="text">添加图片</el-button>
          <i class="el-icon-plus" />
        </el-upload>
      </div>
      <div class="add-accessory">
        <!-- <el-upload
          ref="fileUpload"
          :action="crmFileSaveUrl"
          :headers="httpHeader"
          :data="{type: 'file', batchId: batchId}"
          :on-preview="handleFilePreview"
          :before-remove="handleFileRemove"
          :on-success="fileUploadSuccess"
          :file-list="fileList"
          name="file"
          multiple
          accept="*.*">
          <el-button type="text" style="padding: 0;">添加附件</el-button>
        </el-upload> -->
        <file-cell
          :file-list="fileList"
          :show-time="false"
          show-delete
          @delete="fileDelete(arguments[0],arguments[1], data)" />
        <el-upload
          :http-request="httpRequest"
          class="upload-file"
          action="https://jsonplaceholder.typicode.com/posts/"
          multiple
          list-type="picture">
          <span class="add-btn">
            <i class="wk wk-l-plus" />
            <span class="label">附件</span>
          </span>
        </el-upload>
      </div>
    </div>
    <!-- 相关信息 -->
    <div style="padding-right: 12px;">
      <related-business
        :show-foot="true"
        :selected-infos="relatedBusinessInfo"
        @checkInfos="relativeValueChange" />
    </div>
    <!-- 审核信息 -->
    <create-sections
      v-if="wkFlowList"
      title="审核信息">
      <template slot="header">
        <el-tooltip
          v-if="flowRemarks"
          :content="flowRemarks"
          effect="dark"
          placement="top">
          <i class="wk wk-help wk-help-tips" style="margin-left: 8px;" />
        </el-tooltip>
      </template>
      <wk-approval-flow-apply
        :data="wkFlowList"
        style="padding: 15px;"
      />
    </create-sections>
  </xr-create>
</template>
<script type="text/javascript">
import { filedGetFieldAPI } from '@/api/crm/common'

import { crmContractUpdateStartMoneyAPI } from '@/api/crm/contract'
import { oaExamineGetFieldAPI, getContractTwoMoneyAPI } from '@/api/oa/examine'
import { crmFileDeleteAPI, crmFileSaveUrl } from '@/api/common'
import { oaExamineSaveAndUpdateAPI } from '@/api/oa/examine'

import XrCreate from '@/components/XrCreate'
import CreateSections from '@/components/CreateSections'
import XhExpenses from './XhExpenses' // 报销事项
import XhLeaves from './XhLeaves' // 出差事项
// import RelatedBusiness from './RelatedBusiness'
import RelatedBusiness from '@/components/RelatedBusiness'
import FileCell from '@/components/FileCell'

import WkApprovalFlowApply from '@/components/Examine/WkApprovalFlowApply'
import WkApprovalFlowApplyMixin from '@/components/Examine/mixins/WkApprovalFlowApply'
import WkFormItems from '@/components/NewCom/WkForm/WkFormItems'
import {
  CrmRelativeCell
} from '@/components/CreateCom'

import { isEmpty } from '@/utils/types'
import { mapGetters } from 'vuex'
import CustomFieldsMixin from '@/mixins/CustomFields'
import axios from 'axios'

import {
  guid,
  objDeepCopy,
  getImageData
} from '@/utils'

export default {
  name: 'ExamineCreateView', // 所有新建效果的view
  components: {
    XrCreate,
    CreateSections,
    XhExpenses,
    XhLeaves,
    RelatedBusiness,
    WkApprovalFlowApply,
    WkFormItems,
    FileCell,
    CrmRelativeCell
  },
  filters: {},
  mixins: [CustomFieldsMixin, WkApprovalFlowApplyMixin],
  props: {
    // 类型ID
    categoryId: {
      type: [String, Number],
      default: ''
    },
    examineType: {
      type: Boolean,
      default: () => {
        return false
      }
    },
    projectStartFieldList: {
      type: Array,
      default: () => []
    },
    type: [String, Number],
    // 类型名称
    categoryTitle: {
      type: String,
      default: ''
    },
    /**
     * save:添加、update:编辑(action_id)、read:详情、index:列表
     * relative: 相关 添加
     */
    action: {
      type: Object,
      default: () => {
        return {
          type: 'save',
          id: ''
        }
      }
    },
    isCustomerDetail: {
      type: Boolean,
      default: false
    },
    isContractDetail: {
      type: Boolean,
      default: false
    },
    detail: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      checkedMoney: undefined,
      FormfieldList: [],
      dataReleaseMoney: 0,
      startProjectMoney: 0,
      tempMoney:'',
      blurFlag:'',
      // 标题展示名称
      title: '',
      loading: false,
      // 自定义字段验证规则
      baseFields: [],
      fieldList: [],
      fieldForm: {},
      fieldRules: {},
      batchId: guid(),
      // 图片附件
      imgFileList: [],
      fileList: [],
      // 审批信息
      flowRemarks: '',
      wkFlowList: null, // 有值有审批流
      relatedBusinessInfo: {}, // 相关信息信息
      floatnumberValue: 0,

      customerData: {},
      contractData: {},

      isSpecialExamine: 0
    }
  },
  computed: {
    ...mapGetters(['userInfo']),
    crmFileSaveUrl() {
      return crmFileSaveUrl
    },
    httpHeader() {
      return {
        'Admin-Token': axios.defaults.headers['Admin-Token']
      }
    }
  },
  watch: {},
  mounted() {
    // 获取title展示名称
    document.body.appendChild(this.$el)
    this.title = this.getTitle()
    this.getField()

    if (this.action.type == 'update') {
      this.batchId = this.action.data.batchId
    }
  },
  destroyed() {
    // remove DOM node after destroy
    if (this.$el && this.$el.parentNode) {
      this.$el.parentNode.removeChild(this.$el)
    }
  },
  methods: {
    /**
     * 相关信息的值更新
     */
    relativeValueChange(data, value) {
      this.relatedBusinessInfo = value
    },

    /**
     * change
     */
    formChange(field, index, value, valueList) {
     
      // 审批流逻辑
      this.debouncedGetWkFlowList(field.field, this.fieldForm)
      // if (field.fieldName !== 'apply_type' && this.fieldForm.fieldApplyType == undefined){
      //   this.fieldForm.this_receivables_money = ''
      //   this.$message.error("请先选择申请类型")
        
      //   return
      // }
      if (field.fieldName == 'apply_type'){
      
        this.fieldForm.fieldApplyType = value
        
        this.fieldForm.this_receivables_money = ''
        
      }

      if (field.fieldName === 'money' && this.categoryTitle == '项目款转移审批') {
        // this.floatnumberValue = value
        this.$set(this.fieldForm, 'into_money', value)
      }

      // if (field.fieldName === 'this_receivables_money') {
      //   console.log(this.fieldForm)
      //   const applyMoneyTotal = this.fieldForm.this_receivables_money * 1 + this.fieldForm.receivables_money * 1
      //   this.$set(this.fieldForm, 'apply_money', applyMoneyTotal || '')
      // }

      if (field.fieldName === 'into_money' && this.categoryTitle == '项目款转移审批') {
        this.$set(this.fieldForm, 'money', value)
        // if (this.floatnumberValue && (value * 1 > this.floatnumberValue * 1)) {
        //   this.$set(this.fieldForm, 'into_money', 0)
        //   this.$message.warning('转入金额不能大与转出金额')
        // }
      }

      if ([
        'select',
        'checkbox'
      ].includes(field.formType) &&
          field.remark === 'options_type' &&
          field.optionsData) {
        const { fieldForm, fieldRules } = this.getFormContentByOptionsChange(this.fieldList, this.fieldForm)
        this.fieldForm = fieldForm
        this.fieldRules = fieldRules
      }
      // 申请金额 = 本次回款金额 + 回款金额
      // console.log(this.fieldForm)
      if (field.fieldName === 'this_receivables_money' && this.fieldForm.fieldApplyType == '启动建库测序') {
    
        if(this.fieldForm.this_receivables_money == this.blurFlag){
          return
        }

       
        //this.fieldForm.this_receivables_money = this.startProjectMoney*1 + this.fieldForm.this_receivables_money * 1
      
      
        
        this.blurFlag = this.fieldForm.this_receivables_money;
        
        alert(this.beforeStartProjectMoney)
         const applyMoneyTotal = this.fieldForm.this_receivables_money * 1 + (this.beforeStartProjectMoney*1 - this.beforeDataReleaseMoney*1)
         this.$set(this.fieldForm, 'apply_money', applyMoneyTotal || '')
       
      }

      
      if (field.fieldName === 'this_receivables_money' && this.fieldForm.fieldApplyType == '释放结果数据') {
        if(this.fieldForm.this_receivables_money == this.blurFlag){
            return
        }
        //this.fieldForm.this_receivables_money = this.fieldForm.this_receivables_money *1 + this.dataReleaseMoney

      
          this.blurFlag = this.fieldForm.this_receivables_money;
        // }
        
        //const applyMoneyTotal = this.fieldForm.this_receivables_money * 1 + this.fieldForm.receivables_money * 1
        const applyMoneyTotal = this.fieldForm.this_receivables_money * 1 + this.beforeDataReleaseMoney * 1
        this.$set(this.fieldForm, 'apply_money', applyMoneyTotal || '')

      }

       
      
     




      if (field.fieldName === 'apply_money') {
        this.$set(this.fieldForm, 'this_receivables_money', this.fieldForm.apply_money * 1 - (this.fieldForm.receivables_money || 0) * 1)
      }
      // 判断处理申请状态
      
    },

    /**
     * change
     */
    otherChange(data, field) {
      
      if (data.value.length > 0 && field.formType === 'contract') {
        console.log(data)
        // const applyMoney = data.value[0].receivedMoney * 1 + (this.fieldForm.this_receivables_money || 0) * 1
         const applyMoney = 0
        this.$set(this.fieldForm, 'apply_money', applyMoney || '')
        // 判断处理申请状态
        

        console.log(data.value[0].receivedMoney, applyMoney)
      
        // if (data.value.length > 0 && data.value[0].receivedMoney >= applyMoney) {
        //   this.$set(this.fieldForm, 'this_project_status', '已完成')
        // } else {
          this.$set(this.fieldForm, 'this_project_status', '未完成')
        // }
      }
      if (field.formType === 'customer') {
        this.itemsForEach(this.fieldList, fieldItem => {
          if (fieldItem.formType === 'contract') {
            // 如果是合同 改变合同样式和传入客户ID
            if (data.value.length > 0) {
              fieldItem.disabled = false
              const customerItem = objDeepCopy(data.value[0])
              customerItem['moduleType'] = 'customer'
              customerItem['params'] = { checkStatus: [1, 10] }
              fieldItem['relation'] = customerItem
            } else {
              fieldItem.disabled = true
              fieldItem['relation'] = {}
            }
            this.fieldForm[fieldItem.field] = []
          } else if (fieldItem.formType === 'receivables_plan') {
            fieldItem.disabled = true
            fieldItem['relation'] = {}
            this.fieldForm[fieldItem.field] = ''
          }
        })
      } else if (field.fieldName === 'contract_id') {
        
        const contractValue = data.value && data.value.length ? data.value[0] : null
        
        

        this.$set(this.fieldForm, 'contract_name', contractValue ? contractValue.name : '')
        this.$set(this.fieldForm, 'contract_money', contractValue ? contractValue.money : '')
        this.$set(this.fieldForm, 'receivables_money', contractValue ? contractValue.receivedMoney : '')
        this.$set(this.fieldForm, 'no_receivables_money', contractValue ? contractValue.unreceivedMoney : '')


        //HYL
        if(contractValue != null){
          this.beforeStartProjectMoney = contractValue.beforeStartProjectMoney
          this.beforeDataReleaseMoney = contractValue.beforeDataReleaseMoney

          //用于保存当前最新的提前启动金额或数据释放金额，点击保存的时候做校验，防止在新建期间其他人对同一个合同进行审批并早于提交并审核通过导致数据不一致
          //this.checkedMoney = this.startProjectMoney

          console.log(this.fieldList)
          this.fieldList.forEach(children => {
            children.forEach(item => {
              const temp = this.getFormItemDefaultProperty(item)
              console.log(temp)
              if (item.fieldName == 'this_receivables_money'){
                item.disabled = false

              }
            })
          })
        }else{
          //HYL
          this.fieldList.forEach(children => {
            children.forEach(item => {
              const temp = this.getFormItemDefaultProperty(item)
              console.log(temp)
              if (item.fieldName == 'this_receivables_money'){
                item.disabled = true
                this.fieldForm.this_receivables_money = ''
              }
            })
          })
        }
        

        
      } else if (field.formType === 'receivables_plan') {
        const dataValue = data.data || {}
        this.fieldForm.returnTime = dataValue.returnDate
        this.fieldForm.money = dataValue.money
        this.fieldForm.returnType = dataValue.returnType
      } else if (field.fieldName === 'into_contract_id') {
        if (data.value.length > 0) {
          this.$set(this.fieldForm, 'into_contract_name', data.value[0].name)
          this.$set(this.fieldForm, 'into_contract_money', data.value[0].money)
          this.$set(this.fieldForm, 'into_receivables_money', data.value[0].receivedMoney)
        }
      }
      // 出差事项
      if (data.value.update) {
        if (field.formType == 'business_cause') {
          this.$set(this.fieldForm, 'duration', data.value.duration)
        } else if (field.formType == 'examine_cause') {
          this.$set(this.fieldForm, 'money', data.value.money)
        }
      }
      this.$set(this.fieldForm, field.field, data.value)
      this.$refs.crmForm.validateField(field.field)
    },

    /**
     * 获取自定义字段
     */
    getField() {
      this.loading = true
      // 获取自定义字段的更新时间
      var params = {}
      params.label = 10
      params.id = this.categoryId

      // 进行编辑操作
      if (this.action.type == 'update') {
        params.examineId = this.action.id
        params.isDetail = 2 // 1详情 2 编辑
      }

      const request = {
        update: oaExamineGetFieldAPI,
        save: filedGetFieldAPI
      }[this.action.type]
      request(params)
        .then(res => {
          res.data.forEach(children => {
            children.forEach(item => {
              if (item.fieldName == 'into_contract_id') {
                item.formType = 'intoContract'
              }
            })
          })
          this.getcrmRulesAndModel(res.data)
          if (this.action.type == 'update') {
            this.getUpdateOtherInfo()
          }

          // 审核信息
          this.initWkFlowData({
            params: { label: 0, examineId: this.categoryId },
            fieldForm: this.fieldForm // 该对象没有需要适配
          }, res => {
            this.wkFlowList = res.list
            this.flowRemarks = res.resData ? res.resData.remarks : ''
          })
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 更新图片附件相关信息信息
     */
    getUpdateOtherInfo() {
      this.imgFileList = objDeepCopy(this.action.data.img || [])

      for (let index = 0; index < this.imgFileList.length; index++) {
        this.setImageList(this.imgFileList[index], index)
      }

      this.fileList = objDeepCopy(this.action.data.file || [])

      this.relatedBusinessInfo = {
        contacts: (this.action.data.contactsList || []).map(item => {
          if (item.id) {
            item.contactsId = item.id
          }
          return item
        }),
        customer: (this.action.data.customerList || []).map(item => {
          if (item.id) {
            item.customerId = item.id
          }
          return item
        }),
        business: (this.action.data.businessList || []).map(item => {
          if (item.id) {
            item.businessId = item.id
          }
          return item
        }),
        contract: (this.action.data.contractList || []).map(item => {
          if (item.id) {
            item.contractId = item.id
          }
          return item
        })
      } // 相关信息信息
    },

    /**
     * 获取图片内容
     */
    setImageList(item, index) {
      getImageData(item.url).then((data) => {
        item.url = data.src
        this.imgFileList.splice(index, 1, item)
      }).catch(() => {})
    },

    /**
     * 根据自定义字段获取自定义字段规则
     */
    getcrmRulesAndModel(list) {
      //HYL
      this.FormfieldList = list
      const baseFields = []
      const fieldList = []
      const fieldRules = {}
      const fieldForm = {}

      list.forEach(children => {
        const fields = []
        children.forEach(item => {
          if (item.fieldName == 'contract_id') {
            this.isSpecialExamine = 1
          }
          const temp = this.getFormItemDefaultProperty(item)
          temp.show = true

          const canEdit = this.getItemIsCanEdit(item, this.action.type)
          // 是否可编辑
          temp.disabled = !canEdit

          if (temp.fieldName == 'contract_name' ||
          temp.fieldName == 'apply_money' ||
          temp.fieldName == 'contract_money' ||
          temp.fieldName == 'this_receivables_money' ||
          temp.fieldName == 'receivables_money' ||
          temp.fieldName == 'no_receivables_money' ||
          temp.fieldName == 'apply_time' ||
          temp.fieldName == 'apply_user_id' ||
          temp.fieldName == 'into_contract_name' ||
          temp.fieldName == 'into_contract_money' ||
          temp.fieldName == 'into_receivables_money'||
          temp.fieldName == 'this_project_status'
          ) {
            temp.disabled = true
          }
          // alert("ces")
          // 禁止某些业务组件选择
          if (temp.formType == 'receivables_plan' ||
                temp.formType == 'contract' ||
                temp.formType == 'customer') {
            if (this.action.type == 'relative') {
              const relativeDisInfos = {
                contacts: { customer: true },
                customer: { customer: true },
                business: { customer: true },
                contract: { customer: true, contract: true },
                receivablesPlan: { customer: true, contract: true, receivables_plan: true }
              }

              // 在哪个类型下添加
              const relativeTypeDisInfos = relativeDisInfos[this.action.crmType]
              if (relativeTypeDisInfos) {
                // 包含的字段值
                temp.disabled = relativeTypeDisInfos[item.formType] || false
              }
            } else if (this.action.type != 'update') {
              if (this.isCustomerDetail || this.isContractDetail) {
                if (temp.fieldName === 'customer_id' || this.fieldName == 'contract_id') {
                  temp.disabled = true
                } else {
                  temp.disabled = item.formType === 'contract' || item.formType === 'receivables_plan'
                }
              } else {
                temp.disabled = item.formType === 'contract' || item.formType === 'receivables_plan'
              }
            }
          }

          // 处理关联
          // 回款计划 需要合同信息
          if (item.formType === 'receivables_plan') {
            const contractItem = this.getItemRelatveInfo(list, 'contract')
            if (contractItem) {
              contractItem['moduleType'] = 'contract'
              temp['relation'] = contractItem
            } else {
              temp['relation'] = {}
            }
            // 合同 需要客户信息
          } else if (item.formType == 'contract') {
            const customerObj = this.getItemRelatveInfo(list, 'customer')
            if (customerObj) {
              const customerItem = objDeepCopy(customerObj)
              customerItem['moduleType'] = 'customer'
              customerItem['params'] = { checkStatus: [1, 10] }
              temp['relation'] = customerItem
            } else {
              temp['relation'] = {}
            }
          }

          // 特殊字段验证规则
          if (item.isNull == 1) {
            if (item.formType == 'business_cause') {
              const causeValidateFun = (rule, value, callback) => {
                if (!value.list) {
                  callback(new Error('请完善明细'))
                } else {
                  var hasError = false
                  for (let index = 0; index < value.list.length; index++) {
                    const item = value.list[index]
                    const keys = [
                      'startAddress',
                      'endAddress',
                      'startTime',
                      'endTime',
                      'duration'
                    ]
                    for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
                      const key = keys[keyIndex]
                      if (key == 'duration') {
                        if (item.duration <= 0) {
                          hasError = true
                          callback(new Error(`行程明细（${index + 1}）时长应大于0`))
                          break
                        }
                      } else if (isEmpty(item[key])) {
                        hasError = true
                        callback(new Error('请完善明细'))
                        break
                      }
                    }
                  }
                  if (!hasError) {
                    callback()
                  }
                }
              }
              fieldRules[temp.field] = [{
                validator: causeValidateFun,
                trigger: []
              }, {
                required: true,
                message: '请完善明细',
                trigger: ['blur', 'change']
              }]
            } else if (item.formType == 'examine_cause') {
              const examineValidateFun = (rule, value, callback) => {
                if (!value.list) {
                  callback(new Error('请完善明细'))
                } else {
                  var hasError = false
                  for (let index = 0; index < value.list.length; index++) {
                    const item = value.list[index]
                    const keys = [
                      'startAddress',
                      'endAddress',
                      'startTime',
                      'endTime',
                      'traffic',
                      'stay',
                      'diet',
                      'other'
                    ]
                    for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
                      const key = keys[keyIndex]
                      if (isEmpty(item[key])) {
                        hasError = true
                        callback(new Error('请完善明细'))
                        break
                      }
                    }

                    if (item.money <= 0) {
                      hasError = true
                      callback(new Error(`费用明细（${index + 1}）合计应大于0`))
                      break
                    }
                  }
                  if (!hasError) {
                    callback()
                  }
                }
              }
              fieldRules[temp.field] = [{
                validator: examineValidateFun,
                trigger: []
              }, {
                required: true,
                message: '请完善明细',
                trigger: ['blur', 'change']
              }]
            } else if ((item.fieldName == 'duration' && this.type == 3) ||
          (item.fieldName == 'money' && this.type == 5)) {
              fieldRules[temp.field] = [{
                required: true,
                message: '请完善明细',
                trigger: ['blur', 'change']
              }]
            }
          }

          // disabled
          if (
          // 出差审批 差旅报销
            (item.fieldName == 'duration' && this.type == 3) ||
          (item.fieldName == 'money' && this.type == 5)
          ) {
            temp.disabled = true
          }

          // 特殊字段允许多选
          this.getItemRadio(item, temp)

          // 获取默认值
          if (item.formType == 'examine_cause' ||
          item.formType == 'business_cause') {
            if (this.action.type == 'update') {
              const itemValue = item.value || []
              const list = itemValue.map(element => {
                if (element.img) {
                  element.imgList = objDeepCopy(element.img || [])
                } else {
                  element.imgList = []
                }
                return element
              })
              fieldForm[temp.field] = { list: list } // 编辑的值 在value字段
            } else {
              fieldForm[temp.field] = {} // 加入默认值 可能编辑的时候需要调整
            }
          } else {
            if (temp.show) {
              if (item.fieldName == 'customer_id') {
                if (this.isCustomerDetail || this.isContractDetail) {
                  fieldForm[temp.field] = [{
                    customerId: this.detail.customerId,
                    customerName: this.detail.customerName
                  }]
                  this.customerData = item
                } else {
                  fieldForm[temp.field] = this.getItemValue(item, this.action.data, this.action.type)
                }
              } else if (item.fieldName == 'contract_id' || item.fieldName == 'into_contract_id') {
                if (this.isContractDetail) {
                  fieldForm[temp.field] = [{
                    contractId: this.detail.contractId,
                    num: this.detail.num
                  }]
                  this.contractData = item
                } else {
                  fieldForm[temp.field] = this.getItemValue(item, this.action.data, this.action.type)
                }
              } else if (item.fieldName == 'apply_time') {
                fieldForm[temp.field] = this.$moment().format('YYYY-MM-DD HH:mm:ss')
              } else if (item.fieldName == 'apply_user_id') {
                fieldForm[temp.field] = [this.userInfo]
              } else {
                fieldForm[temp.field] = this.getItemValue(item, this.action.data, this.action.type)
              }
            }
          }
          fields.push(temp)
          baseFields.push(item)
        })
        fieldList.push(fields)
      })
      this.baseFields = baseFields
      console.log(fieldList)
      this.fieldList = fieldList

      // fieldRules 额外的自定义规则
      this.fieldRules = fieldRules
      const result = this.getFormContentByOptionsChange(fieldList, fieldForm)
      this.fieldForm = result.fieldForm
      this.fieldRules = result.fieldRules
      if (this.examineType) {
        setTimeout(
          this.setInit(), 200)
      }
      if (this.isCustomerDetail) {
        this.otherChange({ index: null, value: [this.detail] }, this.customerData)
      }
      if (this.isContractDetail) {
        this.otherChange({ index: null, value: [this.detail] }, this.contractData)
      }
    },

    /**
     * 回显客户详情字段
     */
    setInit() {
      this.$set(this.fieldForm, 'into_contract_id', [])
      this.$set(this.fieldForm, 'into_contract_name', '')
      this.$set(this.fieldForm, 'contract_name', this.detail.name)
      this.$set(this.fieldForm, 'contract_money', this.detail.money)
      this.$set(this.fieldForm, 'receivables_money', this.detail.receivedMoney)
    },

    /**
     * 保存数据
     */
    saveClick() {
      this.loading = true
      const crmForm = this.$refs.crmForm
      crmForm.validate(valid => {
        if (valid) {
          const wkFlowResult = this.validateWkFlowData(this.wkFlowList)
          if (wkFlowResult.pass) {
            const params = {
              oaExamine: { categoryId: this.categoryId },
              oaExamineRelation: {},
              field: [],
              oaExamineTravelList: []
            }
            this.getSubmiteParams([].concat.apply([], this.fieldList), params)
            if (wkFlowResult.data) {
              params.examineFlowData = wkFlowResult.data
            }


            console.log(params.oaExamine.receivables_money, params.oaExamine.apply_money)

            if (params.oaExamine.receivables_money >= params.oaExamine.apply_money) {
              
              params.oaExamine.this_project_status = '已完成'
            } else {
              this.$set(this.fieldForm, 'this_project_status', '未完成')
            }
            if (this.isSpecialExamine == 1 && params.oaExamine.contract_id == '') {
              this.$message.error('请选择合同')
              this.loading = false
              return
            } else {
              this.submiteParams(params)
            }
          } else {
            this.loading = false
            this.$message.error('请完善审批信息')
          }
        } else {
          this.loading = false
          // 提示第一个error
          this.getFormErrorMessage(crmForm)
          return false
        }
      })
    },

    /**
     * 上传
     */
    submiteParams(params) {
      for (const key in this.relatedBusinessInfo) {
        const list = this.relatedBusinessInfo[key]
        params.oaExamineRelation[key + 'Ids'] = list
          .map(function(item, index, array) {
            return item[key + 'Id']
          })
          .join(',')
      }

      // if (this.intoContractId) {
      //   params.oaExamine['into_contract_id'] = this.intoContractId
      // }

      params.oaExamine['batchId'] = this.batchId

      if (this.action.type == 'update') {
        params.oaExamine.examineId = this.action.id
      }
      oaExamineSaveAndUpdateAPI(params)//todo
        .then(res => {
          // let param = {
          //   'lasttimeInputMoney': this.startMoney == undefined ? 0 : this.startMoney,
          //   'contractId': params.oaExamine.contract_id
          // }
          // console.log(param)
          // crmContractUpdateStartMoneyAPI(param).then(res => {
            this.loading = false
            this.hidenView()
            this.$message.success('操作成功')
            // 回到保存成功
            this.$emit('save-success')
          // })
          // .catch( () => {
          //   this.loading = false
          // })
          
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 拼接上传传输
     */
    getSubmiteParams(array, params) {
      for (let index = 0; index < array.length; index++) {
        const element = array[index]
        const dataValue = this.fieldForm[element.fieldName]
        if (element.fieldName == 'cause') {
          if (element.formType == 'business_cause') {
            params.oaExamineTravelList = dataValue.list
          } else if (element.formType == 'examine_cause') {
            for (let index = 0; index < dataValue.list.length; index++) {
              const cause = dataValue.list[index]
              var causeCopy = Object.assign({}, cause)
              delete causeCopy['imgList']
              params.oaExamineTravelList.push(causeCopy)
            }
          }
        } else {
          if (element.fieldType == 1) {
            params.oaExamine[element.fieldName] = this.getRealParams(element, dataValue)
          } else if (element.formType !== 'desc_text') { //  描述文字忽略
            params.field.push({
              fieldName: element.fieldName,
              fieldType: element.fieldType,
              name: element.name,
              type: element.type,
              fieldId: element.fieldId,
              value: this.getRealParams(element, dataValue)
            })
          }
        }
      }
      return params
    },

    /** 图片和附件 */

    /**
     * 上传图片
     */
    imgFileUploadSuccess(response, file, fileList) {
      this.imgFileList = fileList
    },

    /**
     * 查看图片
     */
    handleFilePreview(file) {
      if (file.response || file.fileId) {
        let perviewFile
        if (file.response) {
          perviewFile = file.response.data
        } else {
          perviewFile = file
        }
        this.$wkPreviewFile.preview({
          index: 0,
          data: [perviewFile]
        })
      }
    },
    beforeRemove(file, fileList) {
      if (file.response || file.fileId) {
        let fileId
        if (file.response) {
          fileId = file.response.data.fileId
        } else {
          fileId = file.fileId
        }
        this.$confirm('您确定要删除该文件吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            crmFileDeleteAPI({
              id: fileId
            })
              .then(res => {
                this.$message.success('操作成功')
                var removeIndex = this.getFileIndex(
                  this.$refs.imageUpload.uploadFiles,
                  fileId
                )
                if (removeIndex != -1) {
                  this.$refs.imageUpload.uploadFiles.splice(removeIndex, 1)
                }
                removeIndex = this.getFileIndex(this.imgFileList, fileId)
                if (removeIndex != -1) {
                  this.imgFileList.splice(removeIndex, 1)
                }
              })
              .catch(() => {})
          })
          .catch(() => {})
        return false
      } else {
        return true
      }
    },

    /**
     * 附件索引
     */
    getFileIndex(files, fileId) {
      var removeIndex = -1
      for (let index = 0; index < files.length; index++) {
        const item = files[index]
        let itemFileId
        if (item.response) {
          itemFileId = item.response.data.fileId
        } else {
          itemFileId = item.fileId
        }
        if (itemFileId == fileId) {
          removeIndex = index
          break
        }
      }
      return removeIndex
    },
    fileUploadSuccess(response, file, fileList) {
      this.fileList = fileList
    },
    handleFileRemove(file, fileList) {
      if (file.response || file.fileId) {
        let fileId
        if (file.response) {
          fileId = file.response.data.fileId
        } else {
          fileId = file.fileId
        }
        this.$confirm('您确定要删除该文件吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            crmFileDeleteAPI({
              id: fileId
            })
              .then(res => {
                this.$message.success('操作成功')
                var removeIndex = this.getFileIndex(
                  this.$refs.fileUpload.uploadFiles,
                  fileId
                )
                if (removeIndex != -1) {
                  this.$refs.fileUpload.uploadFiles.splice(removeIndex, 1)
                }
                removeIndex = this.getFileIndex(this.fileList, fileId)
                if (removeIndex != -1) {
                  this.fileList.splice(removeIndex, 1)
                }
              })
              .catch(() => {})
          })
          .catch(() => {})
        return false
      } else {
        return true
      }
    },
    /**
     * 附件
     */
    httpRequest(val) {
      this.$wkUploadFile.upload({
        file: val.file,
        params: {
          batchId: this.batchId
        }
      }).then(({ res }) => {
        const data = res.data || {}
        const list = this.fileList || []
        list.push(data)
        this.$set(this.fileList, 'files', list)
        this.$message.success('上传成功')
      }).catch(() => {})
    },
    /**
     * 附件删除
     */
    fileDelete(index, item, field) {
      this.fileList.splice(index, 1)
    },
    /**
     * 关闭
     */
    hidenView() {
      this.$emit('hiden-view')
    },

    /**
     * 根据类型获取标题展示名称
     */
    getTitle() {
      return this.action.type == 'update'
        ? '编辑' + this.categoryTitle
        : '新建' + this.categoryTitle
    }
  }
}
</script>
<style lang="scss" scoped>
.crm-create-container {
  position: relative;
  height: 100%;
}

.crm-create-header {
  flex-shrink: 0;
  height: 40px;
  padding: 0 10px;
  margin-bottom: 20px;

  .close {
    display: block;
    padding: 10px;
    margin-right: -10px;
    font-size: 24px;
    color: #909399;
    cursor: pointer;
  }

  .close:hover {
    color: $--color-primary;
  }
}

.crm-create-body {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
}

/** 将其改变为flex布局 */
.crm-create-box {
  display: flex;
  flex-wrap: wrap;
  padding: 0 10px 15px;
}

.crm-create-item {
  flex: 0 0 50%;
  flex-shrink: 0;

  // overflow: hidden;
  padding-bottom: 10px;
}

// 图片 附件
.img-accessory {
  padding: 0 12px 0 20px;
  margin-bottom: 5px;
  margin-bottom: 10px;
  font-size: 12px;

  img {
    width: 16px;
    vertical-align: middle;
  }

  .img-box /deep/ .el-upload {
    width: 80px;
    height: 80px;
    line-height: 90px;
  }

  .img-box /deep/ .el-upload-list {
    .el-upload-list__item {
      width: 80px;
      height: 80px;

      img {
        object-fit: contain;
        vertical-align: top;
      }
    }
  }

  .img-box {
    position: relative;
    margin-top: 40px;

    .add-img {
      position: absolute;
      top: -32px;
      left: 0;
      padding-left: 0;
    }
  }

  .add-accessory {
    margin-top: 25px;
    margin-bottom: 20px;
    color: #2362fb;

    .wukong-file {
      font-size: 13px;
    }
  }
}

.related-business {
  padding: 0 20px;
}

.wk-form {
  /deep/ .el-form-item {
    &.is-business_cause,
    &.is-examine_cause {
      flex: 0 0 100%;
      width: 0;
    }
  }
}

.upload-file /deep/ .el-upload-list--picture {
  display: none;
}

// 添加btn
.add-btn {
  display: inline-block;
  min-width: 92px;
  padding: 3px 10px;
  margin-top: 8px;
  font-size: 12px;
  color: $--color-text-primary;
  text-align: center;
  cursor: pointer;
  background-color: $--button-default-background-color;
  border-radius: $--border-radius-base;

  .wk-l-plus {
    font-size: 12px;
  }
}

.add-btn:hover {
  background-color: $--button-hover-background-color;
}

.sub-task-all {
  border: 1px solid $--color-n30;
  border-bottom: none;
  border-radius: 4px;
  box-shadow: $--box-shadow-bottom;
}
</style>
