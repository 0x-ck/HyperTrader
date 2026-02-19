import type { UiWallet } from "@wallet-standard/react";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Props = Readonly<{
  children?: React.ReactNode;
  loading?: boolean;
  wallet: UiWallet;
}>;

export function WalletMenuItemContent({ children, loading, wallet }: Props) {
  return (
    <div className="flex items-center gap-2">
      {loading ? (
        <Skeleton className="w-4 h-4 rounded-full" />
      ) : (
        <Avatar className="w-4 h-4">
          <AvatarFallback>{wallet.name.slice(0, 1)}</AvatarFallback>
          <AvatarImage src={wallet.icon} className="w-4 h-4" />
        </Avatar>
      )}
      <span className="truncate">{children ?? wallet.name}</span>
    </div>
  );
}
