const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');
const fs = require('fs');

const PROVINCES_FILE = "provinces.json";
const GEO_FILE = "provinces-geo.json";
const VN_GIS_SOURCE_URL = 'http://gis.chinhphu.vn';

// API
function retrieveProvinces() {
    return axios({
        url: VN_GIS_SOURCE_URL,
        method: 'GET'
    })
}

function retrieveDistricts(provinceCode) {
    return new Promise((resolve, reject) => {
        axios({
            url: `${VN_GIS_SOURCE_URL}/Map/GetTree?pid=${provinceCode}`,
            method: 'GET'
        }).then(response => {
            resolve({ code: provinceCode, data: response.data });
        }).catch(error => {
            console.log(`error: ${error}`);
            reject(error);
        });
    });
}
/**
 * You must change the Cokie and __RequestVerificationToken.
 * To get these informations, please open gis.chinhphu.vn on Chrome then open developer console...
 * 
 * @param {*} areaCode 
 */
function retrieveAreaGeo(areaCode) {
    return new Promise((resolve, reject) => {
        axios({
            url: VN_GIS_SOURCE_URL + "/Region/GetGeoJson",
            method: 'POST',
            data: qs.stringify({
                areaCode,
                '__RequestVerificationToken': 'rMHkGBb9L3jnGqsW7i9MylGIge1A4s4OW-CdF8HqECwTfiQKXv6OmMK-pIREeLADZMc1WnAbhe-wuMd5LkjdRqXe-f09gSPdGiSRLw44RjA1'
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                Cookie: 'ASP.NET_SessionId=avhmh5cbvc1efvbwozna4jth; .BaseMap=L0Jhc2VNYXAve3p9L3t4fS97eX0ucG5n; .MinMap=L0Jhc2VSZWYve3p9L3t4fS97eX0ucG5n; __RequestVerificationToken=Ycmm_wRurhK87WjKfW6YYYWVZh5D4uboytnQb3afLMjUVlJ46eGeqzyPA007mhbAbXgBlgW-Jb3OIUJ7LnQb1ozlFuFoOZvk4hbmeuQIP7s1; .Region='
            }
        }).then(response => {
            console.log(`Done get GIS of areaCode: ${areaCode}`);
            resolve({ code: areaCode, data: response.data });
        }).catch(error => {
            console.log(`error: ${error}`);
            reject(error);
        });
    });
}
// Helpers
function parsingDistrictListFromHtml(data) {
    const districts = {};
    const $ = cheerio.load(data);
    $('a.tree-lazy-link').toArray().forEach(districtNode => {
        const districtId = $(districtNode).attr('data-pid');
        const districtName = $(districtNode).find('span.title').text()
        console.log(`${districtId} - ${districtName}`);
        districts[districtId] = districtName;
    });
    return districts;
}

function parsingProvinceListFromHtml(data) {
    const provinces = {};
    const $ = cheerio.load(data);
    $('a.tree-lazy-link').toArray().forEach(provinceNode => {
        const provinceId = $(provinceNode).attr('data-pid');
        const provinceName = $(provinceNode).find('span.title').text()
        console.log(`${provinceId} - ${provinceName}`);
        provinces[provinceId] = {
            name: provinceName,
            districts: {}
        };
    });
    return provinces;
}
// main crawling functions
function crawlingDistricts() {
    const provinces = JSON.parse(fs.readFileSync(PROVINCES_FILE));
    const allPromises = Object.keys(provinces).map(provinceId => retrieveDistricts(provinceId));
    Promise.all(allPromises).then(responses => {
        responses.forEach(response => {
            const districts = parsingDistrictListFromHtml(response.data);
            provinces[response.code].districts = districts;
        });
        fs.writeFileSync(PROVINCES_FILE, JSON.stringify(provinces));
    }).catch(error => {
        console.log(`error: ${error}`);
    });
}

function crawlingProvinces() {
    retrieveProvinces().then(response => {
        const provinces = parsingProvinceListFromHtml(response.data);
        fs.writeFileSync(PROVINCES_FILE, JSON.stringify(provinces));
    }).catch(error => {
        console.log(`error: ${error}`);
    })
}

function crawlingGeoInfo() {
    const provinces = JSON.parse(fs.readFileSync(PROVINCES_FILE));
    const provinceGeoDB = {};
    const areaCodes = [];
    Object.keys(provinces).forEach(provinceCode => {
        areaCodes.push(provinceCode);
        Object.keys(provinces[provinceCode]).forEach(districtCode => {
            areaCodes.push(districtCode);
        })
    });
    const allPromises = areaCodes.map(areaCode => retrieveAreaGeo(areaCode));
    Promise.all(allPromises).then(responses => {
        responses.forEach(response => {
            provinceGeoDB[response.code] = response.data;
        });
        fs.writeFileSync(GEO_FILE, JSON.stringify(provinceGeoDB));
    }).catch(error => {
        console.log(`error: ${error}`);
    });
}

// Steps to crawl data
// Step 1: crawl province list
// crawlingProvinces();
// Step 2: crawl district list
// crawlingDistricts();
// Step 3: crawl GEO information
// crawlingGeoInfo();