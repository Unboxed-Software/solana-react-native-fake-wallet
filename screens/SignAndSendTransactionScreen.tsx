import {Connection, Keypair} from '@solana/web3.js';
import {useState, useEffect} from 'react';
import {
  MWARequestFailReason,
  SignAndSendTransactionsRequest,
  resolve,
} from '../lib/mobile-wallet-adapter-walletlib/src';
import {
    SendTransactionsError,
  getIconFromIdentityUri, getSignedPayloads, sendSignedTransactions,
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

function SignAndSendTransactionScreen(props: SignAndSendTransactionScreenProps) {
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

      const verifyClient = async () => {
        const verificationState =
          await clientTrust?.verifyAuthorizationSource(
            request.appIdentity?.identityUri,
          );
        setVerificationState(verificationState);
      };
  
      verifyClient();

      const verified =
        (await clientTrust?.verifyPrivilegedMethodSource(
          authScope,
        )) ?? false;
      setVerified(verified);

      console.log('--------------')
      console.log('--------------')
      console.log('URI: ' + request.appIdentity?.identityUri)
      console.log('Verifed: ' + verified)
      console.log('State: ' + JSON.stringify(verificationState))
      console.log('--------------')
      console.log('--------------')

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
        connection
      );
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
            () => setLoading(false),
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

export default SignAndSendTransactionScreen;
