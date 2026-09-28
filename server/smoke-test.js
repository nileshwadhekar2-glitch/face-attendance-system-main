// Integration check against the local instance; removes only its own fixtures.
require('dotenv').config({ path: require('path').join(__dirname, '.env'), quiet: true });
const assert = require('node:assert/strict');
const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const xlsx = require('xlsx');
const base = 'http://127.0.0.1:3001/api';
let token, classId, userId, sessionId, photo;
async function request(route, method = 'GET', body, expected = 200) {
  const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  assert.equal(response.status, expected, JSON.stringify(data));
  return data;
}
(async () => {
  assert.equal(await request('/sessions/active'), null, 'Run with no active session');
  try {
    await request('/users', 'GET', undefined, 401);
    token = (await request('/admin/login', 'POST', { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD })).token;
    assert.ok(token);
    classId = (await request('/classes', 'POST', { name: 'Smoke test', code: `TEST-${Date.now()}`, department: 'Testing' })).id;
    const image = await sharp({ create: { width: 16, height: 16, channels: 3, background: 'white' } }).jpeg().toBuffer();
    const descriptor = Array.from({ length: 128 }, (_, i) => i / 1000);
    userId = (await request('/users/register', 'POST', { name: 'Smoke Test', matric_no: `TEST-${Date.now()}`, classIds: [classId], faceLandmarks: descriptor, photo: `data:image/jpeg;base64,${image.toString('base64')}` })).userId;
    assert.ok(userId);
    const users = await request('/users');
    photo = users.users.find(u => u.id === userId).photo;
    assert.ok(photo.startsWith('/uploads/'));
    assert.equal((await fetch('http://127.0.0.1:3001' + photo)).status, 200);
    await request('/attendance', 'POST', { faceLandmarks: descriptor }, 403);
    sessionId = (await request('/sessions', 'POST', { action: 'create', name: 'Smoke test', class_id: classId, duration: 10, type: 'in' })).id;
    assert.ok((await request('/attendance', 'POST', { faceLandmarks: descriptor })).success);
    assert.ok((await request('/attendance', 'POST', { faceLandmarks: descriptor })).duplicate);
    await request('/attendance', 'POST', { faceLandmarks: Array(128).fill(10) }, 401);
    assert.equal((await request(`/sessions/${sessionId}/stats`)).total_in, 1);
    for (const route of ['/attendance/export', `/attendance/export-matrix?classId=${classId}`]) {
      const res = await fetch(base + route, { headers: { Authorization: `Bearer ${token}` } });
      assert.equal(res.status, 200);
      const workbook = xlsx.read(Buffer.from(await res.arrayBuffer()));
      assert.ok(xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]).length);
    }
    console.log('PASS: authentication, class creation, enrollment, local photo, no-session rejection, matching, duplicate prevention, unknown-face rejection, session statistics and Excel exports.');
  } finally {
    if (userId) await request(`/users/${userId}`, 'DELETE');
    if (sessionId) await request(`/sessions/${sessionId}`, 'DELETE');
    if (classId) await request(`/classes/${classId}`, 'DELETE');
    if (photo?.startsWith('/uploads/')) await fs.unlink(path.join(__dirname, photo));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
