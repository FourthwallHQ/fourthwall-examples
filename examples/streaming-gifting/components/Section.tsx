import type { ReactNode } from 'react';

/**
 * A flat settings section — heading + optional description, body, and optional
 * footer/aside — with no card border or box. The settings page is already
 * embedded inside the Fourthwall dashboard, which supplies the surrounding
 * chrome, so each section is just its header and its controls.
 */
export function Section({
  title,
  description,
  aside,
  footer,
  children,
}: {
  title: string;
  description?: ReactNode;
  /** Right-aligned header content, e.g. a status tag. */
  aside?: ReactNode;
  /** Action row rendered below the body, e.g. buttons. */
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">{title}</h3>
          {description && <p className="text-base text-muted-foreground">{description}</p>}
        </div>
        {aside}
      </div>
      <div>{children}</div>
      {footer && <div className="flex items-center justify-end gap-3">{footer}</div>}
    </section>
  );
}
