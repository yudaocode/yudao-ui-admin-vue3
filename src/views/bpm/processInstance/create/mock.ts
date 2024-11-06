import {  ProcessInstanceVO, User, ApprovalTaskInfo, ApprovalNodeInfo } from '@/api/bpm/processInstance';
import { NodeType } from '@/components/SimpleProcessDesignerV2/src/consts'

const users: User[] = [
  { id: 1, nickname: 'Alice', avatar: 'https://picsum.photos/200?r=1' },
  { id: 2, nickname: 'Bob', avatar: 'https://picsum.photos/200?r=2' },
  { id: 3, nickname: 'Charlie', avatar: 'https://picsum.photos/200?r=3' },
  { id: 4, nickname: 'David', avatar: 'https://picsum.photos/200?r=4' }
];

const approvalTask1: ApprovalTaskInfo = {
  id: 1,
  ownerUser: users[0], // Alice is the owner (initiator)
  assigneeUser: users[1], // Bob is the assignee
  status: 1, // In Progress
  reason: 'Please review and approve the request.'
};

const approvalTask2: ApprovalTaskInfo = {
  id: 2,
  ownerUser: users[1], // Bob is the owner (approver)
  assigneeUser: users[2], // Charlie is the assignee
  status: 0, // Pending approval
  reason: 'Awaiting Bob’s decision.'
};

const approvalTask3: ApprovalTaskInfo = {
  id: 3,
  ownerUser: users[2], // Charlie is the owner (approver)
  assigneeUser: users[3], // David is the assignee
  status: 0, // Pending approval
  reason: 'Awaiting Charlie’s decision.'
};

const approvalNode1: ApprovalNodeInfo = {
  id: 101,
  name: 'Start Review',
  nodeType: NodeType.START_USER_NODE,
  status: 1, // In Progress
  startTime: new Date('2024-11-01T10:00:00Z'),
  tasks: [approvalTask1]
};

const approvalNode2: ApprovalNodeInfo = {
  id: 102,
  name: 'First Review',
  nodeType: NodeType.USER_TASK_NODE,
  status: 0, // Pending approval
  startTime: new Date('2024-11-01T11:00:00Z'),
  tasks: [approvalTask2],
  candidateUsers: [users[2], users[3]] // Candidate users: Charlie and David
};

const approvalNode3: ApprovalNodeInfo = {
  id: 103,
  name: 'Second Review',
  nodeType: NodeType.USER_TASK_NODE,
  status: 0, // Pending approval
  startTime: new Date('2024-11-01T12:00:00Z'),
  tasks: [approvalTask3],
  candidateUsers: [users[1], users[3]] // Candidate users: Bob and David
};

const processInstance: ProcessInstanceVO = {
  id: 1001,
  name: 'Request Approval Process',
  processDefinitionId: 'proc-2024-001',
  category: 'Approval Process',
  result: 0, // Ongoing
  tasks: [{ id: '1', name: 'Start Review' }, { id: '2', name: 'First Review' }, { id: '3', name: 'Second Review' }],
  fields: ['field1', 'field2'],
  status: 1, // In Progress
  remark: 'This is a sample approval process.',
  businessKey: 'BUS-12345',
  createTime: '2024-11-01T09:00:00Z',
  endTime: '',
  processDefinition: undefined // Not populated in this example
};

// 模拟的 activityNodes 数据，传递给 ProcessInstanceTimeline 组件
const activityNodes: ApprovalNodeInfo[] = [approvalNode1, approvalNode2, approvalNode3];

export { processInstance, activityNodes, users };


export const startUserSelectTasks = users.map(user => ({id: user.id,name:user.nickname}))
