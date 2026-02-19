import z from "zod";

export const newVaultSchema = z.object({
  seed: z.string().regex(/^[a-z0-9_]{5,16}$/, {
    message: "Invalid seed (please use alphanumeric characters or _)",
  }),
  policy: z.object({
    kind: z.union([
      z.literal("AllowAny"),
      z.literal("DenyAll"),
      z.literal("Owners"),
      z.literal("LimitTransfer"),
      z.literal("Multisig"),
      z.literal("AllOf"),
      z.literal("AnyOf"),
    ]),
    params: z.any(),
  }),
});
