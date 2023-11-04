import Layout from '@/views/layout/OaLayout'

const layout = function(meta = {}, path = '/oa') {
  return {
    path: path,
    component: Layout,
    meta: {
      requiresAuth: true,
      ...meta
    }
  }
}

export default [
  // 任务
  {
    ...layout({
      title: '任务',
      permissions: ['oa', 'taskExamine']
    }, '/oa/task'),
    children: [{
      hidden: true, // 不展示 仅用于路由注册
      path: 'subs/:type',
      component: () => import('@/views/oa/taskExamine/task/index'),
      meta: {
        redirect: 'subs/1' // 获取传参的重置链接
      }
    }, {
      ignore: true, // 路由添加时忽略
      path: 'subs/1',
      meta: {
        title: '我的任务',
        icon: 'icon-task-line'
      }
    }, {
      ignore: true, // 路由添加时忽略
      path: 'subs/2',
      meta: {
        title: '下属的任务',
        icon: 'icon-org'
      }
    }]
  },
  // 审批
  {
    ...layout({
      title: '审批',
      permissions: ['oa', 'taskExamine']
    }, '/oa/examine'),
    children: [{
      hidden: true, // 不展示 仅用于路由注册
      path: 'subs/:type',
      component: () => import('@/views/oa/taskExamine/examine/index'),
      meta: {
        redirect: 'subs/my' // 获取传参的重置链接
      }
    }, {
      ignore: true, // 路由添加时忽略
      path: 'subs/my',
      meta: {
        title: '我发出的审批',
        icon: 'approve-line'
      }
    }, {
      ignore: true, // 路由添加时忽略
      path: 'subs/wait',
      meta: {
        title: '待我审批（办公）',
        icon: 'icon-office-line'
      }
    }, {
      hidden: true, // 不展示 仅用于路由注册
      path: 'subs/crm/:type',
      component: () => import('@/views/oa/taskExamine/crm/index'),
      permissionList: [['oa', 'taskExamine'], ['crm', 'contract'], ['crm', 'receivables'], ['crm', 'receivablesPlan']],
      meta: {
        redirect: 'subs/crm/contract' // 获取传参的重置链接
      }
    }, {
      ignore: true, // 路由添加时忽略
      path: 'subs/crm/contract',
      permissions: ['crm', 'contract'],
      meta: {
        title: '待我审批（合同）',
        icon: 'contract-line'
      }
    }, {
      ignore: true, // 路由添加时忽略
      path: 'subs/crm/receivables',
      permissions: ['crm', 'receivables'],
      meta: {
        title: '待我审批（回款）',
        icon: 'receivables-line'
      }
    }, {
      ignore: true, // 路由添加时忽略
      path: 'subs/crm/invoice',
      permissions: ['crm', 'invoice'],
      meta: {
        title: '待我审批（发票）',
        icon: 'invoice-line'
      }
    }]
  },
  // 日志
  {
    ...layout({
      title: '日志',
      permissions: ['oa', 'log']
    }, '/oa/log'),
    children: [{
      hidden: true, // 不展示 仅用于路由注册
      path: 'subs/:type',
      component: () => import('@/views/oa/workLog/index'),
      meta: {
        redirect: 'subs/all' // 获取传参的重置链接
      }
    }, {
      ignore: true, // 路由添加时忽略
      path: 'subs/all',
      meta: {
        title: '全部',
        icon: 'icon-all-line'
      }
    }, {
      ignore: true, // 路由添加时忽略
      path: 'subs/send',
      meta: {
        title: '我发出的',
        icon: 'source-line'
      }
    }, {
      ignore: true, // 路由添加时忽略
      path: 'subs/received',
      meta: {
        title: '我收到的',
        icon: 'receive-line'
      }
    }, {
      permissionList: [['oa', 'log'], ['crm', 'followRecord', 'read']],
      path: 'subs/crm/follow',
      component: () => import('@/views/oa/workLog/FollowIndex'),
      meta: {
        title: '跟进记录',
        icon: 'icon-message-line'
      }
    }]
  },
  // 通讯录
  {
    ...layout({
      permissions: ['oa', 'book']
    }, '/oa/book'),
    children: [{
      path: 'index',
      component: () => import('@/views/oa/addressBook/index'),
      meta: {
        title: '通讯录'
      }
    }]
  },
  // 日历
  {
    ...layout({
      permissions: ['oa', 'calendar']
    }, '/oa/calendar'),
    children: [{
      path: 'index',
      component: () => import('@/views/oa/calendar/index'),
      meta: {
        redirect: 'index', // 获取传参的重置链接
        title: '日历',
        icon: 'board'
      }
    }]
  }

]
