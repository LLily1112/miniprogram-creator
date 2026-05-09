Page({
  data: {
    scriptCount: 0,
    showProfileModal: false,
    showAboutModal: false,
    profile: {
      identity: '',
      customIdentity: '',
      ageRange: '',
      cityLevel: '',
      interests: [],
      customKeywords: []
    },
    identityOptions: ['打工人', '学生', '宝妈', '退休人员', '自由职业', '创业者'],
    ageOptions: ['18-25', '26-35', '36-45', '45+'],
    cityOptions: ['一线城市', '二线城市', '三线城市', '四线及以下'],
    interestOptions: ['职场', '带娃', '省钱', '旅行', '美食', '读书', '健身', '摄影', '美妆', '家居', '情感', '理财'],
    newKeyword: ''
  },

  onLoad: function() {
    this.loadProfile();
    this.loadScriptCount();
  },

  onShow: function() {
    this.loadScriptCount();
  },

  loadProfile: function() {
    var profile = wx.getStorageSync('userProfile') || {};
    this.setData({
      profile: {
        identity: profile.identity || '',
        customIdentity: profile.customIdentity || '',
        ageRange: profile.ageRange || '',
        cityLevel: profile.cityLevel || '',
        interests: profile.interests || [],
        customKeywords: profile.customKeywords || []
      }
    });
  },

  loadScriptCount: function() {
    var scripts = wx.getStorageSync('savedScripts') || [];
    this.setData({ scriptCount: scripts.length });
  },

  editProfile: function() {
    this.setData({ showProfileModal: true });
  },

  closeProfileModal: function() {
    this.setData({ showProfileModal: false });
  },

  setIdentity: function(e) {
    var value = e.currentTarget.dataset.value;
    var profile = this.data.profile;
    profile.identity = value;
    profile.customIdentity = '';
    this.setData({ profile: profile });
  },

  setAgeRange: function(e) {
    var value = e.currentTarget.dataset.value;
    var profile = this.data.profile;
    profile.ageRange = value;
    this.setData({ profile: profile });
  },

  setCityLevel: function(e) {
    var value = e.currentTarget.dataset.value;
    var profile = this.data.profile;
    profile.cityLevel = value;
    this.setData({ profile: profile });
  },

  onCustomIdentityInput: function(e) {
    var profile = this.data.profile;
    profile.customIdentity = e.detail.value;
    profile.identity = '';
    this.setData({ profile: profile });
  },

  onKeywordInput: function(e) {
    this.setData({ newKeyword: e.detail.value });
  },

  addCustomKeyword: function() {
    var keyword = this.data.newKeyword.trim();
    if (!keyword) {
      wx.showToast({ title: '请输入关键词', icon: 'none' });
      return;
    }
    
    var profile = this.data.profile;
    if (profile.customKeywords.length >= 10) {
      wx.showToast({ title: '最多添加10个关键词', icon: 'none' });
      return;
    }
    
    if (profile.customKeywords.indexOf(keyword) !== -1) {
      wx.showToast({ title: '关键词已存在', icon: 'none' });
      return;
    }
    
    profile.customKeywords.push(keyword);
    this.setData({
      profile: profile,
      newKeyword: ''
    });
  },

  removeKeyword: function(e) {
    var index = e.currentTarget.dataset.index;
    var profile = this.data.profile;
    profile.customKeywords.splice(index, 1);
    this.setData({ profile: profile });
  },

  isInterestSelected: function(value) {
    var interests = this.data.profile.interests;
    for (var i = 0; i < interests.length; i++) {
      if (interests[i] === value) {
        return true;
      }
    }
    return false;
  },

  toggleInterest: function(e) {
    var value = e.currentTarget.dataset.value;
    var profile = this.data.profile;
    var interests = profile.interests;

    var index = -1;
    for (var i = 0; i < interests.length; i++) {
      if (interests[i] === value) {
        index = i;
        break;
      }
    }

    if (index >= 0) {
      interests.splice(index, 1);
    } else {
      if (interests.length >= 5) {
        wx.showToast({ title: '最多选择5个', icon: 'none' });
        return;
      }
      interests.push(value);
    }

    profile.interests = interests;
    this.setData({ profile: profile });
  },

  saveProfile: function() {
    wx.setStorageSync('userProfile', this.data.profile);
    wx.showToast({ title: '保存成功', icon: 'success' });
    this.setData({ showProfileModal: false });
  },

  goToScripts: function() {
    var scripts = wx.getStorageSync('savedScripts') || [];
    if (scripts.length === 0) {
      wx.showToast({ title: '暂无脚本', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '我的脚本',
      content: scripts.length + '条脚本',
      showCancel: false
    });
  },

  goToAnalytics: function() {
    wx.navigateTo({
      url: '/pages/analytics/analytics'
    });
  },

  goToSettings: function() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  clearCache: function() {
    wx.showModal({
      title: '确认清理',
      content: '确定要清理所有缓存数据吗？',
      success: function(res) {
        if (res.confirm) {
          wx.clearStorageSync();
          this.setData({ scriptCount: 0 });
          wx.showToast({ title: '清理成功', icon: 'success' });
        }
      }.bind(this)
    });
  },

  showAbout: function() {
    this.setData({ showAboutModal: true });
  },

  closeAboutModal: function() {
    this.setData({ showAboutModal: false });
  }
});
