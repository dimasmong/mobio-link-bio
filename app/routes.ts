import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("go/:linkId", "routes/go.$linkId.ts"),
	route("api/public/health", "routes/api.public.health.ts"),
	route("api/public/media/:id", "routes/api.public.media.$id.ts"),
	route("api/public/telemetry", "routes/api.public.telemetry.ts"),
	route("studio", "routes/studio.tsx"),
	route("studio/preview", "routes/studio.preview.tsx"),
	route("api/studio/status", "routes/api.studio.status.ts"),
	route("api/studio/profile", "routes/api.studio.profile.ts"),
	route("api/studio/links", "routes/api.studio.links.ts"),
	route("api/studio/contact", "routes/api.studio.contact.ts"),
	route("api/studio/explore", "routes/api.studio.explore.ts"),
	route("api/studio/appearance", "routes/api.studio.appearance.ts"),
	route("api/studio/analytics", "routes/api.studio.analytics.ts"),
	route("api/studio/media", "routes/api.studio.media.ts"),
	route("api/studio/media/:id/preview", "routes/api.studio.media.$id.preview.ts"),
	route("api/studio/publish", "routes/api.studio.publish.ts"),
	route("api/studio/discard", "routes/api.studio.discard.ts"),
] satisfies RouteConfig;
