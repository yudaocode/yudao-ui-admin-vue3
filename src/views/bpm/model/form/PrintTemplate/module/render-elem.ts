import { h, VNode } from 'snabbdom'
import { DomEditor, IDomEditor, SlateElement } from '@wangeditor-next/editor'

function renderProcessRecord(
  elem: SlateElement,
  _children: VNode[] | null,
  editor: IDomEditor
): VNode {
  const selected = DomEditor.isNodeSelected(editor, elem)

  return h(
    'table',
    {
      props: {
        contentEditable: false
      },
      style: {
        width: '100%',
        border: selected ? '2px solid var(--w-e-textarea-selected-border-color)' : ''
      }
    },
    [
      h('thead', [h('tr', [h('th', { attrs: { colSpan: 3 } }, '流程记录')])]),
      h('tbody', [
        h('tr', [
          h('td', [
            h(
              'span',
              {
                props: {
                  contentEditable: false
                },
                style: {
                  marginLeft: '3px',
                  marginRight: '3px',
                  backgroundColor: 'var(--w-e-textarea-slight-bg-color)',
                  borderRadius: '3px',
                  padding: '0 3px'
                }
              },
              `节点`
            )
          ]),
          h('td', [
            h(
              'span',
              {
                props: {
                  contentEditable: false
                },
                style: {
                  marginLeft: '3px',
                  marginRight: '3px',
                  backgroundColor: 'var(--w-e-textarea-slight-bg-color)',
                  borderRadius: '3px',
                  padding: '0 3px'
                }
              },
              `操作`
            )
          ])
        ])
      ])
    ]
  )
}

const conf = {
  type: 'process-record',
  renderElem: renderProcessRecord
}

export default conf
