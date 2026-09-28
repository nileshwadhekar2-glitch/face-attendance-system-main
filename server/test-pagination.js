const jwt = require('jsonwebtoken');
const token = jwt.sign({ username: 'admin' }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1h' });

fetch('http://127.0.0.1:3001/api/users?page=1&limit=10', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(console.error);
