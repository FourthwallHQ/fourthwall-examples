import type { Profile } from "../lib/profile";
import { SocialIcon } from "./SocialIcon";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileHeader({ profile }: { profile: Profile }) {
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <div className="size-20 overflow-hidden rounded-2xl border border-border bg-accent shadow-sm">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-2xl font-semibold text-muted-foreground">
            {initials(profile.name)}
          </div>
        )}
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">{profile.name}</h1>

      {profile.socials.length > 0 && (
        <nav className="flex items-center gap-4">
          {profile.socials.map((social) => (
            <a
              key={social.platform}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              className="flex size-9 items-center justify-center rounded-full bg-card text-foreground shadow-sm transition-colors hover:text-text-brand"
            >
              <SocialIcon platform={social.platform} />
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
