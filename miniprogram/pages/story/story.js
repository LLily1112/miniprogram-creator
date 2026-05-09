Page({
  data: {
    storyInput: '',
    stories: []
  },

  onLoad: function() {
    console.log('story onLoad');
    this.loadStories();
  },

  onShow: function() {
    this.loadStories();
  },

  loadStories: function() {
    console.log('loadStories called');
    var stories = wx.getStorageSync('userStories') || [];
    for (var i = 0; i < stories.length; i++) {
      stories[i].dateDisplay = this.formatDate(stories[i].createdAt);
    }
    stories.sort(function(a, b) {
      return b.createdAt - a.createdAt;
    });
    this.setData({ stories: stories });
    console.log('stories loaded:', stories.length);
  },

  formatDate: function(timestamp) {
    var date = new Date(timestamp);
    var now = new Date();
    var today = now.toDateString();
    var yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    var dateStr = date.toDateString();
    var time = date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();

    if (dateStr === today) {
      return '今天 ' + time;
    } else if (dateStr === yesterday.toDateString()) {
      return '昨天 ' + time;
    } else {
      return (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + time;
    }
  },

  onInput: function(e) {
    this.setData({ storyInput: e.detail.value });
  },

  saveStory: function() {
    var content = this.data.storyInput.trim();
    if (!content) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    var story = {
      id: Date.now().toString(),
      content: content,
      createdAt: Date.now(),
      used: false
    };

    var stories = wx.getStorageSync('userStories') || [];
    stories.push(story);
    wx.setStorageSync('userStories', stories);

    this.setData({ storyInput: '' });
    this.loadStories();

    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  onStoryTap: function(e) {
    var id = e.currentTarget.dataset.id;
    var stories = this.data.stories;
    var story = null;

    for (var i = 0; i < stories.length; i++) {
      if (stories[i].id === id) {
        story = stories[i];
        break;
      }
    }

    if (story) {
      wx.showModal({
        title: '故事详情',
        content: story.content,
        showCancel: false
      });
    }
  },

  onRandomUse: function(e) {
    e.stopPropagation();
    var id = e.currentTarget.dataset.id;
    var stories = this.data.stories;
    var story = null;

    for (var i = 0; i < stories.length; i++) {
      if (stories[i].id === id) {
        story = stories[i];
        break;
      }
    }

    if (story) {
      wx.setStorageSync('selectedStoryForCreate', story);
      wx.switchTab({ url: '/pages/create/create' });
    }
  },

  onDelete: function(e) {
    e.stopPropagation();
    var id = e.currentTarget.dataset.id;
    var that = this;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条故事吗？',
      success: function(res) {
        if (res.confirm) {
          var stories = wx.getStorageSync('userStories') || [];
          var newStories = [];
          for (var i = 0; i < stories.length; i++) {
            if (stories[i].id !== id) {
              newStories.push(stories[i]);
            }
          }
          wx.setStorageSync('userStories', newStories);
          wx.showToast({ title: '删除成功', icon: 'success' });
          that.loadStories();
        }
      }
    });
  }
});
