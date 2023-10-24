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

1. Install the solana mobile counter we made in the previous lesson.
2. `git clone https://github.com/Unboxed-Software/solana-react-native-counter.git`
3. `git checkout solution`
4. `npm install`
5. `npm run install`

### 1. Plan out App Structure

`WalletProvider.tsx` - In charge of handling our Keypair. It will find our Keypair in AsyncStorage.


### 2. Create the App

Going to take out the verification.


```bash
npx react-native@latest init wallet --npm
cd wallet
```

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
  @react-native-async-storage/async-storage
```

```bash
git clone https://github.com/solana-mobile/mobile-wallet-adapter.git
mkdir lib
cp -rf mobile-wallet-adapter/js/packages/mobile-wallet-adapter-walletlib ./lib
rm -rf mobile-wallet-adapter
```

In `lib/mobile-wallet-adapter-walletlib/src/index.ts`
```ts
export * from './mwaSessionEvents';
export * from './resolve';
export * from './useMobileWalletAdapterSession';
export * from './useDigitalAssetLinks';
```

In `lib/mobile-wallet-adapter-walletlib/src/useMobileWalletAdapterSession.ts`
```ts
import { MWASessionEvent, MWASessionEventType } from './mwaSessionEvents';
import { MWARequest, MWARequestType } from './resolve';
```

In `lib/mobile-wallet-adapter-walletlib\android\src\main\java\com\solanamobile\mobilewalletadapterwalletlib\reactnative\MobileWalletAdapterBottomSheetActivity.kt`
```kt
// override protected fun isConcurrentRootEnabled() = false
```

```json
"dependencies": {
    "@solana-mobile/mobile-wallet-adapter-walletlib": "file:./lib/mobile-wallet-adapter-walletlib",
}
```

### Wallet Component
Let's get the easy stuff out of the way. The app portion of our wallet will create a keypair on startup, store it in AsyncStorage and display the public key. That's it. We can accomplish this in three files `WalletProvider.tsx`, `MainScreen.tsx` and editing `App.tsx`.

Create folders, `components` and `screens`

Wallet Provider
```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Connection, Keypair} from '@solana/web3.js';
import {encode, decode} from 'bs58';
import {ReactNode, createContext, useContext, useEffect, useState} from 'react';

const ASYNC_STORAGE_KEY = '@my_fake_wallet_keypair_key';

type EncodedKeypair = {
  publicKeyBase58: string;
  secretKeyBase58: string;
};

export type WalletContextType = {
  wallet: Keypair | null;
  connection: Connection;
};

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  connection: new Connection('https://api.devnet.solana.com'),
});

export const useWallet = () => useContext(WalletContext);


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

export interface WalletProviderProps {
  rpcUrl?: string;
  children: ReactNode;
}

export function WalletProvider(props: WalletProviderProps){
  const { rpcUrl } = props;
  const {children} = props;
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

Main Screen
```tsx
import {StyleSheet, Text, View} from 'react-native';
import { useWallet } from '../components/WalletProvider';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center', // Centers children along the main axis (vertically for column)
    alignItems: 'center',     // Centers children along the cross axis (horizontally for column)
  },
});

const MainScreen = () => {
  const {wallet} = useWallet();

  return (
    <View style={styles.container}>
        <Text>Wallet:</Text>
        <Text>{wallet?.publicKey.toString() ?? 'No Wallet'}</Text>
    </View>
  );
};

export default MainScreen;
```

App.tsx
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

### MWA Component

```js
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import MWAComponent from './components/MWAComponent'

// Mock event listener functions to prevent them from fataling.
window.addEventListener = () => {};
window.removeEventListener = () => {};

AppRegistry.registerComponent(appName, () => App);

// Register the MWA component
AppRegistry.registerComponent(
'MobileWalletAdapterEntrypoint',
  ()=> MWAComponent,
);
```

MWA Barebones
```tsx
import {useCallback, useMemo } from 'react';
import { SafeAreaView, StyleSheet, Text, View} from 'react-native';
import { WalletProvider } from './WalletProvider';
import { MWARequest, MWASessionEvent, MobileWalletAdapterConfig, useMobileWalletAdapterSession } from '../lib/mobile-wallet-adapter-walletlib/src';


const styles = StyleSheet.create({
  container: {
    margin: 0,
    bottom: 0,
    height: '34%',
    width: '100%',
    backgroundColor: 'white',
  },
});

export function MWAComponent(){

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
                <Text>I'm a wallet!</Text>
            </View>
        </WalletProvider>
    </SafeAreaView>
  );
};
```

utils/clientTrust.ts
```ts
import {
    getCallingPackageUid,
    verifyCallingPackage,
  } from '../mobile-wallet-adapter-walletlib/src';
  
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
  
  export const verificationStatusText = function (
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
          if (clientIdentityUri != null && clientIdentityUri != 'null') {
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
          if (clientIdentityUri != null && clientIdentityUri != 'null') {
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
      clientIdentityUri?: string,
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

components/ClientTrustProvider
```tsx
import {ClientTrust} from '../utils/clientTrust';
import {createContext, useContext, ReactNode} from 'react';

interface ClientTrustContextType {
  clientTrustUseCase: ClientTrust | null;
}

const ClientTrustContext = createContext<ClientTrustContextType>({
  clientTrustUseCase: null,
});

export const useClientTrust = () => useContext(ClientTrustContext);

type ClientTrustProviderProps = {
  clientTrustUseCase: ClientTrust | null;
  children: ReactNode;
};

const ClientTrustProvider = (props: ClientTrustProviderProps) => {
  return (
    <ClientTrustContext.Provider
      value={{clientTrustUseCase: props.clientTrustUseCase}}>
      {props.children}
    </ClientTrustContext.Provider>
  );
};

export default ClientTrustProvider;
```


dapp.ts
```ts
import {Keypair, Signer, VersionedTransaction} from '@solana/web3.js';
import {MWARequestType} from '../lib/mobile-wallet-adapter-walletlib/src';
import {sign} from '@solana/web3.js/src/utils/ed25519';

export const SIGNATURE_LEN = 64;
export const PUBLIC_KEY_LEN = 32;

export function signTransactionRaw(tsxBytes: Uint8Array, keypair: Keypair): Uint8Array {
  const tsx: VersionedTransaction =
    VersionedTransaction.deserialize(tsxBytes);
  const signer: Signer = {
    publicKey: keypair.publicKey,
    secretKey: keypair.secretKey,
  };
  tsx.sign([signer]);
  return tsx.serialize();
}

export function signMessageRaw(msgBytes: Uint8Array, keypair: Keypair) {
  return sign(msgBytes, keypair.secretKey.slice(0, 32));
}

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
```

MWAComponent.tsx
```tsx
import {useCallback, useEffect, useMemo, useState} from 'react';
import {BackHandler, Linking, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {WalletProvider} from './WalletProvider';
import {
  MWARequest,
  MWARequestFailReason,
  MWARequestType,
  MWASessionEvent,
  MWASessionEventType,
  MobileWalletAdapterConfig,
  ReauthorizeDappResponse,
  getCallingPackage,
  resolve,
  useMobileWalletAdapterSession,
} from '../lib/mobile-wallet-adapter-walletlib/src';
import ClientTrustProvider from './ClientTrustProvider';
import { ClientTrust, NotVerifiable, VerificationFailed, VerificationSucceeded } from '../utils/clientTrust';

const styles = StyleSheet.create({
  container: {
    margin: 0,
    height: '100%',
    width: '100%',
    backgroundColor: 'black',
    color: 'black',
  },
});

function getRequestScreenComponent(request: MWARequest | null | undefined){
  switch (request?.__type) {
    case MWARequestType.AuthorizeDappRequest:
    case MWARequestType.SignAndSendTransactionsRequest:
    case MWARequestType.SignMessagesRequest:
    case MWARequestType.SignTransactionsRequest:
    default: return (<Text>TODO Show screen for {request?.__type}</Text>)
  }
};

export function MWAComponent(){

  // ------------------ STATE -------------------
  const [currentRequest, setCurrentRequest] = useState<MWARequest | null>(null);
  const [currentSession, setCurrentSession] = useState<MWASessionEvent | null>(null);
  const [clientTrustUseCase, setClientTrustUseCase] = useState<ClientTrust | null>(null);

  // ------------------ EFFECTS -------------------
  useEffect(() => {
    initClientTrustUseCase();

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
      return;
    }

    if (!currentRequest) {
      return;
    }

    if (currentRequest.__type == MWARequestType.ReauthorizeDappRequest) {
      let request = currentRequest;
      const authorizationScope = new TextDecoder().decode(
        request.authorizationScope,
      );

      Promise.race([
        clientTrustUseCase!!.verifyReauthorizationSource(
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
            resolve(request, {} as ReauthorizeDappResponse);
          } else if (verificationState instanceof NotVerifiable) {
            console.log('Reauthorization source not verifiable; approving');
            resolve(request, {} as ReauthorizeDappResponse);
          } else if (verificationState instanceof VerificationFailed) {
            console.log('Reauthorization source verification failed');
            resolve(request as any, {failReason: MWARequestFailReason.UserDeclined});
          }
        })
        .catch(() => {
          console.log(
            'Timed out waiting for reauthorization source verification',
          );
          resolve(request as any, {
            failReason: 'Timed out in verification',
          });
        });
    }
  }, [currentRequest]);

  // ------------------ MEMOS -------------------

  const config: MobileWalletAdapterConfig = useMemo(() => {
    return {
      supportsSignAndSendTransactions: true,
      maxTransactionsPerSigningRequest: 10,
      maxMessagesPerSigningRequest: 10,
      supportedTransactionVersions: [0, 'legacy'],
      noConnectionWarningTimeoutMs: 3000,
    };
  }, []);

  // ------------------ FUNCTIONS -------------------

  const initClientTrustUseCase = async () => {
    const url = await Linking.getInitialURL();
    const callingPackage: string | undefined = await getCallingPackage();
    const clientTrustUseCase = new ClientTrust(
      url ?? '',
      callingPackage,
    );

    setClientTrustUseCase(clientTrustUseCase);
  };

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

  useMobileWalletAdapterSession(
    'React Native Fake Wallet',
    config,
    handleRequest,
    handleSessionEvent,
  );

  return (
    <SafeAreaView>
      <WalletProvider>
        <ClientTrustProvider clientTrustUseCase={clientTrustUseCase}>
          <View style={styles.container}>
            {getRequestScreenComponent(currentRequest)}
          </View>
        </ClientTrustProvider>
      </WalletProvider>
    </SafeAreaView>
  );
};

export default MWAComponent;
```

AppInfo
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
        <Text>Cluster: {cluster}</Text>
        <Text>App name: {appName}</Text>
        <Text>App URI: {uri}</Text>
        <Text>Status: {verificationText}</Text>
        <Text>Scope: {scope}</Text>
      </View>
    </>
  );
}

export default AppInfo;
```

Button Group
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


```tsx
import React, { useEffect, useState } from "react";
import { useClientTrust } from "../components/ClientTrustProvider";
import { useWallet } from "../components/WalletProvider";
import { VerificationState, verificationStatusText } from "../utils/clientTrust";
import { AuthorizeDappCompleteResponse, AuthorizeDappRequest, MWARequestFailReason, resolve } from "../lib/mobile-wallet-adapter-walletlib/src";
import { View } from "react-native/Libraries/Components/View/View";
import { Text } from "react-native";
import { getIconFromIdentityUri } from "../utils/dapp";
import AppInfo from "../components/AppInfo";
import ButtonGroup from "../components/ButtonGroup";

export interface AuthorizeDappRequestScreenProps {
  request: AuthorizeDappRequest;
}

function AuthorizeDappRequestScreen(props: AuthorizeDappRequestScreenProps){
  const { request } = props;
  const { wallet } = useWallet();
  const { clientTrustUseCase } = useClientTrust();
  const [ verificationState, setVerificationState ] = useState<VerificationState | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  if (!wallet) {
    throw new Error('No wallet found');
  }

  useEffect(() => {
    const verifyClient = async () => {
      const verificationState =
        await clientTrustUseCase?.verifyAuthorizationSource(
          request.appIdentity?.identityUri,
        );
      setVerificationState(verificationState);
    };

    verifyClient();
  }, []);

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
        positiveOnClick={() => {
          setLoading(true);
          resolve(request, {
            publicKey: wallet.publicKey.toBytes(),
            accountLabel: 'Backpack',
            authorizationScope: new TextEncoder().encode(
              verificationState?.authorizationScope,
            ),
          } as AuthorizeDappCompleteResponse);
          setLoading(false);
        }}
        negativeOnClick={() => {
          setLoading(true);
          resolve(request, {
            failReason: MWARequestFailReason.UserDeclined,
          });
          setLoading(false);
        }}
      />
      {loading && <Text>Loading...</Text>}
    </View>
  );
};

export default AuthorizeDappRequestScreen;

```

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
  getIconFromIdentityUri, getSignedPayloads, sendTransactionsRaw,
} from '../utils/dapp';
import {useWallet} from '../components/WalletProvider';
import {useClientTrust} from '../components/ClientTrustProvider';
import {VerificationState, verificationStatusText} from '../utils/clientTrust';
import {Text, View} from 'react-native';
import AppInfo from '../components/AppInfo';
import ButtonGroup from '../components/ButtonGroup';


export interface SignAndSendTransactionScreenProps {
  request: SignAndSendTransactionsRequest;
}

function SignAndSendTransaction(props: SignAndSendTransactionScreenProps) {
  const {request} = props;
  const {wallet, connection} = useWallet();
  const {clientTrust} = useClientTrust();
  const [verified, setVerified] = useState(false);
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

      const verified =
        (await clientTrust?.verifyPrivilegedMethodSource(
          authScope,
          request.appIdentity?.identityUri,
        )) ?? false;
      setVerified(verified);

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
    onFinish: () => void,
  ) => {
    const [valid, signedTsxs] = getSignedPayloads(
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
      const sigs = await sendTransactionsRaw(signedTsxs, connection);
      resolve(request, {signedTransactions: sigs});
      onFinish();
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
        positiveOnClick={() => {
          setLoading(true);
          signAndSendTransaction(
            wallet as Keypair,
            connection,
            request,
            () => {
              setLoading(false);
            },
          );
        }}
        negativeOnClick={() => {
          resolve(request, {failReason: MWARequestFailReason.UserDeclined});
        }}
      />
      {loading && <Text>Loading...</Text>}
    </View>
  );
}

export default SignAndSendTransaction;

```

# Challenge