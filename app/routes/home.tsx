import React, { useState, useEffect, useCallback } from "react";
import type { Route } from "./+types/home";
import { profileData, type Language } from "../data/profile";
import { FixedBackground } from "../components/FixedBackground";
import { FloatingNav, type TabId } from "../components/FloatingNav";
import { LanguageToggle } from "../components/LanguageToggle";
import { CoverBanner } from "../components/CoverBanner";
import { ProfileGlassCard } from "../components/ProfileGlassCard";
import { VerticalLinkList } from "../components/VerticalLinkList";
import { ExploreSection } from "../components/ExploreSection";
import { ContactSection } from "../components/ContactSection";
import { Footer } from "../components/Footer";

export function meta({}: Route.MetaArgs) {
	const displayName = profileData.name || "Personal Link Bio";
	return [
		{ title: `${displayName} — Link in Bio` },
		{
			name: "description",
			content: `${displayName} (${profileData.handle}) — ${profileData.bio.id}`,
		},
		{ name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
		{ property: "og:title", content: `${displayName} — Link in Bio` },
		{
			property: "og:description",
			content: profileData.bio.id,
		},
		{ property: "og:type", content: "profile" },
	];
}

export function loader({}: Route.LoaderArgs) {
	return {
		profile: profileData,
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
