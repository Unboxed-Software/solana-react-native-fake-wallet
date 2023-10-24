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
  