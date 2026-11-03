(function () {
  'use strict';
  var W = window;
  var D = document;

  D.body.innerHTML = "<div style='text-align:center;margin-top:50px;font-family:sans-serif;'><h2 style='color:#0f766e;'>tb任务 (自动版)</h2><p id='status' style='color:#666;'>正在自动执行...</p></div>";
  var statusEl = D.getElementById('status');

  // 1. 获取深链传过来的参数
  var urlParams = new URLSearchParams(location.search);
  var targetId = urlParams.get('id') || "";
  var targetTitle = urlParams.get('kw') || "";

  if (!targetId) {
    statusEl.innerText = "未获取到商品ID";
    return;
  }

  function mtopSend(api, param, version) {
    return new Promise(function (resolve, reject) {
      if (!W.__windvane__ || !W.__windvane__.call) { reject('no bridge'); return; }
      var p = { api: api, v: version || '1.0', post: '1', type: '', isHttps: '0', ecode: '0',
        isSec: '0', param: param, timer: 30000, needLogin: true, sessionOption: 'AutoLoginOnly', ext_headers: {}, ext_querys: {} };
      W.__windvane__.call('MtopWVPlugin.send', p, resolve, reject, 10000);
    });
  }

  function buildSearchParam(query) {
    return { q: query, appId: '66', sversion: '29.9', spm: 'a2141.1.searchbar.searchbox', scm: '1007.home_topbar.searchbox.d',
      search_action: 'initiative', from: 'nt_history', sugg: '_0_1', index: '0', vm: 'nw', schemaType: 'auction',
      style: 'list', isEnterSrpSearch: 'true', needTabs: 'true', searchBoxShowType: 'UOne', layeredSrp: 'true',
      tb2025: 'true', ShopSDKModuleType: 'local', grayHair: 'false', elderHome: 'false', searchElderHomeOpen: 'false',
      homePageVersion: 'v7', enablePicShot: 'true', isBeta: 'false', gpsEnabled: 'false', history_query_from: 'suggest_all-queryBE2', extra_data_key: 's.m.taobao.com/h5entry', mainChannel: '' };
  }
  function getSearch(query) { return mtopSend('mtop.relationrecommend.MtopRecommend.recommend', buildSearchParam(query), '1.0'); }

  function buildDetailParam(itemId) {
    var ex = { NAV_PROCESSOR_START_TIME: "1761720138804", appReqFrom: "detail", bizName: "minidetail", container_type: "sku",
      countryCode: "CN", cpuCore: "8", cpuMaxHz: "null", deviceLevel: "medium", dinamic_v3: "true", dynamicJsonData: "true",
      finalUltron: "true", from: "minidetail", identifier: "", industryMainPicDegrade: "false", isFoldDevice: "false",
      isPadDevice: "false", isPrefetchSkuMtop: "false", itemId: itemId, item_id: itemId, latitude: "0", liveAutoPlay: "true",
      longitude: "0", newStruct: "true", nick: "", openFrom: "tbmessage", osVersion: "34", phoneType: "OPPO11",
      preload_v: "industry", screenHeight: "2606", screenWidth: "1240", skuId: "null", skuOutSdk: "true", skuType: "confirm",
      sku_forbidH5: "true", sku_forbidH5_toast: "该商品不支持聊天窗内选择规格", soVersion: "2.0", sourceType: "3", "spm-cnt": "a2141.1007.41750.336411",
      supportIndustryMainPic: "true", transparent_key: "openFrom,itemId,identifier,bizName,sourceType,sku_forbidH5,sku_forbidH5_toast,from,skuId",
      ttd_ttid: "10001201@tt_detail_android_12.51.40", ultron2: "true", utdid: "b5eAIejvgwsCAbRmgzU4VyYm", videoAutoPlay: "true" };
    return { detail_v: "3.3.2", exParams: JSON.stringify(ex), id: itemId };
  }
  function getDetail(itemId) { return mtopSend('mtop.taobao.detail.data.get', buildDetailParam(itemId), '1.0'); }
  
  function buildCouponParam(itemId) {
    var ex = { wh_weex: "true", "": "", subItemId: itemId, itemId: itemId, popId: "1755758950744", sellerId: "", marketcoupon: "true", from: "cart", sellerType: "B", weex_mode: "dom", addressId: "23516134638", token: "-1632109989", renderMode: "texture", promotionFloatingData: "undefined" };
    return { exParam: JSON.stringify(ex), itemId: itemId };
  }
  function getCoupon(itemId) { return mtopSend('mtop.taobao.detail.taodetail.getcoupon', buildCouponParam(itemId), '1.0'); }

  statusEl.innerText = "正在搜索标题：" + targetTitle;
  getSearch(targetTitle).then(function(r) {
      statusEl.innerText = "搜索成功，正在提取数据...";
      fetchDetail(targetId);
  }).catch(function(e) {
      statusEl.innerText = "搜索失败，尝试直接提取...";
      fetchDetail(targetId);
  });

  function fetchDetail(itemId) {
      var detailResp = null, couponResp = null;
      var done = 0;
      function finish() {
          done++;
          if (done < 2) return;
          var payload = { itemId: itemId, alldetail: detailResp, coupon: couponResp };
          var json = JSON.stringify(payload);
          
          console.log("TASK_DATA_START::" + json + "::TASK_DATA_END");
          statusEl.innerText = "数据抓取成功！已发送回电脑。";
          statusEl.style.color = "green";
      }
      getDetail(itemId).then(function (r) { detailResp = r; finish(); }).catch(function (e) { detailResp = { error: e }; finish(); });
      getCoupon(itemId).then(function (r) { couponResp = r; finish(); }).catch(function (e) { couponResp = { error: e }; finish(); });
  }
})();
