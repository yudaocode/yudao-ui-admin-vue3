import request from '@/config/axios'

export interface WalletTransactionVO {
  id: number
  walletId: number
  title: string
  price: number
  balance: number
}

// 查询会员钱包流水列表
export const getWalletTransactionPage = async (params) => {
  return await request.get({ url: `/pay/wallet-transaction/page`, params })
}
