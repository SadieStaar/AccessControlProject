// TOTP verification
app.post("/totp", function (req, resp) {
  // get entered totp code
  const inputTotp = req.body;
  console.log(inputTotp);

  // WIP return for testing purposes, remove when totp is done //
  //return resp.status(200).json({success: true, message: "Login successful" });

  // get timestamp
  
  // code from class
  const hmac = createHmac('sha256', 'secretcode');

  // still need to round to 30 seconds
  const timestamp = Math.floor(Date.now() / 1000 / 30);
  timestamp.setSeconds(30);
  timestamp.setMilliseconds(0);
  console.log(timestamp);

  hmac.update(timestamp.toString());

  let numberPattern = /\d+/g;
  let result = hmac.digest('hex').match(numberPattern).join('').slice(-6)
  console.log(result);
  if (inputTotp["totp"] === result) {
    resp.status(200).send("Code verification successful");
  } else {
    resp.status(401).send("Code comparison failed");
  }}};
