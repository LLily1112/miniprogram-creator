Page({
  data: {
    hotTopics: [],
    selectedTopic: null,
    stories: [],
    selectedStories: [],
    styles: ['励志', '轻松', '扎心'],
    selectedStyle: '励志',
    isGenerating: false,
    generatedScript: null,
    showPicker: false,
    hasApiKey: false
  },

  onLoad: function() {
    console.log('create onLoad');
    this.loadTopics();
    this.loadStories();
    this.checkApiKey();
  },

  onShow: function() {
    this.loadStories();
    this.checkSelectedStory();
    this.checkApiKey();
  },

  checkApiKey: function() {
    var apiKey = wx.getStorageSync('deepseekApiKey');
    this.setData({ hasApiKey: !!apiKey });
  },

  loadTopics: function() {
    var that = this;
    var apiUrl = 'https://dabenshi.cn/other/api/hot.php?type=douyinhot&timestamp=' + Date.now();

    wx.request({
      url: apiUrl,
      method: 'GET',
      timeout: 10000,
      success: function(res) {
        if (res.statusCode === 200 && res.data && res.data.success && Array.isArray(res.data.data)) {
          var list = res.data.data;
          var topics = [];

          for (var i = 0; i < Math.min(list.length, 20); i++) {
            var item = list[i];
            var title = item.title || '话题' + (i + 1);
            if (!title.startsWith('#')) {
              title = '#' + title + '#';
            }

            topics.push({
              id: (item.id || item.index || (i + 1)).toString(),
              title: title,
              category: that.getCategory(title),
              hotValue: item.hot || '0'
            });
          }

          that.setData({ hotTopics: topics });
        } else {
          that.setData({ hotTopics: that.getDefaultTopics() });
        }
      },
      fail: function(err) {
        console.log('获取话题失败，使用默认话题');
        that.setData({ hotTopics: that.getDefaultTopics() });
      }
    });
  },

  getDefaultTopics: function() {
    return [
      { id: '1', title: '#打工人早起困难#', category: '职场', hotValue: '1023万' },
      { id: '2', title: '#当代年轻人攒钱#', category: '理财', hotValue: '892万' },
      { id: '3', title: '#全职妈妈的一天#', category: '生活', hotValue: '756万' },
      { id: '4', title: '#社恐人的周末#', category: '情感', hotValue: '623万' },
      { id: '5', title: '#租房改造#', category: '生活', hotValue: '589万' }
    ];
  },

  getCategory: function(title) {
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

  loadStories: function() {
    var stories = wx.getStorageSync('userStories') || [];
    for (var i = 0; i < stories.length; i++) {
      stories[i].selected = false;
    }
    this.setData({ stories: stories });
  },

  checkSelectedStory: function() {
    var selected = wx.getStorageSync('selectedStoryForCreate');
    if (selected) {
      var stories = this.data.stories;
      for (var i = 0; i < stories.length; i++) {
        if (stories[i].id === selected.id) {
          stories[i].selected = true;
          break;
        }
      }
      this.setData({
        selectedStories: [selected],
        stories: stories
      });
      wx.removeStorageSync('selectedStoryForCreate');
    }
  },

  showTopicPicker: function() {
    this.setData({ showPicker: true });
  },

  hidePicker: function() {
    this.setData({ showPicker: false });
  },

  selectTopic: function(e) {
    var topic = e.currentTarget.dataset.topic;
    this.setData({
      selectedTopic: topic,
      showPicker: false
    });
  },

  onStoryToggle: function(e) {
    var id = e.currentTarget.dataset.id;
    var stories = this.data.stories;
    var selectedStories = this.data.selectedStories;

    var isSelected = false;
    var index = -1;
    for (var i = 0; i < selectedStories.length; i++) {
      if (selectedStories[i].id === id) {
        isSelected = true;
        index = i;
        break;
      }
    }

    if (isSelected) {
      selectedStories.splice(index, 1);
    } else {
      if (selectedStories.length >= 3) {
        wx.showToast({ title: '最多选择3条', icon: 'none' });
        return;
      }
      for (var j = 0; j < stories.length; j++) {
        if (stories[j].id === id) {
          selectedStories.push(stories[j]);
          break;
        }
      }
    }

    for (var k = 0; k < stories.length; k++) {
      stories[k].selected = false;
      for (var l = 0; l < selectedStories.length; l++) {
        if (stories[k].id === selectedStories[l].id) {
          stories[k].selected = true;
          break;
        }
      }
    }

    this.setData({
      stories: stories,
      selectedStories: selectedStories
    });
  },

  onRandomStory: function() {
    var stories = this.data.stories;
    var selectedStories = this.data.selectedStories;

    if (stories.length === 0) {
      wx.showToast({ title: '暂无故事', icon: 'none' });
      return;
    }

    var available = [];
    for (var i = 0; i < stories.length; i++) {
      var found = false;
      for (var j = 0; j < selectedStories.length; j++) {
        if (stories[i].id === selectedStories[j].id) {
          found = true;
          break;
        }
      }
      if (!found) {
        available.push(stories[i]);
      }
    }

    if (available.length === 0) {
      wx.showToast({ title: '已选满3条', icon: 'none' });
      return;
    }

    var randomIndex = Math.floor(Math.random() * available.length);
    var randomStory = available[randomIndex];

    selectedStories.push(randomStory);

    for (var k = 0; k < stories.length; k++) {
      stories[k].selected = false;
      for (var l = 0; l < selectedStories.length; l++) {
        if (stories[k].id === selectedStories[l].id) {
          stories[k].selected = true;
          break;
        }
      }
    }

    this.setData({
      stories: stories,
      selectedStories: selectedStories
    });
  },

  onStyleChange: function(e) {
    var style = e.currentTarget.dataset.style;
    this.setData({ selectedStyle: style });
  },

  onGenerate: function() {
    if (!this.data.selectedTopic) {
      wx.showToast({ title: '请先选择话题', icon: 'none' });
      return;
    }

    var apiKey = wx.getStorageSync('deepseekApiKey');
    if (!apiKey) {
      wx.showModal({
        title: '提示',
        content: '请先在「我的」页面配置DeepSeek API密钥',
        confirmText: '去设置',
        success: function(res) {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/mine/mine' });
          }
        }
      });
      return;
    }

    this.generateWithAI(apiKey);
  },

  generateWithAI: function(apiKey) {
    var that = this;
    that.setData({ isGenerating: true });

    var userProfile = wx.getStorageSync('userProfile') || {};
    
    var storyText = '';
    for (var i = 0; i < that.data.selectedStories.length; i++) {
      storyText += (i + 1) + '. ' + that.data.selectedStories[i].content + '\n';
    }

    var systemPrompt = '你是一位专业的新媒体内容创作者，擅长为抖音、小红书等平台创作短视频脚本。用户会提供话题和个人故事，你需要创作出吸引人的脚本。';

    var userPrompt = '请根据以下信息创作短视频脚本：\n\n';
    userPrompt += '【话题】' + (that.data.selectedTopic ? that.data.selectedTopic.title : '待定') + '\n\n';
    userPrompt += '【个人故事】\n' + storyText + '\n';
    userPrompt += '【风格】' + that.data.selectedStyle + '风格\n\n';
    userPrompt += '【用户画像】' + (userProfile.keywords || '普通人') + '\n\n';
    userPrompt += '请生成一个完整的短视频脚本，包括：\n';
    userPrompt += '1. 开头钩子（3秒内抓住观众）\n';
    userPrompt += '2. 故事叙述（代入感强）\n';
    userPrompt += '3. 金句升华（引发共鸣）\n';
    userPrompt += '4. 结尾引导（互动/关注）\n\n';
    userPrompt += '同时给出：\n- 预估时长\n- 适合的背景音乐风格\n- 关键镜头建议\n\n请直接返回脚本内容，不需要额外解释。';

    var postData = JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: false
    });

    console.log('开始调用DeepSeek API, apiKey:', apiKey ? '已配置' : '未配置');
    
    wx.request({
      url: 'https://api.deepseek.com/v1/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      data: postData,
      timeout: 30000,
      success: function(res) {
        that.setData({ isGenerating: false });
        console.log('API响应:', res);

        if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices[0]) {
          var content = res.data.choices[0].message.content;
          var wordCount = content.length;
          var duration = Math.max(30, Math.ceil(wordCount / 5));

          that.setData({
            generatedScript: {
              content: content,
              goldenSentence: that.extractGoldenSentence(content),
              wordCount: wordCount,
              duration: duration
            }
          });
          wx.showToast({ title: '生成成功', icon: 'success' });
        } else if (res.statusCode === 401) {
          wx.showModal({
            title: 'API密钥错误',
            content: '请检查API密钥是否正确',
            showCancel: false
          });
        } else if (res.statusCode === 429) {
          wx.showModal({
            title: '请求过于频繁',
            content: '请稍后再试',
            showCancel: false
          });
        } else {
          var errorMsg = res.data && res.data.error ? res.data.error.message : '生成失败，请重试';
          console.log('API错误:', errorMsg);
          wx.showModal({
            title: '生成失败',
            content: errorMsg,
            showCancel: false
          });
        }
      },
      fail: function(err) {
        that.setData({ isGenerating: false });
        console.error('API调用失败:', err);
        wx.showModal({
          title: '网络错误',
          content: '网络请求失败，请检查网络连接\n错误信息: ' + (err.errMsg || '未知'),
          showCancel: false
        });
      }
    });
  },

  extractGoldenSentence: function(content) {
    var lines = content.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.includes('金句') || line.includes('升华') || line.includes('点睛')) {
        for (var j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          if (lines[j].trim().length > 5 && lines[j].trim().length < 100) {
            return lines[j].trim();
          }
        }
      }
    }
    var shortLines = lines.filter(function(line) {
      return line.trim().length > 5 && line.trim().length < 50;
    });
    return shortLines.length > 0 ? shortLines[Math.floor(shortLines.length / 2)] : '';
  },

  clearScript: function() {
    this.setData({ generatedScript: null });
  },

  copyScript: function() {
    var script = this.data.generatedScript;
    if (!script) return;

    wx.setClipboardData({
      data: script.content,
      success: function() {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  },

  saveScript: function() {
    var script = this.data.generatedScript;
    if (!script) return;

    var scripts = wx.getStorageSync('savedScripts') || [];
    scripts.push({
      id: Date.now().toString(),
      content: script.content,
      goldenSentence: script.goldenSentence,
      topic: this.data.selectedTopic ? this.data.selectedTopic.title : '',
      style: this.data.selectedStyle,
      createdAt: Date.now()
    });
    wx.setStorageSync('savedScripts', scripts);
    wx.showToast({ title: '已保存到脚本库', icon: 'success' });
  },

  makeCover: function() {
    wx.showToast({ title: '封面功能开发中', icon: 'none' });
  },

  goToStory: function() {
    wx.switchTab({ url: '/pages/story/story' });
  },

  goToSettings: function() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  }
});
