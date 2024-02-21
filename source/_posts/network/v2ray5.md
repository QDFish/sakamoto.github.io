---
title: Openwrt+V2ray+dnsmasq实现透明代理（五）
date: 2024-02-21 10:51:18
categories:
- Network
tags:
- V2ray
- Openwrt
- dnsmasq
---

> 本章为最终章，主要讲解dnsmasq的配置
由于我们走透明代理的时候，网关跟DNS地址都是指向了旁路由，也就是Openwrt，地址为192.168.0.50。而局域网地址在nftables中已经被过滤掉，即不走v2ray代理，原因见上篇。dnsmasq能对DNS请求进行劫持，并且有[dnsmasq-china-list](https://github.com/felixonmars/dnsmasq-china-list)，这提供了我们做DNS分流的基础条件
>
<!-- more -->

openwrt本身已经内置了dnsmasq，配置文件路径为/etc/config/dhcp，里面的配置是对应luci中的network

## dnsmasq的运行流程

简单的理解的话，当你开启dnsmasq后，进程会开启53的监听端口，用来劫持所有以openwrt地址为dns服务的请求，然后通过配置文件去重新指定dns请求地址，也可以直接返回域名的映射地址，我们这边使用的是重新指定dns请求地址，如果是国内域名则指定为`192.168.0.50#20053`，国外域名指定为`192.168.0.50#20054`，对应v2ray dns inbound

完整语法为：

```bash
server=/google.com/192.168.0.50#20054
server=/baidu.com/192.168.0.50#20053
```

## dnsmasq配置文件的优先级

- `/etc/config/dhcp > /etc/dnsmasq.d/ > /etc/dnsmasq.conf`
    - `/etc/config/dhcp`中的配置不包含重新指定地址的语法，里面的配置主要是基础配置，比如缓存大小，一般来说我们不用去修改该文件
    - `/etc/dnsmasq.d`是一个文件夹，你可以任意指定你的.conf文件，dnsmasq-china-list的底层逻辑就是把大陆域名的dns地址重定向放入该文件当中，dnsmasq先去匹配域名是否为大陆地址，是的话直接匹配大陆dns，否则进入下一层配置文件
    - `/etc/dnsmasq.conf` 是优先级最低的配置文件，我们会在这边配置一些dhcp没有配置过的基础配置，并且加上国外dns地址，这样当国内域名没有匹配上的时候，我们可以理解该域名就为国外域名。

## 完整配置

- dnsmasq.d的配置

    
    /etc/dnsmasq.d 中的大陆域名配置我们采用[dnsmasq-china-list](https://github.com/felixonmars/dnsmasq-china-list)，该repo提供了一个快速布置更新的脚本，我们需要修改里头的内容，所以我们把它当下来
    
    [https://raw.githubusercontent.com/felixonmars/dnsmasq-china-list/master/install.sh](https://raw.githubusercontent.com/felixonmars/dnsmasq-china-list/master/install.sh)
    
    更改`SERVERS=(114.114.114.114 114.114.115.115 223.5.5.5 119.29.29.29)` 这一行为v2ray设置的dns_cn inbound. `SERVERS=（192.168.0.50#20053）`
    
    首次运行的时候由于dnsmasq.d目录下并没有文件，所以会报错，把remove相关的代码注释即可，下次运行需要再打开（你也可以改善下，我懒得改
    
    ```bash
    #注释掉remove的process
    #echo "Removing old configurations..."
    #for _conf in "${CONF_WITH_SERVERS[@]}" "${CONF_SIMPLE[@]}"; do
    #  rm -f /etc/dnsmasq.d/"$_conf"*.conf
    #done
    ```
    
    openwrt的sh实际是使用busybox，运行该脚本会报语法错误，你可以选择用opkg install zsh，然后用zsh来运行脚本即可
    
    如果你需要代理公司内网服务，需要该目录下再创建一个conf文件，里面的内容类似于
    
    ```bash
    server=/git.xxxx.com/192.168.0.50#20054
    server=/test1-jenkins.xxxxx.cn/192.168.0.50#20054
    server=/auth.xxxxx.com/192.168.0.50#20054
    server=/jira.xxxx.com/192.168.0.50#20054
    ```
    
    强制内网域名走代理
    
- dnsmasq.conf的配置
    
    ```bash
    log-queries #记录查询请求，并通过log-facility指定记录日志。
    no-hosts #直接查询上游DNS，忽略hosts文件。
    bogus-nxdomain=119.29.29.29 #对于任何被解析到此 IP 的域名，将响应 NXDOMAIN 使其解析失效，可以多次指定 通常用于对于访问不存在的域名，禁止其跳转到运营商的广告站点
    strict-order #表示严格按照resolv-file文件中的顺序从上到下进行DNS解析，直到第一个解析成功为止。
    port=53 #监听53端口
    listen-address=127.0.0.1,192.168.0.50 #监听地址
    server=192.168.0.50#20054
    server=8.8.8.8
    ```
    
    配置完后，运行
    
    ```bash
    /etc/init.d/dnsmasq enable
    /etc/init.d/dnsmasq restart
    ```
    
    查看53端口是否开启监听
    
    `netstat -tuln | grep :53`
    

## 至此

你已经完成透明代理的所有配置，只需把你的网络设备网关地址跟DNS地址指向Openwrt的地址即可，如果你觉得手动修改地址很麻烦，你可以参照
{% post_link network/wifi-diversion %}，里面介绍了如何连接不同的wifi走不同的网关，当然如果是第一次配置，一定会遇到很多麻烦，欢迎邮箱提问。两天完成了整个配置流程的文章梳理，而第一次完成整个配置，我几乎花了2周的时间，为了下次如果需要换设备重新配置有系统的指导，我记录了下来，而这是我完成这个系列文章的最大动力
