"use client";

import "client-only";

import {
  useWalletAccountMessageSigner,
  useWalletAccountTransactionSendingSigner,
  useWalletAccountTransactionSigner,
} from "@solana/react";

import {
  getUiWalletAccountStorageKey,
  UiWallet,
  UiWalletAccount,
  uiWalletAccountBelongsToUiWallet,
  uiWalletAccountsAreSame,
  useWallets,
} from "@wallet-standard/react";
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  address,
  MessageModifyingSigner,
  TransactionModifyingSigner,
  TransactionSendingSigner
} from "@solana/kit";
import { useChain } from "../onchain/chain-context";
import {
  SelectedWalletAccountContext,
  SelectedWalletAccountState,
} from "./wallet-context";

const STORAGE_KEY = "hyro:selected-wallet-and-address";

let wasSetterInvoked = false;
function getSavedWalletAccount(
  wallets: readonly UiWallet[]
): UiWalletAccount | undefined {
  if (wasSetterInvoked || typeof window === "undefined") {
    // After the user makes an explicit choice of wallet, stop trying to auto-select the
    // saved wallet, if and when it appears.
    return;
  }
  const savedWalletNameAndAddress = window.localStorage.getItem(STORAGE_KEY);
  if (
    !savedWalletNameAndAddress ||
    typeof savedWalletNameAndAddress !== "string"
  ) {
    return;
  }
  const [savedWalletName, savedAccountAddress] =
    savedWalletNameAndAddress.split(":");
  if (!savedWalletName || !savedAccountAddress) {
    return;
  }
  for (const wallet of wallets) {
    if (wallet.name === savedWalletName) {
      for (const account of wallet.accounts) {
        if (account.address === savedAccountAddress) {
          return account;
        }
      }
    }
  }
}

/**
 * Saves the selected wallet account's storage key to the browser's local storage. In future
 * sessions it will try to return that same wallet account, or at least one from the same brand of
 * wallet if the wallet from which it came is still in the Wallet Standard registry.
 */
export function SelectedWalletAccountContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallets = useWallets();
  const [selectedWalletAccount, setSelectedWalletAccountInternal] =
    useState<SelectedWalletAccountState>(() => getSavedWalletAccount(wallets));
  const setSelectedWalletAccount: React.Dispatch<
    React.SetStateAction<SelectedWalletAccountState>
  > = (setStateAction) => {
    setSelectedWalletAccountInternal((prevSelectedWalletAccount) => {
      wasSetterInvoked = true;
      const nextWalletAccount =
        typeof setStateAction === "function"
          ? setStateAction(prevSelectedWalletAccount)
          : setStateAction;
      const accountKey = nextWalletAccount
        ? getUiWalletAccountStorageKey(nextWalletAccount)
        : undefined;
      if (accountKey) {
        localStorage.setItem(STORAGE_KEY, accountKey);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      return nextWalletAccount;
    });
  };
  useEffect(() => {
    const savedWalletAccount = getSavedWalletAccount(wallets);
    if (savedWalletAccount) {
      setSelectedWalletAccountInternal(savedWalletAccount);
    }
  }, [wallets]);
  const walletAccount = useMemo(() => {
    if (selectedWalletAccount) {
      for (const uiWallet of wallets) {
        for (const uiWalletAccount of uiWallet.accounts) {
          if (uiWalletAccountsAreSame(selectedWalletAccount, uiWalletAccount)) {
            return uiWalletAccount;
          }
        }
        if (
          uiWalletAccountBelongsToUiWallet(selectedWalletAccount, uiWallet) &&
          uiWallet.accounts[0]
        ) {
          // If the selected account belongs to this connected wallet, at least, then
          // select one of its accounts.
          return uiWallet.accounts[0];
        }
      }
    }
  }, [selectedWalletAccount, wallets]);
  useEffect(() => {
    // If there is a selected wallet account but the wallet to which it belongs has since
    // disconnected, clear the selected wallet.
    if (selectedWalletAccount && !walletAccount) {
      setSelectedWalletAccountInternal(undefined);
    }
  }, [selectedWalletAccount, walletAccount]);

  const [signer, setSigner] = useState<
    | null
    | (TransactionSendingSigner &
        TransactionModifyingSigner &
        MessageModifyingSigner)
  >(null);

  return (
    <SelectedWalletAccountContext.Provider
      value={useMemo(
        () => ({
          wallet: walletAccount,
          signer,
          setSigner,
          setWallet: setSelectedWalletAccount,
        }),
        [signer, walletAccount]
      )}
    >
      {walletAccount && <SignerInjector wallet={walletAccount} />}
      {children}
    </SelectedWalletAccountContext.Provider>
  );
}

const SignerInjector = memo(({ wallet }: { wallet: UiWalletAccount }) => {
  const chain = useChain();
  const transactionSendingSigner = useWalletAccountTransactionSendingSigner(
    wallet,
    chain.chain
  );
  const transactionSigner = useWalletAccountTransactionSigner(
    wallet,
    chain.chain
  );
  const messageSigner = useWalletAccountMessageSigner(wallet);

  const { setSigner } = useContext(SelectedWalletAccountContext);

  const handleSetSigner = useCallback(() => {
    setSigner({
      signAndSendTransactions: transactionSendingSigner.signAndSendTransactions,
      modifyAndSignTransactions: transactionSigner.modifyAndSignTransactions,
      modifyAndSignMessages: messageSigner.modifyAndSignMessages,
      address: address(wallet.address),
    });
  }, [
    transactionSendingSigner,
    transactionSigner,
    messageSigner,
    wallet.address,
    setSigner,
  ]);

  useEffect(() => {
    handleSetSigner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address]);

  return null;
});
