# -*- coding: utf-8 -*-
import requests
import random
import string
from datetime import datetime
from Crypto.Hash import HMAC, SHA1
from base64 import b64encode
import json


class Spider:
    def __init__(self):
        self.domain = 'https://frodo.douban.com'
        self.device = {}
        self.cachedHomeData = None
        self.requestQueue = []

    def init(self, extend=""):
        deviceKey = f"{extend}/device"
        try:
            # 假设这里有获取设备信息的逻辑，暂时模拟从文件读取
            with open('device_info.json', 'r') as f:
                self.device = json.load(f)
        except FileNotFoundError:
            self.device['id'] = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
            self.device['ua'] = 'Rexxar-Core/0.1.3 api-client/1 com.douban.frodo/7.9.0(216) Android/28 product/Xiaomi11 rom/android network/wifi udid/{device.id} platform/mobile com.douban.frodo/7.9.0(216) Rexxar/1.2.151 platform/mobile 1.2.151'.format(
                device=self.device)
            # 假设这里有保存设备信息的逻辑，暂时模拟保存到文件
            with open('device_info.json', 'w') as f:
                json.dump(self.device, f)
        return {}

    def sig(self, link):
        link += f"&udid={self.device['id']}&uuid={self.device['id']}&rom=android&apikey=0dad551ec0f84ed02907ff5c42e8ec70&s=rexxar_new&channel=Yingyongbao_Market&timezone=Asia/Shanghai&device_id={self.device['id']}&os_rom=android&apple=c52fbb99b908be4d026954cc4374f16d&mooncake=0f607264fc6318a92b9e13c65db7cd3c&sugar=0"
        u = requests.utils.urlparse(link)
        ts = int(datetime.now().timestamp())
        h = HMAC.new(b'bf7dddc7c9cfe6f7', f"GET&{u.path}&{ts}".encode('utf-8'), SHA1)
        signa = b64encode(h.digest()).decode('utf-8')
        return f"{link}&_sig={requests.utils.quote(signa)}&_ts={ts}"

    def requestWithDelay(self, reqUrl):
        import time
        time.sleep(0.5)
        try:
            response = requests.get(reqUrl, headers={
                'User-Agent': self.device['ua'],
                'Referer': self.domain
            })
            return response.json()
        except requests.RequestException as e:
            print(f'Request failed: {e}')
            raise e

    def homeContent(self, filter):
        if self.cachedHomeData:
            return self.cachedHomeData
        allClass = [
            {"type_id": "1", "type_name": "找电视剧"},
            {"type_id": "2", "type_name": "找电影"},
            {"type_id": "3", "type_name": "找综艺"}
        ]
        tvLabels = {
            "types": ["全部", "喜剧", "爱情", "悬疑", "动画", "武侠", "古装", "家庭", "犯罪", "科幻", "恐怖", "历史", "战争",
                      "动作", "冒险", "传记", "剧情", "奇幻", "惊悚", "灾难", "歌舞", "音乐"],
            "areas": ["全部", "华语", "欧美", "国外", "韩国", "日本", "中国大陆", "中国香港", "美国", "英国", "泰国", "中国台湾",
                      "意大利", "法国", "德国", "西班牙", "俄罗斯", "瑞典", "巴西", "丹麦", "印度", "加拿大", "爱尔兰",
                      "澳大利亚"],
            "years": ["全部", "2020年代", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2010年代", "2000年代", "90年代",
                      "80年代", "70年代", "60年代", "更早"],
            "platforms": ["全部", "腾讯视频", "爱奇艺", "优酷", "湖南卫视", "Netflix", "HBO", "BBC", "NHK", "CBS", "NBC", "tvN"],
            "sortOptions": ["近期热度", "综合排序", "首播时间", "高分优先"]
        }
        movieLabels = {
            "types": ["全部", "喜剧", "爱情", "动作", "科幻", "动画", "悬疑", "犯罪", "惊悚", "冒险", "音乐", "历史",
                      "奇幻", "恐怖", "战争", "传记", "歌舞", "武侠", "情色", "灾难", "西部", "纪录片", "短片"],
            "areas": ["全部", "华语", "欧美", "韩国", "日本", "中国大陆", "美国", "中国香港", "中国台湾", "英国", "法国",
                      "德国", "意大利", "西班牙", "印度", "泰国", "俄罗斯", "加拿大", "澳大利亚", "爱尔兰", "瑞典",
                      "巴西", "丹麦"],
            "years": ["全部", "2020年代", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2010年代", "2000年代", "90年代",
                      "80年代", "70年代", "60年代", "更早"],
            "platforms": ["全部", "腾讯视频", "爱奇艺", "优酷", "湖南卫视", "Netflix", "HBO", "BBC", "NHK", "CBS", "NBC", "tvN"],
            "sortOptions": ["近期热度", "综合排序", "首播时间", "高分优先"]
        }
        varietyLabels = {
            "types": ["全部", "真人秀", "脱口秀", "音乐", "歌舞"],
            "areas": ["全部", "华语", "欧美", "国外", "韩国", "日本", "中国大陆", "中国香港", "美国", "英国", "泰国",
                      "中国台湾", "意大利", "法国", "德国", "西班牙", "俄罗斯", "瑞典", "巴西", "丹麦", "印度", "加拿大",
                      "爱尔兰", "澳大利亚"],
            "years": ["全部", "2020年代", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2010年代", "2000年代", "90年代",
                      "80年代", "70年代", "60年代", "更早"],
            "platforms": ["全部", "腾讯视频", "爱奇艺", "优酷", "湖南卫视", "Netflix", "HBO", "BBC", "NHK", "CBS", "NBC", "tvN"],
            "sortOptions": ["近期热度", "综合排序", "首播时间", "高分优先"]
        }
        filterData = {
            "1": self.generateFilterData(tvLabels),
            "2": self.generateFilterData(movieLabels),
            "3": self.generateFilterData(varietyLabels)
        }
        self.cachedHomeData = {
            "class": allClass,
            "filters": filterData
        }
        return self.cachedHomeData

    def generateFilterData(self, labels):
        return [
            {
                "key": "类型",
                "name": "类型",
                "value": self.createLabelOptions(labels["types"])
            },
            {
                "key": "地区",
                "name": "地区",
                "value": self.createLabelOptions(labels["areas"])
            },
            {
                "key": "年代",
                "name": "年代",
                "value": self.createLabelOptions(labels["years"])
            },
            {
                "key": "平台",
                "name": "平台",
                "value": self.createLabelOptions(labels["platforms"])
            },
            {
                "key": "排序",
                "name": "排序",
                "value": self.createLabelOptions(labels["sortOptions"])
            }
        ]

    def createLabelOptions(self, labels):
        return [{"n": label, "v": label if label not in ["全部", "近期热度"] else ""} for label in labels]

    def categoryContent(self, tid, pg, filter, extend):
        pg = max(1, int(pg or 1))
        start = (pg - 1) * 30
        param1 = f'{{"形式":"{"电视剧" if tid == "1" else "电影" if tid == "2" else "综艺"}",'
        tags = '综艺,' if tid == "3" else ''
        sort = "U"
        if extend:
            for key, value in extend.items():
                if key == "排序":
                    sort = {"综合排序": "", "近期热度": "U", "首播时间": "R", "高分优先": "S"}.get(value, "")
                elif value != "全部":
                    param1 += f'"{key}":"{value}",'
                    tags += f"{value},"
            param1 = param1.rstrip(',') + '}'
            tags = tags.rstrip(',')
        webUrl = self.sig(f'{self.domain}/api/v2/{ "movie" if tid == "2" else "tv"}/recommend?refresh=0&start={start}&count=30&selected_categories={requests.utils.quote(param1)}&uncollect=false&tags={requests.utils.quote(tags)}{f"&sort={sort}" if sort else ""}')
        try:
            data = self.requestWithDelay(webUrl)
            videos = []
            for item in data['items']:
                vod_pic = ""
                if item.get('pic', {}).get('normal'):
                    vod_pic = f'https://images.weserv.nl/?url={item["pic"]["normal"]}&w=300&h=300'
                elif item.get('pic', {}).get('large'):
                    vod_pic = f'https://images.weserv.nl/?url={item["pic"]["large"]}&w=300&h=300'
                videos.append({
                    "vod_id": item['id'],
                    "vod_name": item['title'],
                    "vod_pic": vod_pic,
                    "vod_remarks": f'豆瓣{item.get("rating", {}).get("value", "")}'
                })
            result = {
                "page": pg,
                "pagecount": (data['total'] + 29) // 30,
                "list": videos
            }
            return result
        except Exception as e:
            print(f'Category request failed: {e}')
            return {
                "page": pg,
                "pagecount": 0,
                "list": [],
                "msg": str(e)
            }

    def detailContent(self, ids):
        # 这里需要实现具体的获取详情逻辑
        return {'list': []}

    def searchContent(self, key, quick, pg='1'):
        # 这里需要实现具体的搜索逻辑
        return {'list': [], 'page': pg}

    def playerContent(self, flag, id, vipFlags):
        # 这里需要实现具体的播放地址解析逻辑
        return {"parse": 0, "url": "", "header": {}}

    def localProxy(self, param):
        pass
