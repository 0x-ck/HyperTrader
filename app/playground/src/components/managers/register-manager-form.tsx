"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { RiskRating } from "@/protocol/hyroProtocol/types";

const registerManagerSchema = z.object({
  managerAddress: z.string().min(1, "Manager address is required"),
  riskRating: z.nativeEnum(RiskRating, {
    message: "Risk rating is required",
  }),
});

type RegisterManagerFormProps = {
  onRegisterManager: (data: z.infer<typeof registerManagerSchema>) => Promise<void>;
  isLoading: boolean;
  isDisabled: boolean;
  error: Error | null;
};

const riskRatingLabels = {
  [RiskRating.Conservative]: "Conservative",
  [RiskRating.Moderate]: "Moderate", 
  [RiskRating.Aggressive]: "Aggressive",
  [RiskRating.Speculative]: "Speculative",
};

export function RegisterManagerForm({
  onRegisterManager,
  isLoading,
  isDisabled,
  error,
}: RegisterManagerFormProps) {
  const form = useForm<z.infer<typeof registerManagerSchema>>({
    resolver: zodResolver(registerManagerSchema),
    defaultValues: {
      managerAddress: "",
      riskRating: RiskRating.Moderate,
    },
  });

  const onSubmit = async (data: z.infer<typeof registerManagerSchema>) => {
    try {
      await onRegisterManager(data);
      form.reset();
    } catch (err) {
      console.error("Failed to register manager:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="managerAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manager Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter manager's wallet address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="riskRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Rating</FormLabel>
                  <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk rating" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(riskRatingLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
              {isLoading ? "Registering..." : "Register Manager"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
