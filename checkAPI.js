const axios = require("axios");
const { log } = require("./utils"); // Adjust the path as necessary
const settings = require("./config/config");

const urlChecking = "https://raw.githubusercontent.com/Hunga9k50doker/APIs-checking/refs/heads/main/endpoints.json";

async function checkBaseUrl() {
  console.log("Checking api...".blue);
  if (settings.ADVANCED_ANTI_DETECTION) {
    const result = await getBaseApi(urlChecking);
    if (result.endpoint) {
      log("No change in api!", "success");
      return result;
    }
  } else {
    return {
      endpoint: settings.BASE_URL,
      message:
        "Jika api berubah, silakan hubungi tim tele Airdrop Hunter Super Speed ​​​​(https://t.me/superbianz) untuk informasi lebih lanjut dan pembaruan!| Ada masalah, silakan hubungi: https://t.me/superbianz",
    };
  }
}

async function getBaseApi(url) {
  try {
    const response = await axios.get(url);
    const content = response.data;
    if (content?.zoo) {
      return { endpoint: content.zoo, message: content.copyright };
    } else {
      return {
        endpoint: null,
        message:
          "Jika api berubah, silakan hubungi tim tele Airdrop Hunter Super Speed ​​​​(https://t.me/superbianz) untuk informasi lebih lanjut dan pembaruan!| Ada masalah, silakan hubungi: https://t.me/superbianz",
      };
    }
  } catch (e) {
    return {
      endpoint: null,
      message:
        "Jika api berubah, silakan hubungi tim tele Airdrop Hunter Super Speed ​​​​(https://t.me/superbianz) untuk informasi lebih lanjut dan pembaruan!| Ada masalah, silakan hubungi: https://t.me/superbianz",
    };
  }
}

module.exports = { checkBaseUrl };