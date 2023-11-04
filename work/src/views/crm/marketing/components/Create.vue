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
            label-position="top"
            @change="formChange"
          >
            <template slot-scope="{ data }">
              <wk-user-dep-dialog-select
                style="width: 100%;"
                :user-value.sync="dataForm.relationUserId"
                :dep-value.sync="dataForm.relationDeptId"
                placeholder="请选择员工或部门"
              />
            </template>
          </wk-form>
        </div>
      </flexbox>
      <el-checkbox
        v-model="onlyOne"
        class="only-check">每个用户只能填写一次<span style="color: #6b778c;">（您可以将市场活动通过表单的形式分享给用户，用户可以查看并提交表单）</span></el-checkbox>
    </create-sections>
    <create-sections title="图片信息">
      <i slot="header" class="wk wk-icon-fill-help wk-help-tips" data-type="16" data-id="145" />
      <detail-img
        :detail="imageData"
        @change="detailImgChange"
        @delete="deleteImg" />
    </create-sections>
    <create-sections title="字段信息">
      <div class="field-set">
        <div class="field-set__name">
          您可以通过勾选自定义配置分享后表单的字段信息
        </div>
        <flexbox
          wrap="wrap">
          <el-checkbox
            v-for="(item, index) in fieldData"
            :key="index"
            v-model="item.isHidden"
            :true-label="0"
            :false-label="1">{{ item.name }}</el-checkbox>
        </flexbox>
      </div>
    </create-sections>
  </xr-create>
</template>
<script type="text/javascript">
import { filedGetFieldAPI } from '@/api/crm/common'
import {
  crmMarketingSaveAPI,
  crmMarketingUpdateAPI
} from '@/api/crm/marketing'
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

import { objDeepCopy, formatTimeToTimestamp } from '@/utils'

export default {
  name: 'MarketingCreate',
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
    const validateUserDept = (rule, value, callback) => {
      if (this.dataForm && ((this.dataForm.relationUserId && this.dataForm.relationUserId.length > 0) || (this.dataForm.relationDeptId && this.dataForm.relationDeptId.length > 0))) {
        callback()
      } else {
        callback(new Error('不能为空'))
      }
    }

    var validateTime = (rule, value, callback) => {
      if (this.dataForm.startTime && this.dataForm.endTime) {
        if (
          formatTimeToTimestamp(this.dataForm.startTime) >=
          formatTimeToTimestamp(this.dataForm.endTime)
        ) {
          callback(new Error('开始时间必须小于结束时间'))
        }
      }
      callback()
    }

    return {
      // 标题展示名称
      title: '',
      loading: false,
      fieldList: [], // 字段
      dataRules: {
        marketingName: {
          required: true,
          message: '不能为空',
          trigger: 'change'
        },
        crmType: {
          required: true,
          message: '不能为空',
          trigger: 'change'
        },
        relationUserDeptId: {
          required: true,
          validator: validateUserDept,
          trigger: ['blur', 'change']
        },
        endTime: [{
          required: true,
          message: '不能为空',
          trigger: 'change'
        },
        { validator: validateTime, trigger: 'blur' }],
        startTime: [{
          required: true,
          message: '不能为空',
          trigger: 'change'
        },
        { validator: validateTime, trigger: 'blur' }],
        remark: {
          required: true,
          message: '不能为空',
          trigger: 'change'
        }
      }, // 字段规则
      dataForm: {
        marketingName: '',
        crmType: '2', // 2 客户 1 线索
        relationUserId: [],
        relationDeptId: [],
        marketingType: '',
        endTime: '',
        fieldDataId: '',
        browse: '',
        marketingMoney: '',
        submitNum: '',
        startTime: '',
        address: '',
        remark: ''
      },
      // 只能填写一次
      onlyOne: true, // 0 不限制 1 只能填写一次
      // 图片信息
      imageData: {
        mainFile: [],
        detailFile: []
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
     * 获取字段信息
     */
    getFieldConfigIndex() {
      const request = this.dataForm.crmType > 2 ? crmMarketingFieldListAPI : filedGetFieldAPI
      const params = this.dataForm.crmType > 2 ? {
        id: this.dataForm.crmType
      } : {
        label: this.dataForm.crmType,
        type: '1' //  一维数组
      }
      request(params)
        .then(res => {
          const resData = (res.data || []).filter(item => ![
            'user',
            'structure',
            'file',
            'desc_text', // 不支持 描述文字、地址、定位、手写签名、图片、明细表格、分组标题 自定义编号 自定义标签 分组标题
            'position',
            'location',
            'handwriting_sign',
            'detail_table',
            'serial_number',
            'field_attention',
            'field_group',
            'pic',
            'customer' // 上级客户
          ].includes(item.formType))

          if (
            this.action.type == 'update' &&
            this.dataForm.crmType == this.action.detail.crmType
          ) {
            const showFieldsStr = this.action.detail.fieldDataId || ''

            const showFields = showFieldsStr.split(',')
            const fieldList = []
            for (let index = 0; index < resData.length; index++) {
              const element = resData[index]
              if (this.isShowField(element.formType)) {
                if (showFields.includes(element.fieldId)) {
                  element.isHidden = 0
                } else {
                  element.isHidden = 1
                }
                fieldList.push(element)
              }
            }
            this.fieldData = fieldList
          } else {
            const fieldList = []
            for (let index = 0; index < resData.length; index++) {
              const element = resData[index]
              if (this.isShowField(element.formType)) {
                element.isHidden = 0
                fieldList.push(element)
              }
            }
            this.fieldData = fieldList
          }
        })
        .catch(() => {})
    },

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
          const list = res.data || []
          const settingList = [
            { name: '客户', value: '2' },
            { name: '线索', value: '1' }
          ].concat(list.map(item => {
            return {
              name: item.title,
              value: item.id
            }
          }))
          this.fieldList = this.getFieldList(settingList)
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
        const dataForm = {}
        for (let index = 0; index < this.fieldList.length; index++) {
          const element = this.fieldList[index]
          if (element.field === 'relationUserDeptId') {
            dataForm.relationUserId = element.value.relationUserId
            dataForm.relationDeptId = element.value.relationDeptId
          } else {
            dataForm[element.field] = element.value
          }
        }

        this.dataForm = dataForm

        this.onlyOne = this.action.detail.second == 1

        this.imageData = {
          mainFile: this.action.detail.mainFileList || [],
          detailFile: this.action.detail.detailFileList || []
        }

        this.getFieldConfigIndex()
      } else {
        this.getFieldConfigIndex()
      }
    },

    /**
     * 获取字段数据
     */
    getFieldList(crmTypeSetting) {
      const detailData = this.action.type == 'update' ? this.action.detail : null
      const crmType = detailData ? detailData.crmType : '2'
      return [
        {
          field: 'marketingName',
          name: '活动名称',
          formType: 'text',
          inputTips: '',
          setting: [],
          value: detailData ? detailData.marketingName : '',
          width: '',
          tipType: 'system-help',
          helpType: '16',
          helpId: '48'
        },
        {
          field: 'crmType',
          name: '关联对象',
          formType: 'select',
          inputTips: '用户提交的表单信息可以同步到关联模块',
          setting: crmTypeSetting,
          value: crmType.toString(),
          width: '',
          tipType: 'system-help',
          helpType: '16',
          helpId: '141'
        },
        {
          field: 'relationUserDeptId',
          name: '参与人员',
          formType: 'userDep',
          radio: false,
          inputTips: '参与人员将获得自己专属的表单二维码',
          setting: [],
          value: detailData ? {
            relationUserId: (detailData.relationUserInfo || []).map(item => item.userId),
            relationDeptId: (detailData.relationDeptInfo || []).map(item => item.id || item.deptId)
          } : {
            relationUserId: [],
            relationDeptId: []
          },
          width: '',
          tipType: 'system-help',
          helpType: '16',
          helpId: '142'
        },
        {
          field: 'marketingType',
          name: '活动类型',
          formType: 'select',
          inputTips: '',
          setting: ['广告', '研讨会/会议', '电子邮件', '营销', '公共关系', '合作伙伴'],
          value: detailData ? detailData.marketingType : '',
          width: ''
        },
        {
          field: 'startTime',
          name: '开始时间',
          formType: 'datetime',
          inputTips: '',
          setting: [],
          value: detailData ? detailData.startTime : '',
          width: '',
          tipType: 'system-help',
          helpType: '16',
          helpId: '143'
        },
        {
          field: 'endTime',
          name: '截止时间',
          formType: 'datetime',
          inputTips: '',
          setting: [],
          value: detailData ? detailData.endTime : '',
          width: '',
          tipType: 'system-help',
          helpType: '16',
          helpId: '143'
        },
        {
          field: 'browse',
          name: '浏览数',
          formType: 'number',
          inputTips: '',
          setting: [],
          value: detailData ? detailData.browse || '' : '',
          width: '',
          tipType: 'system-help',
          helpType: '16',
          helpId: '144'
        },
        {
          field: 'submitNum',
          name: '提交数',
          formType: 'number',
          inputTips: '',
          setting: [],
          value: detailData ? detailData.submitNum || '' : '',
          width: '',
          tipType: 'system-help',
          helpType: '16',
          helpId: '144'
        },
        {
          field: 'marketingMoney',
          name: '活动预算',
          formType: 'floatnumber',
          inputTips: '',
          setting: [],
          value: detailData ? detailData.marketingMoney : '',
          width: ''
        },
        {
          field: 'address',
          name: '活动地址',
          formType: 'text',
          inputTips: '',
          setting: [],
          value: detailData ? detailData.address : '',
          width: ''
        },
        {
          field: 'synopsis',
          name: '活动简介',
          formType: 'textarea',
          inputTips: '',
          setting: [],
          value: detailData ? detailData.synopsis : '',
          width: ''
        }
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
     * 修改图片
     */
    detailImgChange(type, data) {
      if (type === 'mainFile') {
        this.imageData.mainFile = data
      } else if (type === 'detailFile') {
        this.imageData.detailFile = data
      }
    },

    deleteImg(type, data) {
      if (type === 'mainFile') {
        this.imageData.mainFile = data
      } else if (type === 'detailFile') {
        this.imageData.detailFile = data
      }
    },

    /**
   * 保存数据
   */
    saveField() {
      this.$refs.dataForm.instance.validate(valid => {
        if (valid) {
          const params = objDeepCopy(this.dataForm)
          params.second = this.onlyOne ? 1 : 0 // 0 不限制 1 只能填写一次

          let fieldDataId = ''
          this.fieldData.forEach((item, index) => {
            if (item.isHidden == 0) {
              fieldDataId += `,${item.fieldId}`
            }
          })
          params.fieldDataId = fieldDataId ? fieldDataId + ',' : ''
          params.relationUserId = ',' + this.dataForm.relationUserId.join(',') + ','
          params.relationDeptId = ',' + this.dataForm.relationDeptId.join(',') + ','
          params.browse = params.browse ? params.browse : 0
          params.submitNum = params.submitNum ? params.submitNum : 0
          // params.endTime = params.endTime
          // params.startTime = params.startTime

          // 活动图片
          params.mainFileIds = this.imageData.mainFile ? this.imageData.mainFile.map(item => item.fileId).join(',') : ''
          params.detailFileIds = this.imageData.detailFile ? this.imageData.detailFile.map(item => item.fileId).join(',') : ''
          this.submiteParams(params)
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
    submiteParams(params) {
      this.loading = true
      let request = crmMarketingSaveAPI
      if (this.action.type == 'update') {
        request = crmMarketingUpdateAPI
        params.marketingId = this.action.id
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
      return this.action.type == 'update' ? '编辑活动' : '新建活动'
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
