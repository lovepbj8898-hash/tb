(function () {
  'use strict';

  var W = window;
  var D = document;

  /* ================= mtop 封装 ================= */
  function mtopSend(api, param, version) {
    return new Promise(function (resolve, reject) {
      if (!W.__windvane__ || !W.__windvane__.call) { reject('no __windvane__ bridge'); return; }
      var p = {
        api: api, v: version || '1.0', post: '1', type: '', isHttps: '0', ecode: '0',
        isSec: '0', param: param, timer: 30000, needLogin: true, 
        sessionOption: 'AutoLoginOnly', ext_headers: {}, ext_querys: {}
      };
      W.__windvane__.call('MtopWVPlugin.send', p, resolve, reject, 10000);
    });
  }

  /* ================= 文搜参数 ================= */
  function buildSearchParam(query) {
    return {
      q: query, appId: '66', sversion: '29.9', spm: 'a2141.1.searchbar.searchbox',
      scm: '1007.home_topbar.searchbox.d', search_action: 'initiative',
      from: 'nt_history', sugg: '_0_1', index: '0', vm: 'nw', schemaType: 'auction',
      style: 'list', isEnterSrpSearch: 'true', needTabs: 'true', searchBoxShowType: 'UOne',
      layeredSrp: 'true', tb2025: 'true', ShopSDKModuleType: 'local', grayHair: 'false',
      elderHome: 'false', searchElderHomeOpen: 'false', homePageVersion: 'v7',
      enablePicShot: 'true', isBeta: 'false', gpsEnabled: 'false',
      history_query_from: 'suggest_all-queryBE2', extra_data_key: 's.m.taobao.com/h5entry', mainChannel: ''
    };
  }

  function getSearch(query) {
    return mtopSend('mtop.relationrecommend.MtopRecommend.recommend', buildSearchParam(query), '1.0');
  }

  /* ================= 详情 + 优惠券 ================= */
  function buildDetailParam(itemId) {
    var ex = {
      NAV_PROCESSOR_START_TIME: "1761720138804", appReqFrom: "detail", bizName: "minidetail", 
      container_type: "sku", countryCode: "CN", cpuCore: "8", cpuMaxHz: "null", 
      deviceLevel: "medium", dinamic_v3: "true", dynamicJsonData: "true", finalUltron: "true", 
      from: "minidetail", identifier: "", industryMainPicDegrade: "false", isFoldDevice: "false", 
      isPadDevice: "false", isPrefetchSkuMtop: "false", itemId: itemId, item_id: itemId, 
      latitude: "0", liveAutoPlay: "true", longitude: "0", newStruct: "true", nick: "", 
      openFrom: "tbmessage", osVersion: "34", phoneType: "OPPO11", preload_v: "industry", 
      screenHeight: "2606", screenWidth: "1240", skuId: "null", skuOutSdk: "true", 
      skuType: "confirm", sku_forbidH5: "true", sku_forbidH5_toast: "该商品不支持聊天窗内选择规格", 
      soVersion: "2.0", sourceType: "3", "spm-cnt": "a2141.1007.41750.336411", 
      supportIndustryMainPic: "true", transparent_key: "openFrom,itemId,identifier,bizName,sourceType,sku_forbidH5,sku_forbidH5_toast,from,skuId", 
      ttd_ttid: "10001201@tt_detail_android_12.51.40", ultron2: "true", 
      utdid: "b5eAIejvgwsCAbRmgzU4VyYm", videoAutoPlay: "true"
    };
    return { detail_v: "3.3.2", exParams: JSON.stringify(ex), id: itemId };
  }

  function getDetail(itemId) {
    return mtopSend('mtop.taobao.detail.data.get', buildDetailParam(itemId), '1.0');
  }

  function buildCouponParam(itemId) {
    var ex = {
      wh_weex: "true", "": "", subItemId: itemId, itemId: itemId, popId: "1755758950744",
      sellerId: "", marketcoupon: "true", from: "cart", sellerType: "B", weex_mode: "dom",
      addressId: "23516134638", token: "-1632109989", renderMode: "texture", promotionFloatingData: "undefined"
    };
    return { exParam: JSON.stringify(ex), itemId: itemId };
  }

  function getCoupon(itemId) {
    return mtopSend('mtop.taobao.detail.taodetail.getcoupon', buildCouponParam(itemId), '1.0');
  }

  /* ================= 详情报文白名单裁剪 ================= */
  function pruneDetailReport(resp) {
    try {
      if (typeof resp === 'string') resp = JSON.parse(resp);
      if (!resp || typeof resp !== 'object') return resp;
      var d = resp.data;
      if (!d || typeof d !== 'object') return resp;
      var KEEP_DATA = { apiStack: 1, trade: 1, errorMsg: 1, global: 1, seller: 1, item: 1, skuBase: 1, props: 1 };
      Object.keys(d).forEach(function (k) { if (!KEEP_DATA[k]) delete d[k]; });
      var st = Array.isArray(d.apiStack) ? d.apiStack[0] : null;
      if (!st) return resp;
      var isValueStr = typeof st.value === 'string';
      var stack = null;
      if (isValueStr) { try { stack = JSON.parse(st.value); } catch (e) { return resp; } }
      else if (st.data && typeof st.data === 'object') { stack = st.data; }
      if (!stack || typeof stack !== 'object') return resp;
      Object.keys(stack).forEach(function (k) { if (k !== 'data' && k !== 'global') delete stack[k]; });
      var KEEP_COMP = { detail4Title: 1, detail3Price: 1, detail4Price: 1, detail3Atmosphere: 1, detail4Atmosphere: 1, detail4LavishAtmosphere: 1, detail4Discount: 1, detail3InclusiveBottomBar: 1 };
      if (stack.data && typeof stack.data === 'object') {
        Object.keys(stack.data).forEach(function (k) {
          if (!KEEP_COMP[k] && k.indexOf('GovSubsidyTop') === -1) delete stack.data[k];
        });
      }
      var gd = stack.global && stack.global.data;
      if (gd && typeof gd === 'object') {
        var KEEP_GD = { trade: 1, skuCore: 1, price: 1, item: 1, rate: 1, priceSectionData: 1, skuV3Data: 1, vertical: 1, commonDialog: 1, resource: 1, promotionFloatingData: 1, detail3FloatView: 1, seller: 1, skuBase: 1 };
        Object.keys(gd).forEach(function (k) { if (!KEEP_GD[k]) delete gd[k]; });
        var skuMap = gd.skuV3Data && gd.skuV3Data.global && gd.skuV3Data.global.skuGlobal && gd.skuV3Data.global.skuGlobal.skuDetail && gd.skuV3Data.global.skuGlobal.skuDetail.skuMap;
        if (gd.skuV3Data) { gd.skuV3Data = skuMap ? { global: { skuGlobal: { skuDetail: { skuMap: skuMap } } } } : {}; }
        var ipf = gd.commonDialog && gd.commonDialog.industryParamsFloat && gd.commonDialog.industryParamsFloat.exParams && gd.commonDialog.industryParamsFloat.exParams.content && gd.commonDialog.industryParamsFloat.exParams.content.itemParamsFloat;
        if (gd.commonDialog) { gd.commonDialog = ipf ? { industryParamsFloat: { exParams: { content: { itemParamsFloat: ipf } } } } : {}; }
        if (gd.resource) { var r = gd.resource, nr = {}; if (r.bonus) nr.bonus = r.bonus; if (r.indexCouponData) nr.indexCouponData = r.indexCouponData; gd.resource = nr; }
        if (gd.vertical) { var v = gd.vertical, nv = {}; if (v.aselfShopInitViewModel) nv.aselfShopInitViewModel = v.aselfShopInitViewModel; if (v.smItemParams) nv.smItemParams = v.smItemParams; gd.vertical = nv; }
      }
      if (isValueStr) st.value = JSON.stringify(stack);
      return resp;
    } catch (e) { return resp; }
  }

  /* ================= 结果解析 ================= */
  function findItemsArray(resp) {
    if (typeof resp === 'string') { try { resp = JSON.parse(resp); } catch (e) { return null; } }
    if (Array.isArray(resp)) return resp;
    if (!resp || typeof resp !== 'object') return null;
    if (Array.isArray(resp.itemsArray)) return resp.itemsArray;
    if (resp.data) {
      var d = resp.data;
      if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { return null; } }
      if (Array.isArray(d)) return d;
      if (d && typeof d === 'object') {
        if (Array.isArray(d.itemsArray)) return d.itemsArray;
        if (Array.isArray(d.items)) return d.items;
        if (Array.isArray(d.auctions)) return d.auctions;
      }
    }
    return null;
  }

  function parseSearchItems(resp) {
    var arr = findItemsArray(resp);
    if (!arr) return [];
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var it = arr[i];
      if (!it || typeof it !== 'object') continue;
      var itemId = it.item_id || it.nid || it.auctionId;
      if (itemId) out.push({ itemId: String(itemId), title: it.title || it.raw_title || '' });
    }
    return out;
  }

  /* ================= 核心流程（自动化） ================= */
  D.body.innerHTML = "<div style='text-align:center;margin-top:50px;font-family:sans-serif;'><h2 style='color:#0f766e;'>正在自动执行任务...</h2><p id='status' style='color:#666;'>等待参数</p></div>";
  var statusEl = D.getElementById('status');

  // 解析深链参数
  var matchId = location.href.match(/[?&]id=([^&]*)/);
  var targetId = matchId ? decodeURIComponent(matchId[1]) : "";
  var matchKw = location.href.match(/[?&]kw=([^&]*)/);
  var targetTitle = matchKw ? decodeURIComponent(matchKw[1]) : "";

  if (!targetId || !targetTitle) {
      statusEl.innerText = "未收到有效的 ID 或标题参数";
  } else {
      statusEl.innerText = "正在搜索商品：" + targetTitle;
      
      getSearch(targetTitle).then(function (r) {
          statusEl.innerText = "搜索成功，正在匹配商品 ID...";
          var items = parseSearchItems(r);
          var found = false;
          
          for (var i = 0; i < items.length; i++) {
              if (items[i].itemId === targetId) {
                  found = true;
                  break;
              }
          }

          if (!found) {
              statusEl.innerText = "搜索列表中未找到该 ID，尝试直接拉取详情...";
              // 直接调详情兜底
              fetchDetailAndSend(targetId);
          } else {
              statusEl.innerText = "已匹配到目标 ID，正在拉取详情...";
              fetchDetailAndSend(targetId);
          }
      }).catch(function (e) {
          statusEl.innerText = "搜索失败，尝试直接拉取详情...";
          fetchDetailAndSend(targetId);
      });
  }

  function fetchDetailAndSend(itemId) {
      var detailResp = null, couponResp = null;
      var done = 0;
      function finish() {
          done++;
          if (done < 2) return;
          if (detailResp) detailResp = pruneDetailReport(detailResp);
          
          var payload = { itemId: itemId, alldetail: detailResp, coupon: couponResp };
          var json = JSON.stringify(payload);
          
          // 核心：不复制到剪贴板，直接打入 Logcat 供电脑抓取
          console.log("TASK_DATA_START::" + json + "::TASK_DATA_END");
          statusEl.innerText = "抓取并发送成功！请关闭此页。";
          statusEl.style.color = "green";
      }
      
      getDetail(itemId).then(function (r) { detailResp = r; finish(); }).catch(function (e) { detailResp = { error: e }; finish(); });
      getCoupon(itemId).then(function (r) { couponResp = r; finish(); }).catch(function (e) { couponResp = { error: e }; finish(); });
  }
})();