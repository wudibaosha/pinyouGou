<template>
  <div>
    <el-dialog
      :visible.sync="visible"
      :close-on-click-modal="false"
      :before-close="beforeClose"
      :title="title"
      append-to-body
      width="580px">
      <div v-if="!showRepeat">
        <el-form ref="ruleForm" :model="form" :rules="rules" label-position="top">
          <el-form-item
            class="wk-form-item"
            prop="title"
            label="日程内容">
            <el-input
              v-model="form.title"
              class="input-inner"
              maxlength="100"
              placeholder="请输入日程内容"
              style="width: 100%;"
              show-word-limit />
          </el-form-item>
          <el-form-item
            class="wk-form-item"
            label="日程类型"
            prop="typeId">
            <div class="color-change">
              <span :style="{backgroundColor: colorItem}" class="custom_left" />
            </div>
            <el-select
              v-model="form.typeId"
              placeholder="选择日程类型"
              class="select-color">
              <el-option
                v-for="item in cusCheck"
                v-if="item.type == 2"
                :key="item.typeId"
                :value="item.typeId"
                :label="item.typeName"
                @click.native="changeType(item)">
                <span :style="{backgroundColor: item.color}" class="custom_left" />
                <span class="custom_right">{{ item.typeName }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item
            class="wk-form-item"
            label="开始时间"
            prop="startTime">
            <el-date-picker
              v-model="form.startTime"
              value-format="yyyy-MM-dd HH:mm:ss"
              type="datetime"
              default-time="09:00:00"
              placeholder="选择日期"
              style="width: 100%;"
              @change="changeStartTime" />
          </el-form-item>
          <el-form-item
            class="wk-form-item"
            label="结束时间"
            prop="endTime">
            <el-date-picker
              v-model="form.endTime"
              :picker-options="pickerOptions"
              type="datetime"
              default-time="09:00:00"
              value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="选择日期"
              style="width: 100%;" />
          </el-form-item>
          <el-form-item
            class="wk-form-item"
            label="参与人员"
            prop="ownerUserIds"
            style="margin-bottom: 6px;">
            <wk-user-dialog-select
              v-model="form.ownerUserIds"
              :radio="false"
              style="display: inline-block;width: 100%;" />
          </el-form-item>
          <el-form-item
            v-if="!choseMore"
            class="wk-form-item"
            style="margin-top: -10px;">
            <el-button
              style="font-size: 14px;"
              type="text"
              @click="choseMore = true">+添加更多选项</el-button>
          </el-form-item>
          <template v-if="choseMore">
            <!-- <el-form-item
            class="wk-form-item"
            v-if="editAll" label="重复">
              <el-select
                v-model="form.repetitionType"
                placeholder="选择重复类型">
                <el-option
                  v-for="item in repeatList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                  @click.native="selectRepeat"/>
              </el-select>
            </el-form-item> -->
            <template v-for="(noticeItem,index) in notice">
              <el-form-item
                :key="index"
                class="wk-form-item"
                style="margin-bottom: 8px;"
                label="提前">
                <el-select v-model="notice[index].value" placeholder="选择时间" class="time-select">
                  <el-option
                    v-for="item in timeList[notice[index].type || 1]"
                    :key="item"
                    :label="item"
                    :value="item" />
                </el-select>
                <el-select
                  v-model="notice[index].type"
                  class="time-select"
                  @change="changeTimeType(notice[index].type, index)">
                  <el-option :value="1" label="分钟" />
                  <el-option :value="2" label="小时" />
                  <el-option :value="3" label="天" />
                </el-select>
                <el-button
                  v-if="index != 0"
                  icon="el-icon-delete"
                  type="text"
                  @click="deleteNotice(index)" />
              </el-form-item>
            </template>
            <el-button class="add-notice-btn" type="primary-text" @click="addNewNotice">添加新提醒</el-button>
            <el-form-item
              class="wk-form-item"
              label="相关信息">
              <related-business
                :is-task="true"
                :all-data="allData"
                :margin-left="'0'"
                show-foot
                @unbind="unbindRelatedInfo"
                @checkInfos="checkInfos" />
            </el-form-item>
          </template>
          <el-form-item
            v-if="choseMore"
            class="wk-form-item"
            style="margin-top: -10px;">
            <el-button style="font-size: 14px;" type="text" @click="choseMore = false">隐藏更多选项</el-button>
          </el-form-item>
        </el-form>
      </div>
      <repeat
        v-else
        ref="repeat"
        :detail="todayDetailData"
        :repeat-type="form.repetitionType"
        margin-left="80px" />
      <div slot="footer" class="dialog-footer">
        <el-button :disabled="disabled" type="primary" @click="sure">确定</el-button>
        <el-button @click="cancle">取消</el-button>
      </div>
    </el-dialog>
  </div>

</template>
<script>
import WkUserDialogSelect from '@/components/NewCom/WkUserDialogSelect'
import RelatedBusiness from '@/components/RelatedBusiness'
import Repeat from './Repeat'
import { mapGetters } from 'vuex'
import {
  canlendarSaveAPI,
  canlendarUpdateAPI,
  canlendarQueryTypeListAPI
} from '@/api/oa/calendar'
export default {
  components: {
    WkUserDialogSelect,
    RelatedBusiness,
    Repeat
  },
  props: {
    showCreate: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '新增日程'
    },
    selectDiv: {
      type: String,
      default: ''
    },
    colorList: {
      type: Array,
      default: () => {
        return []
      }
    },
    // cusCheck: {
    //   type: Array,
    //   default: () => {
    //     return []
    //   }
    // },
    todayDetailData: {
      type: Object,
      default: () => {
        return {}
      }
    },
    // 是否编辑所有的系列
    editAll: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      visible: false,
      // 是否展示按日期重复的dialog
      showRepeat: false,
      repeatForm: {},
      form: {
        title: '',
        typeId: '', // 日程类型
        ownerUserIds: [],
        repetitionType: 1,
        startTime: '',
        endTime: ''
      },
      notice: [
        {
          value: 5,
          type: 1
        }
      ],
      // 选中的关联项
      allData: {},
      businessRelation: {},
      // 选中的类型对应的颜色在颜色数组中的位置
      colorItem: '',
      choseMore: false,
      // 选中的参与人员
      repeatList: [
        { label: '从不重复', value: 1 }
        // { label: '每天', value: 2 },
        // { label: '每周', value: 3 },
        // { label: '每月', value: 4 },
        // { label: '每年', value: 5 }
      ],
      timeList: ['',
        [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]],
      rules: {
        title: [
          { required: true, message: '日程内容不能为空', trigger: 'blur' }
        ],
        typeId: [
          { required: true, message: '请选择日程类型', trigger: 'change' }
        ],
        startTime: [
          { required: true, message: '请选择开始时间', trigger: 'blur' }
        ],
        endTime: [
          { required: true, message: '请选择结束时间', trigger: 'blur' }
        ],
        ownerUserIds: [
          { required: true, message: '请选择参与人', trigger: 'change' }
        ]
      },
      disabled: false,
      pickerOptions: {
        disabledDate(time) {
          return time.getTime() <= (Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      cusCheck: []
    }
  },
  computed: {
    ...mapGetters(['userInfo'])
  },
  watch: {
    showCreate(val) {
      this.visible = val
      if (val) {
        this.form = {
          title: '',
          typeId: '', // 日程类型
          ownerUserIds: [],
          repetitionType: 1,
          startTime: '',
          endTime: ''
        }
        this.notice = [
          {
            value: 5,
            type: 1
          }
        ]
        this.form.ownerUserIds = [this.userInfo.userId]
        if (this.selectDiv) {
          this.form.startTime = this.selectDiv + ' 08:00:00'
          this.changeStartTime(this.form.startTime)
        } else {
          this.form.startTime = ''
        }

        this.allData = {}
        this.getCusCheck()
        this.choseMore = false
      }
    },

    allData: {
      handler(val) {
        Object.keys(val).forEach(key => {
          const list = this.allData[key] || []
          const ids = []
          list.forEach(item => {
            ids.push(item[key + 'Id'])
          })
          this.businessRelation[key + 'Ids'] = ids.join(',')
        })
      },
      deep: true
    }
  },
  mounted() {
  },
  methods: {
    /**
     * 关闭
     */
    beforeClose(done) {
      if (this.showRepeat) {
        this.showRepeat = false
        return
      } else {
        this.$refs['ruleForm'].resetFields()
        this.$emit('close')
        done()
      }
    },

    /**
     * 详情
     */
    getDetail() {
      const length = Object.keys(this.todayDetailData).length
      if (length !== 0) {
        this.form = {
          title: this.todayDetailData.title,
          typeId: this.todayDetailData.typeId, // 日程类型
          ownerUserIds: this.todayDetailData.ownerUserList ? this.todayDetailData.ownerUserList.map(item => item.userId) : [],
          repetitionType: this.todayDetailData.repetitionType || '',
          startTime: this.todayDetailData.startTime || '',
          endTime: this.todayDetailData.endTime || '',
          eventId: this.todayDetailData.eventId,
          batchId: this.todayDetailData.batchId
        }
        this.allData = {
          customer: (this.todayDetailData.customerList || []).map(item => {
            if (item.id) {
              item.customerId = item.id
            }
            return item
          }),
          contacts: (this.todayDetailData.contactsList || []).map(item => {
            if (item.id) {
              item.contactsId = item.id
            }
            return item
          }),
          contract: (this.todayDetailData.contractList || []).map(item => {
            if (item.id) {
              item.contractId = item.id
            }
            return item
          }),
          business: (this.todayDetailData.businessList || []).map(item => {
            if (item.id) {
              item.businessId = item.id
            }
            return item
          })
        }
        this.notice = this.todayDetailData.noticeList
        this.form.repeatTime = this.todayDetailData.repeatTime
        this.form.repeatRate = this.todayDetailData.repeatRate
        this.form.endTypeConfig = this.todayDetailData.endTypeConfig
        this.form.endType = this.todayDetailData.endType || ''
        this.cusCheck.forEach(item => {
          if (item.typeId === this.form.typeId) {
            this.colorItem = item.color
            return
          }
        })
      } else {
        const defaultList = []
        this.cusCheck.forEach((item) => {
          if (item.type === 2) {
            defaultList.push(item)
          }
        })
        this.colorItem = defaultList[0].color
        this.form.typeId = defaultList[0].typeId
        this.businessRelation = {}
      }
    },
    /**
     * 选择类型
     */
    changeType(data) {
      this.colorItem = data.color
    },

    /**
     * 选中的关联信息
     */
    checkInfos(dataIds, data) {
      this.allData = data
      Object.keys(dataIds).forEach(key => {
        this.businessRelation[key] = dataIds[key].length ? dataIds[key].join(',') : ''
      })
      this.businessRelation = JSON.parse(JSON.stringify(this.businessRelation))
    },

    /**
     * 解绑详情信息
     */
    unbindRelatedInfo(field, item, index) {
      this.$confirm('确认取消关联?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'is-particulars'
      })
        .then(() => {
          const tempRelatedListData = JSON.parse(JSON.stringify(this.allData))
          tempRelatedListData[field].splice(index, 1)
          this.allData = tempRelatedListData
        })
        .catch(() => {})
    },

    /**
     * 选择重复类型
     */
    selectRepeat(data) {
      this.showRepeat = true
    },

    /**
     * 取消
     */
    cancle() {
      if (this.showRepeat) {
        this.showRepeat = false
        this.repeatForm = {}
        this.form.repetitionType = 1
        this.$refs.repeat.$refs['ruleForm'].resetFields()
      } else {
        this.form = {}
        this.$refs['ruleForm'].resetFields()
        this.$emit('close')
      }
    },

    /**
     * 确定
     */
    sure() {
      if (this.showRepeat) {
        this.repeatForm = this.$refs.repeat.form
        this.$refs.repeat.$refs['ruleForm'].validate(valid => {
          if (valid) {
            if (this.$refs.repeat.endDate) {
              this.repeatForm.endTypeConfig = this.$refs.repeat.endDate
            } else {
              this.repeatForm.endTypeConfig = this.$refs.repeat.endCount
            }
            this.form = {
              ...this.form,
              ownerUserIds: this.form.ownerUserIds.join(','),
              ...this.repeatForm
            }
            this.showRepeat = false
          } else {
            return false
          }
        })
      } else {
        this.$refs['ruleForm'].validate((valid) => {
          if (valid) {
            this.createSchedule()
          } else {
            return false
          }
        })
      }
    },

    /**
     * 新建/编辑日程
     */
    createSchedule() {
      const params = { }
      this.disabled = true
      if (Object.keys(this.businessRelation).length) {
        params.relation = this.businessRelation
      }
      const length = Object.keys(this.todayDetailData).length
      const request = this.getRequest()
      params.notice = this.notice
      params.event = {
        ...this.form,
        ownerUserIds: this.form.ownerUserIds.join(',')
      }
      if (length) {
        params.time = new Date(this.todayDetailData.startTime).getTime()
        if (this.editAll) {
          params.type = 3
        } else {
          params.type = 2
          params.event.repetitionType = 1
        }
      }

      request(params).then(res => {
        this.$message.success('新建或编辑日程成功')
        this.disabled = false
        this.$emit('createSuccess')
      }).catch(() => {
        this.disabled = false
      })
    },

    /**
     * 获取请求
     */
    getRequest() {
      const length = Object.keys(this.todayDetailData).length
      if (length) {
        return canlendarUpdateAPI
      } else {
        return canlendarSaveAPI
      }
    },

    /**
     * 添加新提醒
     */
    addNewNotice() {
      this.notice.push({
        value: 5,
        type: 1
      })
    },

    /**
     * 删除提醒
     */
    deleteNotice(index) {
      this.notice.splice(index, 1)
    },

    /**
     * 更换时间类型
     */
    changeTimeType(type, index) {
      if (type == 1) {
        this.notice[index].value = 5
      } else {
        this.notice[index].value = 1
      }
    },

    /**
     * 改变开始时间
     */
    changeStartTime(date) {
      this.form.endTime = ''
      const template = new Date(date).getTime()
      this.pickerOptions = {
        disabledDate(time) {
          return time.getTime() <= template - 24 * 60 * 60 * 1000
        }
      }
    },

    /**
     * 获取类型
     */
    getCusCheck() {
      canlendarQueryTypeListAPI().then(res => {
        this.cusCheck = res.data
        this.getDetail()
      }
      ).catch()
    }
  }
}
</script>
<style scoped lang="scss">
@import "@/styles/wk-form.scss";

/deep/.el-dialog {
  .el-dialog__body {
    max-height: 55vh;
    padding: 25px;
    overflow-y: auto;

    .el-form {
      .el-form-item {
        margin-bottom: 16px;

        .el-input__inner {
          width: 100%;
        }

        .select-color {
          width: 100%;

          .el-input__inner {
            padding-left: 32px;
          }
        }
      }

      .time-select {
        margin-right: 8px;

        .el-input__inner {
          width: 162px;
        }
      }
    }
  }
}

.custom_left {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 10px;
  vertical-align: sub;
  border-radius: 4px;
}

.custom_right {
  display: inline-block;
  height: 20px;
  line-height: 20px;
}

.color-change {
  position: absolute;
  top: -2px;
  left: 8px;
  z-index: 1;
}

/deep/.user-container {
  width: 100%;
}

/deep/.add-btn {
  height: 34px;
  line-height: 28px;
}

/deep/.cell {
  height: 40px;
}

.related-business {
  margin: 0 !important;
}

.add-notice-btn {
  padding-left: 0;
  margin-bottom: 8px;
}

.input-inner {
  /deep/ .el-input__inner {
    padding-right: 60px;
  }

  /deep/ .el-input__suffix .el-input__suffix-inner {
    background-color: none;
  }
}
</style>

