<template>
  <component
    :is="tabName"
    v-if="$attrs.id&&visible"
    v-bind="$attrs"
    class="d-view"
    v-on="$listeners"
    @hide-view="hiddenView" />
</template>

<script type="text/javascript">
// import { getMaxIndex } from '@/utils/index'
import LeadsDetail from '../leads/Detail'
import CustomerDetail from '../customer/Detail'
import ContactsDetail from '../contacts/Detail'
import BusinessDetail from '../business/Detail'
import ContractDetail from '../contract/Detail'
import ProductDetail from '../product/Detail'
import ReceivablesDetail from '../receivables/Detail'
import ProjectDetail from '../project/Detail'
import InvoiceDetail from '../invoice/Detail'
import ReceivablesPlanDetail from '../receivablesPlan/Detail'
import SettlementDetail from '../settlement/Detail'

export default {
  name: 'CRMAllDetail', // 详情
  components: {
    LeadsDetail,
    CustomerDetail,
    ContactsDetail,
    BusinessDetail,
    ContractDetail,
    ProductDetail,  
    ReceivablesDetail,
    ProjectDetail,
    InvoiceDetail,
    ReceivablesPlanDetail,
    SettlementDetail
  },
  props: {
    crmType: String,
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
    }
  },
  computed: {
    tabName(type) { // 组件名
      if (this.crmType == 'leads') {
        return 'LeadsDetail'
      } else if (this.crmType == 'customer') {
        return 'CustomerDetail'
      } else if (this.crmType == 'contacts') {
        return 'ContactsDetail'
      } else if (this.crmType == 'business') {
        return 'BusinessDetail'
      } else if (this.crmType == 'contract') {
        return 'ContractDetail'
      } else if (this.crmType == 'product') {
        return 'ProductDetail'
      } else if (this.crmType == 'receivables') {
        return 'ReceivablesDetail'
      } else if (this.crmType == 'receivablesPlan') {
        return 'ReceivablesPlanDetail'
      } else if (this.crmType == 'project') {
        return 'ProjectDetail'
      } else if (this.crmType == 'invoice') {
        return 'InvoiceDetail'
      } else if (this.crmType == 'settlement') {
        return 'SettlementDetail'
      } else if (this.crmType == 'project') {
        return 'ProjectDetail'
      } else {
        return ''
      }
    }
  },
  watch: {},
  mounted() {
    // if (this.visible) {
    //   this.$nextTick(() => {
    //     console.log(this.$el, 'this.$el----')

    //     document.body.appendChild(this.$el)
    //     this.$el.style.zIndex = getMaxIndex()
    //   })
    // }
  },
  destroyed() {
    // remove DOM node after destroy
    // if (this.$el && this.$el.parentNode) {
    //   this.$el.parentNode.removeChild(this.$el)
    // }
  },
  methods: {
    hiddenView() {
      this.$emit('update:visible', false)
    }
  }
}
</script>
<style lang="scss" scoped>
.full-container {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: 0;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.3);
}

.d-view {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: $--detail-width-base;
  min-width: 926px;
}
</style>
