// 订单确认页
const fetch = require('../../../utils/fetch.js');

Page({
  data: {
    cartList: [],
    totalCount: 0,
    totalPrice: '0.00',
    remark: ''
  },

  onLoad() {
    // 从本地存储读取购物车并汇总
    const cart = wx.getStorageSync('cart') || {};
    const cartList = Object.keys(cart).map((k) => cart[k]);
    let count = 0;
    let price = 0;
    cartList.forEach((i) => {
      count += i.num;
      price += i.num * i.price;
    });
    this.setData({
      cartList: cartList,
      totalCount: count,
      totalPrice: price.toFixed(2)
    });
  },

  // 备注输入
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  // 提交订单
  submitOrder() {
    if (this.data.cartList.length === 0) {
      wx.showToast({ title: '购物车为空', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '确认支付',
      content: '需支付 ¥' + this.data.totalPrice + '，是否确认？',
      success: (r) => {
        if (r.confirm) {
          this.doSubmit();
        }
      }
    });
  },

  // 提交 + 支付
  doSubmit() {
    wx.showLoading({ title: '提交中', mask: true });
    const payload = {
      foods: this.data.cartList.map((i) => ({ name: i.name, price: i.price, num: i.num })),
      remark: this.data.remark,
      total: this.data.totalPrice
    };
    // 先下单，再模拟支付
    fetch('food/order', payload, 'POST').then((res) => {
      return fetch('food/pay', { order_id: res.order_id }, 'POST').then(() => res);
    }).then((res) => {
      wx.hideLoading();
      // 下单成功后清空购物车
      wx.setStorageSync('cart', {});
      wx.showToast({ title: '下单成功', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/order/detail/detail?orderId=' + (res.order_id || '') });
      }, 800);
    }).catch(() => {
      wx.hideLoading();
    });
  }
});
