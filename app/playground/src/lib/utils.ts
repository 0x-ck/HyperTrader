"use client";

import { clsx, type ClassValue } from "clsx";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
// TEMPORARY FILE BEFORE PUBLISH AS A PACKAGE
import { Decimal } from "decimal.js";

const TICK_STEP_PLUS_ONE = 1.0001;

export function tickIndexToPrice(tickIndex: number) {
  return Math.pow(TICK_STEP_PLUS_ONE, Math.floor(tickIndex));
}

export function priceToTickIndexRoundingToNearest(
  price: number,
  tickSpacing = 1
): number {
  tickSpacing = Math.floor(tickSpacing);
  if (tickSpacing < 1) throw new Error("tickSpacing can't be less than 1");

  let tickIndex =
    Math.round(Math.log2(price) / Math.log2(TICK_STEP_PLUS_ONE) / tickSpacing) *
    tickSpacing;
  // Convert -0 to +0
  if (tickIndex == 0) tickIndex = 0;

  return tickIndex;
}

export type Address<TAddress extends string = string> = TAddress & {
  readonly __brand: unique symbol;
};

export const SECOND = 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;

export const NUMBER_FORMAT_LOCALE = "en-US";
export const HTML_SUBSCRIPT_LEADING_ZEROS_CAP = 5;

export type NumberFormatterStyle = {
  /** Token formatter */
  token: never;
  /** Currency formatter */
  currency: never;
  /** Percent formatter */
  percent: never;
  /** Pool price formatter */
  price: never;
  /** Multiplier formatter: 1.0x, 2.00x */
  multiplier: never;
};

export type NumberFormatOptions = {
  /** Token decimals. Must be set if a value is passed as bigint. */
  decimals?: number;
  /** The minimum number of fraction digits. If not specified, set to 0 for "percent" style and to maxFractionDigits for others. */
  minFractionDigits?: number;
  /** The maximum number of fraction digits. If not specified, set to 2 for "percent" style and to 4 for others. */
  maxFractionDigits?: number;
  /** Formatter style. The default number formatter style is "token". */
  style?: keyof NumberFormatterStyle;
  noHtmlSubscriptDigit?: boolean;
};

export function formatNumber(
  value: Decimal.Value | bigint,
  options?: NumberFormatOptions
): string {
  let maxFractionDigits =
    options?.maxFractionDigits ??
    (options?.style === "currency" ||
    options?.style === "percent" ||
    options?.style === "multiplier"
      ? 2
      : 4);

  let minFractionDigits: number;
  if (options?.minFractionDigits !== undefined) {
    minFractionDigits = options?.minFractionDigits;
  } else if (options?.style === "percent" || options?.style === "price") {
    minFractionDigits = 0;
  } else if (options?.style === "multiplier") {
    minFractionDigits = 1;
  } else {
    minFractionDigits = maxFractionDigits;
  }

  if (minFractionDigits > maxFractionDigits) {
    maxFractionDigits = minFractionDigits;
  }

  // Convert bigint to decimal if needed.
  let decimalValue: Decimal;
  if (typeof value === "bigint") {
    if (options?.decimals === undefined) {
      throw new Error(
        "Number of decimals must be explicitly specified for bigint type"
      );
    }
    decimalValue = new Decimal(value.toString());
    decimalValue = decimalValue.div(10 ** options.decimals);
  } else {
    decimalValue = new Decimal(value);
  }

  // Convert to floating-point number.
  const numberValue = decimalValue.toNumber();
  const absNumberValue = Math.abs(numberValue);

  if (options?.style === "price") {
    const integerDigits =
      absNumberValue >= 1 ? Math.floor(Math.log10(absNumberValue)) + 1 : 1;
    const outputDecimals = Math.max(
      minFractionDigits,
      maxFractionDigits + 1 - integerDigits
    );
    const outputValue = decimalValue.toFixed(outputDecimals);
    // Limit the number of decimals and convert to number
    if (options?.noHtmlSubscriptDigit) {
      return outputValue;
    } else {
      return replaceDecimalsLeadingZerosByHtmlSubscriptDigit(outputValue);
    }
  } else if (options?.style === "multiplier") {
    const formatter = new Intl.NumberFormat(NUMBER_FORMAT_LOCALE, {
      style: "decimal",
      notation: "standard",
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
    });
    return formatter.format(numberValue) + "x";
  } else if (options?.style === "percent") {
    const integerDigits =
      absNumberValue >= 1
        ? Math.floor(Math.log10(absNumberValue * 100)) + 1
        : 1;
    const outputDecimals = Math.max(0, maxFractionDigits + 1 - integerDigits);

    const formatter = new Intl.NumberFormat(NUMBER_FORMAT_LOCALE, {
      style: "percent",
      notation: "standard",
      currency: "USD",
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: outputDecimals,
    });

    return formatter.format(numberValue);
  } else {
    const integerDigits =
      absNumberValue >= 1 ? Math.floor(Math.log10(absNumberValue)) + 1 : 1;
    const outputDecimals = Math.max(0, maxFractionDigits + 1 - integerDigits);
    const isZero = numberValue == 0;

    let formatter: Intl.NumberFormat;
    const style: keyof Intl.NumberFormatOptionsStyleRegistry =
      options?.style == "currency" ? "currency" : "decimal";

    if (absNumberValue < 1000000) {
      formatter = new Intl.NumberFormat(NUMBER_FORMAT_LOCALE, {
        style,
        notation: "standard",
        currency: "USD",
        minimumFractionDigits: Math.min(minFractionDigits, outputDecimals),
        maximumFractionDigits: outputDecimals,
      });
    } else {
      formatter = new Intl.NumberFormat(NUMBER_FORMAT_LOCALE, {
        style,
        notation: "compact",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    const strValue = formatter.format(numberValue);

    // Approximately zero
    if (containsOnlyZero(strValue) && !isZero) {
      return "~" + strValue;
    }

    return strValue;
  }
}

function containsOnlyZero(str: string): boolean {
  return /^[0.,]+$/.test(str.replace(/[.,-/$%]/g, ""));
}

function countLeadingZeros(input: string): number {
  // Trim the leading zeros and calculate the difference in length
  const trimmedString = input.replace(/^0+/, "");
  return input.length - trimmedString.length;
}

/*
 * Converts digit into html subscript entity
 * */
function digitToHtmlSubscript(digit: number) {
  if (digit < 0) {
    throw new Error("Digit number must be less greater 0");
  }

  return `<sub>${digit}</sub>`;
}

export function replaceDecimalsLeadingZerosByHtmlSubscriptDigit(
  formattedString: string
) {
  // Return as is if zeros only
  if (containsOnlyZero(formattedString)) return formattedString;

  // Replace commas
  const formattedStringWithDots = formattedString.replace(",", ".");
  const wasCommaReplaced = formattedString !== formattedStringWithDots;

  // Split number
  const [integerPart, floatPart] = formattedStringWithDots.split(".");
  if (!floatPart) return formattedString;

  // Check leading zeros in float part
  const floatPartLeadingZerosCount = countLeadingZeros(floatPart);
  if (floatPartLeadingZerosCount >= HTML_SUBSCRIPT_LEADING_ZEROS_CAP) {
    // Get HTML subscript as zeros indicator
    const floatPartZerosSubscriptDigit = digitToHtmlSubscript(
      floatPartLeadingZerosCount
    );
    // Zeros string to replace
    const floatPartZerosSubstr = new Array(floatPartLeadingZerosCount)
      .fill("0")
      .join("");
    // Replace zeros by HTML subscript
    const floatPartWithHtmlSubscriptDigit = floatPart.replace(
      floatPartZerosSubstr,
      floatPartZerosSubscriptDigit
    );
    // {int}.0{sub}{float}
    return (
      integerPart +
      ".0" +
      floatPartWithHtmlSubscriptDigit.replace(".", wasCommaReplaced ? "," : ".")
    );
  }

  return formattedString;
}

export function getLiquidityPoolPriceFractionDigits(
  price: number,
  tickSpacing: number,
  inverted = false
) {
  if (price <= 0) throw new Error("price must be greater than 0");
  if (tickSpacing <= 0) throw new Error("tickSpacing must be greater than 0");

  const tickIndex = priceToTickIndexRoundingToNearest(
    inverted ? 1.0 / price : price,
    tickSpacing
  );
  const price1 = tickIndexToPrice(tickIndex);
  const price2 = tickIndexToPrice(tickIndex + tickSpacing);
  const priceDelta = inverted
    ? Math.abs(1 / price1 - 1 / price2)
    : Math.abs(price1 - price2);
  if (priceDelta == 0) throw new Error("priceDelta is 0");

  const e = Math.log10(priceDelta);
  return Math.max(0, -Math.round(e) + 1);
}

export function formatPoolPrice(
  price: number,
  tickSpacing: number,
  inverted = false
) {
  const fractionalDigits = getLiquidityPoolPriceFractionDigits(
    price,
    tickSpacing,
    inverted
  );
  return formatNumber(price, {
    style: "price",
    minFractionDigits: fractionalDigits,
    maxFractionDigits: fractionalDigits,
  });
}

export function formatPing(ms: number) {
  const msHours = ms / HOUR;
  const msMinutes = ms / MINUTE;
  const msSeconds = ms / SECOND;

  let milliseconds: number = 0;
  let seconds: number = 0;
  let minutes: number = 0;
  let hours: number = 0;

  switch (true) {
    // Hours and minutes
    case msHours >= 1: {
      minutes = (ms % HOUR) / MINUTE;
      hours = msHours;
      break;
    }
    // Minutes and seconds
    case msMinutes >= 1: {
      seconds = (ms % MINUTE) / SECOND;
      minutes = msMinutes;
      break;
    }
    // Seconds and milliseconds
    case msSeconds >= 1: {
      milliseconds = ms % SECOND;
      seconds = msSeconds;
      break;
    }
    default: {
      milliseconds = ms;
    }
  }

  const millisecondsStr = milliseconds ? `${milliseconds.toFixed()}ms` : "";
  const secondsStr = seconds ? `${seconds.toFixed()}s` : "";
  const minutesStr = minutes ? `${minutes.toFixed()}m` : "";
  const hoursStr = hours ? `${hours.toFixed()}hr` : "";

  return [hoursStr, minutesStr, secondsStr, millisecondsStr].join(" ");
}

export const formatAddress = (address: Address) => {
  const firstPart = address.slice(0, 4);
  const lastPart = address.slice(-4);
  return `${firstPart}...${lastPart}`;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function useMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    return () => {
      setIsMounted(false);
    };
  }, []);

  return isMounted;
}
