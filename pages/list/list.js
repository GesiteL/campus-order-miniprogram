// 菜品菜单页（含购物车 + 自定义菜品）
// 自定义菜品功能为作品改造新增：数据存 wx.setStorageSync('customFoods')，不经过后端
const fetch = require('../../utils/fetch.js');
const util = require('../../utils/util.js');

Page({
  data: {
    list: [],           // [{ name, foods: [{id,name,desc,image,price,month_sales,rating,custom?}] }]
    fullList: [],       // 未过滤的全量分类副本（搜索改造新增，过滤不破坏原数据）
    searchKeyword: '',  // 搜索关键字（搜索改造新增）
    categories: [],     // 左侧分类 [{ name }]
    activeIndex: 0,     // 当前选中的分类下标
    scrollIntoView: '', // 右侧滚动定位的锚点 id
    sectionTops: [],    // 各分类区块相对滚动容器的顶部距离，用于滚动联动

    cartMap: {},        // 购物车原始数据 { id: {id,name,price,image,num} }
    cartList: [],       // 购物车数组（用于渲染）
    counts: {},         // { id: num } 供右侧菜品快速显示数量
    totalCount: 0,      // 商品总数量
    totalPrice: '0.00', // 合计金额
    showCart: false,     // 是否展开购物车面板

    // 自定义菜品弹层
    showCustomModal: false,
    formName: '',
    formPrice: '',
    formDesc: '',
    editingId: ''       // 空串=新建，非空=编辑该 id
  },

  onLoad() {
    this.loadList();
  },

  // 每次显示时同步购物车（可能在结算页被清空）
  onShow() {
    this.refreshCart(wx.getStorageSync('cart') || {});
  },

  // 拉取菜单数据并整理成轻量结构
  loadList() {
    wx.showLoading({ title: '加载中', mask: true });
    fetch('food/list').then((res) => {
      const list = (res || []).map((cat) => ({
        name: cat.name,
        foods: (cat.foods || []).map((f) => ({
          id: String(f.item_id || f.virtual_food_id),
          name: f.name,
          desc: f.description || '',
          // 优先用 image_url（含具体菜品图），image_path 恒为占位图 001
          image: util.imgUrl(f.image_url || f.image_path),
          // 价格取第一个规格的价格
          price: (f.specfoods && f.specfoods[0]) ? f.specfoods[0].price : 0,
          month_sales: f.month_sales || 0,
          rating: f.rating || 0
        }))
      }));
      // 末尾合并本地自定义菜品分类
      const merged = list.concat(this.buildCustomSection());
      this.setData({
        list: merged,
        fullList: merged,
        categories: merged.map((c) => ({ name: c.name }))
      }, () => {
        this.computeSectionTops();
      });
      wx.hideLoading();
    }).catch(() => {
      wx.hideLoading();
    });
  },

  // 读取本地自定义菜品，组装成分类区块（无数据则返回空数组，不显示该分类）
  buildCustomSection() {
    const customFoods = wx.getStorageSync('customFoods') || [];
    if (customFoods.length === 0) return [];
    return [{
      name: '自定义',
      foods: customFoods.map((f) => ({
        id: f.id,
        name: f.name,
        desc: f.desc || '',
        image: f.image,
        price: f.price,
        month_sales: 0,
        rating: '-',
        custom: true
      }))
    }];
  },

  // 增删改自定义菜品后，重建列表并重新计算联动锚点
  reloadCustom() {
    const base = (this.data.fullList.length ? this.data.fullList : this.data.list)
      .filter((c) => c.name !== '自定义');
    const merged = base.concat(this.buildCustomSection());
    this.setData({
      list: merged,
      fullList: merged,
      categories: merged.map((c) => ({ name: c.name }))
    }, () => {
      this.computeSectionTops();
    });
  },

  // 搜索输入（改造新增）
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value }, () => {
      this.applyFilter();
    });
  },

  // 按菜名子串过滤；空分类自动隐藏；清空关键字恢复全量；源数据取 fullList 不被破坏
  applyFilter() {
    const kw = this.data.searchKeyword.trim();
    let source = this.data.fullList;
    if (kw) {
      source = source
        .map((c) => ({
          name: c.name,
          foods: (c.foods || []).filter((f) => f.name.indexOf(kw) !== -1)
        }))
        .filter((c) => c.foods.length > 0);
    }
    this.setData({
      list: source,
      categories: source.map((c) => ({ name: c.name }))
    }, () => {
      this.computeSectionTops();
    });
  },

  // 计算每个分类区块的顶部位置，供右侧滚动时反向高亮左侧分类
  computeSectionTops() {
    const query = wx.createSelectorQuery().in(this);
    query.selectAll('.cate-section').boundingClientRect();
    query.select('.food-scroll').boundingClientRect();
    query.exec((res) => {
      const rects = res[0] || [];
      const scroll = res[1] || { top: 0 };
      const tops = rects.map((r) => r.top - scroll.top);
      this.setData({ sectionTops: tops });
    });
  },

  // 点击左侧分类：高亮 + 右侧滚动到对应区块
  onCategoryTap(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      activeIndex: index,
      scrollIntoView: 'cate-' + index
    });
  },

  // 右侧滚动时联动左侧分类高亮
  onFoodScroll(e) {
    const scrollTop = e.detail.scrollTop;
    const tops = this.data.sectionTops;
    let active = 0;
    for (let i = 0; i < tops.length; i++) {
      if (scrollTop >= tops[i] - 5) {
        active = i;
      }
    }
    if (active !== this.data.activeIndex) {
      this.setData({ activeIndex: active });
    }
  },

  /* ------------------- 购物车相关 ------------------- */

  // 数量组件统一入口（改造新增）：语义与原三函数完全一致
  onStepperChange(e) {
    const d = e.detail;
    const cart = wx.getStorageSync('cart') || {};
    if (d.type === 'plus') {
      const food = d.food;
      if (cart[food.id]) {
        cart[food.id].num += 1;
      } else {
        cart[food.id] = {
          id: food.id,
          name: food.name,
          price: food.price,
          image: food.image,
          num: 1
        };
      }
    } else {
      if (cart[d.id]) {
        cart[d.id].num -= 1;
        if (cart[d.id].num <= 0) {
          delete cart[d.id];
        }
      }
    }
    this.saveCart(cart);
  },

  // 一键清空
  clearCart() {
    wx.showModal({
      title: '提示',
      content: '确定清空购物车吗？',
      success: (r) => {
        if (r.confirm) {
          this.saveCart({});
        }
      }
    });
  },

  // 保存到本地存储并刷新界面
  saveCart(cart) {
    wx.setStorageSync('cart', cart);
    this.refreshCart(cart);
  },

  // 根据购物车数据重算总数量、合计金额、数量映射
  refreshCart(cart) {
    const cartList = Object.keys(cart).map((k) => cart[k]);
    const counts = {};
    let count = 0;
    let price = 0;
    cartList.forEach((i) => {
      count += i.num;
      price += i.num * i.price;
      counts[i.id] = i.num;
    });
    this.setData({
      cartMap: cart,
      cartList: cartList,
      counts: counts,
      totalCount: count,
      totalPrice: price.toFixed(2),
      // 购物车清空后自动收起面板
      showCart: count > 0 ? this.data.showCart : false
    });
  },

  // 展开 / 收起购物车面板
  toggleCart() {
    if (this.data.totalCount === 0) return;
    this.setData({ showCart: !this.data.showCart });
  },

  hideCart() {
    this.setData({ showCart: false });
  },

  // 阻止面板内部点击冒泡到遮罩
  stopPropagation() {},

  // 去结算
  goBalance() {
    if (this.data.totalCount === 0) {
      wx.showToast({ title: '请先选择商品', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/order/balance/balance' });
  },

  /* ------------------- 自定义菜品 ------------------- */

  // 打开新建弹层
  openCustomModal() {
    this.setData({
      showCustomModal: true,
      formName: '',
      formPrice: '',
      formDesc: '',
      editingId: ''
    });
  },

  closeCustomModal() {
    this.setData({ showCustomModal: false });
  },

  onCustomNameInput(e) {
    this.setData({ formName: e.detail.value });
  },

  onCustomPriceInput(e) {
    this.setData({ formPrice: e.detail.value });
  },

  onCustomDescInput(e) {
    this.setData({ formDesc: e.detail.value });
  },

  // 提交自定义菜品（editingId 为空则新建，否则更新）
  submitCustom() {
    const name = this.data.formName.trim();
    const price = Number(this.data.formPrice);
    if (!name) {
      wx.showToast({ title: '请输入菜名', icon: 'none' });
      return;
    }
    if (!this.data.formPrice || isNaN(price) || price <= 0) {
      wx.showToast({ title: '请输入正确价格', icon: 'none' });
      return;
    }
    let customFoods = wx.getStorageSync('customFoods') || [];
    if (this.data.editingId) {
      customFoods = customFoods.map((f) => {
        if (f.id !== this.data.editingId) return f;
        return Object.assign({}, f, {
          name: name,
          price: price.toFixed(2),
          desc: this.data.formDesc.trim()
        });
      });
    } else {
      customFoods.push({
        id: 'custom_' + Date.now(),
        name: name,
        price: price.toFixed(2),
        desc: this.data.formDesc.trim(),
        image: '/images/images/001.png'
      });
    }
    wx.setStorageSync('customFoods', customFoods);
    this.setData({ showCustomModal: false });
    this.reloadCustom();
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  // 长按自定义菜品：弹出编辑/删除菜单
  onFoodLongPress(e) {
    const food = e.currentTarget.dataset.food;
    wx.showActionSheet({
      itemList: ['编辑', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.editCustom(food);
        } else if (res.tapIndex === 1) {
          this.deleteCustom(food);
        }
      }
    });
  },

  // 编辑：回填表单
  editCustom(food) {
    this.setData({
      showCustomModal: true,
      editingId: food.id,
      formName: food.name,
      formPrice: String(food.price),
      formDesc: food.desc || ''
    });
  },

  // 删除：同时把该菜移出购物车，避免结算页残留
  deleteCustom(food) {
    wx.showModal({
      title: '提示',
      content: '删除「' + food.name + '」？',
      success: (r) => {
        if (!r.confirm) return;
        const customFoods = (wx.getStorageSync('customFoods') || [])
          .filter((f) => f.id !== food.id);
        wx.setStorageSync('customFoods', customFoods);
        const cart = wx.getStorageSync('cart') || {};
        if (cart[food.id]) {
          delete cart[food.id];
          wx.setStorageSync('cart', cart);
        }
        this.reloadCustom();
        this.refreshCart(cart);
        wx.showToast({ title: '已删除', icon: 'none' });
      }
    });
  }
});
