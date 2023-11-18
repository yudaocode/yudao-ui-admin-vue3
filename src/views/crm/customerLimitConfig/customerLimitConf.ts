// TODO 可以挪到它对应的 api.ts 文件里哈
/**
 * 客户限制配置类型
 */
export enum LimitConfType {
  /**
   * 拥有客户数限制
   */
  CUSTOMER_QUANTITY_LIMIT = 1,
  /**
   * 锁定客户数限制
   */
  CUSTOMER_LOCK_LIMIT = 2
}
