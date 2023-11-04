<template>
  <wk-head-section
    v-if="examineFlowList && examineFlowList.length > 0"
    v-loading="loading"
    label="审批流信息">

    <el-popover
      slot="right"
      ref="popover"
      v-model="showFlowPopover"
      :placement="placement"
      width="300"
      trigger="click">
      <check-flow
        :id="recordId"
        ref="checkFlow"
        :show="showFlowPopover"
        :examine-type="examineType"
        @close="showFlowPopover=false" />
      <el-button
        slot="reference"
        style="margin-right: 8px;"
        type="text"
        @click.stop="">查看历史审批流程</el-button>
    </el-popover>

    <!-- 固定 -->
    <el-timeline>
      <el-timeline-item
        v-for="(item, index) in examineFlowList"
        :key="index"
        hide-timestamp>
        <i
          slot="dot"
          :class="getStatusIcon(item.examineStatus)"
          :style="{
            color: getStatusColor(item.examineStatus)
          }"
          class="examine-item-icon" />
        <div class="examine-item">
          <div class="examine-item__hd ei">
            <div>
              <span class="ei-name">{{ getDetailName(item) }}</span><span class="ei-status">{{ getStatusName(item.examineStatus) }}</span>
            </div>
            <div v-if="item.userList.length === 1" class="ei-time">{{ item.userList[0].examineTime }}</div>
          </div>
          <div v-if="item.userList.length > 1" class="examine-item__bd">
            <div
              v-for="(subItem, subIndex) in item.userList"
              :key="subIndex"
              class="examine-item__hd ei">
              <div>
                <span class="ei-name">{{ subItem.realname }}</span><span class="ei-status">{{ getStatusName(subItem.examineStatus) }}</span>
              </div>
              <div class="ei-time">{{ subItem.examineTime }}</div>
            </div>
          </div>
        </div>
        <!-- <flexbox align="stretch" class="examine-item">
          <div class="examine-item-label">{{ getDetailName(item) }}</div>
          <div class="examine-item-subs">
            <div
              v-for="(subItem, subIndex) in item.userList"
              :key="subIndex"
              class="examine-sub">
              <i :style="{ color: getStatusColor(subItem.examineStatus) }" :class="['examine-icon', getStatusIcon(subItem.examineStatus)] " />
              <span class="examine-realname">{{ subItem.realname }}</span><span class="examine-status">{{ getStatusName(subItem.examineStatus) }}</span>
            </div>
          </div>
        </flexbox> -->
      </el-timeline-item>
    </el-timeline>

    <div class="handle">
      <el-button
        v-if="examineInfo.isCheck == 1"
        type="success"
        icon="wk wk-success"
        @click="examineHandle(1)">通过</el-button>
      <el-button
        v-if="examineInfo.isCheck == 1"
        type="danger"
        icon="wk wk-close"
        @click="examineHandle(2)">拒绝</el-button>
      <el-button
        v-if="examineInfo.isRecheck == 1"
        icon="wk wk-reset"
        @click="examineHandle(4)">撤回</el-button>
    </div>

    <!-- 操作 -->
    <examine-handle
      :field-form="fieldForm"
      :field-list="fieldList"
      :id="id"
      ref="child"
      :show="examineHandleShow"
      :record-id="recordId"
      :examine-type="examineType"
      :detail="examineInfo"
      :status="examineHandleInfo.status"
      @close="examineHandleShow = false"
      @save="examineHandleClick" />
  </wk-head-section>
</template>
<script type="text/javascript">
import { examineRecordQueryListAPI } from '@/api/examine' // 审批步骤
import { filedGetFieldAPI } from '@/api/crm/common'
import { crmContractgetPriceRangeAPI } from '@/api/crm/contract'
import Nzhcn from 'nzh/cn'
import ExamineHandle from './ExamineHandle' // 审批操作理由
import CheckFlow from './CheckFlow' // 审批流程
import WkHeadSection from '@/components/NewCom/WkHeadSection'

import CheckStatusMixin from '@/mixins/CheckStatusMixin'
import { wayTypeObj } from '@/components/ApprovalFlow/nodeModel'

// 审核信息 config 1 固定 0 自选
export default {
  name: 'ExamineInfoSection', // 合同审核操作
  components: {
    ExamineHandle,
    CheckFlow,
    WkHeadSection
  },
  filters: {
    stepName: function(index) {
      return '第' + Nzhcn.encodeS(index) + '级'
    }
  },
  mixins: [CheckStatusMixin],
  props: {
    examineType: {
      type: String,
      default: ''
    },
    placement: {
      type: String,
      default: 'bottom'
    },
    id: [String, Number],
    // 审批流id
    recordId: [String, Number],
    ownerUserId: [String, Number]
  },
  data() {
    return {
      fieldForm:{},
      fieldList: [],
      loading: false,
      examineInfo: {}, // 审核信息
      showFlowPopover: false,
      examineHandleInfo: { status: 1 }, // 1 审核通过 2 审核拒绝 4 已撤回
      examineHandleShow: false // 审核操作
    }
  },
  computed: {
    examineFlowList() {
      return this.examineInfo.examineFlowList ? this.examineInfo.examineFlowList : []
    }
  },
  watch: {
    recordId: {
      handler(val) {
        if (val) {
          this.examineInfo = {}
          this.getFlowStepList()
          if (this.$refs.checkFlow) {
            this.$refs.checkFlow.getDetail()
          }
        }
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {},
  methods: {
    /**
     * 详情
     */
    getFlowStepList() {
      if (!this.recordId) {
        return
      }
      this.loading = true
      examineRecordQueryListAPI({
        recordId: this.recordId,
        ownerUserId: this.ownerUserId
      })
        .then(res => {
          this.loading = false
          const resData = res.data || {}
          this.examineInfo = resData
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 撤回审核 通过 拒绝
     */
    examineHandle(status) {
      if (this.examineType === 'crm_contract') {
        
        filedGetFieldAPI({label: 6, id: this.id}).then( res=>{
          let fieldList = res.data
          fieldList.forEach((element, index) => {
            this.fieldList[index] = element.filter(item=>item.name == '价格区间')
          });
          this.fieldList = this.fieldList.filter(item=>item.length>0)
          this.fieldList.map(item=>{
            item.map(i=>{
              i.field = i.fieldName
              this.fieldForm[i.fieldName] = i.value
            })
          })
        })


      }
      this.examineHandleInfo.status = status
      if (status == 4 && this.$store.state.user.userInfo.userId == this.examineInfo.createUser.userId) {
        this.$refs.child.submitInfo(4)
        return
      }
      this.examineHandleShow = true
    },

    /**
     * 审批操作点击
     */
    examineHandleClick(data) {
      this.getFlowStepList()
      if (this.$refs.checkFlow) {
        this.$refs.checkFlow.getDetail()
      }
      this.$emit('on-handle', data)
    },

    /**
     * 获取名称
     */
    getDetailName(data) {
      if (!data.userList || data.userList.length === 0) {
        return 'XX'
      } else if (data.userList.length === 1) {
        return data.userList[0].realname
      } else if (data.examineType === 5) {
        return `${data.userList.length}人${wayTypeObj[1]}`
      } else {
        return `${data.userList.length}人${wayTypeObj[data.type]}`
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.wk-head-section {
  .handle {
    display: flex;
    justify-content: flex-end;

    .xr-btn--green,
    .xr-btn--red {
      color: white;
    }
  }
}

/** 审核流程 */
.check-items {
  overflow-x: auto;
  line-height: 2;
}

.check-item {
  flex-shrink: 0;
  width: auto;

  .check-item-name {
    margin-right: $--interval-base;
    font-size: 16px;
  }

  .check-item-status {
    color: $--color-text-secondary;
  }

  .check-item-arrow {
    margin: 0 #{$--interval-base * 2};
    font-size: 13px;
  }
}

// 固定审批流详情
.examine-item {
  &-icon {
    margin-left: -4px;
    font-size: 18px;
    background-color: white;
  }

  .ei {
    &-name {
      font-size: 16px;
      color: $--color-black;
    }

    &-status {
      font-size: 14px;
      color: $--color-text-secondary;
    }

    &-time {
      margin-top: 4px;
      font-size: 12px;
      color: $--color-n70;
    }

    span + span {
      margin-left: 4px;
    }
  }

  .ei + .ei {
    margin-top: 4px;
  }

  &__bd {
    margin-top: 4px;

    .ei-name {
      font-size: 14px;
    }

    .ei-status {
      font-size: 12px;
    }
  }

  // &-label {
  //   width: 80px;
  //   color: $--color-text-secondary;
  // }

  // &-subs {
  //   .examine-sub + .examine-sub {
  //     margin-top: 4px;
  //   }
  //   .examine-icon {
  //     width: 12px;
  //   }
  //   .examine-realname {
  //     margin-left: 8px;
  //   }

  //   .examine-status {
  //     margin-left: 8px;
  //     color: $--color-text-secondary;
  //   }
  // }
}
</style>
