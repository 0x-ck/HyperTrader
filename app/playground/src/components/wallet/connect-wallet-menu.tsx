import { StandardConnect, StandardDisconnect } from "@wallet-standard/core";
import type { UiWallet } from "@wallet-standard/react";
import {
  uiWalletAccountBelongsToUiWallet,
  useWallets,
} from "@wallet-standard/react";
import { useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { ChevronDownIcon } from "lucide-react";
import { ErrorDialog } from "../errors/error-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ConnectWalletMenuItem } from "./connect-wallet-menu-item";
import { WalletAccountIcon } from "./wallet-account-icon";
import { useSetWallet, useWallet } from "./wallet-context";
// import { ErrorDialog } from "./ErrorDialog";
// import { UnconnectableWalletMenuItem } from "./UnconnectableWalletMenuItem";
// import { WalletAccountIcon } from "./WalletAccountIcon";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export function ConnectWalletMenu({ children }: Props) {
  const { current: NO_ERROR } = useRef(Symbol());
  const wallets = useWallets();
  const selectedWalletAccount = useWallet();
  const setSelectedWalletAccount = useSetWallet();

  const [error, setError] = useState(NO_ERROR);
  const [forceClose, setForceClose] = useState(false);

  function renderItem(wallet: UiWallet, index: number) {
    return (
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <pre>{JSON.stringify(error, null, 2)}</pre>
        )} //<UnconnectableWalletMenuItem error={error} wallet={wallet} />}
        key={`wallet:${wallet.name}:${index}`}
      >
        <ConnectWalletMenuItem
          onAccountSelect={(account) => {
            setSelectedWalletAccount(account);
            setForceClose(true);
          }}
          onDisconnect={(wallet) => {
            console.log({
              selectedWalletAccount,
              wallet,
              belongs: selectedWalletAccount
                ? uiWalletAccountBelongsToUiWallet(
                    selectedWalletAccount,
                    wallet
                  )
                : false,
            });
            if (
              selectedWalletAccount &&
              uiWalletAccountBelongsToUiWallet(selectedWalletAccount, wallet)
            ) {
              setSelectedWalletAccount(undefined);
            }
          }}
          onError={setError}
          wallet={wallet}
        />
      </ErrorBoundary>
    );
  }
  const walletsThatSupportStandardConnect = [];
  const unconnectableWallets = [];
  for (const wallet of wallets) {
    if (
      wallet.features.includes(StandardConnect) &&
      wallet.features.includes(StandardDisconnect)
    ) {
      walletsThatSupportStandardConnect.push(wallet);
    } else {
      unconnectableWallets.push(wallet);
    }
  }
  return (
    <>
      <DropdownMenu
        open={forceClose ? false : undefined}
        onOpenChange={setForceClose.bind(null, false)}
      >
        <DropdownMenuTrigger className="text-sm flex flex-row gap-2 items-center">
          {/* <Button> */}
          {selectedWalletAccount ? (
            <>
              <WalletAccountIcon
                account={selectedWalletAccount}
                width="18"
                height="18"
              />
              {selectedWalletAccount.address.slice(0, 8)}
            </>
          ) : (
            children
          )}
          <ChevronDownIcon className="w-3 stroke-1" />
          {/* </Button> */}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <>
            {walletsThatSupportStandardConnect.map((wallet, index) => renderItem(wallet, index))}
            {unconnectableWallets.length ? (
              <>
                <DropdownMenuSeparator />
                {unconnectableWallets.map((wallet, index) => renderItem(wallet, walletsThatSupportStandardConnect.length + index))}
              </>
            ) : null}
          </>
        </DropdownMenuContent>
      </DropdownMenu>
      {error !== NO_ERROR ? (
        <ErrorDialog error={error} onClose={() => setError(NO_ERROR)} />
      ) : null}
    </>
  );
}
