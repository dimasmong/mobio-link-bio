import React, { useState, useEffect, useCallback } from "react";
import type { Route } from "./+types/home";
import { profileData, type Language } from "../data/profile";
import {
	getProfileRecord,
	getLinks,
	getContactMethods,
	getExploreItems,
	getExploreSubcategories,
	getAppearanceRecord,
	getPublishMetadata,
	type AppearanceRecord,
} from "../lib/db.server";
import { computeThemeVariables } from "../lib/theme";
import { FixedBackground } from "../components/FixedBackground";
import { FloatingNav, type TabId } from "../components/FloatingNav";
import { ProfileGlassCard } from "../components/ProfileGlassCard";
import { VerticalLinkList } from "../components/VerticalLinkList";
import { ExploreSection } from "../components/ExploreSection";
import { ContactSection } from "../components/ContactSection";
import { Footer } from "../components/Footer";

export function meta({ data }: Route.MetaArgs) {
	const currentProfile = data?.profile || profileData;
	const isNeutralDefault = !currentProfile.name || currentProfile.name === "Your Name";
	const title = isNeutralDefault
		? "MOBIO Link in Bio — Full Premium Liquid Glass"
		: `${currentProfile.name} — Link in Bio`;
	const description = currentProfile.bio?.id?.trim()
		? `${currentProfile.name} (${currentProfile.handle}) — ${currentProfile.bio.id}`
		: isNeutralDefault
		? "Self-hosted personal link in bio experience inspired by modern Liquid Glass interfaces."
		: `${currentProfile.name} (${currentProfile.handle}) — Link in Bio`;

	return [
		{ title },
		{
			name: "description",
			content: description,
		},
		{ name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
		{ property: "og:title", content: title },
		{
			property: "og:description",
			content: description,
		},
		{ property: "og:type", content: "profile" },
	];
}

export async function loader({ context }: Route.LoaderArgs) {
	const env = context.cloudflare?.env;
	let profile = { ...profileData };
	let appearance: AppearanceRecord | null = null;

	if (env?.DB) {
		try {
			const [dbProfile, dbLinks, dbContacts, dbExplore, dbAppearance, pubMeta, dbSubcategories] = await Promise.all([
				getProfileRecord(env.DB, "published"),
				getLinks(env.DB, "published", true),
				getContactMethods(env.DB, "published", true),
				getExploreItems(env.DB, "published", true),
				getAppearanceRecord(env.DB, "published"),
				getPublishMetadata(env.DB),
				getExploreSubcategories(env.DB, "published"),
			]);

			appearance = dbAppearance;

			const isPublishedActive = Boolean(
				(pubMeta && pubMeta.version > 1) ||
				(dbProfile && dbProfile.name.trim().length > 0) ||
				dbLinks.length > 0
			);

			if (isPublishedActive && dbProfile) {
				let avatarUrl = dbProfile.avatar_url || profileData.avatarUrl;
				if (dbProfile.avatar_media_id && dbProfile.avatar_media_id.trim() !== "") {
					avatarUrl = `/api/public/media/${dbProfile.avatar_media_id.trim()}`;
				}

				profile = {
					...profileData,
					name: dbProfile.name || profileData.name,
					handle: dbProfile.handle || profileData.handle,
					avatarUrl,
					location: {
						id: dbProfile.location_id || "",
						en: dbProfile.location_en || "",
					},
					bio: {
						id: dbProfile.bio_id || "",
						en: dbProfile.bio_en || "",
					},
					links: dbLinks.map((l) => ({
						id: l.id,
						title: { id: l.title_id, en: l.title_en },
						description:
							l.description_id || l.description_en
								? { id: l.description_id || "", en: l.description_en || "" }
								: undefined,
						url: l.url,
						platform: l.platform,
						icon: l.icon || "globe",
						enabled: Boolean(l.is_enabled),
						icon_type: l.icon_type,
						icon_url: l.icon_url,
						icon_media_id: l.icon_media_id,
					})),
					contact: {
						...profileData.contact,
						methods: dbContacts.map((c) => ({
							id: c.id,
							platform: (c.platform === "custom" ? "other" : c.platform) as any,
							label: { id: c.label_id, en: c.label_en },
							value: c.value,
							url: c.url,
						})),
					},
				};
			}

			// Apply explore items & subcategories if published in D1
			if (dbExplore.length > 0 || (dbSubcategories && dbSubcategories.length > 0)) {
				profile.explore = {
					...profile.explore,
					enabled: true,
					subcategories: (dbSubcategories || []).map((sub) => ({
						id: sub.id,
						category: sub.category,
						label: { id: sub.label_id, en: sub.label_en },
						icon: sub.icon,
						color: sub.color,
						sortOrder: sub.sort_order,
					})),
					items: dbExplore.map((item) => {
						let metadata = undefined;
						if (item.metadata_json) {
							try {
								metadata = JSON.parse(item.metadata_json);
							} catch {
								metadata = undefined;
							}
						}
						if (metadata?.photos && Array.isArray(metadata.photos)) {
							metadata.photos = metadata.photos.map((p: any) => ({
								...p,
								url: typeof p.url === "string"
									? p.url.replace(/\/api\/studio\/media\/([a-zA-Z0-9_-]+)\/preview/g, "/api/public/media/$1")
									: p.url,
							}));
						}
						return {
							id: item.id,
							type: item.type as any,
							title: { id: item.title_id, en: item.title_en },
							subtitle:
								item.subtitle_id || item.subtitle_en
									? { id: item.subtitle_id || "", en: item.subtitle_en || "" }
									: undefined,
							description:
								item.description_id || item.description_en
									? { id: item.description_id || "", en: item.description_en || "" }
									: undefined,
							url: item.url || undefined,
							coverImage: item.cover_image
								? item.cover_image.replace(/\/api\/studio\/media\/([a-zA-Z0-9_-]+)\/preview/g, "/api/public/media/$1")
								: undefined,
							badge:
								item.badge_id || item.badge_en
									? { id: item.badge_id || "", en: item.badge_en || "" }
									: undefined,
							metadata,
							category: item.category || "all",
							subcategory_id: item.subcategory_id || "",
						};
					}),
				};
			}

			// Apply appearance customizations to background and cover
			if (dbAppearance) {
				let bgSrc = dbAppearance.background_src || profile.background.src;
				if (dbAppearance.background_media_id && dbAppearance.background_media_id.trim() !== "") {
					bgSrc = `/api/public/media/${dbAppearance.background_media_id.trim()}`;
				}

				let bgPoster = dbAppearance.background_poster || profile.background.poster;
				if (dbAppearance.background_poster_media_id && dbAppearance.background_poster_media_id.trim() !== "") {
					bgPoster = `/api/public/media/${dbAppearance.background_poster_media_id.trim()}`;
				}

				let coverUrl = dbAppearance.cover_url || profile.cover.coverUrl;
				if (dbAppearance.cover_media_id && dbAppearance.cover_media_id.trim() !== "") {
					coverUrl = `/api/public/media/${dbAppearance.cover_media_id.trim()}`;
				}

				profile.background = {
					...profile.background,
					type: dbAppearance.background_type,
					src: bgSrc,
					poster: bgPoster,
					position: `${dbAppearance.background_position_x ?? 50}% ${dbAppearance.background_position_y ?? 50}%`,
					scale: dbAppearance.background_scale ?? 1.0,
					overlayColor: dbAppearance.background_overlay_color || "rgba(248, 250, 252, 0.45)",
					overlayOpacity: dbAppearance.background_overlay_opacity ?? 0.45,
					brightness: dbAppearance.background_brightness ?? 1.0,
					blur: dbAppearance.glass_blur || "0px",
					animation: Boolean(dbAppearance.background_animation),
				};

				profile.cover = {
					...profile.cover,
					enabled: Boolean(dbAppearance.cover_enabled),
					coverUrl,
					aspectRatio: dbAppearance.cover_aspect_ratio || "aspect-[21/9]",
				};
			}
		} catch (err) {
			// Fail-safe: if D1 fails, gracefully fallback to static profileData
			console.warn("Could not load published profile from D1, using static profileData:", err);
		}
	}

	return {
		profile,
		appearance,
		initialLang: "id" as Language,
	};
}

function parseHashToTab(hash: string): TabId {
	const clean = hash.replace("#", "").toLowerCase().trim();
	if (clean === "explore") return "explore";
	if (clean === "contact") return "contact";
	return "home";
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const [lang, setLang] = useState<Language>(loaderData.initialLang || "id");
	const [activeTab, setActiveTab] = useState<TabId>("home");
	const profile = loaderData.profile || profileData;
	const appearance = loaderData.appearance;

	const themeVariables = computeThemeVariables(appearance);
	const dynamicStyles: React.CSSProperties = {
		...(themeVariables as unknown as React.CSSProperties),
	};

	// Synchronize tab state with URL hash and browser history (Back / Forward buttons)
	useEffect(() => {
		const syncTabFromLocation = () => {
			if (typeof window !== "undefined") {
				const currentTab = parseHashToTab(window.location.hash);
				setActiveTab(currentTab);
			}
		};

		// Read initial hash on client mount without causing SSR mismatch
		syncTabFromLocation();

		window.addEventListener("hashchange", syncTabFromLocation);
		window.addEventListener("popstate", syncTabFromLocation);

		return () => {
			window.removeEventListener("hashchange", syncTabFromLocation);
			window.removeEventListener("popstate", syncTabFromLocation);
		};
	}, []);

	// Handle tab selection: update state, history, and scroll to top
	const handleSelectTab = useCallback(
		(newTab: TabId) => {
			if (newTab === activeTab) return;

			setActiveTab(newTab);

			if (typeof window !== "undefined") {
				const targetHash = `#${newTab}`;
				if (window.location.hash !== targetHash) {
					window.history.pushState(null, "", targetHash);
				}
				window.scrollTo({ top: 0, behavior: "instant" });
			}
		},
		[activeTab]
	);

	return (
		<div
			className="relative min-h-screen text-theme-primary selection:bg-[var(--accent-subtle)] selection:text-[var(--accent-color)]"
			data-theme={themeVariables["--theme-mode"]}
			style={dynamicStyles}
		>
			{/* Fixed Fullscreen Background (Gradient Mesh, Image, or Video with safe playback & readability overlay) */}
			<FixedBackground config={profile.background} />

			{/* Floating Navigation Dock with Integrated Language Dropdown */}
			<FloatingNav
				profile={profile}
				lang={lang}
				activeTab={activeTab}
				onSelectTab={handleSelectTab}
				onToggleLang={setLang}
			/>

			{/* App-Like Centered Container */}
			<main className="relative z-10 w-full min-h-screen px-4 sm:px-6 pt-6 sm:pt-8 pb-36 sm:pb-44 flex flex-col items-center">
				<div className="w-full max-w-xl sm:max-w-2xl mx-auto flex flex-col items-center">
					{/* 1. HOME TAB PANEL: Pure Profile Glass Card with Unified Cover & Overlapping Avatar + Vertical Links */}
					<div
						role="tabpanel"
						id="tabpanel-home"
						aria-labelledby="desktop-tab-home"
						hidden={activeTab !== "home"}
						className={`w-full flex flex-col items-center ${
							activeTab === "home" ? "tab-panel-enter" : "hidden"
						}`}
					>
						{activeTab === "home" && (
							<>
								<section
									aria-label={lang === "id" ? "Beranda & Profil" : "Home & Profile"}
									className="w-full flex flex-col items-center"
								>
									{/* Unified Profile Glass Card with full-bleed cover banner & overlapping avatar */}
									<ProfileGlassCard profile={profile} lang={lang} />
								</section>

								{/* Regular Links: Strict Single Vertical Column */}
								<VerticalLinkList links={profile.links} lang={lang} />

								{/* Minimalist Personal Footer */}
								<Footer profile={profile} lang={lang} />
							</>
						)}
					</div>

					{/* 2. EXPLORE TAB PANEL: Modular showcase (Projects, Lightbox Photo Gallery, Music, Notes) ONLY */}
					<div
						role="tabpanel"
						id="tabpanel-explore"
						aria-labelledby="desktop-tab-explore"
						hidden={activeTab !== "explore"}
						className={`w-full flex flex-col items-center ${
							activeTab === "explore" ? "tab-panel-enter" : "hidden"
						}`}
					>
						{activeTab === "explore" && (
							<>
								<ExploreSection config={profile.explore} lang={lang} />
								<Footer profile={profile} lang={lang} />
							</>
						)}
					</div>

					{/* 3. CONTACT TAB PANEL: Direct interaction cards (Email, WhatsApp, Telegram, Instagram) ONLY */}
					<div
						role="tabpanel"
						id="tabpanel-contact"
						aria-labelledby="desktop-tab-contact"
						hidden={activeTab !== "contact"}
						className={`w-full flex flex-col items-center ${
							activeTab === "contact" ? "tab-panel-enter" : "hidden"
						}`}
					>
						{activeTab === "contact" && (
							<>
								<ContactSection config={profile.contact} lang={lang} />
								<Footer profile={profile} lang={lang} />
							</>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
