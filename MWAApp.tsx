import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  BackHandler,
  Button,
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
import AuthorizeDappRequestScreen from './screens/AuthorizeDappRequestScreen';
import SignAndSendTransactionScreen from './screens/SignAndSendTransactionScreen';

const styles = StyleSheet.create({
  container: {
    margin: 0,
    width: '100%',
    backgroundColor: 'black',
    color: 'black',
  },
});

function getRequestScreenComponent(request: MWARequest | null | undefined, clientTrust: ClientTrust | null) {

  if (!request) {
    return <Text>No request</Text>;
  }

  if (!clientTrust) {
    return <Text>No client trust</Text>;
  }

  switch (request?.__type) {
    case MWARequestType.AuthorizeDappRequest:
      return (
        <AuthorizeDappRequestScreen request={request as AuthorizeDappRequest} clientTrust={clientTrust}/>
      );
    case MWARequestType.SignAndSendTransactionsRequest:
      return (
        <SignAndSendTransactionScreen
          request={request as SignAndSendTransactionsRequest}
          clientTrust={clientTrust}
        />
      );
    case MWARequestType.SignMessagesRequest:
    case MWARequestType.SignTransactionsRequest:
    default:
      return <Text>TODO Show screen for {request?.__type}</Text>;
  }
}

export function MWAComponent() {
  const [currentRequest, setCurrentRequest] = useState<MWARequest | null>(null);
  const [currentSession, setCurrentSession] = useState<MWASessionEvent | null>(
    null,
  );
  const [clientTrust, setClientTrust] = useState<ClientTrust | null>(null);

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

  const config: MobileWalletAdapterConfig = useMemo(() => {
    return {
      supportsSignAndSendTransactions: true,
      maxTransactionsPerSigningRequest: 10,
      maxMessagesPerSigningRequest: 10,
      supportedTransactionVersions: [0, 'legacy'],
      noConnectionWarningTimeoutMs: 3000,
    };
  }, []);

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
            <Text>REQUEST: {currentRequest?.__type.toString()}</Text>
            {getRequestScreenComponent(currentRequest, clientTrust)}
          </View>
      </WalletProvider>
    </SafeAreaView>
  );
}

export default MWAComponent;
