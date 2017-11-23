// import {WalletModel} from './wallet.model';
//
// export interface BtcWalletModel extends WalletModel{
//   addresses: {};
//   wif: string;
//   derived: {};
//   xprivkey: string;
// }
import {BtcWallet} from '../../../../../wallet/src/wallet-btc';
import {WalletModel} from './wallet.model';
import {Observable} from 'rxjs/Observable';
import * as util from '../../common/util';
import * as btcswap from 'btc-atomic-swap';

export class BtcWalletModel extends WalletModel {
  private btcWallet;
  public wif: string;
  public xprivkey: string;
  public addresses: {};
  public derived: any;

  static fromPrivKey(privKey: string) {
    const wall = new BtcWalletModel();
    wall.initialize(privKey);
    return wall;
  }

  static fromMnemonic(mnemonic: string[]) {
    const wall = new BtcWalletModel();
    wall.initialize(null, mnemonic);
    return wall;
  }

  public constructor(xprivKey?: string, codesPhrase?: string[]) {
    super();
    this.initialize(xprivKey, codesPhrase);
  }

  public newAddress(): string {
    const address = this.btcWallet.generateAddressFromWif(this.privKey);
    return address.toString();
  }

  initialize(xprivKey, codesPhrase?: string[]) {
    let btc;
    if (!xprivKey) {
      btc = new BtcWallet(codesPhrase);
    } else {
      btc = new BtcWallet(xprivKey, true);
    }

    // btc.generateHDPrivateKey();
    this.xprivKey = xprivKey;
    this.privKey = btc.hierarhicalPrivateKey.privateKey.toWIF();
    this.btcWallet = btc;
  }

  privateKey(): string {
    return this.privKey;
  }

  generateNewAddress(key?: string) {
    const address = this.btcWallet.generateAddressFromWif(this.privKey);
    return address.toString();
  }

  getBalance(address: string) {
    const addr = this.btcWallet.generateAddressFromWif(this.privKey).toString();
    return Observable.fromPromise(util.HttpRequester.Request({ path: '/api/v2/get_address_balance/BTCTEST/' + addr }));
  }

  extractSecret(data) {
    console.log('BTC extractSecret');
    console.log('data.secretHash', data.secretHash);
    console.log('data.redeemTx', data.redeemTx);
    const extract = btcswap.extractSecret(data.redeemTx, data.secretHash);
    return Observable.of(extract);
  }

  initiate(address: string, amount: number): any {
    const initiateResult = btcswap.initiate(address, amount, this.privKey);
    return Observable.fromPromise(initiateResult);
  }

  participate(address: string, secretHash: string, amount: number): any {
    const participateResult = btcswap.participate(address, amount.toString(),
      secretHash.replace('0x', ''),
      this.privKey);
    return Observable.fromPromise(participateResult);
  }

  redeem(data) {
    console.log('BTC redeeming data.contractHex ', data.contractHex);
    console.log('BTC redeeming data.contractTxHex ', data.contractTxHex);
    console.log('BTC redeeming data.secret ', data.secret);
    console.log('BTC redeeming wif ', this.privKey);
    const secret = data.secret.replace('0x', '');
    const redeemResult = btcswap.redeem(/**contract*/ data.contractHex, /**contractTx*/data.contractTxHex, /**secret*/secret, this.privKey);
    return Observable.fromPromise(redeemResult);
  }

  refund(hashedSecret: string);
  refund(contract: string, contractTx: string): any;
  refund(address: string, contractTx?: string) {
  }
}
