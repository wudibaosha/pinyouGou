<template>
  <el-dialog
    :visible="visible"
    :append-to-body="true"
    :close-on-click-modal="false"
    width="800px"
    custom-class="no-padding-dialog"
    @close="closeClick">
    <span slot="title" class="el-dialog__title">设置目标<i
      class="wk wk-icon-fill-help wk-help-tips"
      data-type="24"
      data-id="227" /></span>
    <div v-loading="loading" class="add-goal">
      <flexbox class="select-wrapper">
        <flexbox-item class="select-item">
          <flexbox>
            <span class="select-label">{{ rangeLabel }}</span>
            <wk-user-dialog-select
              v-if="type == 'user'"
              v-model="selectDepOrUser"
              :radio="false"
              class="select-condition"
              placeholder="选择人员" />
            <wk-dept-dialog-select
              v-else
              v-model="selectDepOrUser"
              :radio="false"
              class="select-condition" />
          </flexbox>
        </flexbox-item>
        <flexbox-item class="select-item">
          <span class="select-label">考核指标</span>
          <el-select
            v-model="typeSelect"
            class="select-condition">
            <el-option
              v-for="item in [{label:'合同金额', value:1},{label:'回款金额', value:2}]"
              :key="item.value"
              :label="item.label"
              :value="item.value" />
          </el-select>
        </flexbox-item>
      </flexbox>

      <div class="add-goal__handle">
        <el-date-picker
          v-model="dateSelect"
          :clearable="false"
          type="year"
          value-format="yyyy"
          placeholder="选择年" />
        <span class="handle-label">年度业务目标是 ¥ </span>
        <el-input
          v-model="totalGoal"
          class="total-input"
          type="number"
          @input="inputChange('total')" />
        <span class="handle-label">元</span>
        <el-button type="primary" @click="averageClick">平均分配到每月</el-button>
      </div>

      <flexbox class="add-goal__set">
        <flexbox-item
          v-for="(item, index) in quarterList"
          :key="index"
          class="set-item">
          <div class="set-item__hd">
            <p>{{ item.title }}</p>
            <el-input
              v-model="item.all"
              disabled
              type="number" />
          </div>
          <div class="set-item__bd">
            <div class="set-item-wrapper">
              <span class="set-item__label">{{ getSetLabe(index, 0) }}</span>
              <el-input
                v-model="item.first"
                class="set-item__input"
                type="number"
                @input="inputChange('sub', item, 'first')"
                @blur="inputBlur(index)" />
            </div>
            <div class="set-item-wrapper">
              <span class="set-item__label">{{ getSetLabe(index, 1) }}</span>
              <el-input
                v-model="item.second"
                class="set-item__input"
                type="number"
                @input="inputChange('sub', item, 'second')"
                @blur="inputBlur(index)" />
            </div>
            <div class="set-item-wrapper">
              <span class="set-item__label">{{ getSetLabe(index, 2) }}</span>
              <el-input
                v-model="item.third"
                class="set-item__input"
                type="number"
                @input="inputChange('sub', item, 'third')"
                @blur="inputBlur(index)" />
            </div>
          </div>
        </flexbox-item>
      </flexbox>
    </div>
    <span
      slot="footer"
      class="dialog-footer">
      <el-button
        type="primary"
        @click="sureClick">确定</el-button>
      <el-button @click="closeClick">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import {
  crmAchievementAdd
} from '@/api/admin/crm'

import WkUserDialogSelect from '@/components/NewCom/WkUserDialogSelect'
import WkDeptDialogSelect from '@/components/NewCom/WkDeptDialogSelect'

import moment from 'moment'
import NP from 'number-precision'

export default {
  // 新建目标
  name: 'AddGoal',
  components: {
    WkDeptDialogSelect,
    WkUserDialogSelect
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // department user
    type: String
  },
  data() {
    return {
      loading: false,

      typeSelect: 1,
      dateSelect: '',
      selectDepOrUser: [],
      totalGoal: '0',

      quarterList: []
    }
  },
  computed: {
    rangeLabel() {
      return this.type === 'user' ? '考核人员' : '考核部门'
    }
  },
  watch: {
    visible(value) {
      if (value) {
        this.resetData()
      }
    }
  },
  mounted() {
  },

  beforeDestroy() {},
  methods: {
    /**
     * 确定
     */
    sureClick() {
      if (!this.selectDepOrUser.length) {
        this.$message.error(`请选择考核${this.type == 'user' ? '员工' : '部门'}`)
      } else {
        const params = {
          type: this.type == 'user' ? 3 : 2, // 2 部门 3 员工
          year: this.dateSelect,
          status: this.typeSelect,
          yeartarget: this.totalGoal
        }

        for (let index = 0; index < this.quarterList.length; index++) {
          const element = this.quarterList[index]
          params[this.getUploadKey(index, 0)] = element.first
          params[this.getUploadKey(index, 1)] = element.second
          params[this.getUploadKey(index, 2)] = element.third
        }

        params.objIds = this.selectDepOrUser

        this.loading = true
        crmAchievementAdd(params).then(res => {
          this.loading = false
          this.$message.success('操作成功')
          this.$emit('success')
          this.closeClick()
        }).catch(() => {
          this.loading = false
        })
      }
    },

    /**
     * 输入
     */
    inputChange(type, item, key) {
      if (type == 'total') {
        if (!this.totalGoal) {
          this.totalGoal = '0'
        } else {
          this.totalGoal = this.totalGoal.replace(
            /^(\-)*(\d+)\.(\d\d).*$/,
            '$1$2.$3'
          )
        }
      } else {
        if (!item[key]) {
          item[key] = '0'
        } else {
          item[key] = item[key].replace(
            /^(\-)*(\d+)\.(\d\d).*$/,
            '$1$2.$3'
          )
        }
      }
    },

    /**
     * 输入失去焦点
     */
    inputBlur(index) {
      const item = this.quarterList[index]
      item.all = (parseFloat(item.first) + parseFloat(item.second) + parseFloat(item.third)).toFixed(2)

      let totalGoal = 0
      for (let index = 0; index < this.quarterList.length; index++) {
        const item = this.quarterList[index]
        totalGoal += parseFloat(item.all)
      }

      if (totalGoal) {
        this.totalGoal = totalGoal.toFixed(2)
      } else {
        this.totalGoal = 0
      }
    },

    /**
     * 平均
     */
    averageClick() {
      const quarterValue = this.totalGoal ? NP.divide(this.totalGoal, 4).toFixed(2) : 0
      const allValue = NP.times(quarterValue, 4)
      for (let index = 0; index < this.quarterList.length; index++) {
        const element = this.quarterList[index]
        const itemValue = NP.divide(quarterValue, 3).toFixed(2)
        element.first = itemValue
        element.second = itemValue
        element.third = (NP.minus(quarterValue, NP.plus(itemValue, itemValue))).toFixed(2)
        element.all = quarterValue
        if (index == this.quarterList.length - 1 && allValue != this.totalGoal) {
          const diffValue = NP.minus(this.totalGoal, NP.times(quarterValue, 3), NP.times(itemValue, 2)).toFixed(2)
          element.third = diffValue
          element.all = NP.plus(element.first, element.second, element.third)
        }
      }
    },

    /**
     * 获取设置label
     */
    getSetLabe(index, type) {
      return [['1月份', '2月份', '3月份'],
        ['4月份', '5月份', '6月份'],
        ['7月份', '8月份', '9月份'],
        ['10月份', '11月份', '12月份']][index][type]
    },

    getUploadKey(index, type) {
      return [['january', 'february', 'march'],
        ['april', 'may', 'june'],
        ['july', 'august', 'september'],
        ['october', 'november', 'december']][index][type]
    },

    /**
     * 关闭
     */
    closeClick() {
      this.$emit('update:visible', false)
      this.$emit('close')
    },

    /**
     * 重置数据
     */
    resetData() {
      this.typeSelect = 1
      this.dateSelect = moment()
        .year()
        .toString()
      this.selectDepOrUser = []
      this.totalGoal = '0'

      this.quarterList = [
        {
          title: '第一季度',
          all: 0,
          first: 0,
          second: 0,
          third: 0
        },
        {
          title: '第二季度',
          all: 0,
          first: 0,
          second: 0,
          third: 0
        },
        {
          title: '第三季度',
          all: 0,
          first: 0,
          second: 0,
          third: 0
        },
        {
          title: '第四季度',
          all: 0,
          first: 0,
          second: 0,
          third: 0
        }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.add-goal {
  padding: 15px 0;

  &__handle {
    padding: 10px 0;
    font-size: 14px;
    color: $--color-text-primary;
    text-align: center;
    border-top: 1px solid $--border-color-base;

    /deep/ .el-date-editor {
      width: 95px;

      .el-input__inner {
        padding-right: 16px;
      }
    }

    .total-input {
      width: 120px;

      /deep/ .el-input__inner {
        text-align: right;
      }
    }

    .handle-label {
      margin: 0 5px;
    }

    .el-button {
      margin-left: 30px;
    }
  }

  &__set {
    padding: 8px 15px;
    border-top: 1px solid $--border-color-base;
  }
}

// 筛选信息
.select-wrapper {
  padding: 0 15px 15px;
  font-size: 14px;
  color: $--color-text-primary;
}

.select-item + .select-item {
  margin-left: 30px !important;
}

.select-label {
  flex-shrink: 0;
  margin-right: 20px;
}

.select-condition {
  width: 280px;
}

// 设置信息
.set-item {
  font-size: 12px;
  border: 1px solid $--border-color-base;
  border-radius: $--border-radius-base;

  /deep/ .el-input__inner {
    text-align: right;
  }

  &__hd {
    padding: 8px;

    p {
      margin-bottom: 5px;
      font-weight: 600;
    }

    padding-bottom: 10px;
    border-bottom: 1px solid $--border-color-base;
  }

  &__bd {
    padding: 8px;

    .set-item-wrapper {
      padding: 5px 0;

      .set-item__label {
        margin-right: 5px;
      }

      .set-item__input {
        width: 115px;
      }
    }
  }
}

.set-item + .set-item {
  margin-left: 15px !important;
}
</style>
