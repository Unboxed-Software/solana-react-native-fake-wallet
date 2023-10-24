import {ClientTrust} from '../utils/clientTrust';
import {createContext, useContext, ReactNode} from 'react';

interface ClientTrustContextType {
  clientTrust: ClientTrust | null;
}

const ClientTrustContext = createContext<ClientTrustContextType>({
  clientTrust: null,
});

export const useClientTrust = () => useContext(ClientTrustContext);

type ClientTrustProviderProps = {
  clientTrust: ClientTrust | null;
  children: ReactNode;
};

const ClientTrustProvider = (props: ClientTrustProviderProps) => {
  return (
    <ClientTrustContext.Provider
      value={{clientTrust: props.clientTrust}}>
      {props.children}
    </ClientTrustContext.Provider>
  );
};

export default ClientTrustProvider;
