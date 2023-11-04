<template>
  <div v-if="data && data.length === 0" class="tips">审核人为空，审核将自动通过。</div>
  <el-timeline v-else>
    <el-timeline-item
      v-for="(flow, index) in data"
      :key="index"
      class="wk-approval-item">
      <div class="wk-approval-item__header">{{ flow.name }}<span>{{ getExamineTypeName(flow.examineType) }}</span></div>
      <div class="wk-approval-item__body">
        <template v-if="flow.examineType === 4">
          <flexbox
            class="user-wrap"
            wrap="wrap">
            <div
              v-for="(item, index) in flow.values"
              :key="index"
              class="user">
              <xr-avatar
                :name="item.realname"
                :size="40"
                :src="item.img"
              />
              <div class="user__name">{{ item.realname }}</div>
              <div class="user__step">{{ (index+1)|step }}</div>
              <i class="user__delete el-icon-close" @click="deleteUserClick(index, flow.values)" />
            </div>
            <div
              v-if="(flow.chooseType === 1 && flow.values.length === 0) ||
                (flow.chooseType === 2 && flow.values.length < 20)"
              class="user">
              <el-button
                class="user__img"
                icon="el-icon-plus"
                style="margin-bottom: 8px;"
                circle
                @click="selectUserClick(flow)" />
              <div class="user__name">{{ getSelfSelectName(flow) }}</div>
              <div class="user__step">{{ (flow.values.length + 1)|step }}</div>
            </div>
          </flexbox>
        </template>

        <template v-else-if="flow.examineType === 1 || flow.examineType === 3">
          <flexbox
            v-if="flow.userList.length === 1"
            class="user-wrap"
            wrap="wrap">
            <div
              v-for="(item, index) in flow.userList"
              :key="index"
              class="user">
              <xr-avatar
                :name="item.realname"
                :size="40"
                :src="item.img"
              />
              <div class="user__name">{{ item.realname }}</div>
              <div class="user__step">{{ (index+1)|step }}</div>
            </div>
          </flexbox>
          <flexbox
            v-else
            class="user-wrap"
            wrap="wrap">
            <el-popover
              :disabled="flow.userList.length==0"
              :content="flow.userList|contentFilters"
              placement="bottom"
              trigger="hover">
              <div
                slot="reference"
                class="user">
                <img class="user__img" src="@/assets/img/examine_head.png">
                <div class="user__name">{{ flow.userList.length }}人{{ getWayTypeName(flow.type) }}</div>
                <div class="user__step">第一级</div>
              </div>
            </el-popover>
          </flexbox>
        </template>

        <template v-else-if="flow.examineType === 2 || flow.examineType === 5">
          <flexbox
            v-if="flow.userList.length === 1"
            class="user-wrap"
            wrap="wrap">
            <div
              v-for="(item, index) in flow.userList"
              :key="index"
              class="user">
              <xr-avatar
                :name="item.realname"
                :size="40"
                :src="item.img"
              />
              <div class="user__name">{{ item.realname }}</div>
              <div class="user__step">{{ (index+1)|step }}</div>
            </div>
          </flexbox>
          <flexbox
            v-else-if="flow.type != 1"
            class="user-wrap"
            wrap="wrap">
            <el-popover
              :disabled="flow.userList.length==0"
              :content="flow.userList|contentFilters"
              placement="bottom"
              trigger="hover">
              <div
                slot="reference"
                class="user">
                <img class="user__img" src="@/assets/img/examine_head.png">
                <div class="user__name">{{ flow.userList.length }}人{{ getWayTypeName(flow.type) }}</div>
                <div class="user__step">第一级</div>
              </div>
            </el-popover>
          </flexbox>
          <flexbox
            v-else-if="flow.userList.length > 0"
            class="user-wrap"
            wrap="wrap">
            <div
              v-for="(item, index) in flow.userList"
              :key="index"
              class="user">
              <xr-avatar
                :name="item.realname"
                :size="40"
                :src="item.img"
              />
              <div class="user__name">{{ item.realname }}</div>
              <div class="user__step">{{ (index+1)|step }}</div>
            </div>
          </flexbox>
          <flexbox
            v-else
            class="user-wrap"
            wrap="wrap">
            <div
              class="user">
              <img class="user__img" src="@/assets/img/examine_head.png">
              <div class="user__name">XX</div>
              <div class="user__step">第一级</div>
            </div>
          </flexbox>
        </template>
      </div>
    </el-timeline-item>

    <wk-dep-user-dialog
      v-if="depUserViewDialogShow"
      :props="{
        showUser: !userOptions,
        showDept: false,
        showDisableUser: !!userOptions,
        disableUserList: userOptions,
        disableUserLabel: '员工'
      }"
      radio
      :visible.sync="depUserViewDialogShow"
      @change="selectUserChange"
    />
  </el-timeline>
</template>

<script>
import WkDepUserDialog from '@/components/NewCom/WkUserDialogSelect/Dialog'

import { examineTypeObj, wayTypeObj } from '@/components/ApprovalFlow/nodeModel'
import Nzhcn from 'nzh/cn'

export default {
  // 审批流的应用参数
  name: 'WkApprovalFlowApply',

  components: {
    WkDepUserDialog
  },

  filters: {
    step: function(index) {
      return '第' + Nzhcn.encodeS(index) + '级'
    },

    contentFilters: function(array) {
      return array
        .map(item => item.realname)
        .join('、')
    }
  },

  props: {
    data: Array
  },

  data() {
    return {
      userOptions: [],
      editItem: null,
      depUserViewDialogShow: false
    }
  },

  computed: {},

  watch: {},

  created() {},

  mounted() {},

  beforeDestroy() {},

  methods: {
    /**
     * 获取审批类型名称
     */
    getExamineTypeName(examineType) {
      return examineTypeObj[examineType]
    },

    /**
     * 获取或并方式
     */
    getWayTypeName(type) {
      return wayTypeObj[type]
    },

    /**
     * 选择员工
     */
    selectUserClick(item) {
      this.userOptions = item.rangeType === 1 ? null : item.userList
      this.editItem = item
      this.depUserViewDialogShow = true
    },

    /**
     * 选择员工change
     */
    selectUserChange(usersIds, _, users) {
      if (users.length) {
        const userIds = this.editItem.values.map(item => item.userId)
        if (!userIds.includes(users[0].userId)) {
          this.editItem.values.push(users[0])
        }
      }
    },

    /**
     * 获取自选名称
     */
    getSelfSelectName(data) {
      if (data.chooseType === 1) {
        return '选择员工'
      } else if (data.chooseType === 2) {
        return {
          2: '多人会签',
          3: '多人或签'
        }[data.type] || '选择员工'
      }
    },

    /**
     * 删除user
     */
    deleteUserClick(index, list) {
      list.splice(index, 1)
    }
  }
}
</script>

<style lang="scss" scoped>
.tips {
  color: $--color-text-regular;
}

.wk-approval-item {
  &__header {
    span {
      display: inline-block;
      padding: 0 8px;
      font-size: 12px;
      line-height: 18px;
      color: white;
      background: $--color-danger;
      border-radius: 9px;
      transform: scale(0.8, 0.8);
    }
  }

  &__body {
    margin-top: $--interval-base;

    .user-wrap {
      padding: 0 $--interval-base;
      text-align: center;

      .user {
        position: relative;
        padding: $--interval-base #{$--interval-base * 3} $--interval-base 0;

        .user__img {
          width: 40px;
          height: 40px;
          border-radius: 20px;
        }

        .user__name {
          margin-top: 4px;
          margin-bottom: 4px;
          overflow: hidden;
          font-size: 12px;
          color: $--color-text-secondary;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user__step {
        }

        &__delete {
          position: absolute;
          top: 12px;
          right: 25px;
          font-size: 12px;
          color: white;
          cursor: pointer;
          visibility: hidden;
          background-color: #b2b2b2;
          border-radius: 6px;

          &:hover {
            background-color: $--color-primary;
          }
        }

        &:hover {
          .user__delete {
            visibility: visible;
          }
        }
      }
    }
  }
}
</style>
