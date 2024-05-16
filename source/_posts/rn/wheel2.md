---
title: React-Native 纯ts代码实现滚轮选择器 —— 滚轮动画逻辑（二）
date: 2024-05-16 13:54:11
thumbnailImage: wheel5.png
mathjax: true
categories:
- React Native
tags:
- 滚轮选择器
- 动画
---

<!-- toc -->

> 滚轮的动画效果涉及到高中数学的知识，主要为三角函数，指数函数，所以本章开头会先对这两类函数做简单的介绍，之后再讲滚轮动画的原理，最后为代码实现。
> 

<!-- more -->

## 三角函数

**三角函数**是数学很常见的一类关于角度的函数，三角函数将直角三角形的内角和它的两边的比值相关。

{% image fancybox left clear group:IT wheel0.png "三角函数" %}

如图所见，对角边与斜边的比与sinθ，邻边与斜边的比与cosθ，所以知道任意一边与夹角就可以求得其他边长。

<br>

## 指数函数

指数函数是形式为$b^x$的数学函数，其中b为基底，x为指数

下图为$y=2^x$的坐标图

{% image fancybox left clear group:IT wheel1.png "指数函数" %}

- 当x< 0时，y以一个斜率逐渐减低的趋势缩减至0，但不为0，而是不限接近于0，
- 当x> 0时，y以一个斜率逐渐增大的趋势增加到无限大
- 当x = 0时，y=1
- 基底越大，变化率越快

指数函数可以进行的多种变换，有时候我们需要y的范围为0~1，并且增长率逐渐降低，这时候的函数式为

$y = -(1/2)^x + 1$

{% image fancybox left clear group:IT wheel2.png "指数函数变化" %}

<br>

## 滚轮动画

从滚轮的侧面来窥探滚轮动画的实现

{% image fancybox left clear group:IT wheel3.png "滚轮" %}

{% image fancybox left clear group:IT wheel4.png "滚轮侧边图" %}

图中标绿色，蓝色，红色的线段分别表示滚轮的条目，各有两条， 左边线段表示滚轮动画实际应出的位置，右边线段表示FlatList条目只进行旋转的位置。

把线段的中点与数字一一对应，则I，H对应7，J，G对应8，可以看出，如果FlatList的条目只依据位置进行旋转操作是不够，还必须进行Y轴上的平移，使中点处于同一位置。

<br>

#### - 偏移量的计算

从图中看出偏移量为LB‘2的长度，假设绿色线段长度为G，则HB’2为G/2，则B’2M的长度为

$G/2 * sin(pi/2 - H)$

其中H为30°角，转成rad为 30/180 * pi

于是可以得出LB‘2的长度为：

$G/2(1 - sin(pi/2 - H))$

{% image fancybox left clear group:IT wheel5.png "滚轮侧边图" %}

再来看下J，G的偏移量QC’3

{% image fancybox left clear group:IT wheel6.png "滚轮侧边图" %}

首先QC’3 = QO + OC’3，OC‘3的计算方式如上所述，所以只要求出QO即可

很容易看出，QO为LB‘2的两倍，因为QO的长度刚好就等于，B‘C减去B’C'’斜边的夹角边。

接下去的每一边，旋转角度<90度的情况下，都是根据条目的位置来计算偏移量，每个偏移量等于自身偏移量加上2倍的前面偏移量。

<br>

## 代码实现

首先声明动画值scrollY，并将其绑定在FlatList的onScroll事件的contentOffset.y，可以参考{% post_link rn/animated %}

滚轮动画的本质就是根据不同scrollY数据，计算出相应的旋转角度跟偏移量，并作用于滚轮条目。

使用插值动画可以实现将scrollY进行角度跟偏移量的映射。

假设条目高度为20，那么对于0的条目来说，它的选中位置scrollY为0，而对于条目1来说，它的选中位置scrollY为20，依次类推，可以得出不同位置的inputRange，从而保证outputRange的统一。

代码如下：

```tsx
    const rotateX = props.scrollY.interpolate({
        inputRange: (() => {
            const initScrollY = _idx * itemHeight;
            const range: number[] = [initScrollY];
            for (let i = 1; i <= visibleNum; i++) {
                range.unshift(initScrollY - itemHeight * i);
                range.push(initScrollY + itemHeight * i);
            }

            return range;
        })(),
        outputRange: (() => {
            const range: string[] = [`0rad`];
            for (let i = 1; i <= visibleNum; i++) {
                const rad = rotateFunc(i) * radEach;
                range.unshift(`${-rad}rad`);
                range.push(`${rad}rad`);
            }
            return range;
        })(),
    });

    const translateY = props.scrollY.interpolate({
        inputRange: (() => {
            const initScrollY = _idx * itemHeight;
            const range: number[] = [initScrollY];
            for (let i = 1; i <= visibleNum; i++) {
                range.unshift(initScrollY - itemHeight * i);
                range.push(initScrollY + itemHeight * i);
            }

            return range;
        })(),
        outputRange: (() => {
            const range: number[] = [0];
            for (let i = 1; i <= visibleNum; i++) {
                let y = (itemHeight / 2) * (1 - Math.sin(Math.PI / 2 - rotateFunc(i) * radEach)); 

                for (let j = 1; j < i; j++) {
                    y = y + itemHeight * (1 - Math.sin(Math.PI / 2 - rotateFunc(j) * radEach)); 
                }
                range.unshift(-y);
                range.push(y);
            }
            return range;
        })(),
        extrapolate: 'clamp',
    });
```
<br>

#### - 旋转函数

重要的就是rotateFunc的实现，即旋转函数，根据前面的图示，rotateFunc可以为线性函数，中心位置为0°，偏离一个单位为30，-30，二个单位为60，-60。

理论上这可以实现一个完美的滚轮，然而插值的默认补间动画为线性函数，即只有在滚轮停下来时，位置是正确的， 在滑动过程中，偏移量为线性补间，并非正确的值，所以滚轮运动时的效果并不像一个滚轮

{% image fancybox left clear group:IT wheel7.gif "滚轮效果图" %}

可以看到，与选中条目相邻的位置影响较小，而远离选中条目的影响较大，有一种拖着往上走的感觉，而不是滚上来的，这是因为距离选中条目越远，偏移量是需要叠加前面的偏移量总和的2倍，这时候受线性补间的影响就大，虽然插值动画可以自定义补间动画，但是由于参数值存在着不识别方向只识别区间值的问题，总体来说也无法解决这个问题。

前面说过，当距离选中位置越近，即使变化角度大点，也能近似于模拟滚动动画，所以可以通过指数函数，即前期的角度变化大点，让滚轮动画明显一点，而后期变化小点来尽可能的消除偏移量误差，再通过透明值，让远端有误差的动画近似于透明来解决这个问题。

代码如下：

```tsx
    const rotateFunc = (idx: number) => {
        const i = (1 / visibleNum) * idx;
        return -Math.pow(1 / 4, i) + 1;
    };
```

效果如下：

{% image fancybox left clear group:IT wheel8.gif "滚轮效果图" %}

<br>


## 后言

完美的滚轮动画应该是根据位置时时计算偏移量，但是由于官方动画库对于动画的映射除了插值外，就只有简单的加减乘除，无法应对复杂的情形，这时候替换官方动画库是一个不错的解决方案。
