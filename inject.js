(function () {
  'use strict';
  var W = window;
  var D = document;

  D.body.innerHTML = "<div style='text-align:center;margin-top:50px;font-family:sans-serif;'><h2 style='color:#0f766e;'>tb任务</h2><p id='status' style='color:#666;'>正在读取剪贴板...</p></div>";
  var statusEl = D.getElementById('status');

  // 1. 从剪贴板读取任务 (格式: ID|标题)
  navigator.clipboard.readText().then(function(text) {
      if (!text || !text.includes('|')) {
          statusEl.innerText = "剪贴板里没有任务信息！";
          return;
      }
      var parts = text.split('|');
      var targetId = parts[0];
      var targetTitle = parts[1];
      
      statusEl.innerText = "正在搜索：" + targetTitle;
      runTask(targetId, targetTitle);

  }).catch(function(err) {
      statusEl.innerText = "读取剪贴板失败，请确保淘宝有剪贴板权限！";
  });

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

  function runTask(targetId, targetTitle) {
    mtopSend('mtop.relationrecommend.MtopRecommend.recommend', buildSearchParam(targetTitle)).then(function(r) {
        statusEl.innerText = "搜索成功，正在拉取详情...";
        
        mtopSend('mtop.taobao.detail.data.get', buildDetailParam(targetId)).then(function(res) {
            statusEl.innerText = "抓取成功，正在回传电脑...";
            
            // 直接把数据打印到日志，电脑通过数据线截获
            var payload = { itemId: targetId, alldetail: res };
            console.log("TASK_DATA_START::" + JSON.stringify(payload) + "::TASK_DATA_END");
            
            statusEl.innerText = "全部完成！请关闭此页。";
            statusEl.style.color = "green";
        }).catch(function (e) {
            statusEl.innerText = "详情抓取失败: " + JSON.stringify(e);
        });
    }).catch(function(e) {
        statusEl.innerText = "搜索失败，请重试...";
    });
  }
})();
