#!/usr/bin/env bash
cd btcatomicswap
yarn link
cd ..
cd ethatomicswap
yarn link
cd wallet
yarn link
cd ..
cd shapeshift
yarn link wallet
yarn link ethatomicswap
yarn link btc-atomic-swap