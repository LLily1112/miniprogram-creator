# miniprogram-creator
自媒体创作助手微信小程序
一款为抖音平台创作者设计的微信小程序，帮助自媒体人追踪热点、创作内容、管理故事。

功能特性
📊 热点追踪
实时获取抖音、头条热搜榜单
支持关键词搜索话题
话题分类展示（职场、生活、情感等）
📝 故事管理
添加和管理个人故事素材
故事标签分类
故事预览和编辑
✨ AI脚本生成
基于话题和个人故事智能生成短视频脚本
三种创作风格：励志、轻松、扎心
包含镜头提示、背景音乐建议
一键复制脚本内容
👤 个人中心
自定义用户画像
已保存脚本库
API设置管理
技术栈
框架：微信小程序原生开发
AI接口：DeepSeek API
热搜数据：dabenshi.cn
项目结构

Plain Text

miniprogram/
├── pages/              # 页面文件
│   ├── index/         # 热点页面
│   ├── story/         # 故事管理
│   ├── create/        # 创作生成
│   ├── mine/          # 个人中心
│   ├── settings/      # API设置
│   └── analytics/     # 数据分析
├── cloudfunctions/     # 云函数（可选）
├── utils/             # 工具函数
├── app.js            # 应用入口
├── app.json          # 应用配置
└── app.wxss          # 全局样式
快速开始
1. 克隆项目

Bash

git clone <your-repo-url>
cd 自媒体创作助手
2. 导入项目
打开微信开发者工具
点击「导入项目」
选择 miniprogram 文件夹
填写 AppID（或使用测试号）
3. 配置API密钥
获取 DeepSeek API密钥
进入「我的」→「API设置」
输入API密钥并保存
4. 配置服务器域名
在微信公众平台添加以下合法域名：

https://api.deepseek.com
https://dabenshi.cn
使用说明
热点页面
查看实时热搜话题
点击话题可查看详情
支持搜索其他话题
故事管理
点击「+」添加新故事
设置故事标题和内容
为故事添加标签
创作生成
选择一个热搜话题（或搜索其他话题）
从个人故事库选择素材（可选）
选择创作风格
点击「AI生成脚本」
复制生成的脚本使用
开发者
微信小程序原生开发
使用 wx.request 调用外部API
本地存储使用 wx.getStorageSync
License
MIT License
