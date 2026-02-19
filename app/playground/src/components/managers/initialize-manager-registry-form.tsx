"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Form } from "../ui/form";
import { managerRegistrySchema } from "./manager-registry-schema";

type InitializeManagerRegistryFormProps = {
  onInitializeRegistry: (data: z.infer<typeof managerRegistrySchema>) => Promise<void>;
  isLoading: boolean;
  isDisabled: boolean;
  error: Error | null;
};

export function InitializeManagerRegistryForm({
  onInitializeRegistry,
  isLoading,
  isDisabled,
  error,
}: InitializeManagerRegistryFormProps) {
  const form = useForm<z.infer<typeof managerRegistrySchema>>({
    resolver: zodResolver(managerRegistrySchema),
    defaultValues: {},
  });

  const onSubmit = async (data: z.infer<typeof managerRegistrySchema>) => {
    try {
      await onInitializeRegistry(data);
      form.reset();
    } catch (err) {
      console.error("Failed to initialize manager registry:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Initialize Manager Registry</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Initialize the manager registry to start managing fund managers.
            </div>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error.message}
              </div>
            )}

            <Button
              type="submit"
              disabled={isDisabled || isLoading}
              className="w-full"
            >
              {isLoading ? "Initializing..." : "Initialize Registry"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
