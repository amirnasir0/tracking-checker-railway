import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url || !/^https?:\/\//.test(url)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const trackerHits = [];
    const proxyHits = [];

    page.on('request', (req) => {
      const rurl = req.url();
      if (rurl.includes('facebook.com/tr') || rurl.includes('google-analytics.com') || rurl.includes('clarity.ms')) {
        trackerHits.push(rurl);
      }
      if (rurl.match(/\\/track|\\/collect|gtm\\./)) {
        proxyHits.push(rurl);
      }
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const cookies = await page.cookies();
    await browser.close();

    res.json({
      has_tracker_script: trackerHits.length > 0,
      has_proxy_endpoint: proxyHits.length > 0,
      tracking_cookies: cookies.filter(c => ['_ga', '_fbp', '_gid'].includes(c.name)),
      status: trackerHits.length || proxyHits.length ? 'Tracking Detected' : 'No Tracking'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Analysis failed', reason: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
