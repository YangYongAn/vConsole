import * as tool from '../lib/tool.js';

(function (window) {
  function _log(args, type) {
    var log = {
      '■': [],
      W: api.winName,
      F: api.frameName,
      U: location.pathname.split('/html/')[1]
    };

    for (var i = 0; i < args.length; i++) {
      if (typeof args[i] == 'object') {
        log['■'][i] = JSON.stringify(args[i]);
      } else {
        log['■'][i] = args[i];
      }
    }

    return JSON.stringify(log);

  }

  /**
   * 普通日志
   * @param 任意类型 多个使用,分割
   */
  function log() {
    console.log(_log(arguments));
  }

  /**
   * 错误日志
   */
  function error() {
    console.error(_log(arguments));
  }

  /**
   * 警告日志
   */
  function warn() {
    console.warn(_log(arguments));
  }

  window.L = window.log = tool.isAC() ? log : console.log;
  window.E = window.error = tool.isAC() ? error : console.error;
  window.W = window.warn = tool.isAC() ? warn : console.warn;
})(window)