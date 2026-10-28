const https = require('https');

const products = [
  'Croissant',
  'Orange juice',
  'Milk',
  'Bread',
  'Curd',
  'Potato chip',
  'Cheese',
  'Iced coffee',
  'Apple',
  'Instant noodle',
  'Chocolate chip cookie',
  'Salt',
  'Rolled oats'
];

async function getWikiImage(query) {
  return new Promise((resolve) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&format=json&pithumbsize=400`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pages[pageId].thumbnail) {
            resolve(pages[pageId].thumbnail.source);
          } else {
            resolve('No image');
          }
        } catch (e) {
          resolve('Error');
        }
      });
    });
  });
}

async function main() {
  for (const p of products) {
    const img = await getWikiImage(p);
    console.log(`'${p}': '${img}',`);
  }
}

main();
