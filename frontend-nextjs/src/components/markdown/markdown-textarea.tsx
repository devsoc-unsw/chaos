"use client"

import * as React from "react"
import { CircleHelp } from "lucide-react"

import { Markdown, type MarkdownVariant } from "@/components/markdown/markdown"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const CHEATSHEET = [
  "**bold**",
  "*italic*",
  "~~strikethrough~~",
  "[link](https://example.com)",
  "- list item",
  "1. numbered item",
  "## Heading",
  "> quote",
]

type MarkdownTextareaProps = Omit<React.ComponentProps<typeof Textarea>, "value"> & {
  value: string
  dict: any
  /** Classes for the outer wrapper (tabs bar + editor), e.g. a max width. */
  containerClassName?: string
  /** Extra classes for the preview box. `className` is applied to both the textarea and preview so they match in size. */
  previewClassName?: string
  previewVariant?: MarkdownVariant
  /** Rendered under the editor, e.g. a character count. */
  footer?: React.ReactNode
}

/**
 * Drop-in replacement for Textarea that adds Write/Preview tabs and a markdown cheatsheet.
 */
function MarkdownTextarea({
  value,
  dict,
  className,
  containerClassName,
  previewClassName,
  previewVariant = "default",
  footer,
  ...textareaProps
}: MarkdownTextareaProps) {
  const [tab, setTab] = React.useState("write")

  return (
    <Tabs
      data-slot="markdown-textarea"
      value={tab}
      onValueChange={setTab}
      className={cn("w-full gap-1.5", containerClassName)}
    >
      <div className="flex items-center justify-between gap-2">
        <TabsList className="h-8">
          <TabsTrigger value="write" className="px-3 text-xs">
            {dict.common.markdown.write}
          </TabsTrigger>
          <TabsTrigger value="preview" className="px-3 text-xs">
            {dict.common.markdown.preview}
          </TabsTrigger>
        </TabsList>
        <Popover>
          <PopoverTrigger
            type="button"
            className="flex items-center gap-1 rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <CircleHelp className="size-3.5" />
            {dict.common.markdown.supported}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 text-sm">
            <p className="mb-2 font-medium">{dict.common.markdown.cheatsheet_title}</p>
            <div className="grid grid-cols-2 items-center gap-x-4 gap-y-1.5">
              {CHEATSHEET.map((syntax) => (
                <React.Fragment key={syntax}>
                  <code className="truncate font-mono text-xs text-muted-foreground">{syntax}</code>
                  <Markdown variant="compact">{syntax}</Markdown>
                </React.Fragment>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Kept mounted while previewing so focus leaves the textarea normally and onBlur (used to save) always fires. */}
      <TabsContent value="write" forceMount className="data-[state=inactive]:hidden">
        <Textarea value={value} className={className} {...textareaProps} />
      </TabsContent>
      <TabsContent value="preview">
        <div
          className={cn(
            "min-h-16 w-full rounded-md border border-input px-3 py-2 text-base md:text-sm",
            className,
            previewClassName
          )}
        >
          {value.trim() ? (
            <Markdown variant={previewVariant}>{value}</Markdown>
          ) : (
            <p className="text-muted-foreground">{dict.common.markdown.nothing_to_preview}</p>
          )}
        </div>
      </TabsContent>

      {footer}
    </Tabs>
  )
}

export { MarkdownTextarea }
export type { MarkdownTextareaProps }
