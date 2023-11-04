<template>
  <div v-loading="loading" class="b-cont">
    <div v-if="showSaveButton" class="b-cont__handle">
      <!-- <el-button @click.native="editCancel">取消</el-button>
      <el-button
        v-debounce="editConfirm"
        type="primary">保存</el-button> -->
    </div>
    <wk-head-section
      v-for="(mainItem, mainIndex) in list"
      :key="mainIndex"
      :label="mainItem.name"
      :props="{
        headBgColor: '#FAFBFC',
        arrows: 'left',
        border: false,
        bodyPadding: '0'
      }"
      class="b-cells">
      <el-form
        :ref="`editForm${mainIndex}`"
        :model="editForm"
        :rules="currentEditRules"
        :validate-on-rule-change="false"
        class="el-form--flex"
        label-position="left"
        label-width="100px">
        <el-form-item
          v-for="(item, index) in mainItem.list"
          v-show="getShowValue(item)"
          :key="index"
          :prop="item.fieldName"
          :class="[{'is-block': isBlockShowField(item)}, `is-${item.formType}`]">
          <span v-if="item.formType!='field_group'" slot="label">
            {{ item.name }}
          </span>
          <template v-if="item.isEdit">
            <wk-edit-wrap
              @save="editConfirm(item, index)"
              @cancel="editCancel(item, index)">
              <wk-field
                :item="item"
                :index="index"
                :field-from="editForm"
                :ignore-fields="ignoreFields"
                @change="formChange"
              >
                <template slot-scope="{ data, index }">
                  <el-select
                    v-if="data.formType === 'business_status'"
                    v-model="editForm[data.fieldName]"
                    style="width: 100%;"
                    clearable>
                    <el-option
                      v-for="(optionItem, index) in getFieldOption(data)"
                      :key="index"
                      :label="optionItem.name"
                      :value="optionItem.value" />
                  </el-select>
                  <crm-relative-cell
                    v-else-if="data.formType === 'contacts' ||
                      data.formType === 'customer' ||
                      data.formType === 'contract' ||
                      data.formType === 'business' ||
                      data.formType === 'receivables'
                    "
                    :relative-type="data.formType"
                    :value="editForm[data.fieldName]"
                    @value-change="arrayValueChange($event, data)"
                  />
                  <xh-prouct-cate
                    v-else-if="data.formType === 'category'"
                    :value="editForm[data.fieldName]"
                    @value-change="arrayValueChange($event, data)"
                  />
                  <el-select
                    v-else-if="data.fieldName == 'status'"
                    v-model="editForm[data.fieldName]"
                    style="width: 100%;">
                    <el-option
                      v-for="item in data.setting"
                      :key="item.value"
                      :label="item.name"
                      :value="item.value" />
                  </el-select>
                  <el-select
                    v-else-if="data.fieldName == 'invoiceType'"
                    v-model="editForm[data.fieldName]"
                    style="width: 100%;">
                    <el-option
                      v-for="item in invoiceTypeOptions"
                      :key="item.value"
                      :label="item.name"
                      :value="item.value" />
                  </el-select>
                  <business-info-input
                    v-else-if="['leadsName', 'customerName'].includes(data.fieldName )"
                    v-model="editForm[data.field]"
                    :maxlength="100"
                    :debounce="1000"
                    style="width: 100%;"
                    :type="data.formType"
                    value-key="name" />
                </template>
              </wk-field>
            </wk-edit-wrap>
          </template>
          <template v-else>
            <div
              v-if="item.formType === 'map_address'"
              :gutter="0"
              wrap="wrap"
              class="value-box">
              <div
                :span="0.5"
                class="b-cell">
                <flexbox
                  class="b-cell-b">
                  <div class="b-cell-name">定位</div>
                  <div
                    class="b-cell-value"
                    style="color: #2362fb;cursor: pointer;"
                    @click="checkMapView(item)">{{ item.value.location }}</div>
                </flexbox>
              </div>
              <div
                :span="0.5"
                class="b-cell">
                <flexbox
                  class="b-cell-b">
                  <div class="b-cell-name">区域</div>
                  <div class="b-cell-value">{{ item.value.address }}</div>
                </flexbox>
              </div>
              <div
                :span="0.5"
                class="b-cell">
                <flexbox
                  class="b-cell-b">
                  <div class="b-cell-name">详细地址</div>
                  <div class="b-cell-value">{{ item.value.detailAddress }}</div>
                </flexbox>
              </div>
            </div>
            <flexbox
              v-else
              :class="{'can-check':isModule(item),
                       'value-box': !['desc_text','field_group'].includes(item.formType),
                       'is-disabled': !getEditAuth(item)}"
              align="stretch"
              style="width: 100%;"
              class="form-item__value">
              <wk-field-view
                :props="item"
                :form-type="item.formType"
                :value="item.value"
                :ignore-fields="ignoreFields"
              >
                <template slot-scope="{ data }">
                  <span
                    v-if="['business_type', 'business_status', 'category', 'receivables_plan'].includes(data.formType) "
                  >{{ getSpecialShowValue(data) }}</span>
                  <span
                    v-else-if="ignoreFields.includes(data.props.field) && data.props.field === 'status'"
                  >{{ getSelectShowValue(data) }}</span>
                  <span
                    v-else
                    @click="checkModuleDetail(data)"
                  >{{ getCommonShowValue(data) }}</span>
                </template>
              </wk-field-view>

              <i v-if="getEditAuth(item)" class="wk wk-icon-c-edit-line form-item__edit" @click.stop="editClick(item, index)" />
            </flexbox>
          </template>
        </el-form-item>
      </el-form>
    </wk-head-section>
    <slot />
    <map-view
      v-if="showMapView"
      :title="mapViewInfo.title"
      :lat="mapViewInfo.lat"
      :lng="mapViewInfo.lng"
      @hidden="showMapView=false" />

    <c-r-m-full-screen-detail
      :id="fullDetailId"
      :visible.sync="showFullDetail"
      :crm-type="fullDetailType" />
  </div>
</template>

<script>
import { filedGetInformationAPI, filedUpdateTableFieldAPI } from '@/api/crm/common'
import { crmMarketingInformationAPI } from '@/api/crm/marketing'

import {
  CrmRelativeCell,
  XhProuctCate
} from '@/components/CreateCom'
import WkFieldView from '@/components/NewCom/WkForm/WkFieldView'
import WkField from '@/components/NewCom/WkForm/WkField'
import MapView from '@/components/MapView' // 地图详情
import WkHeadSection from '@/components/NewCom/WkHeadSection'
import WkEditWrap from '@/components/EditWrap'
import BusinessInfoInput from '@/components/Premium/BusinessInfo/Input'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import { objDeepCopy } from '@/utils'
import { isArray, isObject, isEmpty } from '@/utils/types'
import { mapGetters } from 'vuex'
import { getFormFieldShowName } from '@/components/NewCom/WkForm/utils'
import CustomFieldsMixin from '@/mixins/CustomFields'

export default {
  // 客户管理 的 基本信息
  name: 'CRMEditBaseInfo',
  components: {
    MapView,
    CrmRelativeCell,
    XhProuctCate,
    WkFieldView,
    WkField,
    CRMFullScreenDetail: () => import('@/components/CRMFullScreenDetail'),
    WkHeadSection,
    WkEditWrap,
    BusinessInfoInput
  },
  filters: {
  },
  mixins: [CustomFieldsMixin],
  props: {
    // 模块ID
    id: [String, Number],
    poolId: [String, Number],
    isSeas: {
      type: Boolean,
      default: false
    },
    detail: {
      type: Object,
      default: () => {
        return {}
      }
    },
    // 没有值就是全部类型 有值就是当个类型
    crmType: {
      type: String,
      default: ''
    },
    // 固定字段的数据
    filedList: Array,
    // 系统消息之前的数据
    otherList: Array,
    // 忽略的字段直接输出
    ignoreFields: {
      type: Array,
      default: () => {
        return []
      }
    }
  },
  data() {
    return {
      loading: false,
      list: [],
      // 控制展示地图详情
      showMapView: false,
      // 地图详情信息
      mapViewInfo: {},
      showFullDetail: false,
      fullDetailId: '',
      fullDetailType: '',
      // 编辑
      showSaveButton: false,
      editRules: {}, // 全字段规则
      currentEditRules: {}, // 当前编辑字段规则
      editForm: {},
      allForm: {}, // 用于逻辑表单刷新
      editItem: null, // 当前编辑的项
      editOptions: {},
      editFieldData: [], // baseList 的引用
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
      }]
    }
  },
  inject: ['rootTabs'],
  computed: {
    ...mapGetters(['crm']),

    action() {
      return {
        type: 'update',
        id: this.id
      }
    }
  },
  watch: {
    id(val) {
      if (!this.filedList) {
        this.getBaseInfo(true)
      }
    },
    filedList() {
      this.list = this.filedList
    },

    'rootTabs.currentName'(val) {
      if (val === 'CRMEditBaseInfo') {
        this.getBaseInfo(false)
      }
    }

  },
  created() {
    this.$bus.on('crm-detail-update', (data) => {
      this.getBaseInfo(false)
    })
  },
  beforeDestroy() {
    this.$bus.off('crm-detail-update')
  },
  mounted() {
    if (this.filedList) {
      this.list = this.filedList
    } else {
      this.getBaseInfo(true)
    }
  },
  methods: {
    /**
     * 获取基础信息
     */
    getBaseInfo(loading) {
      this.loading = !!loading
      if (this.crmType === 'marketing') {
        crmMarketingInformationAPI().then(res => {
          this.list = res.data || []
          this.loading = false
        }).catch(() => {
          this.loading = false
        })
      } else {
        const params = {
          types: crmTypeModel[this.crmType],
          id: this.id
        }

        // 如果有公海id 需上传确定展示字段
        if (this.poolId) {
          params.poolId = this.poolId
        }

        filedGetInformationAPI(params)
          .then(res => {
            const baseList = []
            const systemList = []

            const resData = res.data || []
            // 编辑用信息
            const editFieldData = []
            const allForm = {}

            resData.forEach(item => {
              if (item.sysInformation == 1) {
                systemList.push(item)
              } else if (item.formType !== 'product' && item.formType !== 'contractRelation' && item.fieldName != 'contactsId' && item.fieldName != 'contactsEmail') {
                // 不展示产品
                if (item.fieldName === 'invoiceId') {
                  item.value = item.value[0].invoiceApplyNumber
                }
                baseList.push(item)
              }
            })

            // 逻辑表单逻辑
            baseList.forEach(item => {
              this.getFormItemDefaultProperty(item, false)

              if (this.ignoreFields.includes(item.field)) {
                // 防止影响普通单选的验证方式 该方法必须在获取值之上
                delete item.optionsData
              }

              const canEdit = this.getItemIsCanEdit(item, 'update')
              // 是否能编辑权限
              const copyItem = objDeepCopy(item)
              // 是否可编辑
              item.disabled = !canEdit

              // 特殊字段允许多选
              this.getItemRadio(item, item)

              // 表格为了展示，提前处理为编辑数据
              if (item.formType === 'detail_table') {
                if (!isEmpty(item.value)) {
                  item.value = this.getItemValue(item, null, 'update')
                }
                allForm[item.field] = item.value
              } else {
                // copyItem 避免修改原始item.value
                allForm[item.field] = this.getItemValue(copyItem, null, 'update')
              }

              editFieldData.push(item)
            })

            // 编辑逻辑赋值
            this.editFieldData = editFieldData
            const result = this.getFormContentByOptionsChange(editFieldData, allForm)
            this.allForm = result.fieldForm
            this.editRules = result.fieldRules

            if (this.otherList) {
              this.list = [
                {
                  name: '基本信息',
                  list: baseList
                },
                ...this.otherList,
                {
                  name: '系统信息',
                  list: systemList
                }
              ]
            } else {
              this.list = [
                {
                  name: '基本信息',
                  list: baseList
                },
                {
                  name: '系统信息',
                  list: systemList
                }
              ]
            }

            this.editCancel()
            this.loading = false
          })
          .catch(() => {
            this.loading = false
          })
      }
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
        const { fieldForm, fieldRules } = this.getFormContentByOptionsChange([this.editFieldData], { ...this.allForm, ...this.editForm }, this.editRules, null, 'update')

        const editForm = {}
        const currentEditRules = {}

        this.editFieldData.forEach(item => {
          // 重新获取当前可编辑字段的值和规则
          if (item.show && item.isEdit) {
            editForm[item.field] = fieldForm[item.field]
            currentEditRules[item.field] = fieldRules[item.field]
          }

          // 不展示的字段，但处在可编辑状态，置为不能编辑
          if (!item.show && item.isEdit) {
            item.isEdit = false
          }
        })
        this.editForm = editForm
        this.currentEditRules = currentEditRules
      }
    },

    /**
     * 查看地图详情
     */
    checkMapView(item) {
      if (isObject(item.value) && !isEmpty(item.value.location)) {
        this.mapViewInfo = {
          title: item.value.location,
          lat: item.value.lat,
          lng: item.value.lng
        }
        this.showMapView = true
      }
    },

    /**
     * 客户等模块类型
     */
    isModule(item) {
      return [
        'customer',
        'business',
        'contract',
        'contacts',
        'receivables'
      ].includes(item.formType)
    },

    /**
     * 是整行展示字段
     */
    isBlockShowField(item) {
      return [
        'map_address',
        'file',
        'field_group',
        'detail_table'].includes(item.formType)
    },

    /**
     * 特殊格式数据获取展示名称
     */
    getModuleName(item) {
      // 模块数据
      const modulefield = {
        customer: 'customerName',
        business: 'businessName',
        contract: 'contractNum',
        contacts: 'name',
        receivables: 'receivablesNum'
      }[item.formType]

      if (modulefield) {
        let data = {}
        if (isObject(item.value)) {
          data = item.value
        } else if (isArray(item.value) && item.value.length > 0) {
          data = item.value[0]
        }
        if (item.formType === 'contacts') {
          return data[modulefield] || data.contactsName || ''
        }
        return data[modulefield] || ''
      }

      // 常规对象数据
      const field = {
        category: 'categoryName'
      }[item.formType]
      return item.value ? item.value[field] : ''
    },

    /**
     * 获取下拉数据
     */
    getFieldOption(item) {
      const editData = this.editOptions[item.fieldName]
      let setting = []
      if (editData) {
        if (item.formType === 'select' || item.formType === 'checkbox') {
          if (editData.setting.length > 0 && typeof editData.setting[0] == 'string') {
            setting = editData.setting.map(element => {
              return { name: element, value: element }
            })
          } else {
            setting = editData.setting
          }
        } else if (item.formType === 'business_status') {
          setting = editData.setting.map(element => {
            element.value = element.statusId
            return element
          })
        }
      }

      return setting
    },

    /**
     * @description: 是否空值
     * @param {*}
     * @return {*}
     */
    isEmptyValue(value) {
      // 分组标题永远展示
      return this.formType !== 'field_group' && isEmpty(value)
    },

    /**
     * @description: 特殊formType 展示值处理
     * @param {*} data wk-field-view props 传入的数据 包含 props form-type 等
     * @return {*}
     */
    getSpecialShowValue(data) {
      let showValue = ''
      if (data.formType === 'business_type') {
        showValue = this.detail ? this.detail.typeName : ''
      } else if (data.formType === 'business_status') {
        showValue = this.detail ? this.detail.statusName : ''
      } else if (data.formType === 'category') {
        showValue = this.detail ? this.detail.categoryName : ''
      } else if (data.formType === 'receivables_plan') {
        showValue = this.detail ? this.detail.planNum : ''
      }
      return showValue
    },

    /**
     * 获取非附件类型的展示值
     */
    getCommonShowValue(item) {
      if (this.isModule(item)) {
        return this.getModuleName(item)
      } else {
        const field = item.props
        if (field.fieldName === 'invoiceType') {
          const dataItem = this.invoiceTypeOptions.find(o => o.value == item.value)
          return dataItem ? dataItem.name : ''
        }
        return getFormFieldShowName(item.formType, item.value, '', item)
      }
    },

    /**
     * 查看详情
     */
    checkModuleDetail(data) {
      const dataValue = data.value
      if (this.isModule(data)) {
        let id = ''
        if (isObject(dataValue)) {
          id = dataValue[`${data.formType}Id`]
        } else if (isArray(dataValue) && dataValue.length > 0) {
          id = dataValue[0][`${data.formType}Id`]
        }

        if (id) {
          this.fullDetailType = data.formType
          this.fullDetailId = id
          this.showFullDetail = true
        }
      }
    },

    /**
     * 编辑逻辑
     */
    getEditAuth(item) {
      if (this.isSeas) {
        return false
      }
      if (this.crmType == 'business' && ['business_type', 'business_status'].includes(item.formType)) {
        return false
      } else if ((this.crmType == 'contract' && ['business', 'contacts', 'customer'].includes(item.formType)) || item.fieldName == 'implementMoney' || item.fieldName == 'preMoney' || item.fieldName == 'preSurplusMoney' || item.fieldName == 'num') {
        return false
      } else if ((this.crmType == 'receivables' && ['contract', 'customer', 'receivables_plan'].includes(item.formType)) || item.fieldName == 'contractName') {
        return false
      } else if (this.crmType == 'receivablesPlan' && ['contract', 'customer'].includes(item.formType)) {
        return false
      } else if (this.crmType == 'invoice' && ['contract', 'customer', 'contractMoney'].includes(item.formType)) {
        return false
      } else if (this.crmType == 'visit' && ['business', 'contract', 'contacts', 'customer'].includes(item.formType)) {
        return false
      } else if (item.formType === 'desc_text' || item.formType === 'handwriting_sign' || item.formType === 'serial_number' || item.formType === 'field_group' || item.formType === 'invoice') {
        // 描述文字签名不允许编辑
        return false
      } else if (this.crmType == 'settlement' && ['serial_number', 'customer', 'contract', 'text'].includes(item.formType)) {
        if (item.formType == 'text') {
          if (item.fieldName === 'contractName') {
            return false
          }
        } else {
          return false
        }
      }
      // authLevel 1 不能查看不能编辑 2可查看  3 可编辑可查看
      return item.authLevel === 3 && this.crm && this.crm[this.crmType] && this.crm[this.crmType].update // 不能编辑 disabled true
    },

    /**
     * 点击编辑按钮
     */
    editClick(item, index) {
      // 重置上一个编辑的项
      if (this.editItem) {
        this.editItem.isEdit = false
        this.editItem = null
      }
      let dataValue = objDeepCopy(this.allForm[item.fieldName])
      // 明细表格是空时，需要填充一条空数据，展示时未处理。这里增加
      if (item.formType === 'detail_table' && isEmpty(dataValue)) {
        dataValue = this.getItemValue(objDeepCopy(item), null, 'update')
      }
      this.$set(this.editForm, item.fieldName, dataValue)
      this.$set(item, 'isEdit', true)
      this.editItem = item // 用于点击下一个取消当前等操作
      this.$set(this.editOptions, item.fieldName, item)
      this.$set(this.currentEditRules, item.fieldName, this.editRules[item.fieldName] || [])
      this.showSaveButton = true
    },

    /**
     * 点击取消
     */
    editCancel() {
      this.editItem = null // 重置当前编辑项

      if (this.$refs.editForm0[0].clearValidate) {
        this.$refs.editForm0[0].clearValidate()
      }

      this.$nextTick(() => {
        // this.list.forEach(bItem => {
        //   bItem.list.forEach(item => {
        //     item.isEdit = false
        //   })
        // })
        this.editFieldData.forEach(item => {
          item.isEdit = false
        })

        this.currentEditRules = {}
        this.editForm = {}
        this.editOptions = {}
        this.showSaveButton = false
      })
    },

    /**
     * 点击保存
     */
    editConfirm() {
      // customerId    fieldId   fieldType  fieldName  formType  value
      // this.editCancel()
      this.$refs.editForm0[0].validate(valid => {
        if (valid) {
          this.submiteInfo()
        }
      })
    },

    /**
     * 发请求提交数据
     */
    submiteInfo() {
      // 仅第一块可编辑 ，直接取第一块的数据
      this.loading = true
      const list = []
      for (let index = 0; index < this.editFieldData.length; index++) {
        const field = this.editFieldData[index]
        // 获取当前编辑 和 隐藏的字段
        if (field.formType !== 'desc_text' && (field.isEdit || !field.show)) {
          list.push({
            fieldName: field.fieldName,
            fieldType: field.fieldType,
            name: field.name,
            type: field.type,
            fieldId: field.fieldId,
            value: field.show ? this.getRealParams(field, this.editForm[field.fieldName]) : null
          })
        }
      }

      filedUpdateTableFieldAPI({
        id: this.id,
        batchId: this.detail.batchId,
        label: crmTypeModel[this.crmType],
        list: list
      }).then(res => {
        this.loading = false
        this.$emit('handle', { type: 'save-success' }) // 刷新数据
        this.editCancel()
      }).catch(() => {
        this.loading = false
      })
    },

    /**
     * 员工编辑
     * 关联模块编辑
     * 附件选择
     * 产品类别
     */
    arrayValueChange(data, item) {
      this.editForm[item.fieldName] = data.value || []
    },

    /**
     * 判断展示
     */
    getShowValue(item) {
      if (item.hasOwnProperty('show')) {
        return item.show
      }
      return true
    },

    /**
     * 获取单选值
     */
    getSelectShowValue(data) {
      const field = data.props
      let showValue = data.value
      if (showValue !== null) {
        const dataValue = field.setting.find(o => o.value === showValue)
        showValue = dataValue ? dataValue.name : ''
      }
      return showValue
    }
  }
}
</script>

<style lang="scss" scoped>
.b-cont {
  position: relative;
  height: 100%;
  overflow-y: auto;
  overflow-y: overlay;

  &__handle {
    position: absolute;
    right: 20px;
    z-index: 3;
    width: 100%;
    text-align: right;
  }
}

/deep/.section {
  margin-top: 0;

  .section-header {
    padding: 0;
    margin-bottom: $--interval-base;
  }

  .content {
    overflow: hidden;
  }
}

.el-input-number {
  width: 100%;

  /deep/ .el-input__inner {
    padding: 0 6px !important;
    text-align: left;
  }
}

.b-cells + .b-cells {
  margin-top: 24px;
}

// .b-cell {
//   padding: 0 10px;
// }

.el-form--flex {
  padding: 0;
  margin: 16px 0 0;

  /deep/ .el-form-item {
    width: calc(50% - 8px);
    max-width: 100%;
    margin-bottom: 10px;

    .el-form-item__content {
      position: relative;
      min-height: 32px;
      line-height: 1.5;
    }

    .el-form-item__label {
      padding-top: 3px;
      line-height: 1.5;
      color: $--color-text-regular;
      text-align: right;
    }

    &.is-desc_text {
      .el-form-item__content {
        margin-left: 0 !important;
      }
    }

    &.is-field_group {
      padding-left: 12px;

      .el-form-item__content {
        margin-left: 0 !important;

        .form-item__value {
          line-height: unset;
        }
      }
    }
  }
}

.value-box {
  min-height: 32px;
  padding: 3px 6px;
  background-color: $--input-disabled-fill;
  border: $--border-width-medium $--border-style-base $--input-disabled-border;
  border-radius: $--input-border-radius;
}

.form-item__value {
  line-height: 1.5;
  word-break: break-all;
  word-wrap: break-word;

  // min-height: 22px;
  white-space: pre-wrap;

  .wk-field-view:not(.is-common-type) {
    flex: 1;
    width: 0;
  }

  .wk-field-view.is-text {
    display: inline-block;
  }

  &:hover {
    .form-item__edit {
      display: inline;
    }
  }

  &.value-box:not(.is-disabled) {
    &:hover {
      padding-right: 22px;
    }

    .form-item__edit {
      position: absolute;
      top: 3px;
      right: 8px;
      padding-top: 0;
      padding-left: 4px;
      background-color: $--input-disabled-fill;
    }
  }
}

.form-item__edit {
  display: none;
  flex-shrink: 0;
  padding-top: 3px;
  margin-left: 5px;
  color: $--color-n80;
  cursor: pointer;

  &:hover {
    color: $--color-primary;
  }
}

.wk-edit-wrap {
  z-index: 1;
  display: block;
}

.can-check {
  color: $--color-primary !important;
  cursor: pointer;
}

.is-block {
  flex-basis: 100% !important;
}

.b-cell-b {
  width: auto;

  .b-cell-name {
    flex-shrink: 0;
    width: 100px;
    margin-right: 10px;
    color: $--color-text-secondary;
  }

  .b-cell-value {
    line-height: 30px;
    word-break: break-all;
    word-wrap: break-word;
    white-space: pre-wrap;
  }
}

/deep/ .wk-field-view.is-floatnumber {
  text-align: left !important;
}
</style>
