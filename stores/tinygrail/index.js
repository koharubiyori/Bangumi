/*
 * 小圣杯
 * @Author: czy0729
 * @Date: 2019-08-24 23:18:17
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-09-18 00:16:11
 */
import { observable, computed } from 'mobx'
import axios from 'axios'
import { getTimestamp } from '@utils'
import store from '@utils/store'
import { LIST_EMPTY } from '@constants'
import {
  API_TINYGRAIL_CHARAS,
  API_TINYGRAIL_LIST,
  API_TINYGRAIL_RICH,
  API_TINYGRAIL_CHARTS,
  API_TINYGRAIL_DEPTH,
  API_TINYGRAIL_HASH,
  API_TINYGRAIL_ASSETS,
  API_TINYGRAIL_CHARA_ASSETS,
  API_TINYGRAIL_USER_CHARA,
  API_TINYGRAIL_BID,
  API_TINYGRAIL_ASK,
  API_TINYGRAIL_CANCEL_BID,
  API_TINYGRAIL_CANCEL_ASK,
  API_TINYGRAIL_CHARA_BID,
  API_TINYGRAIL_CHARA_ASKS
} from '@constants/api'
import {
  NAMESPACE,
  INIT_CHARACTERS_ITEM,
  INIT_RICH,
  INIT_KLINE_ITEM,
  INIT_DEPTH_ITEM,
  INIT_ASSETS,
  INIT_CHARA_ASSETS,
  INIT_USER_LOGS
} from './init'

const defaultKey = 'recent'
const defaultSort = '1/50'

class Tinygrail extends store {
  state = observable({
    // 人物数据
    characters: {
      // [monoId]: INIT_CHARACTERS_ITEM
    },

    // 总览列表
    mvc: LIST_EMPTY,
    mrc: LIST_EMPTY,
    mfc: LIST_EMPTY,
    mvi: LIST_EMPTY,
    mpi: LIST_EMPTY,
    rai: LIST_EMPTY,
    recent: LIST_EMPTY,
    tnbc: LIST_EMPTY,
    nbc: LIST_EMPTY,

    // 番市首富
    rich: INIT_RICH,

    // K线
    kline: {
      // [monoId]: INIT_KLINE_ITEM
    },

    // 深度图
    depth: {
      // [monoId]: INIT_DEPTH_ITEM
    },

    // 用户唯一标识
    hash: '',

    // 用户资产
    assets: INIT_ASSETS,

    // 用户资产概览信息
    charaAssets: {
      // [hash]: INIT_CHARA_ASSETS
    },

    // 用户挂单和交易记录
    userLogs: {
      // [monoId]: INIT_USER_LOGS
    },

    // 用户买单
    bid: LIST_EMPTY,

    // 用户卖单
    asks: LIST_EMPTY
  })

  async init() {
    const res = Promise.all([
      this.getStorage('characters', NAMESPACE), // 0
      this.getStorage('mvc', NAMESPACE), // 1
      this.getStorage('mrc', NAMESPACE), // 2
      this.getStorage('mfc', NAMESPACE), // 3
      this.getStorage('mvi', NAMESPACE), // 4
      this.getStorage('mpi', NAMESPACE), // 5
      this.getStorage('rai', NAMESPACE), // 6
      this.getStorage('recent', NAMESPACE), // 7
      this.getStorage('tnbc', NAMESPACE), // 8
      this.getStorage('nbc', NAMESPACE), // 9
      this.getStorage('rich', NAMESPACE), // 10
      this.getStorage('kline', NAMESPACE), // 11
      this.getStorage('depth', NAMESPACE), // 12
      this.getStorage('hash', NAMESPACE), // 13
      this.getStorage('assets', NAMESPACE), // 14
      this.getStorage('charaAssets', NAMESPACE), // 15
      this.getStorage('bid', NAMESPACE) // 16
    ])

    const state = await res
    this.setState({
      characters: state[0] || {},
      mvc: state[1] || LIST_EMPTY,
      mrc: state[2] || LIST_EMPTY,
      mfc: state[3] || LIST_EMPTY,
      mvi: state[4] || LIST_EMPTY,
      mpi: state[5] || LIST_EMPTY,
      rai: state[6] || LIST_EMPTY,
      recent: state[7] || LIST_EMPTY,
      tnbc: state[8] || LIST_EMPTY,
      nbc: state[9] || LIST_EMPTY,
      rich: state[10] || INIT_RICH,
      kline: state[11] || {},
      depth: state[12] || {},
      hash: state[13] || '',
      assets: state[14] || INIT_ASSETS,
      charaAssets: state[15] || {},
      bid: state[16] || LIST_EMPTY
    })

    return res
  }

  // -------------------- get --------------------
  characters(id) {
    return (
      computed(() => this.state.characters[id]).get() || INIT_CHARACTERS_ITEM
    )
  }

  list(key = defaultKey) {
    return computed(() => this.state[key]).get() || LIST_EMPTY
  }

  rich(sort = defaultSort) {
    return computed(() => this.state.rich[sort]).get() || LIST_EMPTY
  }

  kline(id) {
    return computed(() => this.state.kline[id]).get() || INIT_KLINE_ITEM
  }

  depth(id) {
    return computed(() => this.state.depth[id]).get() || INIT_DEPTH_ITEM
  }

  @computed get hash() {
    return this.state.hash
  }

  @computed get assets() {
    return this.state.assets
  }

  charaAssets(hash) {
    return (
      computed(() => this.state.charaAssets[hash]).get() || INIT_CHARA_ASSETS
    )
  }

  userLogs(id) {
    return computed(() => this.state.userLogs[id]).get() || INIT_USER_LOGS
  }

  // -------------------- fetch --------------------
  /**
   * 人物数据
   */
  fetchCharacters = async ids => {
    const result = await fetch(API_TINYGRAIL_CHARAS(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(ids)
    }).then(response => response.json())

    const { characters } = this.state
    const data = {
      ...characters
    }

    if (result.State === 0) {
      result.Value.forEach(item => {
        data[item.Id] = {
          id: item.Id,
          bids: item.Bids,
          asks: item.Asks,
          change: item.Change,
          current: item.Current,
          fluctuation: item.Fluctuation ? item.Fluctuation * 100 : '',
          total: item.Total,
          marketValue: item.MarketValue,
          lastOrder: item.LastOrder,
          end: item.End,
          users: item.Users,
          name: item.Name,
          icon: item.Icon,
          bonus: item.Bonus,
          _loaded: getTimestamp()
        }
      })
    }
    const key = 'characters'
    this.setState({
      [key]: data
    })
    this.setStorage(key, undefined, NAMESPACE)

    return Promise.resolve(data)
  }

  /**
   * 总览列表
   */
  fetchList = async (key = defaultKey) => {
    const result = await fetch(API_TINYGRAIL_LIST(key), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    }).then(response => response.json())

    let data = {
      ...LIST_EMPTY
    }
    if (result.State === 0) {
      data = {
        ...LIST_EMPTY,
        list: (result.Value.Items || result.Value).map(item => ({
          id: item.CharacterId || item.Id,
          bids: item.Bids,
          asks: item.Asks,
          change: item.Change,
          current: item.Current,
          fluctuation: item.Fluctuation ? item.Fluctuation * 100 : '',
          total: item.Total,
          marketValue: item.MarketValue,
          lastOrder: item.LastOrder,
          end: item.End,
          users: item.Users,
          name: item.Name,
          icon: item.Icon,
          bonus: item.Bonus
        })),
        pagination: {
          page: 1,
          pageTotal: 1
        },
        _loaded: getTimestamp()
      }
    }

    this.setState({
      [key]: data
    })
    this.setStorage(key, undefined, NAMESPACE)

    return Promise.resolve(data)
  }

  /**
   * 番市首富
   */
  fetchRich = async (sort = defaultSort) => {
    axios.defaults.withCredentials = true
    const [page, limit] = sort.split('/')
    const result = await axios({
      method: 'get',
      url: API_TINYGRAIL_RICH(page, limit),
      responseType: 'json'
    })

    let data = {
      ...LIST_EMPTY
    }
    if (result.data.State === 0) {
      data = {
        ...LIST_EMPTY,
        list: result.data.Value.map(item => ({
          avatar: item.Avatar,
          nickname: item.Nickname,
          userId: item.Name,
          assets: item.Assets.toFixed(2),
          total: item.TotalBalance.toFixed(2),
          principal: item.Principal,
          lastActiveDate: item.LastActiveDate,
          lastIndex: item.LastIndex
        })),
        pagination: {
          page: 1,
          pageTotal: 1
        },
        _loaded: getTimestamp()
      }
    }

    const key = 'rich'
    const { rich } = this.state
    this.setState({
      [key]: {
        ...rich,
        [sort]: data
      }
    })
    this.setStorage(key, undefined, NAMESPACE)

    return Promise.resolve(data)
  }

  /**
   * K线原始数据
   */
  fetchKline = async monoId => {
    const result = await fetch(API_TINYGRAIL_CHARTS(monoId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    }).then(response => response.json())

    const data = {
      id: monoId,
      data: []
    }
    if (result.State === 0) {
      data._loaded = getTimestamp()
      data.data = result.Value.map(item => ({
        time: item.Time,
        begin: item.Begin,
        end: item.End,
        low: item.Low,
        high: item.High,
        amount: item.Amount,
        price: item.Price
      }))
    }

    const key = 'kline'
    this.setState({
      [key]: {
        [monoId]: data
      }
    })
    this.setStorage(key, undefined, NAMESPACE)

    return Promise.resolve(data)
  }

  /**
   * 深度图
   */
  fetchDepth = async monoId => {
    const result = await fetch(API_TINYGRAIL_DEPTH(monoId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    }).then(response => response.json())

    const data = {
      ...INIT_DEPTH_ITEM
    }
    if (result.State === 0) {
      data._loaded = getTimestamp()
      data.asks = result.Value.Asks.map(item => ({
        price: item.Price,
        amount: item.Amount
      }))
      data.bids = result.Value.Bids.map(item => ({
        price: item.Price,
        amount: item.Amount
      }))
    }

    const key = 'depth'
    this.setState({
      [key]: {
        [monoId]: data
      }
    })
    this.setStorage(key, undefined, NAMESPACE)

    return Promise.resolve(data)
  }

  /**
   * 用户唯一标识
   */
  fetchHash = async () => {
    axios.defaults.withCredentials = true
    const result = await axios({
      method: 'get',
      url: API_TINYGRAIL_HASH(),
      responseType: 'json'
    })

    let data = ''
    if (result.data.State === 0) {
      data = result.data.Value.Hash
    }

    const key = 'hash'
    this.setState({
      [key]: data
    })
    this.setStorage(key, undefined, NAMESPACE)

    return Promise.resolve(data)
  }

  /**
   * 资产信息
   */
  fetchAssets = async () => {
    axios.defaults.withCredentials = true
    const result = await axios({
      method: 'get',
      url: API_TINYGRAIL_ASSETS(),
      responseType: 'json'
    })

    let data = {
      ...INIT_ASSETS
    }
    if (result.data.State === 0) {
      data = {
        id: result.data.Value.Id,
        balance: result.data.Value.Balance,
        _loaded: getTimestamp()
      }
    }

    const key = 'assets'
    this.setState({
      [key]: data
    })
    this.setStorage(key, undefined, NAMESPACE)

    return Promise.resolve(data)
  }

  /**
   * 用户资产概览信息
   */
  fetchCharaAssets = async hash => {
    axios.defaults.withCredentials = true
    const result = await axios({
      method: 'get',
      url: API_TINYGRAIL_CHARA_ASSETS(hash),
      responseType: 'json'
    })

    const data = {
      ...INIT_CHARA_ASSETS
    }
    if (result.data.State === 0) {
      data._loaded = getTimestamp()
      data.id = result.data.Value.Id
      data.balance = result.data.Value.Balance
      data.characters = result.data.Value.Characters.map(item => ({
        id: item.Id,
        icon: item.Icon,
        name: item.Name,
        current: item.Current,
        state: item.State,
        total: item.Total
      }))
      data.initials = result.data.Value.Initials.map(item => ({
        id: item.Id,
        icon: item.Icon,
        name: item.Name,
        current: 0,
        state: item.State,
        total: item.Total
      }))
    }

    const key = 'charaAssets'
    this.setState({
      [key]: {
        [hash]: data
      }
    })
    this.setStorage(key, undefined, NAMESPACE)

    return Promise.resolve(data)
  }

  /**
   * 用户挂单和交易记录
   */
  fetchUserLogs = async monoId => {
    axios.defaults.withCredentials = true
    const result = await axios({
      method: 'get',
      url: API_TINYGRAIL_USER_CHARA(monoId),
      responseType: 'json'
    })

    let data = {
      ...INIT_USER_LOGS
    }
    if (result.data.State === 0) {
      data = {
        id: result.data.Value.Id,
        amount: result.data.Value.Amount,
        balance: result.data.Value.Balance,
        askHistory: result.data.Value.AskHistory.map(item => ({
          id: item.Id,
          characterId: item.CharacterId,
          amount: item.Amount,
          price: item.Price,
          time: item.TradeTime
        })),
        asks: result.data.Value.Asks.map(item => ({
          id: item.Id,
          characterId: item.CharacterId,
          amount: item.Amount,
          price: item.Price,
          time: item.Begin
        })),
        bidHistory: result.data.Value.BidHistory.map(item => ({
          id: item.Id,
          characterId: item.CharacterId,
          amount: item.Amount,
          price: item.Price,
          time: item.TradeTime
        })),
        bids: result.data.Value.Bids.map(item => ({
          id: item.Id,
          characterId: item.CharacterId,
          amount: item.Amount,
          price: item.Price,
          time: item.Begin
        })),
        _loaded: getTimestamp()
      }
    }

    const key = 'userLogs'
    this.setState({
      [key]: {
        [monoId]: data
      }
    })

    return Promise.resolve(data)
  }

  /**
   * 我的买单
   */
  fetchBid = async () => {
    axios.defaults.withCredentials = true
    const result = await axios({
      method: 'get',
      url: API_TINYGRAIL_CHARA_BID(),
      responseType: 'json'
    })

    let data = {
      ...LIST_EMPTY
    }
    if (result.data.State === 0) {
      data = {
        ...LIST_EMPTY,
        list: result.data.Value.Items.map(item => ({
          id: item.Id,
          bids: item.Bids,
          asks: item.Asks,
          change: item.Change,
          current: item.Current,
          fluctuation: item.Fluctuation ? item.Fluctuation * 100 : '',
          total: item.Total,
          marketValue: item.MarketValue,
          lastOrder: item.LastOrder,
          end: item.End,
          users: item.Users,
          name: item.Name,
          icon: item.Icon,
          bonus: item.Bonus,
          state: item.State
        })),
        pagination: {
          page: 1,
          pageTotal: 1
        },
        _loaded: getTimestamp()
      }
    }

    const key = 'bid'
    this.setState({
      [key]: data
    })
    this.setStorage(key, undefined, NAMESPACE)

    return Promise.resolve(data)
  }

  /**
   * 我的卖单
   */
  fetchAsks = async () => {
    axios.defaults.withCredentials = true
    const result = await axios({
      method: 'get',
      url: API_TINYGRAIL_CHARA_ASKS(),
      responseType: 'json'
    })

    let data = {
      ...LIST_EMPTY
    }
    if (result.data.State === 0) {
      data = {
        ...LIST_EMPTY,
        list: result.data.Value.Items.map(item => ({
          id: item.Id,
          bids: item.Bids,
          asks: item.Asks,
          change: item.Change,
          current: item.Current,
          fluctuation: item.Fluctuation ? item.Fluctuation * 100 : '',
          total: item.Total,
          marketValue: item.MarketValue,
          lastOrder: item.LastOrder,
          end: item.End,
          users: item.Users,
          name: item.Name,
          icon: item.Icon,
          bonus: item.Bonus,
          state: item.State
        })),
        pagination: {
          page: 1,
          pageTotal: 1
        },
        _loaded: getTimestamp()
      }
    }

    const key = 'asks'
    this.setState({
      [key]: data
    })
    this.setStorage(key, undefined, NAMESPACE)

    return Promise.resolve(data)
  }

  // -------------------- action --------------------
  /**
   * 买入
   */
  doBid = async ({ monoId, price, amount }) => {
    axios.defaults.withCredentials = true
    const result = await axios({
      method: 'post',
      url: API_TINYGRAIL_BID(monoId, price, amount),
      responseType: 'json'
    })

    if (result.data.State === 0) {
      return true
    }

    return false
  }

  /**
   * 卖出
   */
  doAsk = async ({ monoId, price, amount }) => {
    axios.defaults.withCredentials = true
    const result = await axios({
      method: 'post',
      url: API_TINYGRAIL_ASK(monoId, price, amount),
      responseType: 'json'
    })

    if (result.data.State === 0) {
      return true
    }

    return false
  }

  /**
   * 取消买入
   */
  doCancelBid = async ({ id }) => {
    axios.defaults.withCredentials = true
    const result = await axios({
      method: 'post',
      url: API_TINYGRAIL_CANCEL_BID(id),
      responseType: 'json'
    })

    if (result.data.State === 0) {
      return true
    }

    return false
  }

  /**
   * 取消卖出
   */
  doCancelAsk = async ({ id }) => {
    axios.defaults.withCredentials = true
    const result = await axios({
      method: 'post',
      url: API_TINYGRAIL_CANCEL_ASK(id),
      responseType: 'json'
    })

    if (result.data.State === 0) {
      return true
    }

    return false
  }
}

export default new Tinygrail()
