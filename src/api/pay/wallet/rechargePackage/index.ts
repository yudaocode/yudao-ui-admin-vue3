import request from '@/config/axios'

export interface WalletRechargePackageVO {
  id: number
  name: string
  payPrice: number
  bonusPrice: number
  status: number
}

// 查询套餐充值列表
export const getWalletRechargePackagePage = async (params) => {
  return await request.get({ url: '/pay/wallet-recharge-package/page', params })
}

// 查询套餐充值详情
export const getWalletRechargePackage = async (id: number) => {
  return await request.get({ url: '/pay/wallet-recharge-package/get?id=' + id })
}

// 新增套餐充值
export const createWalletRechargePackage = async (data: WalletRechargePackageVO) => {
  return await request.post({ url: '/pay/wallet-recharge-package/create', data })
}

// 修改套餐充值
export const updateWalletRechargePackage = async (data: WalletRechargePackageVO) => {
  return await request.put({ url: '/pay/wallet-recharge-package/update', data })
}

// 删除套餐充值
export const deleteWalletRechargePackage = async (id: number) => {
  return await request.delete({ url: '/pay/wallet-recharge-package/delete?id=' + id })
}
