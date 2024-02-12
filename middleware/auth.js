const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  console.log(req.cookies);
  const { token } = req.cookies;

  /* If token is not there */
  if (!token) {
    return res.status(401).send("Token is missing! Please try again");
  }

  /* Varify the token */
  try {
    const decode = jwt.verify(token, "shhhhh");
    console.log(decode);
    req.user = decode;
  } catch (error) {
    res.status(401).send("Token is Invalid");
  }

  return next();
};

module.exports = auth;
