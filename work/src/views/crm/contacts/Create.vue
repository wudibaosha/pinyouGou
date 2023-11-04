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
              v-else-if="data && data.formType === 'contacts'"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              :relation="customerParams"
              relative-type="contacts"
              @value-change="otherChange($event, data)" />
          </template>
        </wk-form-items>
      </el-form>
    </create-sections>
  </xr-create>
</template>

<script>
import { filedGetFieldAPI } from '@/api/crm/common'
import { crmContactsSaveAPI } from '@/api/crm/contacts'

import XrCreate from '@/components/XrCreate'
import CreateSections from '@/components/CreateSections'
import WkFormItems from '@/components/NewCom/WkForm/WkFormItems'
import {
  CrmRelativeCell
} from '@/components/CreateCom'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import CustomFieldsMixin from '@/mixins/CustomFields'
import { isEmpty } from '@/utils/types'

export default {
  // 新建编辑
  name: 'ContactsCreate',

  components: {
    XrCreate,
    CreateSections,
    CrmRelativeCell,
    WkFormItems
  },

  mixins: [CustomFieldsMixin],

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
      fieldRules: {},
      customerParams: {
        params: {},
        moduleType: 'customer'
      }
    }
  },

  computed: {
    title() {
      return this.action.type === 'update' ? '编辑联系人' : '新建联系人'
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
        label: crmTypeModel.contacts
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

              // 特殊字段允许多选
              this.getItemRadio(item, temp)

              // 获取默认值
              if (temp.show) {
                fieldForm[temp.field] = this.getItemValue(item, this.action.data, this.action.type)
                if (this.action.type == 'relative' && ['email'].includes(temp.field)) {
                  if (temp.fieldName == 'email') {
                    if (this.action.data.customer) {
                      fieldForm[temp.field] = this.action.data.customer.email
                    }
                    if (this.action.data.business) {
                      fieldForm[temp.field] = this.action.data.business.contactsEmail
                    }
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

          const result = this.getFormContentByOptionsChange(fieldList, fieldForm)
          this.fieldForm = result.fieldForm

          // console.log(this.fieldForm)
          this.fieldRules = result.fieldRules

          // 没有选择客户时，联系人禁止选择直属上级
          const flag = isEmpty(this.fieldForm.customerId)
          if (!flag) {
            this.customerParams.params = {
              customerId: this.fieldForm.customerId[0].customerId
            }
          } else {
            this.customerParams.params = {}
          }
          this.fieldList.forEach(children => {
            children.forEach(child => {
              if (child.fieldName === 'parentContactsId') {
                this.$set(child, 'disabled', flag)
              }
            })
          })

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
          this.submiteParams(params)
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
        params.entity.contactsId = this.action.id
        params.entity.batchId = this.action.batchId
      }

      // 相关添加时候的多余提交信息
      if (
        this.action.relativeData &&
        Object.keys(this.action.relativeData).length
      ) {
        params = { ...params, ...this.action.relativeData }
      }
      crmContactsSaveAPI(params)
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
      if (field.fieldName === 'customerId') {
        let flag = false
        let customerId = null
        if (data.value.length) {
          this.$set(this.fieldForm, 'email', data.value[0].email)
          customerId = data.value[0].customerId
          this.customerParams.params = { customerId }
          flag = false
        } else {
          this.customerParams.params = {}
          flag = true
        }

        // 修改客户后清空联系人的直属上级
        if (
          this.fieldForm.hasOwnProperty('parentContactsId') &&
          customerId !== this.fieldForm.parentContactsId
        ) {
          this.$set(this.fieldForm, 'parentContactsId', [])
        }

        this.fieldList.forEach(children => {
          children.forEach(child => {
            if (child.fieldName === 'parentContactsId') {
              this.$set(child, 'disabled', flag)
            }
          })
        })
      }

      // 修改直属上级
      if (field.fieldName === 'parentContactsId') {
        if (data.value.length) {
          const contactsId = data.value[0].contactsId
          if (this.action.id && this.action.id == contactsId) {
            this.$message.error('不能选择本人作为上级')
            this.$set(this.fieldForm, field.field, [])
            return
          }
        }
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
