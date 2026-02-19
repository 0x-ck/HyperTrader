"use client";

import { challengeTemplateSchema } from "./challenge-template-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { memo } from "react";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { LoaderIcon, AlertCircleIcon } from "lucide-react";
import { Combobox } from "../ui/combobox";
import { addressBook } from "@/protocol/atoms";
import { useAtom } from "jotai/react";
import { address } from "@solana/kit";
import { useSigner } from "../wallet/wallet-context";

type CreateChallengeTemplateProps = {
  isLoading: boolean;
  isDisabled: boolean;
  error?: Error | null;
  onCreateTemplate: (
    opts: z.infer<typeof challengeTemplateSchema>
  ) => Promise<void>;
};

const SOL_NATIVE_MINT = "So11111111111111111111111111111111111111111";
const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export const CreateChallengeTemplate = memo(
  (props: CreateChallengeTemplateProps) => {
    const [book, setBook] = useAtom(addressBook);
    const signer = useSigner();

    const form = useForm<z.infer<typeof challengeTemplateSchema>>({
      resolver: zodResolver(challengeTemplateSchema),
      defaultValues: {
        stageId: 1,
        stageSequence: 1,
        stageType: "evaluation",
        startingDeposit: "1000",
        admin: signer?.address,
        entranceCost: "100",
        entranceTokenMint: SOL_NATIVE_MINT,
        minimumTradingDays: 3,
        dailyDrawdown: 500, // 5%
        maximumLoss: 1000, // 10%
        profitTarget: 1000, // 10%
        maxParticipants: 100,
        isActive: true,
      },
    });

    function onSubmit(data: z.infer<typeof challengeTemplateSchema>) {
      console.log("Creating challenge template", data);
      return props.onCreateTemplate(data);
    }

    const formData = form.watch();

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col w-full max-w-sm items-center gap-4 relative"
        >
          {props.isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <LoaderIcon className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm font-medium text-gray-700">Creating template on-chain...</p>
              </div>
            </div>
          )}
          <h3 className="text-lg font-semibold">Create Challenge Template</h3>

          <FormField
            control={form.control}
            name="stageId"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel>Stage ID</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Unique identifier for this stage</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stageSequence"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel>Stage Sequence</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Order in challenge progression</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stageType"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel>Stage Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="evaluation">Evaluation</SelectItem>
                    <SelectItem value="funded">Funded</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startingDeposit"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel>Starting Deposit ($)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="1000" {...field} />
                </FormControl>
                <FormDescription>Virtual balance in lamports</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="admin"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel>Admin Address</FormLabel>
                <FormControl>
                  <Combobox
                    mode="single"
                    options={[
                      ...(signer?.address ? [{
                        value: signer.address,
                        label: `${signer.address.slice(0, 6)}...${signer.address.slice(-4)} (You)`,
                      }] : []),
                      ...book.map((v) => ({
                        value: v,
                        label: v.slice(0, 6) + "..." + v.slice(-4),
                      })),
                    ]}
                    placeholder="Select or enter admin address..."
                    selected={field.value || signer?.address || ""}
                    onChange={field.onChange}
                    onCreate={(v) => {
                      setBook((prev) => [...prev, address(v)]);
                      field.onChange(v);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Administrator who can update template parameters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="entranceCost"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel>Entrance Cost (SOL)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="100" {...field} />
                </FormControl>
                <FormDescription>Fee to join in lamports</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="entranceTokenMint"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel>Token Mint</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={SOL_NATIVE_MINT}>SOL (Native)</SelectItem>
                    <SelectItem value={USDC_MINT_DEVNET}>USDC (Devnet)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Payment token for entrance fee</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minimumTradingDays"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel>Minimum Trading Days</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dailyDrawdown"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel>Daily Drawdown (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>In basis points (100 = 1%)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maximumLoss"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel>Maximum Loss (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>In basis points (100 = 1%)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profitTarget"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel>Profit Target (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>In basis points (100 = 1%)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxParticipants"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel>Max Participants</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="w-full text-left flex flex-row items-center gap-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4"
                  />
                </FormControl>
                <FormLabel className="!mt-0">Is Active</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          {props.error && (
            <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircleIcon className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-semibold text-red-900">Error Creating Template</p>
                <p className="text-red-700">{props.error.message}</p>
              </div>
            </div>
          )}

          {Object.keys(form.formState.errors).length > 0 && (
            <div className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
              <AlertCircleIcon className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-semibold text-yellow-900">Form Validation Errors</p>
                <ul className="text-yellow-700 list-disc list-inside">
                  {Object.entries(form.formState.errors).map(([field, error]) => (
                    <li key={field}>
                      {field}: {error?.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <pre className="text-xs text-left w-full overflow-auto max-h-64 bg-gray-50 p-2 rounded border">
            {JSON.stringify(formData, null, 2)}
          </pre>

          <Button
            type="submit"
            className="w-full flex items-center gap-2"
            disabled={
              props.isDisabled ||
              props.isLoading ||
              Object.keys(form.formState.errors).length > 0
            }
          >
            {props.isLoading && (
              <LoaderIcon className="w-4 h-4 animate-spin" />
            )}
            <span>{props.isLoading ? "Creating Template..." : "Create Challenge Template"}</span>
          </Button>
        </form>
      </Form>
    );
  }
);

CreateChallengeTemplate.displayName = "CreateChallengeTemplate";

