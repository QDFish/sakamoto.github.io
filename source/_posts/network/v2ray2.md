---
title: Openwrt+V2ray+dnsmasq实现透明代理（二）
date: 2024-02-20 11:14:50
categories:
- Network
tags:
- V2ray
- Openwrt
- dnsmasq
---

> 上一篇是Openwrt的安装篇，本篇将着重打通双端隧道的问题
一般来说，我们并没有公司或者实验室的网关权限，所以需要通过ssh的远端端口映射命令打通外部跟家里的通信隧道，这需要有一台具有公网ip的机子，或者是家里的路由器有公网ip，进行端口映射都行，另外为了保证自动重连，外部使用autossh进行ssh的连接。
> 

<!-- more -->

## 拓扑图

{% image fancybox left clear group:IT v2ray2_0.png %}

可以看到我们想打通的是公司局域网的机子到家里旁路由的隧道，这样，途径旁路由的流量都可以选择代理到公司局域网内。

## 具体步骤

- 对家里旁路由设置端口映射
    - 选择一个外部端口port_O1映射到旁路由（lan:192.168.0.50）的任意端口port_I1上
    - 选择一个外部端口port_O2映射到旁路由（lan:192.168.0.50）的任意端口22上，这里主要是为了远程登录，传输数据用
- 公司局域网机子需要免密登录openwrt的能力
    - 将公司端的ssh公钥`cat ~/.ssh/id_rsa.pub`  追加到旁路由中/etc/dropbear/authorized_keys中
        - 这边可以使用scp的方式，也可以ssh登录openwrt后手动复制
    - ssh -p port_O2 user@home_address  验证是否能免密登录
- 打通隧道
    - 公司端终端运行
        - `autossh -p 20000 -M 20001 -Nf -R 20002:127.0.0.1:20003 user@home_address`
            - 20000 就是上文说的port_O2，用于登录旁路由
            - 20001是autossh用来监测ssh连接情况，任意指定即可
            - -Nf表示后台运行且不执行远端命令
            - -R表示远端映射
            - `20002:127.0.0.1:20003` 表示将公司本地的20002端口绑定到家里本机`127.0.0.1:20003`，这样实际上我们在家中就可以通过`127.0.0.1:20003` 去传输数据，数据目的地为公司局域网机器的20002端口
    - 需要注意的是，一般来说，使用家里具有公网ip的路由，该公网ip一般为动态的，所以autossh命令中的home_address一般需要用到DDNS，华硕路由器免费赠送DDNS，网络上也有大量资料，在此不赘述
- 自启动运行autossh
    
    机器那面有重新启动的时候，以MAC为例
    
    - 创建sh脚本文件
        
        ```bash
        #!/bin/sh
        /usr/local/bin/autossh -p 20000 -M 20001 -Nf -R 20002:127.0.0.1:22  user@home_address
        /usr/local/bin/autossh -p 20003 -M 20004 -Nf -R 20005:127.0.0.1:20006  user@home_address
        ```
        
    - `cd /Library/LaunchAgents`
    - 创建唯一标识符的plist文件，文件名称`com.xx.autossh.plist`
        - 修改`Label`, `Program`, `StandardErrorPath`
            
            ```xml
            <?xml version="1.0" encoding="UTF-8"?>
            <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
            <plist version="1.0">
            <dict>
            	<key>Label</key>
            	<string>com.zzg.autossh.plist</string>
            	<key>Program</key>
            	<string>autossh.sh(绝对路径)</string>
            	<key>ProgramArguments</key>
            	<array>
            	</array>
                    <key>KeepAlive</key>
                    <true/>
            	<key>StandardErrorPath</key>
                    <string>error.log(绝对路径)</string>
            </dict>
            </plist>
            ```
            
    - `launchctl load -w com.zzg.autossh.plist` 即可开启自启动    

## 至此

我们已经为v2ray的代理实现了前提条件
