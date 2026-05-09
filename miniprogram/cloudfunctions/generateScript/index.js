const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { topic, stories, style, userProfile, apiKey } = event;

  try {
    if (!apiKey) {
      return {
        success: false,
        error: '请先在设置中配置API密钥',
        code: 'NO_API_KEY'
      };
    }

    const prompt = buildPrompt(topic, stories, style, userProfile);
    
    const response = await callDeepSeekAPI(apiKey, prompt);
    
    if (response.error) {
      return {
        success: false,
        error: response.error.message || 'API调用失败',
        code: 'API_ERROR'
      };
    }

    const scriptContent = extractScriptContent(response);
    const goldenSentence = extractGoldenSentence(scriptContent);
    
    return {
      success: true,
      data: {
        content: scriptContent,
        goldenSentence: goldenSentence,
        wordCount: scriptContent.length,
        estimatedDuration: Math.floor(scriptContent.length / 5),
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        } : null
      }
    };

  } catch (error) {
    console.error('脚本生成失败:', error);
    return {
      success: false,
      error: error.message || '服务器错误',
      code: 'SERVER_ERROR'
    };
  }
};

function buildPrompt(topic, stories, style, userProfile) {
  const styleConfigs = {
    '励志': {
      tone: '温暖有力，如春风化雨般给人力量',
      emotion: '从低谷到希望的转折，让读者看到光',
      ending: '金句收尾，余音绕梁'
    },
    '轻松': {
      tone: '诙谐幽默，像朋友间的闲聊',
      emotion: '在笑声中传递生活智慧',
      ending: '轻松收尾，让人会心一笑'
    },
    '扎心': {
      tone: '直击内心，不回避生活的真实',
      emotion: '说出大家想说却说不出口的话',
      ending: '留下思考空间，引发共鸣'
    }
  };

  const identityContexts = {
    '打工人': '你是一个在大城市打拼的普通打工人，每天挤地铁、加班、为生活奔波，但依然热爱生活，相信努力会有回报。你的语言接地气，懂得打工人的苦与乐。',
    '学生': '你是一个正在求学路上的年轻人，面对学业压力、未来迷茫，但依然保持对知识的渴望和对未来的憧憬。你的语言青春洋溢，充满朝气。',
    '宝妈': '你是一个在家庭与自我之间寻找平衡的妈妈，经历过孕育的辛苦，也享受着陪伴孩子成长的幸福。你的语言温柔细腻，充满母爱的力量。',
    '退休人员': '你是一个经历了大半辈子风雨的人，看淡了很多事，更加珍惜当下的每一天。你的语言平和豁达，充满人生智慧。',
    '自由职业': '你是一个追求自由的创业者或自由职业者，享受自由的同时也承担着不确定性。你的语言独立自信，充满对生活的热爱。',
    '创业者': '你是一个在创业路上摸爬滚打的人，经历过失败也有过成功。你的语言务实坚韧，充满对梦想的执着。'
  };

  const styleConfig = styleConfigs[style] || styleConfigs['励志'];
  const identityContext = identityContexts[userProfile?.identity] || identityContexts['打工人'];

  let prompt = `# 角色设定
你是一位抖音生活感悟博主。${identityContext}

你的创作风格：
- 文字有温度，不是冰冷的鸡汤，而是真实的生活感悟
- 善于用细节打动人心，一个小场景、一句话都能引发共鸣
- 语言有"网感"，会用当下流行的表达方式，但不刻意
- 有文化底蕴，偶尔引用诗词典故，但恰到好处，不显摆
- 懂得留白，不把话说满，给读者思考空间

# 创作要求

## 整体风格
${styleConfig.tone}
情感走向：${styleConfig.emotion}
结尾处理：${styleConfig.ending}

## 内容结构
1. **开头（10秒内）**：用一个画面或一句话抓住注意力，不要自我介绍
2. **展开**：用具体的生活细节展开，让读者看到画面、感受到情绪
3. **升华**：从具体事件上升到人生感悟，但不要说教
4. **收尾**：留下一句让人回味的话，可以是金句，也可以是开放式的问题

## 写作技巧
- 多用"你"而不是"我们"，让读者有代入感
- 用场景代替说教，比如"凌晨三点的便利店"比"生活不易"更有力量
- 适当使用排比、对仗，让文字有节奏感
- 可以引用诗词、歌词、电影台词，但要自然融入
- 避免网络烂梗，如"绝绝子""yyds"等

## 格式要求
- 每段前标注【镜头提示】，如：【镜头提示：近景/特写/空镜】
- 总字数400-600字（约1.5-2分钟）
- 分3-5个自然段，每段2-4句话
`;

  if (topic && topic.title) {
    prompt += `\n# 创作主题
请围绕话题"${topic.title}"创作。这个话题反映了当下年轻人的关注点，请深入挖掘话题背后的情感和思考。`;
  }

  if (stories && stories.length > 0) {
    prompt += `\n# 素材故事
请将以下真实故事融入创作中，让内容更有温度和真实感：\n`;
    stories.forEach((story, index) => {
      prompt += `${index + 1}. ${story.content}\n`;
    });
    prompt += `注意：不要直接复述故事，而是提取其中的情感和细节，自然地融入脚本中。`;
  }

  prompt += `\n# 输出要求
请直接输出脚本内容，不需要标题、不需要解释。开头直接是【镜头提示】。

现在开始创作：`;

  return prompt;
}

function callDeepSeekAPI(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'deepseek-ai/DeepSeek-V2.5',
      messages: [
        {
          role: 'system',
          content: '你是一位优秀的短视频脚本创作者，擅长写出有温度、有深度、有网感的内容。你的文字能打动人心，引发共鸣，让人在平凡的生活中看到光。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1500,
      top_p: 0.9
    });

    const options = {
      hostname: 'api.siliconflow.cn',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (error) {
          reject(new Error('解析响应失败: ' + error.message));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error('网络请求失败: ' + error.message));
    });

    req.write(postData);
    req.end();
  });
}

function extractScriptContent(response) {
  if (response.choices && response.choices.length > 0) {
    return response.choices[0].message.content.trim();
  }
  return '';
}

function extractGoldenSentence(scriptContent) {
  const lines = scriptContent.split('\n');
  let candidates = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && 
        !line.startsWith('【') && 
        line.length > 15 && 
        line.length < 50 &&
        !line.includes('镜头提示')) {
      candidates.push(line);
    }
  }
  
  if (candidates.length > 0) {
    return candidates[candidates.length - 1];
  }
  
  return '生活不会辜负每一个认真的人';
}
