const spamData = {};

function checkSpam(sender, message) {
  if (!(sender in spamData)) {
    spamData[sender] = {
      spam: 0,
      lastspam: 0
    };
  }

  spamData[sender].spam += 1;

  if (new Date() - spamData[sender].lastspam > 4000) {
    if (spamData[sender].spam > 6) {
      spamData[sender].spam = 0;
      spamData[sender].lastspam = new Date().getTime();
      return true; // Spam terdeteksi
    } else {
      spamData[sender].spam = 0;
      spamData[sender].lastspam = new Date().getTime();
    }
  }

  return false; // Bukan spam
}

module.exports = { checkSpam };