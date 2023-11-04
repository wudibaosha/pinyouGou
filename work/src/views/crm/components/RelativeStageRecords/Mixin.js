
import CreateSections from '@/components/CreateSections'
import WkApprovalFlowApply from '@/components/Examine/WkApprovalFlowApply'
import ExamineInfo from '@/components/Examine/ExamineInfo'
import WkFieldView from '@/components/NewCom/WkForm/WkFieldView'
import WkField from '@/components/NewCom/WkForm/WkField'

import WkApprovalFlowApplyMixin from '@/components/Examine/mixins/WkApprovalFlowApply'
import { getFormFieldShowName } from '@/components/NewCom/WkForm/utils'
import { mapGetters } from 'vuex'

export default {
  components: {
    CreateSections,
    WkApprovalFlowApply,
    ExamineInfo,
    WkFieldView,
    WkField
  },
  data() {
    return {
    }
  },
  mixins: [WkApprovalFlowApplyMixin],
  computed: {
    ...mapGetters(['userInfo'])
  },
  methods: {
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
     * change
     */
    formChange(field, index, value, valueList) {
      // 审批流逻辑
      this.debouncedGetWkFlowList(field.fieldName, this.fieldForm)
    },

    /**
     * 获取非附件类型的展示值
     */
    getCommonShowValue(item) {
      const field = item.props
      if (field.fieldName === 'invoiceType') {
        const dataItem = this.invoiceTypeOptions.find(o => o.value == item.value)
        return dataItem ? dataItem.name : ''
      }
      return getFormFieldShowName(item.formType, item.value, '', item)
    }
  }
}

