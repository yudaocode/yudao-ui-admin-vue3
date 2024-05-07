// 获取条件节点默认的名称
export const getDefaultConditionNodeName = (index:number, defaultFlow: boolean) : string => {
  if ( defaultFlow ){
    return "其它情况"
  }
  return '条件' + (index+1)
}
