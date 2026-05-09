Page({
  data: {
    apiKey: '',
    showApiKey: false,
    tianxingKey: ''
  },

  onLoad: function() {
    this.loadApiKeys();
  },

  loadApiKeys: function() {
    var deepseekKey = wx.getStorageSync('deepseekApiKey') || '';
    var tianxingKey = wx.getStorageSync('tianxingApiKey') || '';
    
    this.setData({
      apiKey: deepseekKey,
      tianxingKey: tianxingKey
    });
  },

  onApiKeyInput: function(e) {
    this.setData({ apiKey: e.detail.value });
  },

  onTianxingInput: function(e) {
    this.setData({ tianxingKey: e.detail.value });
  },

  toggleVisibility: function() {
    this.setData({ showApiKey: !this.data.showApiKey });
  },

  saveApiKey: function() {
    var apiKey = this.data.apiKey.trim();
    
    if (!apiKey) {
      wx.showToast({
        title: '请输入API密钥',
        icon: 'none'
      });
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      wx.showToast({
        title: '密钥格式不正确',
        icon: 'none'
      });
      return;
    }

    wx.setStorageSync('deepseekApiKey', apiKey);
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  saveTianxingKey: function() {
    var apiKey = this.data.tianxingKey.trim();
    
    wx.setStorageSync('tianxingApiKey', apiKey);
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  testConnection: function() {
    var apiKey = this.data.apiKey.trim();
    
    if (!apiKey) {
      wx.showToast({
        title: '请先保存API密钥',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '测试连接中...'
    });

    var postData = JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'user', content: '你好，请回复"连接成功"' }
      ],
      stream: false
    });

    var that = this;
    wx.request({
      url: 'https://api.deepseek.com/v1/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      data: postData,
      success: function(res) {
        wx.hideLoading();
        
        if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices[0]) {
          wx.showModal({
            title: '✅ 连接成功',
            content: 'DeepSeek API 配置正确，可以正常使用AI脚本生成功能',
            showCancel: false
          });
        } else if (res.statusCode === 401) {
          wx.showModal({
            title: '❌ 密钥错误',
            content: 'API密钥无效，请检查是否正确',
            showCancel: false
          });
        } else {
          var errorMsg = res.data && res.data.error ? res.data.error.message : '未知错误';
          wx.showModal({
            title: '❌ 连接失败',
            content: errorMsg,
            showCancel: false
          });
        }
      },
      fail: function(err) {
        wx.hideLoading();
        
        wx.showModal({
          title: '❌ 网络错误',
          content: '网络请求失败，请检查网络连接',
          showCancel: false
        });
      }
    });
  }
});
