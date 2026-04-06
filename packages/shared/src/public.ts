export interface PublicSiteConfig {
  siteName: string;
  primaryDomain: string;
  secondaryDomain: string;
  mediaDomain: string;
  description: string;
}

export const publicSiteConfigPlaceholder: PublicSiteConfig = {
  siteName: 'Rebase',
  primaryDomain: 'https://rebase.network',
  secondaryDomain: 'https://rebase.community',
  mediaDomain: 'https://media.rebase.network',
  description: 'Rebase is a community platform for GeekDaily, community writing, events, hiring, and contributors.',
};
