/*
Tencent is pleased to support the open source community by making vConsole available.

Copyright (C) 2017 THL A29 Limited, a Tencent company. All rights reserved.

Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
http://opensource.org/licenses/MIT

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * vConsole Storage Plugin
 */

import VConsolePlugin from '../lib/plugin.js';
import tplTabbox from './tabbox.html';
import tplList from './list.html';

import * as tool from '../lib/tool.js';
import $ from '../lib/query.js';
import {getDate} from "../lib/tool";

class VConsoleStorageTab extends VConsolePlugin {

  constructor(...args) {
    super(...args);

    this.$tabbox = $.render(tplTabbox, {});
    this.currentType = ''; // cookies, localstorage, ...
    this.typeNameMap = {
      'cookies': 'Cookies',
      'localstorage': 'LocalStorage',
      'sessionstorage': 'SessionStorage'
    }

    if (tool.isAC()) {
      this.typeNameMap['prefs'] = 'Prefs'
    }

  }

  onRenderTab(callback) {
    callback(this.$tabbox);
  }

  onAddTopBar(callback) {
    let that = this;
    let types = ['Cookies', 'LocalStorage', 'SessionStorage'];

    if (tool.isAC()) {
      types.unshift('Prefs')
    }

    let btnList = [];
    for (let i = 0; i < types.length; i++) {
      btnList.push({
        name: types[i],
        data: {
          type: types[i].toLowerCase()
        },
        className: '',
        onClick: function () {
          if (!$.hasClass(this, 'vc-actived')) {
            that.currentType = this.dataset.type;
            that.renderStorage();
          } else {
            return false;
          }
        }
      });
    }
    btnList[0].className = 'vc-actived';
    callback(btnList);
  }

  onAddTool(callback) {
    let that = this;
    let toolList = [{
      name: 'Refresh',
      global: false,
      onClick: function (e) {
        that.renderStorage();
      }
    }, {
      name: 'Clear',
      global: false,
      onClick: function (e) {
        that.clearLog();
      }
    }];
    callback(toolList);
  }

  onReady() {
    // do nothing
  }

  onShow() {
    // show default panel
    if (this.currentType == '') {
      this.currentType = 'prefs';
      this.renderStorage();
    }
  }

  clearLog() {
    if (this.currentType && window.confirm) {
      if (this.currentType === 'prefs') {
        this.clearPrefsStorageList();
      } else {
        let result = window.confirm('Remove all ' + this.typeNameMap[this.currentType] + '?');
        if (!result) {
          return false;
        }
      }


    }
    switch (this.currentType) {
      case 'cookies':
        this.clearCookieList();
        break;
      case 'localstorage':
        this.clearLocalStorageList();
        break;
      case 'sessionstorage':
        this.clearSessionStorageList();
        break;
      case 'prefs':
        this.clearPrefsStorageList();
        break;
      default:
        return false;
    }
    this.renderStorage();
  }

  renderStorage() {
    let list = [];

    switch (this.currentType) {
      case 'cookies':
        list = this.getCookieList();
        break;
      case 'localstorage':
        list = this.getLocalStorageList();
        break;
      case 'sessionstorage':
        list = this.getSessionStorageList();
        break;
      case 'prefs':
        list = this.getPrefsList();
        break;
      default:
        return false;
    }

    let $log = $.one('.vc-log', this.$tabbox);
    if (list.length == 0) {
      $log.innerHTML = '';
    } else {
      // html encode for rendering
      for (let i = 0; i < list.length; i++) {
        list[i].name = tool.htmlEncode(list[i].name);
        list[i].value = tool.htmlEncode('[' + typeof list[i].value + ']' + JSON.stringify(list[i].value));
        if (list[i].expires) {
          list[i].expires = tool.htmlEncode(list[i].expires);
        }
      }
      $log.innerHTML = $.render(tplList, {list: list}, true);
    }
  }

  getCookieList() {
    if (!document.cookie || !navigator.cookieEnabled) {
      return [];
    }

    let list = [];
    let items = document.cookie.split(';');
    for (let i = 0; i < items.length; i++) {
      let item = items[i].split('=');
      let name = item.shift().replace(/^ /, ''),
        value = item.join('=');
      try {
        name = decodeURIComponent(name);
        value = decodeURIComponent(value);
      } catch (e) {
        console.log(e, name, value);
      }
      list.push({
        name: name,
        value: value
      });
    }
    return list;
  }

  getLocalStorageList() {
    if (!window.localStorage) {
      return [];
    }

    try {
      let list = []
      for (var i = 0; i < localStorage.length; i++) {
        let name = localStorage.key(i),
          value = localStorage.getItem(name);
        list.push({
          name: name,
          value: value
        });
      }
      return list;
    } catch (e) {
      return [];
    }
  }


  getSessionStorageList() {
    if (!window.sessionStorage) {
      return [];
    }

    try {
      let list = []
      for (var i = 0; i < sessionStorage.length; i++) {
        let name = sessionStorage.key(i),
          value = sessionStorage.getItem(name);
        list.push({
          name: name,
          value: value
        });
      }
      return list;
    } catch (e) {
      return [];
    }
  }


  getPrefsList() {
    try {
      let list = [];

      //同步返回结果：
      var _dataList = api.getPrefs({sync: true, key: '_dataList'});
      if (_dataList) {
        _dataList = JSON.parse(_dataList)
        for (var i = 0; i < _dataList.length; i++) {
          let name = _dataList[i];
          let _ret = api.getPrefs({sync: true, key: name});
          try {
            _ret = JSON.parse(_ret);
            list.push({
              name: name,
              value: _ret._value,
              expires: new Date(_ret._expires).toLocaleString()
            });
          } catch (e) {//如果不能解析为对象 说明可能是原始方式设置的数据
            list.push({
              name: name,
              value: _ret,
              expires: '原生设定'
            });
          }
        }

      }


      return list;
    } catch (e) {
      return [];
    }
  }


  clearCookieList() {
    if (!document.cookie || !navigator.cookieEnabled) {
      return;
    }
    let hostname = window.location.hostname;
    let list = this.getCookieList();
    for (var i = 0; i < list.length; i++) {
      let name = list[i].name;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${hostname.split('.').slice(-2).join('.')}`;
    }
    this.renderStorage();
  }

  clearLocalStorageList() {
    if (!!window.localStorage) {
      try {
        localStorage.clear();
        this.renderStorage();
      } catch (e) {
        alert('localStorage.clear() fail.');
      }
    }
  }

  clearSessionStorageList() {
    if (!!window.sessionStorage) {
      try {
        sessionStorage.clear();
        this.renderStorage();
      } catch (e) {
        alert('sessionStorage.clear() fail.');
      }
    }
  }


  clearPrefsStorageList() {
    api.confirm({
      title: '确认清除所有的偏好数据吗',
      msg: '清除偏好数据是一个非常危险的操作,很多App运行需要依赖某些数据.请再次确认.清除完毕后将会重启App',
      buttons: ['确定', '取消']
    }, function (ret, err) {
      let index = ret.buttonIndex;
      if (index === 1) {
        var _dataList = api.getPrefs({sync: true, key: '_dataList'});
        if (_dataList) {
          _dataList = JSON.parse(_dataList);
          if (_dataList.length) {
            for (var i = 0; i < _dataList.length; i++) {
              api.removePrefs({
                key: _dataList[i]
              });
            }

            api.setPrefs({
              key: '_dataList',
              value: '[]'
            });

            setTimeout(() => {
              api.rebootApp();
            }, 1000)
          } else {
            alert('暂无数据,无需清除');
          }
        } else {
          alert('暂无数据,清理失败');
        }
      }
    });
  }


} // END Class

export default VConsoleStorageTab;