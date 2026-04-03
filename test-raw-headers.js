import https from 'https';

https.get('https://ais-pre-m25w7uenhdmcjrvtybe5qr-712321474383.asia-southeast1.run.app/', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
}).on('error', (e) => {
  console.error(e);
});
