---
title: JS中的this指针在普通函数跟箭头函数中的表现
date: 2024-02-18 10:42:03
categories:
- React Native
tags:
- Javascript
---
## 前言

> JS中this指针的表现指的是this指针所引用的对象，在不同的上下文环境以及不同类型的函数中会有不同的表现，有些甚至是不可预测的，本文的目的是介绍this指针在众多变量中的确切规律表现，从而让我们更能掌控RN项目中的JS代码
> 

<!-- more -->

ps：本文所有的JS代码运行在nodel.js环境中

## this指针会指向哪些对象

{% image fancybox left clear group:IT Untitled.png "js-this" %}
<!-- ![Untitled](Untitled.png) -->

上图是本文的整体流程，所有的绿色标签就是this指针可能会指向的对象集合，这些对象包括

- 全局对象
- global对象
- 实例对象
- undefine

本文会通过例子去展示this指针的表现，这里需要注意的是全局对象跟global对象的区别，在node中，JS拥有一个global对象：

```jsx
<ref *1> Object [global] {
  global: [Circular *1],
  clearInterval: [Function: clearInterval],
  clearTimeout: [Function: clearTimeout],
  setInterval: [Function: setInterval],
  setTimeout: [Function: setTimeout] {
    [Symbol(nodejs.util.promisify.custom)]: [Getter]
  },
  queueMicrotask: [Function: queueMicrotask],
  clearImmediate: [Function: clearImmediate],
  setImmediate: [Function: setImmediate] {
    [Symbol(nodejs.util.promisify.custom)]: [Getter]
  }
}
```

里面包含了一些平常我们做RN常见的函数，比如setTimeout，setImmediate

这也解释了为啥我们可以不引用模块而可以直接调用setTImeout去做延迟任务，说明在JS中，调用一个未声明的属性或者函数，会去global对象里面寻找相同名字的属性或者函数。

全局对象则是全局上下文this指针指向的对象，它是一个空对象`{}` 。

## **什么是执行上下文**

> 执行上下文是评估和执行 JavaScript 代码的环境的抽象概念。每当 Javascript 代码在运行的时候，它都是在执行上下文中运行。
> 
- **全局执行上下文**
    - 这是默认或者说基础的上下文
    - 任何不在函数内部的代码都在全局上下文中，
    - 一个程序中只会有**`一个全局执行上下文`**。
- **函数执行上下文**
    - 每当一个函数被调用时，都会为该函数创建一个新的上下文。
    - 每个函数都有它自己的执行上下文，也就是`会**存在多个上下文**`

当执行一个js脚本的时候会把全局上下文压入执行栈中后开始执行，遇到函数则会创建函数的上下文并压入栈顶，执行结束后弹出函数上下文，继续执行之前的上下文。

这边只是简单描述下上下文，详情可以参考[这篇文章](https://juejin.cn/post/6844903682283143181)。

而this指针在不同的上下文中会有不同的表现。

## 全局上下文

在全局上下文中，this指向一个空对象`{}`

```jsx
console.log(this)//{}
this.a = 1
this.b = 2
console.log(this)//{ a: 1, b: 2  }
```

## 函数上下文

> 函数中的this指针表现需要区分`带箭头的箭头函数`跟`不带箭头的标准函数函数`两种类型，不同类型表现不同
> 

### 标准函数

由于this指针在标准函数中是根据调用方式来决定，所以先简要介绍三种调用方式

- 作为普通函数调用
    - 直接调用，没有调用者，例如 ：`a()`
    - 既包括在全局定义函数，然后直接调用，也包括用一个变量存储任意来源的函数指针，然后调用
- 作为构造函数调用
    - 构造函数指的是 `new A()`形式的调用，其中A为函数名，该函数会返回类型为函数名的对象
- 作为成员函数被调用
    - 即拥有一个调用者，例如： `instance.c()`

每一种调用方式this在函数上下文的指向都有所不同，但是作为标准函数规律有迹可循，记住主要原则：

`谁调用，就指向谁`

**作为普通函数调用**

作为普通函数调用时，由于没有调用者，根据谁调用就指向谁的原则，在`严格模式下this的引用为undefine`，这很好理解。

而在正常模式下this的引用为global对象，这该怎么理解？

首先需要简要介绍下严格模式：

> JS在ES5标准中添加了严格模式，其目的是为了消除JS语法中不合理，不严谨的地方，减少一些无法预测的行为，以及确保代码的安全，比如众所周知的浏览器注入JS。
> 

回到正题，在正常模式下，JS允许对一个未声明的变量进行赋值

```jsx
console.log(global) //{global: global, ...}
a = 2
console.log(global) //{global: global, ... a: 2}
```

可以看到`a = 2`的结果相当于 `global.a = 2`

对未声明的变量赋值被global对象给收纳了，成为了global的一个属性，这是正常模式下JS的兜底，所以我们也可以理解，因为普通函数没有调用者，所以global成为了这个兜底的对象，`所以在正常模式下作为普通函数时，this指针指向了global`

而严格模式下消除了这种不安全的行为，因为虽然兜底保证程序不会异常退出，但是会使得调错变量的行为被掩盖，使得程序运行的结果无法被预测，对于生产来说，同样是灾难性的

ps：上面的代码在严格模式下会抛出  `a is not defined`的异常错误

**作为成员函数调用**

根据标准函数中谁调用this指针就指向谁的原则，`this指针在拥有调用者的情况下就指向该调用者`

```jsx
obj = {
    c() {
        console.log(this)
    },

    d() {
      let f = function() {
        console.log(this)
      }  
      f()
    }
}

console.log("成员函数调用")
obj.c() // {c: ƒ, d: ƒ}

console.log("普通函数调用")
nocallerC = obj.c
nocallerC() // global {global: global, clearInterval: ƒ, clearTimeout ...

console.log("普通函数调用")
obj.d() // global {global: global, clearInterval: ƒ, clearTimeout ...
```

- `obj.c()` 很好理解，obj调用，所以函数中的this指针指向obj
- `nocallerC()` 同样很好理解，没有调用者，所以正常模式下返回global对象
- `obj.d()` 为啥返回的却是一个globa对象呢？它不是obj调用的吗？
    - 这是因为执行打印this指针命令的上下文是f函数，而 d函数的最终执行`f()` 是一个标准函数，并且它没有调用者，所以是作为一个普通函数被调用的，因此在f函数中的this指针并不是d函数上下文中的this指针。

**作为构造函数调用**

直接下结论：`this指针会指向构造出来的实例对象`，直接看例子

```jsx
function A(a, b) {
	this.a = a
	this.b = b
	console.log(this)
}

let b = new A(1, 2) // A { a: 1, b: 2}
console.log(b) // A { a: 1, b: 2}
```

要理解这里this的指向需要明白new关键字的执行过程：

- 在构造函数代码开始执行前，创建一个空的对象
- 把this指向刚刚创建出来的空对象
- 执行函数的代码
- 返回this指针

所以，以上

this指针在构造函数上下文中的这种指向的意义在于为JS语言提供一个定义class的途径，在JS class关键字出来之前，我们可以通过这种方式去实现其他高级语言class的功能。

### 箭头函数

> this指针的表现在箭头函数中并不区分调用方式，因为在箭头函数中，this指针的指向不取决于调用者，而是取决于`定义箭头函数的上下文环境`
> 

区别于标准函数`谁调用，就指向谁` 的原则

我们也为箭头函数定义一个原则`谁定义，就指向谁` ，这里的谁指的是上下文环境的this指向，例如，在全局上下文下是空对象，this就指向空对象，在标准函数上下文则要考虑调用方式，考虑是否在严格模式下。

至此，我们可以发现两种函数不同的运用条件

- 标准函数的调用偏动态
    - 取决于调用者，this的指向在调用的那一刻`才决定`
- 箭头函数的调用偏静态
    - 取决于定义的上下文，this的指向在定义的那一刻`已经决定`，

直接甩例子

```jsx
let a = () => {
  console.log(this)
}

let b = function() {
  let c = () => {
    console.log(this)
  }
  c()
}

let obj = {
  x: () => {
    console.log(this)
  },
  y: function() {
    let z = () => {
      console.log(this)
    }
    return z
  }
}

a()// {}
b()// global {global: global, clearInterval: ƒ, ...}

obj.x()// {}
obj.y()() //{x: ƒ, y: ƒ}

let nocallerY = obj.y() 
nocallerY() //{x: ƒ, y: ƒ}

emptyCallerY = obj.y.call(global)  
emptyCallerY() //global {global: global, clearInterval: ƒ, ...}
```

- `a()`:箭头函数a定义在全局上下文，根据上文我们知道全局上下文的指针指向一个空对象`{}`
- `b()`:箭头函数c定义在标准函数b的上下文中，在正常模式下，标准函数的this指针指向global，所以c指向global（严格模式下指向undefine
- `obj.x()`: 成员函数x是箭头函数，这里要区分class的定义，和实例定义，直接用大括号用字典的方式定义一个实例时，大括号里面的上下文环境为全局上下文，所以这里this指向空对象
- `obj.y()()`: 成员函数y是标准函数，this指向取决于调用者，即为obj，所以定义在y函数内的箭头函数z的this指向为obj
- `nocallerY()`:   这个例子能加深对箭头函数调用偏静态的理解
    - 如果按照nocallerY是取自标准函数y的指针而作为普通调用，那么此时的this指针指向应该是global，那么这里箭头函数打印的就是global
    - 而实际上，这里打印的对象还是obj，这是因为箭头函数中this指针的指向是定义时决定而不是调用时，所以决定this指向的语句应该是`let nocallerY = obj.y()`  ，这个语句返回了箭头函数z的指针，也就是触发了箭头函数的定义，这时候的上下文是obj调用的标准函数y，所以this指向为obj
- `emptyCallerY()`: 根据上面的例子，只要在定义箭头函数之前改变上下文环境中this的指向就可以改变箭头函数this的指向
    - call函数能更改标准函数this的指向，`obj.y.call(global)` 将原本指向obj的this 重新定向到了global，并且返回了箭头函数z的指针，触发了z的定义
    - 此时再调用箭头函数，打印的就是global对象

## RN中this指针的表现

> RN项目由JS代码管理，所以上述的表现在RN中都成立。但是又由于RN项目中大量使用JSX，所以需要注意事件传递时this指针的变化
> 

### 关于RN的前提事要

RN的项目代码是包裹在一个标准函数中执行的，打开bundle文件可以看到：

```jsx
(function (global) {
  ...
	AppRegistry.registerComponent(appName, () => App);
})(...);
```

所以在RN的项目中，this指针不存在出现指向空对象的可能。

接着，RN项目可以通过babel去统一管理模块是否使用严格模式，一旦开启严格模式，会在对应模块上方加上use strict，这样模块中的代码都在严格模式下运行

```jsx
(function (global) {
	"use strict"
  ...
})(...);
```

下文的所有例子默认在严格模式下运行，所以：

- 标准函数作为普通函数调用this指针指向undefine
- 箭头函数的定义因为被标准函数包裹作为普通函数调用，this指针指向的也是undefine

如此以来可以方便我们对this指针在RN项目中的讨论

### 使用箭头函数还是标准函数？

RN中构建组件的方式有函数式组件和class组件两种：

```jsx
//函数式组件
const ReviewGoodInfoView: React.FC<IllustrateInfo> = (props: IllustrateInfo) => {
	return <View>
						....
				</View>
}

//class组件
class BasePage extends Component {
		render() {
        return (
            <View>
				       ...
            </View>
        );
    }
}
```

函数式组件通过函数的普通调用直接返回组件进行渲染，从上面可以得知，无论你是用箭头函数还是标准函数去声明，this指针都是没有意义的（指向undefine），他跟组件之间并不存在关联，这在一定程度上反映了函数式组件的优势，不需要考虑this指针丢失的情况，只要在函数体内定义的函数，互相都可以调到，然而class情况就复杂得多。

在深入这个问题之前，有必要简单介绍下class，这有利于简化问题。

前面有提到通过构造函数去声明一个对象的属性跟方法，从而用来生成实例，而class指针就是用来正式做这个事的关键字，他与直接用函数来声明有两点区别：

- class关键字只能用new去调用；构造函数不只可以new调用，也可以普通调用
    - 只能通过new调用保证了`外部调用class的方法或者属性时，this指针只会指向实例本身` ，可以认为外部调用class是安全的
- class关键字默认开启严格模式，而构造函数默认为正常模式
    - 严格模式更安全

因为class外部调用的安全，所以关于函数方式的选择，可以只讨论class内部的调用

下文将通过RN项目中一个经典的情景去理解这个问题

**模块中的组件事件调用模块自身的方法**

{% image fancybox left clear group:IT Untitled1.png "js-this" %}

这实际就是一个跨模块通信的场景

模块A中的Button绑定一个点击事件，该点击事件调用自身的一个方法fetch，抓取后端数据，抓取后再调用自身的另外一个方法refresh刷新UI。

上图的蓝色方块表示是直接传入内部函数的指针，还是通过一个匿名函数做中转去调用fetch，这边采用直接传入内部函数指针的方式，因为多一个匿名函数并非关键，关键的是匿名函数的形式是标准还是箭头，而这一点可以通过直接更改fetch的函数形式去实现，所以为了简化，onPress直接传入fetch指针。

又因为只要fetch中this的指针是指向ModuleA，那么refresh是必然可以调用到，所以先忽略refresh的函数形式。

**首先是fetch为标准函数：**

```jsx
export class ModuleA extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return <View style={styles.container}>
            <Button title="press me" onPress={this.fetch}/>        
        </View>
    }

    fetch() {        
        console.log('loaded')
        this.refresh()
    }

    refresh() {
        console.log('refreshed')
    }
}
```

点击按钮，app抛出异常

{% image fancybox left clear group:IT Untitled2.png "js-this" %}

异常错误为refresh undefine，原因就是this指针丢失，指向undefine，原因就在于fetch是标准函数模式。从上文可以知道，标准函数是一种偏动态的函数方式，函数中的this指针是在调用的那一刻才决定的，并且谁调用就指向谁。标准函数作为指针直接传给其他模块后只能作为普通函数被调用，失去调用者后，this的指针指向undefine

**改fetch函数为箭头函数：**

```jsx
...
fetch = () => {        
		console.log('loaded')
	  this.refresh()
}

...
```

点击按钮，正常调用

{% image fancybox left clear group:IT Untitled3.png "js-this" %}

箭头函数是一种定义时就已经决定this指向的函数方式，它偏静态，以此来理解下调用过程

- 首先render函数返回具体的组件声明，是外部调用的第一入口，this指针指向ModuleA。
- 其次只要class的实例方法作为外部调用，其class作用域内的this指针指向ModuleA。
- render函数返回的Button组件中将onPress事件绑定在this.fetch指针上
- 此时的this指向ModuleA，所以this.fetch相当于外部获取fetch指针，该行为触发fetch的定义
- fetch为箭头函数，this指针指向定义的上下文，此时class的作用域上下文this指向ModuleA，所以fetch内的this指向ModuleA

**如果一定想用标准函数跨模块通信？**

```jsx
render() {
    return <View style={styles.container}>
        <Button title="press me" onPress={() => {this.fetch()}}/>        
     </View>
 }
```

可以看到onPress用箭头匿名函数的方式绑定，箭头函数内this会指向定义上下文，即ModuleA，这边并不是想要重复解释箭头的解决方案，使用匿名函数，并且在匿名函数用this调用fetch相当于往Button传入this指针，然后用this指针去调用fetch。

可以看到只要不传入函数的指针而是传入this指针就可以解决这个问题，然而换个思路说，这里变成箭头函数同样可以兼容这个问题。

我在刚接触RN的时候，遇到this指针undefine的时候，某位大师对我说过：“全部改成箭头函数就得了！“

**小结来说：**

- 用标准函数跨模块通信要传实例指针，不能传函数指针
- 用箭头函数夸模块通信则两者都行

## 后言

这是我的第一篇关于react native技术栈的文章，因为刚从纯native转RN一个月，可谓是爬坑之旅，最开始遇到的最不理解的地方就是this指针，本来只是想总结一下this的一些规律表现，结果越写涉及的内容越广，光是为了搞明白RN中严格模式的设置就查了很多资料，怎么设置都不生效，结果自己发现竟然跟metro的缓存有关，但是也变相加深了对RN项目的理解，这大概就是写文章的意义吧。
