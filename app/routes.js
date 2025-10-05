import { flatRoutes } from "@react-router/fs-routes";

// Generate routes for client runtime, excluding server-only files
const clientRouteModules = import.meta.glob([
  "./routes/**/*.jsx",
  "!./routes/**/*.server.jsx",
  "!./routes/api.*.jsx",
  "!./routes/webhooks.*.jsx",
  "!./routes/auth.*.jsx",
], { eager: true });

export default flatRoutes(clientRouteModules);
