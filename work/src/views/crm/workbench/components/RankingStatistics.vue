<template>
  <statistics-card
    v-loading="loading"
    icon="wk wk-target-solid">

    <template slot="title-left">排行榜<i class="wk wk-icon-fill-help wk-help-tips" data-type="4" data-id="22" /></template>

    <template slot="filter-left">
      <el-select
        v-model="optionValue"
        mode="no-border"
        @change="handleCommand">
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.name"
          :value="item.value" />
      </el-select>
    </template>

    <div class="content">
      <el-table
        :data="data"
        :height="290"
        :cell-class-name="cellClassName"
        :row-class-name="rowClassName"
        class="table-list"
        :stripe="false"
        style="width: 100%;">
        <el-table-column
          :resizable="false"
          prop="index"
          label="排名">
          <template slot-scope="scope">
            <span>{{ scope.row.sort }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :resizable="false"
          prop="name"
          label="姓名">
          <template slot-scope="scope">
            <xr-avatar
              :name="scope.row.realname"
              :src="scope.row.img"
              :size="30"
              class="user-img" />
            <span class="user-name">{{ scope.row.realname }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :resizable="false"
          :label="`${optionName}（${optionInfo.unit}）`"
          prop="value" />
        <el-table-column
          v-if="rateShow"
          :resizable="false"
          label="目标完成率（%）"
          prop="rate" />
      </el-table>
      <div
        class="my-ranking">
        <div class="row value">
          <span>{{ myData.sort }}</span>
        </div>
        <div class="row">
          <xr-avatar
            :name="myData.realname"
            :src="myData.img"
            :size="30"
            class="user-img" />
          <span class="user-name">{{ myData.realname }}</span>
        </div>
        <div class="row value">{{ myData.value }}</div>
        <div v-if="rateShow" class="row value">{{ myData.rate }}</div>
      </div>
    </div>
  </statistics-card>
</template>

<script>
import {
  biRankingReceivablesAPI,
  biRankingContractAPI,
  biRankingContractCountAPI,
  biRankingCustomerCountAPI,
  biRankingContactsCountAPI,
  biRankingRecordCountAPI
} from '@/api/crm/workbench'

import ChartMixin from './ChartMixin'
import { mapGetters } from 'vuex'

export default {
  name: 'RankingStatistics',
  filters: {
    filterRankImage(sort) {
      return [
        require('@/assets/img/1.png'),
        require('@/assets/img/2.png'),
        require('@/assets/img/3.png')
      ][sort - 1]
    }
  },
  mixins: [ChartMixin],
  data() {
    return {
      data: [],
      myData: {
        ...this.userInfo,
        value: '--',
        sort: '--'
      },
      loading: false,

      options: [
        { name: '回款金额', value: 2, requst: biRankingReceivablesAPI },
        { name: '合同金额', value: 1, requst: biRankingContractAPI },
        { name: '合同数', value: 3, requst: biRankingContractCountAPI },
        { name: '新增客户数', value: 4, requst: biRankingCustomerCountAPI },
        { name: '新增联系人', value: 5, requst: biRankingContactsCountAPI },
        // { name: '新增商机', value: 6 },
        // { name: '新增商机金额', value: 7 },
        { name: '新增跟进记录数', value: 8, requst: biRankingRecordCountAPI }
      ],
      optionValue: 2
    }
  },
  computed: {
    ...mapGetters(['userInfo', 'bi']),
    optionName() {
      const optionObj = this.options.find(item => item.value === this.optionValue)
      return optionObj ? optionObj.name : ''
    },
    optionInfo() {
      if (
        this.optionValue == 1 ||
        this.optionValue == 2 ||
        this.optionValue == 7
      ) {
        return {
          key: 'money',
          unit: '元'
        }
      } else if (
        this.optionValue == 8
      ) {
        return {
          key: 'count',
          unit: '条'
        }
      }
      return {
        key: 'count',
        unit: '个'
      }
    },
    rateShow() {
      return this.optionValue == 1 || this.optionValue == 2
    }
  },
  created() {
  },
  methods: {
    getData() {
      // 没有排行榜权限不发请求
      if (!this.$auth('bi.ranking.read')) {
        return
      }
      this.loading = true
      const request = this.options.find(item => item.value === this.optionValue).requst
      request(this.getBaseParams())
        .then(res => {
          this.loading = false
          const list = res.data || []
          const ranking = list.slice(0, 10)
          const myData = list.find(o => o.userId === this.userInfo.userId)

          this.data = ranking.map((item, index) => {
            const sort = index + 1
            item.sort = sort <= 9 ? `0${sort}` : sort
            item.value = item[this.optionInfo.key]
            return item
          })
          if (myData) {
            this.myData = {
              ...myData,
              value: myData[this.optionInfo.key]
            }
          } else {
            this.myData = {
              ...this.userInfo,
              sort: '--',
              value: '--',
              rate: '--'
            }
          }
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 下拉菜单选项选择
     * @param index 选项序号
     */
    handleCommand(index) {
      this.getData()
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (columnIndex === 0 && row.sort <= 3) {
        return 'is-top'
      } else {
        return ''
      }
    },

    rowClassName({ row, rowIndex }) {
      if (rowIndex < 3) return 'linear-row'
      return ''
    }
  }
}
</script>

<style scoped lang="scss">
@import "style";

/deep/ .el-table {
  .el-table__body-wrapper {
    .el-table__body {
      border-collapse: collapse;
    }

    tr {
      border-bottom: 4px solid #fff;
    }

    tr.linear-row {
      background: linear-gradient(to right, #deebff, #fff 20%) fixed;
    }

    td {
      &.is-top {
        position: relative;
        color: white;
        background-image: url("~@/assets/img/bg-b.png");
        background-repeat: no-repeat;
        background-position: 0 4px;
        background-size: 40px 36px;
      }
    }

    .el-table__cell {
      border-right: none;
    }
  }
}

.content {
  position: relative;
  width: 100%;
  margin-top: 16px;

  .title {
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: bold;
    text-align: center;
  }
}

.card-title-left .icon {
  color: #4a5bfd;
}

.el-table {
  /deep/ th.is-leaf {
    padding: 8px 0;
    background-color: white;
  }

  /deep/ th {
    .cell {
      font-weight: normal;
    }
  }
}

.user-img,
.user-name {
  vertical-align: middle;
}

.user-img {
  margin-right: 10px;
}

.statistics-card {
  height: 460px !important;
}

.my-ranking {
  display: table;
  width: 100%;
  font-size: 14px;
  table-layout: fixed;
  background-color: $--background-color-base;
  border: $--border-base;
  border-top: none;

  /deep/ .user-img {
    display: inline-flex;

    .el-popover__reference-wrapper {
      line-height: normal;
    }
  }

  .row {
    display: table-cell;
    line-height: 44px;
  }

  .row:first-child {
    padding-left: 10px;
  }

  .value {
    font-weight: bold;
    color: $--color-primary;
  }
}
</style>
