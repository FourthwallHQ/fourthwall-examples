// The creator's identity for the link page. The product carousel is pulled live
// from the Fourthwall shop (see lib/fourthwall.ts); only the avatar, name, and
// socials are configured here.

export type SocialPlatform = "instagram" | "x" | "youtube" | "tiktok";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface Profile {
  name: string;
  /** Avatar image URL; falls back to initials when omitted. */
  avatarUrl?: string;
  socials: SocialLink[];
}

export const profile: Profile = {
  name: "Beautiful Bastard",
  socials: [
    { platform: "instagram", url: "https://instagram.com/beautifulbastard" },
    { platform: "youtube", url: "https://youtube.com/@PhilipDeFranco" },
  ],
};
