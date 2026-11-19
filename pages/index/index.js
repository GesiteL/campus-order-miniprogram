// 首页逻辑
const fetch = require('../../utils/fetch.js');
const util = require('../../utils/util.js');

Page({
  data: {
    banners: [],     // 轮播图
    imageAd: '',      // 中部广告图
    recommends: []    // 底部推荐图
  },

  onLoad() {
    this.loadIndex();
  },

  // 拉取首页数据
  loadIndex() {
    wx.showLoading({ title: '加载中', mask: true });
    fetch('food/index').then((res) => {
      // 后端返回数组，取第一项
      const info = (res && res[0]) || {};
      this.setData({
        banners: (info.imgUrls || []).map((i) => ({ id: i.id, src: util.imgUrl(i.src) })),
        imageAd: util.imgUrl(info.image_ad),
        recommends: (info.image_bottom || []).map((i) => ({ id: i.id, src: util.imgUrl(i.src) }))
      });
      wx.hideLoading();
    }).catch(() => {
      wx.hideLoading();
    });
  },

  // 点击「开启点餐之旅」跳转菜单页
  goList() {
    wx.navigateTo({ url: '/pages/list/list' });
  }
});
