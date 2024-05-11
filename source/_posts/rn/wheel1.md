---
title: React-Native 纯ts代码实现滚轮选择器
date: 2024-05-11 09:21:47
thumbnailImage: wheel1.gif
categories:
- React Native
tags:
- 滚轮选择器
---

> iOS的滚轮选择器兼顾了实用性跟美观，在例如日期选择，国家省份选择的用户场景下，尤为适合，在{% post_link rn/create_library %}中我们介绍了如何使用**create-react-native-library**创建一个标准RN库，以这个例子为契机，包括创建，环境初始化，设计，到发布代码到npm，依次实践整个流程。
> 

<!-- more -->

PS: 目前安卓已经有优秀的第三方框架实现了滚轮选择器，原生代码的实现效果必然要好于JS层，所以该项目以学习为主要目的，在此基础上再不断完善用户体验。

{% image fancybox left clear group:IT wheel0.gif 60% 60% "iOS" %} 
{% image fancybox right clear group:IT wheel1.gif 60% 60% "TSX" %}

    
## 前言

本系列将由三大篇构成：

- 滚轮选择实现逻辑以及UI部分
- 滚轮动画效果的实现（参考[https://github.com/erksch/react-native-wheely?tab=readme-ov-file](https://github.com/erksch/react-native-wheely?tab=readme-ov-file)）
- 发布到npm

## 框架搭建

create-react-native-library创建RN库

```bash
npx create-react-native-library@latest wheel-picker-purejs
```

这边需要注意的是，虽然我们的选择器用纯ts代码实现，但是在type of library 的选项上要选择Native View而不是JavaScript library，这是因为Native View选项会生成iOS跟安卓的example目录，虽然该项目没有原生的实现，但是仍需要借助原生平台进行调试。

框架搭建好，在src目录下创建两个文件、

- WheelPicker.tsx   — 滚轮主体
- WheelPikcerRow.tsx  — 滚轮条目

## 滚轮主体

很容易将滚轮跟FlatList关联起来，在不考虑动画效果的前提下，FlatList只要支持以下属性即可实现滚轮的基本功能：

- 选择框 — 即中间的蒙层
- 初始条目index — 滚轮的初始条目位置
- 数据源 — FlatList已支持
- 停止滚动后，滚动距离需要为条目高度的整数倍 — 滚轮必须确定条目的选择
- 停止滚动后，回调此时的index

### - 滚轮主体的大小如何定义

{% image fancybox left clear group:IT wheel2.png 50% 50% "wheel" %}

滚轮在滚动到第一个选项时，在该条目的前面是没有数据的，同理最后一条则是后面没有数据，需要为FlatList的头尾补齐空数据，而一个滚轮的大小就是由中间选择条目跟上下的可显示条目决定的，所以这里的滚轮组件接收三个属性：

```
    wheelWidth: number; //滚轮宽度
    itemHeight: number; //条目高度
    visibleNum?: 1 | 2 | 3;  //可展示条目数量
```

此时滚轮的宽度为`wheelWidth`，高度为`visibleNum * 2 + 1` ，这时候，选择框位于整个FlatList之间不动即可

### - 滚轮初始化位置

FlatList的initialScrollIndex 在使用中经常发生失效的问题，所以初始化的位置使用的是FlatList的contentOffset，通过`selectIndex * itemHeight` 使FlatList滚动到指定位置。

### - 停止滚动？

当滚动停止时，滚动的距离需要为条目高度的整数倍，默认下FlatList是不支持的（pagingEnable在该情况下不适用），所以通过监听`onScrollEndDrag` 事件，该事件在用户手指离开拽动后触发，在该事件触发后，计算此时的contentOffset.y，即此时的滚动距离，`contentOffset.y /  itemHeight` 四舍五入后得出的整数结果即此时应该停留的条目位置，再通过FlatListRef调用`scrollToIndex`到指定为止即可。

如果只是监听用户拖动停止的事件的位置来决定滚轮最终停下来的位置，则滚轮会失去FlatList原来的动能滚动，当用户以一个初速度滑动列表并松开手指时，FlatList可以像冰壶一样向前加速滑行，然后慢慢减速后停止，而`onScrollEndDrag` 强制在松开手指时定位位置也就失去的动能表现。

FlatList的`onMomentumScrollBegin`跟`onMomentumScrollEnd` 可以解决这个问题，当FlatList以一个初速度被释放时（如果没有初速度，慢慢拖动则不会触发）`onMomentumScrollBegin` 事件触发，用一个变量标记FlatList处于动能滚动中，以此屏蔽`onScrollEndDrag` 的的定位事件。当动能滚动结束后，`onMomentumScrollEnd` 触发，将标记变量重置回去，并且再次根据滚动距离计算条目位置，方法同上。

这边只需要注意，`onMomentumScrollBegin` 的事件要晚于`onScrollEndDrag` ，需要人为的延后`onScrollEndDrag` 的事件执行即可。

### - 最终停止位置回调

有了上述的停止滚动机制后，只需要将停止后的位置回调即可，加200ms的延迟给予回滚时间。

## 滚轮条目

滚轮条目即Flatlist的renderItem，独立出条目的原因在于滚轮的动画效果是作用在条目上而不是滚轮主体上。滚轮动画效果相关将在下一章介绍

刨去动画效果之后，条目只需要接受滚轮主体的itemHeight高度属性即可。

## 滚轮UI

可以定制的UI包括选择框样式，条目样式，将相关属性暴露给滚轮主体，再经由滚轮主体传给每个滚轮条目即可。定制化UI对于生产项目意义重大，但是由于本项目主要做学习用，所以在此不赘述。

## 后言

下一章将介绍滚轮的重点 — 动画。

动画是滚轮之所以为滚轮，而不是一个简单的列表选择器的原因，通过滚轮的动画的实现对RN的动画会有更深入的了解
