import request from '@/config/axios'

// 删除自提门店
export const deleteDeliveryPickUpStoreStaff = async (userId: number,storeId: number) => {
  return await request.delete({ url: '/trade/delivery/pick-up-store-staff/delete?userId=' + userId +'&storeId=' + storeId})
}
