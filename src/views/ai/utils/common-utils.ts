/**
 * Created by 芋道源码
 *
 * AI 枚举类
 *
 * 问题：为什么不放在 src/utils/common-utils.ts 呢？
 * 回答：主要 AI 是可选模块，考虑到独立、解耦，所以放在了 /views/ai/utils/common-utils.ts
 */

/**  判断字符串是否包含中文  */
export const hasChinese = async (str) => {
  return /[\u4E00-\u9FA5]+/g.test(str)
}
