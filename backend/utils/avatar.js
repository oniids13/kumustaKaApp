const md5 = require("md5");

const getGravatar = (email, size = 80) => {
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
};

module.exports = { getGravatar };
