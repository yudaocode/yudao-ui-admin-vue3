import request from '@/config/axios'


export const saveBpmSimpleModel = async (data) => {
  return await request.post({
    url: '/bpm/simple/save',
    data: data
  })
}