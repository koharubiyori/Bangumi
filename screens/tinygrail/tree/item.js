/*
 * @Author: czy0729
 * @Date: 2019-11-23 22:22:48
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-11-23 23:57:00
 */
import React from 'react'
import { StyleSheet } from 'react-native'
import { Touchable, Flex, Image, Text } from '@components'
import { observer } from '@utils/decorators'
import _ from '@styles'
import {
  colorContainer,
  colorText,
  colorBorder,
  colorBid,
  colorAsk
} from '../styles'

const area = _.window.width * _.window.height

function Item({
  w,
  h,
  x,
  y,
  id,
  icon,
  name,
  price,
  percent,
  fluctuation,
  label,
  extra,
  isTemple,
  onPress,
  onLongPress
}) {
  const ratio = (percent + 1) ** 2
  const ratioHeight = (h / _.window.height) * 1.2
  const showAvatar = !!icon && (w * h) / area > 0.016
  const _percent = percent * 100
  const textSize = parseInt(9 * ratio)

  let priceText
  if (price > 100000000) {
    priceText = `${parseFloat((price / 100000000).toFixed(1))}亿`
  } else if (price > 10000) {
    priceText = `${parseFloat((price / 10000).toFixed(1))}万`
  } else {
    priceText = parseFloat(price.toFixed(1))
  }

  let backgroundColor = colorContainer
  if (!icon) {
    backgroundColor = colorBorder
  }

  let left
  let right
  let textColor = colorText
  if (label === '当前涨跌') {
    right = '%'
    if (fluctuation > 0) {
      left = '+'
      textColor = colorBid
    } else if (fluctuation < 0) {
      left = '-'
      textColor = colorAsk
    }
  }

  return (
    <Touchable
      style={[
        styles.item,
        {
          top: y,
          left: x,
          width: w,
          height: h,
          backgroundColor
        }
      ]}
      onPress={() =>
        onPress({
          id,
          name
        })
      }
      onLongPress={() =>
        onLongPress({
          id,
          name
        })
      }
    >
      <Flex style={_.container.flex} direction='column' justify='center'>
        {showAvatar && (
          <Image
            style={{
              marginBottom: parseInt(5.6 * ratio)
            }}
            src={icon}
            size={parseInt(ratioHeight * 240)}
            height={
              isTemple
                ? parseInt(ratioHeight * 320)
                : parseInt(ratioHeight * 240)
            }
            radius={isTemple ? 4 : parseInt(ratioHeight * 120)}
            placeholder={false}
          />
        )}
        <Text size={parseInt(11 * ratio)} type='plain' numberOfLines={1}>
          {name}
        </Text>
        <Text
          style={{
            marginTop: parseInt(3 * ratio),
            color: colorText
          }}
          size={textSize}
          numberOfLines={1}
        >
          <Text
            style={{
              color: textColor
            }}
            size={textSize}
          >
            {extra}
            {left}
            {priceText}
            {right}
          </Text>{' '}
          / {_percent.toFixed(_percent < 0.1 ? 2 : 1)}%
        </Text>
      </Flex>
    </Touchable>
  )
}

Item.defaultProps = {
  onPress: Function.prototype,
  onLongPress: Function.prototype
}

export default observer(Item)

const styles = StyleSheet.create({
  item: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colorBorder,
    overflow: 'hidden'
  }
})
