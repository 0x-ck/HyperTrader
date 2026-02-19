import { useMutation } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const KNOWN_ADDRESSES: Record<string, string> = {
  "7gx2mxou2JwuBNiDhfPeXf8EVK8DUGnXPLKdiyYKT3NL": "Hyro Protocol",
  "46gNyzgDMHecb3RzD7Wc7aCipUGPMruVYKfM7urGCRj7": "Allow Any Policy",
  "2QPMdHH58BK9yFH5AdDmL4UXUb5hRBW51ga2p3KuUZ2t": "Deny All Policy",
  "9umquhVCZ266WMHmkMw6krn2AHaSFqvGEciSHMpZVDTS": "Limit Transfer Policy",
  G4wLdUkWJnqkN31sKA7t5RogsijrKryieVFaKuw1GvBL: "Owners Policy",
  BPFLoaderUpgradeab1e11111111111111111111111: "System Program",
};

export const Address = ({ children, className, ...rest }: Omit<ComponentProps<typeof Button>, 'children' | 'onClick' | 'variant' | 'disabled'> & { children: React.ReactNode }) => {
  let label = "";
  let fullLabel = "";

  const {
    mutate: handleCopyAddress,
    isSuccess,
    isError,
    reset,
  } = useMutation({
    mutationFn: async () => {
      navigator.clipboard.writeText(fullLabel);
    },
    onSuccess() {
      setTimeout(reset, 3000);
    },
  });

  if (typeof children !== "string") {
    return null;
  }

  label = children.slice(0, 6) + "..." + children.slice(-4);
  fullLabel = children;

  if (KNOWN_ADDRESSES[children]) {
    label = KNOWN_ADDRESSES[children]!;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className={cn("font-mono text-sm", className)}
          size="sm"
          onClick={() => handleCopyAddress()}
          disabled={isError || isSuccess}
          variant={
            isSuccess ? "constructive" : isError ? "destructive" : "secondary"
          }
          {...rest}
        >
          {isSuccess && "Address copied"}
          {!isSuccess && isError && "Failed copy"}
          {!isSuccess && !isError && label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span>{fullLabel}</span>
      </TooltipContent>
    </Tooltip>
  );
};
