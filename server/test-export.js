const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/attendance/export-matrix?sessionName=Test',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer test-token-bypass'
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d.toString().substring(0,100)));
});
req.end();
