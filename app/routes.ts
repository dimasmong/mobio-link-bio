import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("api/public/health", "routes/api.public.health.ts"),
	route("studio", "routes/studio.tsx"),
	route("api/studio/status", "routes/api.studio.status.ts"),
	route("api/studio/profile", "routes/api.studio.profile.ts"),
	route("api/studio/links", "routes/api.studio.links.ts"),
	route("api/studio/contact", "routes/api.studio.contact.ts"),
	route("api/studio/publish", "routes/api.studio.publish.ts"),
	route("api/studio/discard", "routes/api.studio.discard.ts"),
] satisfies RouteConfig;
