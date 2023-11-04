<template>
    <div v-loading="loading" class="rc-cont">
      <template v-if="projectIndex">
        <div
          class="rc-head margin-top-base2">
          <el-button
            v-if="!isSeas && projectSave"
            icon="el-icon-plus"
            @click="createClick()">新建项目申请</el-button>
        </div>
        <el-table
          :data="list"
          :height="tableHeight"
          :cell-class-name="cellClassName"
          stripe
          @row-click="handleRowClick">
          <el-table-column
            v-for="(item, index) in fieldList"
            :key="index"
            :prop="item.prop"
            :label="item.label"
            show-overflow-tooltip>
            <template slot-scope="{ row, column }">
              <template v-if="item.prop == 'checkStatus'">
                <span :style="getStatusStyle(row.checkStatus)" class="status-mark" />
                <span>{{ getStatusName(row.checkStatus) }}</span>
              </template>
              <template
                v-else>
                {{ fieldFormatter(row, column) }}
              </template>
            </template>
          </el-table-column>
        </el-table>
      </template>
  
      <c-r-m-full-screen-detail
        :id="showFullId"
        :visible.sync="showFullDetail"
        :crm-type="showFullCrmType"
        @handle="detailHandle" />
  
      <c-r-m-all-create
        v-if="isCreate"
        :contractid="id"
        :crm-type="createCrmType"
        :action="createActionInfo"
        @save-success="saveSuccess"
        @close="isCreate=false" />
  
    </div>
  </template>
  
  <script type="text/javascript">
  import CRMAllCreate from './CRMAllCreate'

  import {
    crmReceivablesPlanDeleteAPI
  } from '@/api/crm/receivables'  

  import {
    crmReceivablesQueryProjectAPI   
  } from '@/api/crm/receivables' 
  import {
    crmInvoiceQueryProjectAPI   
  } from '@/api/crm/invoice' 
  /** 注意  需要删除接口 */
  import { objDeepCopy, getWkDateTime } from '@/utils'
  import CheckStatusMixin from '@/mixins/CheckStatusMixin'
  import { separator } from '@/filters/vueNumeralFilter/filters'
  import { getPermissionByKey } from '@/utils'
  import moment from 'moment'
  
  export default {
    name: 'RelativeReturnMoney', // 相关回款  可能再很多地方展示 放到客户管理目录下
  
    components: {
      CRMAllCreate,
      CRMFullScreenDetail: () => import('@/components/CRMFullScreenDetail')
    },
  
    mixins: [CheckStatusMixin],
  
    props: {
      /** 模块ID */
      id: [String, Number],
      /** 没有值就是全部类型 有值就是当个类型 */
      crmType: {
        type: String,
        default: ''
      },
      /** 是公海 默认是客户 */
      isSeas: {
        type: Boolean,
        default: false
      },
      /** 客户和 合同下 可新建 回款计划 */
      detail: {
        type: Object,
        default: () => {
          return {}
        }
      }
    },
  
    data() {
      return {
        loading: false,
        list: [],
        fieldList: [],
        tableHeight: '250px',
        showFullDetail: false,
        showFullCrmType: 'receivables',
        showFullId: '', // 查看全屏详情的 ID
        createCrmType: 'project', // 创建回款计划
        isCreate: false, // 新建回款回款
        palnList: [],
        // planFieldList: [],
        createActionInfo: {} // 新建回款计划的时候 在客户 合同下导入关联信息
      }
    },
  
    inject: ['rootTabs'],
  
    computed: {
      
      projectIndex() {
        return !!getPermissionByKey('crm.project.index')
      },
      projectSave() {
        return !!getPermissionByKey('crm.project.save')
      },
    },
  
    watch: {
      id(val) {
        this.list = []
        this.palnList = []
        this.getList()
        // this.getPlanList()
      },
  
      'rootTabs.currentName'(val) {
       
        if (val === 'RelativeProject') {
          this.getList(false)
        //   this.getPlanList(false)
        }
      }
    },
  
    mounted() {
    //   this.planFieldList = [
    //     { prop: 'num', width: '300', label: '期数' },
    //     { prop: 'customerName', width: '300', label: '客户联系人' },
    //     { prop: 'contractNum', width: '300', label: '合同编号' },
    //     { prop: 'money', width: '300', label: '计划回款金额' },
    //     { prop: 'returnDate', width: '300', label: '计划回款日期' },
    //     { prop: 'returnType', width: '300', label: '计划回款方式' },
    //     { prop: 'remind', width: '300', label: '提前几日提醒' },
    //     { prop: 'remark', width: '300', label: '备注' }
    //   ]
  
      //this.getPlanList()
  
      this.fieldList = [
        { prop: 'projectNum', width: '300', label: '申请编号' },
        { prop: 'type', width: '300', label: '类型' },
        { prop: 'contractNum', width: '300', label: '合同编号' },
        { prop: 'salespersonName', width: '300', label: '本项目销售人员' },
        
        { prop: 'customerName', width: '300', label: '客户联系人' },
        { prop: 'contractName', width: '300', label: '合同名称' },
        { prop: 'sampleBatchNum', width: '300', label: '样本批次号' },
        { prop: 'startMoney', width: '300', label: '启动金额' },
        { prop: 'proRecMoney', width: '300', label: '已回款金额' },

        
        { prop: 'receivedMoney', width: '300', label: '已回款(占用)金额' },
        { prop: 'ownStartTotal', width: '300', label: '销售个人已累计启动金额' },
        { prop: 'ownReleaseTotal', width: '300', label: '销售个人已累计交付金额' },
        { prop: 'proReleaseTotal', width: '300', label: '项目累计交付金额' },
        { prop: 'proStartTotal', width: '300', label: '项目累计启动金额' },
        { prop: 'isAheadStart', width: '300', label: '是否提前启动' },
        { prop: 'isAheadRelease', width: '300', label: '是否提前释放' },
        { prop: 'deliverMoney', width: '300', label: '交付金额' },

        { prop: 'signIsReturn', width: '300', label: '签章合同是否已返还' },
        { prop: 'releaseContent', width: '300', label: '释放内容' },
        { prop: 'cusCompany', width: '300', label: '启动项目类型' },
        { prop: 'deliverMoney', width: '300', label: '客户单位' },
        { prop: 'deliverMoney', width: '300', label: '交付金额' },

      ]
      this.getList()
    },
  
    methods: {
      /**
       * 回款计划列表
       */
    //   getPlanList(loading = true) {
    //     this.loading = loading
    //     const request = {
    //       customer: crmCustomerQueryReceivablesPlanAPI,
    //       contract: crmContractQueryReceivablesPlanAPI
    //     }[this.crmType]
    //     request(this.getParams())
    //       .then(res => {
    //         this.loading = false
    //         const list = res.data.list || []
    //         list.forEach(item => {
    //           item.returnDate = getWkDateTime(item.returnDate)
    //         })
    //         this.palnList = list
    //       })
    //       .catch(() => {
    //         this.loading = false
    //       })
    //   },
  
      /**
       * 项目启动列表
       */
      getList(loading = true) {
        this.loading = loading
        const request = {
        invoice: crmInvoiceQueryProjectAPI,
        receivables: crmReceivablesQueryProjectAPI
      }[this.crmType]
        request(this.getParams())
          .then(res => {
            this.loading = false
            this.list = res.data.list
          })
          .catch(() => {
            this.loading = false
          })
      },
  
      /**
       * 获取上传参数
       */
      getParams() {
        return { receivablesId: this.id, pageType: 0 }
    
      },
  
      /**
       * 当某一行被点击时会触发该事件
       */
      handleRowClick(row, column, event) {
        if (column.property == 'receivablesNum') {
          this.showFullId = row.receivablesId
          this.showFullCrmType = 'receivables'
          this.showFullDetail = true
        }
      },
  
      /**
       * 当某一行被点击时会触发该事件
       */
      handlePlanRowClick(row, column, event) {
        if (column.property == 'num') {
          this.showFullId = row.receivablesPlanId
          this.showFullCrmType = 'receivablesPlan'
          this.showFullDetail = true
        }
      },
  
      /**
       * 新建回款和回款计划
       */
      createClick() {
          this.createCrmType = 'project'
          this.isCreate = true
        // } 
      },
  
      /**
       * 新建成功
       */
      saveSuccess() {
        if (this.createCrmType == 'project') {
          this.$bus.emit('crm-tab-num-update')
          this.getList()
        } else {
          //this.getPlanList()
        }
      },
  
      /**
       * 编辑操作
       */
      handleFile(type, row, index) {
        console.log(type, row, index)
        if (type == 'edit') {
          this.createActionInfo = { type: 'update', id: row.receivablesPlanId, batchId: row.batchId }
          this.createCrmType = 'receivablesPlan'
          this.isCreate = true
        } else if (type == 'delete') {
          this.$confirm('您确定要删除吗?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          })
            .then(() => {
              crmReceivablesPlanDeleteAPI([row.receivablesPlanId])
                .then(res => {
                  this.palnList.splice(index, 1)
                  this.$message.success('删除成功')
                })
                .catch(() => {})
            })
            .catch(() => {})
        } else if (type == 'createReceivables') {
          this.createCrmType = 'receivables'
          this.createActionInfo = {
            type: 'relative',
            crmType: this.crmType,
            data: {
              customer: {
                customerName: row.customerName,
                customerId: row.customerId
              },
              contract: {
                contractNum: row.contractNum,
                contractId: row.contractId
              },
              receivablesPlanId: row.receivablesPlanId,
              returnTime: moment().format('YYYY-MM-DD'),
              money: row.money,
              returnType: row.returnType,
              remark: row.remark
            }
          }
          this.isCreate = true
        }
      },
  
      /**
       * 格式化字段
       */
      fieldFormatter(row, column) {
        // 如果需要格式化
        if (column.property == 'proRecMoney'
          || column.property == 'aStartMoney'
          || column.property == 'ownReleaseTotal'
          || column.property == 'ownStartTotal'
          || column.property == 'proStartTotal'
          || column.property == 'proReleasetotal'
          || column.property == 'deliverMoney'
          || column.property == 'receivedMoney'
          || column.property == 'startMoney'
          )  {
          return separator(row[column.property] || 0)
        }
        return row[column.property] === '' || row[column.property] === null ? '--' : row[column.property]
      },
  
      /**
       * @description: 状态颜色
       * @param {*} status
       * @return {*}
       */
      getStatusStyle(status) {
        return {
          backgroundColor: this.getStatusColor(status)
        }
      },
  
      /**
       * 通过回调控制class
       */
      cellClassName({ row, column, rowIndex, columnIndex }) {
        if (column.property === 'receivablesNum') {
          return 'can-visit--underline'
        } else {
          return ''
        }
      },
  
      /**
       * 通过回调控制class
       */
      planCellClassName({ row, column, rowIndex, columnIndex }) {
        if (column.property === 'num') {
          return 'can-visit--underline'
        } else {
          return ''
        }
      },
  
      /**
       * 详情操作
       */
      detailHandle(data) {
        if (data.type === 'delete') {
          this.getList()
          this.$nextTick(() => {
            this.$bus.emit('crm-tab-num-update')
          })
        } else {
          this.getList()
        }
      }
    }
  }
  </script>
  <style lang="scss" scoped>
  @import "../styles/relativecrm.scss";
  @import "../styles/table.scss";
  </style>
  