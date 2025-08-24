export const baseRoute = import.meta.env.VITE_APP_PATH_ROOT.replace(/^\/+|\/+$/g, '');
export const routes = {
  base: baseRoute,
  admin: `${baseRoute}/admin` as const,
  adminVisualize: (instanceIdOrSlug: string) => `${baseRoute}/admin/visualize/${instanceIdOrSlug}`,
  adminAnalytics: (instanceIdOrSlug: string) => `${baseRoute}/admin/analytics/${instanceIdOrSlug}`,
  takeSurvey: (instanceIdOrSlug: string) => `${baseRoute}/${instanceIdOrSlug}`,
  confirmation: (instanceIdOrSlug: string) => `${baseRoute.replace(/\/$/, '')}/../survey-confirmation/${instanceIdOrSlug}` // not under base, left for reference
} as const;