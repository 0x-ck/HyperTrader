import {
  MessageModifyingSigner,
  TransactionModifyingSigner,
  TransactionSendingSigner
} from "@solana/kit";
import type { UiWalletAccount } from "@wallet-standard/react";
import { createContext, useContext } from "react";

export type SelectedWalletAccountState = UiWalletAccount | undefined;

export const SelectedWalletAccountContext = createContext<{
  wallet: SelectedWalletAccountState;
  signer:
    | (TransactionSendingSigner &
        TransactionModifyingSigner &
        MessageModifyingSigner)
    | null;
  setSigner: React.Dispatch<
    React.SetStateAction<
      | (TransactionSendingSigner &
          TransactionModifyingSigner &
          MessageModifyingSigner)
      | null
    >
  >;
  setWallet: React.Dispatch<React.SetStateAction<SelectedWalletAccountState>>;
}>(null!);

export const useWallet = () => {
  return useContext(SelectedWalletAccountContext).wallet;
};

export const useSetWallet = () => {
  return useContext(SelectedWalletAccountContext).setWallet;
};

export const useSigner = () => {
  return useContext(SelectedWalletAccountContext).signer;
};
