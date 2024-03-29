import request from '@/config/axios'


export const saveBpmSimpleModel = async (data) => {
  return await request.post({
    url: '/bpm/simple/save',
    data: data
  })
}

export const getBpmSimpleModel = async (modelId) => {
  return await request.get({
    url: '/bpm/simple/get?modelId=' + modelId
  })
}