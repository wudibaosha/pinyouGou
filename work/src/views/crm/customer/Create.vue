<template>
  <xr-create
    :loading="loading"
    :title="title"
    @close="close"
    @save="saveClick">
    <i slot="title-append" class="wk wk-icon-fill-help wk-help-tips" data-type="8" data-id="35" />
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
          :ignore-fields="['customerName']"
          @change="formChange"
        >
          <template slot-scope="{ data }">
           
            <crm-relative-cell
              v-if="data && data.formType == 'unit'"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              relative-type="unit"
              @value-change="otherChange($event, data)"
            />

            <crm-relative-cell
              v-else-if="data && data.formType == 'customer'"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              relative-type="customer"
              @value-change="otherChange($event, data)"
            />
            <crm-relative-cell
              v-else-if="data && data.formType === 'contract'"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              :relation="customerParams"
              relative-type="contract"
              @value-change="otherChange($event, data)" 
              />


            <xh-customer-address
              v-else-if="data && data.formType == 'map_address'"
              :value="fieldForm[data.field]"
              @value-change="otherChange($event, data)"
            />
            <div v-else-if="data.field == 'customerName'">
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
              <!-- <el-button
                type="text"
                :disabled="!businessInfo || businessInfo.name !== fieldForm[data.field]"
                class="wk-premium-info-btn"
                data-type="BusinessInformation"
                @click="checkBIDetail">
                <i class="wk wk-icon-lightning-solid wk-premium-info-icon" data-type="BusinessInformation" />
                <span class="wk-premium-info-label" data-type="BusinessInformation">工商信息</span>
              </el-button> -->
            </div>
          </template>
        </wk-form-items>
      </el-form>
    </create-sections>

    <el-button
      v-if="action.type == 'save' && contactsSaveAuth"
      slot="footer"
      class="handle-button"
      @click="debouncedSaveField(true)">保存并新建联系人</el-button>

    <!-- 新建 -->
    <contacts-create
      v-if="contactsCreateShow"
      :action="contactsCreateAction"
      @close="close"
      @save-success="close"
    />

    <business-info-view
      v-if="businessInfoViewShow"
      :name="businessInfo.name"
      :form="fieldForm"
      :fields="baseFields"
      @close="businessInfoViewShow = false"
    />
  </xr-create>
</template>

<script>
import { filedGetFieldAPI } from '@/api/crm/common'
import { crmCustomerSaveAPI } from '@/api/crm/customer'

import XrCreate from '@/components/XrCreate'
import CreateSections from '@/components/CreateSections'
import WkFormItems from '@/components/NewCom/WkForm/WkFormItems'
import { CrmRelativeCell } from '@/components/CreateCom'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import CustomFieldsMixin from '@/mixins/CustomFields'
import ContactsCreate from '../contacts/Create'
import BusinessInfoInput from '@/components/Premium/BusinessInfo/Input'
import BusinessInfoView from '@/components/Premium/BusinessInfo/View'

import { debounce } from 'throttle-debounce'
import { isEmpty } from '@/utils/types'
import { mapGetters } from 'vuex'

export default {
  // 新建编辑
  name: 'CustomerCreate',

  components: {
    XrCreate,
    CreateSections,
    WkFormItems,
    XhCustomerAddress: () => import('@/components/CreateCom/XhCustomerAddress'),
    ContactsCreate,
    CrmRelativeCell,
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
      contactsCreateAction: {
        type: 'save',
        id: '',
        data: {}
      },
      contactsCreateShow: false,

      // 工商信息
      businessInfo: null,
      businessInfoViewShow: false
    }
  },

  computed: {
    ...mapGetters(['crm', 'moduleData']),
    // 如果有次数就可以使用
    canUseEnterprise() {
      const enterprise = this.moduleData.find(item => item.module === 'enterprise')
      return enterprise ? enterprise.number > 0 : false
    },
    contactsSaveAuth() {
      return this.crm.contacts && this.crm.contacts.save
    },
    title() {
      return this.action.type === 'update' ? '编辑客户' : '新建客户'
    }
  },

  watch: {},

  created() {
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
      this.loading = true
      const params = {
        label: crmTypeModel.customer
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
              if (temp.formType == 'map_address') {
                temp.isNull = 1
              }

              // 禁止某些业务组件选择
              console.log(temp.formType)
              if (temp.formType == 'customer') {
                if (this.action.type == 'relative') {
                  const relativeDisInfos = {
                    customer: { customer: true },
                    contacts: { customer: true }
                  }

                  // 在哪个类型下添加
                  const relativeTypeDisInfos = relativeDisInfos[this.action.crmType]
                  if (relativeTypeDisInfos) {
                  // 包含的字段值
                    temp.disabled = relativeTypeDisInfos[item.formType] || false
                  }
                }
              }


              if (temp.formType == 'unit') {
                if (this.action.type == 'relative') {
                  const relativeDisInfos = {
                    customer: { unit: true },
                    contacts: { unit: true }
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
          console.log(this.fieldForm)
          if (this.action.type == 'update') {
            this.fieldForm.company=[{'invoiceTitle':this.fieldForm.company}]
          }

          
          console.log(this.fieldForm)
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
    saveClick(createContacts = false) {
      this.loading = true
      const crmForm = this.$refs.crmForm
     
      
      crmForm.validate(valid => {
        if (valid) {
          const params = this.getSubmiteParams([].concat.apply([], this.fieldList), this.fieldForm)
          
          params.entity.company = params.entity.company[0].invoiceTitle
          this.submiteParams(params, createContacts)
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
    submiteParams(params, createContacts) {
      if (this.action.type == 'update') {
        params.entity.customerId = this.action.id
        params.entity.batchId = this.action.batchId
      }

      // 相关添加时候的多余提交信息
      if (
        this.action.relativeData &&
        Object.keys(this.action.relativeData).length
      ) {
        params = { ...params, ...this.action.relativeData }
      }
      if (params.entity.location == '' || !params.entity.location) {
        this.loading = false
        this.$message.error('地区定位不能为空')
        return
      }
      if (params.entity.detailAddress == '' || !params.entity.detailAddress) {
        this.loading = false
        this.$message.error('详细地址不能为空')
        return
      }
      crmCustomerSaveAPI(params)
        .then(res => {
          this.loading = false
          this.$store.dispatch('GetMessageNum')

          if (createContacts) {
            this.contactsCreateAction = {
              type: 'relative',
              crmType: 'customer',
              data: {
                customer: res.data || {}
              }
            }
            this.contactsCreateShow = true
          } else {
            this.$message.success(
              this.action.type == 'update' ? '编辑成功' : '添加成功'
            )
            this.close()
          }

          // 保存成功
          this.$emit('save-success', {
            type: 'customer',
            data: res.data || {}
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
      console.log("otherChange函数：",data,field,this.fieldForm)
    
      this.$set(this.fieldForm, field.field, data.value)
      this.$refs.crmForm.validateField(field.field)
      console.log("之后的：",this.fieldForm)
    },

    /**
     * 关闭
     */
    close() {
      this.contactsCreateShow = false
      this.fieldForm = {}
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
.wk-form {
  /deep/ .el-form-item.is-map_address {
    flex: 0 0 100%;
  }
}

.wk-premium-info-btn {
  position: absolute;
  top: -30px;
  right: 0;
}

.el-autocomplete {
  width: 100%;
}
</style>
