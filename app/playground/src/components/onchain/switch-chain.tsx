import { ChevronDown } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useChain } from "./chain-context";

export const SwitchChain = () => {
  const { displayName: currentChainName, chain, setChain } = useChain();

  if (!setChain) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Badge variant="secondary">{currentChainName}<ChevronDown className="w-3 stroke-1 text-primary/80" /></Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup
          onValueChange={(value) => {
            setChain(value as `solana:${string}`);
          }}
          value={chain}
        >
          <DropdownMenuRadioItem value="solana:localnet">
            Localhost
          </DropdownMenuRadioItem>
          <DropdownMenuSeparator />
          <DropdownMenuRadioItem value="solana:mainnet" disabled>
            Mainnet Beta
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="solana:devnet">
            Devnet
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="solana:testnet">
            Testnet
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
