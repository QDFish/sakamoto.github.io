---
title: 使用TS泛型获取某个类型所有属性的可访问路径
date: 2024-08-14 15:45:33
categories:
- React Native
tags:
- Generics
---

<!-- toc -->

本文的理解需要对TS泛型的基础运用有一定了解，可参考{% post_link rn/ts_generics %}

以该对象为例

```tsx
const person = {
	name: 'tony',
	age: 31,
	father: {
		name: 'jack',
		age: 55
	},
	assets: [
		'house',
		{
			name: 'money',
			num: 100000
		}
	]
};
```

person对象有多种形式的变量

1. 具有纯量变量，name，age，
2. 还有对象变量比如father，
3. 数组变量，assets

<!-- more -->

定义getProperties方法，传入对象和路径，可以访问到对应的值，

```tsx
const getProperties = (obj: any, path: string) => {
	const keys = path.split('.') as Array<keyof any>;
	return keys.reduce((acc, key) => {
		if (acc && typeof acc === 'object') {
			return acc[key];
		}
		return undefined;
	}, obj as any);
};
```

比如：

- 当path为 `‘name’`时，getProperties返回`‘tony'`
- 当path为`‘father.name’`时，getProperties返回`‘jack'`
- 当path为`‘assets.0’`时，getProperties返回`‘house'`
- 当path为`‘assets.1.name’`时，getProperties返回`‘money'`

首先需要通过`typeof` 关键字把值变量转为类型

```tsx
type Person = typeof person

// type Person = {
//   name: string;
//   age: number;
//   father: {
//       name: string;
//       age: number;
//   };
//   assets: (string | {
//       name: string;
//       num: number;
//   })[];
// }
```

如果对象中不含有数组类型属性，到这一步就结束了，但是如果有数组属性，则情况就比较特殊。

要访问数组的元素，就则必须知道该元素的索引，而将数组变量转化为类型后，索引标识就消失了，只剩下数组元素的类型。

这时候需要通过`as const` 关键字，先将对象转化为不可变类型，而数组的不可变类型会转成成元组，而元组的类型就会带上索引信息

```tsx
const person = {
	name: 'tony',
	age: 31,
	father: {
		name: 'jack',
		age: 55
	},
	assets: [
		'house',
		{
			name: 'money',
			num: 100000
		}
	]
}  as const;

type Person = typeof person
// type Person = {
//   readonly name: "tony";
//   readonly age: 31;
//   readonly father: {
//       readonly name: "jack";
//       readonly age: 55;
//   };
//   readonly assets: readonly ["house", {
//       readonly name: "money";
//       readonly num: 100000;
//   }];
// }
```

### 键路径的实现

首先获取所有Person所有的属性名，使用`keyof`关键字

```tsx
type KeyPath<P> = keyof P
```

{% image fancybox left clear group:IT ts_generic.png "ts_generic" %}

可以看到成功获取了所有最外层的的属性名 ，而如果要往内获取属性名，则需要将属性值也传入KeyPath中，很容易联想到递归的解决方案。

而要获取属性值，则需要用到`映射类型`

```tsx
[K in keyof P]: K
```

对于不同类型的`P` ，对应`K`有不同的表现

- 无论是object，数组，元组，它的K都属于string范畴， 因此可以使用`K extends string`来判断
- object，数组，元组通用`P extends object` 判断语句，它们都属于`object`类型
- 对于纯量，string，number之类的，`K extends never` ，它们本身没有属性值

于是得到第一个版本

```tsx
//将三元符号? : 格式化可以得到一个类似于If else的形式，? 代表if，: 代表else
type KeyPath<P> = {
	[K in keyof P]: 
	//P: object | array
	K extends string ?
		K
	:
		never
}[keyof P]
```

结尾的`[keyof P]` 使用了**`索引获取类型（Indexed Access Types）`** 表示获取的类型是映射类型的value部分类型。

这个版本的结果还是只获取到了最外层的属性名，但是通过`K extends string` 把P为纯量类型的部分排除掉。

接下来需要判断值类型，

- 当值类型为纯量时，直接返回K，
- 当值为objec对象时，返回`K | '${K}.${KeyPath<P[K]>}'`  ，属性名本身 + . + 递归值部分

```tsx
type KeyPath<P> = {
    [K in keyof P]:
    //P: object | array
    K extends string ?
    	P[K] extends object ?
    	    K | `${K}.${KeyPath<P[K]>}`
    	:
    	    K
    :
    	never
}[keyof P]
```

理论上，这已经完成了我们的需求，然而结果是类型解析错误

```tsx
const path: KeyPath<Person> = '' //类型解析错误
```

当我们把assets，也就是数组部分注释掉

```tsx
const person = {
	name: 'tony',
	age: 31,
	father: {
		name: 'jack',
		age: 55
	},
	// assets: [
	// 	'house',
	// 	{
	// 		name: 'money',
	// 		num: 100000
	// 	}
	// ]
}  as const;

```

{% image fancybox left clear group:IT ts_generic1.png "ts_generic" %}

发现可以解析到内层数据，也许你会觉得是`P[K] extends object` 没有覆盖到数组的情形，然而整个类型体现的是解析错误，而不是遗漏数组部分数据。

让我们将assets的部分单拎出来一个变量

```tsx
const assets = [
	'house',
	{
		name: 'money',
		num: 100000
	}
] as const;

type Assets = typeof assets

// type Assets = readonly ["house", {
//     readonly name: "money";
//     readonly num: 100000;
// }]
```

{% image fancybox left clear group:IT ts_generic2.png "ts_generic" %}

可以看到解析是成功且正确的，说明`P[K] extends object` 分支处理是正确的。问题`KeyPath<P[K]>` 处于字符串模板中时出现了解析错误。

### 错误原因

来看下Assets的属性列表就能获得一些蛛丝马迹

{% image fancybox left clear group:IT ts_generic3.png "ts_generic" %}

元组中不只包含索引值，0，1，还包含诸多函数属性，比如at，forEach等等，当函数的值类型放在字符串模板解析中就会发生解析错误。

所以比较直接的想法就是再追加一层判断，即只有当K为number类型的字符串时，才允许解析，刚好TS泛型也支持这样的判断，`K extends '${number}'` 表示只有K为数字字符串范畴。

然而，即使做了K的过滤，解析仍然是错误的，这是因为类型的解析只会判断分支的走向，而不是具体的执行结果，只要P[K]是元组类型，就会以整个类型进行编译器的判断。有种虽然结果是对的，但是我不承认你的意思在里面。

### 阉割版本

但是泛型判断还是会根据分支走向去推演的，所以只要让元组类型不走入字符串模板解析即可，因此我们得到一个阉割的版本

```tsx
type KeyPath<P> = {
    [K in keyof P]: 
    //P: object | array
    K extends string ?
        //P[K]: array		
        P[K] extends readonly any[] ?
            K
        :
        //P[K]: object  
        P[K] extends object ?
        	K | `${K}.${KeyPath<P[K]>}`
        :
        	K
        :
    	never
}[keyof P]
```

使用`P[K] extends readonly any[]` 截断元组类型的分支，只返回属性名，使其不进入字符串模板解析

{% image fancybox left clear group:IT ts_generic4.png "ts_generic" %}

可以看到，解析错误被纠正，数组虽然没解析到内层，但是属性名已经解析出来。

但是当你想就着这个模板，对元祖分支进行再处理时，就会发现无论怎样去判断，都绕不开使用字符串模板的结局，最终只能是解析错误。

### 正确版本

换种思路想，既然`KeyPath<P[K]>` 只要不放在字符串模板中就能正确推演，而使用字符串模板无非就是为了递归`.` 调用，我们将`${K}.` 也作为泛型的一部分然后作为一整个KeyPath解析就能解决这个问题。

```tsx
`${K}.${KeyPath<P[K]>}` => KeyPath<P[K], K>
```

这就需要为KeyPath新增另外一个泛型，将上面的阉割版进行改写

```tsx
type KeyPath<P, I=null> = {
    [K in keyof P]: 
    //P: object | array
    K extends string ?
        P[K] extends object ?
            I extends string ?
                `${I}.${K}` | KeyPath<P[K], `${I}.${K}`>  
            :
                `${K}` | KeyPath<P[K], K>  
        :
            I extends string ?
                `${I}.${K}`
            :
                K
    :   
        I extends string ?
            I
        :
            never
}[keyof P]
```

- 新增`I` 泛型为P的属性名，不传时为默认值null，对应的首次传入类型的情形。
- 由于不使用字符串模板解析递归，所以`readonly any[]` 判断可以去掉，统一用`extends object`
- 在每个判断分支中对`I`是否有值进行判断
    - 有则进行`I`追加
        - 纯量使用 ``${I}.${K}`` 直接返回
        - 对象值使用 ``${I}.${K}`` 传入新的`I`泛型
    - 无值不追加`I`

最后还有一个细节需要处理，取自官方的一个例子

```tsx
type Mapish = { [k: string]: boolean };
type M = keyof Mapish;

//type M = string | number
```

在映射类型key为string的情况下，调用keyof出来的key仍然是解析成`string | number`的联合类型，官方的解释在上面也有提过，任何对象的key值总是强转成string，所以key值是可以为number类型，`obj[0] 总是恒等于 obj[”0”]` ，但是我们并不需要这样number类型，作为getProperties的path参数类型，总是为string。最终改写

```tsx
type _KeyPath<P, I=null> = {
    [K in keyof P]: 
    //P: object | array
    K extends string ?
        P[K] extends object ?
            I extends string ?
                `${I}.${K}` | _KeyPath<P[K], `${I}.${K}`>  
            :
                `${K}` | _KeyPath<P[K], K>  
        :
            I extends string ?
                `${I}.${K}`
            :
                K
    :   
        I extends string ?
            I
        :
            never
}[keyof P]

type KeyPath<P, I=null> = _KeyPath<P, I> & string
```

{% image fancybox left clear group:IT ts_generic5.png "ts_generic" %}
