export default {
  data() {
    return {
      modelOptions: [{
        label: '客户管理',
        value: 'crm',
        list: [{
          label: '线索',
          value: 21
        }, {
          label: '客户',
          value: 22
        }, {
          label: '联系人',
          value: 23
        }, {
          label: '商机',
          value: 24
        }, {
          label: '合同',
          value: 25
        }, {
          label: '回款',
          value: 26
        }, {
          label: '发票',
          value: 27
        }, {
          label: '回访',
          value: 28
        }, {
          label: '产品',
          value: 29
        }, {
          label: '市场活动',
          value: 30
        }]
      }, {
        label: '办公管理',
        value: 'oa',
        list: [{
          label: '日历',
          value: 41
        }, {
          label: '日志',
          value: 42
        }]
      } /* {
        label: '项目管理',
        value: 'work',
        list: [{
          label: '项目',
          value: 51
        }, {
          label: '任务',
          value: 52
        }]
      },*/ ],
      sysOptions: [
        { label: '企业首页', value: 1 },
        { label: '应用管理', value: 2 },
        { label: '员工管理', value: 3 },
        { label: '部门管理', value: 4 },
        { label: '角色管理', value: 5 },
        { label: '客户管理', value: 7 },
        { label: '人力资源', value: 8 },
        { label: '办公管理', value: 11 }
      ],
      fieldList: [
        {
          prop: 'realname',
          label: '用户',
          width: 100
        },
        {
          prop: 'createTime',
          label: '时间',
          width: 150
        },
        {
          prop: 'ipAddress',
          label: 'IP地址',
          width: 100
        },
        {
          prop: 'model',
          label: '模块',
          width: 150
        },
        {
          prop: 'behavior',
          label: '行为',
          width: 150
        },
        {
          prop: 'object',
          label: '对象',
          width: 150
        },
        {
          prop: 'detail',
          label: '操作详情',
          width: 100
        }
      ]
    }
  },

  methods: {
    getModelName(model) {
      return {
        crm: '客户管理',
        oa: '办公管理',
        admin: '系统管理'
      }[model]
    }
  }
}
