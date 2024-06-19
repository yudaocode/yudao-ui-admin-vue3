// 获取条件节点默认的名称
export const getDefaultConditionNodeName = (index: number, defaultFlow: boolean): string => {
  if (defaultFlow) {
    return '其它情况'
  }
  return '条件' + (index + 1)
}

// 获得默认的表单字段权限.
export const getDefaultFieldsPermission = (formFields: string[] | undefined) => {
  const defaultFieldsPermission: any[] = []
  if (formFields) {
    formFields.forEach((fieldStr: string) => {
      const { field, title } = JSON.parse(fieldStr)
      defaultFieldsPermission.push({
        field,
        title,
        permission: '1' // 只读
      })
    })
  }
  return defaultFieldsPermission
}
