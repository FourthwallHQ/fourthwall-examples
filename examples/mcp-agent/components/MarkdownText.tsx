import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownText({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-2.5 text-base leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => (
            <ul className="flex list-disc flex-col gap-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="flex list-decimal flex-col gap-1 pl-5">{children}</ol>
          ),
          h1: ({ children }) => <p className="text-lg font-semibold">{children}</p>,
          h2: ({ children }) => <p className="text-lg font-semibold">{children}</p>,
          h3: ({ children }) => <p className="font-semibold">{children}</p>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded-control bg-muted px-1 py-0.5 font-mono text-sm">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-control bg-muted px-3 py-2.5 font-mono text-xs leading-relaxed [&_code]:bg-transparent [&_code]:p-0">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-border pl-3 text-muted-foreground">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-2.5 py-1.5 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-2.5 py-1.5">{children}</td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
