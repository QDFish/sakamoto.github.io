---
title: React Native 0.70~0.74 版本变动总结
date: 2024-04-28 09:18:46
categories:
- React Native
tags:
- RN升级
---


> 本文调研所有0.70以上的React Native版本
> 

下文中{% hl_text green %}标绿{% endhl_text %}的点表示比较有用的功能点，{% hl_text red %}标红{% endhl_text %}表示需要需要注意的点

## 0.70 - 发布于2022.09.05

**主要更新点：**

- {% hl_text green %}统一Codegen的配置{% endhl_text %}
    
    将安卓 build.gradle中的配置移动到package.json
    
- 默认hermes系统
- 安卓全面支持CMake
- 升级 metro 0.72.0 支持新的jsx代码转换
- 重点提升新框架的体验

**总结：**

70版本主要重点在于提升新框架的用户体验，对于旧架构，简化了安卓端的配置


<br/>


## 0.71 - 发布于2023.01.12

<!-- more -->

**主要更新点**

- 0.71新工程默认使用typescript
- {% hl_text green %}Flexbox加入gap属性，可以替代margin的方式来布局{% endhl_text %}
- 重启 PropTypes的使用，PropTypes在未来还是会被弃用、
- {% hl_text green %}Hermes 性能提升{% endhl_text %}
    1. source map的改善
    2. JSON.parse 的性能提升30%
    3. Hermes 支持`at()`  方法
    
- 新框架更新
    1. 减少编译时间
    2. 更少的c++代码编写
    3. iOS端更好的依赖管理
    4. 修复bug跟更好的IDE支持

**总结：**

71版本相比于70版本有更多有实际意义的更新点：

1. 加入gap属性的布局能简化项目中的layout
2. Hermes提升了JSON.parse的性能，该方法在项目中也运用较多，
3. 新框架进行了全面的优化

<br/>

## 0.72 - 发布于2023.06.21

**主要更新点**

- 新的metro功能点
    1. 符号链接支持(Beta)（主要用于单一仓库多项目，公司都是单一仓库单一项目
    2. Package Exports 支持 (Beta) ，import可以只import到子目录，相当于一个新的alias路径
    3. metro.config.js 用来配置metro
- {% hl_text green %}Hermes开发体验的提升{% endhl_text %}
    1. 一些无效的style不会报红
    2. hermes中的错误输出可读性提高
    3. RN命令行的错误结果输出优化
    4. hermes提升JSON.parse性能跟编译速度
    5. hermes新增更多的 ECMAScript 支持 
- 移除一些官方库
    - [Slider](https://reactnative.dev/docs/next/slider) 被 [@react-native-community/slider](https://github.com/callstack/react-native-slider/tree/main/package) 替代
    - [DatePickerIOS](https://reactnative.dev/docs/next/datepickerios) 被 [@react-native-community/datetimepicker](https://github.com/react-native-datetimepicker/datetimepicker) 替代
    - [ProgressViewIOS](https://reactnative.dev/docs/next/progressviewios) 被 [@react-native-community/progress-view](https://github.com/react-native-progress-view/progress-view) 替代

**总结：**

0.72 着重提升开发者体验，metro新增的功能点都处于beta版本，整体来看更像是一个过渡版本

<br/>

## 0.73 - 发布于2023.11.06

**主要更新点**

- {% hl_text green %}调试改进{% endhl_text %}
    1. 解决了hermes系统中，在app初始化时console.log 不打印的问题
    2. 新增了一个官方的debug工具（实验性）
- 发布符号链接的稳定版本
- 新增Kotlin 模板
- {% hl_text green %}Android 14 支持{% endhl_text %}
- 新框架新增无桥模式
- Remote JavaScript Debugging  移除
- {% hl_text green %}iOS版本最小支持13.4{% endhl_text %}
- {% hl_text green %}Node版本最小支持18{% endhl_text %}

**总结：**

0.73 着重于优化native端，包括iOS版本最小支持13.4，Android 14的支持，弃用老旧版本对于代码稳定性具有比较大的意义

<br/>

## 0.74 - 发布于2024.04.22

**主要更新点**

- **Yoga 3.0**
    1. {% hl_text red %}新的layout布局，该布局会影响项目中现有组件布局，需要对旧有布局进行修改{% endhl_text %}
    2. 支持 **`align-content: 'space-evenly'`**
    3. 支持 **`position: 'static'` —** 新框架专有
1. 新框架的更新
    1. 默认开启无桥模式
    2. `onLayout` 方法批量更新，避免多次重渲染
2. 使用Yarn 3 管理依赖
3. {% hl_text green %}安卓最小版本提升到Android 6{% endhl_text %}
    1. 提升的奖励，app size减少百分13
4. {% hl_text red %}存在已知bug，涉及ipad端的多窗口模式{% endhl_text %}

**总结：**

0.74版本主要点在于引入了Yoga3.0，会对项目旧有布局产生影响，影响点在于有使用row-reverse布局的组件，使用该性质的组件不多，修改工作量可控。

<br/>

## 选择

最终选择73的最新版本[v0.73.7](https://github.com/facebook/react-native/releases/tag/v0.73.7)， 有以下几点原因

- 目前时间点为2024.4.26，距离74发布仅过了4天，并且74已经存在已知bug，以及布局上对旧有项目的不支持，所以暂不考虑74版本。
- 72为73的过渡版本
- 73版本是一个对原生有较大升级的版本，升级的意义较大。
