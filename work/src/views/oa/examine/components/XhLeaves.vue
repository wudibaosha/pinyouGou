<template>
  <div>
    <div
      v-for="(item, index) in mainList"
      :key="index"
      class="expense-item">
      <flexbox class="expense-item-head">
        <div class="expense-item-head-title">行程明细（{{ index+1 }}）</div>
        <el-button
          v-if="index != 0"
          type="text"
          class="el-icon-delete expense-item-head-delete"
          @click="deleteItems(index)" />
      </flexbox>
      <flexbox
        wrap="wrap"
        align="stretch"
        class="clauses">
        <flexbox-item
          v-for="(subItem, subIndex) in showItems"
          :key="subIndex"
          :span="1/2"
          class="clauses-item">
          <div class="clauses-item-title">
            {{ subItem.name }}
          </div>
          <el-date-picker
            v-if="subItem.formType == 'datetime'"
            v-model="item[subItem.field]"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            placeholder="选择日期"
            @change="datePickerChange(index)" />
          <el-select
            v-else-if="subItem.formType == 'select'"
            v-model="item[subItem.field]"
            @change="valueChange">
            <el-option
              v-for="(item, index) in subItem.data"
              :key="index"
              :label="item"
              :value="item" />
          </el-select>
          <el-input-number
            v-else-if="subItem.formType == 'number'"
            v-model="item[subItem.field]"
            :controls="false"
            :precision="1"
            :maxlength="356"
            :min="0"
            @input="calculateValueChange(index, subIndex)" />
          <el-input
            v-else
            v-model="item[subItem.field]"
            :maxlength="100"
            type="text" />
        </flexbox-item>
      </flexbox>
      <div class="description">
        <div class="description-title">备注</div>
        <el-input
          v-model="item['description']"
          :rows="3"
          :maxlength="300"
          type="textarea"
          resize="none"
          show-word-limit
          @input="valueChange" />
      </div>
    </div>
    <div class="handle-bar">
      <el-button
        class="handle-bar-button"
        type="text"
        @click="addItems(index)">添加事项</el-button>
        <!-- <div class="handle-bar-total">
        总时长：<span>{{totalDuration}}</span>
      </div> -->
    </div>
  </div>
</template>
<script type="text/javascript">
import moment from 'moment'
import ObjMixin from '@/components/CreateCom/ObjMixin'

export default {
  name: 'XhLeaves', // 请假事项
  components: {},
  mixins: [ObjMixin],
  props: {},
  data() {
    return {
      mainList: [],
      imageIndex: -1,
      totalDuration: '0', // 合计
      showItems: [
        {
          field: 'vehicle',
          name: '交通工具',
          formType: 'select',
          data: ['飞机', '火车', '汽车', '其他']
        },
        {
          field: 'trip',
          name: '单程往返',
          formType: 'select',
          data: ['单程', '往返']
        },
        {
          field: 'startAddress',
          name: '出发城市',
          formType: 'text'
        },
        {
          field: 'endAddress',
          name: '目的城市',
          formType: 'text'
        },
        {
          field: 'startTime',
          name: '开始时间',
          formType: 'datetime'
        },
        {
          field: 'endTime',
          name: '结束时间',
          formType: 'datetime'
        },
        {
          field: 'duration',
          name: '时长（天）',
          formType: 'number'
        }
      ]
    }
  },
  computed: {},
  watch: {
    value: function(val) {
      this.dataValue = val
      if (val.list && val.list.length > 0) {
        this.mainList = val.list
      } else {
        this.mainList.push(this.getValueItem())
      }
    }
  },
  mounted() {
    if (this.dataValue.list && this.dataValue.list.length > 0) {
      this.mainList = this.dataValue.list
    } else {
      this.mainList.push(this.getValueItem())
    }
  },
  methods: {
    getInputDisable(field) {
      return field == 'duration'
    },
    deleteItems(index) {
      this.mainList.splice(index, 1)
      this.calculateValueChange()
    },
    addItems() {
      this.mainList.push(this.getValueItem())
    },
    datePickerChange(index) {
      const item = this.mainList[index]
      if (item.startTime && item.endTime) {
        const startDate = moment(item.startTime)
        const endDate = moment(item.endTime)
        const diff = endDate.diff(startDate, 'hours')
        let intDays = Math.floor(diff / 24)
        const remainder = diff % 24
        if (remainder >= 4 && remainder < 8) {
          intDays += 0.5
        } else if (remainder >= 8) {
          intDays += 1
        }
        item.duration = intDays
        this.calculateValueChange()
      }
    },
    valueChange() {
      this.submitValueChange(false)
    },
    // 值更新的回调
    calculateValueChange() {
      var total = 0
      for (let index = 0; index < this.mainList.length; index++) {
        const element = this.mainList[index]
        total = total + parseFloat(element.duration ? element.duration : 0)
      }
      this.totalDuration = total

      this.submitValueChange(true)
    },
    submitValueChange(update) {
      this.$emit('value-change', {
        index: this.index,
        value: {
          list: this.mainList,
          update: update, // 是否更新总数
          duration: this.totalDuration
        }
      })
    },
    getValueItem() {
      return {
        vehicle: '',
        trip: '',
        startAddress: '',
        endAddress: '',
        startTime: '',
        endTime: '',
        duration: ''
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.expense-item {
  padding-bottom: 15px;
  margin-bottom: 10px;
  border: $--border-width-medium solid $--border-color-base;
  border-radius: 2px;

  &-head {
    padding: 10px 20px;
    background-color: #f5f5f5;

    &-title {
      flex: 1;
      height: auto;
      line-height: normal;
    }

    &-delete {
      padding: 0 10px;
      cursor: pointer;
    }
  }
}

.clauses {
  padding: 10px;

  &-item {
    display: flex;
    padding: 0 10px 8px;
    margin-left: 0 !important;

    &-title {
      flex-shrink: 0;
      width: 90px;
    }

    .el-date-editor,
    .el-select {
      width: 100%;
    }

    .el-input-number {
      width: 100%;

      /deep/ .el-input__inner {
        padding: 0 8px;
        text-align: left;
      }
    }
  }
}

.sub-total {
  font-size: 12px;
}

.description {
  padding: 0 20px;

  &-title {
  }
}

.el-input /deep/ .el-input__inner {
  border-color: #ddd !important;
}

.el-select /deep/ .el-input__inner {
  border-color: #ddd !important;
}

.el-textarea /deep/ .el-textarea__inner {
  border-color: #ddd !important;
}

.el-input-number /deep/ .el-input__inner {
  border-color: #ddd !important;
}

.handle-bar {
  height: 29px;
  text-align: right;

  &-button {
    padding-right: 0;
    border: none;
  }

  &-total {
    margin-top: 10px;
    font-size: 13px;
    text-align: left;

    span {
      color: $--color-text-regular;
    }
  }
}
</style>
