---
title: Openwrt+V2ray+dnsmasq实现透明代理（三）
date: 2024-02-21 10:50:58
categories:
- Network
tags:
- V2ray
- Openwrt
- dnsmasq
---

> 本章开始进入透明代理的部分，分三章，nftables部分，v2ray部分，dnsmasq部分，这一章介绍透明代理的原理以及nftables的配置
> 
<!-- more -->
## 透明代理的原理

当我们去请求一个带域名的地址时，首先会发送一个udp的消息，消息体中包含该域名（明文），端口都为53，而地址就是我们在网络设置里头的dns地址，dns server收到消息后返回对应的ip地址，之后客户端才对该ip地址发起真正的网络请求。

如果经常用shadowsocks，而不是vpn的小伙伴应该经常遇到终端命令无代理的反应，这是因为shadowsocks只是在网络设置中开启了系统代理，而终端命令在发起网络请求时走的是我前面描述的过程，即先根据网络设置中的DNS请求ip，然后才进行ip请求，由于DNS无代理，ip地址理所应当无法正确解析。而浏览器没有这个问题是因为，浏览器经过socks5可以全部走系统代理，这里面就包括了DNS请求，这时候网络设置中的DNS地址就不起作用了。

透明代理就是将需要代理的网络设备的网络设置中的网关跟DNS地址都设置为拥有代理功能的路由，也就是前面安装的openwrt，路由对流经的流量进行代理，而用户并无感知自己的流量被代理了，所以又名透明代理

## nftables是啥？

nftables是linux内核中的默认防火墙，功能与iptables类似，通过配置ntftable规则，可以把流经Openwrt的流量转至v2ray进行代理，下面是简化过的模型

{% image fancybox left clear group:IT v2ray3_0.png %}

- 绿色部分为nftables hook的prerouting链跟output链
    - prerouting链：任何流经openwrt的流量，都会先经过prerouting，nftables可以通过规则对流经prerouting的流量进行拦截，转发或丢弃
    - output链：任何从openwrt发出的流量，都会先经过output，nftables同样可以对这些流量进行相同的操作
    - 流量代理：只有prerouting可以进行透明代理，也就是转发流量到v2ray，output只能通过将流量标识后转发到prerouting后，才能进入v2ray进行透明代理
- 粉色部分表示流量转发，如果流量在进入prerouting后不走代理，则会直接被转发，转发规则为openwrt的路由规则，不会流经output。
- 路径解析（此处只包含请求路径，因为请求路径的规则到时候能cover到大部分的响应路径规则
    - 走代理的路径
        - openwrt请求路径（4，5，3，7，6
        - 网关指向openwrt的机器（1，3，7，6
    - 不走代理的路径
        - openwrt请求路径（4，6
        - 网关指向openwrt的机器
            - 请求openwrt（1，2，4，6
            - 请求其他地址（1，8，9
- 具体配置
    
    nftables可以一条条的添加规则，也可以读取已经编写好的规则文本去配置，推荐后一种，这种方式方便随时修改调试，也方便配置自启动脚本
    
    - 首先需要开启openwrt的ip转发`echo net.ipv4.ip_forward=1 >> /etc/sysctl.conf && sysctl -p`
    - 新增路由表，下面命令表示，标记为1的流量会走table 100的路由表，该路由表只有一项规则，任何请求地址都转发到回环地址，目的是为了转发output流量到prerouting
        
        `ip rule add fwmark 1 table 100`        
        `ip route add local 0.0.0.0/0 dev lo table 100`
        
    - 新建v2ray.nft 文件
        
        假设120.80.0.0/16是公司公网地址池
        
        ```bash
        table ip v2ray
        delete table ip v2ray
        
        table ip v2ray {
            chain prerouting {
                type filter hook prerouting priority filter; policy accept;
                ip daddr { 127.0.0.1, 224.0.0.0/4, 255.255.255.255 } return #回环地址，保留ip地址，广播地址不代理
                meta l4proto { tcp, udp} ip daddr 192.168.0.0/16 return #局域网地址不代理
                meta l4proto { tcp, udp } ip daddr 120.80.0.0/16 return #访问公司地址不代理
                meta l4proto { tcp, udp } meta mark set 0x00000001 tproxy to 127.0.0.1:20007 accept #其他流量转发至本地20007端口
            }
        
            chain output {
                type route hook output priority filter; policy accept;
                ip daddr { 127.0.0.1, 224.0.0.0/4, 255.255.255.255 } return
                meta l4proto { tcp, udp} ip daddr 192.168.0.0/16 return
                meta l4proto { tcp, udp } ip daddr 120.80.0.0/16 return
                ip daddr 0.0.0.0/0 tcp sport {port1, port2} return #如果v2ray开启了shadowsocks直连的代理，需要指定相关sport不代理，因为我们连接进来的地址是任意的
                ip daddr 0.0.0.0/0 udp sport {port1, port2} return #同上，开启udp
                meta mark 0x000000ff  return #v2ray的配置中我们把流量标记为255，这边表示已经经过v2ray代理的流量不再代理
                meta l4proto { tcp, udp } meta mark set 0x00000001 accept #标记为1流量转发到prerouting
            }
        }
        ```
        
        运行`nft -f v2ray.nft` 启用新的路由规则
        
    - 编写自启动脚本
        - 新建脚本文件transparent.sh
            
            ```bash
            /sbin/ip rule del fwmark 1 table 100
            /sbin/ip route del local 0.0.0.0/0 dev lo table 100
            /usr/sbin/nft -f v2ray.nft
            /sbin/ip rule add fwmark 1 table 100
            /sbin/ip route add local 0.0.0.0/0 dev lo table 100
            ```
            
        - /etc/init.d 目录中新建可执行文件transparent
            
            ```bash
            #!/bin/sh /etc/rc.common
            
            USE_PROCD=1
            START=99
            
            start_service() {
                    procd_open_instance
                    procd_set_param command /bin/sh "transparent.sh"
                    procd_set_param stdout 1
                    procd_set_param stderr 1
                    procd_set_param respaw
                    procd_close_instance
            }
            
            reload_service() {
                    stop
                    start
            }
            ```
            
            添加可执行命令`chomd 755 transparent`
            开启自启动
            `/etc/init.d/transparent enable`
            `/etc/init.d/transparent restart`
