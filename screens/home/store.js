/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/*
 * @Author: czy0729
 * @Date: 2019-03-21 16:49:03
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-04-22 19:06:55
 */
import { observable, computed } from 'mobx'
import { WebBrowser } from 'expo'
import { userStore, subjectStore, collectionStore } from '@stores'
import { MODEL_EP_STATUS } from '@constants/model'
import { sleep } from '@utils'
import store from '@utils/store'

const initItem = {
  expand: false,
  doing: false
}
export const tabs = [
  {
    title: '全部'
  },
  {
    title: '动画'
  },
  {
    title: '书籍'
  },
  {
    title: '三次元'
  }
]

export default class ScreenHome extends store {
  state = observable({
    visible: false, // <Modal>可见性
    subjectId: 0, // <Modal>当前条目Id
    page: 0, // <Tabs>缓存当前页数,
    top: [], // <Item>置顶记录
    item: {
      // [subjectId]: initItem // 每个<Item>的状态
    }
  })

  init = async () => {
    if (this.isLogin) {
      const state = await this.getStorage()
      if (state) {
        this.setState({
          page: state.page || 0,
          top: state.top || [],
          item: state.item || {}
        })
      }

      const data = await Promise.all([
        userStore.fetchUserCollection(),
        userStore.fetchUserProgress()
      ])
      if (data[0]) {
        // @issue 由于Bangumi没提供一次性查询多个章节信息的Api
        // 暂时只能每一项都发一次请求
        for (const item of data[0]) {
          await subjectStore.fetchSubjectEp(item.subject_id)
          await sleep()
        }
      }
    }
  }

  // -------------------- get --------------------
  /**
   * <Item />
   */
  $Item(subjectId) {
    return computed(() => this.state.item[subjectId] || initItem).get()
  }

  // 用户 -> 收藏 -> 条目 -> 章节
  /**
   * 用户是否登录
   */
  @computed get isLogin() {
    return userStore.isLogin
  }

  /**
   * 用户收藏
   */
  @computed get userCollection() {
    return userStore.userCollection
  }

  /**
   * 用户条目收视进度
   */
  userProgress(subjectId) {
    return computed(() => userStore.userProgress(subjectId)).get()
  }

  /**
   * 条目信息
   */
  subject(subjectId) {
    return computed(() => {
      const { subject } =
        this.userCollection.list.find(item => item.subject_id === subjectId) ||
        {}
      return subject || {}
    }).get()
  }

  /**
   * 条目章节数据
   */
  eps(subjectId) {
    return computed(() => subjectStore.subjectEp(subjectId).eps || []).get()
  }

  /**
   * 条目下一个未看章节
   */
  nextWatchEp(subjectId) {
    return computed(() => {
      const eps = this.eps(subjectId)
      const userProgress = this.userProgress(subjectId)
      const index = eps.findIndex(
        item => item.type === 0 && userProgress[item.id] !== '看过'
      )
      if (index === -1) {
        return {}
      }
      return eps[index]
    }).get()
  }

  /**
   * 章节是否放送中
   */
  isToday(subjectId) {
    return computed(() => {
      const eps = this.eps(subjectId)
      return eps.findIndex(item => item.status === 'Today') !== -1
    }).get()
  }

  /**
   * 条目观看进度百分比
   */
  percent(subjectId, subject = {}) {
    return computed(() => {
      const eps = this.eps(subjectId)
      if (!subject.eps_count || !eps.length) {
        return 0
      }

      // 排除SP章节
      let watchedCount = 0
      const userProgress = this.userProgress(subjectId)
      eps
        .filter(item => item.type === 0)
        .forEach(item => {
          if (userProgress[item.id] === '看过') {
            watchedCount += 1
          }
        })
      return (watchedCount / subject.eps_count) * 100
    }).get()
  }

  // -------------------- page --------------------
  /**
   * <Tabs>换页
   */
  tabsChange = (item, page) => {
    this.setState({
      page
    })
    this.setStorage()
  }

  /**
   * 显示收藏管理<Modal>
   */
  showManageModal = subjectId => {
    this.setState({
      visible: true,
      subjectId
    })
  }

  /**
   * 隐藏收藏管理<Modal>
   */
  closeManageModal = () => {
    this.setState({
      visible: false
    })
  }

  /**
   * <Item>展开和收起
   */
  itemToggleExpand = subjectId => {
    const state = this.$Item(subjectId)
    this.setState({
      item: {
        [subjectId]: {
          ...state,
          expand: !state.expand
        }
      }
    })
    this.setStorage()
  }

  /**
   * <Item>置顶和取消置顶
   */
  itemToggleTop = (subjectId, isTop) => {
    const { top } = this.state
    const _top = [...top]
    const index = _top.indexOf(subjectId)
    if (index === -1) {
      _top.push(subjectId)
    } else {
      _top.splice(index, 1)

      // 再置顶
      if (isTop) {
        _top.push(subjectId)
      }
    }
    this.setState({
      top: _top
    })
    this.setStorage()
  }

  // -------------------- action --------------------
  /**
   * 观看下一集
   */
  doWatchedNextEp = async subjectId => {
    const state = this.$Item(subjectId)
    if (state.doing) {
      return
    }
    this.setState({
      item: {
        [subjectId]: {
          ...state,
          doing: true
        }
      }
    })

    const { id } = this.nextWatchEp(subjectId)
    await userStore.doUpdateEpStatus({
      id,
      status: MODEL_EP_STATUS.getValue('看过')
    })
    userStore.fetchUserProgress(subjectId)

    this.setState({
      item: {
        [subjectId]: {
          ...state,
          doing: false
        }
      }
    })
  }

  /**
   * 管理收藏
   */
  doUpdateCollection = async values => {
    await collectionStore.doUpdateCollection(values)
    this.closeManageModal()
  }

  /**
   * 章节菜单操作
   */
  doEpsSelect = async (value, item, subjectId) => {
    const status = MODEL_EP_STATUS.getValue(value)
    if (status) {
      // 更新收视进度
      await userStore.doUpdateEpStatus({
        id: item.id,
        status
      })
      userStore.fetchUserCollection()
      userStore.fetchUserProgress()
    }

    if (value === '看到') {
      // 批量更新收视进度
      await userStore.doUpdateSubjectWatched({
        subjectId,
        sort: item.sort
      })
      userStore.fetchUserCollection()
      userStore.fetchUserProgress()
    }

    if (value === '本集讨论') {
      WebBrowser.openBrowserAsync(item.url)
    }
  }
}
