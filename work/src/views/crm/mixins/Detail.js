import {
  mapGetters
} from 'vuex'

import {
  crmLeadsNumAPI,
  crmLeadsStarAPI,
  crmLeadsTransferAPI
} from '@/api/crm/leads'
import {
  crmCustomerNumAPI,
  crmCustomerStarAPI,
  crmCustomerTransferAPI
} from '@/api/crm/customer'
import {
  crmContactsNumAPI,
  crmContactsStarAPI,
  crmContactsTransferAPI
} from '@/api/crm/contacts'
import {
  crmBusinessNumAPI,
  crmBusinessStarAPI,
  crmBusinessTransferAPI
} from '@/api/crm/business'
import {
  filedGetInformationAPI,
  filedUpdateTableFieldAPI
} from '@/api/crm/common'
import {
  crmContractNumAPI,
  crmContractTransferAPI
} from '@/api/crm/contract'
import {
  crmProductNumAPI,
  crmProductTransferAPI
} from '@/api/crm/product'
import {
  crmInvoiceTransferAPI
} from '@/api/crm/invoice'
import {
  crmReceivablesNumAPI,
  crmReceivablesTransferAPI
} from '@/api/crm/receivables'

import WkDetailHeader from '@/components/Page/WkDetailHeader'
import TagView from '@/components/NewCom/WkTag/TagView' // 标签
import WkTag from '@/components/NewCom/WkTag'
import WkQuickCreateBar from '@/components/Page/WkQuickCreateBar'
import DetailHeadBase from '../components/DetailHeadBase'
import WkHeadSection from '@/components/NewCom/WkHeadSection'
import WkSectionItem from '@/components/NewCom/WkHeadSection/SectionItem'
import TimePiece from '@/callCenter/TimePiece'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import { debounce } from 'throttle-debounce'
import { getCrmHelpObj } from '../utils'
import EventsObj from '../model/events'
import { objDeepCopy } from '@/utils'

export default {
  data() {
    return {
      detailData: null,
      // tabs Number
      tabsNumber: {},
      // 标签信息
      tagInfo: null,
      // 判断内容是否滚动
      bodyIsScroll: false,
      // 转移操作
      transferDialogShow: false,
      //数据迁移操作
      dataTransferDialogShow: false,
      // CRM操作
      createActionInfo: null,
      createCRMType: '',
      crmCreateShow: false,
      // 任务新建
      taskCreateShow: false,
      taskCreateAction: {
        type: 'save'
      }
    }
  },
  props: {
    // 是公海 默认是客户
    isSeas: {
      type: Boolean,
      default: false
    },
    pageIndex: [String, Number],
    pageList: Array // 用于详情切换
  },

  components: {
    WkDetailHeader,
    TagView,
    WkTag,
    WkQuickCreateBar,
    DetailHeadBase,
    WkHeadSection,
    WkSectionItem,
    TimePiece
  },

  computed: {
    ...mapGetters(['crm']),
    // 是否能新建跟进记录
    canCreateFollowRecord() {
      return this.crm && this.crm.followRecord && this.crm.followRecord.save
    },

    // 能否查看详情
    canShowDetail() {
      if (this.detailData && this.detailData.dataAuth === 0) {
        return false
      }

      return this.crm && this.crm[this.crmType] && this.crm[this.crmType].read
    },

    showTabsNumber() {
      return this.crmType !== 'marketing' && this.crmType !== 'visit'
    },

    // 展示转移
    showTransfer() {
      if (this.crmType === 'contract') {
        return (
          this.detailData &&
          this.detailData.checkStatus != 8 &&
          this.$auth(`crm.${this.crmType}.transfer`)
        )
      }

      return this.$auth(`crm.${this.crmType}.transfer`)
    },

    // 转移配置
    transferHandleProps() {
      return {
        // 场景编辑请求
        request: {
          leads: crmLeadsTransferAPI,
          customer: crmCustomerTransferAPI,
          contacts: crmContactsTransferAPI,
          product: crmProductTransferAPI,
          business: crmBusinessTransferAPI,
          contract: crmContractTransferAPI,
          receivables: crmReceivablesTransferAPI,
          invoice: crmInvoiceTransferAPI
        }[this.crmType],
        params: { ids: [this.detailData[this.crmType + 'Id']] },
        showChangeOwner: this.crmType === 'customer', // 同时变更负责人
        showRemoveType: !['leads', 'product', 'invoice'].includes(this.crmType), // 是否展示移除操作类型
        // 帮助提示
        help: getCrmHelpObj(this.crmType, 'transfer')
      }
    },

    // 展示编辑按钮
    showEdit() {
      //  8 已作废 的合同可以编辑
      return this.isSeasDetail ? false : this.$auth(`crm.${this.crmType}.update`)
    },

    // 展示tags
    showTags() {
      return this.crmType !== 'marketing'
    },

    // isSeas 是从公海模块传入的 配合详情is_pool字段确定
    isSeasDetail() {
      if (this.detailData && this.detailData.hasOwnProperty('isPool')) {
        return this.detailData.isPool == 1
      }
      return this.isSeas
    },

    // 呼叫中心逻辑
    showTimer() {
      return this.$store.state.crm.showTimer
    },

    // 只有正在通话的页面才能展示时间
    isCall() {
      // modelData  联系人 线索客户 客户
      if (this.modelData) {
        return this.modelData.modelId === this.id && this.modelData.model === this.crmType
      }

      return false
    }
  },

  watch: {
    id: function() {
      if (this.canShowDetail) {
        this.refreshDetail()
      }
    },

    tabCurrentName() {
      this.debouncedGetTabsNum()
    }
  },

  mounted() {
    this.debouncedGetTabsNum = debounce(300, this.getTabsNum)

    this.debouncedExecuteChildScroll = debounce(500, this.executeChildScroll)
  },

  beforeDestroy() {
    this.$bus.off('crm-tab-num-update', this.debouncedGetTabsNum)
  },

  methods: {
    /**
     * 滚动
     */
    bodyScroll(e) {
      this.bodyIsScroll = e.target.scrollTop > 2

      this.debouncedExecuteChildScroll(this.tabCurrentName)
    },

    /**
     *  执行子组件滚动
     * @param {*} isfirst
     * @returns
     */
    executeChildScroll(ref) {
      const com = this.$refs[ref] ? this.$refs[ref][0] : null
      com && com.scroll && com.scroll()
    },

    /**
     * @description: 刷新详情
     * @param {*}
     * @return {*}
     */
    refreshDetail() {
      this.detailData = null
      this.tabsNumber = {}
      this.getDetial()
      this.getTagInfo()
      this.getTabsNum()
    },

    /**
     * @description: 详情请求
     * @param {*}
     * @return {*}
     */
    viewAfterEnter() {
      if (this.canShowDetail) {
        this.refreshDetail()

        this.$bus.on('crm-tab-num-update', this.debouncedGetTabsNum)
      }
    },

    /**
     * 获取标签字段
    */
    getTagInfo() {
      if (!this.showTags) return

      const params = {
        types: crmTypeModel[this.crmType],
        id: this.id
      }
      if (this.poolId) {
        params.poolId = this.poolId
      }
      filedGetInformationAPI(params)
        .then(res => {
          res.data.forEach(item => {
            if (item.formType == 'field_tag') {
              this.tagInfo = item
            }
          })
        })
        .catch(() => {

        })
    },

    /**
     * 标签操作
     */
    tagChange() {
      const params = {
        id: this.id,
        batchId: this.detailData.batchId,
        label: this.isSeasDetail ? crmTypeModel['pool'] : crmTypeModel[this.crmType],
        list: [this.tagInfo]
      }
      filedUpdateTableFieldAPI(params)
        .then(res => {
          this.detailHeadHandle({ type: 'tag_change' })
        })
        .catch(() => {
          this.detailHeadHandle({ type: 'tag_change' })
        })
    },

    /**
     * 详情页面切换
     */
    pageChange(type) {
      if (type === 'left') {
        if (this.pageIndex > 0) {
          let pageIndex = this.pageIndex
          this.$emit('update:pageIndex', --pageIndex)
          this.$emit('update:id', this.pageList[pageIndex][`${this.crmType}Id`])
        } else {
          this.$message.error('没有更多了')
        }
      } else {
        if (this.pageIndex < this.pageList.length - 1) {
          let pageIndex = this.pageIndex
          this.$emit('update:pageIndex', ++pageIndex)
          this.$emit('update:id', this.pageList[pageIndex][`${this.crmType}Id`])
        } else {
          this.$message.error('没有更多了')
        }
      }
    },

    /**
     * 顶部头 操作
     * @param {*} data
     */
    detailHeadHandle(data) {
      console.log(data)
      // 返回值为false 不继续执行
      if (this.detailHeadHandleClick(data) === false) {
        return
      }

      if (data.type === 'edit') {
        this.isCreate = true
      } else if (data.type === 'delete' ||
      data.type === 'cancelInvoice' ||
      data.type === 'exit-team' ||
      data.type === 'alloc' ||
      data.type === 'get' ||
      data.type === 'transfer' ||
      data.type === 'transform' ||
      data.type === 'delete' ||
      data.type === 'put_seas') {
  
        this.hideView()
      } else if (data.type === 'state_start' ||
      data.type === 'state_disable' ||
      data.type === 'deal_status' ||
      data.type === 'cancel' ||
      data.type === 'examine' ||
      data.type === 'contract_status') {
        this.getDetial()
      } else if (data.type === 'save-success') {
        // 但字段编辑成功刷新
        this.editSaveSuccess()
        this.getTagInfo()
        return
      } else if (data.type == 'tag_change') { // 标签操作
        this.getTagInfo()
        if (this.crmType == 'leads') {
          this.getBaseInfo()
        }

        // 改变基本信息
        if (this.tabCurrentName === 'CRMEditBaseInfo') {
          this.$refs.CRMEditBaseInfo[0].getBaseInfo(false)
        }
      } else if (data.type == 'stage-change') {
        this.detailData = null
        this.getDetial()
      } else if (data.type === 'start' || data.type === 'disable') {
        this.refreshDetail()
      }
      this.$emit('handle', data)
    },

    /**
     * 详情操作
     */
    detailHeadHandleClick() {},

    /**
     * 编辑成功
     */
    editSaveSuccess() {
      this.$bus.$emit('crm-detail-update', this.crmType)
      this.$emit('handle', { type: 'save-success' })

      this.refreshDetail()
    },

    /**
     * 获取tab数量
     */
    getTabsNum() {
      if (!this.showTabsNumber) {
        return
      }
      const request = {
        leads: crmLeadsNumAPI,
        customer: crmCustomerNumAPI,
        contacts: crmContactsNumAPI,
        business: crmBusinessNumAPI,
        contract: crmContractNumAPI,
        product: crmProductNumAPI,
        receivables: crmReceivablesNumAPI
      }[this.crmType]

      if (!request) {
        return
      }

      const params = {}
      params['id'] = this.id

      request(params)
        .then(res => {
          this.tabsNumber = res.data || {}
        })
        .catch(() => {
        })
    },

    /**
     * 获取tabs名字
     * @param {*} name
     * @param {*} num
     */
    getTabName(name, num) {
      return `${name}${num && num > 0 ? '（' + num + '）' : ''}`
    },

    /**
     * 切换关注状态
     * @param index
     * @param status
     */
    toggleStar() {
      this.loading = true

      const request = {
        leads: crmLeadsStarAPI,
        customer: crmCustomerStarAPI,
        contacts: crmContactsStarAPI,
        business: crmBusinessStarAPI
      }[this.crmType]

      const params = {}
      params['id'] = this.detailData[`${this.crmType}Id`]
      request(params).then(() => {
        this.loading = false
        this.$message.success(this.detailData.star > 0 ? '取消关注成功' : '关注成功')
        this.detailData.star = this.detailData.star > 0 ? 0 : 1
        this.$emit('handle', { type: 'star' })
      }).catch(() => {
        this.loading = false
      })
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
          const eventObj = { ...EventsObj[type] }
          eventObj.command = eventObj.type
          eventObj.icon = ''
          tempsHandles.push(eventObj)
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
        return
      }

      if (type == 'transfer') {
        return this.crm[this.crmType].transfer
      } else if (type == 'transform') {
        return this.crm[this.crmType].transform
      } else if (type == 'export') {
        if (this.isSeasDetail) {
          if (this.poolId) {
            return this.poolAuth.excelexport
          }
          return this.crm.pool && this.crm.pool.excelexport
        }
        return this.crm[this.crmType].excelexport
      } else if (type == 'delete') {
        if (this.isSeasDetail) {
          if (this.poolId) {
            return this.poolAuth && this.poolAuth.delete
          }
          return this.crm.pool && this.crm.pool.delete && this.poolId
        }
        return this.crm[this.crmType].delete
      } else if (type == 'put_seas') {
        // 放入公海(客户)
        return this.crm[this.crmType].putinpool
      } else if (type == 'lock' || type == 'unlock') {
        // 锁定解锁(客户)
        return this.crm[this.crmType].lock
      } else if (type == 'add_user' || type == 'delete_user') {
        // 添加 移除团队成员
        return this.crm[this.crmType].teamsave
      } else if (type == 'alloc') {
        // 分配(公海)
        if (this.poolId) {
          return this.poolAuth && this.poolAuth.distribute
        }
        return this.crm.pool && this.crm.pool.distribute
      } else if (type == 'get') {
        // 领取(公海)
        if (this.poolId) {
          return this.poolAuth && this.poolAuth.receive
        }
        return this.crm.pool && this.crm.pool.receive && this.poolId
      } else if (type == 'start' || type == 'disable') {
        // 上架 下架(产品)
        return this.crm[this.crmType].status
      } else if (type == 'deal_status') {
        // 客户状态修改
        return this.crm[this.crmType].dealStatus
      } else if (type == 'cancel') {
        // 合同作废 1 通过 10 正常
        if (this.crm[this.crmType].discard && (this.detailData.checkStatus === 1 || this.detailData.checkStatus === 10)) {
          return true
        }
        return false
      } else if (type == 'state_start' || type == 'state_disable') {
        // 活动停用/启用
        return this.crm[this.crmType].updateStatus
      } else if (type == 'print') {
        // 打印
        return this.crm[this.crmType].print
      } else if (type == 'copyContract') {
        // 合同复制
        return this.crm[this.crmType].save
      } else if (type == 'back_invioce' || type == 'open_invioce') {
        // 退票和开票
        return this.crm[this.crmType].updateInvoiceStatus
      }

      return true
    },

    /* ------------------------ 快捷新建 ------------------------ */

    /**
     * @description: 快捷创建点击
     * @param {*}
     * @return {*}
     */
    quickCreateClick(command) {
      if (command === 'task') {
        const relatedObj = {}
        relatedObj[this.crmType] = [this.detailData]
        const relatedObjIds = {}
        relatedObjIds[`${this.crmType}Ids`] = [this.id]

        const params = {}
        params[`${this.crmType}Ids`] = this.id

        this.taskCreateAction = {
          type: 'save',
          data: {
            relatedObj: relatedObj,
            relatedObjIds: relatedObjIds
          },
          params: params
        }
        this.taskCreateShow = true
      } else {
        const aciton = { type: 'relative', crmType: this.crmType, data: {}}
        if (this.crmType == 'contacts') {
          aciton.data['customer'] = objDeepCopy(this.detailData)
          // 联系人下新建商机直接关联
          if (command == 'business') {
            aciton.relativeData = {
              contactsId: this.detailData.contactsId
            }
          }
        } else if (this.crmType == 'customer') {
          aciton.data['customer'] = objDeepCopy(this.detailData)
        } else if (this.crmType == 'business') {
          aciton.data['customer'] = objDeepCopy(this.detailData)
          aciton.data['business'] = objDeepCopy(this.detailData)
          // 商机下新建联系人直接关联
          if (command == 'contacts') {
            aciton.relativeData = {
              businessId: this.detailData.businessId
            }
          }
        } else if (this.crmType == 'contract') {
          aciton.data['customer'] = objDeepCopy(this.detailData)
          aciton.data['contract'] = objDeepCopy(this.detailData)
        }

        this.createActionInfo = aciton
        this.createCRMType = command
        this.crmCreateShow = true
      }
    }
  },

  deactivated: function() { }

}
