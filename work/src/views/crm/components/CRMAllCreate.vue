<template>
  <component
    :is="componentName"
    :contractid="contractid"
    v-bind="$attrs"
    v-on="$listeners"
    @hiden-view="hiddenView"
    @close="hiddenView" />
</template>

<script type="text/javascript">
import InvoiceCreate from '@/views/crm/invoice/Create'
import CustomerCreate from '@/views/crm/customer/Create'
import ContactsCreate from '@/views/crm/contacts/Create'
import LeadsCreate from '@/views/crm/leads/Create'
import BusinessCreate from '@/views/crm/business/Create'
import ContractCreate from '@/views/crm/contract/Create'
import ReceivablesCreate from '@/views/crm/receivables/Create'
import ReceivablesPlanCreate from '@/views/crm/receivablesPlan/Create'
import SettlementCreate from '@/views/crm/settlement/Create'
import ProjectCreate from '@/views/crm/project/Create'
import ProductCreate from '@/views/crm/product/Create'
import MarketingCreate from '@/views/crm/marketing/components/Create'

export default {
  name: 'CRMAllCreate',
  components: {
    InvoiceCreate,
    CustomerCreate,
    ContactsCreate,
    BusinessCreate,
    ContractCreate,
    ReceivablesCreate,
    ReceivablesPlanCreate,
    ProjectCreate,
    LeadsCreate,
    ProductCreate,
    MarketingCreate,
    SettlementCreate
  },
  inheritAttrs: false,
  props: {
    crmType: String,
    // 合同id
    contractid: [String, Number]
  },
  data() {
    return {
    }
  },
  computed: {
    componentName() {
      return {
        invoice: 'InvoiceCreate',
        customer: 'CustomerCreate',
        contacts: 'ContactsCreate',
        leads: 'LeadsCreate',
        business: 'BusinessCreate',
        contract: 'ContractCreate',
        receivables: 'ReceivablesCreate',
        project: 'ProjectCreate',
        product: 'ProductCreate',
        receivablesPlan: 'ReceivablesPlanCreate',
        marketing: 'MarketingCreate',
        settlement: 'SettlementCreate'
      }[this.crmType]
    }
  },
  watch: {

  },
  mounted() {
  },
  destroyed() {
  },
  methods: {
    hiddenView() {
      this.$emit('close')
    }
  }
}
</script>
<style lang="scss" scoped>
</style>
