<template>
  <div class="schedule-calendar">
    <div>
      <Calendar
        ref="calendar"
        :mark-date-more="scheduleList"
        v-bind="$attrs"
        v-on="$listeners"
        @changeMonth="changeMonth" />
    </div>
  </div>
</template>

<script>
import Calendar from 'vue-calendar-component'
import { canlendarQueryListStatusAPI } from '@/api/oa/calendar'
export default {
  name: 'Schedule',
  components: {
    Calendar
  },
  props: {
    activeTime: {
      type: Object,
      default: () => {
        return {}
      }
    },
    listDataType: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      // 日历事件
      scheduleList: [],
      currentMonthDate: new Date()
    }
  },
  watch: {
  },
  mounted() {
    this.selectDay(new Date(), true)
  },
  methods: {
    /**
     * 切换月份
     */
    changeMonth(val) {
      this.currentMonthDate = new Date(val)
      this.$emit('changeMonth', this.currentMonthDate)
    },

    /**
     * 切换某天
     */
    selectDay(date) {
      this.$refs.calendar.ChoseMonth(date, true)
    },

    /**
     * 切换某月
     */
    selectMouth(date) {
      this.$refs.calendar.ChoseMonth(date)
    },

    /**
     * 获取标注
     */
    getDateList(data) {
      this.scheduleList = []
      canlendarQueryListStatusAPI(data).then(res => {
        const resData = res.data || []
        resData.forEach(element => {
          this.scheduleList.push({
            date: element,
            className: 'mark1'
          })
        })
      }).catch(() => {})
    }
  }
}
</script>

<style scoped lang="scss">
.schedule-calendar {
  .title {
    height: 44px;
    line-height: 44px;
    border-bottom: 1px solid #e6e6e6;

    .rt {
      margin-right: 0;
      color: $--color-primary;
      cursor: pointer;

      .el-icon-plus {
        font-weight: 700;
      }
    }
  }

  .list {
    padding: 10px 11%;
    font-size: 13px;
    color: $--color-text-secondary;
    cursor: pointer;

    .list-title {
      margin-bottom: 5px;
    }

    .time {
      margin-right: 10px;
      font-size: 12px;
    }
  }

  .see-more {
    color: $--color-text-secondary;
    text-align: center;
    cursor: pointer;
  }
}

.schedule-calendar /deep/ .wh_container {
  max-width: max-content;

  .wh_content_all {
    padding-bottom: 0;
    background: #fff;

    .wh_top_changge {
      display: block;
      margin: 15px 0 10px;
      text-align: center;

      li {
        display: inline-block;
        height: 13px;
        color: $--color-primary;

        .wh_jiantou1,
        .wh_jiantou2 {
          width: 8px;
          height: 8px;
          margin-top: 4px;
          margin-left: 25px;
          border-color: $--color-black;
          border-width: 2px;
        }

        .wh_jiantou1 {
          margin-top: 4px;
          margin-right: 28px;
          margin-left: 0;
        }
      }

      .wh_content_li {
        font-size: $--font-size-base;
        color: $--color-black;
      }
    }

    .wh_content {
      width: 105%;
      padding: 0;

      .wh_content_item {
        position: relative;
        height: 36px;
        margin-top: 3px;
        color: $--color-black;

        .wh_top_tag {
          font-size: $--font-size-small;
          color: $--color-n500;
        }

        .wh_item_date {
          width: 30px;
          height: 30px;
          font-size: $--font-size-base;
          color: $--color-n500;
          background: transparent;
        }

        .wh_item_date:hover {
          color: $--color-primary;
          background: transparent;
        }

        .wh_other_dayhide {
          color: $--color-n50;
        }

        .wh_isToday,
        .wh_isToday:hover {
          color: $--color-black;
          background: #fcf8e3;
          border-radius: 30px;
        }

        .wh_chose_day,
        .wh_chose_day:hover {
          color: #fff;
          background: $--color-primary;
          border-radius: 40px;
        }

        .mark1::after {
          position: absolute;
          bottom: 0;
          width: 5px;
          height: 5px;
          content: " ";
          background-color: $--color-primary;
          border-radius: 50%;
        }
      }
    }
  }
}
</style>
