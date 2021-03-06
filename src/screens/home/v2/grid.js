/*
 * @Author: czy0729
 * @Date: 2019-10-19 20:08:21
 * @Last Modified by: czy0729
 * @Last Modified time: 2020-07-07 20:46:32
 */
import React from 'react'
import { View } from 'react-native'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { Loading, ListView, Flex, Text, Mesume } from '@components'
import { _ } from '@stores'
import { IOS } from '@constants'
import GridInfo from './grid-info'
import GridItem from './grid-item'

const listViewProps = IOS
  ? {
      contentOffset: {
        y: -_.tabsHeaderHeight
      }
    }
  : {}
const footerNoMoreDataComponent = <View />

class Grid extends React.Component {
  static defaultProps = {
    title: '全部'
  }

  static contextTypes = {
    $: PropTypes.object
  }

  listView

  componentDidMount() {
    // iOS端不知道原因, 初次渲染会看见下拉刷新的文字
    if (IOS && this.listView) {
      try {
        this.listView.scrollToIndex({
          animated: false,
          index: 0,
          viewOffset: 0
        })
      } catch (error) {
        warn('HomeGrid', 'componentDidMount', error)
      }
    }
  }

  connectRef = ref => (this.listView = ref)

  renderEmpty() {
    return (
      <Flex style={this.styles.noSelect} justify='center' direction='column'>
        <Mesume size={80} />
        <Text style={_.mt.sm} type='sub' align='center'>
          请点击下方条目
        </Text>
      </Flex>
    )
  }

  render() {
    const { $ } = this.context
    const { title } = this.props
    if (!$.userCollection._loaded) {
      return <Loading />
    }

    const { current } = $.state
    const userCollection = $.currentUserCollection(title)
    const find = userCollection.list.find(item => item.subject_id === current)
    return (
      <View style={this.styles.container}>
        <View style={this.styles.current}>
          {find ? (
            <GridInfo
              subjectId={find.subject_id}
              subject={find.subject}
              epStatus={find.ep_status}
            />
          ) : (
            this.renderEmpty()
          )}
        </View>
        <ListView
          ref={this.connectRef}
          style={!IOS && this.styles.androidWrap}
          contentContainerStyle={this.styles.contentContainerStyle}
          keyExtractor={keyExtractor}
          data={userCollection}
          numColumns={_.isPad ? 5 : 4}
          footerNoMoreDataComponent={footerNoMoreDataComponent}
          footerNoMoreDataText=''
          renderItem={renderItem}
          onHeaderRefresh={$.onHeaderRefresh}
          {...listViewProps}
        />
      </View>
    )
  }

  get styles() {
    return memoStyles()
  }
}

export default observer(Grid)

const memoStyles = _.memoStyles(_ => ({
  container: {
    flex: 1,
    paddingTop: IOS ? _.tabsHeaderHeight : 0,
    paddingBottom: IOS ? _.tabBarHeight : 0,
    backgroundColor: _.select(_.colorPlain, _.colorBg)
  },
  current: {
    width: '100%',
    height: 256
  },
  noSelect: {
    width: '100%',
    height: '100%'
  },
  androidWrap: {
    marginBottom: _.tabBarHeight - 1
  },
  contentContainerStyle: {
    paddingTop: _.sm,
    paddingBottom: IOS
      ? _.tabBarHeight + _.space
      : _.tabBarHeight + _.space - _.tabBarHeight,
    paddingLeft: _.wind - _.sm - 2
  }
}))

function keyExtractor(item) {
  return String(item.subject_id)
}

function renderItem({ item }) {
  return <GridItem {...item} />
}
