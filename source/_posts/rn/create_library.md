---
title: create-react-native-library搭建RN库
date: 2024-04-03 10:42:54
categories:
- React Native
tags:
- create-react-native-library
---

> 本文主要介绍如何通过`create-react-native-library`搭建RN库，以及介绍RN库一些配置文件的作用。
>

<!-- more -->
如果要手动创建一个RN库，这可能是一个令人无从下手的工作，不仅需要native和js层的配置，还需要目录结构正确才能正常安装，而上述的所有工作也可能因为版本的更迭而变化。还好社区有一个优秀的脚手架框架`create-react-native-library` 帮助我们通过交互的方式完成这件事


## 如何使用

只需要一句命令
`npx create-react-native-library@latest libray_name`

如果没有create-react-native-library，需要先安装 `npm install -g create-react-native-module`

之后就会开启交互式命令，根据提示填写即可，运行完成后就会在该目录下生成脚手架工程

{% image fancybox left clear group:IT create_library.gif 100% 100% "" %}
#

创建完后的目录结构
    ```python
    .
    ├── CODE_OF_CONDUCT.md
    ├── CONTRIBUTING.md
    ├── LICENSE
    ├── README.md
    ├── android
    │   ├── build.gradle
    │   ├── gradle.properties
    │   └── src
    │       └── main
    │           ├── AndroidManifest.xml
    │           ├── AndroidManifestNew.xml
    │           └── java
    │               └── com
    │                   └── awesomelibrary
    │                       ├── AwesomeLibraryPackage.java
    │                       └── AwesomeLibraryViewManager.java
    ├── babel.config.js
    ├── example
    │   ├── Gemfile
    │   ├── README.md
    │   ├── android
    │   │   ├── app
    │   │   │   ├── build.gradle
    │   │   │   ├── debug.keystore
    │   │   │   ├── proguard-rules.pro
    │   │   │   └── src
    │   │   │       ├── debug
    │   │   │       │   └── AndroidManifest.xml
    │   │   │       └── main
    │   │   │           ├── AndroidManifest.xml
    │   │   │           ├── java
    │   │   │           │   └── com
    │   │   │           │       └── awesomelibraryexample
    │   │   │           │           ├── MainActivity.kt
    │   │   │           │           └── MainApplication.kt
    │   │   │           └── res
    │   │   │               ├── drawable
    │   │   │               │   └── rn_edit_text_material.xml
    │   │   │               ├── mipmap-hdpi
    │   │   │               │   ├── ic_launcher.png
    │   │   │               │   └── ic_launcher_round.png
    │   │   │               ├── mipmap-mdpi
    │   │   │               │   ├── ic_launcher.png
    │   │   │               │   └── ic_launcher_round.png
    │   │   │               ├── mipmap-xhdpi
    │   │   │               │   ├── ic_launcher.png
    │   │   │               │   └── ic_launcher_round.png
    │   │   │               ├── mipmap-xxhdpi
    │   │   │               │   ├── ic_launcher.png
    │   │   │               │   └── ic_launcher_round.png
    │   │   │               ├── mipmap-xxxhdpi
    │   │   │               │   ├── ic_launcher.png
    │   │   │               │   └── ic_launcher_round.png
    │   │   │               └── values
    │   │   │                   ├── strings.xml
    │   │   │                   └── styles.xml
    │   │   ├── build.gradle
    │   │   ├── gradle
    │   │   │   └── wrapper
    │   │   │       ├── gradle-wrapper.jar
    │   │   │       └── gradle-wrapper.properties
    │   │   ├── gradle.properties
    │   │   ├── gradlew
    │   │   ├── gradlew.bat
    │   │   └── settings.gradle
    │   ├── app.json
    │   ├── babel.config.js
    │   ├── index.js
    │   ├── ios
    │   │   ├── AwesomeLibraryExample
    │   │   │   ├── AppDelegate.h
    │   │   │   ├── AppDelegate.mm
    │   │   │   ├── Images.xcassets
    │   │   │   │   ├── AppIcon.appiconset
    │   │   │   │   │   └── Contents.json
    │   │   │   │   └── Contents.json
    │   │   │   ├── Info.plist
    │   │   │   ├── LaunchScreen.storyboard
    │   │   │   └── main.m
    │   │   ├── AwesomeLibraryExample-Bridging-Header.h
    │   │   ├── AwesomeLibraryExample.xcodeproj
    │   │   │   ├── project.pbxproj
    │   │   │   └── xcshareddata
    │   │   │       └── xcschemes
    │   │   │           └── AwesomeLibraryExample.xcscheme
    │   │   ├── AwesomeLibraryExampleTests
    │   │   │   ├── AwesomeLibraryExampleTests.m
    │   │   │   └── Info.plist
    │   │   ├── File.swift
    │   │   └── Podfile
    │   ├── jest.config.js
    │   ├── metro.config.js
    │   ├── package.json
    │   ├── react-native.config.js
    │   └── src
    │       └── App.tsx
    ├── ios
    │   └── AwesomeLibraryViewManager.m
    ├── lefthook.yml
    ├── package.json
    ├── react-native-awesome-library.podspec
    ├── src
    │   ├── __tests__
    │   │   └── index.test.tsx
    │   └── index.tsx
    ├── tsconfig.build.json
    ├── tsconfig.json
    └── turbo.json
    ```
    

## 工程中的配置文件

- .editorconfig
    
    这个配置文件能让我们在编辑文本并保存时采用该配置自动修改格式
    
    例如以下配置中有trim_trailing_whitespace = true，会删除两边的空格，那么当你在编辑文件时出现两边空行的时候，保存动作会触发该配置自动删除空行
    
    ```python
    # EditorConfig helps developers define and maintain consistent
    # coding styles between different editors and IDEs
    # editorconfig.org
    
    root = true
    
    [*]
    
    indent_style = space
    indent_size = 2
    
    end_of_line = lf
    charset = utf-8
    trim_trailing_whitespace = true
    insert_final_newline = true
    ```
    
    要注意的是，需要安装`EditorConfig for VS Code`插件
    #
- babel.config.js
    
    babel将ECMAScript 2015+ code 向后兼容的工具链，比如你在一个不支持ES2015的环境或者浏览器就可以写ES2015的代码，babel会帮你转换成ES5的代码，如下所示
    
    ```jsx
    // Babel Input: ES2015 arrow function
    [1, 2, 3].map(n => n + 1);
    
    // Babel Output: ES5 equivalent
    [1, 2, 3].map(function(n) {
      return n + 1;
    });
    ```
    
    react native中使用的配置是@react-native/babel-preset，是一个专门针对RN的代码转换的preset，里面做了很多针对RN工程的代码转换，也包括上述的ES2015向后兼容
    
    ```jsx
    module.exports = {
      presets: ['module:@react-native/babel-preset'],
    };
    ```
    
    而在example中的babel.config.js，则加入module_resolver的插件，该插件能为模块导入设置别名，而不用按照绝对路径导入。下面的配置将模块的名称直接指引到外层src目录中的模块，简化库开发中的调试
    
    ```jsx
    const path = require('path');
    const pak = require('../package.json');
    
    module.exports = {
      presets: ['module:@react-native/babel-preset'],
      plugins: [
        [
          'module-resolver',
          {
            extensions: ['.tsx', '.ts', '.js', '.json'],
            alias: {
              [pak.name]: path.join(__dirname, '..', pak.source),
            },
          },
        ],
      ],
    };
    
    ```
    #
- jest.config.js
    
    jest是为javascript而生的单元测试框架，该配置文件主要用于专门针对RN项目的特定需求做预设
    #
- metro.config.js
    
    metro 是构建jsbundle包，以及提供开发服务的工具，metro.config.js则是用来对打包进行配置，比如告诉metro如何解析module
    
    比如下面配置告诉metro如何处理peerDependencies
    
    ```jsx
    const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
    const path = require('path');
    const escape = require('escape-string-regexp');
    const exclusionList = require('metro-config/src/defaults/exclusionList');
    const pak = require('../package.json');
    
    const root = path.resolve(__dirname, '..');
    const modules = Object.keys({ ...pak.peerDependencies });
    
    /**
     * Metro configuration
     * https://facebook.github.io/metro/docs/configuration
     *
     * @type {import('metro-config').MetroConfig}
     */
    const config = {
      watchFolders: [root],
    
      // We need to make sure that only one version is loaded for peerDependencies
      // So we block them at the root, and alias them to the versions in example's node_modules
      resolver: {
        blacklistRE: exclusionList(
          modules.map(
            (m) =>
              new RegExp(`^${escape(path.join(root, 'node_modules', m))}\\/.*$`)
          )
        ),
    
        extraNodeModules: modules.reduce((acc, name) => {
          acc[name] = path.join(__dirname, 'node_modules', name);
          return acc;
        }, {}),
      },
    
      transformer: {
        getTransformOptions: async () => ({
          transform: {
            experimentalImportSupport: false,
            inlineRequires: true,
          },
        }),
      },
    };
    
    module.exports = mergeConfig(getDefaultConfig(__dirname), config);
    ```
    #
- react-native.config.js
    
    这是React Native CLI的配置文件，example中将外层目录导入模块
    #
- Gemfile
    
    RubyGems是一个管理 Ruby 应用程序中依赖库的包管理器，相当于iOS工程中的cocoapod，Gemfile相当于podfile，用来配置依赖库
    
    RN中的Gemfile主要搭配bundler使用，下面为example Gemfile的内容
    
    ```jsx
    source 'https://rubygems.org'
    
    # You may use http://rbenv.org/ or https://rvm.io/ to install and use this version
    ruby ">= 2.6.10"
    
    # Cocoapods 1.15 introduced a bug which break the build. We will remove the upper
    # bound in the template on Cocoapods with next React Native release.
    gem 'cocoapods', '>= 1.13', '< 1.15'
    gem 'activesupport', '>= 6.1.7.5', '< 7.1.0'
    ```
    
    bundler能保证cocoapods跟activesupport的一致性，首先bundle install 会安装Gemfile中ruby库，之后使用bundle exec 开头的pod命令能保证该pod运行在gemfile配置的ruby环境当中，保证了团队开发中cocoapod的一致性
    #
- .nvmrc
    
    用于nvm切换版本用，nvmrc写入node的版本，在运行工程前使用nvm use即可切换到该版本
    #
- .watchmanconfig
    
    该文件时搭配watchman一起使用，它允许程序实时监控文件的改变，项目中该配置为空
    #
- .yarnrc.yml
    
    yarn 的配置文件
    #
- *.podspec
    
    该文件为iOS私有库的依赖声明文件，需放在最外层
    #
- tsconifg.json
    
    该文件为.ts文件的编译选项集合，用户可以自定义ts的编译规则
    #
- turbo.json
    
    用来管理单一仓库多项目的代码，具有并行pipeline跟缓存的机制，在该项目中主要用来缓存example中项目的代码
    #
- lefthook.yml
    
    git的钩子，用来处理预提交，预推送等git任务
