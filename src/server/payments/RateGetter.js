/**
 * Created by michbil on 16.02.16.
 */
import request from 'superagent';
import nconf from '../wrio_nconf';
import logger from 'winston';
import BigNumber from 'bignumber.js';

class RateGetter {

    constructor() {

        this.time = -1;
        this.timedelta = 5*60; //seconds before new rate request being held to blockchain info

    }

    async getRates() {

        var isInTest = typeof global.it === 'function';
        if (isInTest) {
            return new BigNumber(433.0);
        }

        if (this._timeExpired()) {
            return await this._getRatesRequest();
        } else {
            //logger.debug("Returning saved rate",this.savedRate);
            if (!this.savedRate) {
                throw new Error("Fatal error, rate not saved");
            }
            return this.savedRate;
        }
    }

    _registerTime() {
        this.time = Date.now();
    }

    _timeExpired() {
        var delta = (Date.now() - this.time) / 5000;
        if (delta > this.timedelta) {
            return true;
        } else {
            return false;
        }
    }


    async _getRatesRequest() {


        let api_request = "https://blockchain.info/ru/ticker";
        logger.verbose("Sending get_rates request",api_request);
        var result = await request.post(api_request);
        var usdRate = new BigNumber(result.body.USD.buy);

        this._registerTime();
        this.savedRate = usdRate;

        return usdRate;
    }

}
var rateGetter = new RateGetter();
export default rateGetter;