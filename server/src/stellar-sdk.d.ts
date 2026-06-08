declare module 'stellar-sdk' {
  export const Horizon: {
    Server: new (url: string) => any
  }
  export const Networks: {
    TESTNET: string
    PUBLIC: string
  }
  export const Keypair: {
    random(): any
    fromSecret(secret: string): any
  }
  export const Asset: new (code: string, issuer: string) => any
  export const BASE_FEE: string
  export const TransactionBuilder: new (account: any, opts: any) => any
  export const Operation: {
    createAccount(opts: any): any
    payment(opts: any): any
    changeTrust(opts: any): any
  }
  const StellarSdk: any
  export default StellarSdk
}
