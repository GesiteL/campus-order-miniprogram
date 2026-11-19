// 订单列表页（tabBar）
const fetch = require('../../../utils/fetch.js');

Page({
  data: {
    orders: [],     // 订单数组
    lastId: 0,      // 分页游标
    isLast: false,  // 是否已到最后一页
    loading: false  // 是否正在加载
  },

  // 每次进入重新加载，保证下单后能看到最新数据
  onShow() {
    this.reset();
  },

  // 重置并加载第一页
  reset() {
    this.setData({ orders: [], lastId: 0, isLast: false }, () => {
      this.loadMore();
    });
  },

  // 加载更多（分页）
  loadMore() {
    if (this.data.isLast || this.data.loading) return;
    this.setData({ loading: true });
    fetch('food/orderlist', { last_id: this.data.lastId }, 'GET').then((res) => {
      this.setData({
        orders: this.data.orders.concat(res.list || []),
        lastId: res.last_id,
        isLast: res.is_last,
        loading: false
      });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  // 上拉触底加载更多
  onReachBottom() {
    this.loadMore();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ orders: [], lastId: 0, isLast: false }, () => {
      this.loadMore();
      wx.stopPullDownRefresh();
    });
  },

  // 查看详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/order/detail/detail?orderId=' + id });
  }
});
