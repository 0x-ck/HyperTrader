"use client";

import { memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../ui/form";
import { Input } from "../ui/input";
import { LoaderIcon, AlertCircleIcon } from "lucide-react";

const joinChallengeSchema = z.object({
  challengeId: z.string().min(1, "Challenge ID is required"),
});

type JoinChallengeFormProps = {
  stageId: number;
  isLoading: boolean;
  error?: Error | null;
  onJoinChallenge: (challengeId: string) => Promise<void>;
};

export const JoinChallengeForm = memo(
  ({ isLoading, error, onJoinChallenge }: JoinChallengeFormProps) => {
    const form = useForm<z.infer<typeof joinChallengeSchema>>({
      resolver: zodResolver(joinChallengeSchema),
      defaultValues: {
        challengeId: `${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`,
      },
    });

    function onSubmit(data: z.infer<typeof joinChallengeSchema>) {
      return onJoinChallenge(data.challengeId);
    }

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 relative"
        >
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <LoaderIcon className="w-6 h-6 animate-spin text-blue-600" />
                <p className="text-xs font-medium text-gray-700">
                  Joining challenge...
                </p>
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="challengeId"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel className="text-sm">Challenge ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="my-challenge-id"
                    {...field}
                    disabled={isLoading}
                    className="text-sm"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Unique identifier for your challenge attempt
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className="w-full p-2 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircleIcon className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col gap-1 text-xs">
                <p className="font-semibold text-red-900">Error Joining</p>
                <p className="text-red-700">{error.message}</p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full flex items-center gap-2"
            disabled={isLoading || Object.keys(form.formState.errors).length > 0}
            size="sm"
          >
            {isLoading && <LoaderIcon className="w-3 h-3 animate-spin" />}
            <span>{isLoading ? "Joining..." : "Join Challenge"}</span>
          </Button>
        </form>
      </Form>
    );
  }
);

JoinChallengeForm.displayName = "JoinChallengeForm";

