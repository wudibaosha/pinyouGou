<template>
  <xr-create
    :loading="loading"
    :title="title"
    @close="close"
    @save="saveClick">
    <i slot="title-append" class="wk wk-icon-fill-help wk-help-tips" data-type="9" data-id="36" />
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
          @change="formChange">
          <template slot-scope="{ data }">
            <crm-relative-cell
              v-if="data && data.formType === 'customer'"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              relative-type="customer"
              @value-change="otherChange($event, data)" />
            <crm-relative-cell
              v-else-if="data && data.formType === 'contract'"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              :relation="data.relation"
              relative-type="contract"
              @value-change="otherChange($event, data)" />
          </template>
        </wk-form-items>
      </el-form>
    </create-sections>
  </xr-create>
</template>

<script>
import { filedGetFieldAPI } from '@/api/crm/common'
import { crmSettlementSaveAPI } from '@/api/crm/settlement'

import XrCreate from '@/components/XrCreate'
import CreateSections from '@/components/CreateSections'
import WkFormItems from '@/components/NewCom/WkForm/WkFormItems'
import {
  CrmRelativeCell
} from '@/components/CreateCom'
import WkApprovalFlowApplyMixin from '@/components/Examine/mixins/WkApprovalFlowApply'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import CustomFieldsMixin from '@/mixins/CustomFields'
import { isEmpty } from '@/utils/types'
import { objDeepCopy } from '@/utils'

export default {
  // 新建编辑
  name: 'ContactsCreate',

  components: {
    XrCreate,
    CreateSections,
    CrmRelativeCell,
    WkFormItems
  },

  mixins: [CustomFieldsMixin, WkApprovalFlowApplyMixin],

  props: {
    phone: String,
    action: {
      type: Object,
      default: () => {
        return {
          type: 'save',
          id: '',
          data: {}
        }
      }
    }
  },

  data() {
    return {
      loading: false,
      baseFields: [],
      fieldList: [],
      fieldForm: {},
      fieldRules: {}

    }
  },

  computed: {
    title() {
      return this.action.type === 'update' ? '编辑确认结算金额' : '新建确认结算金额'
    }
  },

  watch: {},

  created() {
    this.getField()
  },

  mounted() {},

  beforeDestroy() {},

  methods: {
    /**
     * 获取数据
     */
    getField() {
      this.loading = true
      const params = {
        label: crmTypeModel.settlement
      }

      if (this.action.type == 'update') {
        params.id = this.action.id
      }

      filedGetFieldAPI(params)
        .then(res => {
          const list = res.data || []
          if (!isEmpty(this.phone)) {
            list.forEach(item => {
              if (item.formType === 'mobile') {
                item.defaultValue = this.phone
              }
            })
          }

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
              // if (temp.fieldName == 'contractId' || temp.fieldName == 'contractName') {
              //   temp.disabled = true
              // }
              if (['customerId', 'contractName', 'contractTypes', 'contactsEmail', 'company', 'contactsTelephone'].includes(temp.fieldName)) {
                temp.disabled = true
              }
              // 禁止某些业务组件选择
              if (temp.formType === 'customer') {
                if (this.action.type === 'relative') {
                  const relativeDisInfos = {
                    customer: { customer: true },
                    business: { customer: true }
                  }

                  // 在哪个类型下添加
                  const relativeTypeDisInfos = relativeDisInfos[this.action.crmType]
                  if (relativeTypeDisInfos) {
                  // 包含的字段值
                    temp.disabled = relativeTypeDisInfos[item.formType] || false
                  }
                }
              }

              // if (['contactsEmail'].includes(temp.fieldName)) {
              //   return temp
              // }

              // 特殊字段允许多选
              this.getItemRadio(item, temp)
              // if (['company', 'contactsTelephone'].includes(temp.fieldName)) {
              //   temp.disabled = true
              // }

              // 获取默认值
              if (temp.show) {
                fieldForm[temp.field] = this.getItemValue(item, this.action.data, this.action.type)
              }
              fields.push(temp)
              baseFields.push(item)
            })
            fieldList.push(fields)
          })

          this.baseFields = baseFields
          this.fieldList = fieldList

          const result = this.getFormContentByOptionsChange(fieldList, fieldForm)
          this.fieldForm = result.fieldForm
          this.fieldRules = result.fieldRules
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 保存
     */
    saveClick() {
      this.loading = true
      const crmForm = this.$refs.crmForm
      crmForm.validate(valid => {
        if (valid) {
          const params = this.getSubmiteParams([].concat.apply([], this.fieldList), this.fieldForm)
          if (isEmpty(params.entity.contractId)) {
            this.$message.error('请选择相应合同')
            this.loading = false
            return
          } else {
            this.submiteParams(params)
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
        params.entity.settlementId = this.action.id
        params.entity.batchId = this.action.batchId
      }

      // 相关添加时候的多余提交信息
      if (
        this.action.relativeData &&
        Object.keys(this.action.relativeData).length
      ) {
        params = { ...params, ...this.action.relativeData }
      }
      crmSettlementSaveAPI(params)
        .then(res => {
          this.loading = false

          this.$message.success(
            this.action.type == 'update' ? '编辑成功' : '添加成功'
          )

          this.close()

          // 保存成功
          this.$emit('save-success', {
            type: 'contacts'
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

    otherChange(data, field) {
      // 修改客户
      if (field.formType === 'customer') {
        if (data.value.length > 0) {
          console.log('XX')
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
            } else {
              fieldItem.disabled = true
              fieldItem['relation'] = {}
            }
            this.fieldForm[fieldItem.field] = []
          }
        })
      } else if (field.formType === 'contract') {
        const contractValue = data.value && data.value.length ? data.value[0] : null
        console.log('contractValue:', contractValue)
        this.$set(this.fieldForm, 'contractName', contractValue ? contractValue.name : '')
        this.$set(this.fieldForm, 'company', contractValue ? contractValue.customerUnit : '')
        this.$set(this.fieldForm, 'contactsTelephone', contractValue ? contractValue.contactsTelephone : '')
        this.$set(this.fieldForm, 'contactsEmail', contractValue ? contractValue.contactsEmail : '')
        this.$set(this.fieldForm, 'contractTypes', contractValue ? contractValue.types : '')
        this.$set(this.fieldForm, 'customerId', [{
          customerId: contractValue.customerId,
          customerName: contractValue.customerName
        }])
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
</style>
