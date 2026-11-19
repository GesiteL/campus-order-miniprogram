// 基于 Promise 封装的网络请求模块
// 改造：baseUrl 从 config.js 读取；加 timeout；错误分类提示
const config = require('../config.js');

function fetch(path, data = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.BASE_URL}/${path}`,
      method: method,
      data: data,
      timeout: 8000,
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          wx.showToast({ title: '服务器错误 ' + res.statusCode, icon: 'none' });
          reject(res);
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络错误，请检查后端服务', icon: 'none' });
        reject(err);
      }
    });
  });
}

module.exports = fetch;
