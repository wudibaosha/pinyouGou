
export default {
  data() {
    return {}
  },

  watch: {},

  mounted() {

  },

  methods: {
    /**
     * 字段是否展示
     */
    isShowField(formType) {
      return formType != 'user' && formType != 'structure' && formType != 'file' && formType != 'map_address'
    }
  },

  deactivated: function() {}

}
