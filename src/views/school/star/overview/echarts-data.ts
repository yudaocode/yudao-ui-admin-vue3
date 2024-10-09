import { EChartsOption } from 'echarts'

const { t } = useI18n()

// There should not be negative values in rawData
export const allTypeGotOption: EChartsOption = {
  title: {
    text: t('analysis.allTypeStudent'),
    left: 'top'
  },
  tooltip: {
    trigger: 'item',
    triggerOn: 'mousemove'
  },
  series: {}
};

export const maxStarStudentOption: EChartsOption = {
  title: {
    text: t('analysis.maxStarStudent'),
    left: 'top'
  },
  tooltip: {
    trigger: 'item',
    triggerOn: 'mousemove'
  },
  series: {}
};

export const splitTypeStudentOption: EChartsOption = {
  title: {
    text: t('analysis.splitTypeStudent'),
    left: 'top'
  },
  tooltip: {
    trigger: 'item',
    triggerOn: 'mousemove'
  },
  series: {}
};