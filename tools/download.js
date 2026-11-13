const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const downloads = [
  {
    name: 'cccanto',
    url: 'https://raw.githubusercontent.com/amadeusine/cc-canto-data/master/cccanto-webdist.txt',
    out: path.join(__dirname, 'raw', 'cccanto.txt')
  },
  {
    name: 'cedict',
    url: 'https://raw.githubusercontent.com/skishore/pinyin-data/master/cedict_ts.u8',
    out: path.join(__dirname, 'raw', 'cedict.txt')
  },
  {
    name: 'rime_chars',
    url: 'https://raw.githubusercontent.com/rime/rime-cantonese/master/jyut6ping3.chars.dict.yaml',
    out: path.join(__dirname, 'raw', 'rime-cantonese-chars.yaml')
  },
  {
    name: 'rime_phrases',
    url: 'https://raw.githubusercontent.com/rime/rime-cantonese/master/jyut6ping3.phrase.dict.yaml',
    out: path.join(__dirname, 'raw', 'rime-cantonese-phrases.yaml')
  }
];

function downloadFile(item) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${item.name} from ${item.url}...`);
    const file = fs.createWriteStream(item.out);
    
    function makeRequest(url) {
      const client = url.startsWith('https') ? https : http;
      client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          console.log(`Redirecting to ${res.headers.location}`);
          return makeRequest(res.headers.location);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(item.out);
          return reject(new Error(`HTTP ${res.statusCode} for ${item.name}`));
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          const size = fs.statSync(item.out).size;
          console.log(`✓ ${item.name} downloaded successfully (${size} bytes).`);
          resolve({ name: item.name, size });
        });
      }).on('error', err => {
        file.close();
        try { fs.unlinkSync(item.out); } catch(e){}
        reject(err);
      });
    }

    makeRequest(item.url);
  });
}

(async () => {
  for (const item of downloads) {
    try {
      await downloadFile(item);
    } catch (err) {
      console.error(`✗ Error downloading ${item.name}:`, err.message);
    }
  }
})();
