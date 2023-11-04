<template>
  <xr-create
    v-loading="loading"
    :title="title"
    :confirm-button-text="confirmButtonText"
    @close="close"
    @save="saveClick">
    <i slot="title-append" class="wk wwk-icon-fill-help wk-help-tips" data-type="13" data-id="40" />
    <create-sections title="基本信息">
      <el-form
        ref="crmForm"
        :model="fieldForm"
        :rules="fieldRules"
        :validate-on-rule-change="false"
        class="wk-form"
        label-position="top">
        <wk-form-items
          v-for="(children, childIndex) in fieldList"
          :key="childIndex"
          :field-from="fieldForm"
          :field-list="children"
          :ignore-fields="ignoreFields"
          @change="formChange"
        >
          <template slot-scope="{ data, index }">
            <el-select
              v-if="data && data.field == 'invoiceType'"
              v-model="fieldForm[data.field]"
              :disabled="data.disabled"
              style="width: 100%;"
              @change="formChange(data, index, $event)">
              <el-option
                v-for="item in invoiceTypeOptions"
                :key="item.value"
                :label="item.name"
                :value="item.value" />
            </el-select>
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
              v-if="data && data.formType == 'receivables'"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              :relation="data.relation"
              :is-related-contract="true"
              :relative-type="data.formType"
              @value-change="otherChange($event, data)"
            />
            <related-contract
              v-if="data && data.formType == 'contractRelation'"
              ref="RelatedContract"
              :all-data="allData"
              :action="action"
              :is-relative="2"
              crm-type="invoice"
              @checkInfo="checkInfo"
            />
          </template>
        </wk-form-items>
      </el-form></create-sections>

    <create-sections title="发票信息">
      <div style="padding: 0 12px; text-align: right;">
        <el-button
          
          type="primary"
          @click="showSelectView=true">选择发票信息</el-button>
         <!-- <crm-relative
            v-if="showSelectView"
            ref="crmrelative"
            :visible.sync="showSelectView"
            :action="titleAction"
            crm-type="invoiceTitle"
            radio
            @changeCheckout="titleSelectChange" />  -->

          <crm-relative
            v-if="showSelectView"
            ref="crmrelative"
            :visible.sync="showSelectView"
            :radio="true"
            :selected-data="list"
            :is-related-contract="true"
            :current-crm-type="crmType"
            crmType="unit"
            :show-types="showTypes"
            :is-relative="isRelative"
            @changeCheckout="titleSelectChange" />
          

          
      </div>
      <el-form
        ref="otherFrom"
        :model="otherFrom"
        :rules="otherRules"
        class="wk-form is-two-columns"
        label-position="top">
        <wk-form-item
          v-for="(item, index) in otherFields"
          :key="item.key"
          :item="item"
          :index="index"
          :field-from="otherFrom"
          :disabled="item.disabled"
          :is-null="item.isNull"
          @change="otherFieldValueChange" />
      </el-form>
    </create-sections>

    <create-sections title="邮寄信息">
      <el-form
        ref="mailFrom"
        :model="mailFrom"
        :rules="mailRules"
        class="wk-form is-two-columns"
        label-position="top">
        <wk-form-item
          v-for="(item, index) in mailFields"
          :key="item.key"
          :item="item"
          :index="index"
          :field-from="mailFrom"
          :disabled="item.disabled" />
      </el-form>
    </create-sections>

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

<script>
import { filedGetFieldAPI } from '@/api/crm/common'
import { crmInvoiceSaveAPI } from '@/api/crm/invoice'
import { crmCustomerInvoiceInfoAPI } from '@/api/crm/customer'

import XrCreate from '@/components/XrCreate'
import CreateSections from '@/components/CreateSections'
import WkFormItems from '@/components/NewCom/WkForm/WkFormItems'
import WkFormItem from '@/components/NewCom/WkForm/WkFormItem'
import WkApprovalFlowApply from '@/components/Examine/WkApprovalFlowApply'
import WkApprovalFlowApplyMixin from '@/components/Examine/mixins/WkApprovalFlowApply'
import {
  CrmRelativeCell
} from '@/components/CreateCom'
import RelatedContract from '../contract/component/RelatedContract'
import unitIndex from '@/views/crm/unit'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import CustomFieldsMixin from '@/mixins/CustomFields'
import { objDeepCopy } from '@/utils'
import { isArray, isEmpty } from '@/utils/types'

export default {
  // 订单创建
  name: 'InvoiceCreate',
  components: {
    XrCreate,
    CreateSections,
    CrmRelativeCell,
    CrmRelative: () => import('@/components/CreateCom/CrmRelative'),
    WkApprovalFlowApply,
    WkFormItems,
    WkFormItem,
    RelatedContract,
    unitIndex
  },
  mixins: [CustomFieldsMixin, WkApprovalFlowApplyMixin],
  props: {
    action: {
      type: Object,
      default: () => {
        return {
          type: 'save', // save relative 新建 相关新建   update 编辑
          id: '',
          data: {}
        }
      }
    },
    isCrm: {
      type: String,
      default: ''
    },
    detail: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      showTypes: ['invoiceTitle'],
      loading: false,
      crmType: 'invoice',
      titleFieldList: [
        { fieldName: 'titleType', formType: 'text', name: '抬头类型' },
        { fieldName: 'invoiceTitle', formType: 'text', name: '开票抬头' },
        { fieldName: 'taxNumber', formType: 'text', name: '纳税人识别号' },
        { fieldName: 'depositBank', formType: 'text', name: '开户行' },
        { fieldName: 'depositAccount', formType: 'text', name: '开户账号' },
        { fieldName: 'depositAddress', formType: 'text', name: '开票地址' },
        { fieldName: 'telephone', formType: 'text', name: '电话' }
      ],
      invoiceTypeOptions: [{
        name: '增值税专用发票',
        value: 1
      }, {
        name: '增值税普通发票',
        value: 2
      }, {
        name: '增值税电子普通发票',
        value: 3
      }, {
        name: '增值税电子专用发票',
        value: 4
      }],
      ignoreFields: ['invoiceType'],
      baseFields: [],
      fieldList: [],
      fieldForm: {},
      fieldRules: {},
      showPopover: false,
      titleAction: {
        type: 'default'
      },
      showSelectView: false,
      // 发票信息
      otherFields: [],
      otherRules: {},
      otherFrom: {
        titleType: 1
      },

      // 邮寄信息
      mailFields: [],
      mailRules: {},
      mailFrom: {},
      // 审批信息
      flowRemarks: '',
      wkFlowList: null, // 有值有审批流

      allData: {},
      relatedContractData: []
    }
  },
  computed: {
    editId() {
      return this.action.type == 'update' ? this.action.id : ''
    },

    title() {
      return this.isEdit ? '编辑发票' : '新建发票'
    },

    isEdit() {
      return !!this.editId
    },

    confirmButtonText() {
      if (this.wkFlowList) {
        return '提交审核'
      }
      return '保存'
    }
  },
  watch: {
    // 开票类型选择普票，抬头和纳税人识别号必填，开票类型选择为专票，所有信息必填
    'fieldForm.invoiceType'(val) {
      if (val) {
        // 每次触发清空上次内容
        this.$nextTick(() => {
          // 清除表单验证change引起的报红
          this.$refs['otherFrom'].clearValidate()
        })
        this.fieldRules = null
        this.otherRules = null
        
        this.otherFields.forEach((item) => {
          item.isNull = null
          
        })
        // if (val == '增值税普通发票' || val == '增值税电子普通发票') {
        if (val == 2 || val == 3) {
          this.otherFields.forEach((item) => {
            if (['invoiceTitle', 'taxNumber'].includes(item.field)) {
              item.isNull = 1
            }
          })
        // } else if (val == '增值税专用发票' || val == '增值税电子专用发票') {
        } else if (val == 1 || val == 4) {
          this.otherFields.forEach((item) => {
            item.isNull = 1
          })
        }
        const result = this.getFormContentByOptionsChange(this.otherFields, this.fieldForm)
        this.otherRules = result.fieldRules
        // this.$nextTick(() => {
        this.fieldRules = { ...this.fieldRules2, ...result.fieldRules }
        // })
      }
    },
    'fieldForm.invoiceMoney'(val) {
      if (this.fieldForm.contractMoney && val > this.fieldForm.contractMoney) {
        this.$message.error('开票金额不能大于合同金额') 
      }
    }
  },
  created() {
    this.getField()
  },
  mounted() {},

  beforeDestroy() {},
  methods: {

    checkInfo(val) {
      if (this.crmType == 'invoice') {
        const total_price_array = (val.contract || []).map(item => {
          return item.price
        })
        const total_price = total_price_array.reduce(function(prev, cur, index, arr) {
          return prev + cur
        }, 0)
        this.$set(this.fieldForm, 'invoiceMoney', total_price)
      }
      this.relatedContractData = val
      const contractAllData = val.contract
      if (contractAllData && contractAllData.length != 0) {
        let contractAllMoney = 0
        contractAllData.forEach(item => {
          contractAllMoney += item.money
        })
       
        if (contractAllMoney) {
          this.$set(this.fieldForm, 'contractMoney', contractAllMoney)
        }
      }
    },
    /**
     * 获取数据
     */
    getField() {
      this.loading = true
      const params = {
        label: crmTypeModel.invoice
      }

      if (this.action.type == 'update') {
        params.id = this.action.id
      }

      filedGetFieldAPI(params)
        .then(res => {
          const list = res.data || []

          const baseFields = []
          const fieldList = []
          const fieldForm = {}

          list.forEach(children => {
            const fields = []
            children.forEach(item => {
              const temp = this.getFormItemDefaultProperty(item)
              temp.show = true

              if (this.ignoreFields.includes(temp.field)) {
                // 防止影响普通单选的验证方式
                delete temp.optionsData
                delete item.optionsData
              }

              const canEdit = this.getItemIsCanEdit(item, this.action.type)
              // 是否可编辑
              temp.disabled = !canEdit
              if (temp.fieldName == 'invoiceRelation') {
                if (temp.value.invoiceRelation != []) {
                  this.allData.contract = temp.value.invoiceRelation
                }
              }

              // 关联合同必填
              if (temp.fieldName == 'invoiceRelation') {
                temp.isNull = 1
              }

              // 禁止某些业务组件选择
              if (
                temp.formType == 'contract' ||
                temp.formType == 'customer' ||
                temp.formType == 'receivables') {
                if (this.action.type === 'save') {
                  temp.disabled = item.formType === 'contract'
                } else if (this.action.type == 'relative') {
                  if (temp.formType == 'customer') {
                    // 客户下填充客户，禁止修改
                    const customerObj = this.action.data.customer
                    temp.disabled = !!customerObj
                  } else if (temp.formType == 'receivables') {
                    // 回款下填充回款，禁止修改
                    const receivablesObj = this.action.data.receivables
                    console.log(!!receivablesObj, 'ceshidhside')
                    temp.disabled = !!receivablesObj
                  } else {
                    // 合同下填充合同，禁止修改客户和合同
                    const contractObj = this.action.data.contract
                    temp.disabled = !!contractObj
                  }
                }
              }

              // 合同金额字段展示用
              if (temp.field === 'contractMoney') {
                temp.disabled = true
              }
              if (temp.field === 'invoiceDate') {
                temp.formType = 'invoiceDate'
              }
              // 发票编号可编辑
              if (temp.fieldName == 'invoiceApplyNumber') {
                const target = temp.setting.find(item => item.type === 1)
                target.allowedInput = 1
              }
              // 处理关联
              if (this.action.type == 'update' ||
              this.action.type == 'relative') {
                if (item.formType == 'customer') { // 合同 需要客户信息
                  const customerObj = this.getItemRelatveInfo(list, 'customer')
                  if (customerObj) {
                    const customerItem = objDeepCopy(customerObj)
                    customerItem['moduleType'] = 'customer'
                    customerItem['params'] = { checkStatus: [1, 10] }
                    temp['relation'] = customerItem

                    this.$set(this.mailFrom, 'contactsName', customerItem.contactsName)
                    this.$set(this.mailFrom, 'contactsMobile', customerItem.contactsMobile)
                    this.$set(this.mailFrom, 'contactsAddress', customerItem.contactsAddress)

                    this.titleAction = {
                      type: 'invoiceTitle',
                      name: '关联发票抬头',
                      isCommon: false, // 是统一效果
                      fieldList: this.titleFieldList,
                      request: crmCustomerInvoiceInfoAPI,
                      showHeader: true,
                      rowKey: 'infoId',
                      radio: true,
                      tableFormatter: this.titleTableFormatter,
                      params: {
                        customerId: customerItem.customerId
                      }
                    }
                  }
                }
              }

              // 特殊字段允许多选
              this.getItemRadio(item, temp)

              // 获取默认值
              if (temp.show) {
                if (temp.formType == 'receivables' && this.isCrm == 'receivables') {
                  temp.disabled = true
                  temp.value = [
                    {
                      receivablesId: this.detail.receivablesId,
                      receivablesNum: this.detail.number
                    }
                  ]
                  fieldForm[temp.field] = temp.value
                } else {
                  if (this.ignoreFields.includes(temp.field)) {
                    fieldForm[temp.field] = this.isEdit ? temp.value : temp.defaultValue
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

          // 处理相关新建金额值的填充
          if (this.action.type == 'relative') {
            const contractItem = this.getItemRelatveInfo(list, 'contract')
            // 关联新建填充金额
            if (contractItem) {
              fieldForm.contractMoney = contractItem ? contractItem.money : ''
              fieldForm.invoiceMoney = contractItem ? contractItem.money : ''
            }
          }
          // 获取其他块字段
          this.getOtherField()

          this.baseFields = baseFields
          this.fieldList = fieldList

          const result = this.getFormContentByOptionsChange(fieldList, fieldForm)
          // 邮寄信息必填
          const result2 = this.getFormContentByOptionsChange(this.mailFields, fieldForm)
          this.mailRules = result2.fieldRules
          this.fieldForm = result.fieldForm
          // 监听开票类型用第一版验证数据
          this.fieldRules2 = { ...result.fieldRules, ...result2.fieldRules }
          this.fieldRules = { ...result.fieldRules, ...result2.fieldRules }
          // 审核信息
          this.initWkFlowData({
            params: { label: 3 },
            fieldForm: this.fieldForm
          }, res => {
            this.wkFlowList = res.list
            this.flowRemarks = res.resData ? res.resData.remarks : ''
          })

          // 获取其他块字段
          // this.getOtherField()
          // relative 下赋值联系人信息
          if (this.isEdit || this.action.type === 'relative') {
            const detail = this.action.detail

            const otherFrom = {}
            otherFrom.titleType = detail.titleType
            otherFrom.invoiceTitle = detail.invoiceTitle
            otherFrom.taxNumber = detail.taxNumber
            otherFrom.depositBank = detail.depositBank
            otherFrom.depositAccount = detail.depositAccount
            otherFrom.depositAddress = detail.depositAddress
            otherFrom.telephone = detail.telephone
            this.otherFrom = otherFrom

            const mailFrom = {}
            mailFrom.contactsName = detail.contactsName
            mailFrom.contactsMobile = detail.contactsMobile
            mailFrom.contactsAddress = detail.contactsAddress
            this.mailFrom = mailFrom
          }
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    getOtherField() {
      this.otherFields = [
        {
          name: '抬头类型',
          disabled: true,
          field: 'titleType',
          formType: 'select',
          setting: [{
            name: '单位',
            value: 1
          }, {
            name: '个人',
            value: 2
          }]
        }, {
          name: '开票抬头',
          disabled: true,
          field: 'invoiceTitle',
          formType: 'text',
          setting: []
        },
        {
          name: '纳税人识别号',
          field: 'taxNumber',
          disabled: true,
          formType: 'text',
          hidden: false,
          setting: []
        },
        {
          name: '开户行',
          field: 'depositBank',
          disabled: true,
          formType: 'text',
          hidden: false,
          setting: []
        }, {
          name: '开户账号',
          field: 'depositAccount',
          disabled: true,
          formType: 'text',
          hidden: false,
          setting: []
        }, {
          name: '开票地址',
          field: 'depositAddress',
          disabled: true,
          formType: 'text',
          hidden: false,
          setting: []
        }, {
          name: '电话',
          field: 'telephone',
          formType: 'text',
          disabled: true,
          setting: []
        }]

      this.mailFields = [{
        name: '联系人',
        field: 'contactsName',
        isNull: 1,
        formType: 'text',
        setting: []
      },
      {
        name: '联系方式',
        field: 'contactsMobile',
        isNull: 1,
        formType: 'text',
        setting: []
      },
      {
        name: '邮寄地址',
        field: 'contactsAddress',
        isNull: 1,
        formType: 'text',
        invoiceType: 'invoice',
        setting: []
      }]
    },

    titleSelectChange(data) {
      const dataValue = data.data
      if (dataValue && dataValue.length) {
        const titleData = dataValue[0]
        for (let index = 0; index < this.otherFields.length; index++) {
          const element = this.otherFields[index]
          this.$set(this.otherFrom, element.field, titleData[element.field])
        }

        const hidden = titleData.titleType == 2
        this.otherFields[2].hidden = hidden
        this.otherFields[3].hidden = hidden
        this.otherFields[4].hidden = hidden
        this.otherFields[5].hidden = hidden
      }
    },

    // fieldValueChange(data) {
    //   const item = this.baseFields[data.index]
    //   const dataValue = data.value
    //   this.$set(this.fieldForm, item.field, dataValue)

    //   if (item.formType == 'customer') {
    //     const contractItem = this.baseFields[data.index + 1]
    //     if (dataValue.length) {
    //       contractItem.disabled = false
    //       const customerItem = dataValue[0]
    //       customerItem['moduleType'] = 'customer'
    //       customerItem['params'] = { checkStatus: [1, 10] }
    //       contractItem['relation'] = customerItem

    //       this.$set(this.mailFrom, 'contactsName', customerItem.contactsName)
    //       this.$set(this.mailFrom, 'contactsMobile', customerItem.contactsMobile)
    //       this.$set(this.mailFrom, 'contactsAddress', customerItem.contactsAddress)

    //       this.titleAction = {
    //         type: 'default',
    //         request: crmCustomerInvoiceInfoAPI,
    //         showScene: false,
    //         showSearch: false,
    //         showCreate: false,
    //         canShowDetail: true,
    //         params: {
    //           customerId: customerItem.customerId
    //         }
    //       }
    //     } else {
    //       contractItem.disabled = true
    //       contractItem['relation'] = {}
    //       // 重置发票信息
    //       this.otherFields.forEach(item => {
    //         if (item.field !== 'titleType') {
    //           this.otherFrom[item.field] = ''
    //         }
    //       })
    //     }

    //     this.$set(this.fieldForm, 'contractId', [])
    //     this.$set(this.fieldForm, 'invoiceMoney', '')
    //     this.$set(this.fieldForm, 'contractMoney', '')
    //     this.$refs.crmForm.validateField(item.field)
    //     this.debouncedGetWkFlowList('invoiceMoney', this.fieldForm)
    //   } else if (item.formType == 'contract') {
    //     const contractValue = dataValue && dataValue.length ? dataValue[0] : null
    //     this.$set(this.fieldForm, 'contractMoney', contractValue ? contractValue.money : '')
    //     this.$set(this.fieldForm, 'invoiceMoney', contractValue ? contractValue.money : '')
    //     this.$refs.crmForm.validateField(item.field)
    //     this.debouncedGetWkFlowList('invoiceMoney', this.fieldForm)
    //   } else {
    //     // 审批流逻辑
    //     this.debouncedGetWkFlowList(item.field, this.fieldForm)
    //   }
    // },

    otherFieldValueChange(data) {
      if (data.field == 'titleType') {
        const hidden = this.otherFrom.titleType == 2
        this.otherFields[2].hidden = hidden
        this.otherFields[3].hidden = hidden
        this.otherFields[4].hidden = hidden
        this.otherFields[5].hidden = hidden
      }
    },

    close() {
      this.$emit('close')
    },

    saveClick() {
      this.loading = true
      const crmForm = this.$refs.crmForm
      const otherFrom = this.$refs.otherFrom
      const mailFrom = this.$refs.mailFrom
      const relatedContract = this.$refs.RelatedContract[0].$refs.relatedContract
      crmForm.validate(valid => {
        if (valid) {
          otherFrom.validate(valid => {
            if (valid) {
              mailFrom.validate(valid => {
                if (valid) {
                  relatedContract.validate(valid => {
                    if (valid) {
                      const wkFlowResult = this.validateWkFlowData(this.wkFlowList)
                      if (wkFlowResult.pass) {
                        const params = this.getSubmiteParams(this.baseFields, this.fieldForm)

                        if (wkFlowResult.data) {
                          params.examineFlowData = wkFlowResult.data
                        }

                        const entityParams = params.entity // 系统字段
                      
                        for (let index = 0; index < this.otherFields.length; index++) {
                          
                          const element = this.otherFields[index]
                          // console.log(!element.disabled)
                          
                          // if (!element.disabled) {
                          //   entityParams[element.field] = this.otherFrom[element.field]
                            
                          // }
                          //HYL 输入框禁止编辑后获取不到数据
                          if (element.disabled) {
                            entityParams[element.field] = this.otherFrom[element.field]
                            
                          }
                        }

                        for (let index = 0; index < this.mailFields.length; index++) {
                          const element = this.mailFields[index]
                          if (!element.disabled) {
                            entityParams[element.field] = this.mailFrom[element.field]
                          }
                        }

                        if (this.isEdit) {
                          entityParams.invoiceId = this.action.id
                          entityParams.batchId = this.action.batchId
                        }

                        if (!isEmpty(this.relatedContractData)) {
                          params.contractRelation = this.relatedContractData.contract
                          params.entity.invoiceRelation.invoiceRelation = params.contractRelation
                        }

                        if (!params.hasOwnProperty('contractRelation')) {
                          this.$message.error('请选择关联合同')
                          this.loading = false
                          return
                        }
                        if (params.entity.invoiceMoney > params.entity.contractMoney) {
                          this.$message.error('开票金额不能大于合同金额')
                          this.loading = false
                          return
                        }

                        if (Number(params.entity.invoiceMoney) > 106000) {
                          this.$message.error('开票金额不能大于106000')
                          this.loading = false
                          return
                        }

                        

                        if (isArray(params.entity.receivablesId)) {
                          params.entity.receivablesId = params.entity.receivablesId[0].receivablesId
                        }
                        let priceError = 'true'
                        if (params.contractRelation.length) {
                          params.contractRelation.some((item, index) => {
                            if (item.price == '' || !item.price) {
                              this.$message.error('项目实际开票金额不能为空')
                              priceError = false
                              this.loading = false
                              return true
                            }
                            // bug 编辑时选择新的管理按合同 price变成了0
                            if (Number(item.price) > Number(item.uninvoicedAmount)) {
                              this.$message.error('关联其他合同第' + (index + 1) + '行项目实际开票金额需小于未开票金额')
                              priceError = index
                              this.loading = false
                              return true
                            }
                          })
                        }
                        if (priceError != 'true') {
                          return
                        }
                        if (params.entity.contactsAddress && params.entity.contactsAddress[0].name) {
                          params.entity.contactsAddress = params.entity.contactsAddress[0].name
                        }

                        // params.contractRelation.forEach((contract)=>{
                        //   if(contract.customerId != params.entity.customerId){
                        //     this.$message.error('联系人必须与合同中的客户联系人一致')
                        //     this.loading = false
                        //     return
                        //   }
                        // })
                        crmInvoiceSaveAPI(params)
                          .then(res => {
                            this.loading = false
                            this.close()
                            // 回到保存成功
                            this.$emit('save-success')
                          })
                          .catch(() => {
                            this.loading = false
                          })
                      } else {
                        this.loading = false
                        this.$message.error('请完善审批信息')
                      }
                    } else {
                      this.loading = false
                      // 提示第一个error
                      this.getFormErrorMessage(relatedContract)
                      return false
                    }
                  })
                } else {
                  this.loading = false
                  // 提示第一个error
                  this.getFormErrorMessage(mailFrom)
                  return false
                }
              })
            } else {
              this.loading = false
              // 提示第一个error
              this.getFormErrorMessage(otherFrom)
              return false
            }
          })
        } else {
          this.loading = false
          // 提示第一个error
          this.getFormErrorMessage(crmForm)
          return false
        }
      })
    },

    /**
     * 验证唯一
     */
    UniquePromise({ field, value }) {
      return this.getUniquePromise(field, value, this.action)
    },

    /**
     * change
     */
    formChange(field, index, value, valueList) {
      
      // 审批流逻辑
      this.debouncedGetWkFlowList(field.field, this.fieldForm)

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
    },

    /**
     * 地址change
     */
    otherChange(data, field) {
      
      if (field.formType === 'customer') {
        if (data.value.length > 0) {
          const customerMiddleItem = objDeepCopy(data.value[0])
          this.titleAction = {
            type: 'invoiceTitle',
            name: '关联发票抬头',
            isCommon: false, // 是统一效果
            fieldList: this.titleFieldList,
            request: crmCustomerInvoiceInfoAPI,
            showHeader: false,
            rowKey: 'infoId',
            radio: true,
            tableFormatter: this.titleTableFormatter,
            params: {
              customerId: customerMiddleItem.customerId
            }
          }
        }
        this.itemsForEach(this.fieldList, fieldItem => {
          if (fieldItem.formType === 'contract') {
            // 如果是合同 改变合同样式和传入客户ID
            if (data.value.length > 0) {
              fieldItem.disabled = false
              const customerItem = objDeepCopy(data.value[0])
              customerItem['moduleType'] = 'customer'
              customerItem['params'] = { checkStatus: [1, 10] }
              fieldItem['relation'] = customerItem

              this.$set(this.mailFrom, 'contactsName', customerItem.contactsName)
              this.$set(this.mailFrom, 'contactsMobile', customerItem.contactsMobile)
              this.$set(this.mailFrom, 'contactsAddress', customerItem.contactsAddress)

              // this.titleAction = {
              //   type: 'invoiceTitle',
              //   name: '关联发票抬头',
              //   isCommon: true, // 是统一效果
              //   fieldList: this.titleFieldList,
              //   request: crmCustomerInvoiceInfoAPI,
              //   showHeader: false,
              //   rowKey: 'infoId',
              //   radio: true,
              //   tableFormatter: this.titleTableFormatter,
              //   params: {
              //     customerId: customerItem.customerId
              //   }
              // }
            } else {
              fieldItem.disabled = true
              fieldItem['relation'] = {}
              // 重置发票信息
              this.otherFields.forEach(item => {
                if (item.field !== 'titleType') {
                  this.otherFrom[item.field] = ''
                }
              })
            }
            this.fieldForm[fieldItem.field] = []
          }
        })

        // this.$set(this.fieldForm, 'contractId', [])
        // this.$set(this.fieldForm, 'invoiceMoney', '')
        // this.$set(this.fieldForm, 'contractMoney', '')
        this.debouncedGetWkFlowList('invoiceMoney', this.fieldForm)
      } else if (field.formType === 'contract') {
        const contractValue = data.value && data.value.length ? data.value[0] : null
        this.$set(this.fieldForm, 'contractMoney', contractValue ? contractValue.money : '')
        this.$set(this.fieldForm, 'invoiceMoney', contractValue ? contractValue.money : '')
        
        this.debouncedGetWkFlowList('invoiceMoney', this.fieldForm)

      }
      this.$set(this.fieldForm, field.field, data.value)
      this.$refs.crmForm.validateField(field.field)
    },

    /**
     * 抬头表格
     */
    titleTableFormatter(row, column, cellValue) {
      if (column.property == 'titleType') {
        return {
          1: '单位',
          2: '个人'
        }[row[column.property]]
      }
      return row[column.property] === '' || row[column.property] === null ? '--' : row[column.property]
    }
  }
}
</script>

<style lang="scss" scoped>
.xh-product {
  padding: 0 15px;
}

// 审核信息 里的审核类型
.examine-type {
  height: 16px;
  padding: 0 8px;
  margin-left: 5px;
  font-size: 12px;
  line-height: 16px;
  color: white;
  background-color: #fd715a;
  border-radius: 8px;
  transform: scale(0.8, 0.8);
}
</style>
