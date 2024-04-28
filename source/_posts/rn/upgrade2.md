---
title: React Native 升级 - Node版本选择
date: 2024-04-28 09:20:18
categories:
- React Native
tags:
- RN升级
---




Node选择v20.12.2
<!-- more -->
## Node版本周期表


{% image fancybox left clear group:IT upgrade0.svg 100% 100% "" %}

Node的每个版本有三个周期

1. **CURRENT：**该周期内，版本库作者会对其进行6个月的支持，6个月后，基数开头的版本的库将不再被支持，偶数版本的库会进入ACTIVE LTS周期， CURRENT的版本不应该被作为生产版本
2. **ACTIVE LTS：**LTS的任何版本发生严重的bug会在平均30个月左右的时间内被修复，可以用于生产，在经过大概一年后会进入MAINTENANCE LTS周期
3. **MAINTENANCE LTS：**该版本也是LTS版本，相较于ACTIVE更为稳定

官方建议生产只能选择LTS版本，也就是ACTIVE LTS或者MAINTENANCE LTS

## 选择

从上图周期表可以看出，20版本从24年一月份开始已经进入了MAINTENANCE LTS周期，是一个在版本上跟稳定性上最优的版本。

而v20.12.2 是20版本目前最新的版本，发布于2024-04-10号，
