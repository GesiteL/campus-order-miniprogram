// 订单详情页
const fetch = require('../../../utils/fetch.js');

Page({
  data: {
    order: null,
    total: '0.00'
  },

  onLoad(options) {
    this.loadDetail(options.orderId);
  },

  // 请求订单详情
  loadDetail(orderId) {
    wx.showLoading({ title: '加载中', mask: true });
    fetch('food/order', { order_id: orderId || '' }, 'GET').then((res) => {
      // 计算商品合计金额
      let total = 0;
      (res.foods || []).forEach((f) => {
        total += Number(f.price) * Number(f.num);
      });
      this.setData({
        order: res,
        total: total.toFixed(2)
      });
      wx.hideLoading();
    }).catch(() => {
      wx.hideLoading();
    });
  },

  // 返回首页
  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  // 查看全部订单
  goOrders() {
    wx.switchTab({ url: '/pages/order/list/list' });
  }
});
