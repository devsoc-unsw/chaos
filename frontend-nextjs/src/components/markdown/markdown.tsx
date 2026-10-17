import ReactMarkdown, { type Components, type Options } from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

type MarkdownVariant = "default" | "compact"

type MarkdownProps = {
  children: string | null | undefined
  className?: string
  /** "compact" keeps headings at body size and tightens spacing, e.g. for question descriptions. */
  variant?: MarkdownVariant
} & Pick<Options, "allowedElements" | "disallowedElements" | "unwrapDisallowed">

// Raw HTML is never rendered (no rehype-raw) and react-markdown's default
// urlTransform strips unsafe protocols such as javascript:, so user input is safe here.
const remarkPlugins: Options["remarkPlugins"] = [remarkGfm, remarkBreaks]

const baseComponents: Components = {
  a: ({ node, className, ...props }) => (
    <a
      className={cn("text-primary underline underline-offset-2 hover:opacity-80", className)}
      target="_blank"
      rel="noopener noreferrer nofollow"
      {...props}
    />
  ),
  strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
  ul: ({ node, className, ...props }) => (
    <ul className={cn("list-disc space-y-1 pl-6", className)} {...props} />
  ),
  ol: ({ node, ...props }) => <ol className="list-decimal space-y-1 pl-6" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote className="border-l-2 border-border pl-3 italic" {...props} />
  ),
  code: ({ node, ...props }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]" {...props} />
  ),
  pre: ({ node, ...props }) => (
    <pre
      className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-[0.9em] [&_code]:bg-transparent [&_code]:p-0"
      {...props}
    />
  ),
  hr: ({ node, ...props }) => <hr className="border-border" {...props} />,
  img: ({ node, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="max-w-full rounded-md" alt={props.alt ?? ""} {...props} />
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => <th className="border border-border px-2 py-1 font-semibold" {...props} />,
  td: ({ node, ...props }) => <td className="border border-border px-2 py-1" {...props} />,
}

const defaultComponents: Components = {
  ...baseComponents,
  h1: ({ node, ...props }) => <h1 className="text-xl font-semibold text-foreground" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-lg font-semibold text-foreground" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-foreground" {...props} />,
  h4: ({ node, ...props }) => <h4 className="font-semibold text-foreground" {...props} />,
}

const compactHeading: Components["h1"] = ({ node, ...props }) => (
  <p className="font-semibold" {...props} />
)

const compactComponents: Components = {
  ...baseComponents,
  h1: compactHeading,
  h2: compactHeading,
  h3: compactHeading,
  h4: compactHeading,
}

/**
 * Renders user-authored markdown (GitHub-flavoured, single newlines become line breaks).
 * Text colour and size are inherited from the parent, so style it via className.
 */
function Markdown({
  children,
  className,
  variant = "default",
  ...options
}: MarkdownProps) {
  if (!children?.trim()) return null

  return (
    <div
      data-slot="markdown"
      className={cn(
        "wrap-break-word",
        variant === "compact" ? "space-y-2" : "space-y-3",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        components={variant === "compact" ? compactComponents : defaultComponents}
        {...options}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

export { Markdown }
export type { MarkdownProps, MarkdownVariant }
