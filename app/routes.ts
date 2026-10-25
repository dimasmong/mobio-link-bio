import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("api/public/health", "routes/api.public.health.ts"),
] satisfies RouteConfig;
