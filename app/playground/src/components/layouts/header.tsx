"use client";

import { address as asAddress } from "@solana/kit";
import { UiWalletAccount } from "@wallet-standard/react";
import { SwitchChain } from "../onchain/switch-chain";
import { ConnectWalletMenu } from "../wallet/connect-wallet-menu";
import { WalletBalance } from "../wallet/wallet-balance";

export const Header = ({ wallet }: { wallet?: UiWalletAccount }) => {
  return (
    <div className="flex flex-row gap-4 items-center p-4 border border-border shadow-md sticky top-0 z-50 isolate bg-background">
      <ConnectWalletMenu>Connect Wallet</ConnectWalletMenu>
      {wallet?.address && <WalletBalance address={asAddress(wallet.address)} />}
      <div className="flex-grow"></div>
      <SwitchChain />
    </div>
  );
};
