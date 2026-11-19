// 消费记录页（tabBar「我的」）
const fetch = require('../../utils/fetch.js');
const util = require('../../utils/util.js');

Page({
  data: {
    avatar: '',
    records: [],
    total: '0.00'
  },

  onShow() {
    this.loadRecord();
  },

  // 请求消费记录
  loadRecord() {
    wx.showLoading({ title: '加载中', mask: true });
    fetch('food/record').then((res) => {
      const records = res.record || [];
      // 累加消费总金额
      let total = 0;
      records.forEach((r) => {
        total += Number(r.summoney);
      });
      this.setData({
        avatar: util.imgUrl(res.avatar),
        records: records,
        total: total.toFixed(2)
      });
      wx.hideLoading();
    }).catch(() => {
      wx.hideLoading();
    });
  }
});
