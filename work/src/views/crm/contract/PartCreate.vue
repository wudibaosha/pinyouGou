<template>
  <transition name="opacity-fade" @after-enter="afterEnter" style="height:100%">
    <div
      :style="{ 'background-color': 'rgba(23,43,77, 0.5)', 'padding': '40px 0', 'z-index': zIndex }"
      class="c-view create-view">
      <el-card
        v-loading="loading"
        :style="{ 'width': '900px','height': '100%', ...cardStyle}"
 
        class="create-view-content">
        
        <el-tooltip
          v-if="flowRemarks"
          :content="flowRemarks"
          effect="dark"
          placement="top">
          <i class="wk wk-help wk-help-tips" style="margin-left: 8px;" />
        </el-tooltip>
        <flexbox
          
          direction="column"
          align="stretch"
          style="position: relative; height: 100%;">
          <flexbox class="xr-create__header">
            <div v-if="!$slots.title" class="title">{{ title }}<slot name="title-append" /></div>
            <slot name="title" />
            <i
              class="el-icon-close close"
              @click="close" />
          </flexbox>
          <div class="xr-create__body">

            <el-tabs v-model="editableTabsValue" type="card" editable @edit="handleTabsEdit" @tab-click="tabClick">
              <el-tab-pane
                :key="item.name"
                v-for="(item, index) in editableTabs"
                :label="item.title"
                :name="item.name"
              >
                <div  class="scroll-con_box">
                <div>
                  <create-sections title="基本信息">
                    <el-form
                      :ref="'crmForm'+index"
                      :model="fieldFormList[curIndex]"
                      :rules="fieldRules[curIndex]"
                      :validate-on-rule-change="false"
                      class="wk-form"
                      label-position="top">
                      <wk-form-items
                        v-for="(children, index) in fieldList"
                        :key="index"
                        :field-from="fieldFormList[curIndex]"
                        :field-list="children"
                        @change="formChange">


                        <template slot-scope="{ data }">
                          <crm-relative-cell
                          
                            v-if="data && data.formType == 'customer'"
                            :value="fieldFormList[curIndex][data.field]"
                            :disabled="data.disabled"
                            relative-type="customer"
                            @value-change="otherChange($event, data)"
                          />
                          <crm-relative-cell
                            v-if="data && (data.formType == 'business' || data.formType == 'contacts')"
                            :value="fieldFormList[curIndex][data.field]"
                            :disabled="data.disabled"
                            :relation="data.relation"
                            :relative-type="data.formType"
                            is-or-contract="0"
                            @value-change="otherChange($event, data)"
                          />
                          <xh-product
                            v-if="data && data.formType == 'product'"
                            :value="fieldFormList[curIndex][data.field]"
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
                </div>
              </div>
              </el-tab-pane>
            </el-tabs>

            

          </div>
          <div class="xr-create__footer">
            <slot name="footer-left" />
            <el-button
              v-if="showConfirm"
              :disabled="confirmDisabled"
              type="primary"
              @click.native="debouncedSaveField(false)">提交审核</el-button>
            
            <el-button
              slot="footer"
              type="primary"
              plain
              @click.native="debouncedSaveField(true)">保存草稿</el-button>
            <el-button
              v-if="showCancel"
              @click.native="close">取消</el-button>
          </div>
        </flexbox>
      </el-card>
    </div>
  </transition>
</template>
<script type="text/javascript">
import { filedGetFieldAPI } from '@/api/crm/common'
import { crmContractSaveAPI, crmContractQueryNumAPI } from '@/api/crm/contract'
import { crmBusinessProductAPI } from '@/api/crm/business'

import XrCreate from '@/components/XrCreate'
import CreateSections from '@/components/CreateSections'
import {
  CrmRelativeCell
} from '@/components/CreateCom'
import WkApprovalFlowApply from '@/components/Examine/WkApprovalFlowApply'
import WkApprovalFlowApplyMixin from '@/components/Examine/mixins/WkApprovalFlowApply'
import RelatedContract from './component/RelatedContract'
import WkFormItems from '@/components/NewCom/WkForm/WkFormItems'
import crmTypeModel from '@/views/crm/model/crmTypeModel'
import CustomFieldsMixin from '@/mixins/CustomFields'
import { debounce } from 'throttle-debounce'
import { objDeepCopy, guid } from '@/utils'
import { getMaxIndex } from '@/utils/index'
import { isEmpty } from '@/utils/types'
import { RFC_2822 } from 'vue-moment'
import { selectOptions } from '@/components/ApprovalFlow/conditioModel'

export default {
  name: 'CreateView', // 所有新建效果的view
  components: {

    WkFormItems,
    WkApprovalFlowApply,
    RelatedContract,
    CreateSections,
    CrmRelativeCell,
    XhProduct: () => import('../product/components/XhProduct'),
  },
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
    },
    bodyStyle: {
      type: Object,
      default: () => {
        return {}
      }
    },
    cardStyle: {
      type: Object,
      default: () => {
        return {}
      }
    },
  },
  mixins: [CustomFieldsMixin, WkApprovalFlowApplyMixin],
  data() {
    return {
      originContMoney: undefined,
      loading: false,
      baseFields: [],
      fieldList: [],
      fieldRules: [],
      otherfieldRules: {},
      relatedContractData: [],
      allContractMoeny: [],
      allData: {},
      relativeContacts: true,
      types: [],
      batchId: '',
      // 审批信息
      flowRemarks: '',
      wkFlowList: null, // 有值有审批流
      currentKey: '', // 随机数
      allPrice: '',
      fieldOrigin: {},
      tabBox: [],
      
      showCancel: true,
      flowRemarks:'',
      confirmDisabled: false,
      zIndex: getMaxIndex(),
      loadingObj: null,
      fieldFormList: [],
      fieldForm: {},


      editableTabsValue: '1',
      editableTabs: [{
        title: '合同',
        name: '1',
        
      }],
      tabIndex: 1,
      curIndex: 0
    }
  },
  computed: {
    title() {
      if (this.action.title) {
        return this.action.title
      }
      return this.action.type === 'update' ? '编辑合同' : '新建合同'
    },
  },
  created() {
    if (sessionStorage.getItem('currentKey')) {
      this.currentKey = sessionStorage.getItem('currentKey')
    } else {
      this.currentKey = guid()
      sessionStorage.setItem('currentKey', this.currentKey)
    }
    this.debouncedSaveField = debounce(300, this.mainSaveClick)
    this.getField()
  },
  watch: {
    types(val) {
      this.$nextTick(() => {
        // 清除表单验证change引起的报红
        this.$refs['crmForm'+this.curIndex][0].clearValidate()
      })
      if (val == '执行合同') {
        this.fieldRules[this.curIndex] = {}
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
        const result = this.getFormContentByOptionsChange(this.fieldList, this.fieldFormList[this.curIndex])
        this.fieldRules[this.curIndex] = result.fieldRules
      } else {
        this.fieldRules[this.curIndex] = this.sourcefieldRules
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
  mounted() {},
  methods: {
    mainSaveClick() {
      for(let i = 0; i < this.editableTabs.length; i++){
        this.$nextTick(() => {
          this.saveClick(i)
        })
      }
    },

    tabClick(tab) {
      
      this.curIndex = tab.index
    
      if (this.fieldFormList[this.curIndex] == undefined){
        this.getField()
      }
      let tabs = this.editableTabs;
      // let cumulateMoney = 0;
      
      // for(let i = 0; i < this.curIndex; i++ ) {
        
      //   cumulateMoney = cumulateMoney+this.fieldFormList[i].money
        
      // }
      // console.log(this.fieldFormList[this.curIndex])
      // this.fieldFormList[this.curIndex].money = this.originContMoney - cumulateMoney
     
      console.log('curIndex: ',this.curIndex, 'fieldFormList',this.fieldFormList)
      
      
    },
    checkInfo(val) {
      this.relatedContractData = val
      if (this.action.type === 'update') return

      this.allContractMoeny[this.curIndex] = 0
      const dataInfo = val || {}
     
      if (isEmpty(dataInfo)) {
        this.itemsForEach(this.fieldList, fieldItem => {
          if (fieldItem.fieldName == 'preMoney') {
            this.$set(this.fieldFormList[this.curIndex], 'preMoney', 0)
          } else if (fieldItem.fieldName == 'preSurplusMoney') {
            this.$set(this.fieldFormList[this.curIndex], 'preSurplusMoney', 0)
          } else if (fieldItem.fieldName == 'implementMoney') {
            this.$set(this.fieldFormList[this.curIndex], 'implementMoney', 0)
          }
        })
        return
      }
      // 所有合同总金额
      dataInfo.contract.forEach(item => {
        this.allContractMoeny[this.curIndex] += item.money
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

      if (this.allPrice > this.fieldFormList[this.curIndex].preSurplusMoney) {
        this.$message.error(`关联预付款金额不能大于预付款剩余金额`)
      }

      // 合同金额等于关联预付款合同金额之和
      if (this.types[this.curIndex] == '执行合同') {
        this.$set(this.fieldFormList[this.curIndex], 'money', this.allPrice)
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
          this.$set(this.fieldFormList[this.curIndex], 'preMoney', middleMoney)
        } else if (fieldItem.fieldName == 'preSurplusMoney') {
          this.$set(this.fieldFormList[this.curIndex], 'preSurplusMoney', middleMoney - this.allContractMoeny[this.curIndex])
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
          this.$set(this.fieldFormList[this.curIndex], 'implementMoney', executeMoney)
        }
      })
    },
    close() {
      this.$emit('close2')
    },
    afterEnter() {
      this.$emit('afterEnter')
    },
    showConfirm() {

    },

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
          
          const baseFields = []
          const fieldList = []
          const fieldForm = {}
          list.forEach(children => {
            
            const fields = []
            children.forEach(item => {
         
              const temp = this.getFormItemDefaultProperty(item)
              // console.log(temp)
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

              
              
              // 合同类型执行合同时可添加关联合同
              if (this.action.type == 'update' && temp.fieldName == 'types' && temp.value == '执行合同') {
                this.relativeContacts = false
              }

              if (temp.fieldName == 'contractRelation') {
               
                if (temp.value.contractRelation != []) {
                  console.log(temp.value.contractRelation)
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
                  
                    this.$nextTick(function(){
                      fieldForm[temp.field] = this.getItemValue(item, this.action.data, this.action.type)
              
                    })
                   
                  console.log(fieldForm)
                  
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
               
              // 复制合同时，不复制自定义编号类型的字段
              
              if (temp.formType === 'serial_number') {
                fieldForm[temp.field] = null
              }

              if (temp.formType === 'file') {
                
                fieldForm[temp.field] = []
              }

             
            
              fields.push(temp)
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
    
          fieldList.forEach((childe, index) => {
              childe.forEach((item, i) => {
                if (!this.action.isCopy && item.fieldName == 'num') {
                  //this.$set(this.fieldList[index][i], 'disabled', true)
                }
                if (!this.action.isCopy && item.fieldName == 'returnPostStatus') {
                  childe.splice(i, 1)
                }
              })
            })
          }
          
          
          
          const result = this.getFormContentByOptionsChange(fieldList, fieldForm)
          
          //把原合同金额存起来，后面动态计算使用
          this.originContMoney = result.fieldForm.money
        
     
          // this.fieldFormList[this.curIndex] = result.fieldForm
          // this.fieldRules[this.curIndex] = result.fieldRules
          this.sourcefieldRules = result.fieldRules
          this.$set(this.fieldFormList, this.curIndex, result.fieldForm);
          this.$set(this.fieldRules, this.curIndex, result.fieldRules);
        //  this.$set(this, 'sourcefieldRules', result.fieldRules);


          let cumulateMoney = 0;
          let tabs = this.editableTabs;
          for(let i = 0; i < tabs.length; i++ ) {
            if(i != this.curIndex){
            
              cumulateMoney = cumulateMoney + this.fieldFormList[i].money
        
            }
           
          }
         
          this.fieldFormList[this.curIndex].money = this.originContMoney - cumulateMoney

         // console.log(this.fieldForm)
          // 审核信息
          this.initWkFlowData({
            params: { label: 1 },
            fieldForm: this.fieldFormList[this.curIndex]
          }, (res) => {
            this.wkFlowList = res.list
            this.flowRemarks = res.resData ? res.resData.remarks : ''
          })
          this.loading = false
        })
        .catch(() => {
          //this.loading = false
        })
    },

    formChange(field, index, value, valueList) {
      
      if (field.field == 'preMoney') {
        if (value) {
          this.inputAllMoney = value
        } else {
          this.inputAllMoney = 0
        }
      }
      if (field.field == 'types') {
       
        this.types[this.curIndex] = value
        if (value == '执行合同') {
          this.relativeContacts = false
        } else {
          this.relativeContacts = true
        }
      }
      // 审批流逻辑
      this.debouncedGetWkFlowList(field.field, this.fieldFormList[this.curIndex])

      if ([
        'select',
        'checkbox'
      ].includes(field.formType) &&
          field.remark === 'options_type' &&
          field.optionsData) {
    
        const { fieldForm, fieldRules } = this.getFormContentByOptionsChange(this.fieldList, this.fieldFormList[this.curIndex])
        this.fieldFormList[this.curIndex] = fieldForm
        this.fieldRules[this.curIndex] = fieldRules
      }
    },

    handleTabsEdit(targetName, action) {
      console.log('name', targetName)
      if (action === 'add') {
        let newTabName = ++this.tabIndex + '';
        this.editableTabs.push({
          title: '合同',
          name: newTabName,
          // content: 'New Tab content'
        });
        //this.curIndex = this.tabIndex-1
        
        console.log('curIndex: ',this.curIndex)
       // this.editableTabsValue = newTabName;
      }
      if (action === 'remove') {
        let tabs = this.editableTabs;
        let activeName = this.editableTabsValue;
     
        if (activeName === targetName) {
          tabs.forEach((tab, index) => {
            if (tab.name === targetName) {
              this.fieldFormList.splice(index,1)
              this.curIndex--;
              let nextTab = tabs[index + 1] || tabs[index - 1];
              console.log(nextTab)
              if (nextTab) {
                
                activeName = nextTab.name;
              }
            }
          });
        }else{
          tabs.forEach((tab, index) => {
            if (tab.name === targetName) {
              this.fieldFormList.splice(index,1)
              let removeIndex = index
              if( removeIndex < this.curIndex){
                this.curIndex--;
              }
            }
          })
        }
        
        
        this.editableTabsValue = activeName;
        this.editableTabs = tabs.filter(tab => tab.name !== targetName);
        
      
        console.log('curIndex: ',this.curIndex, 'fieldFormList',this.fieldFormList)
      }
    },

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
              this.$set(this.fieldFormList[this.curIndex], 'contactsEmail', data.value[0].contactsEmail)
              this.$set(this.fieldFormList[this.curIndex], 'contactsTelephone', data.value[0].contactsTelephone)
            } else {
              this.$set(this.fieldFormList[this.curIndex], 'contactsEmail', '')
              this.$set(this.fieldFormList[this.curIndex], 'contactsTelephone', '')
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
                  this.fieldFormList[this.curIndex][element.field] = getValueObj[element.field](customerItem)
                } else {
                  this.fieldFormList[this.curIndex][element.field] = []
                }
              } else {
                // 禁用
                // element.disabled = !!addDisabled.includes(element.field)

                if (addRelation.includes(element.field)) {
                  element['relation'] = {}
                }

                this.fieldFormList[this.curIndex][element.field] = []
              }

              contractForCount++
              if (contractForCount == handleFields.length) {
                break
              }
            }
          }
        }

        // 重置产品信息
        this.fieldFormList[this.curIndex].product = {
          product: [],
          totalPrice: '',
          discountRate: ''
        }
        this.fieldFormList[this.curIndex].money = ''
        this.debouncedGetWkFlowList('money', this.fieldFormList[this.curIndex])
      } else if (field.formType === 'business') {
        console.log(data, field)
        if (data.value.length > 0) {
          this.$set(this.fieldFormList[this.curIndex], 'contactsTelephone', data.value[0].customerPhone)
          this.$set(this.fieldFormList[this.curIndex], 'contactsEmail', data.value[0].contactsEmail)
          this.$set(this.fieldFormList[this.curIndex], 'customerUnit', data.value[0].customerUnit)
          this.$set(this.fieldFormList[this.curIndex], 'productLine', data.value[0].productLine)
          this.$set(this.fieldFormList[this.curIndex], 'productType', data.value[0].productType)
          this.$set(this.fieldFormList[this.curIndex], 'region', data.value[0].region)
          this.$set(this.fieldFormList[this.curIndex], 'customerId', [{
            customerId: data.value[0].customerId,
            customerName: data.value[0].customerName
          }])
          if (this.types[this.curIndex]) {
            crmContractQueryNumAPI({
              customerId: data.value[0].customerId,
              types: this.types[this.curIndex],
              currentKey: this.currentKey
            }).then(res => {
              console.log(res.data)
              this.batchId = res.data.batchId
              //this.$set(this.fieldForm, 'num', res.data.generateNumber)
            }).catch(() => {})
          }
          this.getBusinessProduct(data.value[0].businessId).then(resData => {
            const businessData = resData || {}
            this.fieldFormList[this.curIndex].product = {
              product: businessData.list,
              totalPrice: businessData.money,
              discountRate: businessData.discountRate
            }
            // this.fieldForm.money = businessData.money || ''
            this.debouncedGetWkFlowList('money', this.fieldFormList[this.curIndex])
          }).catch(() => {})
        }
      } else if (field.formType === 'product') {
        // this.fieldForm.money = data.value.totalPrice || ''
        this.debouncedGetWkFlowList('money', this.fieldFormList[this.curIndex])
      } else if (field.formType === 'contacts') {
        if (data.value.length > 0) {
          const conactsData = data.value[0]
          this.$set(this.fieldFormList[this.curIndex], 'contactsEmail', conactsData.email)
          this.$set(this.fieldFormList[this.curIndex], 'contactsTelephone', conactsData.telephone)
        } else {
          this.$set(this.fieldFormList[this.curIndex], 'contactsEmail', '')
          this.$set(this.fieldFormList[this.curIndex], 'contactsTelephone', '')
        }
      }
      this.$set(this.fieldFormList[this.curIndex], field.field, data.value)
      
      this.$refs['crmForm'+this.curIndex][0].validateField(field.field)
    },

    submiteParams(params) {
      if (this.batchId && this.action.type != 'save') {
        params.entity.batchId = this.batchId
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

    saveClick(index, isDraft = false) {
      this.loading = true
      const crmForm = this.$refs['crmForm'+index][0]
      console.log(this.$refs)
      const relatedContract = this.$refs.RelatedContract[0].$refs.relatedContract
      crmForm.validate(valid => {
        if (valid) {
          relatedContract.validate(valid => {
            if (valid) {
              const wkFlowResult = this.validateWkFlowData(this.wkFlowList)
              if (wkFlowResult.pass || isDraft) {
                const params = this.getSubmiteParams([].concat.apply([], this.fieldList), this.fieldFormList[index])
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

                
                if (this.fieldFormList[index].num !== this.fieldFormList[index].num.replace(/\s*/g,"")){
                  this.$message.error(`合同编号不能包含空格`)
                  this.loading = false
                  return
                }
                
               
              
                if (params.product.length < 1) {
                  this.$message.error(`关联产品必填`)
                  this.loading = false
                  return
                }

                if (this.allPrice[index] > this.fieldFormList[index].preSurplusMoney) {
                  this.$message.error(`关联预付款金额不能大于预付款剩余金额`)
                  this.loading = false
                  return
                }

                // if (this.action.type !== 'update' && (this.allPrice != this.fieldFormList[count].product.totalPrice) && this.types[count] == '执行合同') {
                //   this.$message.error(`关联预付款合同金额之和必须 = 添加产品累计金额`)
                //   this.loading = false
                //   return
                // }

                // if (this.types[count] !== '执行合同' && this.fieldFormList[count].money != this.fieldFormList[count].product.totalPrice) {
                //   this.$message.error(`合同金额必须 = 添加产品累计金额`)
                //   this.loading = false
                //   return
                // }

                if (!params.contract.length && this.types[index] == '执行合同') {
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
  }
}
</script>
<style lang="scss" scoped>
  .opacity-fade-enter-active,
  .opacity-fade-leave-active {
    transition: all 0.2s;
  }

  .opacity-fade-enter,
  .opacity-fade-leave-to {
    opacity: 0;
  }

  /** 容器布局 */
  .c-view {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
  .xr-create{
    position: relative;
  height: 100%;
  }
  .create-view-content {
    position: relative;
    height: 100%;
    margin: 0 auto;

    /deep/ .el-card__body {
      padding: 20px 30px;
      height: 100%;
    }
  }
  /deep/ .el-tabs__content{
    height: 92%;
    position: relative;
    flex: 1;
    overflow-x: hidden;
    overflow-y: auto;
  }
  .close {
    display: block;
    padding: 10px;
    margin-right: -10px;
    font-size: 24px;
    color: $--color-n500;
    cursor: pointer;
  }

  .title {
    flex: 1;
    font-size: 20px;
    font-weight: bold;
  }
  .scroll-con_box{
    position: relative;
    flex: 1;
    overflow-x: hidden;
    overflow-y: auto;
    
  }
  .xr-create__body {
    position: relative;
    height: 88%;
  }
  
  /deep/ .el-tabs {
    height: 100%;
  }
  .xr-create__footer {
    position: relative;
    padding: 20px 20px 0;
    text-align: right;
    bottom: 0;
  }
</style>
