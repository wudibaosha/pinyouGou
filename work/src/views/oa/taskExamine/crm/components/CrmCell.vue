<template>
  <div class="section">
    <div class="examine-cell">
      <flexbox class="person">
        <xr-avatar
          v-if="data.createUser"
          :id="data.createUser.userId"
          :name="data.createUser.realname"
          :size="40"
          :src="data.createUser.img"
          :disabled="false"
          class="person__hd" />
        <div class="person__bd">
          <div class="person__bd-name">{{ data.createUser ? data.createUser.realname : '' }}</div>
          <div class="person__bd-des">{{ `创建审批于 ${data.createTime}` }}</div>
        </div>

        <div class="rt-setting">
          <span class="dep">
            <span>{{ getStatusName(data.examineStatus) }}</span>
          </span>
          <span
            :style="{ 'background-color': getStatusColor(data.examineStatus) }"
            class="bg-color" />
        </div>
      </flexbox>

      <div class="examine-cell__bd">
        <p
          v-if="data.content"
          class="examine-cell__bd--content">{{ data.content }}</p>

        <flexbox class="examine-content">
          <i
            :class="['wk', 'examine-content__hd', `wk-${iconObj.icon}`]"
            :style="{ backgroundColor: iconObj.color}" />
          <div class="examine-content__bd">
            <div>
              <a @click="handleClick('detail')">{{ data.category }}</a>
            </div>
            <div
              v-if="data.causeTitle"
              class="examine-content__bd--des">{{ data.causeTitle }}</div>
          </div>
        </flexbox>

        <div class="examine-stage">
          <i :class="getStatusIcon(data.examineStatus)" :style="{ color: getStatusColor(data.examineStatus) }" /><span>{{ `${data.examineName || ''}${getStatusName(data.examineStatus)}` }}</span>
        </div>

        <div
          v-if="relateData && relateData.id"
          class="examine-relate">
          <div class="examine-relate__hd">相关信息</div>
          <div class="examine-relate__bd">
            <flexbox
              align="stretch"
              class="relate-cell">
              <div class="relate-cell__hd">
                <i class="wk wk-contacts" />
                <span>{{ `相关${relateData.typeName}：` }}</span>
              </div>
              <div class="relate-cell__bd">
                <div
                  class="relate-cell__bd--item text-one-line">
                  <a @click="checkRelationDetail">{{ relateData.name }}</a>
                </div>
              </div>
            </flexbox>
          </div>
        </div>
      </div>
    </div>

    <div class="section__ft">
      <el-button
        v-if="canCheck"
        class="xr-btn--red handle-button"
        icon="wk wk-close"
        type="primary"
        @click="handleClick('reject')">拒绝</el-button>
      <el-button
        v-if="canCheck"
        class="xr-btn--green handle-button"
        icon="wk wk-success"
        type="primary"
        @click.native="handleClick('pass')">通过</el-button>
      <el-dropdown
        v-if="moreTypes.length > 0"
        trigger="click"
        style="float: right;"
        @command="handleTypeDrop">
        <el-button
          icon="el-icon-more"
          class="handle-button" />
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            v-for="(item, index) in moreTypes"
            :key="index"
            :icon="item.icon | wkIconPre"
            :command="item.type">{{ item.name }}</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import CheckStatus from '@/mixins/CheckStatusMixin'

export default {
  // 合同和回款审批布局
  name: 'CrmCell',
  components: {},
  mixins: [CheckStatus],
  props: {
    crmType: String,
    data: Object,
    section: Number,
    index: Number
  },
  data() {
    return {}
  },
  computed: {
    iconObj() {
      return {
        icon: this.crmType,
        color: {
          contract: '#FD5B4A',
          receivables: '#FFB940',
          invoice: '#1cbaf5'
        }[this.crmType] || 'blue'
      }
    },

    relateData() {
      if (this.crmType == 'contract') {
        return {
          type: 'customer',
          typeName: '客户',
          id: this.data.categoryCiteId,
          name: this.data.categoryCiteName
        }
      } else if (this.crmType == 'receivables') {
        return {
          type: 'contract',
          typeName: '合同',
          id: this.data.categoryCiteId,
          name: this.data.categoryCiteName
        }
      }

      return null
    },

    moreTypes() {
      const mores = []
      if (this.data.permission) {
        if (this.data.permission.isRecheck) {
          mores.push({ type: 'withdraw', name: '撤销', icon: 'reset' })
        }
      }
      return mores
    },

    /**
     * 是否能审核 通过拒绝
     */
    canCheck() {
      return this.data.permission && this.data.permission.isCheck
    }
  },
  watch: {},
  mounted() {},

  beforeDestroy() {},
  methods: {
    handleClick(type) {
      this.$emit('handle', type, this.data, this.index, this.section)
    },

    checkRelationDetail() {
      this.$emit(
        'handle',
        'relate-detail',
        this.relateData,
        this.index,
        this.section
      )
    },

    handleTypeDrop(command) {
      this.$emit('handle', command, this.data, this.index, this.section)
    }
  }
}
</script>

<style lang="scss" scoped>
.section {
  margin-bottom: 15px;
  background-color: white;
  border: 1px solid $--border-color-base;
  border-radius: $--border-radius-base;

  &__ft {
    padding-right: 10px;
    overflow: hidden;
    background-color: #f4f7ff;
  }
}

.handle-button {
  float: right;
  padding: 6px 10px;
  margin: 5px 5px 5px 0;
}

.examine-cell {
  padding: 15px;

  &__bd {
    margin-top: 20px;
    margin-left: 40px;

    &--content {
      font-size: 13px;
      color: $--color-text-primary;
    }
  }
}

// 审批内容
.examine-content {
  padding: 5px;
  margin-top: 15px;
  background-color: #f4f7ff;

  &__hd {
    display: block;
    padding: 7px 8px;
    margin-right: 8px;
    color: white;
    border-radius: 5px;
  }

  &__bd {
    flex: 1;

    a {
      font-size: 12px;
      color: $--color-primary;
    }

    a:hover {
      text-decoration: underline;
    }

    &--des {
      margin-top: 3px;
      font-size: 12px;
      color: $--color-text-secondary;
    }
  }
}

// 人 信息
.person {
  &__hd {
    margin-right: 8px;
  }

  &__bd {
    flex: 1;

    &-name {
      font-size: 13px;
      color: $--color-text-primary;
    }

    &-des {
      margin-top: 3px;
      font-size: 12px;
      color: $--color-text-secondary;
    }
  }
}

// 审核阶段
.examine-stage {
  margin-top: 15px;
  font-size: 12px;
  color: $--color-text-primary;

  i {
    margin-right: 5px;
    font-size: 12px;
    color: #ffa22a;
  }
}

// 状态展示
.rt-setting {
  float: right;
  font-size: 12px;
  line-height: 30px;

  .dep {
    margin-right: 5px;
    color: $--color-text-primary;
  }

  img {
    width: 16px;
    vertical-align: middle;
    cursor: pointer;
  }

  .bg-color {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 5px;
    border-radius: 50%;
  }
}

/** 关联附件 联系人 客户 行布局 */
.examine-relate {
  &__hd {
    padding: 8px 0;
    margin-top: 10px;
    font-size: 13px;
    font-weight: 400;
    color: $--color-text-primary;
  }
}

.relate-cell {
  padding: 5px 0;
  font-size: 12px;

  &__hd {
    flex-shrink: 0;
    margin-right: 5px;
    color: $--color-text-primary;

    i {
      font-size: 13px;
      color: $--color-text-regular;
    }
  }

  &__bd {
    &--item {
      margin-bottom: 3px;

      a {
        color: $--color-primary;
      }

      a:hover {
        text-decoration: underline;
      }
    }

    &--item + &--item {
      margin-bottom: 5px;
    }

    a {
      color: $--color-primary;
    }

    a:hover {
      text-decoration: underline;
    }
  }
}
</style>
