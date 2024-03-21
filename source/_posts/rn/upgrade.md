---
title: RN升级 0.63.2⇒0.73.4（ iOS篇）
date: 2024-03-21 10:31:22
categories:
- React Native
tags:
- RN升级
---

> 目前公司所有项目的React Native版本为0.63.2，发布于2020.6月份，时隔将近4年，Native SDK的更新已经导致了某些RN api的不兼容，例如安卓点击事件的穿透还有iOS tabbar 颜色更新无效等等，iOS SDK 最低支持版本从10升到了13，舍弃了市场份额小的机型覆盖，对于简化代码和架构稳定性具有重大意义，而Hermes新引擎的引入，以及对未来新框架的适配，对用户体验来说也至关重要。
> 

<!-- more -->

## Hermes引擎

Hermes引擎是专门为RN做优化的javascript引擎，从0.64开始对iOS提供支持（[ensure you're using at least version 0.60.4 of React Native to enable Hermes on Android or **0.64** of React Native to enable Hermes on iOS.](https://reactnative.dev/docs/hermes)），使用Hermes对App有以下优化点

1. 缩短app启动时间
2. 减少app内存使用
3. 减少app包大小
    
    {% image fancybox left clear group:IT rn_upgrade_0.png "hermes" %}
    

## 新框架

RN旧框架使用桥去进行JS跟Native层的通信，而传输的数据采用序列化json的方式，旧框架最大的缺点就是通信无法同步，比如JS的布局代码跟Native实际布局的代码分属不同线程去异步执行，这导致涉及到时时更新的布局时肉眼能明显觉察到UI的延迟渲染，例如动画

{% image fancybox left clear group:IT rn_upgrade_7.gif 50% 50% "legacy" %}

而新框架通过将桥替换成JSI，JSI具有持有c++对象的能力，从而解决了这个问题，使得RN渐渐追上纯原生渲染的效果

{% image fancybox left clear group:IT rn_upgrade_8.gif 50% 50% "new" %}

RN新框架具有以下特点：

1. 同步布局UI
2. 支持并行批量渲染
3. 使用JSI通信，效率更高且更快

新框架的最低支持版本是0.68，但是目前新框架还处于实验阶段，官方不建议任何production接入新框架，但是RN的未来一定是新框架

## 升级步骤

- 使用官方工具 [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) 修改工程中的配置文件
    
    该工具支持通过输入升级前后的版本号，使用git diff展示升级所需要修改的文件内容，理论上只要跟着对照表修改每一处内容即可完成升级，但是一个完整app的内容还包含第三方库，同时，0.73.4相对于0.63.2，启动逻辑也有修改。
    
    {% image fancybox left clear group:IT rn_upgrade_1.png "upgrade helper" %}
    
- 第三方库升级
    
    公司项目存在大量私有库，这些私有库基本都是clone第三方库，定制化后制作成私有库供项目使用，如果每个第三方库都升级一遍代码，工作量巨大，RN的正式版本目前仍未发布（大版本仍然为0），理论上有很多接口都是相互兼容，实际上也是如此，所以默认不对第三方库进行升级，而是在跑起app后，查看运行情况定点修复。
    #

    但是整个公司的众多私有库仍存在一个目录结构的问题，这个问题导致npm install后，有很多iOS原生代码并未安装到工程当中。
    #
    
    下图是私有库react-native-loading，iOS的私有库管理文件RNLoading.podspec处于ios目录下，新版npm安装时要求改文件位于最外层目录
    
    {% image fancybox left clear group:IT rn_upgrade_2.png "" %}
    
    #
    其次.podspec的配置中还需要将所有引用本地目录的配置都改为以ios为目录路径
    
    `s.source_files  = "*.{h,m}"` ⇒ `s.source_files  = "ios/*.{h,m}"`
    
    #
    考虑到这样的库有很多，而每个app虽然引用同一个私有库，但是也存在版本不同的问题，最重要的是，升级这件事需要很长的测试周期，新版本跟旧版本会并行一段时间，所以采用脚本的方式去批量处理所有私有库。
    
    #
    该脚本接收package.json，自动将dependencies中所有的私有库进行检查，修改，提交，打tag，并自动替换package.json中dependencies值为修改的tag
    
    修改完后的package.json，如下图
    
    {% image fancybox left clear group:IT rn_upgrade_3.png "" %}
    
    会在原来版本的基础上加上0.74_test_upgrade，如果版本已经修改，则会跳过，所以可以多次重复执行。
    
- 启动逻辑适配
    
    iOS中AppDelegate从继承自UIResponser改成了继承自RCTAppDelegate，该类为RN类，类中做了对新框架的支持判断，按照官方的文档，需要再`didFinishLaunchingWithOptions` 中调用父类的方法返回，但是由于公司的项目都是基于react-native-navigation框架，该框架对启动逻辑也有自己的要求，两者需整合，具体修改如下
    
    {% image fancybox left clear group:IT rn_upgrade_4.png "" %}

    {% image fancybox left clear group:IT rn_upgrade_5.png "" %}

    {% image fancybox left clear group:IT rn_upgrade_6.png "" %}
    

## 后续

本次升级只是完成了RN升级到新版本后iOS App基本功能的运行，要完成真正的升级还需要以下步骤

1. 安卓的升级
2. 更新第三方库的最新代码
3. Hermes性能测试，提审测试（有被拒风险，虽然meta官方表示这个问题已解决，但是需要验证
4. QA介入进行完整的回归测试

##
