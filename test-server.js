const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  console.log(`Server responded with status: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`Response: ${chunk}`);
  });
});

req.on('error', (error) => {
  console.log(`Server not reachable: ${error.message}`);
});

req.on('timeout', () => {
  console.log('Server request timed out');
  req.destroy();
});

req.end();
