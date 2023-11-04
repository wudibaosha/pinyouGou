<template>
  <div
    v-loading="loading"
    class="stage-state-main">
    <flexbox
      :style="{'opacity' : detail.finalStatus != 0 ? 1 : 1}"
      class="stage-state">
      <a
        v-for="(item, index) in status.settingList"
        :key="index">
        <div
          v-if="status.settingList.length -1 !=index"
          slot="reference"
          :class="[item.class, {'state-check':index===statusIndex, 'is-center': index !== 0 }]"
          :title="item.flowName"
          class="stage-state-item"
          @click="handleStatuChange(item, index)">
          <div class="stage-name text-one-ellipsis">{{ item.flowName }}</div>
          <div v-if="!(item.rate === null || item.rate === undefined) && rateShow" class="stage-value">{{ `${item.rate}%` }}</div>
          <div
            v-if="index==0"
            class="state-circle circle-left" />
          <div
            v-if="index!=0"
            class="state-arrow arrow-left" />
          <div class="state-arrow arrow-right" />
        </div>

        <template v-else>
          <!-- 操作 -->
          <el-popover
            v-if="item.type == 0"
            :disabled="disabled"
            popper-class="no-padding-popover"
            placement="bottom"
            width="150"
            trigger="hover">
            <div
              class="state-handel-cont">
              <flexbox
                v-for="(item, index) in statuHandleItems"
                :key="index"
                class="state-handel-item"
                @click.native="handleStatuResult(item, index)">
                <i :style="{ color: item.iconColor }" :class="item.icon" class="state-handel-item-img" />
                <div class="state-handel-item-name">{{ item.name }}</div>
                <div class="state-handel-item-value">{{ item.value }}</div>
              </flexbox>
            </div>
            <div
              slot="reference"
              :class="item.class"
              class="stage-state-item">
              <i
                :class="item.overIcon"
                style="margin-right: 8px;" />
              {{ item.name }}
              <div class="state-arrow arrow-left" />
              <div class="state-circle circle-right" />
            </div>
          </el-popover>
          <!-- 商机输单，无效单 -->
          <el-popover
            v-else-if="(item.type == 2 || item.type == 3) && rateShow"
            :title="item.title"
            :content="item.remark"
            placement="bottom"
            width="150"
            trigger="hover">
            <div
              slot="reference"
              :class="item.class"
              :title="item.detail"
              class="stage-state-item">
              <i
                :class="item.overIcon"
                class="stage-icon" />
              <div class="stage-name text-one-ellipsis">{{ item.name }}</div>
              <div v-if="!(item.rate === null || item.rate === undefined) && rateShow" class="stage-value">{{ `${item.rate}%` }}</div>
              <div class="state-arrow arrow-left" />
              <div class="state-circle circle-right" />
            </div>
          </el-popover>
          <!-- 展示 -->
          <div
            v-else
            :class="item.class"
            :title="item.detail"
            class="stage-state-item">
            <i
              :class="item.overIcon"
              class="stage-icon" />
            <div class="stage-name text-one-ellipsis">{{ item.name }}</div>
            <div v-if="!(item.rate === null || item.rate === undefined) && rateShow" class="stage-value">{{ `${item.rate}%` }}</div>
            <div class="state-arrow arrow-left" />
            <div class="state-circle circle-right" />
          </div>
        </template>
      </a>
    </flexbox>
  </div>
</template>

<script>

export default {
  name: 'Stage',
  props: {
    /** 模块ID */
    id: [String, Number],
    /** 模块类型 */
    crmType: {
      type: String,
      default: ''
    },
    /** 详情信息*/
    detail: {
      type: Object,
      default: () => {
        return {}
      }
    },
    /** 状态数据 */
    status: {
      type: Object,
      default: () => {
        return {
          settingList: []
        }
      }
    },
    // 公海里面限制操作
    isSeas: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      statusIndex: '' // 选中的阶段下标
    }
  },
  computed: {
    // 禁止编辑
    disabled() {
      return this.isSeas || !(this.status && this.status.finalStatus == 0) // 0 是进行中可编辑
    },

    // 仅商机展示完成率
    rateShow() {
      return this.crmType == 'business'
    },

    // 完结状态
    statuHandleItems() {
      if (this.rateShow) {
        return [
          {
            name: '赢单',
            type: 1,
            value: '100%',
            iconColor: '#00875A',
            icon: 'wk wk-icon-success'
          },
          {
            name: '输单',
            type: 2,
            value: '0%',
            iconColor: '#DE350B',
            icon: 'wk wk-icon-refuse'
          },
          {
            name: '无效',
            type: 3,
            value: '0%',
            iconColor: '#DFE1E6',
            icon: 'wk wk-icon-uncommitted'
          }
          // {
          //   name: '冻结',
          //   type: 4,
          //   value: '',
          //   iconColor: '#FF8B00',
          //   icon: 'wk wk-icon-snow'
          // }
        ]
      } else {
        return [
          {
            name: this.status.successName,
            type: 1,
            value: '',
            iconColor: '#00875A',
            icon: 'wk wk-icon-success'
          },
          {
            name: this.status.failedName,
            type: 2,
            value: '',
            iconColor: '#DE350B',
            icon: 'wk wk-icon-refuse'
          }
        ]
      }
    }
  },
  methods: {
    /**
     * 操作状态改变
     */
    handleStatuChange(item, index) {
      // 状态一直可点击查看

      this.statusIndex = index
      // 仅查看详情作用
      this.$emit('change', item)
    },

    /**
     * 完结状态结果
     */
    handleStatuResult(item, index) {
      if (this.disabled) return

      this.$confirm('确定设为' + item.name + '吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          this.$emit('handleStatuResult', item)
        })
        .catch(() => {})
    }
  }

}
</script>

<style lang="scss" scoped>
/* stylelint-disable-next-line scss/dollar-variable-pattern */
$--state-height: 22px;

.stage-state-main {
  background-color: white;
}

.stage-state {
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
  padding-left: 5px;
  overflow-x: auto;

  a {
    flex-shrink: 0;
    margin-top: 5px;
  }
}

.stage-state-item {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 120px;
  height: $--state-height;
  padding: 0 8px;
  margin-right: $--interval-base;
  line-height: $--state-height;

  &.is-center {
    padding-left: 16px;
  }

  > .stage-icon {
    flex-shrink: 0;
    margin-right: 8px;
  }

  > .stage-name {
    flex: 1;
  }

  > .stage-value {
    z-index: 2;
    flex-shrink: 0;
    padding-left: 4px;
  }

  .state-circle {
    position: absolute;
    z-index: -1;
    width: $--state-height;
    height: $--state-height;
    background-color: white;
    border-radius: $--border-radius-base;
  }

  .state-arrow {
    position: absolute;
    width: $--state-height;
    height: $--state-height;
    background-color: white;
    transform: scale(0.707) rotate(45deg);
  }

  &.state-check {
    color: white;
    background-color: $--color-primary;

    .circle-left {
      background-color: $--color-primary;
      border-color: $--color-primary;
    }

    .circle-right {
      background-color: $--color-primary;
      border-color: $--color-primary;
    }

    .arrow-left {
      background-color: white;
      border-color: $--color-primary;
    }

    .arrow-right {
      background-color: $--color-primary;
      border-color: $--color-primary;
    }
  }
}

.state-undo {
  background-color: $--color-n20;

  .state-circle {
    background-color: $--color-n20;
  }

  .state-arrow {
    background-color: white;
  }

  .arrow-right {
    background-color: $--color-n20;
  }
}

// .state-doing {
//   border-top: 1px solid $--color-b300;
//   border-bottom: 1px solid $--color-b300;
//   background-color: white;
//   color: $--color-b300;
//   .circle-left {
//     border-color: $--color-b300;
//     background-color: white;
//     top: -1px;
//     left: -4px;
//     border-top: 1px solid $--color-b300;
//     border-left: 1px solid $--color-b300;
//     border-bottom: 1px solid $--color-b300;
//   }
//   .circle-right {
//     border-top-width: 1px;
//     border-right-width: 1px;
//     border-bottom-width: 1px;
//     border-style: solid;
//     border-color: $--color-b300;
//     background-color: white;
//   }

//   .circle-right {
//     top: -1px;
//   }
//   .arrow-left {
//     border-color: $--color-b300;
//     background-color: white;
//     border-top: 1px solid $--color-b300;
//     border-right: 1px solid $--color-b300;

//   }
//   .arrow-right {
//     border-color: $--color-b300;
//     background-color: white;
//     border-top: 1px solid $--color-b300;
//     border-right: 1px solid $--color-b300;
//   }

//   .arrow-right {
//     top: -1px;
//     right: -11px;
//   }
//   .arrow-left {
//     top: -1px;
//     left: -17px;
//   }
// }

.state-doing {
  color: white;
  background-color: $--color-b400;

  .circle-left {
    background-color: $--color-b400;
    border-color: $--color-b400;
  }

  .circle-right {
    background-color: $--color-b400;
    border-color: $--color-b400;
  }

  .arrow-left {
    background-color: white;
    border-color: $--color-b400;
  }

  .arrow-right {
    background-color: $--color-b400;
    border-color: $--color-b400;
  }
}

.state-suc {
  color: white;
  background-color: $--color-b300;

  .circle-left {
    background-color: $--color-b300;
    border-color: $--color-b300;
  }

  .circle-right {
    background-color: $--color-b300;
    border-color: $--color-b300;
  }

  .arrow-left {
    background-color: white;
    border-color: $--color-b300;
  }

  .arrow-right {
    background-color: $--color-b300;
    border-color: $--color-b300;
  }
}

.state-fail {
  color: white;
  background-color: $--color-danger;

  .circle-left {
    background-color: $--color-danger;
    border-color: $--color-danger;
  }

  .circle-right {
    background-color: $--color-danger;
    border-color: $--color-danger;
  }

  .arrow-left {
    background-color: white;
    border-color: $--color-danger;
  }

  .arrow-right {
    background-color: $--color-danger;
    border-color: $--color-danger;
  }
}

.state-invalid {
  background-color: $--color-n30;

  .state-circle {
    background-color: $--color-n30;
    border-color: $--color-n30;
  }

  .state-arrow {
    background-color: $--color-n30;
    border-color: $--color-n30;
  }

  .circle-left {
    background-color: $--color-n30;
    border-color: $--color-n30;
  }

  .circle-right {
    background-color: $--color-n30;
    border-color: $--color-n30;
  }

  .arrow-left {
    background-color: white;
    border-color: $--color-n30;
  }

  .arrow-right {
    background-color: $--color-n30;
    border-color: $--color-n30;
  }
}

.arrow-right {
  top: 0;
  right: -11px;
  z-index: 1;
}

.arrow-left {
  top: 0;
  left: -12px;
}

.circle-right {
  top: 0;
  right: -9px;
  z-index: 1;
}

.circle-left {
  top: 0;
  left: -2px;
}

/** 状态操作布局 */
.state-handel-cont {
  font-size: 13px;

  .state-handel-item {
    padding: 8px 16px;
    cursor: pointer;

    .state-handel-item-img {
      display: block;
      flex-shrink: 0;
      margin-right: 8px;
    }

    .state-handel-item-name {
      flex: 1;
    }

    .state-handel-item-value {
      flex-shrink: 0;
    }
  }

  .state-handel-item:hover {
    background-color: #f7f8fa;
  }
}
</style>
