[![Build Status](https://travis-ci.org/webRunes/webGold-WRIO-App.svg?branch=master)](https://travis-ci.org/webRunes/webGold-WRIO-App)

#webGold <sup>[WRIO](https://wrioos.com) App</sup>
(coming soon)

Payment processor for WRIO Internet OS. Using [Ethereum](https://www.ethereum.org/) technology. Ethereum subcurrency WGD created,
alpha version contract available at ```contract/webgold.sol```

For docker local development start geth node on local machine with start_eth script

##Official Hub
[webgold.wrioos.com](https://webgold.wrioos.com)

Powered by [Open Copyright](https://opencopyright.wrioos.com)

## Developer notes

To use server geth node during development, start reverse ssh tunnel

```
ssh -L 0.0.0.0:8545:localhost:8545 ubuntu@54.235.73.25 -i your_ssh_key.pem
```
