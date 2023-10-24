import {Connection, Keypair, SendOptions, Signer, TransactionSignature, VersionedTransaction, clusterApiUrl} from '@solana/web3.js';
import {MWARequestType} from '../lib/mobile-wallet-adapter-walletlib/src';
import {sign} from '@solana/web3.js/src/utils/ed25519';
import {decode} from 'bs58';

export const SIGNATURE_LEN = 64;
export const PUBLIC_KEY_LEN = 32;

export class SendTransactionsError extends Error {
    valid: boolean[];
    constructor(message: string, valid: boolean[]) {
      super(message);
      this.name = 'SendTransactionErrors';
      this.valid = valid;
    }
  }

  export async function sendSignedTransactions(
    signedTransactions: Array<Uint8Array>,
    minContextSlot: number | undefined,
    connection: Connection,
  ): Promise<Uint8Array[]> {
    
    const signatures: (Uint8Array | null)[] = await Promise.all(
      signedTransactions.map(async byteArray => {
        // Try sending a transaction.
        try {
          const transaction: VersionedTransaction =
            VersionedTransaction.deserialize(byteArray);

          console.log(" ------------- ")
          console.log("Blockhash: ", transaction.message.recentBlockhash)
          console.log("Message: ", transaction.message.getAccountKeys().length)
          console.log(" ------------- ")


          const sendOptions: SendOptions = {
            minContextSlot: minContextSlot,
            preflightCommitment: 'finalized',
            skipPreflight: true,
          };
          const signature: TransactionSignature =
            await connection.sendTransaction(transaction, sendOptions);

            const response = await connection.confirmTransaction(signature, 'confirmed');

            console.log(" ------------- ")
            console.log(" Sending Transaction ")
            console.log(" ")
            console.log(" Signature: ", signature)
            console.log(" Connection: ", connection.rpcEndpoint)
            console.log(" Response: ", JSON.stringify(response))
            console.log(" ")
            console.log(" ------------- ")
          const decoded = decode(signature);
          return decoded;
        } catch (error) {
          console.log(" ------------- ")
          console.log('Failed sending transaction ' + error);
          console.log(" Connection: ", connection.rpcEndpoint)
          console.log(" ------------- ")
          return null;
        }
      }),
    );

    if (signatures.includes(null)) {
      const valid = signatures.map(signature => {
        return signature !== null;
      });
      throw new SendTransactionsError('Failed sending transactions', valid);
    }

    return signatures as Uint8Array[];
  }
  
  // export async function sendTransactionsRaw(
  //   signedTransactions: Array<Uint8Array>,
  //   connection: Connection,
  // ): Promise<Uint8Array[]> {
  //   const signatures = await Promise.all(
  //     signedTransactions.map(async tsx => {
  //       try {
  //         const versionedTransaction = VersionedTransaction.deserialize(tsx);
  //         // const sendOpts: SendOptions = {
  //         //   skipPreflight: true,
  //         // };

  //         const sig = await connection.sendTransaction(versionedTransaction);
  //         const response = await connection.confirmTransaction(sig, 'confirmed');

  //         console.log(" ------------- ")
  //         console.log(" Sending Transaction ")
  //         console.log(" ")
  //         console.log(" Signature: ", sig)
  //         console.log(" Connection: ", connection.rpcEndpoint)
  //         console.log(" Response: ", JSON.stringify(response))
  //         console.log(" ")
  //         console.log(" ------------- ")

  //         const decoded = decode(sig);
  //         return decoded;
  //       } catch (e) {
  //         console.log('Failed sending transaction ' + e);
  //         return null;
  //       }
  //     }),
  //   );

  //   if (signatures.includes(null)) {
  //     const valid = signatures.map(signature => {
  //       return signature !== null;
  //     });
  //     throw new SendTransactionsError('Failed sending transactions', valid);
  //   }

  //   return signatures as Uint8Array[];
  // }

export function signTransactionRaw(transactionBytes: Uint8Array, keypair: Keypair): Uint8Array {
  const tsx: VersionedTransaction =
    VersionedTransaction.deserialize(transactionBytes);
  const signer: Signer = {
    publicKey: keypair.publicKey,
    secretKey: keypair.secretKey,
  };
  tsx.sign([signer]);
  return tsx.serialize();
}

export function signMessageRaw(messageBytes: Uint8Array, keypair: Keypair) {
  return sign(messageBytes, keypair.secretKey.slice(0, 32));
}

export function getSignedPayloads(
  type: MWARequestType,
  wallet: Keypair,
  payloads: Uint8Array[],
): [boolean[], Uint8Array[]] {
  const valid = payloads.map(_ => true);
  let signedPayloads;
  if (
    type == MWARequestType.SignTransactionsRequest ||
    type == MWARequestType.SignAndSendTransactionsRequest
  ) {
    signedPayloads = payloads.map((payload, index) => {
      try {
        return signTransactionRaw(new Uint8Array(payload), wallet);
      } catch (e) {
        console.log('sign error: ' + e);
        valid[index] = false;
        return new Uint8Array([]);
      }
    });
  } else {
    signedPayloads = payloads.map((payload, index) => {
      try {
        return signMessageRaw(new Uint8Array(payload), wallet);
      } catch (e) {
        console.log('sign error: ' + e);
        valid[index] = false;
        return new Uint8Array([]);
      }
    });
  }

  return [valid, signedPayloads];
};

export function getIconFromIdentityUri(appIdentity?: any){
  if (
    appIdentity?.iconRelativeUri &&
    appIdentity.identityUri &&
    appIdentity.iconRelativeUri != 'null' &&
    appIdentity.identityUri != 'null'
  ) {
    return new URL(
      appIdentity.iconRelativeUri,
      appIdentity.identityUri,
    ).toString();
  }

  return null;
};
