// 小程序全局逻辑
const config = require('./config.js');
App({
  onLaunch() {
    if (!wx.getStorageSync('cart')) {
      wx.setStorageSync('cart', {});
    }
  },
  globalData: {
    baseUrl: config.BASE_URL,
    appName: config.APP_NAME,
    version: config.VERSION
  }
});
