import {Keypair, PublicKey} from "@solana/web3.js";
import React, {useCallback, useContext, useEffect, useState} from "react";
import {useLocalStorageKey, useLocalStorageState} from "../storage";
import {useWallet} from "../wallet/wallet";
import {useConnection, useConnectionConfig} from "../web3/connection";
import {ClusterType, DIDDocument, resolve} from '@identity.com/sol-did-client';
import {keyToIdentifier, UserDetails} from "solarium-js";
import {addKey as addKeyToDID, createIdentity as createDID, createUserDetails, updateUserDetails, getUserDetails} from "../channels/solarium";

export type IdentityError =
  'WALLET_DID_MISMATCH'

const docHasKey = (doc: DIDDocument, key: PublicKey) =>
  doc.verificationMethod?.find(verificationMethod => verificationMethod.publicKeyBase58 === key.toBase58())

type IdentityProps = {
  ready: boolean,
  error?: IdentityError
  decryptionKey?: Keypair,
  did?: string,
  createIdentity: (alias?: string) => Promise<void>,
  clearIdentity: () => void,
  setAlias: (alias:string) => Promise<void>,
  addKey: () => Promise<void>,
  document?: DIDDocument
  userDetails?: UserDetails
}
const IdentityContext = React.createContext<IdentityProps>({
  ready: false,
  createIdentity: async () => {},
  clearIdentity: () => {},
  setAlias: async () => {},
  addKey: async  () => {},
});
export function IdentityProvider({ children = null as any }) {
  const {wallet, connected} = useWallet();
  const connection = useConnection();
  const connectionConfig = useConnectionConfig();
  const [decryptionKey] = useLocalStorageKey('decryptionKey', Keypair.generate());
  const [did, setDID] = useLocalStorageState<string | null>('did', undefined);
  const [document, setDocument] = useState<DIDDocument>();
  const [userDetails, setUserDetails] = useState<UserDetails>();
  const [ready, setReady] = useState<boolean>(false);
  const [error, setError] = useState<IdentityError>();

  const clearIdentity = useCallback(() => {
    setDID(null);
  }, [setDID])

  const createIdentity = useCallback((alias?: string) =>
      createDID(connection, wallet, decryptionKey, alias).then(document => setDID(document.id))
    , [connection, wallet, setDID, decryptionKey])

  const addKey = useCallback(() =>
      addKeyToDID(connection, wallet, decryptionKey.publicKey, did || undefined).then(() => {
        setReady(true)
      })
    , [connection, wallet, decryptionKey, did, setReady ])


  const updateUserDetailsInState = useCallback(() => did && getUserDetails(did).then(loadedUserDetails => {
    if (loadedUserDetails) {
      setUserDetails(loadedUserDetails)
    }
  }).catch(() => {
    console.log("No UserDetails found");
  }), [did, setUserDetails]);

  const setAlias = useCallback(async (alias: string) => {
    if (!did) return;
    const setAliasFn = userDetails ? updateUserDetails : createUserDetails
    await setAliasFn(connection, wallet, did, alias);
    await updateUserDetailsInState()
  }, [connection, wallet, did, userDetails, updateUserDetailsInState])

  // load the DID document whenever the did is changed
  useEffect(() => {
    if (did) {
      resolve(did).then(doc => {
        setDocument(doc)
        console.log(doc);
      }).catch(() => {
        console.log("No DID registered yet");
      })
    } else {
      setDocument(undefined);
    }
  }, [did]);

  // load the user details if present
  useEffect(() => { if (did) updateUserDetailsInState() }, [did, updateUserDetailsInState]);

  // attempt to get the default DID when the wallet is loaded if none is set
  useEffect(() => {
    if (wallet && connected && !did) {
      keyToIdentifier(wallet.publicKey, ClusterType.parse(connectionConfig.env))
        .then(resolve)
        .then(document => {
          setDID(document.id); // this will already update the doc via useEffect on DID
        })
        .catch(error => {
          if (error.message.startsWith("No DID found")) {
            // console.log("Prompt to create DID");
          }
        })
    }
  }, [wallet, connectionConfig, did, setDID, setDocument, connected, connection]);

  // check the loaded DID for the decryption key. prompt to add it if not present
  useEffect(()  => {
    console.log("Checking keys");
    if (document && decryptionKey) {
      console.log("Checking if decryption key is on document");
      console.log(document);
      console.log(decryptionKey.publicKey.toBase58());
      if (!docHasKey(document, decryptionKey.publicKey)) {
        if (wallet && connected) {
          console.log("Checking if wallet key is on document");
          if (docHasKey(document, wallet.publicKey)) {
            // if (window.confirm(`Add key to ${did}?`)) {
            //   addKeyToDID(connection, wallet, decryptionKey.publicKey, did).then(() => setReady(true))
            // } else {
            //   // handle no decryption possible
            //   console.log("Add decryption key rejected");
            // }
          } else {
            console.log("This DID does not belong to the wallet");
            setError('WALLET_DID_MISMATCH')
          }
        } else {
          console.log("wallet is not connected yet");
        }
      } else {
        console.log("This DID already has the decryption key");
        setReady(true);
      }
    } else {
      console.log("No document or decryption key available yet");
    }
  }, [document, decryptionKey, did, setReady, ready, setError, wallet, connected, connection])

  return (
    <IdentityContext.Provider value={{
      ready,
      error,
      decryptionKey,
      did: did || undefined,
      createIdentity,
      clearIdentity,
      setAlias,
      addKey,
      document,
      userDetails
    }}>
      {children}
    </IdentityContext.Provider>
  )
}

export const useIdentity = (): IdentityProps => useContext(IdentityContext);
