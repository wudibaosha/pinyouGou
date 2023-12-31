<template>
  <xr-create
    :loading="loading"
    :title="title"
    @close="close"
    @save="saveClick">
    <i slot="title-append" class="wk wk-icon-fill-help wk-help-tips" data-type="15" data-id="42" />
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
          :ignore-fields="ignoreFields"
          @change="formChange"
        >
          <template slot-scope="{ data }">
            <el-select
              v-if="data && data.field == 'status'"
              v-model="fieldForm[data.field]"
              :disabled="data.disabled"
              style="width: 100%;"
              @change="formChange(data, index, $event)">
              <el-option
                v-for="item in data.setting"
                :key="item.value"
                :label="item.name"
                :value="item.value" />
            </el-select>
            <xh-prouct-cate
              v-else-if="data && data.formType == 'category'"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              @value-change="otherChange($event, data)"
            />
            <div v-else-if="data.field == 'num'" style="position: relative;line-height: normal;">
              <el-input
                v-model="fieldForm[data.field]"
                :disabled="data.disabled"
                :maxlength="390"
                @value-change="otherChange($event, data)">
                <template slot="append">
                  <el-button
                    type="text"
                    class="wk-premium-info-btn"
                    style="padding-right: 5px;">
                    <i class="wk wk-icon-lightning-solid wk-premium-info-icon" />
                    <span class="wk-premium-info-label" data-type="Scan">扫码录入</span>
                  </el-button>
                </template>
              </el-input>
            </div>
          </template>
        </wk-form-items>
      </el-form>
    </create-sections>
    <create-sections title="图片信息">
      <detail-img
        :detail="imageData"
        @change="detailImgChange"
        @delete="deleteImg" />
    </create-sections>
  </xr-create>
</template>

<script>
import { filedGetFieldAPI } from '@/api/crm/common'
import { crmProductSaveAPI } from '@/api/crm/product'

import XrCreate from '@/components/XrCreate'
import CreateSections from '@/components/CreateSections'
import WkFormItems from '@/components/NewCom/WkForm/WkFormItems'
import {
  XhProuctCate
} from '@/components/CreateCom'
import DetailImg from './components/DetailImg'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import CustomFieldsMixin from '@/mixins/CustomFields'

export default {
  // 新建编辑
  name: 'ProductCreate',

  components: {
    XrCreate,
    CreateSections,
    XhProuctCate,
    DetailImg,
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
      ignoreFields: ['status', 'num'],
      baseFields: [],
      fieldList: [],
      fieldForm: {},
      fieldRules: {},

      // 图片信息
      imageData: {
        mainFile: [],
        detailFile: []
      }
    }
  },

  computed: {
    title() {
      return this.isEdit ? '编辑产品' : '新建产品'
    },

    isEdit() {
      return this.action.type === 'update'
    }
  },

  watch: {
    'action.editDetail': {
      handler(data) {
        if (data) {
          this.imageData = {
            mainFile: data.mainFileList || [],
            detailFile: data.detailFileList || []
          }
        }
      },
      immediate: true
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
      this.loading = true
      const params = {
        label: crmTypeModel.product
      }

      if (this.isEdit) {
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
              // 上下架  累加角色 权限
              if (this.isEdit && temp.fieldName === 'status' && !this.$auth('crm.product.status')) {
                temp.disabled = true
              }

              // 特殊字段允许多选
              this.getItemRadio(item, temp)

              // 获取默认值
              if (temp.show) {
                if (this.ignoreFields.includes(temp.field)) {
                  fieldForm[temp.field] = this.isEdit ? temp.value : temp.defaultValue
                } else {
                  fieldForm[temp.field] = this.getItemValue(item, this.action.data, this.action.type)
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
          // 图片信息
          params.entity.mainFileIds = this.imageData.mainFile ? this.imageData.mainFile.map(item => item.fileId).join(',') : ''
          params.entity.detailFileIds = this.imageData.detailFile ? this.imageData.detailFile.map(item => item.fileId).join(',') : ''
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
      if (this.isEdit) {
        params.entity.productId = this.action.id
        params.entity.batchId = this.action.batchId
      }

      // 相关添加时候的多余提交信息
      if (
        this.action.relativeData &&
        Object.keys(this.action.relativeData).length
      ) {
        params = { ...params, ...this.action.relativeData }
      }
      crmProductSaveAPI(params)
        .then(res => {
          this.loading = false

          this.$message.success(
            this.isEdit ? '编辑成功' : '添加成功'
          )

          this.close()

          // 保存成功
          this.$emit('save-success', {
            type: 'product'
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
     * 修改图片
     */
    detailImgChange(type, data) {
      if (type === 'mainFile') {
        this.imageData.mainFileList = data
      } else if (type === 'detailFile') {
        this.imageData.detailFileList = data
      }
    },

    deleteImg(type, data) {
      if (type === 'mainFile') {
        this.action.editDetail.mainFileList = data
      } else if (type === 'detailFile') {
        this.action.editDetail.detailFileList = data
      }
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
