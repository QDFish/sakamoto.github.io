---
title: 浅显易懂rebase
date: 2024-02-19 10:53:59
categories:
- Other
tags:
- Git
---

> rebase其实就是一种分支级别的遴选
> 
<!-- more -->
## 从一个常见情景开始

如图所示
{% image fancybox left clear group:IT rebase1.svg %}

每个灰色的节点都为一个独立的commit

绿色表示本地分支的引用，红色表示远程分支的引用

首先，一般来说，git希望你只在本地分支做rebase操作，因为rebase本质上会改变分支的提交记录，但这里的关键并非远程跟本地的问题，而是该分支是否是一个协同分支的问题，如果分支本身为某一个单一作者所有并且不会有其他成员参与，你完全可以用rebase来进行操作，毕竟谁也不想写的本地代码因为电脑故障而丢失，所以提交完后顺便推送到远程是常见的操作

假设HEAD提交了一个空白文件info.txt

A表示在info.txt追加A字符并换行

B表示在info.txt追加B字符并换行

C，D同理

master的HEAD指向B，info.txt包含的内容就是

```bash
A
B
```

f1的HEAD指向D，info.txt包含的内容就是

```bash
C
D
```

假设f1想要更新下master的代码

如果不考虑rebase的方式，它有二种方式去实现

1. 直接merge master的代码，这种是最直接的方式，但是坏处在于会产生一个合并的节点，提交记录非线性，不直接
2. 使用cherry pick, 去cherry pick A，B，这样能保持提交记录的线性，但是一两个节点还好说，节点多的话，一个个cherry pick 容易出现疏漏，并且如果按照表述逻辑，应该是C，D处于，A，B节点的后面，这样也方便后续开发E，F的时候，可以连贯起来不会出现C，D，A，B，E，F，后续也不好跟踪自己的模块代码提交记录

正确的方式应该是

1. `git checkout -b temp origin/master` 从master checkout出一个临时分支
2. `git cherry-pick C`
    
    {% image fancybox left clear group:IT rebase2.png %}
    
3. 解冲突 continue
4. `git cherry pick D`
    
    {% image fancybox left clear group:IT rebase3.png %}
    
5. 这里因为保留了C的更改，所以没有冲突
6. `git push -f origin temp:f1` 强制将临时分支推送到f1

此时你的f1分支的远程提交记录就是A-B-C-D

如果你要同步到本地 f1，此时还需要强制拉取远端代码，因为远程提交记录被强制修改，与本地的提交记录产生分支

1. `git chekcout f1`
2. `git reset --hard origin/f1`

而以上的所有步骤其实只要一个命令就可以解决

`git rebase master`

## 需要注意的问题

常常发生在本地分支已经上传到本地的情景

在不了解rebase原理以及一直都是merge使用者会出现的问题就是在rebase完成后，

看到终端提示pull的时候，直接pull，相当于rebase origin 远端的代码解冲突

正确的做法就是rebase完成后，做一次远程的强制push

`git push origin --force`

同步本地跟远端的代码
