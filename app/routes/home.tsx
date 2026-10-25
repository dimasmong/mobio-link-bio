import React, { useState, useEffect, useCallback } from "react";
import type { Route } from "./+types/home";
import { profileData, type Language } from "../data/profile";
import { getProfileRecord, getLinks, getContactMethods, getPublishMetadata } from "../lib/db.server";
import { FixedBackground } from "../components/FixedBackground";
import { FloatingNav, type TabId } from "../components/FloatingNav";
import { LanguageToggle } from "../components/LanguageToggle";
import { CoverBanner } from "../components/CoverBanner";
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

	if (env?.DB) {
		try {
			const [dbProfile, dbLinks, dbContacts, pubMeta] = await Promise.all([
				getProfileRecord(env.DB, "published"),
				getLinks(env.DB, "published", true),
				getContactMethods(env.DB, "published", true),
				getPublishMetadata(env.DB),
			]);

			const isPublishedActive = Boolean(
				(pubMeta && pubMeta.version > 1) ||
				(dbProfile && dbProfile.name.trim().length > 0) ||
				dbLinks.length > 0
			);

			if (isPublishedActive && dbProfile) {
				profile = {
					...profileData,
					name: dbProfile.name || profileData.name,
					handle: dbProfile.handle || profileData.handle,
					avatarUrl: dbProfile.avatar_url || profileData.avatarUrl,
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
		} catch (err) {
			// Fail-safe: if D1 fails, gracefully fallback to static profileData
			console.warn("Could not load published profile from D1, using static profileData:", err);
		}
	}

	return {
		profile,
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
		<div className="relative min-h-screen text-slate-900 selection:bg-violet-200 selection:text-violet-900">
			{/* Fixed Fullscreen Background (Gradient Mesh, Image, or Video with safe playback & readability overlay) */}
			<FixedBackground config={profile.background} />

			{/* Floating Navigation Dock (Desktop top bar & Mobile bottom dock: Home, Explore, Contact) */}
			<FloatingNav
				profile={profile}
				lang={lang}
				activeTab={activeTab}
				onSelectTab={handleSelectTab}
			/>

			{/* App-Like Centered Container */}
			<main className="relative z-10 w-full min-h-screen px-4 sm:px-6 pt-4 pb-28 sm:pb-32 flex flex-col items-center">
				<div className="w-full max-w-xl sm:max-w-2xl mx-auto flex flex-col items-center">
					{/* Top Utility Bar: Bilingual Switcher (ID / EN) */}
					<LanguageToggle currentLang={lang} onToggle={setLang} />

					{/* 1. HOME TAB PANEL: Cover Banner + Pure Profile Glass Card + Vertical Links ONLY */}
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
									{/* Custom Cover Banner with Liquid Glass Fallback */}
									<CoverBanner config={profile.cover} lang={lang} />

									{/* Pure Profile Card (Avatar, Name, Handle, Bio ONLY) */}
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
