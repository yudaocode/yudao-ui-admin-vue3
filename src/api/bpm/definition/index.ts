import request from '@/config/axios'

export const getProcessDefinition = async (id?: string, key?: string) => {
  return await request.get({
    url: '/bpm/process-definition/get',
    params: { id, key }
  })
}

export const getProcessDefinitionPage = async (params) => {
  return await request.get({
    url: '/bpm/process-definition/page',
    params
  })
}

export const getProcessDefinitionList = async (params) => {
  return await request.get({
    url: '/bpm/process-definition/list',
    params
  })
}
