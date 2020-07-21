/* eslint-disable no-param-reassign */
/*
 * @Author: czy0729
 * @Date: 2020-07-20 16:30:49
 * @Last Modified by: czy0729
 * @Last Modified time: 2020-07-21 21:54:39
 */
import { computed } from 'mobx'
import { collectionStore, timelineStore } from '@stores'
import { date, getTimestamp, pad } from '@utils'
import store from '@utils/store'
import { MODEL_TIMELINE_SCOPE, MODEL_TIMELINE_TYPE } from '@constants/model'

const scope = MODEL_TIMELINE_SCOPE.getValue('自己')
const type = MODEL_TIMELINE_TYPE.getValue('收藏')

export default class ScreenUserTimeline extends store {
  init = () => {
    collectionStore.fetchMosaicTile()
    this.caculateCollectionTimeline()
  }

  // -------------------- get --------------------
  @computed get mosaicTile() {
    return collectionStore.mosaicTile
  }

  /**
   * 原始时间线数据
   */
  @computed get timeline() {
    const timeline = timelineStore.timeline(scope, type)
    return {
      ...timeline,
      list: timeline.list.map(item => {
        // 处理 今天 | 昨天
        let _date = item.date
        if (_date === '今天') {
          _date = date('Y-m-d', getTimestamp())
        } else if (_date === '昨天') {
          _date = date('Y-m-d', getTimestamp() - 24 * 60 * 60)
        } else {
          _date = String(_date)
            .split('-')
            .map(item => pad(item))
            .join('-')
        }

        return {
          id: item.id,
          date: _date,
          action: item.p2.text,
          subject: (item.p3.url || [])
            .filter(i => !!i)
            .map((i, idx) => ({
              id: parseInt(i.match(/\d+/)[0]),
              name: item.p3.text[idx] || '',
              cover: item.image[idx] || '',
              star: item.star,
              comment: item.comment || ''
            })),
          time: item.time
        }
      })
    }
  }

  /**
   * 分组汇总时间线数据
   *  - 年 -> 月 (汇总) -> 日 -> 条目
   */
  @computed get daysTimeline() {
    const sections = []
    const sectionsMap = {}
    const sectionKey = 'date'
    this.timeline.list.forEach(item => {
      const title = item[sectionKey]
      if (sectionsMap[title] === undefined) {
        sectionsMap[title] = sections.length
        sections.push({
          title,
          data: [item]
        })
      } else {
        sections[sectionsMap[title]].data.push(item)
      }
    })
    return sections
  }

  @computed get monthsTimeline() {
    const sections = []
    const sectionsMap = {}
    this.daysTimeline.forEach(item => {
      const month = item.title.slice(0, 7)
      if (sectionsMap[month] === undefined) {
        sectionsMap[month] = sections.length
        sections.push({
          title: month,
          data: [item],
          actions: {}
        })
      } else {
        sections[sectionsMap[month]].data.push(item)
      }
    })

    sections.forEach(item => {
      item.data.forEach(i => {
        i.data.forEach(ii => {
          let { action } = ii
          action = action.replace(/玩|听|读/g, '看').replace('了', '')
          if (item.actions[action]) {
            item.actions[action] += ii.subject.length
          } else {
            item.actions[action] = ii.subject.length
          }
        })
      })
    })
    return sections
  }

  @computed get yearsTimeline() {
    const sections = []
    const sectionsMap = {}
    this.monthsTimeline.forEach(item => {
      const year = item.title.slice(0, 4)
      if (sectionsMap[year] === undefined) {
        sectionsMap[year] = sections.length
        sections.push({
          title: year,
          data: [item]
        })
      } else {
        sections[sectionsMap[year]].data.push(item)
      }
    })
    return sections
  }

  // -------------------- fetch --------------------
  fetchTimeline = refresh =>
    timelineStore.fetchTimeline(
      {
        scope,
        type
      },
      refresh
    )

  // -------------------- page --------------------
  caculateCollectionTimeline = async () => {
    await this.fetchTimeline(true)
    this.fetchTimeline()
  }
}
