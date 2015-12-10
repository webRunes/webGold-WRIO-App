/**
 * Created by michbil on 10.12.15.
 */

let SATOSHI = 100000000;

export default class UnitCoverter {

    constructor(rates) {
        this.rates = rates;
    }

    wrgToBtc(wrg) {
        return btc * this.rates.btcExchangeRate / (SATOSHI * 10000);
    }

    btcToWrg(btc) {
        return btc * SATOSHI * 10000/ this.rates.btcExchangeRate;
    }

    wrgToUsd(wrg) {
        return wrg * this.rates.exchangeRate / 10000;
    }

    usdToWrg(usd) {
        return 10000 * usd / this.rates.exchangeRate;
    }


}
