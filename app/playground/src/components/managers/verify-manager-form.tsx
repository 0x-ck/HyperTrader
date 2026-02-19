"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ManagerRecord } from "@/protocol/atoms";
import { VerificationStatus } from "@/protocol/hyroProtocol/types";

const verifyManagerSchema = z.object({
  managerAddress: z.string().min(1, "Manager address is required"),
  verificationStatus: z.nativeEnum(VerificationStatus, {
    error: "Verification status is required",
  }),
});

type VerifyManagerFormProps = {
  onVerifyManager: (data: z.infer<typeof verifyManagerSchema>) => Promise<void>;
  isLoading: boolean;
  isDisabled: boolean;
  error: Error | null;
  managers: ManagerRecord[];
};

const verificationStatusLabels = {
  [VerificationStatus.Pending]: "Pending",
  [VerificationStatus.Verified]: "Verified",
  [VerificationStatus.Suspended]: "Suspended",
  [VerificationStatus.Blacklisted]: "Blacklisted",
};

export function VerifyManagerForm({
  onVerifyManager,
  isLoading,
  isDisabled,
  error,
  managers,
}: VerifyManagerFormProps) {
  const form = useForm<z.infer<typeof verifyManagerSchema>>({
    resolver: zodResolver(verifyManagerSchema),
    defaultValues: {
      managerAddress: "",
      verificationStatus: VerificationStatus.Verified,
    },
  });

  const onSubmit = async (data: z.infer<typeof verifyManagerSchema>) => {
    try {
      await onVerifyManager(data);
      form.reset();
    } catch (err) {
      console.error("Failed to verify manager:", err);
    }
  };

  // Filter managers that are not yet verified
  const pendingManagers = managers.filter(
    (manager) => 
      manager.managerAddress && 
      manager.verificationStatus !== VerificationStatus.Verified
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="managerAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manager to Verify</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manager to verify" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pendingManagers.map((manager) => (
                        <SelectItem key={manager.address} value={manager.managerAddress!}>
                          <div className="flex flex-col">
                            <span>{manager.managerAddress}</span>
                            <span className="text-xs text-muted-foreground">
                              Status: {manager.verificationStatus === VerificationStatus.Pending ? "Pending" : "Other"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="verificationStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Status</FormLabel>
                  <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select verification status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(verificationStatusLabels).map(([value, label]) => (
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
            
            {pendingManagers.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No pending managers to verify.
              </div>
            )}
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error.message}
              </div>
            )}

            <Button
              type="submit"
              disabled={isDisabled || isLoading || pendingManagers.length === 0}
              className="w-full"
            >
              {isLoading ? "Verifying..." : "Verify Manager"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
