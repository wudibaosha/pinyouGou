<template>
  <div class="system-customer main">
    <xr-header
      label="业务参数设置" />
    <div class="main-content-wrap">
      <!-- 客户管理导航 -->
      <div class="main-nav">
        <div class="main-nav__content">
          <div class="nav-sections-wrap">
            <div
              v-for="(item, index) in menuList"
              :key="index"
              :class="{'is-select' : item.key == menuIndex}"
              class="menu-item"
              @click="menuSelect(item.key)">
              {{ item.label }}
            </div>
          </div>
        </div>
      </div>
      <keep-alive>
        <component
          :is="componentName"
          :types="types"
          class="main-content" />
      </keep-alive>
    </div>
  </div>
</template>

<script>
import RefundReasonSet from './components/RefundReasonSet' // 退票原因设置
import FollowLogTypeSet from './components/FollowLogTypeSet' // 跟进记录类型设置
import StageFlowSet from './components/StageFlowSet' // 阶段流程设置
import ProductCategorySet from './components/ProductCategorySet' // 产品类别设置
import ContractExpireSet from './components/ContractExpireSet' // 合同到期提醒设置
import CustomerLimitSet from './components/CustomerLimitSet' // 拥有/锁定客户数限制
import VisitRemindSet from './components/VisitRemindSet' // 客户回访提醒设置
import XrHeader from '@/components/XrHeader'

export default {
  name: 'BizParam',

  components: {
    RefundReasonSet,
    StageFlowSet,
    ProductCategorySet,
    FollowLogTypeSet,
    ContractExpireSet,
    CustomerLimitSet,
    VisitRemindSet,
    XrHeader
  },

  data() {
    return {
      menuList: [
        { label: '退票原因设置', key: 'Refund-reason-set' },
        { label: '跟进记录类型设置', key: 'follow-log-type-set' },
        { label: '阶段流程设置', key: 'stage-flow-set' },
        { label: '产品类别设置', key: 'product-category-set' },
        { label: '合同到期提醒设置', key: 'contract-expire-set' },
        { label: '拥有客户数限制', key: 'own' },
        { label: '锁定客户数限制', key: 'lock' },
        { label: '客户回访提醒设置', key: 'VisitRemindSet' }
      ],
      menuIndex: 'Refund-reason-set',
      types: '' // 区分拥有客户 和 锁定客户
    }
  },

  computed: {
    componentName() {
      if (this.menuIndex == 'own' || this.menuIndex == 'lock') {
        return 'customer-limit-set'
      }
      return this.menuIndex
    }
  },

  methods: {
    /**
     * 菜单选择
     */
    menuSelect(i) {
      if (i == 'own' || i == 'lock') {
        this.types = {
          own: 1,
          lock: 2
        }[i]
      }
      this.menuIndex = i
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "../../styles/index.scss";

.main-content-wrap {
  margin-top: #{$--interval-base * 2};
}

.nav-sections-wrap {
  padding: $--interval-base;
}
</style>
