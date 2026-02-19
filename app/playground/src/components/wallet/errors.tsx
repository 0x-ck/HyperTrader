import {
  isWalletStandardError,
  WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED,
  WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_FEATURE_UNIMPLEMENTED,
  WALLET_STANDARD_ERROR__FEATURES__WALLET_FEATURE_UNIMPLEMENTED,
} from "@wallet-standard/core";
import React from "react";

export const NO_ERROR = Symbol();

export function getErrorMessage(error: unknown, fallbackMessage: React.ReactNode): React.ReactNode {
  if (isWalletStandardError(error, WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_FEATURE_UNIMPLEMENTED)) {
    return (
      <>
        This account does not support the <pre className="bg-primary/10 text-primary text-sm px-2 py-1 rounded-md">{error.context.featureName}</pre> feature
      </>
    );
  } else if (isWalletStandardError(error, WALLET_STANDARD_ERROR__FEATURES__WALLET_FEATURE_UNIMPLEMENTED)) {
    return (
      <div className="flex flex-col gap-4">
        <p>
          The wallet '{error.context.walletName}' (
          {error.context.supportedChains.sort().map((chain, ii, { length }) => (
            <React.Fragment key={chain}>
              <pre className="bg-primary/10 text-primary text-sm px-2 py-1 rounded-md">{chain}</pre>
              {ii === length - 1 ? null : ", "}
            </React.Fragment>
          ))}
          ) does not support the <pre className="bg-primary/10 text-primary text-sm px-2 py-1 rounded-md">{error.context.featureName}</pre> feature.
        </p>
        <p className="trim-end">
          Features supported:
          <ul>
            {error.context.supportedFeatures.sort().map((featureName) => (
              <li key={featureName}>
                <pre className="bg-primary/10 text-primary text-sm px-2 py-1 rounded-md">{featureName}</pre>
              </li>
            ))}
          </ul>
        </p>
      </div>
    );
  } else if (isWalletStandardError(error, WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED)) {
    return (
      <div className="flex flex-col gap-4">
        <p>
          This account does not support the chain <pre className="bg-primary/10 text-primary text-sm px-2 py-1 rounded-md">{error.context.chain}</pre>.
        </p>
        <p className="trim-end">
          Chains supported:
          <ul>
            {error.context.supportedChains.sort().map((chain) => (
              <li key={chain}>
                <pre className="bg-primary/10 text-primary text-sm px-2 py-1 rounded-md">{chain}</pre>
              </li>
            ))}
          </ul>
        </p>
      </div>
    );
  } else if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return fallbackMessage;
}
