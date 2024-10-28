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
    formConf:
      '{"form":{"inline":false,"hideRequiredAsterisk":false,"labelPosition":"right","size":"default","labelWidth":"100px"},"resetBtn":{"show":false,"innerText":"重置"},"submitBtn":{"show":true,"innerText":"提交"}}',
    formFields: [
      '{"type":"input","field":"F1yrm2sosxgeabc","title":"请假原因","info":"","$required":false,"props":{"type":"text","placeholder":"请输入123"},"_fc_id":"id_Fhrbm2sosxgeacc","name":"ref_Festm2sosxgeadc","display":true,"hidden":false,"_fc_drag_tag":"input"}',
      '{"type":"radio","field":"F9r3m2sp1b34aec","title":"请假类型","info":"","$required":false,"props":{"_optionType":2},"_fc_id":"id_F4nwm2sp1b34afc","name":"ref_Fkodm2sp1b34agc","display":true,"hidden":false,"_fc_drag_tag":"radio","options":[{"label":"事假","value":"1"},{"label":"婚假","value":"2"},{"label":"丧假","value":"3"}]}'
    ],
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
    formConf:
      '{"form":{"inline":false,"hideRequiredAsterisk":false,"labelPosition":"right","size":"default","labelWidth":"100px"},"resetBtn":{"show":false,"innerText":"重置"},"submitBtn":{"show":true,"innerText":"提交"}}',
    formFields: [
      '{"type":"input","field":"F1yrm2sosxgeabc","title":"请假原因","info":"","$required":false,"props":{"type":"text","placeholder":"请输入123"},"_fc_id":"id_Fhrbm2sosxgeacc","name":"ref_Festm2sosxgeadc","display":true,"hidden":false,"_fc_drag_tag":"input"}',
      '{"type":"radio","field":"F9r3m2sp1b34aec","title":"请假类型","info":"","$required":false,"props":{"_optionType":2},"_fc_id":"id_F4nwm2sp1b34afc","name":"ref_Fkodm2sp1b34agc","display":true,"hidden":false,"_fc_drag_tag":"radio","options":[{"label":"事假","value":"1"},{"label":"婚假","value":"2"},{"label":"丧假","value":"3"}]}'
    ],
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
  },
  {
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
