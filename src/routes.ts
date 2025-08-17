export const baseRoute = "/survey-test-form" as const;

export const routes = {
  base: baseRoute,
  admin: `${baseRoute}/admin` as const,
  adminVisualize: (instanceIdOrSlug: string) => `${baseRoute}/admin/visualize/${instanceIdOrSlug}`,
  takeSurvey: (instanceIdOrSlug: string) => `${baseRoute}/${instanceIdOrSlug}`,
  confirmation: (instanceIdOrSlug: string) => `${baseRoute.replace(/\/$/, '')}/../survey-confirmation/${instanceIdOrSlug}` // not under base, left for reference
} as const;
