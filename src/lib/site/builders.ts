/** Partner logos and clients — add entries when ready. */
export type Builder = {
  name: string;
  category: string;
  logo: string;
  logoClassName?: string;
  logoImageClassName?: string;
  logoWidth?: number;
  logoHeight?: number;
};

export const builders: Builder[] = [];

export const buildersIntro =
  "Add partner logos and client relationships here when ready.";
