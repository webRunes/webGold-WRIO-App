const WebGold = require('../src/server/ethereum/ethereum.js');
//const EthereumContract = require('../src/server/ethereum/EthereumContract.js');
const db = require('wriocommon').db.getInstance();
const {utils} = require('../src/server/common'); const dumpError = utils.dumpError;
const BigNumber = require('bignumber.js');
const Const = require('../src/constant.js');
const {expect} = require('chai');
const nconf = require('nconf');
const CurrencyConverter = require('../src/currency.js');
const fs = require('fs');
const masterAccount = nconf.get("payment:ethereum:masterAdr");
const testAccounts = ["0x64b1ca6c22567bdbae74cab3a694d48c7a6b4789",
    "0xf6b20e61a7ae9e4390e9ec34f8322b5287c3cc5a",
    "0x505ab50296f8220353bd751b7560dc7d369ba1bd"];

const wei = Const.WEI;
const SATOSHI = Const.SATOSHI;

var db;
var wg;
var converter;

// cache compiled token sources to speedup development
const saveToCache = async (code,data) => {
    const cache = db.collection('codeCache');
    await cache.insertOne({
        code:code,
        data:JSON.stringify(data)
    });

};
/*
const cacheToken = (code, callback) => {
    return new Promise((resolve,reject) => {
        const cache = db.collection('codeCache');
        cache.findOne({code}, (err,data) => {
            //console.log(err,data);
            if (!err && data) {
                    console.log("Cache hit!");
                    resolve(JSON.parse(data.data));
            } else {
                console.log("Cache miss");
                callback(code).then((res) => {
                    console.log(res);
                    saveToCache(code, res, (err)=>console.log(err));
                    resolve(res);
                }).catch(reject);
            }
        });
    });
};*/

const cacheToken = async (code, callback) =>
{
    const cache = db.collection('codeCache');
    const data = await cache.findOne({code});
    console.log("Data",data);
    if (data) {
        console.log("Cache hit!");
        return resolve(JSON.parse(data.data));
    } else {
        console.log("Cache miss");
        const res = await callback();
        console.log(res);
        await saveToCache(code, res);
        return res;
    }
};


const compileDeploy = async(name) => {
    const web3 = wg.getWeb3();
    console.log("Compiling...");
    const file = fs.readFileSync(name).toString();
    const [abi,code] = await cacheToken(file, async(code) => await wg.compileContract(code));
    console.log("Deploying...");
    return {
        address:await wg.deploy(testAccounts[0], code, abi),
        abi: abi
    };

};

const delay = (time) => new Promise((resolve,reject) => setTimeout(resolve,time));

var serverObj;
const startTestRPC = () => new Promise((resolve,reject)=>{
    console.log("Starting test RPC server");
    const TestRPC = require("ethereumjs-testrpc");
    const params = { // predefine test accounts for functional testing purposes
        unlocked_accounts: ["0x64b1ca6c22567bdbae74cab3a694d48c7a6b4789"],
        secure: true,
        logger: console,
        debug:true,
        blocktime: "0.5",
        accounts: [
            {secretKey: "0x4749870d2632ff65dccdd61073e69a2e9f32c757e10efbf584cfe93c1d139f1c", balance: 1000000000},
            {secretKey: "0x51389cd120c059bbfd003e325550eace06c1515cbc6c8c7f8735728a54edfdc4", balance: 0},
            {secretKey: "0x1fb9710adb5b43df3f378e4007fdbdadd54f76dc162a1b59d368c7d66b926685", balance: 0}],
        locked: true
    };
    var server = TestRPC.server(params);
    server.listen(8545, function(err, blockchain) {
        if (err) {
            reject(err);
        }
        console.log("TestRPC server started",blockchain);
        serverObj = server;
        resolve(blockchain);
    });
});

//startTestRPC();


describe("Blockchain unit tests", () => {

    before(async() => {
        db = await dbMod.init();
        wg = new WebGold();
        converter = new CurrencyConverter(30);
    });

    after((done)=> {
        serverObj.close(()=>console.log("TestRPC shutdown"));
        done();
    });

    it ('should be able to create contract from the abi using EthereumContract.makeContract function', async(done) => {
        const abi = [{"constant":false,"inputs":[],"name":"stopPresale","outputs":[{"name":"ok","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"presaleGoing","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"presaleAmount","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"entries","outputs":[{"name":"ethID","type":"address"},{"name":"email","type":"string"},{"name":"bitcoinSRC","type":"string"},{"name":"bitcoinDEST","type":"string"},{"name":"satoshis","type":"uint256"},{"name":"centiWRG","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getPresaleNumber","outputs":[{"name":"length","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"i","type":"uint256"}],"name":"getPresale","outputs":[{"name":"","type":"string"},{"name":"","type":"address"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"string"},{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"mail","type":"string"},{"name":"adr","type":"address"},{"name":"satoshis","type":"uint256"},{"name":"centiWRG","type":"uint256"},{"name":"bitcoinSRC","type":"string"},{"name":"bitcoinDEST","type":"string"}],"name":"makePresale","outputs":[{"name":"sufficient","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"master","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getAmountLeft","outputs":[{"name":"amount","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"sender","type":"string"},{"indexed":false,"name":"satoshis","type":"uint256"}],"name":"presaleMade","type":"event"}];
        const contr = await wg.makeContract(testAccounts[0],abi,'testcontract');
        expect(contr.address).to.equal(testAccounts[0]);
        done();
    });

    it ('should be able to compile THX contract', async(done) => {
        try {
            const {address,abi} = await compileDeploy('./contract/src/THX.sol');
            wg.token = await wg.makeContract(address,abi,"tokenTest"); // replace webgold token with wg object
            console.log("Deployed contract at address", address);

            const masterBalance = await wg.getBalance(testAccounts[0]);
            expect(masterBalance.toString()).to.equal("0");

            await wg.coinTransfer(testAccounts[0],testAccounts[1],100);
            await delay(2000);
            const _newBalance = (await wg.getBalance(testAccounts[0])).toString();
            expect(_newBalance).to.equal((500000000-100).toString());

            await wg.donate(testAccounts[1],testAccounts[2],50);
            await delay(2000);
            const _newaccBalance = (await wg.getBalance(testAccounts[2])).toString();
            console.log(_newBalance);

            done();
        } catch(e) {
            dumpError(e);
            console.log("Error",e);
            done(e);
        }

    });

    it ('should be able to compile presale contract', async(done) => {
        try {
            const Contract = await compileDeploy('./contract/src/presale.sol');
            console.log(Contract);
            done();
        } catch(e) {
            dumpError(e);
            console.log("Error",e);
            done(e);
        }

    });

    it ('should be able to transfer funds form test account to work account', async (done) => {
        try {
            wg.web3.eth.getBlockNumber(function(err, number) {
                console.log(err,number);
            });

            let balanceBefore = await wg.getEtherBalance(testAccounts[1]);
            console.log(balanceBefore);
            await wg.etherSend(testAccounts[0],testAccounts[1],1);
            let balanceAfter = await wg.getEtherBalance(testAccounts[1]);
            console.log(balanceAfter);
            done();
        } catch(e) {
            // dumpError(e);
            console.log("Error",e);
            done("error");
        }
    });

    it ('should be able to create donate TX', async (done) => {
        try {
            let hex = await wg.makeDonateTx("0x59aE5534Ed5587b47924CFDD93872d087F121443","0x59aE5534Ed5587b47924CFDD93872d087F121443",10);
            console.log("TX created",hex);

            console.log("\nCreating presale....\n");
            await wg.logPresale("denso.ffff@mail.ru",0x59aE5534Ed5587b47924CFDD93872d087F121443,22,44);


            done();
        } catch(e) {
           // dumpError(e);
            console.log("Error",e);
            done();
        }
    });


    it('should be able to convert units correctly to WRG', () => {
        const btc = new BigNumber(SATOSHI / 10);
        const btcUsdRate = new BigNumber(600);
        const rate = converter.getRateDefault(btcUsdRate);
        let wrg = converter.convertBTCtoWRG(btc,rate).toString();
        expect(wrg).to.equal('2000');

    });
    it('should be able to convert currency units correctly to BTC', () => {
        let wrg = new BigNumber(2000);
        const btcUsdRate = new BigNumber(600);
        const rate = converter.getRateDefault(btcUsdRate);
        let BTC = converter.convertWRGtoBTC(wrg,rate).div(SATOSHI).toString();
        expect(BTC).to.equal('0.1');

        let usdSum = converter.wrgToUSD(wrg);
        expect(usdSum).to.equal('60');
    });

    it('should be able to convert presale BTC value(in satoshis) to WRG correctly', () => {
        let btc = SATOSHI;
        let wrg = converter.satoshiToWRGUsingPresalePrice(btc);
        expect(wrg).to.equal('30000.00');

        btc = 0.165111*SATOSHI;
        wrg = converter.satoshiToWRGUsingPresalePrice(btc);
        expect(wrg).to.equal('4953.33');

        // use milliWRG for ethereum contracts as minimum unit

        btc = SATOSHI;
        wrg = converter.satoshiTomilliWRGUsingPresalePrice(btc);
        expect(wrg).to.equal('3000000');

        btc = 0.165111*SATOSHI;
        wrg = converter.satoshiTomilliWRGUsingPresalePrice(btc);
        expect(wrg).to.equal('495333');
    });
});








