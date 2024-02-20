---
title: Openwrt+V2ray+dnsmasq实现透明代理（一）
date: 2024-02-19 18:13:26
categories:
- Network
tags:
- V2ray
- Openwrt
- dnsmasq
---

> 我们一定会有一种需求，比如把公司或者实验室网络搬回家，因为公家的网络常常带着魔法，又快又好，当然这一切都可以简单的用VPN来解决，而折腾的方式只是为了让我们在家里连接特定wifi的那一刻就不知不知觉地坐上魔法的飞毯
> 

<!-- more -->

## Openwrt

家里的一台mac mini作为主力机，常年不关机，所以openwrt使用UTM虚拟

[OpenWrt on UTM on Apple Silicon HowTo](https://openwrt.org/docs/guide-user/virtualization/utm)

**安装补充：**

Openwrt默认的存储空间只有100M多，而进行透明代理需要安装许多第三方的工具，所以首先需要对img文件进行扩容

- 对img进行扩容（在系统安装后利用cfdisk进行扩容
    
    `dd if=/dev/zero bs=1G count=10 >> openwrt-23.05.2-armsr-armv8-generic-ext4-combined.img`
    
- network的部分使用桥接即可，不需要添加共享网络
    
    {% image fancybox left clear group:IT v2ray1_0.png %}
    
- 安装完成后初始化
    - 设置lan地址
        
        ```bash
        uci set network.lan.ipaddr='局域网地址'
        uci commit
        service network restart
        ```
        
    - 需要一个可以翻墙的http地址，或者使用国内源
        
        ```bash
        #将官方源中的https批量替换成http, wget有https代理失败的问题
        sed -i -e "s/https/http/" /etc/opkg/distfeeds.conf
        #http代理
        export http_proxy=http://xxxxx
        ```
        
    - 安装扩容
        
        ```bash
        #扩容需要的软件
        opkg update
        opkg install fdisk
        opkg install cfdisk
        ```
    - 旁路由初始化
        - network→firewall→Enable SYN-flood protection 关闭
        - network→interface→lan→edit
            - 设置网关为主路由
                
                {% image fancybox left clear group:IT v2ray1_4.png %}
                
            - 设置DNS server为主路由地址
                
                {% image fancybox left clear group:IT v2ray1_5.png %}
                
            - 勾选忽略接口，即关闭dhcp
                
                {% image fancybox left clear group:IT v2ray1_6.png %}
                
            - 关闭所有ipv6服务
                
                {% image fancybox left clear group:IT v2ray1_7.png %}
- 扩容
    - 查看disk信息
        
        {% image fancybox left clear group:IT v2ray1_1.png %}
        
        {% image fancybox left clear group:IT v2ray1_2.png %}
        
        /dev/vda是UTM默认的最大空间，而根路径是挂载在vdb中，具体点是vdb2，其他两个是引导跟bios，可以看到vdb总大小是10.23g，而实际vdb三个device使用的总大小不过500M，这时候需要对vdb进行分区，将剩余空间扩展到vdb2
        
    - cfdisk 分区
        
        run `cfdisk /dev/vdb`
        
        {% image fancybox left clear group:IT v2ray1_3.png %}
        
        这是分完区的图，如果尚未分区，并且有剩余空间，最下方会显示freespace，按照提示将剩余空间扩容到vdb2
        
    - root重挂载
        
        安装下挂载的luci
        
        `opkg install block-mount`
        
        挂载操作参考这篇文章
        
        [OpenWrt 安装后扩容](https://www.xiaocaicai.com/2023/11/openwrt-%E5%AE%89%E8%A3%85%E5%90%8E%E6%89%A9%E5%AE%B9/)
