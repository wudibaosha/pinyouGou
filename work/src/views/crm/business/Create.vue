<template>
  <xr-create
    :loading="loading"
    :title="title"
    @close="close"
    @save="saveClick">
    <i slot="title-append" class="wk wk-icon-fill-help wk-help-tips" data-type="10" data-id="37" />
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
            <xh-business-status
              v-if="data && data.formType == 'business_type'"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              @value-change="otherChange($event, data)"
            />
            <xh-product
              v-if="data && data.formType == 'product'"
              :value="fieldForm[data.field]"
              @value-change="otherChange($event, data)"
            />
            <el-select
              v-if="data && data.formType == 'business_status'"
              v-model="fieldForm[data.field]"
              :disabled="data.disabled"
              style="width: 100%;">
              <el-option
                v-for="(item, index) in data.setting"
                :key="index"
                :label="item.name"
                :value="item.statusId" />
            </el-select>
          </template>
        </wk-form-items>
      </el-form>
    </create-sections>
  </xr-create>
</template>

<script>
import { filedGetFieldAPI } from '@/api/crm/common'
import { crmBusinessSaveAPI } from '@/api/crm/business'

import XrCreate from '@/components/XrCreate'
import CreateSections from '@/components/CreateSections'
import WkFormItems from '@/components/NewCom/WkForm/WkFormItems'
import {
  CrmRelativeCell
} from '@/components/CreateCom'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import CustomFieldsMixin from '@/mixins/CustomFields'
// import { isEmpty } from '@/utils/types'

export default {
  // 新建编辑
  name: 'BusinessCreate',

  components: {
    XrCreate,
    CreateSections,
    CrmRelativeCell,
    XhBusinessStatus: () => import('./components/XhBusinessStatus'),
    XhProduct: () => import('../product/components/XhProduct'),
    WkFormItems
  },

  mixins: [CustomFieldsMixin],

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
    }
  },

  data() {
    return {
      loading: false,
      baseFields: [],
      fieldList: [],
      fieldForm: {},
      fieldRules: {},
      editStatusValue: null // 记录 赢单输单无效状态
    }
  },

  computed: {
    title() {
      return this.action.type === 'update' ? '编辑商机' : '新建商机'
    }
  },

  watch: {},

  created() {
    this.getField()
  },

  mounted() { },

  beforeDestroy() {},

  methods: {
    /**
     * 获取数据
     */
    getField() {
      console.log(this.action.type)
      this.loading = true
      const params = {
        label: crmTypeModel.business
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

              // 禁止选择
              if (['customerUnit', 'customerPhone', 'twoCompany', 'region', 'contactsEmail'].includes(temp.fieldName)) {
                temp.disabled = true
              }
              // 商机状态组不必填
              if (['business_type'].includes(temp.formType)) {
                temp.isNull = 1
              }
              // 禁止某些业务组件选择
              if (temp.formType == 'customer') {
                if (this.action.type == 'relative') {
                  const relativeDisInfos = {
                    customer: { customer: true }
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

              if (item.formType === 'business_status') {
                temp.disabled = this.action.type === 'update'
              }

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
        params.entity.businessId = this.action.id
        params.entity.batchId = this.action.batchId
      }

      // 相关添加时候的多余提交信息
      if (
        this.action.relativeData &&
        Object.keys(this.action.relativeData).length
      ) {
        params = { ...params, ...this.action.relativeData }
      }

      crmBusinessSaveAPI(params)
        .then(res => {
          this.loading = false

          this.$message.success(
            this.action.type == 'update' ? '编辑成功' : '添加成功'
          )

          this.close()

          // 保存成功
          this.$emit('save-success', {
            type: 'business'
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

    /**
     * 回显客户详情字段
     */
    setInit() {
      if (this.action.type == 'relative') {
        this.$set(this.fieldForm, 'customerPhone', this.action.data.customer.mobile)
        this.$set(this.fieldForm, 'contactsEmail', this.action.data.customer.email)
        this.$set(this.fieldForm, 'customerUnit', this.action.data.customer.company)
        this.$set(this.fieldForm, 'twoCompany', this.action.data.customer.twoCompany)
        this.$set(this.fieldForm, 'region', this.action.data.customer.region)
      }
    },

    /**
     * 地址change
     */
    otherChange(data, field) {
      if (field.formType === 'customer') {
        if (data.value.length > 0) {
          this.$set(this.fieldForm, 'customerUnit', data.value[0].company)
          this.$set(this.fieldForm, 'customerPhone', data.value[0].mobile)
          this.$set(this.fieldForm, 'contactsEmail', data.value[0].email)
          this.$set(this.fieldForm, 'twoCompany', data.value[0].twoCompany)
          this.$set(this.fieldForm, 'region', data.value[0].region)
        }
      }
      // if (field.formType === 'business_type') {
      //   const statusItem = this.getItemWithFromType(this.fieldList, 'business_status')
      //   if (statusItem) {
      //     const statusOptions = data.data
      //     for (let index = 0; index < statusOptions.length; index++) {
      //       const item = statusOptions[index]
      //       if (item.typeId == data.value) {
      //         let statusList = item.statusList || []
      //         // 如果状态是赢单输单 更改 阶段值
      //         if (data.type == 'init' && (this.fieldForm[statusItem.field] == 1 ||
      //         this.fieldForm[statusItem.field] == 2 ||
      //         this.fieldForm[statusItem.field] == 3)) {
      //           this.editStatusValue = this.fieldForm[statusItem.field]
      //           statusList = [{
      //             statusId: 1,
      //             name: '赢单'
      //           }, {
      //             statusId: 2,
      //             name: '输单'
      //           }, {
      //             statusId: 3,
      //             name: '无效'
      //           }]
      //         }
      //         item.statusList = statusList
      //         statusItem.setting = statusList
      //         break
      //       }
      //     }
      //     // const typeObj = statusOptions.find(item => item.typeId == data.value)
      //     // statusItem.setting = typeObj.statusList || []

      //     if (data.type != 'init') {
      //       if (isEmpty(data.value)) {
      //         this.$set(this.fieldForm, statusItem.field, '')
      //       } else {
      //         let statusValue = statusItem.setting.length > 0 ? statusItem.setting[0].statusId : ''
      //         // 编辑初始化时 不重置
      //         if (statusValue && statusValue <= 3) {
      //           statusValue = this.editStatusValue
      //         }
      //         this.$set(this.fieldForm, statusItem.field, statusValue)
      //       }
      //     }
      //   }
      // } else
      if (field.formType === 'product') {
        this.fieldForm.money = data.value.totalPrice || ''
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
