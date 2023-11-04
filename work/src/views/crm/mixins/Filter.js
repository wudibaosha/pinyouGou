import { crmSceneIndexAPI } from '@/api/crm/common'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import { mapGetters } from 'vuex'

/**
 * crmType 列表有该变量
 */
export default {
  components: {},

  props: {},

  data() {
    return {
      sceneList: [],
      sceneSelectId: ''
    }
  },

  computed: {
    ...mapGetters(['crm'])
  },

  watch: {},

  created() {},

  mounted() {
    if (this.$auth(`crm.${this.crmType}.index`) && this.showSceneView) {
      this.getSceneList()
    }
  },

  beforeDestroy() {},

  methods: {
    /**
     * 场景数据
     */
    getSceneList() {
      crmSceneIndexAPI({
        type: crmTypeModel[this.crmType]
      })
        .then(res => {
          const resData = (res.data || []).map(item => {
            item.label = item.name
            item.value = item.sceneId !== null ? item.sceneId.toString() : ''
            return item
          })
          const defaultScenes = resData.filter(item => item.isDefault === 1)

          let currentScene = null
          if (defaultScenes && defaultScenes.length > 0) {
            currentScene = defaultScenes[0]
          } else if (resData.length > 0) {
            currentScene = resData[0]
          }

          if (currentScene) {
            currentScene.id = currentScene.sceneId ? currentScene.sceneId.toString() : ''
            currentScene.bydata = currentScene.bydata || ''
            this.sceneSelectId = currentScene.id
            this.$emit('scene', currentScene)
          }

          this.sceneList = resData
        })
        .catch(() => {
          this.$emit('scene', { id: '', name: '', bydata: '' })
        })
    }
  }
}
