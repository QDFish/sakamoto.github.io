---
title: 解决RN0.63版本安卓无法单步调试
date: 2024-02-26 16:12:52
categories:
- React Native
tags:
- 调试
---

在根目录下创建hack.js文件，内容如下

```javascript
const fs = require('fs');
const { resolve } = require('path');
const nmPath = resolve(__dirname, './node_modules');
//支持安卓单步调试
console.log('[hack] support debug for android')
path = resolve(nmPath, './react-native/Libraries/BatchedBridge/MessageQueue.js')
content = fs.readFileSync(path, { encoding: 'utf-8'})
replace = `callNativeSyncHook(
    moduleID: number,
    methodID: number,
    params: any[],
    onFail: ?Function,
    onSucc: ?Function,
  ): any {
    const isDebuggingEnabled = (typeof atob !== 'undefined');
    this.processCallbacks(moduleID, methodID, params, onFail, onSucc);
    if(!isDebuggingEnabled)
    {
        if (typeof global.nativeCallSyncHook == 'function') {
            return global.nativeCallSyncHook(moduleID, methodID, params);
        }         
        return '';                      
    }
  }
`
fs.writeFileSync(path, content.replace(/callNativeSyncHook.+\n(.+\n)*/gm, replace))
```

其实是修改node_modules中导致crash的callNativeSyncHook方法，由于node_module是gitignore的 一部分，建议将`node hack.js`加入package.json的script中，作为build命令的一部分
