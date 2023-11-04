<template>
  <xr-create
    :loading="loading"
    :title="title"
    @close="close"
    @save="saveClick">
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
          </template>
        </wk-form-items>
      </el-form>
    </create-sections>
  </xr-create>
</template>

<script>
import {
  crmCustomerSaveAddressAPI,
  crmCustomerUpdateAddressAPI
} from '@/api/crm/customer'

import XrCreate from '@/components/XrCreate'
import CreateSections from '@/components/CreateSections'
import WkFormItems from '@/components/NewCom/WkForm/WkFormItems'
import {
  CrmRelativeCell
} from '@/components/CreateCom'

import CustomFieldsMixin from '@/mixins/CustomFields'

export default {
  // 新建编辑
  name: 'RelativeAddressCreate',

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
      fieldList: [],
      fieldForm: {},
      fieldRules: {}
    }
  },

  computed: {
    title() {
      return this.action.type === 'update' ? '编辑地址' : '新建地址'
    }
  },

  watch: {
    action: {
      handler() {
        this.getField()
      },
      deep: true
    }
  },

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
      const detailData = this.action.type == 'update' ? this.action.rowData : null
      this.fieldList = [
        [{
          fieldName: 'addressType',
          field: 'addressType',
          name: '地址类型',
          formType: 'select',
          isNull: 1,
          fieldType: 1,
          inputTips: '',
          setting: [
            { label: '办公地址', value: 1 },
            { label: '仓储地址', value: 2 },
            { label: '注册地址', value: 3 },
            { label: '门店地址', value: 4 },
            { label: '家庭地址', value: 5 },
            { label: '其它', value: 6 }
          ],
          stylePercent: 50,
          value: detailData ? detailData.addressType : ''
        },
        {
          fieldName: 'postalCode',
          field: 'postalCode',
          name: '邮政编码',
          formType: 'text',
          isNull: 0,
          fieldType: 1,
          inputTips: '',
          setting: [],
          stylePercent: 50,
          value: detailData ? detailData.postalCode : ''
        }],
        [{
          fieldName: 'contactsName',
          field: 'contactsName',
          name: '联系人',
          formType: 'text',
          isNull: 0,
          fieldType: 1,
          inputTips: '',
          setting: [],
          stylePercent: 50,
          value: detailData ? detailData.contactsName : ''
        },
        {
          fieldName: 'telephone',
          field: 'telephone',
          name: '联系方式',
          formType: 'mobile',
          isNull: 0,
          fieldType: 1,
          inputTips: '',
          setting: [],
          stylePercent: 50,
          value: detailData ? detailData.telephone : ''
        }],
        [{
          fieldName: 'address',
          field: 'address',
          name: '地址',
          // formType: 'position',
          formType: 'text',
          isNull: 0,
          fieldType: 1,
          inputTips: '',
          setting: [],
          stylePercent: 100,
          value: detailData ? detailData.address : ''
        },
        {
          fieldName: 'remark',
          field: 'remark',
          name: '备注',
          formType: 'textarea',
          isNull: 0,
          fieldType: 1,
          inputTips: '',
          setting: [],
          stylePercent: 50,
          value: detailData ? detailData.remark : ''
        }]
      ]
      this.fieldList.forEach(item => {
        item.forEach(subItem => {
          this.$set(this.fieldForm, subItem.fieldName, subItem.value)
          this.$set(this.fieldRules, subItem.fieldName, this.getRules(subItem))
        })
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
          const params = this.fieldForm
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
      let request = crmCustomerSaveAddressAPI
      params.customerId = this.action.detail.customerId
      if (this.action.type == 'update') {
        params.addressId = this.action.rowData.addressId
        request = crmCustomerUpdateAddressAPI
      }

      // 相关添加时候的多余提交信息
      if (
        this.action.relativeData &&
        Object.keys(this.action.relativeData).length
      ) {
        params = { ...params, ...this.action.relativeData }
      }
      request(params)
        .then(res => {
          this.loading = false

          this.$message.success(
            this.action.type == 'update' ? '编辑成功' : '添加成功'
          )

          this.close()

          // 保存成功
          this.$emit('save-success', {
            type: 'address'
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
     * 地址change
     */
    otherChange(data, field) {
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
