<template>
  <el-dialog
    :visible.sync="dialogVisible"
    :close-on-click-modal="false"
    :lock-scroll="true"
    modal-append-to-body
    append-to-body
    width="950px"
    @close="close">
    <flexbox slot="title" justify="space-between">
      <div>
        <span :style="{backgroundColor: blockColor}" class="block" />
        <span class="title-text">{{ detail.typeName || todayDetailData.title }}</span>
      </div>
      <div v-if="id != -1" style="padding-right: 24px;">
        <span class="title-message">{{ detail.createUserName }} 创建于 {{ timeFormatted(detail.createTime) }}</span>
        <el-dropdown
          trigger="click"
          @command="handleTypeDrop">
          <el-button class="dropdown-btn" icon="el-icon-more" />
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item
              v-for="(item, index) in moreTypes"
              :key="index"
              :command="item.type">
              {{ item.title }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </flexbox>
    <div v-loading="loading" class="scroll_content">
      <template v-if="id == -1">
        <el-table
          id="crm-table"
          :data="list"
          :cell-class-name="cellClassName"
          height="450"
          class="n-table--border"
          stripe
          highlight-current-row
          style="width: 100%;"
          @row-click="handleRowClick">
          <el-table-column
            v-for="(item, index) in fieldList"
            :key="index"
            :prop="item.prop"
            :label="item.label"
            :min-width="item.width"
            :formatter="fieldFormatter"
            show-overflow-tooltip>
            <template slot-scope="scope">
              <template v-if="item.prop == 'dealStatus'">
                <span :class="scope.row[item.prop] | dealIcon" />
                <span>{{ scope.row[item.prop] | dealName }}</span>
              </template>
              <template v-else-if="item.prop == 'status' && crmType === 'customer'">
                <i
                  v-if="scope.row.status == 2"
                  class="wk wk-circle-password customer-lock" />
              </template>
              <template v-else-if="item.prop == 'checkStatus'">
                <span :style="getStatusStyle(scope.row.checkStatus)" class="status-mark" />
                <span>{{ getStatusName(scope.row.checkStatus) }}</span>
              </template>
              <template v-else>
                {{ scope.row[item.prop] }}
              </template>
            </template>
          </el-table-column>
          <el-table-column :resizable="false" />
        </el-table>
        <div class="p-contianer">
          <el-pagination
            :current-page="currentPage"
            :page-sizes="pageSizes"
            :page-size.sync="pageSize"
            :total="total"
            class="p-bar"
            background
            layout="prev, pager, next, sizes, total, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange" />
        </div>
      </template>
      <template v-else>
        <div class="common-box">
          <div class="common-title" :title="todayDetailData.title || detail.title">
            {{ todayDetailData.title || detail.title }}
          </div>
          <div class="common-content">
            <flexbox>
              <span
                v-for="(item, index) in ownerUserShowList"
                :key="index"
                class="owner-list">
                <xr-avatar
                  :id="item.userId"
                  :name="item.realname"
                  :size="32"
                  :src="item.img"
                  trigger="hover"
                  class="user-img" />
              </span>
              <!-- <el-tooltip
                v-if="detail.ownerUserList && detail.ownerUserList.length > 5"
                effect="dark"
                :content="ownerUserHideName"
                placement="bottom">
                <el-button class="owner-button">
                  +{{ detail.ownerUserList.length - 5 }}
                </el-button>
              </el-tooltip> -->
              <el-dropdown
                v-if="detail.ownerUserList && detail.ownerUserList.length > 5"
                trigger="click">
                <el-button class="dropdown-btn owner-list-button">
                  +{{ detail.ownerUserList.length - 5 }}
                </el-button>
                <el-dropdown-menu slot="dropdown" class="owner-list-dropdown">
                  <el-dropdown-item
                    v-for="(item,index) in ownerUserHideList"
                    :key="index"
                    class="owner-list-dropdown-list">
                    <xr-avatar
                      :name="item.realname"
                      :size="32"
                      :src="item.img"
                      style="margin-right: 10px;"
                      class="owner-list-dropdown-img" />
                    <p class="owner-list-dropdown-text">{{ item.realname }} </p>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </flexbox>
          </div>

          <div class="common-bootom">
            <!-- <div class="type_type">
              <p>重复类型：</p>
              <span>{{ repeatText }}</span>
            </div> -->
            <div class="type_time">
              <div class="time-start-end">
                <div class="time-text">
                  <div class="time-time">开始时间</div>
                  <div class="text-up">{{ formattedTime(todayDetailData.startTime) }}</div>
                </div>
                <div class="time-text">
                  <div class="time-time">结束时间</div>
                  <div class="text-up">{{ formattedTime(todayDetailData.endTime) }}</div>
                </div>
              </div>
              <div class="time-text">
                <div class="time-time">提前提醒时间：</div>
                <div class="text-up">
                  <span v-for="(notice, index) in noticeList" :key="index">
                    <span v-if="index != 0">、</span>提前{{ notice.value }}{{ timeList[notice.type] }}提醒</span>
                </div>
              </div>
              <!-- <p>提前提醒时间：</p>
              <span v-for="(notice, index) in noticeList" :key="index"><span v-if="index != 0">、</span>提前{{ notice.value }}{{ timeList[notice.type] }}提醒</span> -->

            </div>
          </div>

          <div class="common-foot">

            <div v-if="relatedCount > 0" class="section__hd">
              <!-- <i class="wukong wukong-relevance" />   -->
              <span class="related-info">相关信息 ({{ relatedCount }})</span>
            </div>

            <p v-else class="related-info">暂无相关信息</p>

            <div class="section_scroll">
              <related-business
                ref="relatedBusiness"
                :margin-left="'0'"
                :all-data="dataList"
                :show-add-btn="false" />
            </div>

          </div>
        </div>
      </template>
    </div>

    <create-event
      :show-create="showCreate"
      :edit-all="editAll"
      :cus-check="cusCheck"
      :today-detail-data="detail"
      title="编辑日程"
      @createSuccess="handleSure"
      @handleSure="handleSure"
      @close="showCreate = false" />
    <!-- CRM详情 -->
    <c-r-m-full-screen-detail
      :id="relationID"
      :visible.sync="showFullDetail"
      :crm-type="crmType" />
  </el-dialog>
</template>
<script>

import {
  canlendarDeleteAPI,
  canlendarQueryByIdAPI,
  canlendarTodayContractAPI,
  canlendarTodayCustomerAPI,
  canlendarTodayLeadsAPI,
  canlendarTodayBusinessAPI,
  canlendarTodayDealBusinessAPI
} from '@/api/oa/calendar'
import RelatedBusiness from '@/components/RelatedBusiness'
import CreateEvent from './CreateEvent'
import CheckStatusMixin from '@/mixins/CheckStatusMixin'

import moment from 'moment'

export default {
  name: 'TodayListDetail',
  components: {
    RelatedBusiness,
    CreateEvent,
    CRMFullScreenDetail: () =>
      import('@/components/CRMFullScreenDetail')
  },
  filters: {
    dealIcon(statu) {
      return statu == 1 ? 'deal-suc' : 'deal-un'
    },

    dealName(statu) {
      return statu == 1 ? '已成交' : '未成交'
    }
  },
  mixins: [CheckStatusMixin],
  props: {
    id: {
      type: [String, Number],
      default: ''
    },
    showTodayDetail: {
      type: Boolean,
      default: false
    },
    todayDetailData: {
      type: Object,
      default: () => {
        return {
          customerList: []
        }
      }
    },
    cusCheck: {
      type: Array,
      default: () => {
        return []
      }
    }
  },
  data() {
    return {
      // 详情参数
      showFullDetail: false,
      crmType: 'customer',
      relationID: 0,
      // 任务详情
      taskDetailShow: false,
      taskID: 0,
      detailIndex: -1,

      dialogVisible: false,
      detail: {
        customerList: []
      },
      fieldList: [],
      list: [],
      loading: false,
      currentPage: 1,
      pageSize: 15,
      pageSizes: [15, 30, 45, 60],
      total: 0,
      moreTypes: [
        { title: '只删除本次', type: 'delete' },
        { title: '删除此系列', type: 'deleteAll' },
        { title: '只编辑本次', type: 'edit' },
        { title: '编辑本系列', type: 'editAll' }],
      showCreate: false,
      // 是否编辑整个系列
      editAll: false,
      repeatText: '',
      blockColor: '',
      noticeList: [],
      timeList: ['', '分钟', '小时', '天']
    }
  },
  computed: {
    // 相关信息数量
    relatedCount() {
      let count = 0
      const keys = ['customerList', 'contactsList', 'contractList', 'businessList']
      keys.forEach(key => {
        if (this.detail[key]) {
          count += this.detail[key].length
        }
      })
      return count
    },
    dataList() {
      const data = {}
      data.contacts = this.detail.contactsList
      data.customer = this.detail.customerList
      data.business = this.detail.businessList
      data.contract = this.detail.contractList
      return data
    },
    /**
     * 展示的员工树
     */
    ownerUserShowList() {
      const ownerUserList = this.detail.ownerUserList || []
      if (ownerUserList.length > 0) {
        return ownerUserList.slice(0, 5)
      }
      return ownerUserList
    },
    ownerUserHideList() {
      const ownerUserList = this.detail.ownerUserList || []
      if (ownerUserList.length > 0) {
        return ownerUserList.slice(5)
      }
      return ownerUserList
    },
    /**
     * 展示的员工名字
     */
    ownerUserHideName() {
      return this.ownerUserHideList.map(o => {
        return o.realname
      }).join('，')
    }
  },
  watch: {
    detail: {
      handler(val) {
        if (val.repetitionType === 1) {
          this.moreTypes = [
            { title: '删除', type: 'delete' },
            { title: '编辑', type: 'edit' }
          ]
        } else {
          this.moreTypes = [
            { title: '只编辑本次', type: 'edit' },
            { title: '编辑当前及以后', type: 'editAll' },
            { title: '只删除本次', type: 'delete' },
            { title: '删除此系列', type: 'deleteAll' }]
        }
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {
    this.dialogVisible = this.showTodayDetail
    if (this.dialogVisible) {
      if (this.id == -1) {
        this.getFieldList()
        this.blockColor = this.todayDetailData.backgroundColor
        this.detail = {
          customerList: []
        }
      } else {
        this.getDetail()
      }
    }
  },
  methods: {
    /**
     * 获取详情
     */
    getDetail() {
      this.loading = true
      const startTime = new Date(this.todayDetailData.startTime).getTime()
      const endTime = new Date(this.todayDetailData.endTime).getTime()
      canlendarQueryByIdAPI({
        eventId: this.id,
        startTime: startTime,
        endTime: endTime
      }).then(res => {
        const detail = res.data || {}
        detail.contactsList = (detail.contactsList || []).map(item => {
          if (item.id) {
            item.contactsId = item.id
          }
          return item
        })
        detail.customerList = (detail.customerList || []).map(item => {
          if (item.id) {
            item.customerId = item.id
          }
          return item
        })
        detail.businessList = (detail.businessList || []).map(item => {
          if (item.id) {
            item.businessId = item.id
          }
          return item
        })
        detail.contractList = (detail.contractList || []).map(item => {
          if (item.id) {
            item.contractId = item.id
          }
          return item
        })
        this.detail = detail
        this.noticeList = res.data.noticeList
        // this.repeatText = this.summaryText()
        this.blockColor = this.detail.color
        this.loading = false
      }).catch(() => {
        this.loading = false
        this.close()
      })
    },

    /**
     * 获取表头
     */
    getFieldList() {
      if (this.todayDetailData.crmType === 'customer') {
        this.fieldList = [
          { label: '客户联系人', prop: 'customerName', width: 105 },
          { label: '下次联系时间', prop: 'nextTime', width: 135 },
          { label: '最后跟进时间', prop: 'updateTime', width: 135 },
          { label: '负责人', prop: 'ownerUserName', width: 80 },
          { label: '创建时间 ', prop: 'createTime', width: 105 }
        ]
      } else if (this.todayDetailData.crmType === 'leads') {
        this.fieldList = [
          { label: '线索名称', prop: 'leadsName', width: 105 },
          { label: '下次联系时间', prop: 'nextTime', width: 135 },
          { label: '最后跟进时间', prop: 'updateTime', width: 135 },
          { label: '负责人', prop: 'ownerUserName', width: 80 },
          { label: '创建时间 ', prop: 'createTime', width: 105 }
        ]
      } else if (this.todayDetailData.crmType === 'business') {
        this.fieldList = [
          { label: '商机名称', prop: 'businessName', width: 105 },
          { label: '下次联系时间', prop: 'nextTime', width: 135 },
          { label: '最后跟进时间', prop: 'updateTime', width: 135 },
          { label: '负责人', prop: 'ownerUserName', width: 80 },
          { label: '创建时间 ', prop: 'createTime', width: 105 }
        ]
      } else if (this.todayDetailData.crmType === 'dealBusiness') {
        this.fieldList = [
          { label: '商机名称', prop: 'businessName', width: 105 },
          { label: '预计成交时间', prop: 'dealDate', width: 135 },
          { label: '最后跟进时间', prop: 'updateTime', width: 135 },
          { label: '负责人', prop: 'ownerUserName', width: 80 },
          { label: '创建时间 ', prop: 'createTime', width: 105 }
        ]
      } else if (this.todayDetailData.crmType === 'receiveContract') {
        this.fieldList = [
          { label: '合同编号', prop: 'num', width: 105 },
          { label: '客户联系人', prop: 'customerName', width: 105 },
          { label: '计划回款期数', prop: 'planNum', width: 135 },
          { label: '计划回款日期', prop: 'returnDate', width: 135 },
          { label: '计划回款方式', prop: 'returnType', width: 135 }
        ]
      } else {
        this.fieldList = [
          { label: '合同编号', prop: 'num', width: 105 },
          { label: '合同名称', prop: 'name', width: 105 },
          { label: '客户联系人', prop: 'customerName', width: 105 },
          { label: '合同金额', prop: 'money', width: 105 },
          { label: '开始日期', prop: 'startTime', width: 105 },
          { label: '结束日期', prop: 'endTime', width: 105 },
          { label: '负责人', prop: 'ownerUserName', width: 80 }
        ]
      }
      this.getList()
    },

    /**
     * 重复文字 暂时去掉
     */
    summaryText() {
      if (this.detail.repetitionType === 1) {
        return '从不重复'
      } else if (this.detail.repetitionType === 2) {
        let day = ''
        if (this.detail.repeatRate == 1) {
          day = ''
        } else {
          day = this.detail.repeatRate
        }
        return `每${day}天`
      } else if (this.detail.repetitionType === 3) {
        return `每${this.detail.repeatRate}周，每周${this.detail.repeatTime}`
      } else if (this.detail.repetitionType === 4) {
        return `每${this.detail.repeatRate}月，第${this.detail.repeatTime}天`
      } else if (this.detail.repetitionType === 5) {
        return `每${this.detail.repeatRate}年`
      }
    },
    /**
     * 获取宽度
     */
    handelFieldList(list) {
      for (let index = 0; index < list.length; index++) {
        const element = list[index]
        var width = 0
        if (!element.width) {
          if (element.name && element.name.length <= 6) {
            width = element.name.length * 15 + 45
          } else {
            width = 140
          }
        } else {
          width = element.width
        }

        this.fieldList.push({
          prop: element.fieldName,
          label: element.name,
          width: width
        })
      }
    },

    /**
     * 获取列表
     */
    getList() {
      var crmIndexRequest = this.getIndexRequest()
      const startTime = new Date(this.todayDetailData.startTime).getTime()
      const params = {
        page: this.currentPage,
        limit: this.pageSize,
        time: startTime,
        isSub: 1,
        type: 1
      }
      if (this.todayDetailData.userId) {
        params.userId = this.todayDetailData.userId
      }
      if (this.todayDetailData.crmType === 'receiveContract') {
        params.type = 2
      } else if (this.todayDetailData.crmType === 'contract') {
        params.type = 1
      }
      this.loading = true
      crmIndexRequest(params)
        .then(res => {
          this.list = res.data.list
          this.total = res.data.totalRow
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 获取列表请求
     */
    getIndexRequest() {
      if (this.todayDetailData.crmType === 'customer') {
        return canlendarTodayCustomerAPI
      } else if (this.todayDetailData.crmType == 'leads') {
        return canlendarTodayLeadsAPI
      } else if (this.todayDetailData.crmType == 'business') {
        return canlendarTodayBusinessAPI
      } else if (this.todayDetailData.crmType == 'dealBusiness') {
        return canlendarTodayDealBusinessAPI
      } else {
        return canlendarTodayContractAPI
      }
    },

    /**
     * 关闭
     */
    close() {
      this.$emit('close')
    },

    /**
     * 数据格式化
     */
    fieldFormatter(row, column, cellValue) {
      if (column.property === 'priority') {
        const list = ['无', '低', '中', '高']
        return list[cellValue]
      }
      return cellValue === '' || cellValue === null ? '--' : cellValue
    },

    /**
     * 行点击
     */
    handleRowClick(row, column, event) {
      if (this.todayDetailData.crmType === 'customer') {
        if (column.property === 'customerName') {
          this.relationID = row.customerId
          this.crmType = 'customer'
          this.showFullDetail = true
        } else {
          this.showFullDetail = false
        }
      } else if (this.todayDetailData.crmType === 'leads') {
        if (column.property === 'leadsName') {
          this.relationID = row.leadsId
          this.crmType = 'leads'
          this.showFullDetail = true
        } else {
          this.showFullDetail = false
        }
      } else if (this.todayDetailData.crmType === 'business' || this.todayDetailData.crmType === 'dealBusiness') {
        if (column.property === 'businessName') {
          this.relationID = row.businessId
          this.crmType = 'business'
          this.showFullDetail = true
        } else {
          this.showFullDetail = false
        }
      } else if (this.todayDetailData.crmType === 'receiveContract') {
        if (column.property === 'customerName') {
          this.relationID = row.customerId
          this.crmType = 'customer'
          this.showFullDetail = true
        } else if (column.property === 'num' || column.property === 'contractName') {
          this.relationID = row.contractId
          this.crmType = 'contract'
          this.showFullDetail = true
        } else {
          this.showFullDetail = false
        }
      } else {
        if (column.property === 'customerName') {
          this.relationID = row.customerId
          this.crmType = 'customer'
          this.showFullDetail = true
        } else if (column.property === 'businessName') {
          if (row.businessId) {
            this.relationID = row.businessId
            this.crmType = 'business'
            this.showFullDetail = true
          } else {
            this.showFullDetail = false
          }
        } else if (column.property === 'contactsName') {
          this.relationID = row.contactsId
          this.crmType = 'contacts'
          this.showFullDetail = true
        } else if (column.property === 'num') {
          this.relationID = row.contractId
          this.crmType = 'contract'
          this.showFullDetail = true
        } else {
          this.showFullDetail = false
        }
      }
    },
    /**
     * 每页条数改变
     */
    handleSizeChange(val) {
      this.pageSize = val
      this.getList()
    },

    /**
     * 页数改变
     */
    handleCurrentChange(val) {
      this.currentPage = val
      this.getList()
    },

    /**
     * 时间格式化
     */
    formattedTime(date) {
      const timestemp = new Date(date)
      return moment(timestemp).format('MMMDo HH:mm:ss')
    },
    /**
     * 时间格式化
     */
    timeFormatted(date) {
      if (!date) {
        return ''
      }
      date = date.replace(/-/g, '/')
      const timestemp = new Date(date)
      return moment(timestemp).format('YYYY-MM-DD')
    },
    /**
     * 更多操作
     */
    handleTypeDrop(command) {
      if (command === 'delete') {
        this.delete(command)
      } else if (command === 'deleteAll') {
        this.delete(command)
      } else if (command === 'edit') {
        this.edit(command)
      } else if (command === 'editAll') {
        this.edit(command)
      }
    },

    /**
     * 删除
     */
    delete(type) {
      this.$confirm('此操作将永久删除该日程, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const timestemp = new Date(this.detail.startTime).getTime()
        const params = {
          eventId: this.id,
          time: timestemp,
          batchId: this.detail.batchId
        }
        if (type === 'delete') {
          params.type = 1
        } else if (type === 'deleteAll') {
          params.type = 2
        }
        canlendarDeleteAPI(params).then(res => {
          this.$message.success('删除成功')
          this.$emit('deleteSuccess')
        }).catch(() => {})
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },

    /**
     * 编辑
     */
    edit(type) {
      if (type === 'editAll') {
        this.editAll = true
      } else {
        this.editAll = false
      }
      this.showCreate = true
    },

    /**
     * 编辑成功的回调
     */
    handleSure() {
      this.showCreate = false
      this.$emit('createSuccess')
    },

    /**
     *  0待审核、1审核中、2审核通过、3审核未通过
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
      if (
        column.property === 'customerName' ||
        column.property === 'leadsName' ||
        column.property === 'businessName' ||
        column.property === 'num'
      ) {
        return 'can-visit--underline'
      } else if (column.property === 'businessCheck') {
        return 'can-visit'
      } else {
        return ''
      }
    }
  }
}
</script>
<style lang="scss" scoped>
@import "@/views/crm/styles/table.scss";

.block {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 5px;
  border-radius: 4px;
}

/deep/.el-dialog__header {
  padding-top: 16px;
  padding-bottom: 0;
  line-height: 20px;

  .el-dialog__headerbtn {
    top: 22px;
  }
}

.title-text {
  font-size: 16px;
  font-weight: 500;
}

.title-message {
  width: 230px;
  color: $--color-text-regular;
}

.common-box {
  width: 100%;

  .common-title {
    font-size: 24px;
    font-weight: 600;
    line-height: 30px;
    color: $--color-black;
  }

  .common-header {
    padding-top: 24px;

    .time-text {
      margin-left: 11px;

      .text-up {
        padding-bottom: 5px;
        font-size: 18px;
      }

      .time-time {
        font-size: 12px;
        color: $--color-text-regular;
      }
    }

    .time-circle {
      display: inline-block;
      width: 32px;
      height: 32px;
      padding-left: 9px;
      line-height: 30px;
      background-color: #f7ad3d;
      border-radius: 50%;

      .wk {
        color: #fff;
      }
    }

    /deep/.el-icon-remove {
      font-size: 32px;
      color: #f56c6c;
    }
  }

  .common-content {
    padding-top: 8px;

    .content-title {
      margin-bottom: 8px;
      font-size: 12px;
      color: $--color-text-regular;
    }

    .user-img {
      margin-right: 11px;
    }
  }

  .common-foot {
    padding-top: 16px;
    padding-bottom: 16px;

    .section__hd {
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: bolder;
    }
  }

  .common-bootom {
    bottom: 18px;
    padding-top: 24px;
    overflow-x: auto;
    overflow-y: hidden;
    color: $--color-text-regular;

    .type_type {
      margin-bottom: 20px;

      p {
        margin-bottom: 10px;
      }
    }

    .type_time {
      padding: 21px 0 20px;
      background: rgba(250, 251, 252, 0.39);

      .time-start-end {
        display: flex;
        margin-bottom: 36px;

        .time-text {
          flex: 1;
        }
      }

      p {
        margin-bottom: 10px;
      }
    }

    span {
      display: inline-block;
      padding-right: 20px;
    }
  }
}

.time-time {
  font-size: $--font-size-medium;
  font-weight: 500;
  line-height: $--font-size-medium;
  color: $--color-n100;
}

.text-up {
  margin-top: 4px;
  font-size: $--font-size-medium;
  font-weight: 500;
  line-height: 20px;
  color: $--color-black;
}

.scroll_content {
  position: relative;
  height: 520px;
  padding: 0 20px;
  overflow-y: auto;
}

.related-info {
  font-weight: 600;
  color: #1b2b4b;
}

/deep/.el-dialog__body {
  padding: 20px 0 0;
}

/deep/.p-contianer .p-bar {
  margin-right: 25px;
}

.owner-list {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 38px;
  margin-right: 10px;
  margin-right: -13px;
  border: 3px solid $--color-white;
  border-radius: 50%;

  &-fold:nth-last-child(1) {
    margin-right: 0;
  }

  &-button {
    z-index: 3;
    width: 38px;
    height: 38px;
    padding: 0;
    margin-right: -13px;
    color: $--color-white;

    // background: $--color-n90;
    background: $--color-n100;
    border: 3px solid $--color-white;
    border-radius: 50%;

    &:hover {
      color: $--color-white;
      background: $--color-n100;
    }
  }
}

.owner-list-dropdown {
  width: 200px;
  max-height: 300px;
  overflow-y: auto;

  &-list {
    display: flex;
    align-items: center;
    padding-top: 5px;
    padding-bottom: 5px;
    border-left: 2px solid $--color-white;

    &:hover {
      background: $--color-n20 !important;
      border-left: 2px solid $--color-b400;
    }

    &:hover .owner-list-dropdown-i {
      display: inline-block;
      color: $--color-n500;
    }

    &:hover .owner-list-dropdown-text {
      color: $--color-n500;
    }
  }

  &-text {
    display: inline-block;
    width: 80px;
    height: 32px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.owner-button {
  z-index: 3;
  width: 38px;
  height: 38px;
  padding: 0;
  margin-right: -13px;
  color: $--color-white;

  // background: $--color-n90;
  background: $--color-n100;
  border: 3px solid $--color-white;
  border-radius: 50%;
}

</style>
