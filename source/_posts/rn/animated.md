---
title: React Native 动画
date: 2024-04-12 18:09:07
categories:
- React Native
tags:
- 动画
---

RN提供了两套动画系统

- Animated API
- LayoutAnimation

他们分别有不同的应用场景。本文DEMO可以从[QDAnimatedDemo](https://github.com/QDFish/QDAnimatedDemo) 获取


## 基础动画

Animated API 主要是用来将视图的属性值映射成动画值，然后通过控制该动画值的变化关系来赋予视图定制化的动画效果，比如正方块从顶部往下掉，

<!-- more -->

{% image fancybox left clear group:IT animated5.gif 50% 50% "" %}

变化值是正方块的top值，范围为[0, 300]，首先定义一个动画值，初始值为0

```jsx
topValue = new Animated.Value(0)//初始值为0
```

为topValue定义动画关系，使用spring动画（弹簧效果），终止值是300，即0~300

```jsx
topAni = Animated.spring(topValue, {
    toValue: 300
})
```

将topValue赋值于View的top属性，并开启动画。Animated Api对应的视图需要加上Animated前缀，如Animated.View，Animated.ScrollView

```jsx
<Animated.View style={{top: topValue}}/>

//触发动画
topAni.start()
```

完整的代码

```jsx
const SpringView = () => {    
    const topValue = useRef(new Animated.Value(0)).current 
    
    useEffect(() => {
        Animated.spring(topValue, {
	    toValue: 300
        }).start()
    }, [])

    return (
        </View>
           <Animated.View style={[styles.block, {top: topValue}]}/>
        </View>
    )
}
```

将动画放在了useEffect中，当视图渲染完成后即刻开始执行动画，也可以绑定在事件上。

- spring动画还可以设置其他参数，比如speed可以控制速度参数，bounciness则用来控制弹性系数等。
- timing动画接受一个easing的函数，也就是控制缓入缓出，当插入贝塞尔曲线函数时可以实现物体的抛物线运动。
- decay动画提供一个初速度，跟衰减系数，模仿物理运动，初速越快，衰减系数越小，则运动越远。

## 组合动画

多个不同的动画可以串行执行，也可以并行执行

- 并行动画：使用Animated.parallel将需要并行的动画包裹在当中

```jsx
Animated.parallel([            
    Animated.timing(topAnim, {
        toValue: 400,
        useNativeDriver: false
    }),
    
    Animated.timing(sizeAnim, {
        toValue: {x: 200, y: 200},
        useNativeDriver: false
    })
]).start()        
```

{% image fancybox left clear group:IT animated6.gif 50% 50% "" %}
#
- 串行动画：使用Animated.sequence将需要串行的动画包裹在当中

```jsx
Animated.sequence([            
    Animated.timing(yAnim, {
        toValue: 400,
        useNativeDriver: false
    }),
    
    Animated.timing(sizeAnim, {
        toValue: {x: 200, y: 200},
        useNativeDriver: false
    })
]).start()
```

{% image fancybox left clear group:IT animated7.gif 50% 50% "" %}

## 插值

插值函数能将动画的输入跟输出值重新映射，生成一个新的动画。

假设这样一个场景，方块从顶部掉落的同时，让方块的透明值从1降到0.5的半透明状态，这既可以通过上述的并行动画来实现，也可以通过插值动画去映射。

方块的top值变动范围是[0, 300]，opacity的变动范围则是[1, 0.5]

在第一个方块下落的例子中加入插值动画映射

```jsx
const SpringView = () => {    
    const topValue = useRef(new Animated.Value(0)).current 
    
    useEffect(() => {
        Animated.spring(topValue, {
			    toValue: 300
				}).start()
    }, [])

    return (
        </View>
           <Animated.View style={[styles.block, {top: topValue},
           {
		           {/* 使用插值映射透明度动画 */}
	             opacity: topValue.interpolate({
                  inputRange: [0, 300],
                  outputRange: [1, 0.5]
               })
           }
           ]}/>
        </View>
    )
}
```

{% image fancybox left clear group:IT animated0.gif 50% 50% "" %}

插值的动画既能映射number值，也可以映射string值，这可以用于旋转动画

```jsx
value.interpolate({
  inputRange: [0, 360],
  outputRange: ['0deg', '360deg'],
});
```

插值强大的地方在于它可以分段映射，比如下面表达式分了4段映射

```jsx
value.interpolate({
  inputRange: [-300, -100, 0, 100, 101],
  outputRange: [300, 0, 1, 0, 0],
});
```

```jsx
Input | Output
------|-------
  -400|    450
  -300|    300
  -200|    150
  -100|      0
   -50|    0.5
     0|      1
    50|    0.5
   100|      0
   101|      0
   200|      0
```

## 滑动和拖动事件

滑动指的是ScrollView的滑动事件可以跟动画事件绑定，onScroll是ScrollView的滑动回调，可以使用Animated.event直接将contentOffset绑定在动画值上

```jsx
const scrollX = useRef(new Animated.Value(0)).current

<ScrollView
 onScroll={Animated.event(
   // scrollX = e.nativeEvent.contentOffset.x
   [{nativeEvent: {
        contentOffset: {
          x: scrollX
        }
      }
    }]
 )}
 />
```

将scrollX绑定在top值上就可以实现滑动ScrollView控制方块下降

{% image fancybox left clear group:IT animated1.gif 50% 50% "" %}

拖动指的是panResponder事件，本质上也是用AnimateEvent绑定事件

代码如下：

```tsx
const PanEvenView: React.FC = () => {    
    const pan = useRef(new Animated.ValueXY()).current
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            //绑定拖动事件
            onPanResponderMove: Animated.event([null, {dx: pan.x, dy: pan.y}]),
            onPanResponderRelease: () => {
                Animated.spring(pan, {
                    toValue: {x: 0, y: 0},
                    useNativeDriver: true
                }).start()
            }            
        })
    ).current

    return (
        <View style={styles.container}>          
            <View style={styles.showZone}>
                <Animated.View style={[styles.block, {transform: [
                    {
                        translateX: pan.x                        
                    },
                    {
                        translateY: pan.y
                    }
                ]}]}
                {...panResponder.panHandlers}
                />
            </View>
        </View>
    )
}

```

创建PanResponder，将Animated.event绑定在move事件即可，这里在pan release事件里面做了一个归位的spring动画，拖动方块释放后会以弹簧动画回到初始位置，上面Animated.View绑定的是translateX跟translateY，可以用top跟left平替，唯一的不同是translateX跟translateY可以通过开启useNativeDriver打开原生动画系统

{% image fancybox left clear group:IT animated2.gif 50% 50% "" %}

## LayoutAnimation

还有一类动画不是通过Animated api去实现的，而是将Flexbox的布局自动补间成动画，这种动画不需要我们去计算终止值，能简化动画的实现，唯一的缺点是它的定制化属性较少。

App中经常有这样的场景，一篇文章太长，底部有一个查看更多的按钮，点击完后，容纳文章的视图将拉长，使得文章得以全部展示。

```tsx
<View style={[styles.bubble, {height}]}>
    <Text style={styles.buttonText}>{
        "dfsdf\ndfsd\ndfsdf\ndfsdfdfsdf\ndfsdfdfsdf\ndfsdfdfsdf\ndfsdfdfsdf\ndfsdf"
    }</Text>
</View>
```

RN中并不需要计算容器的高度去实现这件，而是通过将height从一个固定的number值，改成’auto’即可实现展开查看更多。

{% image fancybox left clear group:IT animated3.gif 50% 50% "" %}

上面调用了`setHeight(30)` 收起弹窗，`setHeight('auto')`展开更多

而要将改动作改为动画，使用LayoutAnimation是最合适的

首先全局位置开启LayoutAnimation总开关

```jsx
UIManager.setLayoutAnimationEnabledExperimental(true);
```

在布局动画的动作前调用LayoutAnimation的api

```jsx
LayoutAnimation.easeInEaseOut();

//也可以是其他类型的动画，比如弹性动画
LayoutAnimation.spring();
```

完整代码

```tsx
import { LayoutAnimation, NativeModules } from "react-native";

//开启LayoutAnimation总开关
const {UIManager} = NativeModules
UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

interface AnimateFuncProps {
    name: string,
    func: () => void
}

const LayoutAnimationView: React.FC = () => {
    const [height, setHeight] = useState<number|'auto'>(30)

    const datas: AnimateFuncProps[] = [
        {
            name: 'reset',
            func: () => {
			          //使用缓入缓出的动画效果
                LayoutAnimation.easeInEaseOut();
                setHeight(30)
            }
        },
        {
            name: 'start',
            func: () => {
	            	//使用缓入缓出的动画效果
                LayoutAnimation.easeInEaseOut();
                setHeight('auto')
            }
        },    
    ]

    return (
        <View style={styles.container}>
            <View style={styles.selector}>
                {
                    datas.map((data) => {
                        let backgroundColor = 'green'
                        if (data.name == 'reset') {
                            backgroundColor = 'orange'
                        }
                        return (
                            <TouchableWithoutFeedback onPress={() => {
                                data.func()
                            }}>
                                <View style={[styles.button, {backgroundColor}]}>
                                    <Text style={styles.buttonText}>{data.name}</Text>
                                </View>
                            </TouchableWithoutFeedback>
                        )
                    })
                }
            </View>            
            <View style={styles.showZone}>
                <View style={[styles.bubble, {height}]}>
                    <Text style={styles.buttonText}>{
                        "dfsdf\ndfsd\ndfsdf\ndfsdfdfsdf\ndfsdfdfsdf\ndfsdfdfsdf\ndfsdfdfsdf\ndfsdf"
                    }</Text>
                </View>
            </View>
        </View>
    )
}
```

{% image fancybox left clear group:IT animated4.gif 50% 50% "" %}
