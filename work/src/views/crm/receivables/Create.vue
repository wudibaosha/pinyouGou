<template>
  <xr-create
    :loading="loading"
    :title="title"
    :confirm-button-text="sureBtnTitle"
    @close="close"
    @save="saveClick">
    <i slot="title-append" class="wk wk-icon-fill-help wk-help-tips" data-type="12" data-id="39" />
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
              :is-relative="1"
              current-crm-type="receivables"
              @value-change="otherChange($event, data)"
            />
            <crm-relative-cell
              v-if="data && data.formType == 'invoice'"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              :relation="data.relation"
              :relative-type="data.formType"
              :is-relative="2"
              :is-or-contract="contractId"
              current-crm-type="receivables"
              @value-change="otherChange($event, data)"
            />
            <xh-receivables-plan
              v-if="data && data.formType == 'receivables_plan'"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              :receivables-id="editId"
              :relation="data.relation"
              :contract-id="contractId"
              @value-change="otherChange($event, data)"
            />
          </template>
        </wk-form-items>
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

    <el-button
      slot="footer"
      type="primary"
      plain
      @click.native="debouncedSaveField(true)">保存草稿</el-button>
  </xr-create>
</template>

<script>
import { filedGetFieldAPI } from '@/api/crm/common'
import { crmReceivablesSaveAPI } from '@/api/crm/receivables'

import XrCreate from '@/components/XrCreate'
import CreateSections from '@/components/CreateSections'
import WkFormItems from '@/components/NewCom/WkForm/WkFormItems'
import WkApprovalFlowApply from '@/components/Examine/WkApprovalFlowApply'
import WkApprovalFlowApplyMixin from '@/components/Examine/mixins/WkApprovalFlowApply'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import CustomFieldsMixin from '@/mixins/CustomFields'
import { debounce } from 'throttle-debounce'
import { objDeepCopy } from '@/utils'

export default {
  // 新建编辑
  name: 'ReceivablesCreate',

  components: {
    XrCreate,
    CreateSections,
    CrmRelativeCell: () => import('@/components/CreateCom/CrmRelativeCell'),
    XhReceivablesPlan: () => import('../receivablesPlan/components/XhReceivablesPlan'),
    WkApprovalFlowApply,
    WkFormItems
  },

  mixins: [CustomFieldsMixin, WkApprovalFlowApplyMixin],

  props: {
    action: {
      type: Object,
      default: () => {
        return {
          type: 'save',
          id: '',
          data: {}
        }
      }
    },
    // 合同id
    contractid: [String, Number]
  },

  data() {
    return {
      loading: false,
      baseFields: [],
      fieldList: [],
      fieldForm: {},
      fieldRules: {},

      // 审批信息
      flowRemarks: '',
      wkFlowList: null, // 有值有审批流,
      contractId: ''
    }
  },

  computed: {
    title() {
      return this.action.type === 'update' ? '编辑回款' : '新建回款'
    },

    editId() {
      return this.action.type == 'update' ? this.action.id : ''
    },

    // 确认名称
    sureBtnTitle() {
      if (this.wkFlowList) {
        return '提交审核'
      }
      return '保存'
    }
  },

  watch: {
    'fieldForm.invoiceId': {
      handler() {
        if (this.action.type !== 'update' && this.fieldForm.invoiceId && this.fieldForm.invoiceId.length > 0) {
          this.fieldForm.money = this.fieldForm.invoiceId[0].thisRelationMoney || this.fieldForm.invoiceId[0].invoiceMoney
        } else {
          //this.fieldForm.money = ''
        }
      }
    }
  },

  created() {
    // 合同下新建回款
    if (this.contractid) {
      this.contractId = this.contractid
    }
    this.debouncedSaveField = debounce(300, this.saveClick)

    this.getField()
  },

  mounted() {},

  beforeDestroy() {},

  methods: {
    /**
     * 获取数据
     */
    getField() {
      console.log(this.action)
      this.loading = true
      const params = {
        label: crmTypeModel.receivables
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

              const canEdit = this.getItemIsCanEdit(item, this.action.type)
              // 是否可编辑
              temp.disabled = !canEdit

              // if (temp.fieldName == 'contractName') {
              //   temp.disabled = true
              // }
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
                  // temp.disabled = item.formType === 'contract' || item.formType === 'receivables_plan'
                  temp.disabled = item.formType === 'customer' || item.formType === 'receivables_plan'
                }
              }
              // 禁止输入
              if (temp.formType == 'invoice' || ['contractName', 'invoiceTitle', 'contractMoney', 'fieldFhdimr','invoiceNumber','fieldMbyspo',
                'productType', 'region', 'fieldGpqydu', 'company', 'uninvoicedAmount', 'unreceivedMoney'].includes(temp.fieldName)) {
                temp.disabled = true
                // temp.value = []
              }
              if (temp.formType == 'invoice' && this.action.crmType == 'contract') {
                temp.disabled = false
              }
              // 回款编号可编辑
              if (temp.fieldName == 'number') {
                const target = temp.setting.find(item => item.type === 1)
                target.allowedInput = 1
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
                }// 发票 需要合同信息
              } else if (item.formType == 'invoice') {
                const invoiceObj = this.getItemRelatveInfo(list, 'invoice')
                if (invoiceObj) {
                  const invoiceItem = objDeepCopy(invoiceObj)
                  invoiceItem['moduleType'] = 'invoice'
                  invoiceItem['params'] = { checkStatus: [1, 10] }
                  temp['relation'] = invoiceItem
                } else {
                  temp['relation'] = {}
                }
              }
              
              // 特殊字段允许多选
              this.getItemRadio(item, temp)
             // console.log(temp.field,temp.show)
              // 获取默认值
              if (temp.show) {
                //console.log(temp.fieldName,temp.show,this.action.data.contract)
                fieldForm[temp.field] = this.getItemValue(item, this.action.data, this.action.type)
                if (this.action.type == 'relative' && ['receivablesPlanId', 'returnTime', 'money', 'returnType', 'remark', 'contractName', 'uninvoicedAmount', 'unreceivedMoney', 'customerName','fieldFhdimr','fieldMbyspo'].includes(temp.field)) {
                  if (temp.fieldName == 'contractName') {  //|| temp.fieldName == 'fieldFhdimr'||temp.fieldName == 'fieldMbyspo'
                    fieldForm[temp.field] = this.action.data.contract ? this.action.data.contract.name : ''
                    console.log(this.action.data.contract)
                  } else if(temp.fieldName == 'fieldFhdimr'){
                    fieldForm[temp.field] = this.action.data.contract ? this.action.data.contract.fieldFhdimr : ''
                  }else if(temp.fieldName == 'fieldMbyspo'){
                    
                    fieldForm[temp.field] = this.action.data.contract ? this.action.data.contract.fieldMbyspo : ''
                  }else if (temp.fieldName == 'receivablesPlanId') {
                    fieldForm[temp.field] = this.action.data && this.action.data.num ? this.action.data.num : ''
                  } else if (['uninvoicedAmount', 'unreceivedMoney'].includes(temp.field) && this.action.data.contract) {
                    fieldForm[temp.field] = this.action.data.contract[temp.field]
                  } else if (['customerName'].includes(temp.field) && this.action.data.customer) {
                    fieldForm[temp.field] = this.action.data.customer[temp.field]
                  } else {
                    
                    fieldForm[temp.field] = this.action.data[temp.field]
                  }
                }
              }
              fields.push(temp)
              baseFields.push(item)
            })
            fieldList.push(fields)
          })

          this.baseFields = baseFields
          this.fieldList = fieldList
          console.log(fieldForm)
          const result = this.getFormContentByOptionsChange(fieldList, fieldForm)
          
          this.fieldForm = result.fieldForm
          console.log(this.fieldForm)
          this.fieldRules = result.fieldRules

          // 审核信息
          this.initWkFlowData({
            params: { label: 2 },
            fieldForm: this.fieldForm
          }, res => {
            this.wkFlowList = res.list
            this.flowRemarks = res.resData ? res.resData.remarks : ''
          })
          if (this.action.type == 'relative') {
            setTimeout(
              this.setInit(), 2000)
          }

          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 回显客户详情字段
     */
    setInit() {
      if (this.action.type == 'relative') {
        console.log('setInit', this.action.data.customer)
        this.$set(this.fieldForm, 'contractMoney', this.action.data.customer.money)// 合同金额
        this.$set(this.fieldForm, 'priceRange', this.action.data.customer.priceRange)// 价格区间
        this.$set(this.fieldForm, 'productType', this.action.data.customer.productType)// 产品类型
        this.$set(this.fieldForm, 'region', this.action.data.customer.region)// 区域
        this.$set(this.fieldForm, 'company', this.action.data.customer.customerUnit)// 客户单位
      }
    },

    /**
     * 保存
     */
    saveClick(isDraft = false) {
      this.loading = true
      const crmForm = this.$refs.crmForm
      crmForm.validate(valid => {
        if (valid) {
          const wkFlowResult = this.validateWkFlowData(this.wkFlowList)
          if (wkFlowResult.pass || isDraft) {
            const params = this.getSubmiteParams([].concat.apply([], this.fieldList), this.fieldForm)
            if (isDraft) {
              params.entity.checkStatus = 5
            }
            if (wkFlowResult.data) {
              params.examineFlowData = wkFlowResult.data
            }
            if (params.entity.money && params.entity.unreceivedMoney && Number(params.entity.money) > Number(params.entity.unreceivedMoney)) {
              this.$message.error('回款金额需小于等于未回款金额')
              this.loading = false
              return
            }
            this.submiteParams(params)
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
     * 提交上传
     */
    submiteParams(params) {
      if (this.action.type == 'update') {
        params.entity.receivablesId = this.action.id
        params.entity.batchId = this.action.batchId
      }

      // 相关添加时候的多余提交信息
      if (
        this.action.relativeData &&
        Object.keys(this.action.relativeData).length
      ) {
        params = { ...params, ...this.action.relativeData }
      }
      console.log(params.entity)
      if (params.entity && params.entity.invoiceId) {
        params.entity.invoiceId = params.entity.invoiceId[0].invoiceId
      }
      crmReceivablesSaveAPI(params)
        .then(res => {
          this.loading = false

          this.$message.success(
            this.action.type == 'update' ? '编辑成功' : '添加成功'
          )

          this.close()

          // 保存成功
          this.$emit('save-success', {
            type: 'receivables'
          })
        })
        .catch(() => {
          this.loading = false
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

      if(field.fieldName == "fieldAjkwmy"){
        if(value == '是'){
          console.log(this.fieldList)
          this.fieldRules.invoiceId[0].required = true
        }else{
          this.fieldRules.invoiceId[0].required = false
        }
      }
      
    },

    /**
     * 地址change
     */
    otherChange(data, field) {
      if (field.formType === 'customer') {
        this.itemsForEach(this.fieldList, fieldItem => {
          if (fieldItem.formType === 'contract') {
            // 如果是合同 改变合同样式和传入客户ID
            console.log(data.value, 'data.vcalue')
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
      } else if (field.formType === 'contract') {
        console.log(this.fieldList)
        this.itemsForEach(this.fieldList, fieldItem => {
          
          if (fieldItem.formType === 'invoice') {
            
            if (data.value.length > 0) {
              fieldItem.disabled = false
              const contractItem = objDeepCopy(data.value[0])
              contractItem['moduleType'] = 'contract'
              contractItem['params'] = { checkStatus: [1, 10] }
              fieldItem['relation'] = contractItem
            } else {
              fieldItem.disabled = true
              fieldItem['relation'] = {}
              this.$set(this.fieldForm, 'invoiceNumber', '')
              this.$set(this.fieldForm, 'invoiceId', '')
            }
          }
          if (fieldItem.formType === 'receivables_plan') {
            
            const contractItem = objDeepCopy(data.value[0])
            fieldItem.disabled = false
            contractItem['moduleType'] = 'contract'
            contractItem['params'] = { checkStatus: [1, 10] }
            fieldItem['relation'] = contractItem
          }
        })
        if (data.value.length > 0) {
          
          const contractValue = data.value && data.value.length ? data.value[0] : null
          console.log(contractValue)
          this.$set(this.fieldForm, 'customerId', [{
            customerId: contractValue.customerId,
            customerName: contractValue.customerName
          }])// 客户联系人
          this.contractId = contractValue.contractId
          this.$set(this.fieldForm, 'contractName', contractValue ? contractValue.name : '')// 合同名称
          this.$set(this.fieldForm, 'contractMoney', contractValue.money)// 合同金额
          this.$set(this.fieldForm, 'unreceivedMoney', contractValue.unreceivedMoney)// 未回款金额
          this.$set(this.fieldForm, 'uninvoicedAmount', contractValue.uninvoicedAmount)// 未开发票
          this.$set(this.fieldForm, 'fieldFhdimr', contractValue.fieldFhdimr)// 价格区间
          this.$set(this.fieldForm, 'fieldMbyspo', contractValue.fieldMbyspo)// 产品类型
          this.$set(this.fieldForm, 'region', contractValue.region)// 区域
          this.$set(this.fieldForm, 'company', contractValue.customerUnit)// 客户单位
        } else {
          this.fieldForm = {}
        }
        // const planItem = this.getItemWithFromType(this.fieldList, 'receivables_plan')
        // if (planItem) {
        //   if (data.value.length > 0) {
        //     planItem.disabled = false
        //     var contractItem = data.value[0]
        //     contractItem['moduleType'] = 'contract'
        //     planItem['relation'] = contractItem
        //   } else {
        //     planItem.disabled = true
        //     planItem['relation'] = {}
        //   }
        //   this.fieldForm[planItem.field] = ''
        // }
      } else if (field.formType === 'receivables_plan') {
        const dataValue = data.data || {}
        this.fieldForm.returnTime = dataValue.returnDate
        this.fieldForm.money = dataValue.money
        this.fieldForm.returnType = dataValue.returnType
      } else if (field.formType === 'invoice') {
        if (data.value.length > 0) {
         
          const contractValue = data.value && data.value.length ? data.value[0] : null
          this.$set(this.fieldForm, 'invoiceTitle', contractValue.invoiceTitle)// 开票抬头
          this.$set(this.fieldForm, 'invoiceNumber', contractValue.invoiceNumber)
        }
        // const planItem = this.getItemWithFromType(this.fieldList, 'receivables_plan')
        // if (planItem) {
        //   if (data.value.length > 0) {
        //     planItem.disabled = false
        //     var invoiceItem = data.value[0]
        //     invoiceItem['moduleType'] = 'invoice'
        //     planItem['relation'] = invoiceItem
        //   } else {
        //     planItem.disabled = true
        //     planItem['relation'] = {}
        //   }
        //   this.fieldForm[planItem.field] = []
        // }
      }
      this.$set(this.fieldForm, field.field, data.value)
      this.$refs.crmForm.validateField(field.field)
    },

    /**
     * 关闭
     */
    close() {
      this.$emit('close')
    }
  }
}
</script>

<style lang="scss" scoped>
.wk-form {
  /deep/ .el-form-item.is-product {
    flex: 0 0 100%;
    width: 0;
  }
}
</style>
