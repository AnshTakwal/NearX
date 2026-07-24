const fs = require('fs');
const data = JSON.parse(fs.readFileSync('final-image-upload-report.json'));
const errors = data.filter(d => d.status === 'error');
const unique = [...new Set(errors.map(e => e.name))];
console.log(`Total errors: ${errors.length}, Unique products: ${unique.length}`);
console.log(errors.slice(0, 5));
