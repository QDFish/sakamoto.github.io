---
title: React-Native 纯ts代码实现滚轮选择器 —— 滚轮动画优化（三）
date: 2024-05-20 17:32:41
categories:
- React Native
tags:
- 滚轮选择器
- 动画
---

<!-- toc -->

> 上篇提到一个不完美的滚轮动画方案，详情见{% post_link rn/wheel2 %}，其问题主要是复杂函数的补间动画难以实现，直接的动画计算又只支持基础运算，本篇将使用React-Native-Reanimated 动画框架来解决这个问题。
> 

<!-- more -->

## Reanimated VS 官方动画

一句话简单概括，Reanimated支持官方动画不支持的复杂动画计算。

官方动画库中关于动画计算只有5个函数

- **`add()`  — 相加**
- **`subtract()` — 相减**
- **`divide()` — 相除**
- **`multiply()` — 相乘**
- **`modulo()` — 取模**

而从上篇得知，滚轮的动画既涉及三角函数，也涉及指数函数，基本的动画计算无法满足滚轮效果，而Reanimated的动画计算不需要使用动画库指定函数，而是类似于在一个block当中去计算即可，这表示你可以运用任何已有的js函数去进行计算。

<br>

## 具体实现

关于滚轮动画的公式，上一节有着重介绍，在此不赘述，这里主要配合代码说明如何修改原来的官方库到Reanimated

<br>

#### - 滚轮

```tsx
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
```

需要将react-native中的Animated替换成react-native-reanimated中的Animated

绑定ScrollView onScroll事件的方式也有所不同，但逻辑上没有大的区别，代码如下

```tsx
...
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import WheelPickerRow from './WheelPickerRow';

const WheelPicker: React.FC<WheelPickerProps> = (props) => {
	...
	//声明滚动距离动画变量
    const scrollY = useSharedValue(0)

	//滚动距离绑定
    const scrollHandler = useAnimatedScrollHandler(
        (event: ReanimatedScrollEvent) => {
            'worklet';
            scrollY.value = event.contentOffset.y
        }
    );

    return (
        <View>
            <View
                style={[
                    styles.selector,
                    { width: props.wheelWidth, height: props.itemHeight },
                ]}
            />
            <Animated.FlatList
                ref={listRef}
		        ...
                ...
                //事件绑定
                onScroll={scrollHandler}
                renderItem={({ item, index }) => {
                    return (

                            <WheelPickerRow
		                        //传值
                                scrollY={scrollY}
	                              ...
                            />
                    );
                }}
            />
        </View>
    );
};

```
<br>

#### - 滚轮条目

每个滚轮条目都接收滚轮滚动距离scrollY，这是一个可供动画的变量，只要以scrollY为变量，进行旋转，位移的动画计算，即可实现实时准确的滚轮动画

代码如下：

```tsx
import Animated , { useDerivedValue, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

interface WheelPickerRowProps {
    idx: number;
    text: string;
    itemHeight: number;
    rowStyle?: ViewStyle;
    textStyle?: TextStyle;
    visibleNum: 1 | 2 | 3;
    scrollY: SharedValue<number>
}

const WheelPickerRow: React.FC<WheelPickerRowProps> = (props) => {
    const visibleNum = props.visibleNum + 2 //旋转跟位移会导致具体显示条目增加
    const itemHeight = props.itemHeight
    const deg = 90;//最后一个可视条目的旋转角度，之间的条目角度逐条递减
    const rad = (deg / 180) * 3.14;
    const _idx = props.idx - props.visibleNum;

    const initScrollY = _idx * itemHeight
    const upperScrollY = initScrollY - visibleNum * itemHeight//上边界的滚动距离
    const lowerScrollY = initScrollY + visibleNum * itemHeight//下边界滚动距离
    //旋转函数y=ax+b 
    const a = rad / (visibleNum * itemHeight)
    const b = -rad - upperScrollY * a

	//旋转函数使用的是线性函数，区间为[upperScrollY, lowerScrollY], y= ax + b
    const rotateX = useDerivedValue(() => {
        if (props.scrollY.value >= upperScrollY && props.scrollY.value <= lowerScrollY) {
            return `${a * props.scrollY.value + b}rad`
        }
        return '0rad'
    })

		//相隔条目的角度差
    const radEach = rad / visibleNum
    
    const animatedStyles = useAnimatedStyle(() => {
        let x = Number(rotateX.value.replace('rad', ''))
        let absX = Math.abs(x)

        let y = 0
        let opacity = 1
        if (x >= -rad && x <= rad) {
            const position = Math.floor(absX / radEach)
						//此处偏移量的计算参考上篇文章
            y = (itemHeight / 2) * (1 - Math.sin(Math.PI / 2 - absX));
            for (let j = 1; j <= position; j++) {
                absX = absX - radEach
                y = y + itemHeight * (1 - Math.sin(Math.PI / 2 - absX)); 
            }

						//透明度为指数函数
            opacity = Math.pow(1 / 4, Math.abs(x))
            if (_idx == 7) {
                console.log('xx' + Math.abs(x))
            }
            y = x > 0 ? y : -y
        }

        return {
            transform: [{translateY: y}, {rotateX: rotateX.value}], opacity
        }
    })

    return (
        <Animated.View
            style={[
                styles.row,
                props.rowStyle,
                { height: props.itemHeight, width: 'auto' },
                animatedStyles
            ]}
        >
            <Text style={[styles.rowTitle, props.textStyle]}>{props.text}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    row: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowTitle: {
        color: 'black',
        fontSize: 12,
        fontWeight: 'normal',
    },
});

export default React.memo(WheelPickerRow);

```

<br>

## 效果对比

<span style="width:40%;display:inline-block">
    {% image fancybox left clear group:IT wheel0.gif "old" %}
</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;vs&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="width:40%;display:inline-block;">
    {% image fancybox left clear group:IT wheel1.gif "new" %}
</span>

左边为优化前，右边为优化后，观察1，4，5，6

能很明显感觉到左边的边沿处数字是被拉拽出去的，这是因为偏移量采用线性补间的缘故，而reanimated的实时计算解决的误差问题，能得到一个近乎完美的滚动动画。
