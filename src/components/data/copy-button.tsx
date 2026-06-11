"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import clsx from "clsx";

export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`Copied${label ? ` ${label}` : ""}`);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy. Select manually.");
    }
  }

  const isEmpty = !value;
  return (
    <button
      type="button"
      onClick={copy}
      disabled={isEmpty}
      aria-label={label ? `Copy ${label}` : "Copy to clipboard"}
      className={clsx(
        "inline-flex items-center gap-1.5 transition",
        isEmpty
          ? "text-[var(--dn-text-15)] cursor-not-allowed"
          : "text-[var(--dn-text-50)] hover:text-[var(--dn-text)]",
        className,
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}
