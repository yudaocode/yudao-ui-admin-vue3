import request from '@/config/axios'

export const getWorkflowPage = async (params) => {
  return await request.get({ url: '/ai/workflow/page', params })
}

export const getWorkflow = async (id) => {
  return await request.get({ url: '/ai/workflow/get?id=' + id })
}

export const createWorkflow = async (data) => {
  return await request.post({ url: '/ai/workflow/create', data })
}

export const updateWorkflow = async (data) => {
  return await request.put({ url: '/ai/workflow/update', data })
}

export const deleteWorkflow = async (id) => {
  return await request.delete({ url: '/ai/workflow/delete?id=' + id })
}

export const testWorkflow = async (data) => {
  return await request.post({ url: '/ai/workflow/test', data })
}
