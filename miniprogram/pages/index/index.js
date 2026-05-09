Page({
  data: {
    hotTopics: [],
    originalTopics: [],
    loading: true,
    refreshing: false,
    showDetail: false,
    currentTopic: null,
    collectedIds: [],
    currentTab: 'douyin',
    tabs: [
      { id: 'douyin', name: '抖音', icon: '🎵', apiType: 'douyinhot' },
      { id: 'toutiao', name: '头条', icon: '📰', apiType: 'toutiaoHot' }
    ],
    lastUpdateTime: '',
    searchKeyword: ''
  },

  onLoad: function() {
    console.log('index onLoad');
    this.loadCollectedTopics();
    this.loadHotTopics();
  },

  onShow: function() {
    this.loadCollectedTopics();
  },

  onPullDownRefresh: function() {
    console.log('下拉刷新触发');
    this.loadHotTopics(true);
  },

  onShareAppMessage: function() {
    return {
      title: '自媒体创作助手 - 热点话题榜',
      path: '/pages/index/index'
    };
  },

  loadCollectedTopics: function() {
    var collected = wx.getStorageSync('collectedTopics') || [];
    var ids = [];
    for (var i = 0; i < collected.length; i++) {
      ids.push(collected[i].id);
    }
    this.setData({ collectedIds: ids });
  },

  loadHotTopics: function(refresh = false) {
    var that = this;
    
    if (refresh) {
      this.setData({ refreshing: true });
    } else {
      this.setData({ loading: true });
    }

    var currentTab = this.data.currentTab;
    var apiType = 'douyinhot';
    
    for (var i = 0; i < this.data.tabs.length; i++) {
      if (this.data.tabs[i].id === currentTab) {
        apiType = this.data.tabs[i].apiType;
        break;
      }
    }

    var apiUrl = 'https://dabenshi.cn/other/api/hot.php?type=' + apiType + '&timestamp=' + Date.now();
    
    console.log('请求API:', apiUrl);

    wx.request({
      url: apiUrl,
      method: 'GET',
      timeout: 10000,
      success: function(res) {
        console.log('API返回:', res);
        
        if (res.statusCode === 200 && res.data) {
          var topics = that.parseHotTopics(res.data, currentTab);
          
          if (topics && topics.length > 0) {
            for (var i = 0; i < topics.length; i++) {
              topics[i].isCollected = that.isCollected(topics[i].id);
            }
            
            that.setData({
              hotTopics: topics,
              originalTopics: topics,
              loading: false,
              refreshing: false,
              lastUpdateTime: new Date().toLocaleTimeString()
            });
            
            wx.stopPullDownRefresh();
            
            if (refresh) {
              wx.showToast({
                title: '刷新成功',
                icon: 'success',
                duration: 1500
              });
            }
          } else {
            console.log('解析数据为空，使用Mock数据');
            wx.stopPullDownRefresh();
            that.loadMockData();
          }
        } else {
          console.log('API返回数据格式错误，使用Mock数据');
          wx.stopPullDownRefresh();
          that.loadMockData();
        }
      },
      fail: function(err) {
        console.error('API请求失败:', err);
        wx.stopPullDownRefresh();
        wx.showToast({
          title: '网络错误，使用Mock数据',
          icon: 'none',
          duration: 2000
        });
        that.loadMockData();
      }
    });
  },

  parseHotTopics: function(data, tabType) {
    var topics = [];
    
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      if (data.success && data.data && Array.isArray(data.data)) {
        var list = data.data;
        
        for (var i = 0; i < list.length; i++) {
          var item = list[i];
          
          var title = item.title || item.word || '话题' + (i + 1);
          if (!title.startsWith('#')) {
            title = '#' + title + '#';
          }
          
          var heatValue = item.hot || item.hot_value || item.value || '0';
          if (typeof heatValue === 'number') {
            heatValue = this.formatHeatValue(heatValue);
          }
          
          var topic = {
            id: (item.id || item.index || (i + 1)).toString(),
            rank: item.index || (i + 1),
            title: title,
            desc: item.desc || item.summary || '超' + heatValue + '人关注',
            heatValue: heatValue,
            heatNum: parseInt(item.hot_value) || this.parseHeatNumber(heatValue),
            trend: item.trend || '+' + Math.floor(Math.random() * 15 + 5) + '%',
            trendUp: true,
            isHot: i < 3,
            isNew: item.isNew || Math.random() > 0.85,
            category: this.getCategory(title, tabType),
            videos: this.generateVideos(title),
            words: this.generateWords(title)
          };
          
          topics.push(topic);
        }
      } else {
        console.log('API返回格式不符合预期:', JSON.stringify(data).substring(0, 200));
        return null;
      }
    } catch (error) {
      console.error('解析数据失败:', error);
      return null;
    }
    
    if (topics.length === 0) {
      return null;
    }
    
    return topics;
  },
  
  parseHeatNumber: function(heatStr) {
    if (typeof heatStr === 'number') return heatStr;
    if (!heatStr) return 0;
    heatStr = heatStr.toString();
    var num = parseFloat(heatStr);
    if (heatStr.indexOf('亿') !== -1) {
      return num * 100000000;
    } else if (heatStr.indexOf('万') !== -1) {
      return num * 10000;
    }
    return num;
  },

  formatHeatValue: function(num) {
    if (num >= 100000000) {
      return (num / 100000000).toFixed(1) + '亿';
    } else if (num >= 10000) {
      return (num / 10000).toFixed(0) + '万';
    }
    return num.toString();
  },

  getCategory: function(title, tabType) {
    var categories = ['职场', '生活', '情感', '理财', '美食', '娱乐', '健康', '科技', '教育', '社会'];
    
    if (title.includes('钱') || title.includes('攒') || title.includes('理财')) {
      return '理财';
    } else if (title.includes('职场') || title.includes('工作') || title.includes('上班')) {
      return '职场';
    } else if (title.includes('美食') || title.includes('吃饭') || title.includes('做菜')) {
      return '美食';
    } else if (title.includes('情感') || title.includes('爱情') || title.includes('分手')) {
      return '情感';
    } else if (title.includes('健康') || title.includes('减肥') || title.includes('养生')) {
      return '健康';
    } else if (title.includes('教育') || title.includes('考试') || title.includes('学习')) {
      return '教育';
    }
    
    var hash = title.split('').reduce(function(acc, char) { return acc + char.charCodeAt(0); }, 0);
    return categories[hash % categories.length];
  },

  generateVideos: function(title) {
    return [
      { title: '关于' + title.replace(/#/g, '') + '的真实故事', likes: Math.floor(Math.random() * 50000 + 10000) + '', comments: Math.floor(Math.random() * 3000 + 500) + '' },
      { title: title.replace(/#/g, '') + '的正确打开方式', likes: Math.floor(Math.random() * 30000 + 8000) + '', comments: Math.floor(Math.random() * 2000 + 300) + '' },
      { title: '没想到' + title.replace(/#/g, '') + '还能这样', likes: Math.floor(Math.random() * 40000 + 12000) + '', comments: Math.floor(Math.random() * 2500 + 400) + '' }
    ];
  },

  generateWords: function(title) {
    var baseWords = ['生活', '工作', '学习', '成长', '改变', '选择', '坚持', '梦想', '努力', '收获'];
    var shuffled = baseWords.sort(function() { return 0.5 - Math.random(); });
    return shuffled.slice(0, 6);
  },

  loadMockData: function() {
    console.log('加载Mock数据');
    
    var mockData = this.getMockData();
    
    for (var i = 0; i < mockData.length; i++) {
      mockData[i].isCollected = this.isCollected(mockData[i].id);
      var randomTrend = Math.floor(Math.random() * 15 + 5);
      mockData[i].trend = '+' + randomTrend + '%';
      mockData[i].trendUp = randomTrend > 0;
      
      var baseHeat = 9000000 - i * 600000;
      var randomHeat = Math.floor(Math.random() * 1000000);
      mockData[i].heatNum = baseHeat + randomHeat;
      mockData[i].heatValue = this.formatHeatValue(mockData[i].heatNum);
      mockData[i].desc = '超' + mockData[i].heatValue + '人关注';
    }
    
    this.setData({
      hotTopics: mockData,
      originalTopics: mockData,
      loading: false,
      refreshing: false,
      lastUpdateTime: new Date().toLocaleTimeString()
    });
    
    wx.stopPullDownRefresh();
    
    console.log('Mock数据加载完成，共', mockData.length, '条');
  },

  getMockData: function() {
    return [
      { id: '1', rank: 1, title: '#打工人早起困难#', heatValue: '1023万', isHot: true, isNew: false, category: '职场' },
      { id: '2', rank: 2, title: '#当代年轻人攒钱#', heatValue: '892万', isHot: true, isNew: false, category: '理财' },
      { id: '3', rank: 3, title: '#全职妈妈的一天#', heatValue: '756万', isHot: true, isNew: false, category: '生活' },
      { id: '4', rank: 4, title: '#社恐人的周末#', heatValue: '623万', isHot: false, isNew: true, category: '情感' },
      { id: '5', rank: 5, title: '#租房改造#', heatValue: '589万', isHot: false, isNew: false, category: '生活' },
      { id: '6', rank: 6, title: '#30岁人生感悟#', heatValue: '512万', isHot: false, isNew: true, category: '情感' },
      { id: '7', rank: 7, title: '#一人食晚餐#', heatValue: '467万', isHot: false, isNew: false, category: '美食' },
      { id: '8', rank: 8, title: '#极简生活#', heatValue: '423万', isHot: false, isNew: false, category: '生活' },
      { id: '9', rank: 9, title: '#下班后的副业#', heatValue: '398万', isHot: false, isNew: true, category: '职场' },
      { id: '10', rank: 10, title: '#独居女孩安全感#', heatValue: '356万', isHot: false, isNew: false, category: '生活' }
    ];
  },

  onRefresh: function() {
    console.log('手动刷新');
    this.loadHotTopics(true);
  },

  onTopicTap: function(e) {
    console.log('点击话题', e.currentTarget.dataset);
    var id = e.currentTarget.dataset.id;
    var topics = this.data.hotTopics;
    var topic = null;

    for (var i = 0; i < topics.length; i++) {
      if (topics[i].id === id) {
        topic = topics[i];
        break;
      }
    }

    if (topic) {
      this.setData({
        currentTopic: topic,
        showDetail: true
      });
    }
  },

  closeDetail: function() {
    this.setData({
      showDetail: false,
      currentTopic: null
    });
  },

  stopPropagation: function() {
    
  },

  onCollectTopic: function(e) {
    e.stopPropagation();
    var id = e.currentTarget.dataset.id;
    var topic = null;
    var topics = this.data.hotTopics;

    for (var i = 0; i < topics.length; i++) {
      if (topics[i].id === id) {
        topic = topics[i];
        break;
      }
    }

    if (!topic) return;

    var collected = wx.getStorageSync('collectedTopics') || [];
    var isCollected = false;
    var index = -1;

    for (var j = 0; j < collected.length; j++) {
      if (collected[j].id === id) {
        isCollected = true;
        index = j;
        break;
      }
    }

    if (isCollected) {
      collected.splice(index, 1);
      wx.setStorageSync('collectedTopics', collected);
      
      var newIds = [];
      for (var k = 0; k < collected.length; k++) {
        newIds.push(collected[k].id);
      }
      
      for (var m = 0; m < topics.length; m++) {
        topics[m].isCollected = newIds.indexOf(topics[m].id) !== -1;
      }
      
      this.setData({
        collectedIds: newIds,
        hotTopics: topics
      });
      
      wx.showToast({ title: '已取消收藏', icon: 'success' });
    } else {
      collected.push({
        id: topic.id,
        title: topic.title,
        category: topic.category,
        heatValue: topic.heatValue,
        collectedAt: Date.now()
      });
      wx.setStorageSync('collectedTopics', collected);
      
      var newCollectedIds = this.data.collectedIds;
      newCollectedIds.push(id);
      
      for (var n = 0; n < topics.length; n++) {
        topics[n].isCollected = newCollectedIds.indexOf(topics[n].id) !== -1;
      }
      
      this.setData({
        collectedIds: newCollectedIds,
        hotTopics: topics
      });
      
      wx.showToast({ title: '收藏成功', icon: 'success' });
    }
  },

  isCollected: function(id) {
    var collected = wx.getStorageSync('collectedTopics') || [];
    for (var i = 0; i < collected.length; i++) {
      if (collected[i].id === id) {
        return true;
      }
    }
    return false;
  },

  onTabChange: function(e) {
    var tabId = e.currentTarget.dataset.id;
    this.setData({ currentTab: tabId, loading: true, searchKeyword: '' });
    this.loadHotTopics();
  },

  useTopic: function() {
    var topic = this.data.currentTopic;
    if (!topic) return;

    wx.setStorageSync('selectedTopicForCreate', topic);
    
    this.closeDetail();
    
    wx.showToast({
      title: '已选择话题',
      icon: 'success'
    });
    
    var that = this;
    setTimeout(function() {
      wx.switchTab({
        url: '/pages/create/create'
      });
    }, 1500);
  },

  onSearchInput: function(e) {
    var keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterTopics(keyword);
  },

  onSearch: function() {
    var keyword = this.data.searchKeyword;
    this.filterTopics(keyword);
  },

  clearSearch: function() {
    this.setData({ searchKeyword: '' });
    this.filterTopics('');
  },

  filterTopics: function(keyword) {
    if (!keyword || keyword.trim() === '') {
      this.setData({ hotTopics: this.data.originalTopics });
      return;
    }

    keyword = keyword.toLowerCase();
    var originalTopics = this.data.originalTopics;
    var matchedTopics = [];

    for (var i = 0; i < originalTopics.length; i++) {
      var topic = originalTopics[i];
      if (topic.title.toLowerCase().indexOf(keyword) !== -1 || 
          topic.category.toLowerCase().indexOf(keyword) !== -1 ||
          topic.desc.toLowerCase().indexOf(keyword) !== -1) {
        matchedTopics.push(topic);
      }
    }

    if (matchedTopics.length === 0) {
      matchedTopics = this.generateCustomTopics(keyword);
    }

    this.setData({ hotTopics: matchedTopics });
  },

  generateCustomTopics: function(keyword) {
    var categories = ['职场', '生活', '情感', '理财', '美食', '娱乐', '健康', '科技', '教育', '社会'];
    var topics = [];
    
    for (var i = 0; i < 5; i++) {
      var title = '#' + keyword + (i === 0 ? '' : '技巧') + '#';
      if (i === 1) title = '#' + keyword + '分享#';
      if (i === 2) title = '#我的' + keyword + '故事#';
      if (i === 3) title = '#如何做好' + keyword + '#';
      if (i === 4) title = '#' + keyword + '心得#';
      
      topics.push({
        id: 'custom_' + keyword + '_' + i,
        rank: i + 1,
        title: title,
        desc: '关于' + keyword + '的相关话题',
        heatValue: Math.floor(Math.random() * 500 + 200) + '万',
        trend: '+' + Math.floor(Math.random() * 20 + 10) + '%',
        trendUp: true,
        isHot: i < 2,
        isNew: true,
        category: categories[i % categories.length],
        videos: this.generateVideos(title),
        words: this.generateWords(title),
        isCollected: false
      });
    }
    
    return topics;
  }
});
