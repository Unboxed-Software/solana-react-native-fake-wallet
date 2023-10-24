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
