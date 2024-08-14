---
title: TS泛型
date: 2024-08-14 10:02:58
categories:
- React Native
tags:
- Generics
---

<!-- toc -->

泛型是组件化的基础，它可以帮助设计可复用的函数或者类型，进而帮助设计可复用的组件。
<!-- more -->

### 函数泛型- 以一个官方的例子开始

```tsx
function identity<Type>(arg: Type): Type {
  return arg;
}
```

使用`<>`括号定义泛型Type，函数的类型和返回值均为泛型Type。

对于上诉的泛型函数，有两种调用方式

```tsx
1. identify<number>(1)
2. identify(1)
```

同样使用`<>`显示地指明Type的类型，这时候传入的参数只能是该类型，上述例子为number，

或者是通过传入参数类型来推断，这是因为Type类型刚好作为参数类型，所以只要参数是明确的类型，就可以推断Type而无需`<>`指明。

### 泛型也可以用于Class，Interface

```tsx

class GenericNumber<Type> {
	identity(arg: Type): Type {
		return arg;
	}
}

const g = new GenericNumber<number>()
g.identity(2) //只能使用number类型的参数
```

将Type置于类名后面即可，这里因为无法通过参数推断泛型类型，所以需要使用尖括号显示地指明。

Interface使用的方法是一样的，这里不赘述。

### 泛型的条件约束

还是上面的例子，声明Lengthwise接口，包含一个number类型的变量length， 然后使用`Type extends Lengthwise`  约束泛型传入的Type类型必须具有length属性的类型。

```tsx
interface Lengthwise {
	length: number;
}
  
function identity<Type extends Lengthwise>(arg: Type): number {
	return arg.length;
}

identity('2')
identity([1, 2])
identity(1) //invalid
```

因为string跟数组都具有length属性，是合法的，而number没有则会报编译错误。

### keyof 跟 typeof

keyof 操作一个type类型，返回该类型的所有key值，以字面联合的方式

```tsx
type Point = { x: number; y: number };
type P = keyof Point; // 'x' | 'y'
```

而typeof 操作一个值变量，返回该值的type类型

```tsx
const point = {
	x: 1,
	y: 2,
}
  
type Point = typeof point  //{ x: number; y: number };
```

### 索引获取类型（Indexed Access Types）

索引获取类型可以帮助我们使用类似于字典查询key的方式来获取属性的类型。

```tsx
type Person = { age: number; name: string; alive: boolean };
type Age = Person["age"]; // number
type I1 = Person["age" | "name"]; // number | string
```

### 条件类型

条件类型使用类似于三元条件运算符的方式进行分支判断。 

直接看一个TS内置的类型例子：

```tsx
type Exclude<T, U> = T extends U ? never : T;
```

`extends` 关键字跟上述的作用是一样的，判断T是否归属于U的范畴，是的话，就返回never，表示不属于任何类型，否则就返回T，作用就是联合类型T中排除U类型。

```tsx
type StringNumber = string | number
type OnlyString = Exclude<StringNumber, number> // string
```

### 映射类型

有时候你想定义某种类型，它是基于另外一种类型来确认的，而你又不想每个类型都定义一遍，就可以使用映射类型。

字典也可以通过映射类型来定义key值和value值

比如定义一个key值为string，value为number的字典

```tsx
type StringNumberDict = {
	[K in number]: number
}

const dict: StringNumberDict = {
	1: 1,
	2: 2,
	'1': 2 //invalid 
}
```

`[K in number]` 表示泛型K属于number类型的范畴，冒号右边的number表示value为number类型。

而它的最大用处是将K与value的类型关联起来，TS的内置类型大量的使用了映射类型。还是以一个TS内置类型为例子：

```tsx
type Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};
```

1. Key类型为K，它首先需要符合keyof T，这帮你在已经输入T类型的情况下，去限制K的输入。
2. `T[P]`是上面提到索引获取类型，P是K范畴内的值，所以它表示的就是T本身的属性类型，因此只有定义在K内的类型才会被选取，这就是Pick的功能

```tsx
interface Person {
	say: () => void
	see: () => void
}

type Blind = Pick<Person, 'say'> //只抓取了say的方法，所以是瞎子

//type Blind = {
//    say: () => void;
//}
```
