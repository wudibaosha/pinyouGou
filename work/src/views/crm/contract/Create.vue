<template>
  <xr-create
    :loading="loading"
    :title="title"
    :confirm-button-text="sureBtnTitle"
    @close="close"
    @save="saveClick">
    <i slot="title-append" class="wk wk-icon-fill-help wk-help-tips" data-type="11" data-id="38" />
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
          @change="formChange">


          <template slot-scope="{ data }">
            <crm-relative-cell
            
              v-if="data && data.formType == 'customer'"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              relative-type="customer"
              @value-change="otherChange($event, data)"
            />
            <crm-relative-cell
              v-if="data && (data.formType == 'business' || data.formType == 'contacts')"
              :value="fieldForm[data.field]"
              :disabled="data.disabled"
              :relation="data.relation"
              :relative-type="data.formType"
              is-or-contract="0"
              @value-change="otherChange($event, data)"
            />
            <xh-product
              v-if="data && data.formType == 'product'"
              :value="fieldForm[data.field]"
              @value-change="otherChange($event, data)"
            />
            <related-contract
              v-if="data && data.formType == 'contractRelation'"
              ref="RelatedContract"
              :all-data="allData"
              :relative-contacts="relativeContacts"
              :action="action"
              crm-type="contract"
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

    <el-button
      slot="footer"
      type="primary"
      plain
      @click.native="debouncedSaveField(true)">保存草稿</el-button>

      <contract-part-create 
      v-if="showPartDialog"
      :action="createActionInfo"
      @close2="showPartDialog = false">

     </contract-part-create>
    <el-button
      v-if="isPartShow"
      slot="footer2"
      type="primary"
      plain
      @click.native="debouncedPartShowField(true)">拆分</el-button>

      <el-button
      v-if="parseInt(action.id) < 10000"
      slot="footer2"
      type="primary"
      plain
      @click.native="abtn()">关联附件</el-button>

    <!-- <div>
      <el-button
        slot="footer"
        type="primary"
        plain
        @click.native="debouncedSaveField(true)">保存草稿</el-button> 
      <el-button
      slot="footer"
      type="primary"
      plain
      @click.native="debouncedSaveField(true)">拆分</el-button>     
    </div> -->
     
  </xr-create>
  
</template>

<script>
import { filedGetFieldAPI } from '@/api/crm/common'
import { crmContractSaveAPI, crmContractQueryNumAPI, fileAPI } from '@/api/crm/contract'
import { crmBusinessProductAPI } from '@/api/crm/business'

import XrCreate from '@/components/XrCreate'
import CreateSections from '@/components/CreateSections'
import WkFormItems from '@/components/NewCom/WkForm/WkFormItems'
import {
  CrmRelativeCell
} from '@/components/CreateCom'
import WkApprovalFlowApply from '@/components/Examine/WkApprovalFlowApply'
import WkApprovalFlowApplyMixin from '@/components/Examine/mixins/WkApprovalFlowApply'
import RelatedContract from './component/RelatedContract'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import CustomFieldsMixin from '@/mixins/CustomFields'
import { debounce } from 'throttle-debounce'
import { objDeepCopy, guid } from '@/utils'
import { isEmpty } from '@/utils/types'
import { RFC_2822 } from 'vue-moment'
import ContractPartCreate from './PartCreate.vue'

export default {
  // 新建编辑
  name: 'ContractCreate',

  components: {
    XrCreate,
    ContractPartCreate,
    CreateSections,
    CrmRelativeCell,
    XhProduct: () => import('../product/components/XhProduct'),
    WkFormItems,
    WkApprovalFlowApply,
    RelatedContract
  },

  mixins: [CustomFieldsMixin, WkApprovalFlowApplyMixin],

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
      show:true,
      createActionInfo: {},
      showPartDialog: false,
      isPartShow: true,
      fieldOrigin: {},
      editableTabsValue: '2',
      loading: false,
      baseFields: [],
      fieldList: [],
      fieldForm: {},
      fieldRules: {},
      otherfieldRules: {},
      relatedContractData: {},
      allContractMoeny: 0,
      allData: {},
      relativeContacts: true,
      types: null,
      batchId: '',
      // 审批信息
      flowRemarks: '',
      wkFlowList: null, // 有值有审批流
      currentKey: '', // 随机数
      allPrice: '',
      typestrue: false //执行合同时合同金额
    }
  },

  computed: {
    title() {
      if (this.action.title) {
        return this.action.title
      }
      return this.action.type === 'update' ? '编辑合同' : '新建合同'
    },

    // 确认名称
    sureBtnTitle() {
      if (this.wkFlowList) {
        return '提交审核'
      }
      return '保存'
    },
    
  },

  watch: {  
    types(val) {
      // console.log(val,"val") //选择合同类型 返回val
      this.$nextTick(() => {
        // 清除表单验证change引起的报红
        this.$refs['crmForm'].clearValidate()
        // console,log(this.$refs['crmForm'].clearValidate(),"this.$refs['crmForm'].clearValidate()")
      })
      if (val == '执行合同') {
        this.fieldRules = {}
        this.fieldList.forEach((childe, index) => {
          childe.forEach((item, i) => {
            if (item.fieldName == 'contractRelation') {
              item.isNull = 1
            }
            if (item.fieldName == 'money') {
              this.$set(this.fieldList[index][i], 'disabled', true)
            }
           
          })
        })
        const result = this.getFormContentByOptionsChange(this.fieldList, this.fieldForm)
        this.fieldRules = result.fieldRules
      } else {
        this.fieldRules = this.sourcefieldRules
        this.fieldList.forEach((childe, index) => {
          childe.forEach((item, i) => {
            if (item.fieldName == 'money') {
              this.$set(this.fieldList[index][i], 'disabled', false)
            }
          })
        })
      }
    }
  },

  created() {
    if (sessionStorage.getItem('currentKey')) {
      this.currentKey = sessionStorage.getItem('currentKey')
    } else {
      this.currentKey = guid()
      sessionStorage.setItem('currentKey', this.currentKey)
    }
    this.debouncedSaveField = debounce(300, this.saveClick)
    this.debouncedPartShowField = debounce(300, this.partShowClick)
    this.getField()
  },


  beforeDestroy() {},

  methods: {
    abtn(){
      
       fileAPI({id: this.action.id, batchId:this.fieldForm.fieldAinmgu[0].batchId }).then(res=>{
        this.$message.success("关联成功")
       })
    },
    partShowClick(){
      this.showPartDialog = true
      this.createActionInfo = {
        title: '拆分合同',
        type: 'update',
        id: this.action.id,
          batchId: this.action.batchId
      }
      // alert(1)
    },
    getPreMoney(maxData, minData) {
      this.itemsForEach(this.fieldList, fieldItem => {
        if (fieldItem.fieldName == 'preSurplusMoney') {
          this.fieldForm[fieldItem.fieldName] = maxData - minData
          var residueMoney = maxData - minData
          if (isNaN(residueMoney)) residueMoney = -minData
          this.$set(this.fieldForm, 'preSurplusMoney', residueMoney)
        }
      })
    },

    checkInfo(val) {
      
      this.relatedContractData = val
      if (this.action.type === 'update') return
      this.allContractMoeny = 0
      const dataInfo = val || {}
      // console.log(dataInfo, 'dataInfo')
      // console.log(isEmpty(dataInfo))
      if (isEmpty(dataInfo)) {
        this.itemsForEach(this.fieldList, fieldItem => {
          if (fieldItem.fieldName == 'preMoney') {
            this.$set(this.fieldForm, 'preMoney', 0)
          } else if (fieldItem.fieldName == 'preSurplusMoney') {
            this.$set(this.fieldForm, 'preSurplusMoney', 0)
          } else if (fieldItem.fieldName == 'implementMoney') {
            this.$set(this.fieldForm, 'implementMoney', 0)
          }
        })
        return
      }
      // 所有合同总金额
      dataInfo.contract.forEach(item => {
        this.allContractMoeny += item.money
      })

      // 关联预付款金额之和
      const total_price_array = dataInfo.contract.map((item) => {
        if (item.price) {
          return item.price
        }
        return 0
      })
      this.allPrice = total_price_array.reduce(function(prev, cur, index, arr) {
        return prev + cur
      }, 0)

    
      if (this.allPrice > this.fieldForm.preSurplusMoney) {
        this.$message.error(`关联预付款金额不能大于预付款剩余金额`)
      }


      
      // 合同金额等于关联预付款合同金额之和
      
      
      if (this.types == '执行合同') {
        
        this.$set(this.fieldForm, 'money', this.allPrice)
      }

      // 预付款合同
      const allPreMoneyData = dataInfo.contract.filter(item => {
        return item.typesName == 3
      })

      let middleMoney = 0
      allPreMoneyData.forEach(item => {
        middleMoney += item.money
      })
      // this.allPreMoney = middleMoney || 0
      this.itemsForEach(this.fieldList, fieldItem => {
        if (fieldItem.fieldName == 'preMoney') {
          this.$set(this.fieldForm, 'preMoney', middleMoney)
        } else if (fieldItem.fieldName == 'preSurplusMoney') {
          this.$set(this.fieldForm, 'preSurplusMoney', middleMoney - this.allContractMoeny)
        }
      })

      // 执行合同
      const allExecuteData = dataInfo.contract.filter(item => {
        return item.typesName == 4
      })
      let executeMoney = 0
      allExecuteData.forEach(item => {
        executeMoney += item.money
      })
      this.itemsForEach(this.fieldList, fieldItem => {
        if (fieldItem.fieldName == 'implementMoney') {
          this.$set(this.fieldForm, 'implementMoney', executeMoney)
        }
      })
    },
    /**
     * 获取数据
     */
    getField() {
      this.loading = true
      const params = {
        label: crmTypeModel.contract
      }

    
      if (this.action.type == 'update') {
        params.id = this.action.id
      }

      filedGetFieldAPI(params)
        .then(res => {
          const list = res.data || []
          console.log(list)
          const baseFields = []
          const fieldList = []
          const fieldForm = {}
          list.forEach(children => {
            console.log(children)
            const fields = []
            children.forEach(item => {
              console.log(item)
              const temp = this.getFormItemDefaultProperty(item)
              temp.show = true
              const canEdit = this.getItemIsCanEdit(item, this.action.type)
              // 是否可编辑
              temp.disabled = !canEdit
              if (temp.fieldName == 'preMoney' ||
              // temp.fieldName == 'preSurplusMoney' ||
              // temp.fieldName == 'num' ||
              temp.fieldName == 'contactsEmail' ||
              temp.fieldName == 'contactsTelephone' ||
              temp.fieldName == 'contractMoney' ||
              temp.fieldName == 'productLine' ||
              temp.fieldName == 'productType' ||
              temp.fieldName == 'region' ||
              temp.formType == 'customer' 
              
              ) {
                temp.disabled = true
              }
              if(temp.fieldName == 'money'){
                  temp.disabled = this.typestrue

              }
              
              // 合同类型执行合同时可添加关联合同
              if (this.action.type == 'update' && temp.fieldName == 'types' && temp.value == '执行合同') {
                this.relativeContacts = false
                this.typestrue = true  
              }

              if (temp.fieldName == 'contractRelation') {
                if (temp.value.contractRelation != []) {
                  temp.value.contractRelation.forEach(childItem => {
                    // delete childItem.contractId
                    childItem.contractId = childItem.relationId
                  })
                  this.allData.contract = temp.value.contractRelation
                  this.relatedContractData.contract = temp.value.contractRelation
                }
              }


              
              // 禁止某些业务组件选择
              if (temp.formType == 'contacts' ||
                temp.formType == 'customer' ||
                temp.formType == 'business'
              ) {
                if (this.action.type == 'relative') {
                  const relativeDisInfos = {
                    contacts: { customer: true },
                    customer: { customer: true },
                    business: { customer: true, business: true }
                  }

                  // 在哪个类型下添加
                  const relativeTypeDisInfos = relativeDisInfos[this.action.crmType]
                  if (relativeTypeDisInfos) {
                    // 包含的字段值
                    temp.disabled = relativeTypeDisInfos[item.formType] || false
                  }
                } else if (this.action.type != 'update') {
                  // temp.disabled = item.formType === 'business' || item.formType === 'contacts'
                  temp.disabled = item.formType === 'contacts' || item.formType === 'customer'
                }
              }

              // 处理关联
              if ((this.action.type == 'relative' || this.action.type == 'update') && (item.formType == 'business' || item.formType == 'contacts' || item.formType == 'contract'
              )) {
                const customerObj = this.getItemRelatveInfo(list, 'customer')
                if (customerObj) {
                  const customerItem = objDeepCopy(customerObj)
                  if (item.formType == 'business' || item.formType == 'contacts') {
                    customerItem['moduleType'] = 'customer'
                    temp['relation'] = customerItem
                  } else if (item.formType == 'contract') {
                    customerItem['moduleType'] = 'customer'
                    customerItem['params'] = { checkStatus: [1, 10] }
                    temp['relation'] = customerItem
                  }
                }
              }
              // 特殊字段允许多选
              this.getItemRadio(item, temp)

              // if (['preSurplusMoney', 'implementMoney', 'preMoney', 'contactsEmail', 'contactsId'].includes(temp.fieldName)) {
              //   return temp
              // }
              if (['implementMoney', 'preMoney'].includes(temp.fieldName)) {
                return temp
              }
              // 获取默认值
              // 非编辑情况下 填充默认值
              if (temp.show) {
                if (this.action.type != 'update' && item.fieldName === 'orderDate') {
                  fieldForm[temp.field] = this.$moment().format('YYYY-MM-DD')
                } else {
                  fieldForm[temp.field] = this.getItemValue(item, this.action.data, this.action.type)
                  
                  if (this.action.type == 'relative' && ['contactsEmail'].includes(temp.field)) {
                    if (temp.fieldName == 'contactsEmail') {
                      if (this.action.data.customer) {
                        fieldForm[temp.field] = this.action.data.customer.email
                      }
                      if (this.action.data.business) {
                        fieldForm[temp.field] = this.action.data.business.contactsEmail
                      }
                    }
                  }
                }
              }

            //  console.log(fieldForm)
              // 复制合同时，不复制自定义编号类型的字段
              
              if (this.action.isCopy && temp.formType === 'serial_number') {
                fieldForm[temp.field] = null
              }

              if (this.action.isCopy && temp.formType === 'file') {
                
                fieldForm[temp.field] = []
              }

            

              fields.push(temp)
              console.log(fields,"fields")
              
              // fields.forEach((item,index) =>{
              //   //  console.log(item,index)
              //    if(item.fieldName == 'types' && item.value == '执行合同'){
              //       item.fieldName == 'money'  && fields[index].disabled == true
              //         // item.disabled = true    
              //    }
              // })


              baseFields.push(item)
            })
            fieldList.push(fields)
            this.fieldOrigin.fieldYdsegr = fieldForm.fieldYdsegr
            this.fieldOrigin.money = fieldForm.money
            this.fieldOrigin.types = fieldForm.types
           
          })
          // 填充商机关联的产品信息
          if (this.action.type == 'relative') {
            const businessData = this.action.data.business
            if (businessData) {
              this.getBusinessProduct(businessData.businessId).then(resData => {
                const businessData = resData || {}
                fieldForm.product = {
                  product: businessData.list,
                  totalPrice: businessData.money,
                  discountRate: businessData.discountRate
                }
                fieldForm.money = businessData.money || ''
              }).catch(() => {})
            }
          }

          this.baseFields = baseFields
          this.fieldList = fieldList

          //HYL 禁止编辑合同编号 需回滚
          if(this.action.type=='update'){
    
            this.fieldList.forEach((childe, index) => {
              childe.forEach((item, i) => {
                if (!this.action.isCopy && item.fieldName == 'num') {
                  this.$set(this.fieldList[index][i], 'disabled', true)
                }
                if (!this.action.isCopy && item.fieldName == 'returnPostStatus') {
                  childe.splice(i, 1)
                }
              })
            })
          }
          
          

          const result = this.getFormContentByOptionsChange(fieldList, fieldForm)
          this.fieldForm = result.fieldForm
          this.fieldRules = result.fieldRules
          this.sourcefieldRules = result.fieldRules

       //   console.log(this.fieldForm)
          // 审核信息
          this.initWkFlowData({
            params: { label: 1 },
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

      console.log(this.$refs);
  
      console.log(this.$refs.crmForm)
      const relatedContract = this.$refs.RelatedContract[0].$refs.relatedContract
      crmForm.validate(valid => {
        if (valid) {
          relatedContract.validate(valid => {
            if (valid) {
              const wkFlowResult = this.validateWkFlowData(this.wkFlowList)
              if (wkFlowResult.pass || isDraft) {
                const params = this.getSubmiteParams([].concat.apply([], this.fieldList), this.fieldForm)
                if (isDraft) {
                  params.entity.checkStatus = 5
                }
                if (wkFlowResult.data) {
                  params.examineFlowData = wkFlowResult.data
                }
                params.contract = []
                if (!isEmpty(this.relatedContractData)) {
                  this.relatedContractData.contract.forEach(item => {
                    item.relationId = item.contractId
                    // delete item.contractId
                  })
                  params.contract = this.relatedContractData.contract
                }
                const arrData = { isT: false }
                if (params.contract != []) {
                  params.contract.forEach(item => {
                    if (item.typesName == 3 || item.typesName == 4) {
                      if (item.price > item.money) {
                        arrData.isT = true
                      }
                    }
                  })
                }

                if (this.fieldForm.num !== this.fieldForm.num.replace(/\s*/g,"")){
                  this.$message.error(`合同编号不能包含空格`)
                  this.loading = false
                  return
                }
              
                if (params.product.length < 1) {
                  this.$message.error(`关联产品必填`)
                  this.loading = false
                  return
                }

                if (this.allPrice > this.fieldForm.preSurplusMoney) {
                  this.$message.error(`关联预付款金额不能大于预付款剩余金额`)
                  this.loading = false
                  return
                }

                if (this.action.type !== 'update' && (this.allPrice != this.fieldForm.product.totalPrice) && this.types == '执行合同') {
                  console.log(this.allPrice,this.fieldForm.product.totalPrice)
                  this.$message.error(`关联预付款合同金额之和必须 = 添加产品累计金额`)
                  this.loading = false
                  return
                }

                if (this.types !== '执行合同' && this.fieldForm.money != this.fieldForm.product.totalPrice) {
                  this.$message.error(`合同金额必须 = 添加产品累计金额`)
                  this.loading = false
                  return
                }

                if (!params.contract.length && this.types == '执行合同') {
                  this.$message.error(`请添加关联合同`)
                  this.loading = false
                  return
                }

                if (arrData.isT) {
                  this.$message.error(`关联预付款金额不能大于所选合同金额的金额`)
                  this.loading = false
                } else {
                  this.submiteParams(params)
                }
              } else {
                this.loading = false
                this.$message.error('请完善审批信息')
              }
            } else {
              this.loading = false
              // 提示第一个error
              this.getFormErrorMessage(crmForm)
              return false
            }
          })
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
      if (this.action.type == 'update' && !this.action.isCopy) {
        params.entity.contractId = this.action.id
        params.entity.batchId = this.action.batchId
      } else {
        if (this.batchId && this.action.type != 'save') {
          params.entity.batchId = this.batchId
        }
      }

      // 相关添加时候的多余提交信息
      if (
        this.action.relativeData &&
        Object.keys(this.action.relativeData).length
      ) {
        params = { ...params, ...this.action.relativeData }
      }

      crmContractSaveAPI(params)
        .then(res => {
          this.loading = false
          sessionStorage.removeItem('currentKey')
          if (this.action.isCopy) {
            this.$message.success('操作成功')
          } else {
            this.$message.success(
              this.action.type == 'update' ? '编辑成功' : '添加成功'
            )
          }

          this.close()

          // 保存成功
          this.$emit('save-success', {
            type: 'contract'
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
      if(this.action.type === 'update' && (field.field == 'money' || field.field == 'type' || field.field == 'fieldYdsegr')){
        // this.isPartShow = this.fieldForm.type != this.fieldOrigin.type || 
        //                   this.fieldForm.money != this.fieldOrigin.money ||
        //                   this.fieldForm.fieldYdsegr != this.fieldOrigin.fieldYdsegr

      }
      if (field.field == 'preMoney') {
        if (value) {
          this.inputAllMoney = value
        } else {
          this.inputAllMoney = 0
        }
      }
      if (field.field == 'types') {
       
        this.types = value
        //HYL
        // if (this.types) {
        //   crmContractQueryNumAPI({
        //     customerId: this.fieldForm.customerId.length > 0 ? this.fieldForm.customerId[0].customerId : null,
        //     types: this.types,
        //     currentKey: this.currentKey
        //   }).then(res => {
        //     this.batchId = res.data.batchId
        //     this.$set(this.fieldForm, 'num', res.data.generateNumber)
        //   }).catch(() => {})
        // }
        if (value == '执行合同') {
          console.log(field)
          this.relativeContacts = false
        } else {
          this.relativeContacts = true
        }
      }
      // 审批流逻辑
      this.debouncedGetWkFlowList(field.field, this.fieldForm)

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
      if (field.formType === 'customer') {
        let contractForCount = 0
        for (let mainIndex = 0; mainIndex < this.fieldList.length; mainIndex++) {
          const children = this.fieldList[mainIndex]
          for (let index = 0; index < children.length; index++) {
            const element = children[index]
            // 需要处理 需关联客户信息或客户下信息
            const handleFields = [
              'businessId',
              'contactsId',
              'companyUserId'
            ]

            // 添加请求关联
            const addRelation = ['businessId', 'contactsId']

            // 需要disabled
            const addDisabled = ['businessId', 'contactsId']

            // 复制
            const getValueObj = {
              contactsId: data => {
                if (!data.contactsId) {
                  return []
                }
                return [
                  {
                    name: data.contactsName || '',
                    contactsId: data.contactsId
                  }
                ]
              },
              companyUserId: data => {
                if (!data.ownerUserId) {
                  return []
                }
                return [
                  {
                    realname: data.ownerUserName || '',
                    userId: data.ownerUserId
                  }
                ]
              }
            }

            if (data.value.length > 0) {
              this.$set(this.fieldForm, 'contactsEmail', data.value[0].contactsEmail)
              this.$set(this.fieldForm, 'contactsTelephone', data.value[0].contactsTelephone)
            } else {
              this.$set(this.fieldForm, 'contactsEmail', '')
              this.$set(this.fieldForm, 'contactsTelephone', '')
            }

            if (handleFields.includes(element.field)) {
              if (data.value.length > 0) {
                element.disabled = false

                // 增加关联信息
                const customerItem = data.value[0]
                if (addRelation.includes(element.field)) {
                  customerItem['moduleType'] = 'customer'
                  element['relation'] = customerItem
                }

                // 填充值
                if (getValueObj[element.field]) {
                  this.fieldForm[element.field] = getValueObj[element.field](customerItem)
                } else {
                  this.fieldForm[element.field] = []
                }
              } else {
                // 禁用
                // element.disabled = !!addDisabled.includes(element.field)

                if (addRelation.includes(element.field)) {
                  element['relation'] = {}
                }

                this.fieldForm[element.field] = []
              }

              contractForCount++
              if (contractForCount == handleFields.length) {
                break
              }
            }
          }
        }

        // 重置产品信息
        this.fieldForm.product = {
          product: [],
          totalPrice: '',
          discountRate: ''
        }
        this.fieldForm.money = ''
        this.debouncedGetWkFlowList('money', this.fieldForm)
      } else if (field.formType === 'business') {
      //  console.log(data, field ,"data,field")

        if (data.value.length > 0) {
          this.$set(this.fieldForm, 'contactsTelephone', data.value[0].customerPhone)
          this.$set(this.fieldForm, 'contactsEmail', data.value[0].contactsEmail)
          this.$set(this.fieldForm, 'customerUnit', data.value[0].customerUnit)
          this.$set(this.fieldForm, 'productLine', data.value[0].productLine)
          this.$set(this.fieldForm, 'productType', data.value[0].productType)
          this.$set(this.fieldForm, 'region', data.value[0].region)
          this.$set(this.fieldForm, 'customerId', [{
            customerId: data.value[0].customerId,
            customerName: data.value[0].customerName
          }])
          if (this.types) {
            crmContractQueryNumAPI({
              customerId: data.value[0].customerId,
              types: this.types,
              currentKey: this.currentKey
            }).then(res => {
              this.batchId = res.data.batchId
              // console.log(this.batchId,"ths.batchId")
              //this.$set(this.fieldForm, 'num', res.data.generateNumber)
            }).catch(() => {})
          }
          this.getBusinessProduct(data.value[0].businessId).then(resData => {
            const businessData = resData || {}
            this.fieldForm.product = {
              product: businessData.list,
              totalPrice: businessData.money,
              discountRate: businessData.discountRate
            }
            // this.fieldForm.money = businessData.money || ''
            this.debouncedGetWkFlowList('money', this.fieldForm)
          }).catch(() => {})
        }
      } else if (field.formType === 'product') {
        // this.fieldForm.money = data.value.totalPrice || ''
        this.debouncedGetWkFlowList('money', this.fieldForm)
      } else if (field.formType === 'contacts') {
        if (data.value.length > 0) {
          const conactsData = data.value[0]
          this.$set(this.fieldForm, 'contactsEmail', conactsData.email)
          this.$set(this.fieldForm, 'contactsTelephone', conactsData.telephone)
        } else {
          this.$set(this.fieldForm, 'contactsEmail', '')
          this.$set(this.fieldForm, 'contactsTelephone', '')
        }
      }
      this.$set(this.fieldForm, field.field, data.value)
      this.$refs.crmForm.validateField(field.field)
    },

    /**
     * 获取商机的产品信息进行填充
     */
    getBusinessProduct(businessId) {
      return new Promise((resolve, reject) => {
        crmBusinessProductAPI({
          businessId: businessId,
          pageType: 0
        })
          .then(res => {
            resolve(res.data)
          })
          .catch(err => {
            reject(err)
          })
      })
    },

    /**
     * 关闭
     */
    close() {
      this.$emit('close')
    },
    mounted(){
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
