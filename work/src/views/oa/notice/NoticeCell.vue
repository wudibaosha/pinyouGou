<template>
  <div
    :id="'notice-cell' + cellIndex"
    class="list">
    <div class="header">
      <xr-avatar
        :name="data.realname"
        :size="35"
        :src="data.img"
        class="user-img" />
      <div class="name-time">
        <p class="name">{{ data.realname }}</p>
        <p class="time">{{ data.createTime | moment("YYYY-MM-DD HH:mm") }}</p>
      </div>
    </div>
    <div
      class="title"
      @click="rowFun(data)">{{ data.title }}</div>
    <div
      v-if="data.preShow"
      class="data-content">{{ data.content }}</div>
    <div
      v-else
      class="data-content">{{ data.contentSub }}</div>
    <div
      v-if="data.contentSub.length < data.content.length"
      class="load-more">
      <span
        v-if="!data.loadMore"
        @click="loadMoreBtn(data)">展开全文</span>
      <span
        v-else
        @click="data.loadMore = false, data.preShow = false">收起全文</span>
    </div>
  </div>
</template>

<script>
import { noticeIsReadAPI } from '@/api/oa/notice'

export default {
  components: {},

  props: {
    data: Object,
    cellIndex: Number
  },

  data() {
    return {
      // 父元素
      parentTarget: null,
      awaitMoment: false // 等客户浏览
    }
  },

  mounted() {
    if (this.data.isRead == 0) {
      this.$bus.on('notice-list-box-scroll', target => {
        this.observePreview(target)
      })
      this.observePreview(
        document.getElementById('notice-cell' + this.cellIndex).parentNode
      )
    }
  },

  beforeDestroy() {
    this.$bus.off('notice-list-box-scroll')
  },

  methods: {
    /**
     * 观察预览
     */
    observePreview(target) {
      if (this.data.isRead == 0) {
        if (target) {
          this.parentTarget = target
        }
        const ispreview = this.whetherPreview()
        if (!this.awaitMoment && ispreview) {
          this.awaitMoment = true
          setTimeout(() => {
            this.awaitMoment = false
            const ispreview = this.whetherPreview()
            if (ispreview) {
              this.submiteIsRead()
            }
          }, 3000)
        }
      }
    },

    /**
     * 是否预览
     */
    whetherPreview() {
      const dom = this.parentTarget.children[this.cellIndex]
      if (this.parentTarget.getBoundingClientRect()) {
        const offsetTop =
          this.parentTarget.getBoundingClientRect().top -
          dom.getBoundingClientRect().top
        let ispreview = false
        if (
          offsetTop <= 0 &&
          Math.abs(offsetTop) < this.parentTarget.clientHeight
        ) {
          ispreview = true
        } else if (offsetTop > 0 && offsetTop < dom.clientHeight) {
          ispreview = true
        }
        return ispreview
      } else {
        return false
      }
    },

    /**
     * 提交已读
     */
    submiteIsRead() {
      noticeIsReadAPI({
        announcementId: this.data.announcementId
      })
        .then(res => {
          // this.$store.dispatch('GetOAMessageNum', 'announcement')
          this.data.isRead = 1
        })
        .catch(() => {})
    },

    /**
     * 点击显示详情
     */
    rowFun(val) {
      this.$emit('handle', {
        type: 'detail',
        value: val
      })
    },

    loadMoreBtn(val) {
      this.$set(val, 'preShow', true)
      this.$set(val, 'loadMore', true)
    }
  }
}
</script>

<style scoped lang="scss">
.list {
  padding-bottom: 30px;
  margin-bottom: 30px;
  border-bottom: 1px solid #e6e6e6;

  .header {
    margin-bottom: 15px;

    .user-img {
      margin-right: 10px;
    }

    .name-time {
      display: inline-block;

      .time {
        margin-top: 5px;
        font-size: 12px;
        color: $--color-text-secondary;
      }
    }
  }

  .title {
    display: inline-block;
    cursor: pointer;
  }

  .data-content {
    padding: 15px;
    margin-top: 10px;
    font-size: 12px;
    line-height: 18px;
    color: $--color-text-secondary;
    color: $--color-text-primary;
    letter-spacing: 0.5px;
    word-wrap: break-word;
    white-space: pre-wrap;
    background-color: #f0f7ff;
    border-radius: 3px;
  }

  .load-more {
    margin-top: 15px;
    text-align: left;

    span {
      font-size: 13px;
      color: #8ab7f5;
      cursor: pointer;
    }
  }
}
</style>
