const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Base64 } = require('js-base64');

class Spider {
    constructor() {
        this.host = this.gethost();
        this.headers = {
            AppID: '534',
            app_id: '534',
            version: '1.0.3',
            package: 'com.hjmore.wallpaper',
            user_id: '3507f394e83d2424',
            'user-id': '3507f394e83d2424',
            app_name: 'lanlan',
            'app-name': 'lanlan',
            'Content-Type': 'application/json; charset=utf-8;',
            'User-Agent': 'okhttp/4.9.0'
        };
    }

    init(extend = "") {
        this.host = this.gethost();
    }

    getName() {}

    isVideoFormat(url) {}

    manualVideoCheck() {}

    destroy() {}

    async homeContent(filter) {
        const hdata = await this.getdata('/api.php/provide/index', this.getbody({ tid: '0' }));
        const vlist = hdata.data?.tj || [];
        const result = {};
        const classes = [];
        const filters = {};

        for (const i of hdata.data.sub_data) {
            const id = String(i.type_id);
            classes.push({ type_id: id, type_name: i.type_name });
            if (i.data.length) vlist.push(...i.data);
        }

        const promises = classes.map((cls) => this.getf(cls));
        const results = await Promise.all(promises);

        for (const [id, ft] of results) {
            if (ft.length) filters[id] = ft;
        }

        result.class = classes;
        result.filters = filters;
        result.list = vlist;

        return result;
    }

    homeVideoContent() {}

    async categoryContent(tid, pg, filter, extend) {
        const body = {
            tid,
            type: extend?.type,
            lang: extend?.lang,
            area: extend?.area,
            year: extend?.year,
            pg
        };

        const filteredBody = Object.fromEntries(
            Object.entries(body).filter(([_, v]) => v !== null && v !== undefined && v !== "")
        );

        const data = await this.getdata('/api.php/provide/nav', this.getbody(filteredBody));
        return {
            list: data.data.data,
            page: pg,
            pagecount: 9999,
            limit: 90,
            total: 999999
        };
    }

    async detailContent(ids) {
        const data = await this.getdata('/api.php/provide/vod', this.getbody({ ids: ids[0] }));
        const vod = data.data;
        const plist = [];
        const names = [];

        for (const i of vod.vod_play_url) {
            const ulist = [];
            names.push(i.name.split(' ')[0]);
            const jdata = { parse: "" };

            if (i.parse && Array.isArray(i.parse) && i.parse.length) {
                jdata.parse = this.e64(JSON.stringify(i.parse));
            }

            for (const j of i.data) {
                jdata.url = j.url;
                ulist.push(`${j.name}$${this.e64(JSON.stringify(jdata))}`);
            }

            plist.push(ulist.join('#'));
        }

        vod.vod_play_from = names.join('$$$');
        vod.vod_play_url = plist.join('$$$');
        delete vod.cover_list;

        return { list: [vod] };
    }

    async searchContent(key, quick, pg = "1") {
        const body = { wd: key, tid: "0", pg };
        const data = await this.getdata('/api.php/provide/search', this.getbody(body));
        const vlist = data.data.map((i) => {
            delete i.vod_play_from;
            return i;
        });

        return { list: vlist, page: pg };
    }

    async playerContent(flag, id, vipFlags) {
        const data = JSON.parse(this.d64(id));
        let parse = data.parse;
        let url = data.url;
        let p = 1;
        let head = '';

        if (parse) parse = JSON.parse(this.d64(parse));

        if (!/\.m3u8|\.mp4|\.flv/.test(url) && parse) {
            for (const p of parse) {
                try {
                    const response = await axios.get(`${p}${url}`, { headers: this.headers });
                    url = response.data?.data?.url || response.data.url;
                    head = response.data?.data?.header || response.data.header;
                    p = 0;
                    break;
                } catch {
                    p = 1;
                    url = data.url;
                    head = { 'User-Agent': 'okhttp/4.9.0' };
                }
            }
        }

        return { parse: p, url, header: head };
    }

    localProxy(param) {}

    async getf(map) {
        const ft = [];
        const id = map.type_id;

        try {
            const fdata = await this.getdata('/api.php/provide/nav', this.getbody({ tid: id, pg: '1' }));
            const dy = ['area', 'year', 'lang', 'type'];
            const fd = fdata.data.type_extend;
            const hasNonEmptyField = dy.some((key) => fd[key]?.trim() !== "");

            if (hasNonEmptyField) {
                for (const dkey in fd) {
                    if (dy.includes(dkey) && fd[dkey]?.trim() !== "") {
                        const values = fd[dkey].split(",");
                        const valueArray = values.map((value) => ({
                            n: value.trim(),
                            v: value.trim()
                        }));
                        ft.push({ key: dkey, name: dkey, value: valueArray });
                    }
                }
            }

            return [id, ft];
        } catch {
            return [id, ft];
        }
    }

    getskey() {
        return crypto.randomBytes(16).toString('hex');
    }

    async getohost() {
        const url = 'https://bianyuan001.oss-cn-beijing.aliyuncs.com/huidu1.0.0.json';
        const response = await axios.get(url, { headers: this.headers });
        return response.data.servers[0];
    }

    async gethost() {
        const body = {
            gr_rp_size: "1080*2272",
            gr_app_list: "屏幕录制（com.miui.screenrecorder）...",
            gr_lal: "0.0,0.0",
            gr_system_type: "android",
            gr_device_imei: "3507f394e83d2424",
            gr_app_version: "1.0.3",
            gr_device_model: "Xiaomi ...",
            gr_city: "贵州,未知,未知",
            requestId: this.uuid(),
            timeStamp: String(Date.now()),
            version: "1.0.3",
            package: "com.hjmore.wallpaper",
            userLoginToken: "",
            app_id: "534",
            appName: 2131951658,
            device_id: "3507f394e83d2424",
            "device-id": "3507f394e83d2424",
            oaid: "",
            imei: "",
            referer_shop: "边缘影视",
            "referer-shop": "边缘影视",
            access_fine_location: 0,
            "access-fine-location": 0
        };

        const ohost = await this.getohost();
        const data = await this.getdata('/api.php/settings/grayscale_list', body, ohost);
        const parsedUrl = new URL(data.data.grayscale.server_url[0]);
        return `${parsedUrl.protocol}//${parsedUrl.host}`;
    }

    drsa(encryptedData) {
        const privateKey = `-----BEGIN RSA PRIVATE KEY-----
    ...
    -----END RSA PRIVATE KEY-----`;

        const key = crypto.createPrivateKey(privateKey);
        const buffer = Buffer.from(Base64.atob(encryptedData), 'base64');

        return crypto.privateDecrypt({ key, padding: crypto.constants.RSA_PKCS1_PADDING }, buffer).toString('utf-8');
    }

    ersa(data) {
        const publicKey = `-----BEGIN PUBLIC KEY-----
    ...
    -----END PUBLIC KEY-----`;

        const key = crypto.createPublicKey(publicKey);
        const buffer = Buffer.from(data, 'utf-8');

        return Base64.encode(crypto.publicEncrypt({ key, padding: crypto.constants.RSA_PKCS1_PADDING }, buffer));
    }

    eaes(data, key) {
        const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(key, 'utf-8'), null);
        const encrypted = Buffer.concat([cipher.update(data, 'utf-8'), cipher.final()]);
        return Base64.encode(encrypted.toString('utf-8'));
    }

    daes(encryptedData, key) {
        const decipher = crypto.createDecipheriv('aes-128-ecb', Buffer.from(key, 'utf-8'), null);
        const decrypted = Buffer.concat([decipher.update(Buffer.from(Base64.atob(encryptedData), 'base64')), decipher.final()]);
        return decrypted.toString('utf-8');
    }

    getbody(params = {}) {
        const body = {
            requestId: this.uuid(),
            timeStamp: String(Date.now()),
            version: "1.0.3",
            package: "com.hjmore.wallpaper",
            userLoginToken: "",
            app_id: "534",
            appName: 2131951658,
            device_id: "3507f394e83d2424",
            "device-id": "3507f394e83d2424",
            oaid: "",
            imei: "",
            referer_shop: "边缘影视",
            "referer-shop": "边缘影视",
            access_fine_location: 0,
            "access-fine-location": 0
        };

        return { ...body, ...params };
    }

    async getdata(path, body, host = null) {
        const jdata = JSON.stringify(body);
        const msign = this.md5(jdata);
        const skey = this.getskey();
        const jsign = { key: skey, sign: msign };
        const sign = this.ersa(JSON.stringify(jsign));
        const header = { ...this.headers, Sign: sign };
        const dbody = this.eaes(jdata, skey);

        const response = await axios.post(`${host || this.host}${path}`, dbody, { headers: header });
        let rdata = response.data;

        if (response.headers.Sign) {
            const dkey = this.drsa(response.headers.Sign);
            rdata = this.daes(rdata, dkey);
        }

        return JSON.parse(rdata);
    }

    e64(text) {
        try {
            return Base64.encode(text);
        } catch (e) {
            console.error(`Base64编码错误: ${e.message}`);
            return "";
        }
    }

    d64(encodedText) {
        try {
            return Base64.decode(encodedText);
        } catch (e) {
            console.error(`Base64解码错误: ${e.message}`);
            return "";
        }
    }

    md5(text) {
        return crypto.createHash('md5').update(text, 'utf-8').digest('hex');
    }

    uuid() {
        return uuidv4();
    }
}

module.exports = Spider;