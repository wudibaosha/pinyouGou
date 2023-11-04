/** 客户管理路由 */
import Layout from '@/views/layout/CrmLayout'

const layout = function(meta = {}) {
  return {
    path: '/crm',
    component: Layout,
    meta: {
      requiresAuth: true,
      ...meta
    }
  }
}

export default [
  {
    ...layout({
      permissions: ['crm']
    }),
    children: [{
      name: 'CRMWorkbench',
      path: 'workbench', // 仪表盘
      component: () => import('@/views/crm/workbench'),
      meta: {
        title: '仪表盘',
        icon: 'board'
      }
    }]
  },
  {
    ...layout({
      permissions: ['crm', 'leads']
      // permissionList: [['crm', 'leads'], ['crm', 'applet']]
    }),
    children: [{
      path: 'leads', // 线索列表
      component: () => import('@/views/crm/leads/AllIndex'),
      meta: {
        title: '线索',
        icon: 'leads'
      }
    }]
  },
  // {
  //   ...layout({
  //     permissions: ['crm', 'applet']
  //   }),
  //   children: [{
  //     path: 'applet', // 名片列表
  //     component: () => import('@/views/crm/applet'),
  //     meta: {
  //       title: '名片线索',
  //       icon: 'mp'
  //     }
  //   }]
  // },
  {
    ...layout({
      // permissions: ['crm', 'customer']
      permissionList: [
        ['crm', 'customer'],
        ['crm', 'pool'],
        ['crm', 'customer', 'nearbyCustomer']
      ],
      title: '客户',
      icon: 'customer-line'
    }),
    children: [{
      path: 'customer/subs/customer', // 客户列表  subs  是子菜单
      component: () => import('@/views/crm/customer'),
      permissions: ['crm', 'customer'],
      meta: {
        title: '客户',
        icon: 'customer-line'
      }
    }, {
      path: 'customer/subs/seas', // 公海
      component: () => import('@/views/crm/seas'),
      permissions: ['crm', 'pool'],
      meta: {
        title: '公海',
        icon: 'seas'
      }
    }, {
      path: 'customer/subs/nearby', // 附近客户
      component: () => import('@/views/crm/nearby'),
      permissions: ['crm', 'customer', 'nearbyCustomer'],
      meta: {
        title: '附近客户',
        icon: 'nearby'
      }
    }]
  },
  {
    ...layout({
      permissions: ['crm', 'contacts']
    }),
    children: [{
      path: 'contacts', // 联系人
      component: () => import('@/views/crm/contacts/index'),
      meta: {
        title: '联系人',
        icon: 'contacts-line'
      }
    }]
  },
  {
    ...layout({
      permissions: ['crm', 'business']
    }),
    children: [{
      path: 'business', // 商机列表
      component: () => import('@/views/crm/business'),
      meta: {
        title: '商机',
        icon: 'business-line'
      }
    }]
  },
  {
    ...layout({
      permissions: ['crm', 'contract']
    }),
    children: [{
      path: 'contract', // 合同列表
      component: () => import('@/views/crm/contract'),
      meta: {
        title: '合同',
        icon: 'contract-line'
      }
    }]
  },
  {
    ...layout({
      permissions: ['crm', 'settlement']
    }),
    children: [{
      path: 'settlement', // 确认结算金额
      component: () => import('@/views/crm/settlement/index'),
      meta: {
        title: '确认结算金额',
        icon: 'contacts-line'
      }
    }]
  },
  {
    ...layout({
      permissionList: [
        ['crm', 'receivables'],
        ['crm', 'receivablesPlan']
      ],
      title: '回款',
      icon: 'receivables-line'
    }),
    children: [{
      path: 'receivables/subs/receivables', // 回款
      component: () => import('@/views/crm/receivables'),
      permissions: ['crm', 'receivables'],
      meta: {
        title: '回款',
        icon: 'receivables-line'
      }
    }, {
      path: 'receivables/subs/plan', // 回款计划
      component: () => import('@/views/crm/receivablesPlan'),
      permissions: ['crm', 'receivablesPlan'],
      meta: {
        title: '回款计划',
        icon: 'plan'
      }
    }]
  },
  {
    name: 'print',
    path: '/print', // 打印
    hidden: true,
    component: () => import('@/views/crm/components/Print'),
    meta: {
      requiresAuth: true,
      permissionList: [
        ['crm', 'receivables', 'print'],
        ['crm', 'contract', 'print'],
        ['crm', 'business', 'print']
      ],
      title: '打印',
      icon: 'print'
    }
  },
  {
    ...layout({
      permissions: ['crm', 'invoice']
    }),
    children: [{
      path: 'invoice', // 发票列表
      component: () => import('@/views/crm/invoice'),
      meta: {
        title: '发票',
        icon: 'invoice-line'
      }
    }]
  },
  {
    ...layout({
      permissions: ['crm', 'project'],
    }),
    children: [{
      path: 'project', // 回访列表
      component: () => import('@/views/crm/project'),
      meta: {

        title: '项目申请',

        icon: 'visit-line'
      }
    }]
  },
  {
    ...layout({
      permissions: ['crm', 'product']
    }),
    children: [{
      path: 'product', // 产品列表
      component: () => import('@/views/crm/product'),
      meta: {
        title: '产品',
        icon: 'product-line'
      }
    }]
  },
  {
    ...layout({
      permissions: ['crm', 'marketing']
    }),
    children: [{
      path: 'marketing', // 活动列表
      component: () => import('@/views/crm/marketing/index'),
      meta: {
        title: '市场活动',
        icon: 'activity-line'
      }
    }]
  }, 
  {
    ...layout({
      permissions: ['crm', 'unit']
    }),
    children: [{
      path: 'unit', // 活动列表
     component: () => import('@/views/crm/unit/index'),
      meta: {
        title: '发票抬头',
        icon: 'activity-line'
      }
    }]
  }, 
]
