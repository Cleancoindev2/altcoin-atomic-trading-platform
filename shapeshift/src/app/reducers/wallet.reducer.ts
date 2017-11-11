import * as walletAction from '../actions/wallet.action';
import {BtcWalletModel} from '../models/wallets/btc-wallet.model';
import {EthWalletModel} from '../models/wallets/eth-wallet.model';
import * as wallet from 'wallet';

export interface State {
  BTC: BtcWalletModel;
  ETH: EthWalletModel;
}

const xprivKey = localStorage.getItem('xprivkey');
let btc = {} as any;
if (xprivKey) {
  btc = new wallet.Wallet.Bitcoin.BtcWallet(xprivKey, true);
}

const ethPrivKey = localStorage.getItem('ethprivkey');
const ethKeyStore = localStorage.getItem('ethkeystore');
let eth = {} as any;
let ethLogin = {} as any;
if (ethPrivKey && ethKeyStore) {
  eth = new wallet.Wallet.Ethereum.EthWallet();
  ethLogin = eth.atomicSwap.Login(JSON.parse(ethKeyStore).keystore, ethPrivKey);
  const keystore = JSON.parse(ethKeyStore);
  console.log(keystore);
  try{
    ethLogin = eth.atomicSwap.Login(keystore, ethPrivKey);
  }catch (e) {
    console.log(e);
  }
}

export const initialState: State = {
  BTC: {
    xprivkey: btc.hdPrivateKey ? btc.hdPrivateKey.xprivkey : '',
    addresses: {},
    derived: {},
  },
  ETH: {
    privateKey: ethPrivKey,
    keystore: ethKeyStore
  }
};

export function reducer(state = initialState, action: walletAction.Actions) {
  switch (action.type) {
    case walletAction.SET_BTC_WALLET: {
      if (state.BTC.xprivkey) {

        console.log(state);
        return state;
      }
      localStorage.setItem('xprivkey', action.payload.xprivkey);
      return {
        ...state,
        BTC: action.payload,
      };
    }
    case walletAction.SET_ETH_WALLET: {
      if (state.ETH.privateKey) {
        console.log(state);
        return state;
      }
      localStorage.setItem('ethprivkey', action.payload.privateKey);
      localStorage.setItem('ethkeystore', JSON.stringify(action.payload.keystore));
      return {
        ...state,
        ETH: action.payload,
      };
    }
    default: {
      return state;
    }
  }
}

export const getWallets = (state: State) => state;
