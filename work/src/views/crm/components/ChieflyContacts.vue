<template>
  <div
    v-loading="loading"
    class="chiefly-contacts">
    <flexbox
      v-if="contactsDetail && canShowContacts"
      class="cell"
      align="stretch">
      <xr-avatar
        :name="contactsDetail.name"
        :size="40"
        class="cell-hd" />
      <div class="cell-bd">
        <p class="cell-bd__name">
          <span>{{ contactsDetail.name }}</span>
          <span
            v-if="contactsDetail.post"
            class="cell-bd__name--des">{{ contactsDetail.post }}</span>
        </p>
        <p class="cell-bd__detail">
          <i class="wk wk-circle-iphone" />
          <span v-if="contactsDetail.mobile">{{ contactsDetail.mobile }}</span>
          <span
            v-else
            class="no-data">暂无电话</span>
        </p>
        <p class="cell-bd__detail">
          <i class="wk wk-circle-email" />
          <span v-if="contactsDetail.email">{{ contactsDetail.email }}</span>
          <span
            v-else
            class="no-data">暂无邮箱</span>
        </p>
      </div>
      <span class="mark"><i class="wk wk-s-contacts" />首要联系人</span>
      <i
        v-if="contactsDetail.mobile"
        class="wk wk-phone"
        @click="callPhone" />
    </flexbox>

    <import-info-empty
      v-else-if="!contactsId && canShowContacts"
      :title="emptyName"
      :btn-name="emptyBtnName"
      class="empty-info"
      v-on="$listeners" />

    <import-info
      v-if="list.length"
      :list="list"
      :detail="detail" />
    <c-r-m-full-screen-detail
      :id="contactsId"
      :visible.sync="showFullDetail"
      :model-data="{
        model: 'contacts',
        modelId: contactsId
      }"
      crm-type="contacts" />
  </div>
</template>

<script>
import { crmContactsReadAPI } from '@/api/crm/contacts'
import { filedGetInformationAPI } from '@/api/crm/common'
import ImportInfo from './ImportInfo'
import ImportInfoEmpty from './ImportInfoEmpty'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import { mapGetters } from 'vuex'
import callCenter from '@/callCenter/callWebSokets'

export default {
  // 首要联系人
  name: 'ChieflyContacts',
  components: {
    ImportInfo,
    ImportInfoEmpty,
    CRMFullScreenDetail: () => import('@/components/CRMFullScreenDetail')
  },
  props: {
    id: [Number, String],
    poolId: [Number, String],
    contactsId: [Number, String],
    crmType: {
      required: true,
      type: String,
      default: ''
    },
    detail: {
      type: Object,
      default: () => {
        return {}
      }
    },
    // 是公海 默认是客户
    isSeas: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      contactsDetail: null,
      list: [],
      showFullDetail: false
    }
  },
  computed: {
    ...mapGetters(['crm']),

    callAuth() {
      return this.$store.state.crm.isCall
    },

    // 联系人权限
    canShowContacts() {
      return this.crm && this.crm.contacts && this.crm.contacts.read
    },

    // 有首要联系人
    hasInfo() {
      return this.contactsId
    },

    // 空数据按钮文字 为空不展示
    emptyBtnName() {
      return this.$listeners.add && !this.isSeas ? '新建联系人' : ''
    },

    emptyName() {
      return (
        {
          customer: '暂无客户首要联系人',
          business: '暂无商机首要联系人'
        }[this.crmType] || '暂无数据'
      )
    }
  },
  watch: {
    contactsId() {
      this.contactsDetail = null
      this.getDetial()
    },

    id() {
      this.list = []
      this.contactsDetail = null
      this.getBaseInfo()
      this.getDetial()
    }
  },
  created() {
    if (this.canShowContacts) {
      this.getDetial()
    }
    this.getBaseInfo()
    this.$bus.on('crm-detail-update', (data) => {
      this.getBaseInfo()
    })
  },

  beforeDestroy() {
    this.$bus.off('crm-detail-update')
  },
  methods: {
    /**
     * 获取联系人详情
     */
    getDetial() {
      if (this.hasInfo) {
        this.loading = true
        crmContactsReadAPI({
          contactsId: this.contactsId
        })
          .then(res => {
            this.loading = false
            this.contactsDetail = res.data
          })
          .catch(() => {
            this.loading = false
          })
      }
    },

    /**
     * 打电话
     */
    callPhone() {
      if (this.callAuth) {
        if (callCenter.CheckCallState()) {
          const stringData = JSON.stringify({
            type: 'contacts',
            id: this.contactsId
          })
          localStorage.setItem('callOutData', stringData) // 呼出信息保存,确保刷新页面时信息不丢失
          this.$store.commit('SHOW_CALL_OUT', false) // 呼出关闭上一次的呼出弹窗
          callCenter.OnDailout(this.contactsDetail.mobile)
          this.showFullDetail = true
        }
      } else {
        this.$message.error('请先开通呼叫中心')
      }
    },

    /**
     * 获取基础信息
     */
    getBaseInfo() {
      this.loading = true
      const params = {
        types: crmTypeModel[this.crmType],
        id: this.id
      }

      // 如果有公海id 需上传确定展示字段
      if (this.poolId) {
        params.poolId = this.poolId
      }

      filedGetInformationAPI(params)
        .then(res => {
          const list = res.data || []
          this.list = list.filter(item => {
            return item.formType !== 'file' &&
        item.formType !== 'detail_table' &&
        item.formType !== 'product'
          })
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.chiefly-contacts {
  height: 100%;
  padding: 15px;
  overflow: auto;
  overflow-y: overlay;
}

.cell {
  position: relative;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: $--border-radius-base;
  box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.1);

  &-hd {
    position: relative;
    display: block;
    width: 40px;
    height: 40px;
    margin-right: 10px;
    border-radius: 20px;
  }

  &-bd {
    flex: 1;

    &__name {
      margin-top: 10px;
      margin-bottom: 2px;
      font-size: 14px;
      font-weight: 600;
      color: $--color-text-primary;

      &--des {
        position: relative;
        padding-left: 5px;
        margin-left: 5px;
        font-size: 12px;
        font-weight: 500;
        color: $--color-text-regular;
      }

      &--des::before {
        position: absolute;
        top: 3px;
        bottom: 1px;
        left: 0;
        width: 1px;
        content: "";
        background-color: $--color-text-regular;
      }
    }

    &__detail {
      margin-top: 8px;
      font-size: 12px;
      color: $--color-text-primary;

      i {
        font-size: 13px;
        color: $--color-primary;
      }

      .no-data {
        color: $--color-text-secondary;
      }
    }
  }

  .mark {
    position: absolute;
    top: 4px;
    right: -2px;
    z-index: 1;
  }

  .wk-phone {
    position: absolute;
    top: 30px;
    right: 5px;
    z-index: 1;
  }
}

.mark {
  display: inline-block;
  padding: 5px;
  font-size: 12px;
  color: #fb2337;
  background-color: #fff4f4;
  border-radius: $--border-radius-base;
  transform: scale(0.8);

  i {
    margin-right: 5px;
    font-size: 12px;
  }
}

.wk-phone {
  display: inline-block;
  padding: 4px 5px;
  font-size: 14px;
  color: white;
  cursor: pointer;
  background-color: #fb9323;
  border-radius: $--border-radius-base;
}

// 无数据
.empty-info {
  position: relative;
  height: 96px;
  border: 1px solid #ebeef5;
  border-radius: $--border-radius-base;
  box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.1);
}
</style>
