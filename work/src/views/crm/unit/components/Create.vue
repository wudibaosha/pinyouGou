<template>
  <xr-create
    :loading="loading"
    :title="title"
    @close="hidenView"
    @save="saveField">
    <i slot="title-append" class="wk wk-icon-fill-help wk-help-tips" data-type="16" data-id="43" />
    <create-sections title="基本信息">
      <flexbox
        direction="column"
        align="stretch">
        <div class="crm-create-body">
          <wk-form
            ref="dataForm"
            :model="dataForm"
            :rules="dataRules"
            :field-from="dataForm"
            :field-list="fieldList"
            label-position="bottom"
            @change="formChange"
          >
           
          </wk-form>
        </div>
      </flexbox>
    </create-sections>
    
   
  </xr-create>
</template>
<script type="text/javascript">
import { filedGetFieldAPI } from '@/api/crm/common'
import {
  crmUnitSaveAPI,
  crmUnitUpdateAPI
} from '@/api/crm/unit'
import {
  crmMarketingFormListAPI,
  crmMarketingFieldListAPI
} from '@/api/admin/crm'

import XrCreate from '@/components/XrCreate'
import CreateSections from '@/components/CreateSections'
import MarketingMixin from './Marketing'
import DetailImg from './DetailImg'
import WkForm from '@/components/NewCom/WkForm'
import WkUserDepDialogSelect from '@/components/NewCom/WkUserDepDialogSelect'

import { objDeepCopy } from '@/utils'

export default {
  name: 'UnitCreate',
  components: {
    XrCreate,
    CreateSections,
    WkForm,
    DetailImg,
    WkUserDepDialogSelect
  },

  filters: {},

  mixins: [MarketingMixin],

  props: {
    /**
     * save:添加、update:编辑
     */
    editUnitInfo: {},
    action: {
      type: Object,
      default: () => {
        return {
          type: 'save',
          id: ''
        }
      }
    }
  },
  data() {
    // const validateUserDept = (rule, value, callback) => {
    //   if (this.dataForm && ((this.dataForm.relationUserId && this.dataForm.relationUserId.length > 0) || (this.dataForm.relationDeptId && this.dataForm.relationDeptId.length > 0))) {
    //     callback()
    //   } else {
    //     callback(new Error('不能为空'))
    //   }
    // }

    return {
      // 标题展示名称
      title: '',
      loading: false,
      fieldList: [], // 字段
      dataRules: {
        invoiceTitle: {
          required: true,
          message: '不能为空',
          trigger: 'change'
        },
        taxNumber: {
          required: true,
          message: '不能为空',
          trigger: 'change'
        },
        depositBank: {
          required: true,
          message: '不能为空',
          trigger: 'change'
        },
        depositAccount: {
          required: true,
          message: '不能为空',
          trigger: 'change'
        },
        depositAddress: {
          required: true,
          message: '不能为空',
          trigger: 'change'
        },
        telephone: {
          required: true,
          message: '不能为空',
          trigger: 'change'
        }
      }, // 字段规则
      dataForm: {
        invoiceTitle: '',
        // crmType: '2', // 2 客户 1 线索
        taxNumber: '',
        depositBank: '',
        depositAccount: '',
        depositAddress: '',
        telephone: '',
      },
      // 展示的数组
      fieldData: []
      // showFieldList: []
    }
  },

  computed: {},

  mounted() {
    // 获取title展示名称
    document.body.appendChild(this.$el)
    this.title = this.getTitle()

    this.getCustomFormList()
  },

  destroyed() {
    // remove DOM node after destroy
    if (this.$el && this.$el.parentNode) {
      this.$el.parentNode.removeChild(this.$el)
    }
  },

  methods: {
    

    /**
     * 获取自定义数组
     */
    getCustomFormList() {
      this.loading = true
      crmMarketingFormListAPI({
        page: this.currentPage,
        limit: this.pageSize,
        pageType: 0
      })
        .then(res => {
          
          
          this.fieldList = this.getFieldList()
          this.initInfo()
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 初始化数据
     */
    initInfo() {
      if (this.action.type == 'update') {
        this.dataForm = this.editUnitInfo
      } else {
        // this.getFieldConfigIndex()
      }
    },

    /**
     * 获取字段数据
     */
    getFieldList() {
      const detailData = this.action.type == 'update' ? this.action.detail : null
      // const crmType = detailData ? detailData.crmType : '2'
      return [
        {
          field: 'invoiceTitle',
          name: '客户单位',
          formType: 'text',
          inputTips: '',
          value: detailData ? detailData.invoiceTitle : '',
          width: '',
        },
        {
          field: 'taxNumber',
          name: '纳税人识别号',
          formType: 'text',
          inputTips: '',
          value: detailData ? detailData.taxNumber : '',
          width: '',
        },
        {
          field: 'depositBank',
          name: '开户行',
          formType: 'text',
          radio: false,
          inputTips: '',
          value:detailData ? detailData.depositBank : '',
          width: '',
          
        },
        {
          field: 'depositAccount',
          name: '开户账号',
          formType: 'text',
          inputTips: '',
          value: detailData ? detailData.marketingType : '',
          width: ''
        },
        {
          field: 'depositAddress',
          name: '开票地址',
          formType: 'text',
          inputTips: '',
          value: detailData ? detailData.depositAddress : '',
          width: '',
        },
        {
          field: 'telephone',
          name: '电话',
          formType: 'mobile',
          inputTips: '',
          value: detailData ? detailData.telephone : '',
          width: '',
        },
      
      ]
    },

    /**
     * 字段的值更新
     */
    formChange(item) {
      if (item.field == 'crmType') {
        this.getFieldConfigIndex()
      }
    },

   
    /**
   * 保存数据
   */
    saveField() {
      this.$refs.dataForm.instance.validate(valid => {
        if (valid) {
          const params = objDeepCopy(this.dataForm)
          
          console.log(params)
          this.submitParams(params)
        } else {
          this.getFormErrorMessage(this.$refs.dataForm.instance)
          return false
        }
      })
    },

    /**
     * 获取error错误
     */
    getFormErrorMessage(crmForm) {
      // 提示第一个error
      if (crmForm.fields) {
        for (
          let index = 0;
          index < crmForm.fields.length;
          index++
        ) {
          const ruleField = crmForm.fields[index]
          if (ruleField.validateState == 'error') {
            this.$message.error(ruleField.validateMessage)
            break
          }
        }
      }
    },

    /**
     * 上传
     */
    submitParams(params) {
      this.loading = true
      let request = crmUnitSaveAPI
      if (this.action.type == 'update') {
        request = crmUnitUpdateAPI
        params.unitId = this.action.id
      }

      request(params)
        .then(res => {
          this.loading = false
          this.hidenView()
          this.$message.success(this.action.type == 'update' ? '编辑成功' : '创建成功')
          // 回到保存成功
          this.$emit('save-success')
        })
        .catch(() => {
          this.loading = false
        })
    },

    hidenView() {
      this.$emit('hiden-view')
    },

    /**
     * 根据类型获取标题展示名称
     */
    getTitle() {
      return this.action.type == 'update' ? '编辑发票抬头' : '新建'
    }
  }
}
</script>
<style lang="scss" scoped>
.crm-create-body {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;

  /deep/.el-form {
    padding-bottom: 10px;
  }
}

.handle-bar {
  position: relative;

  .handle-button {
    float: right;
    margin-top: 5px;
    margin-right: 20px;
  }
}

.wk-user-dep-select {
  width: 100%;
}

// 是否能选择
.only-check {
  padding: 0 10px 10px;
}

// 字段调整
.field-container {
  width: 90%;
  padding: 10px 10px 40px;
}

// 字段设置
.field-set {
  padding: 15px;
  margin: 10px 20px 40px;
  font-size: 13px;
  border: 1px solid $--border-color-base;
  border-radius: $--border-radius-base;

  &__name {
    margin-bottom: 10px;
    color: $--color-text-secondary;
  }

  .el-checkbox {
    flex: 0 0 30%;
    margin-right: 8px;
    margin-bottom: 8px;
  }
}
</style>
