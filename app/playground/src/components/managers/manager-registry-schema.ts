import { z } from "zod";

export const managerRegistrySchema = z.object({
  // No additional fields needed for initialization
  // The registry is initialized with default values
});

export type ManagerRegistrySchema = z.infer<typeof managerRegistrySchema>;
