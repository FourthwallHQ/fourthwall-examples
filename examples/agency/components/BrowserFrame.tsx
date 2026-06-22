interface BrowserFrameProps {
  /** The shop's public domain shown in the URL bar. */
  domain?: string;
  children: React.ReactNode;
}

/** A browser-chrome frame — signals this is the real, public, live site. */
export function BrowserFrame({ domain, children }: BrowserFrameProps) {
  const url = domain ? `https://${domain}` : undefined;

  return (
    <div className="overflow-hidden rounded-panel border border-border bg-card shadow-2xl">
      <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-2.5">
        <span className="size-3 rounded-full bg-red-400" />
        <span className="size-3 rounded-full bg-yellow-400" />
        <span className="size-3 rounded-full bg-green-400" />
        <div className="mx-auto flex w-full max-w-md items-center rounded-control border border-border bg-background px-3 py-1">
          <span className="truncate font-mono text-xs text-muted-foreground">
            {url ?? "shop domain"}
          </span>
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Open ↗
          </a>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
