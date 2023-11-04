<template>
  <div v-loading="loading" class="b-cont">
    <div>
      <wk-head-section
        v-for="(mainItem, mainIndex) in list"
        :key="mainIndex"
        :label="mainItem.name"
        :props="{
          headBgColor: '#FAFBFC',
          arrows: 'left',
          border: false,
          bodyPadding: '0'
        }"
        class="b-cells">
        <flexbox
          :gutter="0"
          style="margin-top: 16px;"
          align="stretch"
          wrap="wrap">
          <flexbox-item
            v-for="(item, index) in mainItem.list"
            :key="index"
            :span="getShowBlock(item.formType) ? 12 : 0.5"
            :class="{'b-cell': item.formType !== 'map_address'}">
            <flexbox
              v-if="item.formType === 'map_address'"
              :gutter="0"
              wrap="wrap">
              <flexbox-item
                :span="0.5"
                class="b-cell"
                @click.native="checkMapView(item)">
                <flexbox
                  class="b-cell-b"
                  align="stretch">
                  <div class="b-cell-name">定位</div>
                  <div
                    class="b-cell-value"
                    style="color: #3e84e9;cursor: pointer;">{{ item.value.location }}</div>
                </flexbox>
              </flexbox-item>
              <flexbox-item
                :span="0.5"
                class="b-cell">
                <flexbox
                  class="b-cell-b"
                  align="stretch">
                  <div class="b-cell-name">区域</div>
                  <div class="b-cell-value">{{ item.value.address }}</div>
                </flexbox>
              </flexbox-item>
              <flexbox-item
                :span="0.5"
                class="b-cell">
                <flexbox
                  class="b-cell-b"
                  align="stretch">
                  <div class="b-cell-name">详细地址</div>
                  <div class="b-cell-value">{{ item.value.detailAddress }}</div>
                </flexbox>
              </flexbox-item>
            </flexbox>

            <flexbox
              v-else-if="item.formType === 'single_user'"
              align="stretch"
              class="b-cell-b">
              <div class="b-cell-name">{{ item.name }}</div>
              <div class="b-cell-value">{{ item.value ? item.value.realname : '' }}</div>
            </flexbox>

            <flexbox
              v-else-if="isModule(item)"
              align="stretch"
              class="b-cell-b">
              <div class="b-cell-name">{{ item.name }}</div>
              <div class="b-cell-value can-check" @click="checkModuleDetail(item)">{{ getModuleName(item) }}</div>
            </flexbox>

            <flexbox
              v-else-if="item.formType === 'checkbox' || item.formType === 'structure' || item.formType === 'user'"
              align="stretch"
              class="b-cell-b">
              <div class="b-cell-name">{{ item.name }}</div>
              <div class="b-cell-value">{{ item.value | arrayValue(getArrayKey(item.formType)) }}</div>
            </flexbox>

            <flexbox
              v-else-if="item.formType === 'file'"
              align="stretch"
              class="b-cell-b">
              <div class="b-cell-name">{{ item.name }}</div>
              <div class="b-cell-value">
                <file-list-view :list="item.value || []" />
              </div>
            </flexbox>

            <flexbox
              v-else-if="item.formType === 'check_status'"
              align="stretch"
              class="b-cell-b">
              <div class="b-cell-name">{{ item.name }}</div>
              <div class="b-cell-value">{{ getStatusName(item.value) }}</div>
            </flexbox>

            <flexbox
              v-else
              align="stretch"
              class="b-cell-b">
              <div class="b-cell-name">{{ item.name }}</div>
              <div class="b-cell-value">{{ item.value }}</div>
            </flexbox>
          </flexbox-item>
        </flexbox>
      </wk-head-section>
      <slot />
    </div>
    <map-view
      v-if="showMapView"
      :title="mapViewInfo.title"
      :lat="mapViewInfo.lat"
      :lng="mapViewInfo.lng"
      @hidden="showMapView=false" />

    <c-r-m-full-screen-detail
      :id="fullDetailId"
      :visible.sync="showFullDetail"
      :crm-type="fullDetailType" />
  </div>
</template>

<script>
import crmTypeModel from '@/views/crm/model/crmTypeModel'
import WkHeadSection from '@/components/NewCom/WkHeadSection'
import { filedGetInformationAPI } from '@/api/crm/common'
import MapView from '@/components/MapView' // 地图详情
import FileListView from '@/components/FileListView'
import { crmMarketingInformationAPI } from '@/api/crm/marketing'
import CheckStatusMixin from '@/mixins/CheckStatusMixin'

import { separator } from '@/filters/vueNumeralFilter/filters'
import { isObject } from '@/utils/types'
import { getWkDateTime } from '@/utils'

export default {
  // 客户管理 的 基本信息
  name: 'CRMBaseInfo',
  components: {
    WkHeadSection,
    MapView,
    FileListView,
    CRMFullScreenDetail: () => import('@/components/CRMFullScreenDetail')
  },
  filters: {
    arrayValue(array, field) {
      if (
        !array ||
        Object.prototype.toString.call(array) !== '[object Array]'
      ) {
        return ''
      }

      return array
        .map(item => {
          return field ? item[field] : item
        })
        .join('，')
    }
  },
  mixins: [CheckStatusMixin],
  props: {
    // 模块ID
    id: [String, Number],
    poolId: [String, Number],
    detail: {
      type: Object,
      default: () => {
        return {}
      }
    },
    // 没有值就是全部类型 有值就是当个类型
    crmType: {
      type: String,
      default: ''
    },
    // 固定字段的数据
    filedList: Array
  },
  data() {
    return {
      loading: false,
      list: [],
      // 控制展示地图详情
      showMapView: false,
      // 地图详情信息
      mapViewInfo: {},
      showFullDetail: false,
      fullDetailId: '',
      fullDetailType: ''
    }
  },
  inject: ['rootTabs'],
  computed: {},
  watch: {
    id(val) {
      if (!this.filedList) {
        this.getBaseInfo(true)
      }
    },

    filedList() {
      this.list = this.filedList
    },

    'rootTabs.currentName'(val) {
      if (val === 'CRMBaseInfo') {
        if (!this.filedList) {
          this.getBaseInfo(false)
        }
      }
    }
  },
  created() {
    this.$bus.on('crm-detail-update', (data) => {
      if (!this.filedList) {
        this.getBaseInfo(false)
      }
    })
  },
  beforeDestroy() {
    this.$bus.off('crm-detail-update')
  },
  mounted() {
    if (this.filedList) {
      this.list = this.filedList
    } else {
      this.getBaseInfo(true)
    }
  },
  methods: {
    /**
     * 获取基础信息
     */
    getBaseInfo(loading) {
      this.loading = !!loading
      if (this.crmType === 'marketing') {
        crmMarketingInformationAPI().then(res => {
          this.list = res.data
          this.loading = false
        }).catch(() => {
          this.loading = false
        })
      } else {
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
            const baseList = []
            const systemList = []
            res.data.forEach(item => {
              if (item.formType === 'floatnumber') {
                item.value = separator(item.value)
              } else if (item.formType === 'date') {
                item.value = getWkDateTime(item.value)
              }
              if (item.sysInformation == 1) {
                systemList.push(item)
              } else {
                baseList.push(item)
              }
            })

            this.list = [
              {
                name: '基本信息',
                list: baseList
              },
              {
                name: '系统信息',
                list: systemList
              }
            ]
            this.loading = false
          })
          .catch(() => {
            this.loading = false
          })
      }
    },

    /**
     * 查看地图详情
     */
    checkMapView(item) {
      if (item.value && item.value !== '') {
        this.mapViewInfo = {
          title: item.value.location,
          lat: item.value.lat,
          lng: item.value.lng
        }
        this.showMapView = true
      }
    },

    getArrayKey(type) {
      if (type === 'structure') {
        return 'name'
      } else if (type === 'user') {
        return 'realname'
      }

      return ''
    },

    isModule(item) {
      return [
        'customer',
        'business',
        'contract',
        'contacts',
        'category',
        'statusName',
        'typeName'].includes(item.formType)
    },

    getShowBlock(type) {
      return ['map_address', 'file'].includes(type)
    },

    getModuleName(item) {
      const field = {
        customer: 'customerName',
        business: 'businessName',
        contract: 'contractNum',
        contacts: 'contactsName',
        category: 'categoryName',
        statusName: 'statusName',
        typeName: 'typeName'
      }[item.formType]
      return item.value ? item.value[field] : ''
    },

    /**
     * 查看详情
     */
    checkModuleDetail(data) {
      if (isObject(data.value)) {
        this.fullDetailType = data.formType
        this.fullDetailId = data.value[`${data.formType}Id`]
        this.showFullDetail = true
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.b-cont {
  position: relative;
  height: 100%;
  overflow-y: auto;
  overflow-y: overlay;
}

.b-cells + .b-cells {
  margin-top: 24px;
}

.b-cell {
  padding: 0 10px;
}

.b-cell-b {
  width: auto;
  margin-bottom: 16px;

  .b-cell-name {
    flex-shrink: 0;
    width: 100px;
    padding-top: 3px;
    margin-right: 12px;
    line-height: 1.5;
    color: $--color-text-regular;
    text-align: right;
  }

  .b-cell-value {
    flex: 1;
    min-height: 32px;
    padding: 3px 6px;
    line-height: 1.5;
    word-break: break-all;
    word-wrap: break-word;
    white-space: pre-wrap;
    background-color: $--input-disabled-fill;
    border: $--border-width-medium $--border-style-base $--input-disabled-border;
    border-radius: $--input-border-radius;
  }

  .b-cell-foot {
    display: block;
    flex-shrink: 0;
    width: 15px;
    height: 15px;
    margin-left: 8px;
  }
}

.value-box {
  min-height: 32px;
  padding: 3px 6px;
  background-color: $--input-disabled-fill;
  border: $--border-width-medium $--border-style-base $--input-disabled-border;
  border-radius: $--input-border-radius;
}

.f-item {
  height: 25px;
  padding: 3px 0;

  .f-img {
    position: block;
    width: 15px;
    height: 15px;
    padding: 0 1px;
    margin-right: 8px;
  }

  .f-name {
    margin-right: 10px;
    color: $--color-n80;
  }
}

.can-check {
  color: $--color-primary !important;
  cursor: pointer;
}

/deep/.section {
  margin-top: 0;

  .section-header {
    padding: 0;
    margin-bottom: $--interval-base;
  }

  .content {
    overflow: hidden;
  }
}

</style>
