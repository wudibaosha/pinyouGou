<template>
  <xr-create
    :loading="loading"
    :title="title"
    @close="close"
    @save="saveClick">
    <i slot="title-append" class="wk wk-icon-fill-help wk-help-tips" data-type="14" data-id="41" />
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
            <crm-relative-cell
              v-if="data && (data.formType == 'contract' || data.formType == 'contacts')"
              :value="fieldForm[data.field]"
              
              :relation="data.relation"
              :relative-type="data.formType"
              @value-change="otherChange($event, data)"
            />
            <related-receivables
              v-if="data && data.formType == 'receivablesRelation'"
              ref="RelatedReceivables"
              :all-data="allData"
              
              :action="action"
              crm-type="receivables"
              @checkInfo="checkInfo"
            />
          </template>
        </wk-form-items>
      </el-form>
    </create-sections>
    <create-sections
      v-if="wkFlowList"
      title="审核信息">
      <template slot="header">
        <el-tooltip
          v-if="flowRemarks"
          :content="flowRemarks"
          effect="dark"
          placement="top">
          <i class="wk wk-help wk-help-tips" style="margin-left: 8px;" />
        </el-tooltip>
      </template>
      <wk-approval-flow-apply
        :data="wkFlowList"
        style="padding: 15px;"
      />
    </create-sections>
  </xr-create>
</template>

<script>
import RelatedReceivables from './components/RelatedReceivables'
import WkApprovalFlowApply from '@/components/Examine/WkApprovalFlowApply'
import WkApprovalFlowApplyMixin from '@/components/Examine/mixins/WkApprovalFlowApply'
import { filedGetFieldAPI } from '@/api/crm/common'
import { getFieldValueByIdAPI, crmProjectSaveAPI, getStartMoneyByBatchNumAPI } from '@/api/crm/project'
import XrCreate from '@/components/XrCreate'
import CreateSections from '@/components/CreateSections'
import WkFormItems from '@/components/NewCom/WkForm/WkFormItems'
import {
  CrmRelativeCell
} from '@/components/CreateCom'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import CustomFieldsMixin from '@/mixins/CustomFields'
import { arrayEquals } from 'element-ui/lib/utils/util'
import { typeToComponent } from '@/views/admin/fields/utils'

export default {
  // 新建编辑
  name: 'ProjectCreate',

  components: {
    XrCreate,RelatedReceivables,
    CreateSections,
    CrmRelativeCell,
    WkFormItems,
    WkApprovalFlowApply,
  },

 

  props: {
    action: {
      type: Object,
      default: () => {
        return {
          type: 'save',
          id: '',
          data: {
            type: null
          }
        }
      }
    }
  },
  mixins: [WkApprovalFlowApplyMixin,CustomFieldsMixin],
  data() {
    return {
      type: '启动',
      relatedReceivables: [],
      loading: false,
      baseFields: [],
      fieldList: [],
      originFieldList: [],
      fieldForm: {},
      fieldRules: {},
      // 审批信息
      flowRemarks: '',
      wkFlowList: null, // 有值有审批流
      types: null,
      contractInfo: {},
      startMoney: undefined, //将启动金额单独设置成一个变量，方便后面请求传参
      receivables: false,
      allData: {}
    }
  },

  computed: {
    title() {
      return this.action.type === 'update' ? '编辑项目申请' : '新建项目申请'
    }
  },

  watch: {
    types(val) {
      this.$nextTick(() => {
        // 清除表单验证change引起的报红
        this.$refs['crmForm'].clearValidate()
      })
      if (val === '启动') {
        console.log(this.fieldForm)
      }
    }
  },

  created() {
    this.getField()
  },

  mounted() {},

  beforeDestroy() {},

  methods: {
    checkInfo(val) {},

    /**
     * 获取数据
     */
    getField() {
      this.loading = true
      const params = {
        label: crmTypeModel.project
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

          console.log(list,"181 list")
          list.forEach(children => {
            const fields = []
            children.forEach(item => {
              const temp = this.getFormItemDefaultProperty(item)
              temp.show = true
              const canEdit = this.getItemIsCanEdit(item, this.action.type)//获取字段是否可编辑
              // 是否可编辑
              temp.disabled = !canEdit
              //console.log(temp.disabled,"191 是否可编辑")
              if (temp.fieldName == 'contractName' || temp.fieldName == 'customerId' || temp.fieldName == 'isAheadStart'
                || temp.fieldName == 'ownStartTotal' || temp.fieldName == 'proStartTotal' || temp.fieldName == 'proRecMoney'
                || temp.fieldName == 'cusCompany' || temp.fieldName == 'aStartMoney' || temp.fieldName == 'receivedMoney'){
                temp.disabled = true
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
          
          
          if(fieldForm.type == "启动"){
            console.log(this.fieldList)
            
            /**this.fieldList为一个二维数组，最里面的数组中的元素是一个对象，里面有field,fieldName,value等属性
             * 现在的需求是移除this.fieldList中fieldName为'proReleaseTotal','isAheadRelease','deliverMoney','ownReleaseTotal','releaseContent'的对象，用代码实现
            **/
            let newFieldList = [];
            this.originFieldList = this.fieldList
            this.fieldList.forEach((childe, index) => {
              
              newFieldList[index] = []
             
              childe.forEach((item,index2) =>{ 
                
                if((item.fieldName !== "proReleaseTotal") &&
                  (item.fieldName !== "isAheadRelease") &&
                  (item.fieldName !== "deliverMoney") &&
                  (item.fieldName !== "ownReleaseTotal") &&
                  (item.fieldName !== "releaseContent") &&
                  (item.fieldName !== "signIsReturn")
                ){
                  newFieldList[index].push(item)
                }
              })
            })

            this.fieldList = newFieldList
            
          }
          const result = this.getFormContentByOptionsChange(this.fieldList, fieldForm)
          this.fieldForm = result.fieldForm
          
          this.fieldRules = result.fieldRules

          this.initWkFlowData({
            params: { label: 13 },
            fieldForm: this.fieldForm
          }, (res) => {
            this.wkFlowList = res.list
            this.flowRemarks = res.resData ? res.resData.remarks : ''
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
    saveClick(isDraft = false) {
      this.loading = true
      const crmForm = this.$refs.crmForm
      crmForm.validate(valid => {
        if (valid) {
          
          if(this.fieldForm.type == '启动' && this.fieldForm.startMoney > this.contractInfo.money){
            this.$message.error("启动金额不能大于合同金额")
            this.loading = false
          }
          const wkFlowResult = this.validateWkFlowData(this.wkFlowList)
          if (wkFlowResult.pass || isDraft) {
            const params = this.getSubmiteParams([].concat.apply([], this.fieldList), this.fieldForm)
            params.crmReceivables = this.allData.receivables
            if (wkFlowResult.data) {
              params.examineFlowData = wkFlowResult.data
              this.submiteParams(params)
            }else {
              this.loading = false
              this.$message.error('请完善审批信息')
            }
          }
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
        params.entity.projectId = this.action.id
        params.entity.batchId = this.action.batchId
      }
      
      

      crmProjectSaveAPI(params)
        .then(res => {
          this.loading = false

          this.$message.success(
            this.action.type == 'update' ? '编辑成功' : '添加成功'
          )

          this.close()

          // 保存成功
          this.$emit('save-success', {
            type: 'visit'
          })
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 验证唯一
     */
    // UniquePromise({ field, value }) {
    //   return this.getUniquePromise(field, value, this.action)
    // },

    formChange(field, index, value, valueList) {
      
      let newFieldList = new Array()
      if(field.field == 'type' && value == '启动'){
        this.type = value
        let firstIndex = 0;
        let secondIndex = 0;
        let index3 = 0;
        this.type = value
        let fieldForm = {}
        this.originFieldList.forEach((childe, index) => {
          newFieldList[index] = []
          childe.forEach((item,index2) =>{ 

            
            if(item.fieldName == 'contactId'){
              item.disabled = false
            }
            if((item.fieldName !== "proReleaseTotal") &&
              (item.fieldName !== "isAheadRelease") &&
              (item.fieldName !== "deliverMoney") &&
              (item.fieldName !== "ownReleaseTotal") &&
              (item.fieldName !== "releaseContent") &&
              (item.fieldName !== "signIsReturn")
            ){
              if(item.fieldName == 'startMoney'){
                item.disabled = false
              }
              
              const temp = this.getFormItemDefaultProperty(item)
              temp.show=true
              fieldForm[temp.field] = this.getItemValue(item, this.action.data, this.action.type)

              newFieldList[firstIndex][secondIndex] = item
              index3++
              firstIndex = parseInt(index3 / 2)
              secondIndex = index3 % 2
            }
          })
        })
        this.fieldList = newFieldList

        const result = this.getFormContentByOptionsChange(this.fieldList, fieldForm)
        this.fieldForm = result.fieldForm
        
        this.fieldRules = result.fieldRules
      }

      if (this.type == '批次结算' && field.field == 'sampleBatchNum') {
        let param = {deliverMoney: this.deliverMoney,batchNum: value}
        getStartMoneyByBatchNumAPI(param).then(res=>{
          // this.fieldList.forEach((childe, index) => {
         
          //   childe.forEach((item,index2) =>{ 
          //     if(item.fieldName == 'startMoney'){
                this.fieldForm.startMoney = res.data.defaultValue
                
              // }
              
          //   })
          // })
        })
      }
      
      if(field.field == 'type' && value == '批次结算'){
        let newFieldList = new Array()
        let fieldForm = {}
        this.type = value
        let firstIndex = 0;
        let secondIndex = 0;
        let index3 = 0;
        this.originFieldList.forEach((childe, index) => {
          // newFieldList[firstIndex] = []
          childe.forEach((item,index2) =>{ 
            
            if(
              (item.fieldName !== "isAheadStart") &&
              (item.fieldName !== "startProType") &&
              (item.fieldName !== "proStartTotal") &&
              (item.fieldName !== "aStartMoney") && 
              (item.fieldName !== "ownStartTotal")
            ){
              if (newFieldList[firstIndex] == undefined){
                newFieldList[firstIndex] = new Array()
              }
              if(item.fieldName == 'contactId'){
                item.disabled = false
              }
              if(item.fieldName == 'startMoney' || item.fieldName == 'proReleaseTotal' || item.fieldName == 'ownReleaseTotal'){
                item.disabled = true
              }
              const temp = this.getFormItemDefaultProperty(item)
              temp.show=true
              fieldForm[temp.field] = this.getItemValue(item, this.action.data, this.action.type)

              newFieldList[firstIndex][secondIndex] = item
              index3++
              firstIndex = parseInt(index3 / 2)
              secondIndex = index3 % 2
            }

            
          })
        })


        this.fieldList = newFieldList
        const result = this.getFormContentByOptionsChange(this.fieldList, fieldForm)
        this.fieldForm = result.fieldForm
        
        this.fieldRules = result.fieldRules
      }

      if(field.field == 'startMoney'){
        this.startMoney = value;
      }

      if(field.field == 'deliverMoney'){
        this.deliverMoney = value;
      }

      
      
      // 审批流逻辑
      this.debouncedGetWkFlowList(field.field, this.fieldForm)

      
    },


    /**
     * 地址change
     */
    otherChange(data, field) {
      if (field.formType === 'contract') {
     
        if ((this.type == '启动' || this.type == '批次结算') && isNaN(this.type == '启动' ? this.startMoney : this.deliverMoney)){
          this.$message.error('请输入'+ (this.type == '启动' ? '启动' : '批次结算')+'金额')
          return
        }

        

        if (data.value.length > 0) {
          this.contractInfo = data.value[0]
          let params = {
            type: this.type,
            contractId: data.value[0].contractId,
            startMoney: this.startMoney,
            deliverMoney: this.deliverMoney
          }
          getFieldValueByIdAPI(params)
            .then(res => {
              let fieldNameList = []
              let fieldInfo = {}
              for (let i = 0; i < res.data.length; i++) {
                  let name = res.data[i].fieldName;
                  fieldNameList.push(name);
                  fieldInfo[name] = res.data[i]

                  if(res.data[i].formType == 'receivablesRelation'){
                    // if(this.fieldList[9] != undefined){
                     
                    //   this.fieldList.pop()
                    //   this.allData = {}
                    // }
                    this.receivables = true
                    // let arr = []
                    // arr.push(res.data[i])
                    // this.fieldList.push(arr)
                    this.$set(this.allData, 'receivables', res.data[i].value.receivablesRelation)
                    // this.allData.receivables = res.data[i].value.receivablesRelation
                    console.log(this.allData.receivables)
                  }
              }
              // console.log(this.allData.receivables,this.fieldList[8])
              this.fieldList.forEach((childe, index) => {
              
                childe.forEach((item) => {
                  for (let j = 0; j < fieldNameList.length; j++){
                    if(item.fieldName == fieldNameList[j]){
                  
                      item.setting = fieldInfo[fieldNameList[j]].setting
                      this.fieldForm[fieldNameList[j]] = fieldInfo[fieldNameList[j]].defaultValue
                      // item.value = fieldInfo[fieldNameList[j]].defaultValue
                    }
                  }
                })
              })
            })  
        
          // this.$set(this.fieldForm, 'customerName', data.value[0].customerName)
          // this.$set(this.fieldForm, 'contactsEmail', data.value[0].contactsEmail)
          // this.$set(this.fieldForm, 'customerUnit', data.value[0].customerUnit)
          // this.$set(this.fieldForm, 'productLine', data.value[0].productLine)
          // this.$set(this.fieldForm, 'productType', data.value[0].productType)
          // this.$set(this.fieldForm, 'region', data.value[0].region)
          console.log( data.value[0])
          this.$set(this.fieldForm, 'contractName', data.value[0].name)
          // this.$set(this.fieldForm, 'receivedMoney', data.value[0].receivedMoney)
          this.$set(this.fieldForm, 'cusCompany', data.value[0].customerUnit)
          this.$set(this.fieldForm, 'proRecMoney', data.value[0].receivedMoney)
          this.$set(this.fieldForm, 'customerId', [{
            customerId: data.value[0].customerId,
            customerName: data.value[0].customerName
          }])

          if(data.value[0].receivedMoney == 0 || this.fieldForm.ownStartTotal > 200000){
            this.fieldForm.isAheadStart = '是'
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
.wk-form {
  /deep/ .el-form-item.is-product {
    flex: 0 0 100%;
    width: 0;
  }
}
</style>



