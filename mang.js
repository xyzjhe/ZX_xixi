import axios from 'axios';
import { Pool } from 'concurrent';

let siteUrl = 'https://www.mgtv.com';
let headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.61 Chrome/126.0.6478.61 Not/A)Brand/8  Safari/537.36',
    'origin': siteUrl,
    'referer': `${siteUrl}/`
};
let host = 'https://pianku.api.mgtv.com';
let vhost = 'https://pcweb.api.mgtv.com';
let mhost = 'https://dc.bz.mgtv.com';
let shost = 'https://mobileso.bz.mgtv.com';

async function init(inReq, _outResp) {
    return {};
}



async function home(filter) {
    const cateManual = {
        "电影": "3",
        "电视剧": "2",
        "综艺": "1",
        "动画": "50",
        "少儿": "10",
        "纪录片": "51",
        "教育": "115"
    };
    const classes = [];
    const filters = {};
    for (const k in cateManual) {
        classes.push({
            type_name: k,
            type_id: cateManual[k]
        });
    }
    // const pool = new Pool(classes.length);
    // const results = await pool.map(classes, getf);
    const results = [];
    for (const body of classes) {
        results.push(await getf(body));
    }
    results.forEach(([id, ft]) => {
        if (ft.length) filters[id] = ft;
    });
    // 获取首页视频内容
    const videoContent = await homeVideoContent();
    return {
        class: classes,
        filters: filters,
        videoList: videoContent.list
    };
}



async function homeVideoContent() {
    const t = Date.now();
    const url = `${mhost}/dynamic/v1/channel/index/0/0/0/1000000/0/0/17/1354?type=17&version=5.0&t=${t}&_support=10000000`;
    const { data } = await axios.get(url, { headers: headers });
    const videoList = [];
    data.data.forEach(i => {
        if (i.DSLList && i.DSLList.length) {
            i.DSLList.forEach(j => {
                if (j.data && j.data.items && j.data.items.length) {
                    j.data.items.forEach(k => {
                        videoList.push({
                            vod_id: k.videoId,
                            vod_name: k.videoName,
                            vod_pic: k.img,
                            vod_year: k.cornerTitle,
                            vod_remarks: k.time || k.desc
                        });
                    });
                }
            });
        }
    });
    return { list: videoList };
}



async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const filter = inReq.body.filters;
    const extend = inReq.body.extend || {};
    if (!pg) pg = 1;
    if (pg <= 0) pg = 1;

    const body = {
        allowedRC: '1',
        platform: 'pcweb',
        channelId: tid,
        pn: pg,
        pc: '80',
        hudong: '1',
        _support: '10000000'
    };
    // 合并筛选条件
    Object.assign(body, filter, extend);
    const { data } = await axios.get(`${host}/rider/list/pcweb/v3`, { params: body, headers: headers });
    const videoList = [];
    data.data.hitDocs.forEach(i => {
        videoList.push({
            vod_id: i.playPartId,
            vod_name: i.title,
            vod_pic: i.img,
            vod_year: (i.rightCorner || {}).text || i.year,
            vod_remarks: i.updateInfo
        });
    });
    const result = {};
    result.list = videoList;
    result.page = pg;
    result.pagecount = 9999;
    result.limit = 90;
    result.total = 999999;
    return result;
}




async function detail(inReq, _outResp) {
    const ids = [inReq.body.id];
    const vbody = { allowedRC: '1', vid: ids[0], type: 'b', _support: '10000000' };
    const { data: vdata } = await axios.get(`${vhost}/video/info`, { params: vbody, headers: headers });
    const d = vdata.data.info.detail;
    const vod = {
        vod_name: vdata.data.info.title,
        type_name: d.kind,
        vod_year: d.releaseTime,
        vod_area: d.area,
        vod_lang: d.language,
        vod_remarks: d.updateInfo,
        vod_actor: d.leader,
        vod_director: d.director,
        vod_content: d.story,
        vod_play_from: '芒果TV',
        vod_play_url: ''
    };
    const [data, pdata] = await fetch_page_data('1', ids[0], true);
    const pagecount = data.data.total_page || 1;
    if (pagecount > 1) {
        const pages = Array.from({ length: pagecount - 1 }, (_, i) => i + 2);
        const pool = new Pool(10);
        const pageResults = await pool.map(pages, async page => {
            try {
                return await fetch_page_data(page, ids[0]);
            } catch (e) {
                console.error(`Error fetching page ${page}: ${e}`);
                return [];
            }
        });
        pageResults.forEach(result => pdata.push(...result));
    }
    vod.vod_play_url = pdata.join('#');
    return {
        list: [vod]
    };
}

async function search(inReq, _outResp) {
    const key = inReq.body.wd;
    let pg = inReq.body.page || "1";
    const url = `${shost}/applet/search/v1?channelCode=mobile-wxap&q=${key}&pn=${pg}&pc=10&_support=10000000`;
    const { data } = await axios.get(url, { headers: headers });
    const videoList = [];
    data.data.contents.forEach(i => {
        if (i.data && i.data.length) {
            const k = i.data[0];
            if (k.vid && k.img) {
                try {
                    videoList.push({
                        vod_id: k.vid,
                        vod_name: k.title,
                        vod_pic: k.img,
                        vod_year: (i.rightTopCorner || {}).text || i.year,
                        vod_remarks: i.desc.join('/')
                    });
                } catch (e) {
                    console.log(k);
                }
            }
        }
    });
    return {
        list: videoList,
        page: pg
    };
}

function play(inReq, _outResp) {
    let id = inReq.body.id;
    id = `${siteUrl}${id}`;
    return { jx: 1, parse: 1, url: id, header: '' };
}

async function getf(body) {
    const params = {
        allowedRC: '1',
        channelId: body.type_id,
        platform: 'pcweb',
        '_support': '10000000'
    };
    const { data } = await axios.get(`${host}/rider/config/channel/v1`, { params, headers: headers });
    const ft = [];
    data.data.listItems.forEach(i => {
        try {
            const value_array = i.items.filter(value => value.tagName).map(value => ({ n: value.tagName, v: value.tagId }));
            ft.push({ key: i.eName, name: i.typeName, value: value_array });
        } catch (e) {
            console.log(i);
        }
    });
    return [body.type_id, ft];
}

async function fetch_page_data(page, id, b = false) {
    const body = {
        version: '5.5.35',
        video_id: id,
        page,
        size: '30',
        platform: '4',
        src: 'mgtv',
        allowedRC: '1',
        _support: '10000000'
    };
    const { data } = await axios.get(`${vhost}/episode/list`, { params: body, headers: headers });
    const ldata = data.data.list.map(i => `${i.t3}$${i.url}`);
    if (b) {
        return [data, ldata];
    } else {
        return ldata;
    }
}

export default {
    meta: {
        key: 'manguo',
        name: '🥝 芒果|搜',
        type: 3,
       
    },
    api: async(fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
    },
};
