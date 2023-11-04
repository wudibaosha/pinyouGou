import {
  crmSceneIndexAPI,
  crmSceneSetIndexAPI,
  crmSceneSortAPI,
  crmSceneDefaultsAPI,
  crmSceneDeleteAPI,
  crmSceneSaveAPI,
  crmSceneUpdateAPI,

  filedGetTableFieldAPI,
  filedGetPoolTableFieldAPI,
  filterIndexfieldsAPI,

  crmFieldColumnWidthAPI,
  crmPoolFieldColumnWidthAPI,
  crmFieldSetIsLockAPI,
  crmSearchExpertSaveAPI
} from '@/api/crm/common'

import {
  crmCustomerIndexAPI,
  crmCustomerPoolListAPI,
  crmCustomerExcelAllExportAPI,
  crmCustomerPoolQueryPoolFieldAPI,
  crmCustomerPoolExcelAllExport,
  crmCustomerStarAPI,
  crmCustomerPoolSetIsLockAPI,
  crmCustomerPoolSaveSearchExpertAPI
} from '@/api/crm/customer'
import {
  crmAppletIndexAPI,
  crmWeixinLeadsExportLeadsAPI
} from '@/api/crm/applet'
import {
  crmLeadsIndexAPI,
  crmLeadsExcelAllExportAPI,
  crmLeadsStarAPI
} from '@/api/crm/leads'
import {
  crmContactsIndexAPI,
  crmContactsExcelAllExportAPI,
  crmContactsStarAPI
} from '@/api/crm/contacts'
import {
  crmSettlementIndexAPI,
  crmSettlementExcelAllExportAPI
} from '@/api/crm/settlement'
import {
  crmBusinessIndexAPI,
  crmBusinessExcelAllExportAPI,
  crmBusinessStarAPI
} from '@/api/crm/business'
import {
  crmContractIndexAPI,
  crmContractExcelAllExportAPI
} from '@/api/crm/contract'
import {
  crmProductIndexAPI,
  crmProductExcelAllExportAPI,
  crmGetProductTypeAPI
} from '@/api/crm/product'
import {
  crmReceivablesIndexAPI,
  crmReceivablesExcelAllExportAPI
} from '@/api/crm/receivables'
import {
  crmReceivablesPlanIndexAPI,
  crmReceivablesPlanExcelAllExportAPI
} from '@/api/crm/receivablesPlan'
import {
  crmMarketingIndexAPI
} from '@/api/crm/marketing'
import {
  crmReturnVisitIndexAPI
} from '@/api/crm/visit'
import {
  crmInvoiceIndexAPI,
  crmInvoiceExcelAllExportAPI,
  crmReceivablesAPI
} from '@/api/crm/invoice'
import {
  crmProjectIndexAPI
} from '@/api/crm/project'
import {
  crmInvoiceInfoExcelAllExportAPI,
} from '@/api/crm/unit'
import { PcCustomKeys, adminConfigSetCustomSettingAPI, adminConfigQueryCustomSettingAPI } from '@/api/admin/config'

import WkEmpty from '@/components/WkEmpty'
import WkPageHeader from '@/components/Page/WkPageHeader'
import WkTableHeader from '@/components/Page/WkTableHeader'
import FieldSet from '../components/FieldSet'
import WkFieldView from '@/components/NewCom/WkForm/WkFieldView'

import {
  mapGetters
} from 'vuex'
import crmTypeModel from '@/views/crm/model/crmTypeModel'
import Lockr from 'lockr'
// import { Loading } from 'element-ui'
import CheckStatusMixin from '@/mixins/CheckStatusMixin'
import AdvancedFilterMixin from '@/mixins/AdvancedFilter'
import { objDeepCopy, toUnderScoreCase } from '@/utils'
import { getFormFieldShowName } from '@/components/NewCom/WkForm/utils'
import merge from '@/utils/merge'
import { isArray, isObject } from '@/utils/types'
import { getCrmHelpObj } from '../utils'
import { debounce } from 'throttle-debounce'
import EventsObj from '../model/events'
import { Row } from 'element-ui'

import {
  crmUnitIndexAPI
} from '@/api/crm/unit'

const DefaultFilterProps = {
  isSelect: false, // 仅选择数据用  禁用数据刷新重置勾选
  showScene: true,
  ignoreFilterFields: [], // 仅用于弹窗选择，高级筛选内将不展示
  showSearch: true,
  showModuleName: true, //  左侧布局
  selectionHandle: true, // 勾选不操作
  radio: false, // 是否单选
  // 搜索
  // 请求和参数
  request: null,
  searchList: null, // 仅用于弹窗选择，叠加一部分筛选条件
  params: null
}

// 高级筛选特殊字段映射
const filterFieldMap = {
  createUserName: 'createUserId', // 创建人
  ownerUserName: 'ownerUserId', // 负责人
  ownerDeptName: 'ownerDeptId', // 所属部门
  customerName: 'customerId', // 客户
  superiorCustomerName: 'superiorCustomerId', // 上级客户
  businessName: 'businessId', // 商机
  contactsName: 'contactsId', // 客户签约人
  parentContactsName: 'parentContactsId', // 直属上级
  companyUserName: 'companyUserId', // 公司签约人
  contractNum: 'contractId', // 合同编号
  planNum: 'receivablesPlanId', // 期数
  categoryName: 'categoryId' // 产品类型
}

export default {
  components: {
    WkPageHeader,
    WkTableHeader,
    FieldSet,
    WkEmpty,
    WkFieldView
  },

  // 用于弹框形式下的配置和数据传入
  props: {
    // 筛选配置
    props: {
      type: Object,
      default: null
    },
    // 筛选选择的数据
    selectedData: Array,
    isRelatedContract: {
      type: Boolean,
      default: false
    },
    currentCrmType: {
      type: String,
      default: ''
    },
    // 新建合同选择商机名称和新建回款选择发票做判断
    isOrContract: [String, Number],
    isRelative: [Number, Boolean] // 判断是否是从回款和发票关联进入合同列表 1为回款, 2为发票
  },

  data() {
    return {
      loading: false, // 加载动画
      tableHeight: 200, // 表的高度
      tableStyleObj: {
        init: false, // 通过网络请求赋值之后的 tableStyleObj， watch 方法执行更新
        stripe: true, // 斑马纹
        bottomBorderShow: true,
        rightBorderShow: true
      },
      // wk-table-header 配置
      tableHeaderProps: {},
      // 列数据
      rowHeight: 44, // 行高
      list: [],
      fieldList: [],
      sortData: {}, // 字段排序
      currentPage: 1,
      pageSize: Lockr.get('crmPageSizes') || 15,
      pageSizes: [15, 30, 60, 100],
      total: 0,
      search: '', // 搜索内容

      // 控制详情展示
      rowID: '', // 行信息
      rowType: '', // 详情类型
      showDview: false,

      // 筛选
      filterObj: [], // 筛选确定数据
      sceneId: '', // 场景筛选ID
      sceneList: [],
      sceneData: {}, // 场景对象
      /** 勾选行 */
      selectionList: [], // 勾选数据 用于全局导出
      // 已经发请求 用于缓存区分(勾选逻辑)
      isRequested: false,
      rowIndex: 0, // 行索引
      // 忽略勾选数据change 避免触发chang事件
      ignoreSelectedChange: false,
      hasExaSelctedData: false, // 是否执行过复选
      // 勾选逻辑

      filterFieldList: [], // 高级筛选字段
      customConfig: {} // 当前模块的自定义配置 目前包含 tableStyleObj  filterConfig
    }
  },

  mixins: [CheckStatusMixin, AdvancedFilterMixin],

  computed: {
    ...mapGetters(['crm', 'userInfo']),
    config() {
      return merge({ ...DefaultFilterProps }, this.props || {})
    },

    saveAuth() {
      return this.$auth(`crm.${this.crmType}.save`)
    },

    /**
     * 列表权限
     */
    indexAuth() {
      const crmType = this.isSeas ? 'pool' : this.crmType
      return !!this.$auth(`crm.${crmType}.index`)
    },
    
    crmTableClass() {
      const arr = []
      if (this.config && this.config.radio) {
        arr.push('no-all-selection')
      }
      if (this.tableStyleObj && this.tableStyleObj.rightBorderShow === false) {
        arr.push('is-no-right-border-style')
      }
      if (this.tableStyleObj && this.tableStyleObj.bottomBorderShow === false) {
        arr.push('is-no-bottom-border-style')
      }
      arr.push('is-filter-table')
      return arr
    },

    // 用于 tableHeader 的入参，区分弹框状态下无值
    tableSelectionList() {
      if (this.config.isSelect) {
        return []
      }
      return this.selectionList
    }
  },
  watch: {
    // 呼叫中心逻辑
    showDview() {
      const callOutData = JSON.parse(localStorage.getItem('callOutData'))
      if (callOutData) {
        this.modelData = {
          modelId: callOutData.id,
          model: callOutData.type
        }
      }
    },

    // config 里面包含的都是弹框筛选逻辑
    'config.params': {
      handler() {
        if (this.indexAuth) {
          this.refreshList()
        }
      }
    },

    'config.otherHeight': {
      handler() {
        this.updateTableHeight()
      }
    },

    // props 包含的都是弹框筛选逻辑
    selectedData(newVal) {
      // 筛选默认值勾选
      if (newVal) {
        let valueEquals = true
        if (newVal.length !== this.selectionList.length) {
          valueEquals = false
        } else {
          for (let i = 0; i !== newVal.length; ++i) {
            if (newVal[i][`${this.crmType}Id`] !== this.selectionList[i][`${this.crmType}Id`]) {
              valueEquals = false
              break
            }
          }
        }

        if (!valueEquals) {
          this.hasExaSelctedData = false
          this.ignoreSelectedChange = true

          setTimeout(() => {
            this.setSelections(this.selectedData).then(() => {
              this.$nextTick(() => {
                this.ignoreSelectedChange = false
              })
            })
          }, 100)
        }
      }
    },

    // 表格样式对象
    tableStyleObj: {
      handler(newVal, oldVal) {
        if (oldVal && newVal && oldVal.init && newVal.init) {
          // 都含有init 为true 标识，是请求获取后的styleObj被修改
          this.updateTableStyle()
        }
      },
      deep: true
    }
  },
  /**
   * 增加高级筛选逻辑
   * 增加 props
   * showScene  控制场景是否展示
   * showSearch 控制搜索是否展示
   * request 自定义请求
   * params 自定义参数
   */
  created() {
    // 该方法里的 this.crmType data() 中不能获取
    this.tableHeaderProps = this.getBaseTableHeaderProps()

    this.debouncePostWidthChange = debounce(500, this.postWidthChange)
  },
  mounted() {
    window.onresize = () => {
      this.updateTableHeight()
    }

    // 获取当前模块的自定义配置
    if (this.indexAuth) {
      if (this.crmType === 'applet') { // 无场景
        this.getFieldList()
      } else if ( this.crmType === 'unit') { // 无场景 固定表头\
        this.getList()
      } else if (this.isSeas) { // 是公海的
        this.loading = true
        // 公海在公海列表文件进行请求动作
      } else {
        this.loading = true
        // 不展示场景，直接发送列表请求
        if (!this.config.showScene) {
          this.refreshList()
        } else {
          this.getSceneList()
        }
      }
      this.getCustomConfig()
    } else {
      // 没有权限更新一下高度
      this.updateTableHeight()
    }
  },

  methods: {
    /* ------------------------ 页面头部 ------------------------ */
    getDefaultHeaderHandes() {
      const moreHandles = []
      if (this.$auth(`crm.${this.crmType}.excelimport`)) {
        moreHandles.push({ command: 'enter', name: '导入', icon: 'wk wk-import' })
      }

      if (this.$auth(`crm.${this.crmType}.excelexport`)) {
        moreHandles.push({ command: 'out', name: '导出', icon: 'wk wk-export' })
      }

      return moreHandles
    },

    /**
     * @description: 头部更多按钮事件
     * @param {*}
     * @return {*}
     */
    pageHeaderCommand(command) {
      if (command == 'out') {
        
        this.exportInfos()
      } else if (command == 'enter') {
        this.importInfos()
      } else if (command == 'seasSet') { // 跳入公海配置
        this.$router.push('/manage/customer/customer')
      }
    },

    /**
     * 导出
     * @param {*} data
     */
    exportInfos() {
      const params = this.getBaseParams()

      let request
      // 公海的请求
      if (this.isSeas) {
        request = crmCustomerPoolExcelAllExport
      } else {
        request = {
          customer: crmCustomerExcelAllExportAPI,
          leads: crmLeadsExcelAllExportAPI,
          contacts: crmContactsExcelAllExportAPI,
          applet: crmWeixinLeadsExportLeadsAPI,
          business: crmBusinessExcelAllExportAPI,
          contract: crmContractExcelAllExportAPI,
          receivables: crmReceivablesExcelAllExportAPI,
          product: crmProductExcelAllExportAPI,
          invoice: crmInvoiceExcelAllExportAPI,
          receivablesPlan: crmReceivablesPlanExcelAllExportAPI,
          settlement: crmSettlementExcelAllExportAPI,
          unit: crmInvoiceInfoExcelAllExportAPI
        }[this.crmType]
      }
      this.$wkExport.export(this.crmType, {
        params: { search: params },
        isSeas: this.isSeas,
        poolId: this.poolId,
        request
      })
    },

    /**
      * @description: 导入信息
      * @param {*}
      * @return {*}
      */
    importInfos() {
      this.$wkImport.import(this.crmType, {
        ownerSelectShow: false, // 去除选择负责人逻辑
        poolSelectShow: this.isSeas,
        userInfo: this.userInfo
      })
    },

    /* ------------------------ 配置信息 ------------------------ */
    /**
     * @description: 获取基础的标头配置参数
     * @param {*}
     * @return {*}
     */
    getBaseTableHeaderProps() {
      // 帮助对象
      const helpObj = this.getHelpObj(this.crmType)

      // 是否展示场景
      let tabSetShow = false
      if (this.props) {
        tabSetShow = this.props.showScene
      } else {
        if (this.isSeas || ['marketing','unit', 'applet'].includes(this.crmType)) {
          tabSetShow = false
        } else {
          tabSetShow = true
        }
      }

      // 是否展示筛选
      let showFilterView = false
      if (['marketing','unit', 'applet'].includes(this.crmType)) {
        showFilterView = false
      } else if (this.isSeas) {
        showFilterView = !!this.poolId
      } else {
        showFilterView = true
      }

      return {
        props: {
          showFilterView: showFilterView, // 控制是否展示高级筛选
          showExportFields: false // 展示外漏布局
        },
        filterHeaderProps: {
          maxTabCount: this.config.isSelect ? 2 : 5,
          tabSetShow: tabSetShow,
          searchPlaceholder: {
            leads: '线索名称/手机/电话',
            customer: '客户联系人/手机/电话',
            contacts: '联系人姓名/手机/电话',
            product: '产品名称',
            business: '商机名称',
            contract: '客户联系人/合同编号/合同名称',
            receivables: '客户联系人/回款编号/合同编号',
            receivablesPlan: '客户联系人/合同编号',
            visit: '回访编号',
            invoice: '发票号码/客户联系人/合同编号',
            marketing: '活动名称',
            settlement: '搜索名称/手机/电话',
            unit: '客户单位/纳税人识别号',
            project: '执行合同编号'
          }[this.crmType]
        },
        filterFormProps: {
          showExport: true, // 控制是否展示外露按钮
          showSaveScene: !this.isSeas, // 控制是否展示保存场景
          help: helpObj ? {
            type: helpObj.type,
            id: helpObj.filterForm
          } : null,
          exportHelp: helpObj ? {
            type: helpObj.type,
            id: helpObj.filterFormExport
          } : null,
          saveRequest: this.isSeas ? crmCustomerPoolSaveSearchExpertAPI : crmSearchExpertSaveAPI,
          saveParams: this.isSeas ? {
            poolId: this.poolId
          } : {
            label: crmTypeModel[this.crmType]
          }
        },
        sceneSetProps: {
          // 场景列表请求
          indexRequest: crmSceneSetIndexAPI,
          indexParams: {
            type: crmTypeModel[this.crmType]
          },
          // 排序请求
          sortRequest: crmSceneSortAPI,
          sortParams: {
            type: crmTypeModel[this.crmType]
          },
          // 默认请求
          defaultsRequest: crmSceneDefaultsAPI,
          // defaultsParams: null,
          // 删除请求
          deleteRequest: crmSceneDeleteAPI,
          // deleteParams: null,
          // 字段列表请求
          fieldsIndexRequest: filterIndexfieldsAPI,
          fieldsIndexParams: {
            label: crmTypeModel[this.crmType]
          },
          // 帮助提示
          help: helpObj ? {
            type: helpObj.type,
            id: helpObj.sceneSet
          } : null
        },
        sceneCreateProps: {
          // 场景编辑请求
          updateRequest: crmSceneUpdateAPI,
          updateParams: { type: crmTypeModel[this.crmType] },
          // 场景新建请求
          saveRequest: crmSceneSaveAPI,
          saveParams: { type: crmTypeModel[this.crmType] },
          // 帮助提示
          help: helpObj ? {
            type: helpObj.type,
            id: helpObj.sceneCreate
          } : null
        }
      }
    },

    /**
     * @description: 获取操作事件
     * @param {*} array
     * @return {*}
     */
    getOperations(array) {
      const tempsHandles = []
      for (let index = 0; index < array.length; index++) {
        const type = array[index]
        if (this.getOperationsPermision(type)) {
          tempsHandles.push(EventsObj[type])
        }
      }
      return tempsHandles
    },

    /**
     * @description: 判断操作按钮权限
     * @param {*} type
     * @return {*}
     */
    getOperationsPermision(type) {
      if (!this.crm || !this.crm[this.crmType]) {
        return false
      }

      const auth = this.crm[this.crmType]
      if (type == 'transfer') {
        return this.sceneData.bydata == 'transform'
          ? false
          : auth.transfer
      } else if (type == 'transform') {
        return this.sceneData.bydata == 'transform'
          ? false
          : auth.transform
      } else if (type == 'export') {
        if (this.isSeas) {
          if (this.poolId) {
            return this.poolAuth.excelexport
          }
          return this.crm.pool && this.crm.pool.excelexport
        }
        return auth.excelexport
      } else if (type == 'delete') {
        if (this.isSeas) {
          if (this.poolId) {
            return this.poolAuth.delete
          }
          return this.crm.pool && this.crm.pool.delete
        }
        return auth.delete
      } else if (type == 'put_seas') {
        // 放入公海(客户)
        return auth.putinpool
      } else if (type == 'lock' || type == 'unlock') {
        // 锁定解锁(客户)
        return auth.lock
      } else if (type == 'add_user' || type == 'delete_user') {
        // 添加 移除团队成员
        return auth.teamsave
      } else if (type == 'alloc') {
        // 分配(公海)
        if (this.poolId) {
          return this.poolAuth.distribute
        }
        return this.crm.pool && this.crm.pool.distribute
      } else if (type == 'get') {
        // 领取(公海)
        if (this.poolId) {
          return this.poolAuth.receive
        }
        return this.crm.pool && this.crm.pool.receive
      } else if (type == 'start') {
        // 上架 下架(产品)
        for (let index = 0; index < this.selectionList.length; index++) {
          const element = this.selectionList[index]
          if (element.status == 1) {
            return false
          }
        }
        return auth.status
      } else if (type == 'disable') {
        // 上架 下架(产品)
        for (let index = 0; index < this.selectionList.length; index++) {
          const element = this.selectionList[index]
          if (element.status == 0) {
            return false
          }
        }
        return auth.status
      } else if (type == 'deal_status') {
        // 客户状态修改
        return auth.dealStatus
      } else if (type === 'transformLead') {
        return true
      } else if (type == 'state_start' || type == 'state_disable') {
        // 活动停用/启用
        return auth.updateStatus
      } else if (type == 'reset_invoice_status') {
        // 重置开票信息
        return auth.resetInvoiceStatus && this.selectionList.length == 1
      } else if (type == 'update') {
        // 编辑
        return auth.update && this.selectionList.length == 1
      }

      return true
    },

    /* ------------------------ 帮助信息 ------------------------ */
    /**
     * @description: 获取帮助信息
     * @param {*} crmType 模块
     * @param {*} type 具体类型 filterForm 不传 返回整个帮助对象
     * @return {*}
     */
    getHelpObj(module, type) {
      // 弹框形式展示时，不展示名称也就不展示帮助提示
      if (!this.config.showModuleName) {
        return null
      }
      return getCrmHelpObj(module, type, this.isSeas)
    },

    /* ------------------------ 列表数据 ------------------------ */
    /**
     * 场景数据
     */
    getSceneList() {
      
      crmSceneIndexAPI({
        type: crmTypeModel[this.crmType]
      })
        .then(res => {
          const resData = (res.data || []).map(item => {
            item.label = item.name
            item.value = item.sceneId !== null ? item.sceneId.toString() : ''
            return item
          })
          const defaultScenes = resData.filter(item => item.isDefault === 1)

          let currentScene = null
          if (defaultScenes && defaultScenes.length > 0) {
            currentScene = defaultScenes[0]
          } else if (resData.length > 0) {
            currentScene = resData[0]
          }

          if (currentScene) {
            currentScene.id = currentScene.sceneId ? currentScene.sceneId.toString() : ''
            currentScene.bydata = currentScene.bydata || ''
            this.sceneId = currentScene.id
            this.sceneData = currentScene // 场景的值未 bydata transform 不能转移和转化
            // this.$emit('scene', currentScene)
          }

          this.sceneList = resData

          this.refreshList()
        })
        .catch(() => {
          // this.$emit('scene', { id: '', name: '', bydata: '' })
        })
    },

    /**
     * 获取列表数据
     */
    getList() {
      
      this.loading = true
      const crmIndexRequest = this.getIndexRequest()
      const params = this.getBaseParams()
      console.log(params)
      params.page = this.currentPage
      params.limit = this.pageSize
      
      crmIndexRequest(params)
        .then(res => {
          // 需为true 才会触发客户列表和公海列表展示之后的刷新
          this.isRequested = true

          if (this.crmType === 'customer') {
            this.list = res.data.list.map(element => {
              element.show = false // 控制列表商机展示
              return element
            })
          } else {
            if (this.crmType === 'contract' ||
              this.crmType === 'invoice' ||
              this.crmType === 'receivables' ||
              this.crmType === 'receivablesPlan' ||
              this.crmType === 'business') {
              // 合同/回款列表展示金额信息
                this.moneyData = res.data.extraData ? res.data.extraData.money || {} : {}
              }
              const list = res.data.list
              // list[0].relationContractIdsName = "写实测试"
           
            if (this.crmType == 'contract') {
              if (this.isRelative && this.isRelative == 1) {
                list.forEach((item, index) => {
                  if (item.typesName == 4 || item.unreceivedMoney == 0) {
                    list.splice(index, 1)
                  }
                })
              } else if (this.isRelative && this.isRelative == 2) {
                list.forEach((item, index) => {
                  if (item.typesName == 4) {
                    list.splice(index, 1)
                  }
                })
              }
            }
            // 关联回款、合同字段单独处理
            const receivablesByInvoiceList = []
            if (this.crmType == 'contract' || this.crmType == 'invoice') {
            // this.list.forEach(item => {
            //   const newArray = []
            //   if (item.contractRelationList.length != 0) {
            //     for (var i = 0; i < item.contractRelationList.length; i++) {
            //       newArray.push(objDeepCopy(item))
            //     }
            //     if (this.crmType == 'contract') {
            //       item.contractRelationList.forEach(subItem => {
            //         subItem.formerContractId = objDeepCopy(subItem.contractId)
            //         subItem.contractId = subItem.id
            //       })
            //     }

              //     const strArray = item.contractRelation.split(',')
              //     newArray.forEach((childItem, childIndex) => {
              //       childItem.contractRelation = strArray[childIndex]
              //       if (this.crmType == 'contract') {
              //         childItem.contractId = childItem.contractRelationList[childIndex].id + '1'
              //         childItem.relationId = childItem.contractRelationList[childIndex].relationId
              //         childItem.contractRelationList = []
              //       } else if (this.crmType == 'invoice') {
              //         childItem.invoiceId = childItem.contractRelationList[childIndex].id + '2323'
              //         childItem.invoiceSonId = childItem.contractRelationList[childIndex].invoiceId
              //         childItem.contractRelationList = []
              //       }
              //     })
              //   }
              //   item.contractRelationList = newArray
              // })

              // 表格内key改为id
              list.forEach(item => {
                if (item.contractRelationList.length != 0) {
                  for (var i = 0; i < item.contractRelationList.length; i++) {
                    if (this.crmType == 'invoice') {
                      item.contractRelationList[i].invoiceStatus = item.invoiceStatus
                      item.contractRelationList[i].isRefund = item.isRefund
                      item.contractRelationList[i].invoiceApplyNumber = item.invoiceApplyNumber
                      item.contractRelationList[i].invoiceSonId = item.invoiceId
                      item.contractRelationList[i].createUserName = item.createUserName
                      item.contractRelationList[i].rentStatus = item.rentStatus
                      item.contractRelationList[i].invoiceDate = item.invoiceDate
                      item.contractRelationList[i].fieldBojoyc = item.fieldBojoyc
                      item.contractRelationList[i].invoiceType = item.invoiceType
                      item.contractRelationList[i].fieldZoumrs = item.fieldZoumrs
                      item.contractRelationList[i].types = item.types
                      item.contractRelationList[i].ownerUserName = item.ownerUserName
                      item.contractRelationList[i].checkStatus = item.checkStatus
                      item.contractRelationList[i].fieldSetkwt = item.fieldSetkwt
                      item.contractRelationList[i].ownerDeptName = item.ownerDeptName
                      item.contractRelationList[i].realInvoiceDate = item.realInvoiceDate
                      item.contractRelationList[i].rentNumber = item.rentNumber
                      item.contractRelationList[i].invoiceNumber = item.invoiceNumber
                      item.contractRelationList[i].logisticsNumber = item.logisticsNumber
                      item.contractRelationList[i].titleType = item.titleType
                      item.contractRelationList[i].invoiceTitle = item.invoiceTitle
                      item.contractRelationList[i].taxNumber = item.taxNumber
                      item.contractRelationList[i].rentProject = item.rentProject
                      item.contractRelationList[i].depositBank = item.depositBank
                      item.contractRelationList[i].depositAccount = item.depositAccount
                      item.contractRelationList[i].depositAddress = item.depositAddress
                      item.contractRelationList[i].telephone = item.telephone
                      item.contractRelationList[i].dishonorReason = item.dishonorReason
                      item.contractRelationList[i].contractRelation = item.contractRelationList[i].name
                      item.contractRelationList[i].contractMoney = item.contractRelationList[i].money
                      item.contractRelationList[i].invoiceMoney = item.invoiceMoney
                      item.contractRelationList[i].unReceivedMoney = item.contractRelationList[i].unreceivedMoney
                    }
                  }
                }
                if (this.crmType == 'invoice') {
                  item.id = item.invoiceId
                }
                if (this.crmType == 'contract') {
                  // item.id = item.contractId
                  this.$set(item, 'id', item.contractId)
                }
                receivablesByInvoiceList.push(...item.contractRelationList)
              })
            }
            if (this.currentCrmType == 'receivables' && this.crmType == 'invoice') {
              this.list = receivablesByInvoiceList
            } else {
              this.list = list
            }
        
          }

          if (res.data.totalRow && Math.ceil(res.data.totalRow / this.pageSize) < this.currentPage && this.currentPage > 1) {
            this.currentPage = this.currentPage - 1
            this.getList()
          } else {
            this.total = res.data.totalRow
            this.loading = false
          }

          this.$nextTick(() => {
            document.querySelector('.el-table__body-wrapper').scrollTop = 1
          })

          // 筛选默认值勾选
          if (this.selectedData && !this.hasExaSelctedData) {
            this.hasExaSelctedData = true
            setTimeout(() => {
              this.setSelections(this.selectedData)
            }, 100)
          }

          // 数据更新刷新列
          this.updateTableHeight()
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 获取基础参数
     * @returns
     */
    getBaseParams() {
      let params = {
        search: this.search,
        type: this.isSeas ? crmTypeModel.pool : crmTypeModel[this.crmType] // 9是公海
      }
      if (this.crmType === 'business' && this.isOrContract) {
        params.isOrContract = 0
      }
      if (this.crmType === 'invoice' && this.isOrContract) {
        params.contractId = this.isOrContract
      }
      if (this.sortData.order) {
        params.sortField = this.sortData.prop
        params.order = this.sortData.order == 'ascending' ? 2 : 1
      }
      if (this.crmType === 'applet') {
        params.type = this.appletType
      }
      if (this.sceneId) {
        params.sceneId = this.sceneId
      }
      //HYL
      if (this.crmType === 'product') {
        params.cascaderIds = this.treeValue
      }
      // 活动关联对象
      if (this.marketingCrmType) {
        params.crmType = this.marketingCrmType
      }

      // 公海切换
      if (this.poolId) {
        params.poolId = this.poolId
      }
      if (this.filterObj && this.filterObj.length > 0) {
        // 滤掉无效值 5 6 为空 不为空 不需要提供values
        const filterObj = this.filterObj ? this.filterObj.filter(item => (item.values && item.values.length > 0) || ([5, 6].includes(item.type))) : []
        if (filterObj.length > 0) {
          params.searchList = filterObj
        }
      }

      // 筛选props传入参数
      // 用于相关查询 包含Id的参数 需替换为下划线 通过类似高级筛选形式 实现
      if (this.config.params) {
        params = { ...params }
        const searchList = params.searchList || []
        for (var key in this.config.params) {
          const keyValue = this.config.params[key]
          if (key === 'checkStatus') {
            searchList.push({
              formType: 'checkStatus',
              name: 'checkStatus',
              type: 1,
              values: isArray(keyValue) ? keyValue : [keyValue]
            })
          } else {
            searchList.push({
              formType: 'text',
              name: key.includes('Id') ? toUnderScoreCase(key) : key,
              type: 1,
              values: isArray(keyValue) ? keyValue : [keyValue]
            })
          }
        }
        if (this.isRelatedContract) {
          // searchList.push({
          //   formType: 'checkStatus',
          //   name: 'checkStatus',
          //   type: 1,
          //   values: [1, 10]
          // })
          if (this.currentCrmType != 'invoice') { // 发票不需要这个参数
            searchList.push({
              formType: 'select',
              name: 'types',
              type: 1,
              values: ['预付款合同']
            })
          }
        }
        if (this.currentCrmType == 'invoice') {
          searchList.push({
            formType: 'select',
            name: 'types',
            type: 2,
            values: ['执行合同']
          })
        }
        if (this.currentCrmType == 'receivables') {
          searchList.push({ 'formType': 'checkStatus', 'name': 'checkStatus', 'type': 1, 'values': [1] })
          searchList.push({ 'formType': 'select', 'name': 'types', 'type': 2, 'values': ['执行合同'] })
          searchList.push({ 'formType': 'floatnumber', 'name': 'unreceivedMoney', 'type': 2, 'values': [0] })
        }
        params.searchList = searchList
      }

      if (this.config.searchList) {
        params.searchList = [...params.searchList, ...this.config.searchList]
      }

      return params
    },

    /**
     * 获取列表请求
     */
    getIndexRequest() {

      if (this.crmType === 'leads') {
        return crmLeadsIndexAPI
      } else if (this.crmType === 'applet') {
        return crmAppletIndexAPI
      } else if (this.crmType === 'customer') {
        if (this.isSeas) {
          return crmCustomerPoolListAPI
        } else {
          return crmCustomerIndexAPI
        }
      } else if (this.crmType === 'contacts') {
        return crmContactsIndexAPI
      } else if (this.crmType === 'business') {
        return crmBusinessIndexAPI
      } else if (this.crmType === 'contract') {
        return crmContractIndexAPI
      } else if (this.crmType === 'product') {
        return crmProductIndexAPI
      } else if (this.crmType === 'receivables') {
        return crmReceivablesIndexAPI
      } else if (this.crmType === 'marketing') {
        return crmMarketingIndexAPI
      } else if (this.crmType === 'visit') {
        return crmReturnVisitIndexAPI
      }
      else if (this.crmType === 'project') {
        return crmProjectIndexAPI
      }
      else if (this.crmType === 'invoice') {
        if (this.isOrContract) {
          return crmReceivablesAPI
        }
        return crmInvoiceIndexAPI
      }else if (this.crmType === 'unit') {
        return crmUnitIndexAPI
      } else if (this.crmType === 'receivablesPlan') {
        return crmReceivablesPlanIndexAPI
      } else if (this.crmType == 'settlement') {
        return crmSettlementIndexAPI
      }
    },

    /**
     * 获取字段
     * @param {*} force 忽略标题数据，重新获取
     */
    getFieldList(force) {
     
      if (this.crmType === 'applet') {
        this.fieldList = [
          { prop: 'weixinName', label: '微信名称', width: '115px' },
          { prop: 'weixinImg', label: '头像', width: '115px' },
          { prop: 'mobile', label: '手机号', width: '115px' },
          { prop: 'ownerUserName', label: '负责人', width: '115px' },
          { prop: 'createTime', label: '创建时间', width: '115px' },
          { prop: 'isTransform', label: '是否转化' }
        ]
        this.getList()
        return
      }


      if (this.fieldList.length == 0 || force) {
        
        this.loading = true

        const params = {}
        if (this.isSeas) {
          if (this.poolId) {
            params.poolId = this.poolId
          }
        } else {
          params.label = crmTypeModel[this.crmType]
        }

        const request = this.isSeas ? filedGetPoolTableFieldAPI : filedGetTableFieldAPI
        request(params)
          .then(res => {
            let fieldList = []
            for (let index = 0; index < res.data.length; index++) {
              const element = res.data[index]
              var width = 0
              if (!element.width) {
                if (element.name && element.name.length <= 6) {
                  width = element.name.length * 15 + 95
                } else {
                  width = 140
                }
              } else {
                width = element.width
              }

              fieldList.push({
                ...element,
                prop: element.fieldName,
                label: element.name,
                width: width
              })
            }
            

            this.fieldList = fieldList

            if(params.label == 6){
           
              const productField = ['产品名称', '产品类别', '一级分类', '产品单位', '产品数量', '产品价格', '产品售价','产品小计','周期'];
                
              this.fieldList = fieldList && fieldList.filter(item => !productField.includes(item.label));
            }
            
            
            // 获取好字段开始请求数据
            this.getList()
          })
          .catch(() => {
            this.loading = false
          })
      } else {
        // 获取好字段开始请求数据
        this.getList()
      }
    },

    /* ------------------------ 高级筛选 ------------------------ */
    /**
     * @description: wk-table-header 筛选字段的获取
     * @param {*}
     * @return {*}
     */
    getFilterFields() {
      return new Promise((resolve) => {
        const params = {}
        if (this.isSeas) {
          params.poolId = this.poolId
        } else {
          params.label = crmTypeModel[this.crmType]
        }

        const request = this.isSeas ? crmCustomerPoolQueryPoolFieldAPI : filterIndexfieldsAPI

        request(params).then(res => {
          const resData = res.data || []
          // 忽略的字段 不用于筛选
          if (this.props && this.props.ignoreFilterFields) {
            const { ignoreFilterFields } = this.props
            this.filterFieldList = resData.filter(item => !ignoreFilterFields.includes(item.fieldName))
          } else {
            this.filterFieldList = resData
          }
          resolve(this.filterFieldList)
        }).catch(() => {})
      })
    },

    /**
     * 是否展示 表头高级筛选按钮
     */
    showFilter(field) {
      // 部分特殊的字段需单独处理
      if (Object.keys(filterFieldMap).includes(field.prop)) return true

      const obj = this.filterFieldList.find(item => item.fieldName === field.prop)
      return !!obj
    },

    /**
     * 格式化字段
     * @param {*} row
     * @param {*} column
     * @param {*} cellValue
     */
    fieldFormatter(row, column, cellValue, field) {
      // 如果需要格式化
      if (column.property === 'isTransform') {
        return ['否', '是'][row[column.property]] || '--'
      }

      if (field) {
        return getFormFieldShowName(field.formType, row[column.property], '--', field)
      }
      return row[column.property] === '' || row[column.property] === null ? '--' : row[column.property]
    },

    // /**
    //  * 搜索操作
    //  * @param {*} value
    //  */
    // crmSearch(value) {
    //   this.currentPage = 1
    //   this.search = value
    //   if (this.fieldList.length) {
    //     this.getList()
    //   }
    // },
    /**
     * @description: 表头操作 取代 crmSearch
     * @param {*}
     * @return {*}
     */
    tableHeaderHandle(type, data) {
      // 头部搜索点击按钮
      if (type === 'search') {
        this.refreshList()
      } else if (type === 'export-fields-collapse') {
        this.updateTableStyle({
          filterConfig: {
            showExportFields: data
          }
        })
        this.updateTableHeight()
      } else if (type === 'scene-refresh') {
        this.getSceneList()
      } else if (type === 'treeDataSelected'){
        this.treeValue = data
        this.refreshList()
      }
    },

    /**
     * 列表操作
     * @param {*} row
     * @param {*} column
     * @param {*} event
     */
    handleRowClick(row, column, event) {
      
     
      if (column.type === 'selection') {
        return // 多选布局不能点击
      }

      if (this.crmType === 'leads') {
        if (column.property === 'leadsName') {
          this.rowID = row.leadsId
          this.rowType = 'leads'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'customer') {
        if (column.property === 'businessCheck' && row.businessCount > 0) {
          return // 列表查看商机不展示详情
        }
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'contacts') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'name') {
          this.rowID = row.contactsId
          this.rowType = 'contacts'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'business') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'businessName') {
          this.rowID = row.businessId
          this.rowType = 'business'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'contract') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'businessName') {
          this.rowID = row.businessId
          this.rowType = 'business'
          this.showDview = true
        } else if (column.property === 'contactsName') {
          this.rowID = row.contactsId
          this.rowType = 'contacts'
          this.showDview = true
        }  else if (column.property === 'name') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else if (column.property === 'num') {
          console.log(row.relationId, row.contractId)
          if (row.relationId) {
            this.rowID = row.relationId
          } else {
            this.rowID = row.contractId
          }
          this.rowType = 'contract'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'product') {
        if (column.property === 'name') {
          this.rowID = row.productId
          this.rowType = 'product'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'receivables') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'contractNum') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else if (column.property === 'number') {
          this.rowID = row.receivablesId
          this.rowType = 'receivables'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'project') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'contractNum') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else if (column.property === 'projectNum') {
          this.rowID = row.projectId
          this.rowType = 'project'
          this.showDview = true
        }else {
          this.showDview = false
        }
      } 
      else if (this.crmType == 'marketing') {
        if (column.property === 'marketingName') {
          this.rowID = row.marketingId
          this.rowType = 'marketing'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType == 'visit') {
        if (column.property === 'visitNumber') {
          this.rowID = row.visitId
          this.rowType = 'visit'
          this.showDview = true
        } else if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'contractNum') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else if (column.property === 'contactsName') {
          this.rowID = row.contactsId
          this.rowType = 'contacts'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } 
      else if (this.crmType == 'project') {
        if (column.property === 'projectNumber') {
          this.rowID = row.projectId
          this.rowType = 'project'
          this.showDview = true
        } else if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'contractNum') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else if (column.property === 'contactsName') {
          this.rowID = row.contactsId
          this.rowType = 'contacts'
          this.showDview = true
        } else {
          this.showDview = false
        }
      }
      else if (this.crmType == 'invoice') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'contractNum') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else if (column.property === 'invoiceApplyNumber') {
          if (row.invoiceSonId) {
            this.rowID = row.invoiceSonId
          } else {
            this.rowID = row.invoiceId
          }
          this.rowType = 'invoice'
          this.showDview = true
        } else if (column.property === 'receivablesNum') {
          this.rowID = row.receivablesId
          this.rowType = 'receivables'
          this.showDview = true
        } else if (column.property === 'relationContractIdsNum' && row.contractId) {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType == 'receivablesPlan') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'contractNum') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else if (column.property === 'num') {
          this.rowID = row.receivablesPlanId
          this.rowType = 'receivablesPlan'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType == 'settlement') {
        if (column.property === 'num') {
          this.rowID = row.settlementId
          this.rowType = 'settlement'
          this.showDview = true
        } else if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'contractNum') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else {
          this.showDview = false
        }
      }else if (this.crmType === undefined) {
        alert(row.customerId)
        this.rowID = row.customerId
        this.rowType = 'customer'
        this.showDview = true
        
      }

      this.rowIndex = this.getRowIndex()
    },

    /**
     * 获取点击行索引
     */
    getRowIndex() {
    
      let rowIndex = 0
      for (let index = 0; index < this.list.length; index++) {
        const element = this.list[index]
        if (element[`${this.rowType}Id`] === this.rowID) {
          rowIndex = index
          break
        }
      }
      return rowIndex
    },

    /**
     * 筛选操作
     * @param {*} data 高级筛选数据
     */
    handleFilter(data) {
      this.filterObj = data

      this.refreshList()
    },

    /**
     * 场景操作
     * @param {*} data
     */
    sceneSelect(data) {
     
      this.sceneData = data
      this.sceneId = data.sceneId

      this.refreshList()
    },

    /**
     * 刷新数据
     */
    refreshList() {
      this.currentPage = 1
      this.getFieldList()
    },

    /**
     * 勾选操作
     * @param {*} data
     */
    handleHandle(data) {
      // 编辑是个动作，不是编辑成功。不执行操作
      if (['edit'].includes(data.type)) {
        return
      }

      // 该模块使用转移 刷新系统消息
      if ((this.crmType == 'customer' ||
      this.crmType == 'contract' ||
      this.crmType == 'leads') && data.type === 'transfer') {
        this.$store.dispatch('GetMessageNum')
      }

      if (['alloc', 'get', 'transfer', 'transform', 'delete', 'put_seas', 'exit-team', 'back_invioce'].includes(data.type)) {
        this.showDview = false
      }

      if (data.type == 'clear-sort') {
        this.getMainTable().clearSort()
        this.sortChange()
      } else {
        // 只有不是选择效果，有特殊操作，清空勾选
        if (!this.config.isSelect) {
          this.getMainTable().clearSelection()
        }
        this.getList()
      }
    },

    /**
     * 获取table
     */
    getMainTable() {
      let table = null
      this.$children.forEach(item => {
        if (item.$options && item.$options.name === 'ElTable') {
          table = item
        }
      })
      return table
    },

    /**
     * 获取table
     */
    getTableHead() {
      let table = null
      this.$children.forEach(item => {
        if (item.$options && item.$options.name === 'WkTableHeader') {
          table = item
        }
      })
      return table
    },

    /** 自定义字段管理 */
    setSave() {
      this.getFieldList(true)
    },

    /**
     * 页面头部操作
     * @param {*} data
     */
    listHeadHandle(data) {
      if (data.type === 'save-success' || data.type === 'import-crm') {
        // 重新请求第一页数据
        this.refreshList()
      }
    },

    /**
     * 字段排序
     */
    sortChange(column, prop, order) {
      this.sortData = column || {}
      this.refreshList()
    },

    /**
     * 勾选操作
     * @param {*} val
     */
    handleSelectionChange(val) {
   
      if (this.ignoreSelectedChange) {
        return
      }

      // 单选操作
      if (this.config.radio && val.length > 1) {
      
        const mainTable = this.getMainTable()
        const lastObj = val[val.length - 1]
        this.ignoreSelectedChange = true
        mainTable.clearSelection()
        this.$nextTick(() => {
          this.ignoreSelectedChange = false
          mainTable.toggleRowSelection(lastObj)
        })
        return
      } else {
      
        this.selectionList = val
      }
      
      this.$emit('selection-change', val, this.crmType)
    },

    /**
     * 当拖动表头改变了列的宽度的时候会触发该事件
     * @param {*} newWidth
     * @param {*} oldWidth
     * @param {*} column
     * @param {*} event
     */
    handleHeaderDragend(newWidth, oldWidth, column, event) {
      this.debouncePostWidthChange(newWidth, column)
    },

    /**
     * 上传宽change
     * @param {*} val
     */
    postWidthChange(newWidth, column) {
      if (column.property) {
        let request = null
        var id
        this.fieldList.forEach(e => {
          if (column.property === e.prop) {
            id = e.id
            e.width = newWidth
          }
        })
        if (!id) {
          return
        }
        const params = {
          id: id,
          width: newWidth,
          field: column.property
        }
        if (this.isSeas) {
          if (!this.poolId) {
            return
          }
          request = crmPoolFieldColumnWidthAPI
          params.poolId = this.poolId
        } else {
          request = crmFieldColumnWidthAPI
        }

        request(params)
          .then(res => {
          })
          .catch(() => { })
      }
    },

    /**
     * 更改每页展示数量
     * @param {*} val
     */
    handleSizeChange(val) {
      Lockr.set('crmPageSizes', val)
      this.pageSize = val
      this.getList()
    },

    /**
     * 更改当前页数
     * @param {*} val
     */
    handleCurrentChange(val) {
      this.currentPage = val
      this.getList()
    },

    /**
     * 状态颜色
     * @param {*} status
     */
    getStatusStyle(status) {
      return {
        backgroundColor: this.getStatusColor(status)
      }
    },

    /**
     * 状态颜色
     * @param {*} status
     */
    getStatusStyle2(status) {
      return {
        color: this.getStatusColor(status)
      }
    },

    /**
     * 切换关注状态
     * @param index
     * @param status
     */
    toggleStar(data) {
      this.loading = true

      const request = {
        leads: crmLeadsStarAPI,
        customer: crmCustomerStarAPI,
        contacts: crmContactsStarAPI,
        business: crmBusinessStarAPI
      }[this.crmType]

      const params = {}
      params['id'] = data[`${this.crmType}Id`]

      request(params).then(() => {
        this.loading = false
        this.$message.success(data.star > 0 ? '取消关注成功' : '关注成功')
        data.star = data.star > 0 ? 0 : 1
      }).catch(() => {
        this.loading = false
      })
    },

    /**
     * 更新表高
     */
    updateTableHeight() {
      const clientHeight = document.documentElement.clientHeight
      if (this.config && this.config.otherHeight) {
        this.$nextTick(() => {
          const tableHead = this.getTableHead()
          this.tableHeight = clientHeight - this.config.otherHeight - (tableHead ? tableHead.$el.clientHeight : 0)
        })
      } else {
        this.$nextTick(() => {
          const tableHead = this.getTableHead()

          const maxTableHeight = clientHeight - tableHead.$el.clientHeight - 230

          const dataHeight = this.rowHeight * this.list.length + 50 // 头高度
          if (dataHeight > maxTableHeight) {
            this.tableHeight = maxTableHeight
          } else {
            this.tableHeight = this.list.length === 0 ? 200 : dataHeight
          }
        })
      }
    },

    /**
     * 设置selections值
     */
    setSelections(data) {
      return new Promise((resolve, reject) => {
        const mainTable = this.getMainTable()
        mainTable.clearSelection()
        this.$nextTick(() => {
          data.forEach(item => {
            // const idKey = `${this.crmType}Id`
            // const listItem = this.list.find(lItem => lItem[idKey] === item[idKey])
            // if (listItem) {
            //   mainTable.toggleRowSelection(listItem)
            // }
            mainTable.toggleRowSelection(item)
          })

          resolve()
        })
      })
    },

    /**
     * 切换某一行的选中状态
     */
    toggleRowSelection(rowKey, rowId, selected) {
      this.$nextTick(() => {
        const removeItem = this.selectionList.find(item => item[rowKey] === rowId)

        if (removeItem) {
          this.getMainTable().toggleRowSelection(removeItem, selected)
        }
      })
    },

    /**
     * 展示字段高级筛选
     */
    showFilterClick(field) {
      let obj = this.filterFieldList.find(item => item.fieldName === field.prop)

      // 处理特殊字段
      if (!obj) {
        obj = this.filterFieldList.find(item => item.fieldName === filterFieldMap[field.prop])
      }
      if (!obj) return

      const formItem = {}
      formItem.isExport = false
      formItem.formType = obj.formType
      formItem.fieldName = obj.fieldName
      formItem.name = obj.label

      // 校准对象属性 conditionTypeFun 产品页面
      this.getAdvancedFilterDefaultItemByFormType(formItem, obj, this.conditionTypeFun)

      const vm = this.getTableHead()
      if (!vm) return
      if (vm.filterObj && vm.filterObj.form.length) {
        const findRes = vm.filterObj.form.find(o => o.fieldName === obj.fieldName)
        if (!findRes) {
          vm.filterObj.form.push(formItem)
        }
      } else {
        vm.filterObj = { form: [formItem] }
      }
      vm.showFilterClick()
    },
    /**
     * 表头字段锁定
     */
    fieldFixed(item) {
      const newLock = item.isLock === 1 ? 0 : 1
      const request = this.isSeas ? crmCustomerPoolSetIsLockAPI : crmFieldSetIsLockAPI
      request({
        id: item.id,
        isLock: newLock
      }).then(res => {
        item.isLock = newLock
        this.$message.success(newLock === 1 ? '已将该列固定在列表前部' : '已取消该列在前部固定')
      }).catch(() => {})
    },

    /**
     * 获取配置
     */
    getCustomConfig() {
      adminConfigQueryCustomSettingAPI(PcCustomKeys.pcCRMprefix + this.crmType).then(res => {
        const resData = res.data
        if (isArray(resData) && resData.length > 0) {
          const config = resData[0] // 值规范是数组 所以默认放在第一个元素里
          if (isObject(config)) {
            if (config.tableStyleObj) {
              // 请求后 将styleObj init 设置为true, 只有针对该对象的修改，才会发请求
              config.tableStyleObj.init = true
              this.tableStyleObj = config.tableStyleObj
            }
            this.customConfig = config

            // 根据配置修改 wktableheader 的默认外露默认展示值
            this.tableHeaderProps.props.showExportFields = config.filterConfig.showExportFields
          }
        }

        if (!this.tableStyleObj.init) {
          this.tableStyleObj.$set('init', true)
        }
      }).catch(() => {})
    },

    /**
     * 更新style样式
     */
    updateTableStyle(otherConfig) {
      adminConfigSetCustomSettingAPI(PcCustomKeys.pcCRMprefix + this.crmType, [{
        ...this.customConfig,
        tableStyleObj: this.tableStyleObj,
        ...(otherConfig || {})
      }]).then(res => {

      }).catch(() => {})
    }
  },

  beforeDestroy() { }
}
