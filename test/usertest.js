import {expect} from 'chai';
import User from '../src/client/js/components/User/index';
import jsdom from 'jsdom';

var FAKE_DOM_HTML = `
<html>
<body>
</body>
</html>
`;

function setupFakeDOM() {
    if (typeof document !== 'undefined') {
        return;
    }

    global.document = jsdom.jsdom(FAKE_DOM_HTML);
    global.window = document.defaultView;
    global.navigator = window.navigator;
}

setupFakeDOM();

import React from 'react';
import {renderIntoDocument, Simulate} from 'react-addons-test-utils';

const TEST_DATA = {
    username: 'test',
    btcExchangeRate: 1,
    exchangeRate: 1
};

describe('User test', () => {
    it('should display user', () => {
        const data = TEST_DATA;
        const user = renderIntoDocument(
            <User username={data.username} btcExchangeRate={data.btcExchangeRate} exchangeRate={data.exchangeRate}/>
        );

        expect(user.refs.usdBalance.textContent).to.equal('...');
    });
});
