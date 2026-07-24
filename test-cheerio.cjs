const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('bing.html', 'utf8');
const $ = cheerio.load(html);
let urls = [];
$('a.iusc').each((i, el) => {
  const mStr = $(el).attr('m');
  if (mStr) {
    try {
      // Decode HTML entities if necessary
      const mStrClean = mStr.replace(/&quot;/g, '"');
      const m = JSON.parse(mStrClean);
      urls.push(m.murl);
    } catch (e) {}
  }
});
console.log(urls.slice(0, 5));
