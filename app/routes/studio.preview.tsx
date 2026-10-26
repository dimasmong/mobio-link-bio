import React, { useState, useEffect, useCallback } from "react";
import type { Route } from "./+types/studio.preview";
import { requireAdmin } from "../lib/auth.server";
import { profileData } from "../data/profile";
import {
	type Language,
	DEFAULT_LANGUAGE,
	parseLanguageCookie,
	setLanguagePreference,
	getLocalizedText,
	TRANSLATIONS,
} from "../lib/i18n";
import {
	getProfileRecord,
	getLinks,
	getContactMethods,
	getExploreItems,
	getExploreCategories,
	getExploreSubcategories,
	getAppearanceRecord,
	getPublishMetadata,
	type AppearanceRecord,
} from "../lib/db.server";
import { computeThemeVariables } from "../lib/theme";
import { resolveAppearance } from "../lib/appearance";
import { FixedBackground } from "../components/FixedBackground";
import { FloatingNav, type TabId } from "../components/FloatingNav";
import { ProfileGlassCard } from "../components/ProfileGlassCard";
import { VerticalLinkList } from "../components/VerticalLinkList";
import { ExploreSection } from "../components/ExploreSection";
import { ContactSection } from "../components/ContactSection";

export function meta() {
	return [
		{ title: "Draft Preview — MOBIO Studio" },
		{ name: "robots", content: "noindex, nofollow" },
		{ name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
	];
}

export function headers() {
	return {
		"Cache-Control": "private, no-store, no-cache, must-revalidate",
	};
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare?.env;
	await requireAdmin(request, env);

	let profile = { ...profileData };
	let appearance: AppearanceRecord | null = null;
	let hasUnpublished = false;

	if (env?.DB) {
		try {
			const [dbProfile, dbLinks, dbContacts, dbExplore, dbAppearance, pubMeta, dbCategories, dbSubcategories] = await Promise.all([
				getProfileRecord(env.DB, "draft"),
				getLinks(env.DB, "draft", false),
				getContactMethods(env.DB, "draft", false),
				getExploreItems(env.DB, "draft", false),
				getAppearanceRecord(env.DB, "draft"),
				getPublishMetadata(env.DB),
				getExploreCategories(env.DB, "draft"),
				getExploreSubcategories(env.DB, "draft"),
			]);

			appearance = dbAppearance;
			hasUnpublished = Boolean(pubMeta?.has_unpublished_changes);

			if (dbProfile) {
				let avatarUrl = dbProfile.avatar_url || profileData.avatarUrl;
				if (dbProfile.avatar_media_id && dbProfile.avatar_media_id.trim() !== "") {
					avatarUrl = `/api/public/media/${dbProfile.avatar_media_id.trim()}`;
				}

				profile = {
					...profile,
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
				};
			}

			// Apply links from draft
			if (dbLinks.length > 0) {
				profile.links = dbLinks.map((l) => ({
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
				}));
			}

			// Apply contact methods from draft
			if (dbContacts.length > 0) {
				profile.contact = {
					...profile.contact,
					methods: dbContacts.map((c) => ({
						id: c.id,
						platform: (c.platform === "custom" ? "other" : c.platform) as any,
						label: { id: c.label_id, en: c.label_en },
						value: c.value,
						url: c.url,
					})),
				};
			}

			// Apply explore items and categories from draft
			if (dbExplore.length > 0 || (dbCategories && dbCategories.length > 0) || (dbSubcategories && dbSubcategories.length > 0)) {
				profile.explore = {
					...profile.explore,
					enabled: true,
					categories: (dbCategories || []).map((cat) => ({
						id: cat.id,
						name: { id: cat.name_id, en: cat.name_en },
						icon: cat.icon,
						color: cat.color,
						sortOrder: cat.sort_order,
						isEnabled: Boolean(cat.is_enabled),
					})),
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

			// Apply appearance from draft
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
					animation: Boolean(dbAppearance.background_animation),
					overlayOpacity: dbAppearance.background_overlay_opacity,
					overlayColor: dbAppearance.background_overlay_color,
					brightness: dbAppearance.background_brightness,
					scale: dbAppearance.background_scale,
					position: `${dbAppearance.background_position_x}% ${dbAppearance.background_position_y}%`,
				};

				profile.cover = {
					...profile.cover,
					enabled: Boolean(dbAppearance.cover_enabled),
					coverUrl: coverUrl,
					aspectRatio: dbAppearance.cover_aspect_ratio,
				};
			}
		} catch (err: unknown) {
			console.warn("Draft preview loader error:", err);
		}
	}

	const initialLang = parseLanguageCookie(request.headers.get("Cookie"));

	return {
		profile,
		appearance,
		hasUnpublished,
		initialLang,
	};
}

export default function StudioPreview({ loaderData }: Route.ComponentProps) {
	const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
	const [lang, setLangState] = useState<Language>(loaderData.initialLang || DEFAULT_LANGUAGE);
	const [activeTab, setActiveTab] = useState<TabId>("home");
	const [isPublishing, setIsPublishing] = useState(false);
	const [publishSuccess, setPublishSuccess] = useState(false);

	const setLang = useCallback((newLang: Language) => {
		setLangState(newLang);
		setLanguagePreference(newLang);
	}, []);

	// Synchronize client-side preference from localStorage if available
	useEffect(() => {
		if (typeof window !== "undefined") {
			try {
				const saved = localStorage.getItem("mobio_lang");
				if (saved && (saved === "en" || saved === "id") && saved !== lang) {
					setLangState(saved as Language);
				}
			} catch {}
		}
	}, []);

	const profile = loaderData.profile || profileData;
	const appearance = loaderData.appearance;
	const resolved = resolveAppearance(appearance);
	const { layoutTheme, cardStyle, cardSize, font, dynamicStyles, googleFontHref } = resolved;

	const handleSelectTab = useCallback((newTab: TabId) => {
		setActiveTab(newTab);
		window.scrollTo({ top: 0, behavior: "instant" });
	}, []);

	const handlePublish = async () => {
		setIsPublishing(true);
		try {
			const res = await fetch("/api/studio/publish", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});
			if (res.ok) {
				setPublishSuccess(true);
				setTimeout(() => setPublishSuccess(false), 4000);
			}
		} catch {
			// silent fallback
		} finally {
			setIsPublishing(false);
		}
	};

	return (
		<div className="min-h-screen bg-slate-950 flex flex-col font-sans">
			{/* Preview Toolbar (Fixed Top Bar) */}
			<header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 shadow-xl">
				{/* Left: Indicator & Exit */}
				<div className="flex items-center gap-3">
					<a
						href="/studio"
						className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
					>
						<span>←</span>
						<span>MOBIO Studio</span>
					</a>
					<div className="flex items-center gap-1.5">
						<span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
						<span className="text-xs font-bold text-amber-300 uppercase tracking-wider hidden sm:inline">
							Draft Preview
						</span>
					</div>
				</div>

				{/* Center: Viewport Switcher & Quick Language Switcher */}
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
						<button
							type="button"
							onClick={() => setViewport("mobile")}
							className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
								viewport === "mobile"
									? "bg-violet-600 text-white shadow-sm"
									: "text-slate-400 hover:text-white"
							}`}
							title="Mobile (400px)"
						>
							<span>📱</span>
							<span className="hidden sm:inline">Mobile (400px)</span>
						</button>
						<button
							type="button"
							onClick={() => setViewport("tablet")}
							className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
								viewport === "tablet"
									? "bg-violet-600 text-white shadow-sm"
									: "text-slate-400 hover:text-white"
							}`}
							title="Tablet (768px)"
						>
							<span>💻</span>
							<span className="hidden sm:inline">Tablet (768px)</span>
						</button>
						<button
							type="button"
							onClick={() => setViewport("desktop")}
							className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
								viewport === "desktop"
									? "bg-violet-600 text-white shadow-sm"
									: "text-slate-400 hover:text-white"
							}`}
							title="Desktop (100%)"
						>
							<span>🖥️</span>
							<span className="hidden sm:inline">Desktop</span>
						</button>
					</div>

					{/* Language Selector Pill */}
					<div className="hidden sm:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-bold">
						<button
							type="button"
							onClick={() => setLang("en")}
							className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
								lang === "en" ? "bg-violet-600 text-white shadow-xs font-extrabold" : "text-slate-400 hover:text-white"
							}`}
							title="Switch preview to English"
						>
							EN
						</button>
						<button
							type="button"
							onClick={() => setLang("id")}
							className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
								lang === "id" ? "bg-violet-600 text-white shadow-xs font-extrabold" : "text-slate-400 hover:text-white"
							}`}
							title="Switch preview to Indonesian"
						>
							ID
						</button>
					</div>
				</div>

				{/* Right: Quick Publish Button */}
				<div className="flex items-center gap-2">
					{publishSuccess ? (
						<span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
							✓ {lang === "id" ? "Berhasil Diterbitkan!" : "Published Successfully!"}
						</span>
					) : (
						<button
							type="button"
							onClick={handlePublish}
							disabled={isPublishing}
							className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
						>
							{isPublishing ? (lang === "id" ? "Menerbitkan..." : "Publishing...") : (lang === "id" ? "Terbitkan Draft" : "Publish Draft")}
						</button>
					)}
				</div>
			</header>

			{/* Preview Viewport Frame */}
			<div className={`flex-1 w-full flex ${viewport === "desktop" ? "flex-col" : "justify-center bg-slate-950 p-2 sm:py-6 overflow-x-hidden"}`}>
				<div
					className={`w-full transition-all duration-300 relative ${
						viewport === "mobile"
							? "max-w-[400px] shadow-2xl sm:rounded-3xl border border-slate-800 overflow-hidden min-h-[844px] flex flex-col"
							: viewport === "tablet"
							? "max-w-[768px] shadow-2xl sm:rounded-3xl border border-slate-800 overflow-hidden min-h-[900px] flex flex-col"
							: "flex-1 flex flex-col min-h-[calc(100dvh-53px)]"
					}`}
				>
					{/* Real Website Rendering using Draft Data */}
					<div
						id="mobio-root"
						className={`relative flex-1 flex flex-col text-theme-primary selection:bg-[var(--accent-subtle)] selection:text-[var(--accent-color)] ${
							viewport === "desktop" ? "min-h-[calc(100dvh-53px)]" : "min-h-full"
						}`}
						data-theme={resolved.themeVariables["--theme-mode"]}
						data-layout={layoutTheme.id}
						data-card-style={cardStyle.id}
						data-card-size={cardSize.id}
						data-font={font.id}
						style={dynamicStyles}
					>
						{/* Active Google Font Link */}
						<link rel="stylesheet" href={googleFontHref} />

						{/* Background */}
						<FixedBackground config={profile.background} isContained={viewport !== "desktop"} />

						{/* Floating Navigation Dock */}
						<FloatingNav
							profile={profile}
							lang={lang}
							activeTab={activeTab}
							onSelectTab={handleSelectTab}
							onToggleLang={setLang}
						/>

						{/* Main Content with Dynamic Layout Container */}
						<main className="relative z-10 w-full flex-grow px-4 sm:px-6 pt-6 sm:pt-8 pb-28 sm:pb-32 flex flex-col items-center">
							<div className={`w-full ${layoutTheme.containerMaxWidth} mx-auto flex flex-col ${layoutTheme.alignment === "start" ? "items-start text-left" : "items-center"}`}>
								{/* HOME TAB */}
								{activeTab === "home" && (
									<div className={`w-full flex flex-col ${layoutTheme.alignment === "start" ? "items-start" : "items-center"} tab-panel-enter`}>
										{layoutTheme.isSplitDesktop ? (
											<div className="w-full md:grid md:grid-cols-12 md:gap-8 items-start my-2">
												<div className="md:col-span-5 md:sticky md:top-8 w-full flex flex-col items-center mb-6 md:mb-0">
													<ProfileGlassCard
														profile={profile}
														lang={lang}
														cardStyle={cardStyle.id}
														cardSize={cardSize.id}
													/>
												</div>
												<div className="md:col-span-7 w-full flex flex-col">
													<VerticalLinkList
														links={profile.links}
														lang={lang}
														isPreview={true}
														arrangement={layoutTheme.linkArrangement}
													/>
												</div>
											</div>
										) : (
											<div className={`w-full flex flex-col ${layoutTheme.alignment === "start" ? "items-start" : "items-center"} ${
												layoutTheme.hasOuterFrame
													? "glass-liquid-secondary rounded-4xl p-4 sm:p-7 border border-[var(--glass-border-specular)] shadow-xl my-2"
													: ""
											}`}>
												<section aria-label="Home & Profile" className={`w-full flex flex-col ${layoutTheme.alignment === "start" ? "items-start" : "items-center"}`}>
													<ProfileGlassCard
														profile={profile}
														lang={lang}
														cardStyle={cardStyle.id}
														cardSize={cardSize.id}
													/>
												</section>
												<VerticalLinkList
													links={profile.links}
													lang={lang}
													isPreview={true}
													arrangement={layoutTheme.linkArrangement}
												/>
											</div>
										)}
									</div>
								)}

								{/* EXPLORE TAB */}
								{activeTab === "explore" && (
									<div className="w-full flex flex-col items-center tab-panel-enter">
										<ExploreSection config={profile.explore} lang={lang} />
									</div>
								)}

								{/* CONTACT TAB */}
								{activeTab === "contact" && (
									<div className="w-full flex flex-col items-center tab-panel-enter">
										<ContactSection config={profile.contact} lang={lang} />
									</div>
								)}
							</div>
						</main>
					</div>
				</div>
			</div>
		</div>
	);
}
