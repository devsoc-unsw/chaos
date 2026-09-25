"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type SwitchProps = Omit<
  React.ComponentProps<"button">,
  "type" | "role" | "onClick"
> & {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function Switch({
  className,
  checked,
  onCheckedChange,
  ...props
}: SwitchProps) {
  const state = checked ? "checked" : "unchecked"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-slot="switch"
      data-state={state}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "peer inline-flex h-5 w-10 shrink-0 items-center rounded-full border p-0.5 outline-none transition-colors",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        "data-[state=unchecked]:border-gray-400 data-[state=unchecked]:bg-background",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span
        data-slot="switch-thumb"
        data-state={state}
        className={cn(
          "pointer-events-none block size-3.5 rounded-full border bg-background transition-transform",
          "data-[state=checked]:translate-x-5 data-[state=checked]:border-transparent",
          "data-[state=unchecked]:translate-x-0 data-[state=unchecked]:border-gray-400"
        )}
      />
    </button>
  )
}

export { Switch }
