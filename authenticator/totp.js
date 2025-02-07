const crypto = require('crypto');
const SECRET = String(process.env.TOTPSECRET);

const hmac = crypto.createHmac('sha256', SECRET);
const timestamp = Math.floor(Date.now() / 1000 / 60);
hmac.update(Buffer.from(timestamp.toString()));
let result = hmac.digest('hex').replace(/\D/g, '').slice(0, 6);

console.log(result);