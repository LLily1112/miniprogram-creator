Page({
  data: {
    uploadedImage: '',
    isAnalyzing: false,
    recognizedData: null,
    aiAnalysis: null,
    historyList: []
  },

  onLoad: function() {
    console.log('analytics onLoad');
    this.loadHistory();
  },

  loadHistory: function() {
    var history = wx.getStorageSync('analysisHistory') || [];
    this.setData({ historyList: history });
  },

  chooseImage: function() {
    var that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        that.setData({
          uploadedImage: res.tempFilePaths[0],
          recognizedData: null,
          aiAnalysis: null
        });
      }
    });
  },

  analyzeImage: function() {
    var that = this;
    if (!this.data.uploadedImage) {
      wx.showToast({ title: '请先上传截图', icon: 'none' });
      return;
    }

    this.setData({ isAnalyzing: true });

    setTimeout(function() {
      var mockData = {
        plays: '45.6万',
        likes: '2.3万',
        comments: '1820',
        favorites: '4500',
        interactionRate: '5.1',
        fanRate: '1.2'
      };

      var analysis = {
        healthScore: 78,
        healthLevelText: '良好',
        insights: [
          {
            icon: '📊',
            title: '数据概况',
            content: '你的视频整体表现良好，5.1%的互动率高于行业平均水平，内容有一定吸引力。'
          },
          {
            icon: '⭐',
            title: '亮点分析',
            content: '内容类型与目标受众匹配度较高，生活感悟类内容反响较好。'
          },
          {
            icon: '🎯',
            title: '优化方向',
            content: '建议在内容开头方面加大优化力度，预计可提升15-20%的播放量。'
          }
        ],
        advice: [
          {
            priority: 'high',
            priorityText: '高优',
            title: '优化开头3秒',
            description: '前3秒是留住用户的关键，建议使用强悬念或强共鸣点作为开头。'
          },
          {
            priority: 'medium',
            priorityText: '中优',
            title: '增加互动引导',
            description: '在视频中设置互动点，如提问、投票引导等，主动引导用户参与互动。'
          },
          {
            priority: 'low',
            priorityText: '建议',
            title: '优化发布时间',
            description: '建议在18:00-21:00发布，这个时间段用户活跃度最高。'
          }
        ]
      };

      var history = that.data.historyList;
      history.unshift({
        id: Date.now().toString(),
        thumbnail: that.data.uploadedImage,
        date: that.formatDate(Date.now()),
        healthScore: analysis.healthScore
      });

      if (history.length > 10) {
        history = history.slice(0, 10);
      }

      wx.setStorageSync('analysisHistory', history);

      that.setData({
        isAnalyzing: false,
        recognizedData: mockData,
        aiAnalysis: analysis,
        historyList: history
      });

      wx.showToast({ title: '分析完成', icon: 'success' });
    }, 3000);
  },

  formatDate: function(timestamp) {
    var date = new Date(timestamp);
    return (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + 
           date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
  }
});
