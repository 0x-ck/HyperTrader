import { cn, formatNumber } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";
import { Decimal } from "decimal.js";
import { ComponentProps } from "react";

export const TokenAmount = ({
  children: amount,
  isLoading,
  symbol,
  decimals,
  className,
  endContent,
  startContent,
  ...rest
}: {
  children?: bigint;
  isLoading: boolean;
  symbol: string;
  decimals: number;
  endContent?: React.ReactNode;
  startContent?: React.ReactNode;
} & ComponentProps<'div'>) => {
  amount = amount || 0n;
  const formattedAmount = formatNumber(new Decimal(amount).div(10 ** decimals), {
    style: "price",
    maxFractionDigits: decimals,
    minFractionDigits: 0,
  });
  return (
    <div className={cn("flex flex-row gap-1 items-center", className)} {...rest}>
      {startContent}
      {isLoading && (<LoaderIcon className="absolute animate-spin w-4 text-muted-foreground" />)}
      <span dangerouslySetInnerHTML={{ __html: formattedAmount }} className={cn(isLoading && "opacity-25", "transition-opacity duration-200")}/>
      <span>{symbol} </span>
      {endContent}
    </div>
  );
};
