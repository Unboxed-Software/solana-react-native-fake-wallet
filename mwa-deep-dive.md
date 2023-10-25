# MWA Deep Dive

# Repo

[https://github.com/Unboxed-Software/solana-rn-fake-wallet.git](https://github.com/Unboxed-Software/solana-rn-fake-wallet.git)

# Lesson

---
title: MWA Deep Dive
objectives:
- Explain the...
- Explain how...
- Use...
---

# TL;DR

- …
- ….
- …

# Overview

## What is MWA

### How does a normal wallet work?

- an abstraction for the following Keypair functions: `sign message`, `sign transaction`, etc…
- The jist: Wallet browser stores keypair safely, follows the api standard for the above functions, returns signed messages and transactions
- But what happens if we want to use mobile native wallets…
    
    Describe a scenario in which we want to use mobile wallets and how normal wallets won’t be a feasible choice for this scenario.
    
    Enter MWA!
    

### How MWA is different

- A short paragraph on how MWA uses a entrypoint component. All requests have to go through this entrypoint component.
- A short para on how we can interact with session updates through emits.
- A short para on extra functions provided by the MWA in addition to base keypair functions.  Examples include authorize, deauthorize, getCapabilities, cloneAuthorization, etc.

### Caveats

- A note regarding this package still being in alpha and not production ready, but has a stable API

## Operations

List of all the operations supported by MWA and breakdown of those operations in the following manner.

### Non-privileged Methods

- Authorize
    - Explanation
    - Link to the spec doc
- Reauthorize
    - Explanation
    - Link to the spec doc
- Deauthorize
    - Explanation
    - Link to the spec doc
- Get Capabilities
    - Explanation
    - Link to the spec doc

### Privileged Methods

- Sign Transactions
    - Explanation
    - Link to the spec doc
- Sign and Send Transactions
    - Explanation
    - Link to the spec doc
- Sign messages
    - Explanation
    - Link to the spec doc
- Clone Authorization
    - Explanation
    - Link to the spec doc

## Illustrations

### Authorizing a Dapp

The diagram from the spec doc and link to the spec doc.

### Authorizing and Sign Transaction

The diagram from the spec doc and link to the spec doc.

### Reauthorizing and Sign Transaction

The diagram from the spec doc and link to the spec doc.

## Implementing MWA Component

### Dependencies

```bash
#provide the npm command to install solana-web3 and MWA dependencies
```

### What is a MWA Component

Explain how MWA Component is a react component and how it is called using the `solana-wallet://` endpoint and how it will determine which UI to render based on the request initiated by the requesting Dapp.

**Dapp Identity Verification:**

Explain what is Dapp Identity

Explain `solana-wallet://` as a wallet endpoint and all wallets associated with solana respond to requests which call this endpoint. That’s how one gets to choose a wallet if the user has multiple supported wallets installed. 

Explain how this component will be rendered when an intent for `solana-wallet://` is sent.

### Creating Entrypoint

Explain that entrypoint simply means a react component which will be shown to user when he selects our fake wallet app to do any operation.

```tsx
//Creation of the MWAComponent and registering it in the AppRegistry
```

### Listening and Handling Requests

Explain the `useMobileWalletAdapterSession` hook and how it allows us to capture session event emits.

### Storing session and current request

```tsx
//show session and request handler method pseudo code
```

### Handling Authorization Request

```tsx
//show pseudo code switching on request type and returning auth component
```

### Handling Sign and Send Transaction Request

```tsx
//show pseudo code switching on request type and returning sign and send transaction
//component
```

### Handling Sign Transaction/Sign Messages Request

```tsx
//show pseudo code switching on request type and returning signing component
```

## Conclusion

# Demo

### 0. Prerequisites

Before we actually start programming our wallet we need to do some setup. You will need a React Native developer environment and a Solana dApp to test on. If you have completed the [Basic Solana Mobile lesson](), both of these requirements should be met with the counter app installed on your android device/emulator.

If you *haven't* completed the last lesson you will need to:

1. Setup an [Android React Native developer environment](https://reactnative.dev/docs/environment-setup) with a device or emulator
2. Install a [Devnet Solana dApp](https://github.com/Unboxed-Software/solana-react-native-counter.git)


If you want to install the app from the previous lesson, you can:

```bash
git clone https://github.com/Unboxed-Software/solana-react-native-counter.git
cd solana-react-native-counter
git checkout solution
npm i
npm run install
```

### 1. Plan out App Structure

-- Wallet First
- Wallet Provider
- MainScreen
- App.tsx

-- Popup Pt 1 ( Getting it to Work )
- MWAApp.tsx
- index.js

-- Popup Pt 2 ( Implementing Others )
- clientTrust.ts

-- Popup Pt 3 ( All Else )
- dapp.ts
- Authorize
- SignAndSend

### 2. Create the App

Let's create the app with:
```bash
npx react-native@latest init wallet --npm
cd wallet
```

Now, let's install our dependancies. These are the exact same dependancies from our [Basic Solana Mobile lesson](), with two additions: `@react-native-async-storage/async-storage`, and a polyfill: `fast-text-encoding`.

We will be using `async-storage` to store our Keypair so that the wallet will stay persistent through multiple sessions. It is important to note `async-storage` is ***NOT*** a safe place to keep your keys, do not use this in production. Instead, take a look at [Android's keystore system.](https://developer.android.com/privacy-and-security/keystore)

Install the dependancies with:
```bash
npm install \
  @solana/web3.js \
  @solana-mobile/mobile-wallet-adapter-protocol-web3js \
  @solana-mobile/mobile-wallet-adapter-protocol \
  react-native-get-random-values \
  buffer \
  @coral-xyz/anchor \
  assert \
  bs58 \
  @react-native-async-storage/async-storage \
  fast-text-encoding
```

The next step is a bit messy. We need to depend on Solana's `mobile-wallet-adapter-walletlib` package. However, this package is still in development and is not available through npm. From their github:

>This package is still in alpha and is not production ready. However, the API is stable and will not change drastically, so you can begin integration with your wallet.

So we have to clone the repo, grab the package and make some minor edits.

Let's clone and extract the package into a new directory `lib`:
```bash
git clone https://github.com/solana-mobile/mobile-wallet-adapter.git
mkdir lib
cp -rf mobile-wallet-adapter/js/packages/mobile-wallet-adapter-walletlib ./lib
rm -rf mobile-wallet-adapter
```

Now we have to make some slight edits for our app to compile and resolve the new package.

First, in `android/build.gradle`, change the `minSdkVersion` to version `23`.
```gradle
  minSdkVersion = 23
```

In `lib/mobile-wallet-adapter-walletlib/src/index.ts` remove all `.js` from the end of the exports.
```ts
export * from './mwaSessionEvents';
export * from './resolve';
export * from './useMobileWalletAdapterSession';
export * from './useDigitalAssetLinks';
```

In `lib/mobile-wallet-adapter-walletlib/src/useMobileWalletAdapterSession.ts` remove the `.js` from the following imports:
```ts
import { MWASessionEvent, MWASessionEventType } from './mwaSessionEvents';
import { MWARequest, MWARequestType } from './resolve';
```

In `lib/mobile-wallet-adapter-walletlib\android\src\main\java\com\solanamobile\mobilewalletadapterwalletlib\reactnative\MobileWalletAdapterBottomSheetActivity.kt` comment out the `protected fun isConcurrentRootEnabled() = false` line at the very bottom.
```kt
// override protected fun isConcurrentRootEnabled() = false
```

Lastly, add `@solana-mobile/mobile-wallet-adapter-walletlib` to our `package.json` dependancies with the filepath as the resolution:
```json
"dependencies": {
    "@solana-mobile/mobile-wallet-adapter-walletlib": "file:./lib/mobile-wallet-adapter-walletlib",
}
```

Finish setup off with installing the packages and building the app. You should get the default React Native app showing up on your device.
```bash
npm i
npm run android
```

If you get any errors make sure you double check you've followed all of the steps above.

### Wallet Component
The first part of our wallet app is the actual app part, it will do the following:

- Generate a `Keypair` on first load
- Display the address and balance
- Allow users to airdrop some Devnet sol to their wallet

This can all be accomplished in two additional files:

`WalletProvider.tsx` - Generates a Keypair and stores it in `async-storage` and fetches the Keypair on subsequent sessions. It also provides the `Connection`.

`MainScreen.tsx` - Shows the wallet, it's balance and an airdrop button.


Let's start with the `WalletProvider.tsx`. This file will use `async-storage` to store a base58 encoded version of a `Keypair`. The provider will check the storage key of `@my_fake_wallet_keypair_key`, if nothing returns, then the provider should generate and store a keypair. The `WalletProvider` will then return it's context including the `wallet` and `connection`, so the rest of the app can access it using `useWallet()`.

Create a new directory `components` and a new file `WalletProvider.tsx` within it
```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Connection, Keypair} from '@solana/web3.js';
import {encode, decode} from 'bs58';
import {ReactNode, createContext, useContext, useEffect, useState} from 'react';

const ASYNC_STORAGE_KEY = '@my_fake_wallet_keypair_key';

interface EncodedKeypair {
  publicKeyBase58: string;
  secretKeyBase58: string;
};


function encodeKeypair(keypair: Keypair): EncodedKeypair {
  return {
    publicKeyBase58: keypair.publicKey.toBase58(),
    secretKeyBase58: encode(keypair.secretKey),
  };
};

function decodeKeypair(encodedKeypair: EncodedKeypair): Keypair {
  const secretKey = decode(encodedKeypair.secretKeyBase58);
  return Keypair.fromSecretKey(secretKey);
};

export interface WalletContextData {
  wallet: Keypair | null;
  connection: Connection;
};

const WalletContext = createContext<WalletContextData>({
  wallet: null,
  connection: new Connection('https://api.devnet.solana.com'),
});

export const useWallet = () => useContext(WalletContext);



export interface WalletProviderProps {
  rpcUrl?: string;
  children: ReactNode;
}

export function WalletProvider(props: WalletProviderProps){
  const { rpcUrl, children } = props;
  const [keyPair, setKeyPair] = useState<Keypair | null>(null);

  const fetchOrGenerateKeypair = async () => {
    try {
      const storedKey = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      let keyPair;
      if (storedKey && storedKey !== null) {
        const encodedKeypair: EncodedKeypair = JSON.parse(storedKey);
        keyPair = decodeKeypair(encodedKeypair);
      } else {
        // Generate a new random pair of keys and store them in local storage for later retrieval
        // This is not secure! Async storage is used for demo purpose. Never store keys like this!
        keyPair = await Keypair.generate();
        await AsyncStorage.setItem(
          ASYNC_STORAGE_KEY,
          JSON.stringify(encodeKeypair(keyPair)),
        );
      }
      setKeyPair(keyPair);
    } catch (e) {
      console.log('error getting keypair: ', e);
    }
  };

  useEffect(() => {
    fetchOrGenerateKeypair();
  }, []);

  const value = {
    wallet: keyPair,
    connection: new Connection(rpcUrl ?? 'https://api.devnet.solana.com'),
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
```

Now let's make the `MainScreen.tsx`. It's pretty simple, it grabs the `wallet` and `connection` from `useWallet()`, and then shows the address and balance. To make the wallet usable it also has an airdrop button. This is needed to send any type of transaction.

Create a new directory `screens` and place `MainScreen.tsx` within in:
```tsx
import {Button, StyleSheet, Text, View} from 'react-native';
import {useWallet} from '../components/WalletProvider';
import {useEffect, useState} from 'react';
import {LAMPORTS_PER_SOL} from '@solana/web3.js';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center', // Centers children along the main axis (vertically for column)
    alignItems: 'center', // Centers children along the cross axis (horizontally for column)
  },
});

function MainScreen(){
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<null | number>(null);
  const {wallet, connection} = useWallet();

  useEffect(() => {
    updateBalance();
  }, [wallet]);

  const updateBalance = async () => {
    if (wallet) {
      await connection.getBalance(wallet.publicKey).then(lamports => {
        setBalance(lamports / LAMPORTS_PER_SOL);
      });
    }
  };

  const airdrop = async () => {
    if (wallet && !isLoading) {
      setIsLoading(true);
      try {
        const signature = await connection.requestAirdrop(
          wallet.publicKey,
          LAMPORTS_PER_SOL,
        );
        await connection.confirmTransaction(signature);
        await updateBalance();
      } catch (e) {
        console.log(e);
      }

      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Wallet:</Text>
      <Text>{wallet?.publicKey.toString() ?? 'No Wallet'}</Text>
      <Text>Balance:</Text>
      <Text>{balance?.toFixed(5) ?? ''}</Text>
      {isLoading && <Text>Loading...</Text>}
      {balance != null && !isLoading && balance < 0.005 && (
        <Button title="Airdrop 1 SOL" onPress={airdrop} />
      )}
    </View>
  );
};

export default MainScreen;
```

Lastly, let's edit the `App.tsx` file to complete the 'app' section of our wallet:
```tsx
import {SafeAreaView, Text, View} from 'react-native';
import MainScreen from './screens/MainScreen';
import 'react-native-get-random-values';
import { WalletProvider } from './components/WalletProvider';
import React from 'react';

function App(): JSX.Element {
  return (
      <SafeAreaView>
        <WalletProvider>
          <MainScreen />
        </WalletProvider>
      </SafeAreaView>
  );
}

export default App;

```

Make sure everything is working by building and deploying:
```bash
npm run android
```

### Barebones MWA App
The MWA 'app' is what is seen when a Solana dApp sends out an intent for `solana-wallet://`. Our MWA app will listen for this, establish a connection and render this app. Fortunately, we don't have to implement anything low-level. Solana has done the hard work for us in the `mobile-wallet-adapter-walletlib` library. All we have to do is create the view and handle the requests! If you want to know more about how the connection is made, you can take a [look at the spec](https://github.com/solana-mobile/mobile-wallet-adapter/blob/main/spec/spec.md). 

Let's start out with the absolute bare bones of of the MWA app. All it will do is pop up when a dApp connects to it and simply say 'I'm a wallet'.

To make this pop up when a Solana dApp requests access, we'll need the `useMobileWalletAdapterSession` from the walletlib. This requires a four things:

- `walletName` - name of the wallet
- `config` - some simple wallet configurations of type `MobileWalletAdapterConfig`
- `handleRequest` - callback function to handle requests from the dApp
- `handleSessionEvent` - callback function to handle session events 

Here is an example of the minimum setup to satisfy `useMobileWalletAdapterSession`:
```tsx
  const config: MobileWalletAdapterConfig = useMemo(() => {
    return {
      supportsSignAndSendTransactions: true,
      maxTransactionsPerSigningRequest: 10,
      maxMessagesPerSigningRequest: 10,
      supportedTransactionVersions: [0, 'legacy'],
      noConnectionWarningTimeoutMs: 3000,
    };
  }, []);

  const handleRequest = useCallback((request: MWARequest) => {
  }, []);

  const handleSessionEvent = useCallback((sessionEvent: MWASessionEvent) => {
  }, []);

  useMobileWalletAdapterSession(
    'React Native Fake Wallet',
    config,
    handleRequest,
    handleSessionEvent,
  );
```

We will be implementing function into `handleRequest` and `handleSessionEvent` soon, but first let's make the MWA app work.

Create a new file in the root of your project `MWAApp.tsx`:
```tsx
import {useCallback, useMemo } from 'react';
import { SafeAreaView, StyleSheet, Text, View} from 'react-native';
import { WalletProvider } from './components/WalletProvider';
import { MWARequest, MWASessionEvent, MobileWalletAdapterConfig, useMobileWalletAdapterSession } from './lib/mobile-wallet-adapter-walletlib/src';


const styles = StyleSheet.create({
  container: {
    margin: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: 'black',
  },
});

function MWAApp(){

  const config: MobileWalletAdapterConfig = useMemo(() => {
    return {
      supportsSignAndSendTransactions: true,
      maxTransactionsPerSigningRequest: 10,
      maxMessagesPerSigningRequest: 10,
      supportedTransactionVersions: [0, 'legacy'],
      noConnectionWarningTimeoutMs: 3000,
    };
  }, []);

  const handleRequest = useCallback((request: MWARequest) => {
  }, []);

  const handleSessionEvent = useCallback((sessionEvent: MWASessionEvent) => {
  }, []);

  useMobileWalletAdapterSession(
    'React Native Fake Wallet',
    config,
    handleRequest,
    handleSessionEvent,
  );

  
  return (
    <SafeAreaView>
        <WalletProvider>
            <View style={styles.container}>
                <Text style={{fontSize: 50}}>I'm a wallet!</Text>
            </View>
        </WalletProvider>
    </SafeAreaView>
  );
};

export default MWAApp;
```

The last thing we need to do to make this all work is to register our MWA app as an entrypoint in `index.js` under the name `MobileWalletAdapterEntrypoint`.

Change `index.js` to reflect the following:
```js
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import MWAApp from './MWAApp'

// Mock event listener functions to prevent them from fataling.
window.addEventListener = () => {};
window.removeEventListener = () => {};

AppRegistry.registerComponent(appName, () => App);

// Register the MWA component
AppRegistry.registerComponent(
'MobileWalletAdapterEntrypoint',
  () => MWAApp,
);
```

Let's now test this out. 

Build and deploy it:
```bash
npm run android
```

Open your Devnet Solana dApp, ideally the `counter` app from the previous lesson. Then make a request.


### Client Trust
Let's take a bit of a necessary detour and talk about client trust. When another app invokes our wallet, the dApp should provide us some information about the app that is accessing our wallet. With this, we should check some things to make sure the request is legitimate.

In a word, we will want to verify the external dApp, however it is out of scope of today's lesson. If you'd like to read more about how you would verify the app, the [spec has your responsibilities](https://solana-mobile.github.io/mobile-wallet-adapter/spec/spec.html#dapp-identity-verification) laid out.   

//TODO

Create a new folder `utils` and create the `clientTrust.ts` file within it:
```ts
import {
    getCallingPackageUid,
    verifyCallingPackage,
  } from '../lib/mobile-wallet-adapter-walletlib/src';
  
  enum AssociationType {
    LocalFromBrowser = 'web',
    LocalFromApp = 'app',
    Remote = 'rem',
  }
  
  abstract class VerificationStateBase {
    private static SCOPE_DELIMITER = ',';
    private scopeTag: string;
    private qualifier?: string;
    readonly authorizationScope!: string;
  
    constructor(scopeTag: string, qualifier?: string) {
      this.scopeTag = scopeTag;
      this.qualifier = qualifier;
      this.authorizationScope =
        qualifier == null
          ? scopeTag
          : `${scopeTag}${VerificationStateBase.SCOPE_DELIMITER}${qualifier}`;
    }
  }
  export class VerificationInProgress extends VerificationStateBase {
    constructor(scopeTag: string) {
      super(scopeTag);
    }
  }
  export class VerificationSucceeded extends VerificationStateBase {
    constructor(scopeTag: string, qualifier: string) {
      super(scopeTag, qualifier);
    }
  }
  export class VerificationFailed extends VerificationStateBase {
    constructor(scopeTag: string) {
      super(scopeTag);
    }
  }
  export class NotVerifiable extends VerificationStateBase {
    constructor(scopeTag: string) {
      super(scopeTag);
    }
  }
  export type VerificationState =
    | VerificationInProgress
    | VerificationSucceeded
    | VerificationFailed
    | NotVerifiable;
  
  export function verificationStatusText (
    verificationState: VerificationState | undefined,
  ): string {
    if (verificationState instanceof VerificationInProgress)
      return 'Verification In Progress';
    if (verificationState instanceof VerificationFailed)
      return 'Verification Failed';
    if (verificationState instanceof VerificationSucceeded)
      return 'Verification Succeeded';
    if (verificationState instanceof NotVerifiable) return 'Not Verifiable';
    else return 'Verification in progress';
  };
  
  export class ClientTrust {
    private static SCOPE_DELIMITER = ',';
  
    static readonly LOCAL_PATH_SUFFIX = 'v1/associate/local';
    static readonly REMOTE_PATH_SUFFIX = 'v1/associate/remote';
  
    readonly callingPackage?: string;
    readonly associationType!: AssociationType;
  
    constructor(associationUri: string, callingPackage?: string) {
      this.callingPackage = callingPackage;
      this.associationType = this.getAssociationType(associationUri);
    }
  
    private getAssociationType(associationUri: string): AssociationType {
      const parsedUri = associationUri.split('?')[0];
      if (parsedUri.endsWith(ClientTrust.LOCAL_PATH_SUFFIX)) {
        if (this.callingPackage != null) return AssociationType.LocalFromApp;
        else return AssociationType.LocalFromBrowser;
      } else if (parsedUri.endsWith(ClientTrust.REMOTE_PATH_SUFFIX)) {
        return AssociationType.Remote;
      } else {
        throw new Error(
          `Unrecognized association URI type. Provided URI = ${parsedUri}`,
        );
      }
    }
  
    async verifyAuthorizationSource(
      clientIdentityUri?: string,
    ): Promise<VerificationState> {
      switch (this.associationType) {
        case AssociationType.LocalFromBrowser:
          if (clientIdentityUri) {
            //implement actual web based verification here
            await setTimeout(() => {}, 1500); //simulating web verification
            console.debug(
              'Web-scoped authorization verification not yet implemented',
            );
            return new VerificationSucceeded(
              AssociationType.LocalFromBrowser,
              new URL(clientIdentityUri).host,
            );
          } else {
            console.debug(
              'Client did not provide an identity url. Not verifiable',
            );
            return new NotVerifiable(AssociationType.LocalFromBrowser);
          }
  
        case AssociationType.LocalFromApp:
          if (clientIdentityUri) {
            const verified = await verifyCallingPackage(clientIdentityUri);
            if (verified) {
              const uid = await getCallingPackageUid();
              console.debug(`App-scoped authorization succeeded. UID: '${uid}'`);
              return new VerificationSucceeded(AssociationType.LocalFromApp, uid);
            } else {
              console.log(
                `App-scoped authorization failed for '${clientIdentityUri}'`,
              );
              return new VerificationFailed(AssociationType.LocalFromApp);
            }
          } else {
            console.debug(
              'Client did not provide an identity url. Not verifiable',
            );
            return new NotVerifiable(AssociationType.LocalFromApp);
          }
        case AssociationType.Remote:
          console.log('Remote authorizations are not verifiable');
          return new NotVerifiable(AssociationType.Remote);
      }
    }
  
    async verifyReauthorizationSource(
      authorizationScope: string,
      clientIdentityUri?: string,
    ): Promise<VerificationState> {
      if (!authorizationScope.startsWith(this.associationType)) {
        console.warn('Reauthorization failed; association type mismatch');
        return new VerificationFailed(this.associationType);
      } else if (authorizationScope.length == this.associationType.length) {
        console.debug('Unqualified authorization scopes are not verifiable');
        return new NotVerifiable(this.associationType);
      } else {
        return this.verifyAuthorizationSource(clientIdentityUri);
      }
    }
  
    async verifyPrivilegedMethodSource(
      authorizationScope: string,
    ): Promise<boolean> {
      if (authorizationScope.startsWith(AssociationType.LocalFromBrowser)) {
        if (this.associationType != AssociationType.LocalFromBrowser) {
          console.warn(
            'Attempt to use a web-scoped authorization with a non-web client',
          );
          return false;
        } else if (
          authorizationScope.length == AssociationType.LocalFromBrowser.length
        ) {
          console.debug('Unqualified web-scoped authorization, continuing');
          return true;
        } else if (
          authorizationScope[AssociationType.LocalFromBrowser.length] !=
          ClientTrust.SCOPE_DELIMITER
        ) {
          console.warn(
            `Unexpected character '${
              authorizationScope[AssociationType.LocalFromBrowser.length]
            }' in scope; expected '${ClientTrust.SCOPE_DELIMITER}'`,
          );
          return false;
        } else {
          console.debug(
            'Treating qualified web-scoped authorization as a bearer token, continuing',
          );
          return true;
        }
      } else if (authorizationScope.startsWith(AssociationType.LocalFromApp)) {
        if (this.associationType != AssociationType.LocalFromApp) {
          console.warn(
            'Attempt to use an app-scoped authorization with a non-app client',
          );
          return false;
        } else if (
          authorizationScope.length == AssociationType.LocalFromApp.length
        ) {
          console.debug('Unqualified app-scoped authorization, continuing');
          return true;
        } else if (
          authorizationScope[AssociationType.LocalFromApp.length] !=
          ClientTrust.SCOPE_DELIMITER
        ) {
          console.warn(
            `Unexpected character '${
              authorizationScope[AssociationType.LocalFromApp.length]
            }' in scope; expected '${ClientTrust.SCOPE_DELIMITER}'`,
          );
          return false;
        } else {
          var scopeUid: number;
          try {
            scopeUid = Number(
              authorizationScope.substring(
                AssociationType.LocalFromApp.length + 1,
              ),
            );
          } catch (e) {
            console.warn('App-scoped authorization has invalid UID');
            return false;
          }
  
          var callingUid: number;
          try {
            callingUid = await getCallingPackageUid();
          } catch (e) {
            console.warn('Calling package is invalid');
            return false;
          }
  
          if (scopeUid == callingUid) {
            console.debug(
              'App-scoped authorization matches calling identity, continuing',
            );
            return true;
          } else {
            console.warn(
              'App-scoped authorization does not match calling identity',
            );
            return false;
          }
        }
      } else if (authorizationScope == AssociationType.Remote) {
        if (this.associationType != AssociationType.Remote) {
          console.warn(
            'Attempt to use a remote-scoped authorization with a local client',
          );
          return false;
        } else {
          console.debug('Authorization with remote source, continuing');
          return true;
        }
      } else {
        console.warn('Unknown authorization scope');
        return false;
      }
    }
  }
```

### Setup MWA App
Let's flesh out our MWAApp.tsx

Change your `MWAApp.tsx` to reflect the following:
```tsx
import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  BackHandler,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {WalletProvider} from './components/WalletProvider';
import {
  AuthorizeDappRequest,
  MWARequest,
  MWARequestFailReason,
  MWARequestType,
  MWASessionEvent,
  MWASessionEventType,
  MobileWalletAdapterConfig,
  ReauthorizeDappCompleteResponse,
  ReauthorizeDappResponse,
  SignAndSendTransactionsRequest,
  getCallingPackage,
  resolve,
  useMobileWalletAdapterSession,
} from './lib/mobile-wallet-adapter-walletlib/src';
import {
  ClientTrust,
  NotVerifiable,
  VerificationFailed,
  VerificationSucceeded,
} from './utils/clientTrust';

const styles = StyleSheet.create({
  container: {
    margin: 0,
    width: '100%',
    backgroundColor: 'black',
    color: 'black',
  },
});

function MWAApp() {
  const [currentRequest, setCurrentRequest] = useState<MWARequest | null>(null);
  const [currentSession, setCurrentSession] = useState<MWASessionEvent | null>(
    null,
  );
  const [clientTrust, setClientTrust] = useState<ClientTrust | null>(null);

  // ------------------- FUNCTIONS --------------------

  const endWalletSession = useCallback(() => {
    setTimeout(() => {
      BackHandler.exitApp();
    }, 200);
  }, []);

  const handleRequest = useCallback((request: MWARequest) => {
    setCurrentRequest(request);
  }, []);

  const handleSessionEvent = useCallback((sessionEvent: MWASessionEvent) => {
    setCurrentSession(sessionEvent);
  }, []);

  // ------------------- EFFECTS --------------------

  useEffect(() => {
    const initClientTrust = async () => {
      const url = await Linking.getInitialURL();
      const callingPackage: string | undefined = await getCallingPackage();
      const newClientTrust = new ClientTrust(url ?? '', callingPackage);

      setClientTrust(newClientTrust);
    };

    initClientTrust();

    BackHandler.addEventListener('hardwareBackPress', () => {
      resolve(currentRequest as any, {
        failReason: MWARequestFailReason.UserDeclined,
      });
      return false;
    });
  }, []);

  useEffect(() => {
    if (currentSession?.__type == MWASessionEventType.SessionTerminatedEvent) {
      endWalletSession();
    }
  }, [currentSession]);

  useEffect(() => {
    if (!currentRequest) {
      return;
    }

    if (currentRequest.__type == MWARequestType.ReauthorizeDappRequest) {
      let request = currentRequest;
      const authorizationScope = new TextDecoder().decode(
        request.authorizationScope,
      );

      Promise.race([
        clientTrust!!.verifyReauthorizationSource(
          authorizationScope,
          request.appIdentity?.identityUri,
        ),
        async () => {
          setTimeout(() => {
            throw new Error(
              'Timed out waiting for reauthorization source verification',
            );
          }, 3000);
        },
      ])
        .then(verificationState => {
          if (verificationState instanceof VerificationSucceeded) {
            console.log('Reauthorization source verification succeeded');
            resolve(request, {
              authorizationScope: new TextEncoder().encode(
                verificationState?.authorizationScope,
              ),
            } as ReauthorizeDappCompleteResponse);
          } else if (verificationState instanceof NotVerifiable) {
            console.log('Reauthorization source not verifiable; approving');
            resolve(request, {
              authorizationScope: new TextEncoder().encode(
                verificationState?.authorizationScope,
              ),
            } as ReauthorizeDappCompleteResponse);
          } else if (verificationState instanceof VerificationFailed) {
            console.log('Reauthorization source verification failed');
            resolve(request, {
              failReason: MWARequestFailReason.AuthorizationNotValid,
            });
          }
        })
        .catch(() => {
          console.log(
            'Timed out waiting for reauthorization source verification',
          );
          resolve(request, {
            failReason: 'Timed out in verification',
          } as ReauthorizeDappResponse);
        });
    }
  }, [currentRequest, endWalletSession]);

  // ------------------- MWA --------------------

  const config: MobileWalletAdapterConfig = useMemo(() => {
    return {
      supportsSignAndSendTransactions: true,
      maxTransactionsPerSigningRequest: 10,
      maxMessagesPerSigningRequest: 10,
      supportedTransactionVersions: [0, 'legacy'],
      noConnectionWarningTimeoutMs: 3000,
    };
  }, []);

  useMobileWalletAdapterSession(
    'React Native Fake Wallet',
    config,
    handleRequest,
    handleSessionEvent,
  );

  // ------------------- RENDER --------------------

  const renderRequest = () => {
    if (!currentRequest) {
      return <Text>No request</Text>;
    }
  
    if (!clientTrust) {
      return <Text>No client trust</Text>;
    }
  
    switch (currentRequest?.__type) {
      case MWARequestType.AuthorizeDappRequest:
      case MWARequestType.SignAndSendTransactionsRequest:
      case MWARequestType.SignMessagesRequest:
      case MWARequestType.SignTransactionsRequest:
      default:
        return <Text>TODO Show screen for {currentRequest?.__type}</Text>;
    }
  }

  // ------------------- RENDER --------------------

  return (
    <SafeAreaView>
      <WalletProvider>
        <View style={styles.container}>
          <Text>REQUEST: {currentRequest?.__type.toString()}</Text>
          {renderRequest()}
        </View>
      </WalletProvider>
    </SafeAreaView>
  );
}

export default MWAApp;
```

### Extra Components
Lets take one more detour and create some nice helper UI components. Simply, we will define a format for some text with `AppState.tsx` and some buttons in `ButtonGroup.tsx`.

`AppInfo` will show us all relevant information coming from the dApp:

```ts
  interface AppInfoProps {
    iconSource?: any; 
    title?: string;
    cluster?: string;
    appName?: string;
    uri?: string;
    verificationText?: string;
    scope?: string;
  }
```

Create `components/AppInfo.tsx`:
```tsx
import {Image, Text, View} from 'react-native';

interface AppInfoProps {
  iconSource?: any;
  title?: string;
  cluster?: string;
  appName?: string;
  uri?: string;
  verificationText?: string;
  scope?: string;
}

function AppInfo(props: AppInfoProps) {
  const {iconSource, title, cluster, appName, uri, verificationText, scope} =
    props;
  return (
    <>
      {iconSource ? (
        <View>
          <Image source={iconSource} />
        </View>
      ) : null}
      <Text>{title}</Text>
      <View>
        <Text>Request Metadata</Text>
        <Text>Cluster: {cluster ? cluster : 'NA'}</Text>
        <Text>App name: {appName ? appName : 'NA'}</Text>
        <Text>App URI: {uri ? uri : 'NA'}</Text>
        <Text>Status: {verificationText ? verificationText : 'NA'}</Text>
        <Text>Scope: {scope ? scope : 'NA'}</Text>
      </View>
    </>
  );
}

export default AppInfo;
```

Now, let's create a component that groups an accept and reject button together.

Create `components/ButtonGroup.tsx`
```tsx
import {Button, Dimensions, StyleSheet, View} from 'react-native';

const styles = StyleSheet.create({
  button: {flex: 1, marginHorizontal: 8},
  buttonGroup: {
    width: Dimensions.get('window').width,
    display: 'flex',
    flexDirection: 'row',
    marginVertical: 16,
  },
});

interface ButtonGroupProps {
  positiveOnClick: () => any;
  negativeOnClick: () => any;
  positiveButtonText: string;
  negativeButtonText: string;
}
const ButtonGroup = (props: ButtonGroupProps) => {
  return (
    <View style={styles.buttonGroup}>
      <Button
        onPress={props.positiveOnClick}
        title={props.positiveButtonText}
      />
      <Button
        onPress={props.negativeOnClick}
        title={props.negativeButtonText}
      />
    </View>
  );
};

export default ButtonGroup;
```

### dapp

```tsx
import {
  Connection,
  Keypair,
  SendOptions,
  Signer,
  TransactionSignature,
  VersionedTransaction,
  clusterApiUrl,
} from '@solana/web3.js';
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

        const sendOptions: SendOptions = {
          minContextSlot: minContextSlot,
          preflightCommitment: 'finalized',
          skipPreflight: true,
        };
        const signature: TransactionSignature =
          await connection.sendTransaction(transaction, sendOptions);

        const response = await connection.confirmTransaction(
          signature,
          'confirmed',
        );

        return decode(signature);
      } catch (error) {
        console.log('Failed sending transaction ' + error);
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

export function signTransactionRaw(
  transactionBytes: Uint8Array,
  keypair: Keypair,
): Uint8Array {
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
}

export function getIconFromIdentityUri(appIdentity?: any) {
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
}

```

### Authorize Screen

```tsx
import 'fast-text-encoding';
import React, { useEffect, useState } from "react";
import { useWallet } from "../components/WalletProvider";
import { ClientTrust, VerificationState, verificationStatusText } from "../utils/clientTrust";
import { AuthorizeDappCompleteResponse, AuthorizeDappRequest, MWARequestFailReason, resolve } from "../lib/mobile-wallet-adapter-walletlib/src";
import { getIconFromIdentityUri } from "../utils/dapp";
import AppInfo from "../components/AppInfo";
import ButtonGroup from "../components/ButtonGroup";
import { Text, View } from "react-native";

export interface AuthorizeDappRequestScreenProps {
  request: AuthorizeDappRequest;
  clientTrust: ClientTrust;
}

function AuthorizeDappRequestScreen(props: AuthorizeDappRequestScreenProps){
  const { request, clientTrust } = props;
  const { wallet } = useWallet();
  const [ verificationState, setVerificationState ] = useState<VerificationState | undefined>(undefined);

  if(!wallet){
    throw new Error('No wallet found')
  }

  useEffect(() => {
    const verifyClient = async () => {
      const verificationState =
        await clientTrust?.verifyAuthorizationSource(
          request.appIdentity?.identityUri,
        );
      setVerificationState(verificationState);
    };

    verifyClient();
  }, []);

  const authorize = () => {
    resolve(request, {
      publicKey: wallet?.publicKey.toBytes(),
      accountLabel: 'Backpack',
      authorizationScope: new TextEncoder().encode(
        verificationState?.authorizationScope,
      ),
    } as AuthorizeDappCompleteResponse);
  }

  const reject = () => { 
    resolve(request, {
      failReason: MWARequestFailReason.UserDeclined,
    });
  }


  return (
    <View >
      <AppInfo
        iconSource={getIconFromIdentityUri(request.appIdentity)}
        title="Authorize Dapp"
        appName={request.appIdentity?.identityName}
        uri={request.appIdentity?.identityUri}
        cluster={request.cluster}
        verificationText={verificationStatusText(verificationState)}
        scope={verificationState?.authorizationScope}
      />

      <ButtonGroup
        positiveButtonText="Authorize"
        negativeButtonText="Decline"
        positiveOnClick={authorize}
        negativeOnClick={reject}
      />
    </View>
  );
};

export default AuthorizeDappRequestScreen;

```

### Sign and Send Screen

```tsx
import {Connection, Keypair} from '@solana/web3.js';
import {useState, useEffect} from 'react';
import {
  MWARequestFailReason,
  SignAndSendTransactionsRequest,
  resolve,
} from '../lib/mobile-wallet-adapter-walletlib/src';
import {
  SendTransactionsError,
  getIconFromIdentityUri,
  getSignedPayloads,
  sendSignedTransactions,
} from '../utils/dapp';
import {useWallet} from '../components/WalletProvider';
import {ClientTrust, VerificationState, verificationStatusText} from '../utils/clientTrust';
import {Text, View} from 'react-native';
import AppInfo from '../components/AppInfo';
import ButtonGroup from '../components/ButtonGroup';

export interface SignAndSendTransactionScreenProps {
  request: SignAndSendTransactionsRequest;
  clientTrust: ClientTrust;
}

function SignAndSendTransactionScreen(
  props: SignAndSendTransactionScreenProps,
) {
  const {request, clientTrust} = props;
  const {wallet, connection} = useWallet();
  const [loading, setLoading] = useState(false);
  const [verificationState, setVerificationState] = useState<
    VerificationState | undefined
  >(undefined);

  if (!wallet) {
    throw new Error('Wallet is null or undefined');
  }

  useEffect(() => {
    const verifyClient = async () => {
      const authScope = new TextDecoder().decode(request.authorizationScope);
      const verificationState = await clientTrust?.verifyAuthorizationSource(
        request.appIdentity?.identityUri,
      );
      setVerificationState(verificationState);

      const verifyClient = async () => {
        const verificationState = await clientTrust?.verifyAuthorizationSource(
          request.appIdentity?.identityUri,
        );
        setVerificationState(verificationState);
      };

      verifyClient();

      const verified = await clientTrust?.verifyPrivilegedMethodSource(
        authScope,
      );

      //soft decline, not great UX. Should tell the user that client was not verified
      if (!verified) {
        resolve(request, {
          failReason: MWARequestFailReason.UserDeclined,
        });
      }
    };

    verifyClient();
  }, []);

  const signAndSendTransaction = async (
    wallet: Keypair,
    connection: Connection,
    request: SignAndSendTransactionsRequest,
  ) => {
    const [valid, signedTransactions] = getSignedPayloads(
      request.__type,
      wallet,
      request.payloads,
    );

    if (valid.includes(false)) {
      resolve(request, {
        failReason: MWARequestFailReason.InvalidSignatures,
        valid,
      });
      return;
    }

    try {
      const sigs = await sendSignedTransactions(
        signedTransactions,
        request.minContextSlot ? request.minContextSlot : undefined,
        connection,
      );
      resolve(request, {signedTransactions: sigs});
    } catch (e) {
      console.log('Send error: ' + e);
      if (e instanceof SendTransactionsError) {
        resolve(request, {
          failReason: MWARequestFailReason.InvalidSignatures,
          valid: e.valid,
        });
      } else {
        throw e;
      }
    }
  };

  const signAndSend = async () => {
    if (loading) return;
    setLoading(true);
    signAndSendTransaction(wallet, connection, request).finally(() =>
      setLoading(false),
    );
  };

  const reject = () => {
    resolve(request, {failReason: MWARequestFailReason.UserDeclined});
  }

  return (
    <View>
      <AppInfo
        iconSource={getIconFromIdentityUri(request.appIdentity)}
        title="Sign and Send Transaction"
        appName={request.appIdentity?.identityName}
        uri={request.appIdentity?.identityUri}
        cluster={request.cluster}
        verificationText={verificationStatusText(verificationState)}
        scope={verificationState?.authorizationScope}
      />
      <Text>Payloads</Text>
      <Text>
        This request has {request.payloads.length}{' '}
        {request.payloads.length > 1 ? 'payloads' : 'payload'} to sign.
      </Text>
      <ButtonGroup
        positiveButtonText="Sign and Send"
        negativeButtonText="Reject"
        positiveOnClick={signAndSend}
        negativeOnClick={reject}
      />
      {loading && <Text>Loading...</Text>}
    </View>
  );
}

export default SignAndSendTransactionScreen;
```

### Finish MWA App

```tsx
  const renderRequest = () => {
    if (!currentRequest) {
      return <Text>No request</Text>;
    }

    if (!clientTrust) {
      return <Text>No client trust</Text>;
    }

    switch (currentRequest?.__type) {
      case MWARequestType.AuthorizeDappRequest:
        return (
          <AuthorizeDappRequestScreen
            request={currentRequest as AuthorizeDappRequest}
            clientTrust={clientTrust}
          />
        );
      case MWARequestType.SignAndSendTransactionsRequest:
        return (
          <SignAndSendTransactionScreen
            request={currentRequest as SignAndSendTransactionsRequest}
            clientTrust={clientTrust}
          />
        );
      case MWARequestType.SignMessagesRequest:
      case MWARequestType.SignTransactionsRequest:
      default:
        return <Text>TODO Show screen for {currentRequest?.__type}</Text>;
    }
  };
```

# Challenge


Implement screens for `MWARequestType.SignMessagesRequest` and `MWARequestType.SignTransactionsRequest`