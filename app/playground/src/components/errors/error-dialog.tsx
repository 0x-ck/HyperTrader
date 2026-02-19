import { useEffect, useRef } from "react";
import { getErrorMessage as getWalletErrorMessage } from "../wallet/errors";
import { Button } from "../ui/button";

type Props = Readonly<{
  error: unknown;
  onClose?(): false | void;
  title?: string;
}>;

export function ErrorDialog({ error, onClose, title }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={() => {
        if (!onClose || onClose() !== false) {
          dialogRef.current?.close();
        }
      }}
      className="bg-background text-foreground max-w-90vw max-h-90vh overflow-auto rounded-lg border p-6 shadow-lg duration-200"
    >
      <h2 className="text-destructive/80 text-lg font-semibold mb-4">
        {title ?? "We encountered the following error"}
      </h2>
      <div>
        <blockquote className="border-l-4 border-muted-foreground pl-4 mb-4 italic text-foreground">
          {getWalletErrorMessage(error, "Unknown")}
        </blockquote>
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={() => dialogRef.current?.close()} variant="secondary">
          Close
        </Button>
      </div>
    </dialog>
  );
}
