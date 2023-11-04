<template>
  <div class="activity-item">
    <template v-for="(field, index) in fieldsMap[itemData.activityType]">
      <flexbox
        v-if="getShow(field)"
        :key="index"
        :gutter="0"
        align="flex-start"
        justify="flex-start"
        class="row-item">
        <span>{{ getLabel(field) }}：</span>

        <flexbox-item
          v-if="[
            'products'
          ].includes(field.fieldName)">
          <template v-if="getContent(field).length">
            <div
              v-for="(child, childIndex) in getContent(field)"
              :key="childIndex"
              :class="{ 'special': !!field.type }"
              @click="handleClick(field.type, child.id)">
              {{ child.name }}
            </div>
          </template>
        </flexbox-item>

        <flexbox-item v-else>
          <span
            v-if="field.type && !field.disabled"
            class="special"
            @click="handleClick(field.type, field.idField ? contentData[field.idField] : null)">
            {{ getContent(field) }}
          </span>
          <span v-else>{{ getContent(field) }}</span>

          <el-tag
            v-if="field.fieldName === 'name' && contentData.hasOwnProperty('checkStatus')"
            :style="{
              color: getStatusColor(contentData.checkStatus)
            }"
            :color="getBgColor(contentData.checkStatus)"
            class="examine-status">
            {{ getStatusName(contentData.checkStatus) }}
          </el-tag>
        </flexbox-item>
      </flexbox>
    </template>
  </div>
</template>

<script>
import CheckStatusMixin from '@/mixins/CheckStatusMixin'
import { convertHexByOpacity } from '@/utils'
import { isObject } from '@/utils/types'

export default {
  name: 'ActivityItem',
  mixins: [CheckStatusMixin],
  props: {
    itemData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      fieldsMap: {
        // 线索
        1: [
          { fieldName: 'name', name: '线索名称', type: 'leads' }
        ],
        // 客户
        2: [
          { fieldName: 'name', name: '客户联系人', type: 'customer' },
          { fieldName: 'industry', name: '客户行业' },
          { fieldName: 'level', name: '客户级别' }
        ],
        // 联系人
        3: [
          { fieldName: 'name', name: '联系人名称', type: 'contacts' },
          { fieldName: 'post', name: '职务' },
          { fieldName: 'mobile', name: '手机' }
        ],
        // 产品
        4: [
          { fieldName: 'name', name: '产品名称', type: 'product' }
        ],
        // 商机
        5: [
          { fieldName: 'name', name: '商机名称', type: 'business' },
          { fieldName: 'money', name: '商机金额' },
          { fieldName: 'flowName', name: '商机状态组' },
          { fieldName: 'products', name: '相关产品', type: 'product' }
        ],
        // 合同
        6: [
          { fieldName: 'name', name: '合同名称', type: 'contract' },
          { fieldName: 'num', name: '合同编号' },
          { fieldName: 'money', name: '合同金额' },
          { fieldName: 'timeLine', name: '合同有效期' }
        ],
        // 回款
        7: [
          { fieldName: 'name', name: '回款编号', type: 'receivables' },
          { fieldName: 'contractNum', name: '合同编号', type: 'contract', idField: 'contractId' },
          { fieldName: 'num', name: '回款编号' },
          { fieldName: 'money', name: '回款金额' },
          { fieldName: 'returnTime', name: '回款日期' }
        ],
        // 日志
        8: [
          { fieldName: 'name', name: '日志名称', type: 'log' },
          { fieldName: 'content', name: '日志内容' }
        ],
        // 审批
        9: [
          { fieldName: 'name', name: '审批名称', type: 'examine' },
          { fieldName: 'type', name: '审批类型' },
          { fieldName: 'content', name: '' },
          { fieldName: 'endAddress', name: '出差地点' },
          { fieldName: 'duration', name: '出差总天数' },
          { fieldName: 'timeLine', name: '起止时间' }
        ],
        // 日程
        10: [
          { fieldName: 'name', name: '日程内容' },
          { fieldName: 'type', name: '日程类型' },
          { fieldName: 'timeLine', name: '起止时间' }
        ],
        // 任务
        11: [
          { fieldName: 'name', name: '任务名称', type: 'task' },
          { fieldName: 'ownerUser', name: '负责人' },
          { fieldName: 'timeLine', name: '起止时间' },
          { fieldName: 'tasks', name: '子任务', type: 'task', disabled: true }
        ],
        // 发邮件
        12: [],
        // 回款计划
        14: [
          { fieldName: 'name', name: '计划回款期数', type: 'receivablesPlan' },
          { fieldName: 'num', name: '合同编号', type: 'contract', idField: 'contractId' },
          { fieldName: 'money', name: '计划回款金额' },
          { fieldName: 'returnTime', name: '计划回款日期' }
        ]
      }
    }
  },
  computed: {
    contentData() {
      return this.itemData.content || {}
    }
  },
  methods: {
    getBgColor(status) {
      const color = this.getStatusColor(status)
      return convertHexByOpacity(color, 0.2)
    },

    /**
     * 判断字段是否展示
     * @param field
     * @return {boolean}
     */
    getShow(field) {
      if (field.fieldName === 'timeLine') {
        // 不展示起止时间  2 请假审批 4 加班审批  activityType  OA 审批
        if (this.itemData.activityType === 9) {
          return this.contentData.type == 2 || this.contentData.type == 4
        }
        return true
      }
      return this.contentData.hasOwnProperty(field.fieldName)
    },

    /**
     * 获取字段名
     * @param field
     * @return {*}
     */
    getLabel(field) {
      if (
        this.itemData.activityType === 9 &&
        field.fieldName === 'content'
      ) {
        // type 审批类型 1 普通审批 2 请假审批 3 出差审批 4 加班审批 5 差旅报销 6 借款申请 0 自定义审批
        return {
          1: '审批内容',
          2: '请假原因',
          3: '出差原因',
          4: '加班原因',
          5: '差旅报销',
          6: '审批内容',
          0: '审批内容'
        }[this.contentData.type] || ''
      }
      return field.name
    },

    /**
     * 获取字段值
     * @param field
     * @return {string|*}
     */
    getContent(field) {
      if (
        field.fieldName === 'timeLine' &&
        (
          this.contentData.hasOwnProperty('startTime') ||
          this.contentData.hasOwnProperty('endTime')
        )
      ) {
        return `${this.contentData.startTime}~${this.contentData.endTime}`
      }

      if (
        this.itemData.activityType === 9 &&
        field.fieldName === 'type'
      ) {
        return {
          1: '普通审批',
          2: '请假审批',
          3: '出差审批',
          4: '加班审批',
          5: '差旅报销',
          6: '借款申请',
          0: '自定义审批'
        }[this.contentData.type]
      }

      if ([
        'tasks'
      ].includes(field.fieldName)) {
        return (this.contentData[field.fieldName] || []).map(item => item.name).join('、')
      }

      if ([
        'products'
      ].includes(field.fieldName)) {
        return this.contentData[field.fieldName] || []
      }

      if (field.fieldName === 'ownerUser') {
        const userData = this.contentData[field.fieldName]
        return isObject(userData) ? userData.realname : ''
      }

      return this.contentData[field.fieldName]
    },

    /**
     * 点击查看详情
     */
    handleClick(type, id = null) {
      if (!type) return
      this.$emit('detail', type, id || this.itemData.activityTypeId)
    }
  }
}
</script>

<style scoped lang="scss">
.activity-item {
  .row-item {
    margin-bottom: 3px;
    line-height: 1.5;
    color: $--color-n200;

    .special {
      color: $--color-primary;
      cursor: pointer;
    }

    .examine-status {
      margin-left: 10px;
    }
  }
}
</style>
