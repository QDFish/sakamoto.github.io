---
title: Openwrt+V2ray+dnsmasq实现透明代理（四）
date: 2024-02-21 10:51:08
categories:
- Network
tags:
- V2ray
- Openwrt
- dnsmasq
---

> 本章为v2ray配置部分
上一章经过nftables的配置后，流经openwrt的需要代理的流量都会转发到本地20007端口，这个端口需要v2ray去接受并代理
> 
<!-- more -->

## 简单介绍v2ray

v2ray能定制入站跟出站协议，定制流量路由，DNS解析等，简单来说，v2ray就像一个调度中心，通过不同入口，不同流量特征识别后，调度到不同的出口。

{% image fancybox left clear group:IT v2ray4_0.png %}

绿色部分表示入站协议，红色表示出站协议，每个协议就如果管道的接口，只要接口相同，规格相同，就能在远端接入v2ray进行代理，你既可以通过另外一个v2ray的出站去连接v2ray的入站，也可以通过其他工具来连接，只要协议相同并认证通过即可

## V2ray安装

- 我的openwrt版本是23.05.2，直接`okpg install v2ray-core`即可。
- 查看/usr/bin 目录下是否有`geoip.dat`和`geosite.dat`两个文件，这两个文件是用来做dns分流用的，实际上我们在使用dnsmasq后，可以舍弃掉geosite.dat文件，但是如果你不只是做透明代理，想做一些直连vpn类似的功能，还是需要geosite文件。
    
    ```bash
    curl -o /usr/bin/geoip.dat -L https://github.com/v2fly/geoip/releases/latest/download/geoip.dat
    curl -o /usr/bin/geosite.dat -L https://github.com/v2fly/domain-list-community/releases/latest/download/dlc.dat
    ```
    

## Openwrt配置v2ray

透明代理需要用到的入站协议为[dokodemo-door](https://www.v2ray.com/chapter_02/protocols/dokodemo.html)

官方解释：Dokodemo door（任意门）是一个入站数据协议，它可以监听一个本地端口，并把所有进入此端口的数据发送至指定服务器的一个端口，从而达到端口映射的效果。

dokodemo协议中的settings对象如果指定port跟address，则会将进入该协议的流量转发至指定地址跟端口，如果不指定，则按照流量原来的目的地发出。

除了20007端口接收所有代理流量外，另外开启了两个任意门，分别是接收国内DNS流量的20053端口，以及接收国外DNS流量的20054端口，这里的流量并不是由nftables转发过来的，而是通过dnsmaq进行dns分流后，转发到对应的端口，然后根据v2ray的路由规则，国内dns流量走本地，国外dns流量走代理，如果需要解析公司内网服务，则需要将20054端口协议的地址填写为公司的dns地址。

另外需要注意的是，如果你想要解析到公司内网的服务，需要将公司内网ip地址群添加到路由规则里，指定走代理，并且需要在dnsmap中添加公司相关服务域名走公司dns地址。

关于dnsmasq的部分将在下一章解析，以下为全文配置

```json
{
    "inbounds":[
        {
            "tag":"transparent",
            "port":20007,
            "protocol":"dokodemo-door",
            "settings":{
                "network":"tcp,udp",
                "followRedirect":true
            },
            "streamSettings":{
                "sockopt":{
                    "tproxy":"tproxy"                  
                }
            }
        },
        {
            "tag":"dns_cn",
            "port":20053,
            "protocol":"dokodemo-door",
            "settings":{
                "address":"192.168.0.1",//本地dns地址
                "port":53,
                "network":"udp,tcp",
                "followRedirect":false
            }
        },
        {
            "tag":"dns_foreign",
            "port":20054,
            "protocol":"dokodemo-door",
            "settings":{
                "address":"公司dns地址", //如果不需要内网服务可直接填8.8.8.8
                "port":53,
                "network":"udp,tcp",
                "followRedirect":false
            }
        }
    ],
    "outbounds":[
        {
            "tag":"proxy",
            "protocol":"vmess",
            "settings":{
                "vnext":[
                    {
                        "address":"127.0.0.1",
                        "port":20006,
                        "users":[
                            {
                                "id":"xxxxx" //认证id，保持与服务端一致即可
                            }
                        ]
                    }
                ]
            },
            "streamSettings":{
                "sockopt":{
                    "mark":255 //所有outboud都需要标识255，以让nftables识别出流量已代理
                }
            }
        },
        {
            "tag":"direct",
            "protocol":"freedom",//流量走本地
            "settings":{
                "domainStrategy":"AsIs"
            },
            "streamSettings":{
                "sockopt":{
                    "mark":255
                }
            }
        },
        {
            "tag":"block",
            "protocol":"blackhole",
            "settings":{
                "response":{
                    "type":"http"
                }
            }
        }       
    ],
    "routing":{
        "domainStrategy":"IpOnDemand",
        "rules":[
            {
                "type":"field",
                "inboundTag":[
                    "transparent"
                ],
                "port":123, //NTP协议
                "network":"udp",
                "outboundTag":"direct"
            },
            {
                "type":"field",
                "network":"udp",
                "port":53,
                "inboundTag":[
                    "dns_cn" //本地dns走本地
                ],
                "outboundTag":"direct"
            },
            {
                "type":"field",
                "network":"udp",
                "port":53,
                "inboundTag":[
                    "dns_foreign" //国外dns走代理
                ],
                "outboundTag":"proxy"
            },
            {
                "type":"field",
                "netowrk":"tcp,udp",
                "ip":[
                    "公司内网ip" //公司内网地址走代理
                ],
                "outboundTag":"proxy"
            },
            {
                "type":"field",
                "domain":[
                    "geosite:category-ads-all"
                ],
                "outboundTag":"block"
            },
            {
                "type":"field",
                "protocol":[
                    "bittorrent"
                ],
                "outboundTag":"direct"
            },
            {
                "type":"field",
                "ip":[
                    "geoip:private",
                    "geoip:cn"
                ],
                "outboundTag":"direct"
            },
            {
                "type":"field",
                "domain":[
                    "geosite:cn"
                ],
                "outboundTag":"direct"
            }
        ]
    }
}
```

- 配置自启动 `vi /etc/config/v2ray`
    
    ```bash
    config v2ray 'enabled'
            option enabled '1' //更改为1
    
    config v2ray 'config'
            option confdir '/etc/v2ray'
            option conffiles '/etc/v2ray/config_v1.json'//修改为你配置的文件地址
            option datadir '/usr/share/v2ray'
            option format 'json'
            option memconservative '1'
    ```
    
    `/etc/init.d/v2ray enable`
    
    `/etc/init.d/v2ray restart`
    

## 公司端配置v2ray

公司端用于接受代理流量，openwrt的代理出站协议是vmess，所以只需要指定inbound为vmess即可

`/usr/local/bin/autossh -p 20003 -M 20004 -Nf -R 20005:127.0.0.1:20006  user@home_address`

autossh打通的是20006端口映射到20005端口，所以openwrt往20006发，则公司用20005接收即可

```json
{
    "inbounds":[
        {
            "port":20005,
            "protocol":"vmess",
            "settings":{
                "clients":[
                    {
                        "id":"xxxxx" //对应openwrt的认证信息
                    }
                ]
            }
        }
    ],
    "outbounds":[
        {
            "protocol":"freedom"
        }
    ]
}
```

## 为什么不使用v2ray自带的dns服务

通常v2ray本身就可以实现透明代理，这是因为v2ray内置了DNS服务器，用于劫持dns请求，

但是v2ray的DNS服务并不能处理所有类型的dns请求

官方解释：

{% image fancybox left clear group:IT v2ray4_1.png %}

按照[https://guide.v2fly.org/app/tproxy.html#配置透明代理规则](https://guide.v2fly.org/app/tproxy.html#%E9%85%8D%E7%BD%AE%E9%80%8F%E6%98%8E%E4%BB%A3%E7%90%86%E8%A7%84%E5%88%99) 
v2ray会劫持所有流经透明代理网关的DNS流量，然后再走路由规则，而这些流量仅限于A和AAAA记录，如果是其他记录，例如ptr查询，则会通过Dokodemo setting中设置目标地址流出，也就是说没办法走DNS分流，存在DNS污染的问题。

在[https://guide.v2fly.org/basics/dns.html#对外开放-v2ray-的-dns-服务](https://guide.v2fly.org/basics/dns.html#%E5%AF%B9%E5%A4%96%E5%BC%80%E6%94%BE-v2ray-%E7%9A%84-dns-%E6%9C%8D%E5%8A%A1) 中提到的通过在dns的outbounds中的proxySettings设置远端地址，使得无法处理的DNS记录发往未污染的远端地址来解决。

但是这种方法同样还是没办法解决非A和AAAA记录的DNS流量的分流，对于解析一个国内域名的DNS流量来说，他最终是会通过远端走8.8.8.8服务器，这与我们的需求不同。

而且，如果DNS出站协议如果没有指定proxySettings，对于无法处理的dns请求，会造成dns死循环的问题。

结论就是v2ray没办法对所有DNS流量进行分流，所以使用dnsmasq来进行DNS分流，再转发DNS流量到v2ray，由v2ray根据不同inbound分流到本地去请求，或者远端请求。
