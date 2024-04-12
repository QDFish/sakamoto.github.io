---
title: useEffect中的生命周期的实现
date: 2024-04-12 09:59:44
categories:
- React Native
tags:
- 生命周期
- 函数组件
---

## 类组件

类组件中定义了几组常用的生命周期的hook，分别为这几个函数打log来查看它们的调用时机

```jsx
class ClassComponent extends React.Component {

    componentDidMount(): void {
        console.log('class component did mount')
    }

    componentWillUnmount(): void {
        console.log('class component will unmount')
    }

    componentDidUpdate(prevProps: Readonly<ModelProps>, prevState: Readonly<{}>, snapshot?: any): void {
        console.log('class component did update')
    }    
  
    render(): React.ReactNode {
        console.log('class component render')
        return (
            <View style={styles.container}>
                <Text style={styles.title}>{`Class Component` }</Text>
            </View>
        )
    }
}
```

<!-- more -->

当首次渲染ClassComponent时的log

```jsx
 LOG  father render
 LOG  class component render
 LOG  class component did mount
```
可以看到父组件渲染后，class component开始渲染，渲染完成后直接调用did mount，表示视图挂载成功，这时候是不调用did update

重新刷新父组件，带动ClassComponent的重渲染，此时的log

```jsx
 LOG  father render
 LOG  class component render
 LOG  class component did update
```

did mount 变成了did update，说明组件重新渲染并不代表组件卸载，而只是对组件的布局进行重计算然后调整UI树

只有在渲染中把ClassComponent剔除掉，才会触发will unmount

## 函数组件生命周期的实现方式

useEffect是函数式组件的副函数，能在函数式组件渲染完成后根据依赖参数选择是否被调用，而useRef在函数组件被挂载且未卸载的生命周期中持有值而不会被渲染重置，两者相结合就能实现ClassComponent对应的生命周期

useEffect接收两个参数，第一个为回调函数，第二个为依赖的参数，类型为可选数组，也就是可以没有依赖参数

```jsx
 useEffect(setup, dependencies?)
```

而dependencies传入空数组或者不传参数是有差别的：

- 当不传参数，则每次重新渲染结束后都会调用setup回调函数。

- 当传空数组时，则只有第一次加载的时候才会调用setup回调函数。

useEffect的setup回调函数还接受一个cleanup 函数作为返回值，它的调用时机是发生在每次调用useEffect的setup前，先调用先前设置的cleanup函数。

完整代码

```jsx

const FuncComponent: FC = () => {
		//因为第一次渲染不调用did update，所以使用一个ref持有是否是第一次渲染的状态
    const isFirstAppear = useRef<boolean>(true)
    
		//使用带空数组依赖的useEffect作为mount跟unmount的hook
    useEffect(() => {
        console.log('function component did mount')

				//cleanup函数作为unmount的hook
        return () => {
            console.log('function component will unmount')
        }
    }, [])

		//使用不带依赖的useEffect作为 did update的hook
    useEffect(() => {
        if (isFirstAppear.current) {
            isFirstAppear.current = false
        } else {
            console.log('function component did update')        
        }       
    })

    console.log('function component render')

    return (        
        <View style={styles.container}>
            <Text style={styles.title}>{`function Component` }</Text>
        </View>        
    )
}
```

第一次渲染的时候包含了视图挂载的hook，但是不包含did update，而带空数组的useEffect的调用跟渲染无关，只跟视图挂载跟卸载有关，所以在setup中hook mount，而在cleanup中hook unmount

接下去的渲染都只调用did update，但是不带依赖的useEffect同样在第一次渲染的时候也会调用，

所以使用一个ref去判断是否是第一次渲染，如果是则不调用，但是将该ref置为false，则下次渲染的时候就会调用did update。
