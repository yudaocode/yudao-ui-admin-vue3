// 模拟流程分类数据
export const categoryList = [
  { name: '审批流程', code: 'approval' },
  { name: '管理流程', code: 'management' }
]

// 模拟流程定义数据
export const processDefinitionList = [
  {
    id: '1',
    key: 'process_1',
    name: '请假申请',
    category: 'approval',
    icon: 'https://picsum.photos/200?r=1',
    formType: 10,
    formConf: {}, // 根据需要定义表单配置
    formFields: [], // 根据需要定义表单字段
    startUserSelectTasks: [
      { id: 'task1', name: '部门经理' },
      { id: 'task2', name: '人力资源' }
    ]
  },
  {
    id: '2',
    key: 'process_2',
    name: '报销申请',
    category: 'approval',
    icon: 'https://picsum.photos/200?r=2',
    formType: 10,
    formConf: {},
    formFields: [],
    startUserSelectTasks: [{ id: 'task3', name: '财务' }]
  },
  {
    id: '3',
    key: 'process_1',
    name: '请假申请',
    category: 'approval',
    icon: 'https://picsum.photos/200?r=1',
    formType: 10,
    formConf: {}, // 根据需要定义表单配置
    formFields: [], // 根据需要定义表单字段
    startUserSelectTasks: [
      { id: 'task1', name: '部门经理' },
      { id: 'task2', name: '人力资源' }
    ]
  },
  {
    id: '4',
    key: 'process_2',
    name: '报销申请',
    category: 'approval',
    icon: 'https://picsum.photos/200?r=2',
    formType: 10,
    formConf: {},
    formFields: [],
    startUserSelectTasks: [{ id: 'task3', name: '财务' }]
  },{
    id: '5',
    key: 'process_1',
    name: '请假申请',
    category: 'approval',
    icon: 'https://picsum.photos/200?r=1',
    formType: 10,
    formConf: {}, // 根据需要定义表单配置
    formFields: [], // 根据需要定义表单字段
    startUserSelectTasks: [
      { id: 'task1', name: '部门经理' },
      { id: 'task2', name: '人力资源' }
    ]
  },
  {
    id: '6',
    key: 'process_2',
    name: '报销申请',
    category: 'approval',
    icon: 'https://picsum.photos/200?r=2',
    formType: 10,
    formConf: {},
    formFields: [],
    startUserSelectTasks: [{ id: 'task3', name: '财务' }]
  },
  {
    id: '7',
    key: 'process_1',
    name: '请假申请',
    category: 'approval',
    icon: 'https://picsum.photos/200?r=1',
    formType: 10,
    formConf: {}, // 根据需要定义表单配置
    formFields: [], // 根据需要定义表单字段
    startUserSelectTasks: [
      { id: 'task1', name: '部门经理' },
      { id: 'task2', name: '人力资源' }
    ]
  },
  {
    id: '8',
    key: 'process_2',
    name: '报销申请',
    category: 'approval',
    icon: 'https://picsum.photos/200?r=2',
    formType: 10,
    formConf: {},
    formFields: [],
    startUserSelectTasks: [{ id: 'task3', name: '财务' }]
  }
]
