import type { UiWallet, UiWalletAccount } from "@wallet-standard/react";
import {
  uiWalletAccountsAreSame,
  useConnect,
  useDisconnect,
} from "@wallet-standard/react";
import { useCallback } from "react";

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { WalletMenuItemContent } from "./wallet-menu-item-content";

type Props = Readonly<{
  onAccountSelect(account: UiWalletAccount | undefined): void;
  onDisconnect(wallet: UiWallet): void;
  onError(error: unknown): void;
  wallet: UiWallet;
}>;

export function ConnectWalletMenuItem({
  onAccountSelect,
  onDisconnect,
  onError,
  wallet,
}: Props) {
  const [isConnecting, connect] = useConnect(wallet);
  const [isDisconnecting, disconnect] = useDisconnect(wallet);
  const isPending = isConnecting || isDisconnecting;
  const isConnected = wallet.accounts.length > 0;
  const handleConnectClick = useCallback(async () => {
    try {
      const existingAccounts = [...wallet.accounts];
      const nextAccounts = await connect();
      // Try to choose the first never-before-seen account.
      for (const nextAccount of nextAccounts) {
        if (
          !existingAccounts.some((existingAccount) =>
            uiWalletAccountsAreSame(nextAccount, existingAccount)
          )
        ) {
          onAccountSelect(nextAccount);
          return;
        }
      }
      // Failing that, choose the first account in the list.
      if (nextAccounts[0]) {
        onAccountSelect(nextAccounts[0]);
      }
    } catch (error) {
      onError(error);
    }
  }, [connect, onAccountSelect, onError, wallet.accounts]);
  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          onClick={!isConnected ? handleConnectClick : undefined}
          className={cn(
            isConnected &&
              "bg-primary text-primary-foreground hover:bg-primary/80 data-[state=open]:bg-primary/80 data-[state=open]:text-primary-foreground focus:bg-primary/80 focus:text-primary-foreground"
          )}
        >
          <WalletMenuItemContent loading={isPending} wallet={wallet} />
        </DropdownMenuSubTrigger>
        {wallet.accounts.length > 0 && (
          <>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuLabel>Accounts</DropdownMenuLabel>
                <DropdownMenuRadioGroup>
                  {wallet.accounts.map((account) => (
                    <DropdownMenuRadioItem
                      key={account.address}
                      value={account.address}
                      onSelect={() => {
                        onAccountSelect(account);
                      }}
                    >
                      {account.address.slice(0, 8)}&hellip;
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async (event) => {
                    event.preventDefault();
                    await handleConnectClick();
                  }}
                >
                  Connect
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={async (event) => {
                    event.preventDefault();
                    try {
                      await disconnect();
                      onDisconnect(wallet);
                    } catch (error) {
                      onError(error);
                    }
                  }}
                >
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </>
        )}
      </DropdownMenuSub>
    </DropdownMenuGroup>
    //     </DropdownMenuContent>
    //   <DropdownMenu.SubTrigger
    //     disabled={isPending}
    //     onClick={!isConnected ? handleConnectClick : undefined}
    //   >
    //     <WalletMenuItemContent loading={isPending} wallet={wallet} />
    //     {isConnected ? (
    //       <div className="rt-BaseMenuShortcut rt-DropdownMenuShortcut">
    //         <ThickChevronRightIcon className="rt-BaseMenuSubTriggerIcon rt-DropdownMenuSubtriggerIcon" />
    //       </div>
    //     ) : null}
    //   </DropdownMenu.SubTrigger>
    //   <DropdownMenu.SubContent>
    //     <DropdownMenu.Label>Accounts</DropdownMenu.Label>
    //     <DropdownMenu.RadioGroup value={selectedWalletAccount?.address}>
    //       {wallet.accounts.map((account) => (
    //         <DropdownMenu.RadioItem
    //           key={account.address}
    //           value={account.address}
    //           onSelect={() => {
    //             onAccountSelect(account);
    //           }}
    //         >
    //           {account.address.slice(0, 8)}&hellip;
    //         </DropdownMenu.RadioItem>
    //       ))}
    //     </DropdownMenu.RadioGroup>
    //     <DropdownMenu.Separator />
    //     <DropdownMenu.Item
    //       onSelect={async (event) => {
    //         event.preventDefault();
    //         await handleConnectClick();
    //       }}
    //     >
    //       Connect More
    //     </DropdownMenu.Item>
    //     <DropdownMenu.Item
    //       color="red"
    //       onSelect={async (event) => {
    //         event.preventDefault();
    //         try {
    //           await disconnect();
    //           onDisconnect(wallet);
    //         } catch (error) {
    //           onError(error);
    //         }
    //       }}
    //     >
    //       Disconnect
    //     </DropdownMenu.Item>
    //   </DropdownMenu.SubContent>
    // </DropdownMenu>
  );
}
