const express = require('express');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'HEAD', 'POST'],
  credentials: false
}));
app.use(express.json({ limit: '1mb' }));

// images 폴더 정적 서빙
app.use('/images', express.static(path.join(__dirname, 'images')));

// 결과페이지 url에서 id 추출 (예: /result/jyn8gm)
function extractIdFromUrl(url) {
  const match = url.match(/\/result\/([\w-]+)/);
  return match ? match[1] : null;
}

app.post('/api/capture', async (req, res) => {
  const { url, selector, format = 'png', quality, fullPage = false } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });
  const id = extractIdFromUrl(url);
  if (!id) return res.status(400).json({ error: 'invalid result url' });
  const imagePath = path.join(__dirname, 'images', `${id}.${format}`);
  const imageUrl = `/images/${id}.${format}`;

  // 파일이 이미 있으면 재생성하지 않고 바로 반환
  if (fs.existsSync(imagePath)) {
    return res.status(200).json({ imageUrl });
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    let imageBuffer;
    if (selector) {
      const el = await page.$(selector);
      if (!el) throw new Error('Selector not found');
      imageBuffer = await el.screenshot({ type: format, quality, omitBackground: false });
    } else {
      imageBuffer = await page.screenshot({ type: format, quality, fullPage });
    }
    fs.writeFileSync(imagePath, imageBuffer);
    res.status(200).json({ imageUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Capture server listening on port ${PORT}`);
}); 