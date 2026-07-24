const fs = require('fs');

async function test() {
  const url = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.google.com/search?tbm=isch&q=amul+cheese+packaging');
  const res = await fetch(url);
  const data = await res.json();
  const html = data.contents;
  
  // Google Images old HTML returns images in `<img src="https://encrypted-tbn0.gstatic.com/images?...">`
  const regex = /<img[^>]+src="([^">]+)"/g;
  let match;
  const urls = [];
  while ((match = regex.exec(html)) !== null) {
    if (match[1].includes('gstatic.com/images')) {
      urls.push(match[1]);
    }
  }
  console.log(urls.slice(0, 5));
}
test();
