<template>
  <xr-create
    :loading="loading"
    :title="title"
    @close="close"
    @save="saveClick">
    <i slot="title-append" class="wk wk-icon-fill-help wk-help-tips" data-type="7" data-id="34" />
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
          :ignore-fields="['leadsName']"
          @change="formChange"
        >
          <template slot-scope="{ data }">
            <div v-if="data.field == 'leadsName'">
              <business-info-input
                v-if="canUseEnterprise"
                v-model="fieldForm[data.field]"
                :maxlength="100"
                :disabled="data.disabled"
                :debounce="1000"
                :type="data.formType"
                value-key="name"
                @select="customerNameSelect"
                @input="formChange(data, index, $event)" />
              <el-input
                v-else
                v-model.trim="fieldForm[data.field]"
                :disabled="data.disabled"
                maxlength="100"
                :placeholder="data.placeholder"
                type="text"
                @input="formChange(data, index, $event)" />
              <el-button
                type="text"
                :disabled="!businessInfo || businessInfo.name !== fieldForm[data.field]"
                class="wk-premium-info-btn"
                data-type="BusinessInformation"
                @click="checkBIDetail">
                <i class="wk wk-icon-lightning-solid wk-premium-info-icon" data-type="BusinessInformation" />
                <span class="wk-premium-info-label" data-type="BusinessInformation">工商信息</span>
              </el-button>
            </div>
          </template>
        </wk-form-items>
      </el-form>
    </create-sections>

    <business-info-view
      v-if="businessInfoViewShow"
      :name="businessInfo.name"
      :form="fieldForm"
      :fields="baseFields"
      module="leads"
      @close="businessInfoViewShow = false"
    />
  </xr-create>
</template>

<script>
import { filedGetFieldAPI } from '@/api/crm/common'
import { crmLeadsSaveAPI } from '@/api/crm/leads'

import XrCreate from '@/components/XrCreate'
import CreateSections from '@/components/CreateSections'
import WkFormItems from '@/components/NewCom/WkForm/WkFormItems'
import BusinessInfoInput from '@/components/Premium/BusinessInfo/Input'
import BusinessInfoView from '@/components/Premium/BusinessInfo/View'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import CustomFieldsMixin from '@/mixins/CustomFields'
import { isEmpty } from '@/utils/types'
import { mapGetters } from 'vuex'

export default {
  // 新建编辑
  name: 'LeadsCreate',

  components: {
    XrCreate,
    CreateSections,
    WkFormItems,
    BusinessInfoInput,
    BusinessInfoView
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

      // 工商信息
      businessInfo: null,
      businessInfoViewShow: false
    }
  },

  computed: {
    ...mapGetters(['moduleData']),
    // 如果有次数就可以使用
    canUseEnterprise() {
      const enterprise = this.moduleData.find(item => item.module === 'enterprise')
      return enterprise ? enterprise.number > 0 : false
    },
    title() {
      return this.action.type === 'update' ? '编辑线索' : '新建线索'
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
        label: crmTypeModel.leads
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

              // 特殊字段允许多选
              this.getItemRadio(item, temp)

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
        params.entity.leadsId = this.action.id
        params.entity.batchId = this.action.batchId
      }

      // 相关添加时候的多余提交信息
      if (
        this.action.relativeData &&
        Object.keys(this.action.relativeData).length
      ) {
        params = { ...params, ...this.action.relativeData }
      }
      crmLeadsSaveAPI(params)
        .then(res => {
          this.loading = false
          this.$message.success(
            this.action.type == 'update' ? '编辑成功' : '添加成功'
          )

          this.close()

          // 保存成功
          this.$emit('save-success', {
            type: 'leads'
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
    },

    /**
     * @description: 客户联系人选择
     * @param {*} item 选择的对象
     * @return {*}
     */
    customerNameSelect(item) {
      this.businessInfo = item
    },

    /**
     * @description: 查看工商详情
     * @param {*}
     * @return {*}
     */
    checkBIDetail() {
      if (!this.canUseEnterprise) return
      this.businessInfoViewShow = true
    }
  }
}
</script>

<style lang="scss" scoped>
.wk-premium-info-btn {
  position: absolute;
  top: -30px;
  right: 0;
}

.el-autocomplete {
  width: 100%;
}
</style>
