const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { type = 'douyin', refresh = false } = event;

  try {
    const cacheKey = `hotTopics_${type}`;
    
    if (!refresh) {
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          fromCache: true
        };
      }
    }

    let hotTopics;
    
    switch (type) {
      case 'douyin':
        hotTopics = await fetchDouyinHotTopics();
        break;
      case 'weibo':
        hotTopics = await fetchWeiboHotTopics();
        break;
      case 'xiaohongshu':
        hotTopics = await fetchXiaohongshuHotTopics();
        break;
      default:
        hotTopics = await fetchDouyinHotTopics();
    }

    await cacheData(cacheKey, hotTopics);

    return {
      success: true,
      data: hotTopics,
      fromCache: false,
      updateTime: new Date().toISOString()
    };

  } catch (error) {
    console.error('获取热搜失败:', error);
    return {
      success: false,
      error: error.message || '获取热搜失败',
      data: getMockData()
    };
  }
};

async function fetchDouyinHotTopics() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.tianxingapi.com',
      port: 443,
      path: '/exec/v103/aweme/hot_search/board',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.code === 200 && parsed.data) {
            const topics = parsed.data.word_list.map((item, index) => ({
              id: item.word_id || (index + 1).toString(),
              rank: index + 1,
              title: '#' + item.word + '#',
              desc: item.hot_value,
              heatValue: formatHeatValue(item.hot_value),
              heatNum: parseInt(item.hot_value) || 0,
              trend: '+' + Math.floor(Math.random() * 20 + 1) + '%',
              trendUp: true,
              isHot: index < 3,
              isNew: Math.random() > 0.8,
              category: getCategory(item.word),
              videos: generateMockVideos(item.word),
              words: generateMockWords(item.word)
            }));
            resolve(topics);
          } else {
            resolve(getMockData());
          }
        } catch (error) {
          console.error('解析抖音热搜数据失败:', error);
          resolve(getMockData());
        }
      });
    });

    req.on('error', (error) => {
      console.error('请求抖音热搜API失败:', error);
      resolve(getMockData());
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve(getMockData());
    });

    req.end();
  });
}

async function fetchWeiboHotTopics() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = getMockData().map((topic, index) => ({
        ...topic,
        title: '#微博' + topic.title.replace('#', ''),
        category: '社交'
      }));
      resolve(mockData);
    }, 500);
  });
}

async function fetchXiaohongshuHotTopics() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = getMockData().map((topic, index) => ({
        ...topic,
        title: '#小红书' + topic.title.replace('#', ''),
        category: '种草'
      }));
      resolve(mockData);
    }, 500);
  });
}

function getMockData() {
  return [
    {
      id: '1',
      rank: 1,
      title: '#打工人早起困难#',
      desc: '超1023万人正在围观',
      heatValue: '1023万',
      heatNum: 10230000,
      trend: '+15%',
      trendUp: true,
      isHot: true,
      isNew: false,
      category: '职场',
      videos: [
        { title: '早起困难？教你三招告别赖床', likes: '2.3万', comments: '1820' },
        { title: '打工人早起的崩溃日常', likes: '1.9万', comments: '1540' },
        { title: '5个技巧让你早起不痛苦', likes: '1.5万', comments: '1200' }
      ],
      words: ['早起', '闹钟', '睡眠', '自律', '咖啡', '通勤', '早餐']
    },
    {
      id: '2',
      rank: 2,
      title: '#当代年轻人攒钱#',
      desc: '超892万人正在讨论',
      heatValue: '892万',
      heatNum: 8920000,
      trend: '+12%',
      trendUp: true,
      isHot: true,
      isNew: false,
      category: '理财',
      videos: [
        { title: '月薪3000如何攒下钱', likes: '3.1万', comments: '2100' },
        { title: '90后攒钱plog', likes: '2.8万', comments: '1890' }
      ],
      words: ['省钱', '存钱', '理财', '工资', '存款', '记账', '副业']
    },
    {
      id: '3',
      rank: 3,
      title: '#全职妈妈的一天#',
      desc: '超756万人感动围观',
      heatValue: '756万',
      heatNum: 7560000,
      trend: '+8%',
      trendUp: true,
      isHot: true,
      isNew: false,
      category: '生活',
      videos: [
        { title: '全职妈妈的真实日常', likes: '4.1万', comments: '3200' },
        { title: '独自带娃的一天', likes: '3.6万', comments: '2850' }
      ],
      words: ['带娃', '妈妈', '孩子', '家庭', '辛苦', '陪伴', '成长']
    },
    {
      id: '4',
      rank: 4,
      title: '#社恐人的周末#',
      desc: '超623万人深有同感',
      heatValue: '623万',
      heatNum: 6230000,
      trend: '+22%',
      trendUp: true,
      isHot: false,
      isNew: true,
      category: '情感',
      videos: [
        { title: '社恐周末宅家vlog', likes: '2.8万', comments: '1980' },
        { title: 'i人的充电方式', likes: '2.5万', comments: '1760' }
      ],
      words: ['社恐', '宅', '周末', 'i人', '独处', '充电', '社交']
    },
    {
      id: '5',
      rank: 5,
      title: '#租房改造#',
      desc: '超589万人正在学习',
      heatValue: '589万',
      heatNum: 5890000,
      trend: '+6%',
      trendUp: true,
      isHot: false,
      isNew: false,
      category: '生活',
      videos: [
        { title: '出租屋改造前后对比', likes: '5.2万', comments: '4100' },
        { title: '500元改造小房间', likes: '4.8万', comments: '3850' }
      ],
      words: ['租房', '改造', '房间', '收纳', '布置', '装修', '省钱']
    },
    {
      id: '6',
      rank: 6,
      title: '#30岁人生感悟#',
      desc: '超512万人共鸣',
      heatValue: '512万',
      heatNum: 5120000,
      trend: '+18%',
      trendUp: true,
      isHot: false,
      isNew: true,
      category: '情感',
      videos: [
        { title: '30岁才明白的人生道理', likes: '6.1万', comments: '4500' },
        { title: '30岁前没人告诉我的事', likes: '5.8万', comments: '4200' }
      ],
      words: ['30岁', '人生', '感悟', '成长', '职场', '家庭', '选择']
    },
    {
      id: '7',
      rank: 7,
      title: '#一人食晚餐#',
      desc: '超467万人正在学做',
      heatValue: '467万',
      heatNum: 4670000,
      trend: '+9%',
      trendUp: true,
      isHot: false,
      isNew: false,
      category: '美食',
      videos: [
        { title: '一个人也要好好吃饭', likes: '3.9万', comments: '2800' },
        { title: '10分钟搞定一人晚餐', likes: '3.5万', comments: '2500' }
      ],
      words: ['一人食', '晚餐', '做饭', '简单', '健康', '美味', '快手']
    },
    {
      id: '8',
      rank: 8,
      title: '#极简生活#',
      desc: '超423万人正在践行',
      heatValue: '423万',
      heatNum: 4230000,
      trend: '+11%',
      trendUp: true,
      isHot: false,
      isNew: false,
      category: '生活',
      videos: [
        { title: '极简生活给我带来的改变', likes: '4.2万', comments: '3100' },
        { title: '断舍离后的房间', likes: '3.8万', comments: '2900' }
      ],
      words: ['极简', '断舍离', '收纳', '整理', '物品', '消费', '欲望']
    },
    {
      id: '9',
      rank: 9,
      title: '#下班后的副业#',
      desc: '超398万人偷偷在做',
      heatValue: '398万',
      heatNum: 3980000,
      trend: '+25%',
      trendUp: true,
      isHot: false,
      isNew: true,
      category: '职场',
      videos: [
        { title: '下班后2小时副业月入过万', likes: '8.5万', comments: '6200' },
        { title: '普通人的副业之路', likes: '7.2万', comments: '5500' }
      ],
      words: ['副业', '兼职', '赚钱', '下班', '创业', '自由职业', '收入']
    },
    {
      id: '10',
      rank: 10,
      title: '#独居女孩安全感#',
      desc: '超356万人关注',
      heatValue: '356万',
      heatNum: 3560000,
      trend: '+7%',
      trendUp: true,
      isHot: false,
      isNew: false,
      category: '生活',
      videos: [
        { title: '独居女孩必备安全好物', likes: '5.5万', comments: '4100' },
        { title: '一个人住也要好好生活', likes: '4.9万', comments: '3700' }
      ],
      words: ['独居', '安全', '女孩', '好物', '防范', '生活', '独立']
    }
  ];
}

function formatHeatValue(value) {
  if (!value) return '0';
  const num = parseInt(value);
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿';
  } else if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
}

function getCategory(word) {
  const categories = ['职场', '生活', '情感', '理财', '美食', '娱乐', '健康'];
  const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return categories[hash % categories.length];
}

function generateMockVideos(word) {
  return [
    { title: `关于${word}的真实故事`, likes: Math.floor(Math.random() * 50000 + 10000) + '', comments: Math.floor(Math.random() * 3000 + 500) + '' },
    { title: `${word}的正确打开方式`, likes: Math.floor(Math.random() * 30000 + 8000) + '', comments: Math.floor(Math.random() * 2000 + 300) + '' },
    { title: `没想到${word}还能这样`, likes: Math.floor(Math.random() * 40000 + 12000) + '', comments: Math.floor(Math.random() * 2500 + 400) + '' }
  ];
}

function generateMockWords(word) {
  const baseWords = ['生活', '工作', '学习', '成长', '改变', '选择', '坚持'];
  const shuffled = baseWords.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 6);
}

async function getCachedData(key) {
  try {
    const result = await db.collection('cache').where({
      key: key,
      expireTime: db.command.gt(Date.now())
    }).get();
    
    if (result.data && result.data.length > 0) {
      return result.data[0].data;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function cacheData(key, data) {
  try {
    await db.collection('cache').where({ key: key }).remove();
    
    await db.collection('cache').add({
      data: {
        key: key,
        data: data,
        createTime: Date.now(),
        expireTime: Date.now() + 30 * 60 * 1000
      }
    });
  } catch (error) {
    console.error('缓存数据失败:', error);
  }
}
