import { addressBook, vaultsAtom } from "@/protocol/atoms";
import { zodResolver } from "@hookform/resolvers/zod";
import { address } from "@solana/kit";
import { useAtom } from "jotai";
import { memo, useEffect, useMemo } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import z from "zod";
import { Button } from "../ui/button";
import { Combobox } from "../ui/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { newVaultSchema } from "./new-vault-schema";

type CreateNewVaultProps = {
  isLoading: boolean;
  isDisabled: boolean;
  onCreateOrConnect: (opts: z.infer<typeof newVaultSchema>) => Promise<void>;
};

export const CreateNewVault = memo((props: CreateNewVaultProps) => {
  const [vaults] = useAtom(vaultsAtom);

  const form = useForm<z.infer<typeof newVaultSchema>>({
    resolver: zodResolver(
      newVaultSchema.refine((s) => !vaults.some((v) => v.seed === s.seed), {
        error: "Vault already exists",
        path: ["seed"],
      })
    ),
    defaultValues: {
      policy: {
        kind: "AllowAny",
        params: {},
      },
      seed: "abc123",
    },
  });

  function onSubmit(data: z.infer<typeof newVaultSchema>) {
    console.log("form", data);
    return props.onCreateOrConnect(data);
  }

  const kind = form.watch("policy.kind");
  const formData = form.watch();
  

  const paramsFields = useMemo(() => {
    switch (kind) {
      case "Owners":
        return <SetupMultisigForm form={form} />;
      case "LimitTransfer":
        return <SetupLimitTransferForm form={form} />;
      case "Multisig":
        return <SetupMultisigPolicyForm form={form} />;
      default:
        return <EmptyParamsForm form={form} />;
    }
  }, [kind, form]); // form is stable from useForm, but included for linter

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col w-full max-w-sm items-center gap-4 sticky top-0"
      >
        <FormField
          control={form.control}
          name="seed"
          render={({ field }) => (
            <FormItem className="w-full text-left">
              <FormLabel>Vault Seed</FormLabel>
              <FormControl>
                <Input placeholder="abc_123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="policy.kind"
          render={({ field }) => (
            <FormItem className="w-full text-left">
              <FormLabel>Policy</FormLabel>
              <Select onValueChange={(value) => {
                field.onChange(value);
              }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a policy" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AllowAny">Allow any tx</SelectItem>
                  <SelectItem value="DenyAll">Deny all tx</SelectItem>
                  <SelectItem value="Owners">Owners</SelectItem>
                  <SelectItem value="LimitTransfer">Limit Transfer</SelectItem>
                  <SelectItem value="Multisig">Multisig</SelectItem>
                  <SelectItem value="AllOf" disabled>
                    Require all of
                  </SelectItem>
                  <SelectItem value="AnyOf" disabled>
                    Require one of
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {paramsFields}
        <pre className="text-xs text-left w-full overflow-auto max-h-96">
          {JSON.stringify(formData, null, 2)}
        </pre>
        {/* <FormField
          control={form.control}
          name="policy.params"
          render={({ field }) => (
            <FormItem className="w-full text-left">
              <FormLabel>Params</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="{}"
                  className="resize-none font-mono"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}
        <Button
          type="submit"
          className="w-full"
          disabled={
            props.isDisabled ||
            props.isLoading ||
            Object.keys(form.formState.errors).length > 0
          }
        >
          {props.isLoading ? "Processing..." : "Create or open vault"}
        </Button>
      </form>
    </Form>
  );
});

type SetupProps = {
  form: UseFormReturn<z.infer<typeof newVaultSchema>>;
};

export const EmptyParamsForm = memo((props: SetupProps) => {
  const { form } = props;

  useEffect(() => {
    form.resetField("policy.params", { defaultValue: {} });
  }, [form]);

  return null;
});

export const SetupMultisigForm = memo((props: SetupProps) => {
  const { form } = props;
  const [book, setBook] = useAtom(addressBook);

  useEffect(() => {
    form.resetField("policy.params", { defaultValue: [] });
  }, [form]);

  return (
    <FormField
      control={form.control}
      name="policy.params"
      render={({ field }) => (
        <FormItem className="w-full text-left">
          <FormLabel>Signers</FormLabel>
          <FormControl>
            <Combobox
              mode="multiple" //single or multiple
              options={[
                ...book.map((v) => ({
                  value: v,
                  label:
                    v.slice(0, 6) + "..." + v.slice(-4),
                })),
              ]}
              placeholder="Select or enter signers..."
              selected={
                Array.isArray(field.value) ? field.value : [field.value]
              } // string or array
              onChange={field.onChange}
              onCreate={(v) => {
                setBook((prev) => [...prev, address(v)]);
                field.onChange(v);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    ></FormField>
  );
});

export const SetupLimitTransferForm = memo((props: SetupProps) => {
  const { form } = props;

  useEffect(() => {
    form.resetField("policy.params", { defaultValue: {} });
  }, [form]);

  return (
    <>
      <FormField
        control={form.control}
        name="policy.params.max"
        render={({ field }) => (
          <FormItem className="w-full text-left">
            <FormLabel>Max Transfer</FormLabel>
            <FormControl>
              <Input type="number" value={field.value || ""} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      ></FormField>
      <FormField
        control={form.control}
        name="policy.params.min"
        render={({ field }) => (
          <FormItem className="w-full text-left">
            <FormLabel>Min Transfer</FormLabel>
            <FormControl>
              <Input type="number" value={field.value || ""} onChange={field.onChange} min={0} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      ></FormField>
    </>
  );
});

export const SetupMultisigPolicyForm = memo((props: SetupProps) => {
  const { form } = props;
  const [book, setBook] = useAtom(addressBook);

  // Initialize multisig params only once when component mounts
  useEffect(() => {
    const currentParams = form.getValues("policy.params");
    if (!currentParams || (!currentParams.owners && currentParams.threshold === undefined)) {
      form.setValue("policy.params", { owners: [], threshold: 1 });
    }
  }, [form]); // Include form in dependencies


  return (
    <>
      <FormField
        control={form.control}
        name="policy.params.owners"
        render={({ field }) => (
          <FormItem className="w-full text-left">
            <FormLabel>Signers</FormLabel>
            <FormControl>
              <Combobox
                mode="multiple"
                options={[
                  ...book.map((v) => ({
                    value: v,
                    label: v.slice(0, 6) + "..." + v.slice(-4),
                  })),
                ]}
                placeholder="Select or enter signers..."
                selected={Array.isArray(field.value) ? field.value : [field.value]}
                onChange={(newOwners) => {
                  field.onChange(newOwners);
                  // Update threshold when owners change
                  const ownersCount = newOwners.length;
                  const currentThreshold = form.getValues("policy.params.threshold") || 1;
                  
                  // If we have owners and threshold is 1, update it to match the number of owners
                  if (ownersCount > 0 && currentThreshold === 1) {
                    form.setValue("policy.params.threshold", ownersCount);
                  }
                  // If no owners, keep threshold at 1
                  else if (ownersCount === 0) {
                    form.setValue("policy.params.threshold", 1);
                  }
                }}
                onCreate={(v) => {
                  setBook((prev) => [...prev, address(v)]);
                  const currentOwners = field.value || [];
                  const newOwners = [...currentOwners, address(v)];
                  field.onChange(newOwners);
                  
                  // Update threshold when adding new owner
                  const ownersCount = newOwners.length;
                  const currentThreshold = form.getValues("policy.params.threshold") || 1;
                  
                  if (ownersCount > 0 && currentThreshold === 1) {
                    form.setValue("policy.params.threshold", ownersCount);
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="policy.params.threshold"
        render={({ field }) => (
          <FormItem className="w-full text-left">
            <FormLabel>Threshold</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min={1} 
                max={form.getValues("policy.params.owners")?.length || 1}
                value={field.value || 1}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  const maxValue = form.getValues("policy.params.owners")?.length || 1;
                  const newValue = Math.max(1, Math.min(value, maxValue));
                  field.onChange(newValue);
                }}
              />
            </FormControl>
            <FormMessage />
            {form.getValues("policy.params.owners")?.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Must be between 1 and {form.getValues("policy.params.owners")?.length} (number of signers)
              </p>
            )}
          </FormItem>
        )}
      />
    </>
  );
});
