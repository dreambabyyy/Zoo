const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');
const crypto = require('crypto');
const { DateTime } = require('luxon');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Header ASCII Art and Info
const printHeader = () => {
    console.log(`
╔═════════════════════════════════════════════════╗
║                                                 ║
██████╗ ██╗███╗   ██╗███████╗████████╗███████╗    ║
██╔══██╗██║████╗  ██║██╔════╝╚══██╔══╝██╔════╝    ║
██████╔╝██║██╔██╗ ██║█████╗     ██║   █████╗      ║
██╔═══╝ ██║██║╚██╗██║██╔══╝     ██║   ██╔══╝      ║
██║     ██║██║ ╚████║███████╗   ██║   ███████╗    ║
╚═╝     ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚══════╝    ║
║  SUPER BIANZZZ                                  ║
║  AUTO SCRIPT MASTER                             ║
║                                                 ║
║  JOIN TELEGRAM CHANNEL NOW!                     ║
║  https://t.me/superbianz                        ║
║  @SuperBianzZz - OFFICIAL                       ║
║  CHANNEL                                        ║
║                                                 ║
║  FAST - RELIABLE - SECURE                       ║
║  SCRIPTS EXPERT                                 ║
║                                                 ║
╚═════════════════════════════════════════════════╝
`);
};

// Menampilkan header
printHeader();
class ZooAPIClient {
    constructor() {
        this.headers = {
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
            "Content-Type": "application/json",
            "Origin": "https://game.zoo.team",
            "Referer": "https://game.zoo.team/",
            "Sec-Ch-Ua": '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Is-Beta-Server": "null"
        };
        this.cachedData = null;
        this.proxyList = [];
        this.loadProxies();
    }

    loadProxies() {
        try {
            const proxyFile = path.join(__dirname, 'proxy.txt');
            if (fs.existsSync(proxyFile)) {
                this.proxyList = fs.readFileSync(proxyFile, 'utf8')
                    .replace(/\r/g, '')
                    .split('\n')
                    .filter(Boolean);
            }
        } catch (error) {
            this.log('Error loading proxies: ' + error.message, 'error');
        }
    }

    async checkProxyIP(proxy) {
        try {
            const proxyAgent = new HttpsProxyAgent(proxy);
            const response = await axios.get('https://api.ipify.org?format=json', {
                httpsAgent: proxyAgent,
                timeout: 10000
            });
            if (response.status === 200) {
                return response.data.ip;
            } else {
                throw new Error(`Tidak dapat memeriksa IP proxy. Kode status: ${response.status}`);
            }
        } catch (error) {
            throw new Error(`Kesalahan saat memeriksa IP proxy: ${error.message}`);
        }
    }

    getAxiosConfig(index) {
        if (this.proxyList.length > 0 && index < this.proxyList.length) {
            return {
                httpsAgent: new HttpsProxyAgent(this.proxyList[index]),
                timeout: 30000
            };
        }
        return { timeout: 30000 };
    }

    async createApiHash(timestamp, data) {
        const combinedData = `${timestamp}_${data}`;
        const encodedData = encodeURIComponent(combinedData);
        return crypto.createHash("md5").update(encodedData).digest("hex");
    }

    async login(initData, accountIndex) {
        if (!initData) {
            return { success: false, error: 'initData is required' };
        }

        try {
            const hash = initData.split('hash=')[1]?.split('&')[0];
            if (!hash) {
                throw new Error('Could not extract hash from initData');
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const userData = JSON.parse(decodeURIComponent(initData.split('user=')[1].split('&')[0]));
            const startParam = initData.split('start_param=')[1]?.split('&')[0] || '';
            const chatInstance = initData.split('chat_instance=')[1]?.split('&')[0] || '';

            const payload = {
                data: {
                    initData: initData,
                    startParam: startParam,
                    photoUrl: userData.photo_url || "",
                    platform: "android",
                    chatId: "",
                    chatType: "channel",
                    chatInstance: chatInstance
                }
            };

            const apiHash = await this.createApiHash(currentTime, JSON.stringify(payload));
            const headers = {
                ...this.headers,
                "api-hash": apiHash,
                "Api-Key": hash,
                "Api-Time": currentTime
            };

            const response = await axios.post(
                "https://api.zoo.team/telegram/auth",
                payload,
                {
                    headers,
                    ...this.getAxiosConfig(accountIndex)
                }
            );

            if (response.status === 200 && response.data.success) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async finishOnboarding(initData, accountIndex) {
        try {
            const hash = initData.split('hash=')[1]?.split('&')[0];
            if (!hash) {
                throw new Error('Could not extract hash from initData');
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const payload = { data: 1 };
            const apiHash = await this.createApiHash(currentTime, JSON.stringify(payload));
            
            const headers = {
                ...this.headers,
                "api-hash": apiHash,
                "Api-Key": hash,
                "Api-Time": currentTime
            };

            const response = await axios.post(
                "https://api.zoo.team/hero/onboarding/finish",
                payload,
                { 
                    headers,
                    ...this.getAxiosConfig(accountIndex)
                }
            );

            if (response.status === 200 && response.data.success) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getUserData(initData, accountIndex) {
        if (!initData) {
            return { success: false, error: 'initData is required' };
        }

        try {
            const hash = initData.split('hash=')[1]?.split('&')[0];
            if (!hash) {
                throw new Error('Could not extract hash from initData');
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const dataPayload = JSON.stringify({ data: {} });
            const apiHash = await this.createApiHash(currentTime, dataPayload);
            
            const headers = {
                ...this.headers,
                "api-hash": apiHash,
                "Api-Key": hash,
                "Api-Time": currentTime
            };

            const response = await axios.post(
                "https://api.zoo.team/user/data/all",
                { data: {} },
                {
                    headers,
                    ...this.getAxiosConfig(accountIndex)
                }
            );

            if (response.status === 200 && response.data.success) {
                this.cachedData = response.data.data;
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getUserDataAfter(initData, accountIndex) {
        try {
            const hash = initData.split('hash=')[1]?.split('&')[0];
            if (!hash) {
                throw new Error('Could not extract hash from initData');
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const dataPayload = JSON.stringify({ data: {} });
            const apiHash = await this.createApiHash(currentTime, dataPayload);
            
            const headers = {
                ...this.headers,
                "api-hash": apiHash,
                "Api-Key": hash,
                "Api-Time": currentTime
            };

            const response = await axios.post(
                "https://api.zoo.team/user/data/after",
                { data: {} },
                {
                    headers,
                    ...this.getAxiosConfig(accountIndex)
                }
            );

            if (response.status === 200 && response.data.success) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async claimDailyReward(initData, rewardIndex, accountIndex) {
        try {
            const hash = initData.split('hash=')[1]?.split('&')[0];
            if (!hash) {
                throw new Error('Could not extract hash from initData');
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const payload = { data: rewardIndex };
            const apiHash = await this.createApiHash(currentTime, JSON.stringify(payload));
            
            const headers = {
                ...this.headers,
                "api-hash": apiHash,
                "Api-Key": hash,
                "Api-Time": currentTime
            };

            const response = await axios.post(
                "https://api.zoo.team/quests/daily/claim",
                payload,
                {
                    headers,
                    ...this.getAxiosConfig(accountIndex)
                }
            );

            if (response.status === 200 && response.data.success) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async handleAutoFeed(initData, accountIndex) {
        try {
            const hash = initData.split('hash=')[1]?.split('&')[0];
            if (!hash) {
                throw new Error('Could not extract hash from initData');
            }

            const userDataResult = await this.getUserData(initData, accountIndex);
            if (!userDataResult.success) {
                throw new Error(`Failed to get user data: ${userDataResult.error}`);
            }

            const { hero, feed } = userDataResult.data;

            if (feed.isNeedFeed) {
                if (!hero.onboarding.includes("20")) {
                    const currentTime = Math.floor(Date.now() / 1000);
                    const payload = { data: 20 };
                    const apiHash = await this.createApiHash(currentTime, JSON.stringify(payload));
                    
                    const headers = {
                        ...this.headers,
                        "api-hash": apiHash,
                        "Api-Key": hash,
                        "Api-Time": currentTime
                    };

                    const onboardingResponse = await axios.post(
                        "https://api.zoo.team/hero/onboarding/finish",
                        payload,
                        {
                            headers,
                            ...this.getAxiosConfig(accountIndex)
                        }
                    );

                    if (!onboardingResponse.data.success) {
                        throw new Error('Failed to complete onboarding step 20');
                    }
                }

                const currentTime = Math.floor(Date.now() / 1000);
                const feedPayload = { data: "instant" };
                const apiHash = await this.createApiHash(currentTime, JSON.stringify(feedPayload));
                
                const headers = {
                    ...this.headers,
                    "api-hash": apiHash,
                    "Api-Key": hash,
                    "Api-Time": currentTime
                };

                const feedResponse = await axios.post(
                    "https://api.zoo.team/autofeed/buy",
                    feedPayload,
                    {
                        headers,
                        ...this.getAxiosConfig(accountIndex)
                    }
                );

                if (feedResponse.data.success) {
                    this.log('Beri makan hewan dengan sukses', 'success');
                    return { success: true, data: feedResponse.data };
                }
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

     

    log(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        switch(type) {
            case 'success':
                console.log(`[${timestamp}] [✓] ${msg}`.green);
                break;
            case 'custom':
                console.log(`[${timestamp}] [*] ${msg}`.magenta);
                break;        
            case 'error':
                console.log(`[${timestamp}] [✗] ${msg}`.red);
                break;
            case 'warning':
                console.log(`[${timestamp}] [!] ${msg}`.yellow);
                break;
            default:
                console.log(`[${timestamp}] [ℹ] ${msg}`.blue);
        }
    }


    calculateWaitTimeInSeconds(nextFeedTime) {
        const now = DateTime.local();
        const feedTime = DateTime.fromFormat(nextFeedTime, "yyyy-MM-dd HH:mm:ss", { zone: 'UTC' }).setZone('local');
        const diffInSeconds = Math.max(0, Math.floor(feedTime.diff(now, 'seconds').seconds));
        return diffInSeconds;
    }

    async countdown(seconds) {
        const endTime = DateTime.local().plus({ seconds });

        for (let i = seconds; i > 0; i--) {
            const currentTime = DateTime.local().toLocaleString(DateTime.TIME_WITH_SECONDS);
            const remainingTime = endTime.diff(DateTime.local());
            const remainingMinutes = Math.floor(remainingTime.as('minutes'));
            const remainingSeconds = Math.floor(remainingTime.as('seconds')) % 60;
            
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(
                `[${currentTime}] [*] Tunggu ${remainingMinutes} menit ${remainingSeconds} detik untuk melanjutkan...`
            );
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
    }

    async main() {
        try {
            const dataFile = path.join(__dirname, 'data.txt');
            if (!fs.existsSync(dataFile)) {
                this.log('data.txt file not found!', 'error');
                return;
            }

            const data = fs.readFileSync(dataFile, 'utf8')
                .replace(/\r/g, '')
                .split('\n')
                .filter(Boolean);

            if (data.length === 0) {
                this.log('No data found in data.txt', 'error');
                return;
            }

            let nextCycleWaitTime = 1440 * 60; // Default wait time in seconds (24 hours)
            
            while (true) {
                let firstAccountFeedTime = null;

                for (let i = 0; i < data.length; i++) {
                    const initData = data[i];
                    try {
                        const userData = JSON.parse(decodeURIComponent(initData.split('user=')[1].split('&')[0]));
                        const username = userData.username || 'Unknown';

                        let proxyIP = 'No proxy';
                        if (this.proxyList[i]) {
                            try {
                                proxyIP = await this.checkProxyIP(this.proxyList[i]);
                            } catch (proxyError) {
                                this.log(`Proxy check failed: ${proxyError.message}`, 'warning');
                            }
                        }

                        console.log(`========== Akun ${i + 1} | ${username.green} | ip: ${proxyIP} ==========`);
                        
                        this.log(`Masuk...`, 'info');
                        const loginResult = await this.login(initData, i);
                        if (loginResult.success) {
                            this.log('Berhasil masuk!', 'success');
                            
                            const userDataResult = await this.getUserData(initData, i);
                            if (userDataResult.success) {
                                const { hero, feed } = userDataResult.data;

                                if (i === 0 && !feed.isNeedFeed && feed.nextFeedTime) {
                                    firstAccountFeedTime = feed.nextFeedTime;
                                    const localFeedTime = DateTime
                                        .fromFormat(feed.nextFeedTime, "yyyy-MM-dd HH:mm:ss", { zone: 'UTC' })
                                        .setZone('local');
                                    
                                    this.log(`Waktu makan berikutnya: ${localFeedTime.toFormat('yyyy-MM-dd HH:mm:ss')}`, 'info');
                                }
                                
                                if (Array.isArray(hero.onboarding) && hero.onboarding.length === 0) {
                                    this.log('Menyelesaikan orientasi...', 'info');
                                    const onboardingResult = await this.finishOnboarding(initData, i);
                                    if (onboardingResult.success) {
                                        this.log('Menyelesaikan orientasi dengan sukses!', 'success');
                                    }
                                }

                                await this.handleAutoFeed(initData, i);

                               

                                const dataAfterResult = await this.getUserDataAfter(initData, i);
                                if (dataAfterResult.success) {
                                    const { dailyRewards } = dataAfterResult.data;
                                    for (let day = 1; day <= 16; day++) {
                                        if (dailyRewards[day] === 'canTake') {
                                            this.log(`Menerima hadiah harian ${day}...`, 'info');
                                            const claimResult = await this.claimDailyReward(initData, day, i);
                                            if (claimResult.success) {
                                                this.log('Kehadiran harian yang sukses!', 'success');
                                            }
                                            break;
                                        }
                                    }
                                }

                                const finalData = await this.getUserData(initData, i);
                                if (finalData.success) {
                                    this.log(`Token: ${finalData.data.hero.tokens}`, 'custom');
                                    this.log(`Coins: ${finalData.data.hero.coins}`, 'custom');
                                }
                            }
                        }

                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } catch (error) {
                        this.log(`Error processing account ${i + 1}: ${error.message}`, 'error');
                        continue;
                    }
                }

                if (firstAccountFeedTime) {
                    nextCycleWaitTime = this.calculateWaitTimeInSeconds(firstAccountFeedTime);
                    const waitMinutes = Math.floor(nextCycleWaitTime / 60);
                    const waitSeconds = nextCycleWaitTime % 60;
                    this.log(`Tunggu ${waitMinutes} Menit ${waitSeconds} detik hingga pemberian makan berikutnya`, 'info');
                } else {
                    this.log(`Gunakan batas waktu 24 jam default`, 'info');
                }

                await this.countdown(nextCycleWaitTime);
            }
        } catch (error) {
            this.log(`Main process error: ${error.message}`, 'error');
        }
    }
}

const client = new ZooAPIClient();
client.main().catch(err => {
    client.log(err.message, 'error');
    process.exit(1);
});