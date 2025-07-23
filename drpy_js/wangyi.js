import axios from 'axios';

let siteUrl = 'https://active.163.com';
let headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
    'origin': siteUrl,
    'referer': `${siteUrl}/`
};

async function init(inReq, _outResp) {
    return {};
}

async function home(filter) {
    const { data } = await axios.get(`${siteUrl}/service/form/v1/9347/view/1618.jsonp?param_entry_kinds=his&page=1&pageSize=20`, { headers });
    const classes = [
        { type_name: '电影', type_id: 'movie' },
        { type_name: '纪录片', type_id: 'doc' },
        { type_name: '动画片', type_id: 'ani' },
        { type_name: '珍贵史料', type_id: 'his' }
    ];
    
    const videoList = data.list.map(item => ({
        vod_id: item.vid,
        vod_name: item.title,
        vod_pic: item.cover_pic,
        vod_remarks: item.meida_type
    }));

    return {
        class: classes,
        filters: {},
        videoList: videoList
    };
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page || 1;
    if (pg <= 0) pg = 1;

    const url = `${siteUrl}/service/form/v1/9347/view/1618.jsonp?param_entry_kinds=${tid}&page=${pg}&pageSize=20`;
    const { data } = await axios.get(url, { headers });
    
    const videoList = data.list.map(item => ({
        vod_id: item.vid,
        vod_name: item.title,
        vod_pic: item.cover_pic,
        vod_year: '',
        vod_remarks: item.meida_type
    }));
    
    return {
        list: videoList,
        page: pg,
        pagecount: Math.ceil(data.total / 20),
        limit: 20,
        total: data.total
    };
}

async function detail(inReq, _outResp) {
    const id = inReq.body.id;
    // For this example, we don't have a specific API endpoint for detailed info
    // So we'll construct a minimal response
    const vod = {
        vod_id: id,
        vod_name: '',
        vod_pic: '',
        vod_year: '',
        vod_area: '',
        vod_lang: '',
        vod_remarks: '',
        vod_actor: '',
        vod_director: '',
        vod_content: '',
        vod_play_from: '网易公版影像',
        vod_play_url: `${id}$${id}`
    };
    
    return {
        list: [vod]
    };
}

async function search(inReq, _outResp) {
    const key = inReq.body.wd;
    let pg = inReq.body.page || 1;
    
    const url = `${siteUrl}/service/form/v1/9347/view/1619.jsonp?_charset=UTF-8&_decode=UTF-8&param_title=${encodeURIComponent(key)}&page=${pg}&pageSize=6`;
    const { data } = await axios.get(url, { headers });
    
    const videoList = data.list.map(item => ({
        vod_id: item.vid,
        vod_name: item.title,
        vod_pic: item.cover_pic,
        vod_year: '',
        vod_remarks: item.meida_type
    }));
    
    return {
        list: videoList,
        page: pg
    };
}

function play(inReq, _outResp) {
    const id = inReq.body.id;
    // Based on the lazy loading logic in the original rule
    const parseCode = `
    let vid = "${id}";
    var playJsonUrl="https://so.v.163.com/mobile/getBatchOnlineVideo.do?vidstr=";
    var reqUrl=playJsonUrl+vid;
    var reqJson=JSON.parse(request(reqUrl)).data.video_list[0];
    input={jx:0,url:reqJson.mp4SdUrl,parse:0}
    `;
    
    return { 
        jx: 1, 
        parse: 1, 
        url: id,
        header: '',
        parse_code: parseCode
    };
}

export default {
    meta: {
        key: 'wangyigongban',
        name: '🎬 网易|影',
        type: 3,
        timeout: 5000
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
