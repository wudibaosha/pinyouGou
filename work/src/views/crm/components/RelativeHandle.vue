<template>
  <div
    v-loading="loading"
    v-empty="list"
    class="rc-cont"
    style="min-height: 500px;padding-right: 10%;">
    <flexbox
      v-for="(item, index) in list"
      :key="index"
      class="ha-cont"
      align="stretch"
      justify="flex-start">
      <div class="ha-week">{{ item.createTime|filterTimestampToFormatTime('MM-DD dddd') }}</div>
      <div class="ha-circle" />
      <div class="ha-time">{{ item.createTime|filterTimestampToFormatTime('HH:mm') }}</div>
      <xr-avatar
        :id="item.createUserId"
        :name="item.realname"
        :size="32"
        :src="item.img"
        :disabled="false"
        class="ha-img" />
      <div class="ha-name">{{ item.realname }}</div>
      <div class="ha-content">
        <p
          v-for="(info, infoIndex) in item.content"
          :key="infoIndex">{{ info }}</p>
      </div>
      <div class="ha-line" />
    </flexbox>
  </div>
</template>

<script type="text/javascript">
import crmTypeModel from '@/views/crm/model/crmTypeModel'
import { crmIndexFieldRecordAPI } from '@/api/crm/common'

export default {
  name: 'RelativeHandle', // 相关操作  可能再很多地方展示 放到客户管理目录下
  components: {},
  props: {
    /** 模块ID */
    id: [String, Number],
    /** 联系人人下 新建商机 需要联系人里的客户信息  合同下需要客户和商机信息 */
    detail: {
      type: Object,
      default: () => {
        return {}
      }
    },
    /** 没有值就是全部类型 有值就是当个类型 */
    crmType: {
      type: String,
      default: ''
    },
    /** 是公海 默认是客户 */
    isSeas: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      list: []
    }
  },
  inject: ['rootTabs'],
  computed: {},
  watch: {
    id(val) {
      this.list = []
      this.getDetail()
    },

    'rootTabs.currentName'(val) {
      if (val === 'RelativeHandle') {
        this.getDetail(false)
      }
    }
  },
  mounted() {
    this.getDetail()
  },
  methods: {
    getDetail(loading = true) {
      this.loading = loading
      crmIndexFieldRecordAPI({
        types: crmTypeModel[this.crmType],
        actionId: this.id
      })
        .then(res => {
          this.loading = false
          this.list = res.data.map(item => {
            item.createTime = new Date(item.createTime).getTime()
            return item
          })
        })
        .catch(() => {
          this.loading = false
        })
    }
  }
}
</script>
<style lang="scss" scoped>
@import "../styles/relativecrm.scss";

.ha-cont {
  position: relative;
  min-height: 40px;
  padding-top: 3px;
  line-height: 20px;

  .ha-week {
    flex-shrink: 0;
    width: 90px;
    margin: 0 17px 0 10px;
  }

  .ha-time {
    flex-shrink: 0;
    width: 80px;
    padding: 0 10px 0 24px;
  }

  .ha-circle {
    z-index: 2;
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    background-color: white;
    border: 5px solid $--color-primary;
    border-radius: 9px;
  }

  .ha-img {
    display: block;
    flex-shrink: 0;
    margin: -3px 10px 0;
  }

  .ha-name {
    flex-shrink: 0;
    padding: 0 10px;
  }

  .ha-content {
    flex: 1;
    padding: 0 10px 10px;
  }

  .ha-line {
    position: absolute;
    top: 3px;
    bottom: -3px;
    left: 125px;
    z-index: 1;
    width: 1px;
    background-color: $--border-color-base;
  }
}
</style>
