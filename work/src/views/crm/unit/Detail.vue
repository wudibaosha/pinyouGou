<!-- <template>
  <slide-view
    v-empty="!canShowDetail"
    :listener-ids="listenerIDs"
    :no-listener-ids="noListenerIDs"
    :no-listener-class="noListenerClass"
    :body-style="{padding: 0, height: '100%'}"
    xs-empty-icon="nopermission"
    xs-empty-text="暂无权限"
    class="d-view"
    @afterEnter="viewAfterEnter"
    @close="hideView">
    <div
      ref="crmDetailMain"
      v-loading="loading"
      class="detail-main no-padding">
      <flexbox
        v-if="canShowDetail && detailData"
        direction="column"
        align="stretch"
        class="d-container">
        <c-r-m-detail-head
          :id="id"
          :class="{'is-shadow': bodyIsScroll}"
          :detail="detailData"
          :page-list="pageList"
          crm-type="marketing"
          @pageChange="pageChange"
          @handle="detailHeadHandle"
          @close="hideView" />

        <div class="d-container-body" @scroll="bodyScroll">
          <detail-head-base :list="headDetails" />
          <el-tabs
            v-model="tabCurrentName"
            nav-mode="more"
            @tab-click="handleClick">
            <el-tab-pane
              v-for="(item, index) in tabNames"
              :key="index"
              :label="item.label"
              :name="item.name"
              lazy>
              <c-r-m-base-info
                v-if="item.name === 'CRMBaseInfo'"
                :id="id"
                :detail="detailData"
                :filed-list="baseDetailList"
                crm-type="marketing">
                <wk-head-section
                  label="图片信息"
                  :props="{
                    headBgColor: '#FAFBFC',
                    arrows: 'left',
                    border: false,
                    bodyPadding: '0'
                  }"
                  class="b-cells">
                  <div class="image">
                    <div v-if="mainFileList.length > 0" class="image-info">
                      <div class="image-info__label">活动图片</div>
                      <div class="image-info__list">
                        <img
                          v-for="(item, index) in mainFileList"
                          :key="index"
                          v-src="item.url"
                          class="main-img"
                          @click="previewImage(mainFileList, index)">
                      </div>
                    </div>
                    <div v-if="detailFileList.length > 0" class="image-info">
                      <div class="image-info__label">活动详情图片</div>
                      <div class="image-info__list">
                        <img
                          v-for="(item, index) in detailFileList"
                          :key="index"
                          v-src="item.url"
                          class="detial-img"
                          @click="previewImage(detailFileList, index)">
                      </div>
                    </div>
                    <div v-if="detailFileList.length == 0 && mainFileList.length == 0" class="no-img">暂无图片</div>
                  </div>
                </wk-head-section>
              </c-r-m-base-info>
              <component
                :is="item.name"
                v-else
                :id="id"
                :detail="detailData"
                :filed-list="baseDetailList"
                crm-type="marketing" />
            </el-tab-pane>
          </el-tabs>
        </div>
      </flexbox>
    </div>
    <create
      v-if="isCreate"
      :action="{type: 'update', id: id, detail: detailData}"
      @save-success="editSaveSuccess"
      @hiden-view="isCreate=false" />
  </slide-view>
</template>

<script>
import { crmMarketingReadAPI } from '@/api/crm/marketing'

import SlideView from '@/components/SlideView'
import CRMDetailHead from '../components/CRMDetailHead'
import CRMBaseInfo from '../components/CRMBaseInfo' // 基本信息
import Overview from './components/Overview'
import Statistics from './components/Statistics'
import Create from './components/Create'
import WkHeadSection from '@/components/NewCom/WkHeadSection'

import DetailMixin from '../mixins/Detail'

export default {
  /** 客户管理 的 活动详情 */
  name: 'MarketingDetail',

  components: {
    SlideView,
    CRMDetailHead,
    CRMBaseInfo,
    Overview,
    Statistics,
    Create,
    WkHeadSection
  },

  mixins: [DetailMixin],

  props: {
    // 详情信息id
    id: [String, Number],
    // 监听的dom 进行隐藏详情
    listenerIDs: {
      type: Array,
      default: () => {
        return ['crm-main-container']
      }
    },
    // 不监听
    noListenerIDs: {
      type: Array,
      default: () => {
        return []
      }
    },
    noListenerClass: {
      type: Array,
      default: () => {
        return ['el-table__body']
      }
    }
  },

  data() {
    return {
      loading: false, // 展示加载loading
      crmType: 'marketing',
      detailData: {}, // read 详情
      baseDetailList: [], // 基本详情list
      headDetails: [],
      tabCurrentName: 'Overview',
      isCreate: false // 编辑操作
    }
  },

  computed: {
    tabNames() {
      var tempsTabs = []
      tempsTabs.push({ label: '预览', name: 'Overview' })
      tempsTabs.push({ label: '基本信息', name: 'CRMBaseInfo' })
      tempsTabs.push({ label: '统计分析', name: 'Statistics' })
      return tempsTabs
    },
    mainFileList() {
      if (this.detailData && this.detailData.mainFileList) {
        return this.detailData.mainFileList
      }

      return []
    },

    detailFileList() {
      if (this.detailData && this.detailData.detailFileList) {
        return this.detailData.detailFileList
      }

      return []
    }
  },

  mounted() {},

  methods: {
    getDetial() {
      this.loading = true
      crmMarketingReadAPI({
        marketingId: this.id
      })
        .then(res => {
          this.loading = false
          const resData = res.data || {}
          this.detailData = resData
          this.getBaseList(resData)

          this.headDetails = [
            { title: '关联对象', value: resData.crmTypeName },
            { title: '状态', value: resData.status == 1 ? '启用' : '停用' },
            { title: '创建人', value: resData.createUserInfo ? resData.createUserInfo.realname : '' },
            { title: '截止时间', value: resData.endTime }
          ]
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 获取基本信息数据
     */
    getBaseList(data) {
      const relationUserInfo = data.relationUserInfo ? data.relationUserInfo.map(item => item.realname) : []
      const relationDeptInfo = data.relationDeptInfo ? data.relationDeptInfo.map(item => item.name || '') : []
      this.baseDetailList = [
        {
          name: '基本信息',
          list: [
            {
              name: '活动名称',
              formType: 'text',
              value: data.marketingName
            },
            {
              name: '关联对象',
              formType: 'text',
              value: data.crmTypeName
            },
            {
              name: '参与人员',
              formType: 'text',
              value: relationUserInfo.concat(relationDeptInfo).map(item => item).join('，')
            },
            {
              name: '活动类型',
              formType: 'text',
              value: data.marketingType
            },
            {
              name: '开始时间',
              formType: 'text',
              value: data.startTime
            },
            {
              name: '截止时间',
              formType: 'text',
              value: data.endTime
            },
            {
              name: '浏览数',
              formType: 'text',
              value: data.browse
            },
            {
              name: '提交数',
              formType: 'text',
              value: data.submitNum
            },
            {
              name: '活动预算',
              formType: 'text',
              value: data.marketingMoney
            },
            {
              name: '活动地址',
              formType: 'text',
              value: data.address
            },
            {
              name: '活动简介',
              formType: 'text',
              value: data.synopsis
            },
            {
              name: '状态',
              formType: 'text',
              value: data.status == 1 ? '启用' : '停用'
            },
            {
              name: '创建人',
              formType: 'text',
              value: data.createUserInfo ? data.createUserInfo.realname : ''
            },

            {
              name: '创建时间',
              formType: 'text',
              value: data.createTime
            },
            {
              name: '更新时间',
              formType: 'text',
              value: data.updateTime
            }
          ]
        }
      ]
    },

    //* * 点击关闭按钮隐藏视图 */
    hideView() {
      this.$emit('hide-view')
    },

    //* * tab标签点击 */
    handleClick(tab, event) {},

    // editSaveSuccess() {
    //   this.$emit('handle', { type: 'save-success' })
    //   this.getDetial()
    // },

    /**
     * 预览图片
     */
    previewImage(list, index) {
      this.$wkPreviewFile.preview({
        index: index,
        data: list
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/crmdetail.scss";
@import "../styles/detailview.scss";

.image {
  color: $--color-text-primary;

  &-info {
    margin: 10px 25px 0;

    &__label {
      font-size: 13px;
    }

    &__list {
      overflow-x: auto;
      white-space: nowrap;

      img {
        margin-top: 15px;
        cursor: pointer;
        border-radius: $--border-radius-base;
      }

      img + img {
        margin-left: 20px;
      }

      .main-img {
        width: 100px;
        height: 76px;
        object-fit: contain;
        vertical-align: top;
      }

      .detial-img {
        width: 100px;
        height: 80px;
        object-fit: contain;
        vertical-align: top;
      }
    }
  }

  .no-img {
    margin: 50px 0;
    color: $--color-text-regular;
    text-align: center;
  }
}
</style> -->
