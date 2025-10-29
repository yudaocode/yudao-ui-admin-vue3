import { localeProps } from '@/components/FormCreate/src/utils'
import { generateUUID } from '@/utils'

export const useDownloadRule = () => {
  const label = '文件下载'
  const name = 'FcDownload'
  return {
    icon: '', // 暂时不显示图标，只显示文字
    label,
    name,
    input: false, // 标记为非表单输入组件
    rule() {
      return {
        type: name,
        field: generateUUID(), // 需要 field 来避免 FormCreate 绑定错误
        props: {
          fileUrl: '',
          buttonText: '下载文件'
        }
      }
    },
    props(_, { t }) {
      return localeProps(t, name + '.props', [
        {
          type: 'input',
          field: 'fileUrl',
          title: '文件地址',
          value: '',
          props: {
            placeholder: '请输入文件下载地址'
          }
        },
        {
          type: 'input',
          field: 'fileName',
          title: '文件名称',
          value: '',
          props: {
            placeholder: '可选，不填则从URL中提取'
          }
        },
        {
          type: 'input',
          field: 'buttonText',
          title: '按钮文本',
          value: '下载文件'
        },
        {
          type: 'select',
          field: 'buttonType',
          title: '按钮类型',
          value: 'primary',
          options: [
            { label: '主要按钮', value: 'primary' },
            { label: '成功按钮', value: 'success' },
            { label: '警告按钮', value: 'warning' },
            { label: '危险按钮', value: 'danger' },
            { label: '信息按钮', value: 'info' },
            { label: '默认按钮', value: 'default' },
            { label: '文字按钮', value: 'text' }
          ]
        },
        {
          type: 'switch',
          field: 'showIcon',
          title: '显示图标',
          value: true
        },
        {
          type: 'select',
          field: 'downloadMethod',
          title: '下载方式',
          value: 'link',
          options: [
            { label: '直接下载', value: 'link' },
            { label: '接口下载', value: 'fetch' }
          ]
        },
        {
          type: 'switch',
          field: 'disabled',
          title: '是否禁用',
          value: false
        }
      ])
    }
  }
}

