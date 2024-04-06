/**
 * todo
 */
export const arrToStr = (arr?: [{ name: string }]) => {
  if (arr) {
    return arr
      .map((item) => {
        return item.name
      })
      .toString()
  }
}

export const setApproverStr = (nodeConfig: any) => {
  if (nodeConfig.settype == 1) {
    if (nodeConfig.nodeUserList.length == 1) {
      return nodeConfig.nodeUserList[0].name
    } else if (nodeConfig.nodeUserList.length > 1) {
      if (nodeConfig.examineMode == 1) {
        return arrToStr(nodeConfig.nodeUserList)
      } else if (nodeConfig.examineMode == 2) {
        return nodeConfig.nodeUserList.length + '人会签'
      }
    }
  } else if (nodeConfig.settype == 2) {
    const level =
      nodeConfig.directorLevel == 1 ? '直接主管' : '第' + nodeConfig.directorLevel + '级主管'
    if (nodeConfig.examineMode == 1) {
      return level
    } else if (nodeConfig.examineMode == 2) {
      return level + '会签'
    }
  } else if (nodeConfig.settype == 4) {
    if (nodeConfig.selectRange == 1) {
      return '发起人自选'
    } else {
      if (nodeConfig.nodeUserList.length > 0) {
        if (nodeConfig.selectRange == 2) {
          return '发起人自选'
        } else {
          return '发起人从' + nodeConfig.nodeUserList[0].name + '中自选'
        }
      } else {
        return ''
      }
    }
  } else if (nodeConfig.settype == 5) {
    return '发起人自己'
  } else if (nodeConfig.settype == 7) {
    return '从直接主管到通讯录中级别最高的第' + nodeConfig.examineEndDirectorLevel + '个层级主管'
  }
}

export const copyerStr = (nodeConfig: any) => {
  if (nodeConfig.nodeUserList.length != 0) {
    return arrToStr(nodeConfig.nodeUserList)
  } else {
    if (nodeConfig.ccSelfSelectFlag == 1) {
      return '发起人自选'
    }
  }
}
export const conditionStr = (nodeConfig, index) => {
  const { conditionList, nodeUserList } = nodeConfig.conditionNodes[index]
  if (conditionList.length == 0) {
    return index == nodeConfig.conditionNodes.length - 1 &&
      nodeConfig.conditionNodes[0].conditionList.length != 0
      ? '其他条件进入此流程'
      : '请设置条件'
  } else {
    let str = ''
    for (let i = 0; i < conditionList.length; i++) {
      const {
        columnId,
        columnType,
        showType,
        showName,
        optType,
        zdy1,
        opt1,
        zdy2,
        opt2,
        fixedDownBoxValue
      } = conditionList[i]
      if (columnId == 0) {
        if (nodeUserList.length != 0) {
          str += '发起人属于：'
          str +=
            nodeUserList
              .map((item) => {
                return item.name
              })
              .join('或') + ' 并且 '
        }
      }
      if (columnType == 'String' && showType == '3') {
        if (zdy1) {
          str += showName + '属于：' + dealStr(zdy1, JSON.parse(fixedDownBoxValue)) + ' 并且 '
        }
      }
      if (columnType == 'Double') {
        if (optType != 6 && zdy1) {
          const optTypeStr = ['', '<', '>', '≤', '=', '≥'][optType]
          str += `${showName} ${optTypeStr} ${zdy1} 并且 `
        } else if (optType == 6 && zdy1 && zdy2) {
          str += `${zdy1} ${opt1} ${showName} ${opt2} ${zdy2} 并且 `
        }
      }
    }
    return str ? str.substring(0, str.length - 4) : '请设置条件'
  }
}

export const dealStr = (str: string, obj) => {
  const arr = []
  const list = str.split(',')
  for (const elem in obj) {
    list.map((item) => {
      if (item == elem) {
        arr.push(obj[elem].value)
      }
    })
  }
  return arr.join('或')
}

export const removeEle = (arr, elem, key = 'id') => {
  let includesIndex
  arr.map((item, index) => {
    if (item[key] == elem[key]) {
      includesIndex = index
    }
  })
  arr.splice(includesIndex, 1)
}

export const bgColors = ['87, 106, 149', '255, 148, 62', '50, 150, 250']
export const placeholderList = ['发起人', '审核人', '抄送人']
export const setTypes = [
  { value: 1, label: '指定成员' },
  { value: 2, label: '主管' },
  { value: 4, label: '发起人自选' },
  { value: 5, label: '发起人自己' },
  { value: 7, label: '连续多级主管' }
]

export const selectModes = [
  { value: 1, label: '选一个人' },
  { value: 2, label: '选多个人' }
]

export const selectRanges = [
  { value: 1, label: '全公司' },
  { value: 2, label: '指定成员' },
  { value: 3, label: '指定角色' }
]

export const optTypes = [
  { value: '1', label: '小于' },
  { value: '2', label: '大于' },
  { value: '3', label: '小于等于' },
  { value: '4', label: '等于' },
  { value: '5', label: '大于等于' },
  { value: '6', label: '介于两个数之间' }
]
