const url = 'https://ais-pre-m25w7uenhdmcjrvtybe5qr-712321474383.asia-southeast1.run.app/';
fetch(url, {
  headers: {
    'Origin': 'https://ipltracker.tinuu.com',
    'Referer': 'https://ipltracker.tinuu.com/'
  }
}).then(res => {
  console.log('Headers with Origin:');
  for (let [key, value] of res.headers.entries()) {
    console.log(`${key}: ${value}`);
  }
}).catch(console.error);
