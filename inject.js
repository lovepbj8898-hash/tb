(function () {
  'use strict';
  var W = window;
  var D = document;

  // 1. 渲染界面
  D.body.innerHTML = "<div style='text-align:center;margin-top:50px;font-family:sans-serif;'><h2 style='color:#0f766e;'>tb任务 (全自动版)</h2><p id='status' style='color:#666;'>正在向电脑请求任务...</p></div>";
  var statusEl = D.getElementById('status');

  // 2. 从电脑 127.0.0.1 获取任务
  fetch('http://127.0.0.1:8080/get_task')
    .then(res => res.json())
    .then(task => {
        if (!task || !task.id) {
            statusEl.innerText = "未获取到任务数据";
            return;
        }
        var targetId = task.id;
        var targetTitle = task.title;
        statusEl.innerText = "正在搜索：" + targetTitle;
        
        // 3. 开始淘宝 MTOP 请求
        runTask(targetId, targetTitle);
    })
    .catch(err => {
        statusEl.innerText = "连接电脑失败，请检查数据线";
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
    // 搜索（为了留下正常的搜索轨迹，防封）
    mtopSend('mtop.relationrecommend.MtopRecommend.recommend', buildSearchParam(targetTitle)).then(function(r) {
        statusEl.innerText = "搜索成功，正在拉取详情...";
        // 拉取详情
        mtopSend('mtop.taobao.detail.data.get', buildDetailParam(targetId)).then(function(res) {
            statusEl.innerText = "抓取成功，正在回传电脑...";
            
            // 将数据 POST 回电脑
            fetch('http://127.0.0.1:8080/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: targetId, alldetail: res })
            }).then(() => {
                statusEl.innerText = "全部完成！请关闭此页。";
                statusEl.style.color = "green";
            }).catch(e => {
                statusEl.innerText = "回传电脑失败：" + e;
            });
            
        }).catch(function (e) {
            statusEl.innerText = "详情抓取失败: " + JSON.stringify(e);
            statusEl.style.color = "red";
        });
    }).catch(function(e) {
        statusEl.innerText = "搜索接口异常，直接尝试拉取详情...";
        // 如果搜索失败，兜底直接拉详情
        runTask(targetId, "");
    });
  }
})();
