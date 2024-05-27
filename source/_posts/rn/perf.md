---
title: Hermes 性能分析（iOS）
date: 2024-05-27 09:03:26
categories:
- React Native
tags:
- Hermes
---

> [Hermes](https://hermesengine.dev/) 是专门针对 React Native 应用而优化的全新开源 JavaScript 引擎，使用Hermes有如下优点
> 
1. 优化启动时间
2. 减少内存占用
3. 减少空间占用

现如今，公司项目的初步升级工作已经完成，本文将以公司项目为测试项目，对比JSC（旧有JavaScript引擎）跟Hermes引擎的性能表现

<!-- more -->

## 启动时间

#### -  原理

{% image fancybox left clear group:IT perf.png "" %}

上图为JSC引擎的执行逻辑，在编译阶段，只会进行babel的转义以及minify的压缩，产物就是jsbundle，而对jsbundle的解释以及编译则会放在运行时。

{% image fancybox left clear group:IT perf1.png "" %}

hermes为了减少启动时间，将JSC中的对jsbundle的解释以及编译放在编译阶段， 通过减少了运行时的耗时才优化启动时间。

在进行具体的实测阶段之前，有必要先了解hermes的预编译是只有在release的模式下才生效，这是为了开发者能继续使用fast refresh的特性。所以测试启动时间需要采用release包进行测试。

由于release包无法简单的通过打印时间来测试启动，所以这里采用http去发送计算完的启动时间。

#### - 采样

启动时间的采样的起始点为RN的入口文件index.js，终点为HomePage首次加载成功后的回调，这是因为对于用户来说，这段时间刚好为用户点击App后，到首页出现之前的时间段。

在数据支撑的前提下，还会通过录屏对比实际启动效果。

#### - 对比

启动数据分别对比三次，这边数据只对比RN层，所以测试结果会比实际时间短

JSC，三次启动时间均值为154.31ms

{% image fancybox left clear group:IT perf2.png "" %}

Hermes，三次启动时间均值为112.09ms

{% image fancybox left clear group:IT perf3.png "" %}


***{% hl_text red %}Hermes相比于JSC的启动时间减少27%{% endhl_text %}***

实际的录屏效果则更为明显，Hermes基本为秒开，而JSC则有一个明显的停顿，

- 启动效果
    
    {% image fancybox left clear group:IT jsc_vs_hermes.gif "" %}
    

## 运行内存

运行内存直接采用Xcode自带的内存监测，但是同样的，运行的包必须为release包

#### - 采样

运行内存的采样分两步，第一步为启动后静置的内存，第二步为点击同一个商品详情后静置的内存，所谓静置，就是等内存不再爬坡后的高低做为记录点。

分别对比两次

#### - 对比

JSC

- 两次启动后静置 均值为168MB
<span style="width:50%;display:inline-block">
    {% image fancybox left clear group:IT perf4.png "" %}
</span><span style="width:50%;display:inline-block;">
    {% image fancybox left clear group:IT perf5.png "" %}
</span>
    
    
- 两次点击点击商品详情后 均值为204MB
    
<span style="width:50%;display:inline-block">
    {% image fancybox left clear group:IT perf6.png "" %}
</span><span style="width:50%;display:inline-block;">
    {% image fancybox left clear group:IT perf7.png "" %}
</span>
    
    

Hermes

- 两次启动后静置 均值为115MB
    
<span style="width:50%;display:inline-block">
    {% image fancybox left clear group:IT perf8.png "" %}
</span><span style="width:50%;display:inline-block;">
    {% image fancybox left clear group:IT perf9.png "" %}
</span>
    
    
- 两次点击点击商品详情后 均值为157MB
    
<span style="width:50%;display:inline-block">
    {% image fancybox left clear group:IT perf10.png "" %}
</span><span style="width:50%;display:inline-block;">
    {% image fancybox left clear group:IT perf11.png "" %}
</span>
    
    

**{% hl_text red %}Hermes在启动静置上的运行内存相比于JSC减少了31.5%，在点击商品详情后减少了23%{% endhl_text %}**

## 包大小

**{% hl_text red %}iOS直接采用ipa比较，在这点上，实际打包发现，JSC包大小为45.4M，而Hermes为48.8，增长了约7.4%{% endhl_text %}**

{% image fancybox left clear group:IT perf12.png "" %}
