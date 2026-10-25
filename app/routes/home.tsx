import React, { useState } from "react";
import type { Route } from "./+types/home";
import { profileData, type Language, type BioLink } from "../data/profile";
import { FloatingGlassProfile } from "../components/FloatingGlassProfile";
import { SocialIcons } from "../components/SocialIcons";
import { FeaturedLinkCard } from "../components/FeaturedLinkCard";
import { LinkCard } from "../components/LinkCard";
import { LanguageToggle } from "../components/LanguageToggle";
import { Footer } from "../components/Footer";
import { SparklesIcon } from "../components/Icons";

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

function isValidLink(link: BioLink): boolean {
	if (!link || !link.url) return false;
	const trimmed = link.url.trim();
	return trimmed.length > 0 && trimmed !== "#";
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const [lang, setLang] = useState<Language>(loaderData.initialLang || "id");
	const profile = loaderData.profile || profileData;

	const validLinks = (profile.links || []).filter(isValidLink);
	const featuredLinks = validLinks.filter((l) => l.featured);
	const regularLinks = validLinks.filter((l) => !l.featured);

	return (
		<main className="min-h-screen px-4 sm:px-6 py-6 sm:py-10 md:py-14 flex flex-col items-center justify-start overflow-x-hidden">
			{/* Adaptive container: narrow & thumb-friendly on mobile, comfortably proportioned on desktop */}
			<div className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto flex flex-col items-center">
				{/* Top Bar: Language Switcher */}
				<LanguageToggle currentLang={lang} onToggle={setLang} />

				{/* 1. Floating Glass Profile Card */}
				<FloatingGlassProfile profile={profile} lang={lang} />

				{/* 2. Social Media Icons (Outside the Profile Card - hidden if no active URLs) */}
				<SocialIcons
					socials={profile.socials}
					navLabel={profile.labels.socialNavLabel[lang]}
				/>

				{/* 3. Featured Links Section (Rendered only if valid featured links exist) */}
				{featuredLinks.length > 0 && (
					<section
						aria-label={profile.labels.featuredSection[lang]}
						className="w-full mb-6 sm:mb-8"
					>
						<div className="flex items-center gap-2 mb-3 px-1">
							<span className="w-2 h-2 rounded-full bg-violet-600" aria-hidden="true" />
							<h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
								{profile.labels.featuredSection[lang]}
							</h2>
						</div>
						<div className="flex flex-col gap-3.5">
							{featuredLinks.map((link) => (
								<FeaturedLinkCard key={link.id} link={link} lang={lang} />
							))}
						</div>
					</section>
				)}

				{/* 4. Regular Link Cards Section (1-col on mobile/tablet, 2-col on desktop) */}
				{regularLinks.length > 0 && (
					<section
						aria-label={profile.labels.linksSection[lang]}
						className="w-full mb-6 sm:mb-8"
					>
						<div className="flex items-center gap-2 mb-3 px-1">
							<span className="w-2 h-2 rounded-full bg-slate-400" aria-hidden="true" />
							<h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
								{profile.labels.linksSection[lang]}
							</h2>
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
							{regularLinks.map((link) => (
								<LinkCard key={link.id} link={link} lang={lang} />
							))}
						</div>
					</section>
				)}

				{/* 5. Neutral Placeholder State (Shown if no active links are configured yet) */}
				{validLinks.length === 0 && (
					<section
						aria-label={lang === "id" ? "Status Tautan" : "Links Status"}
						className="w-full my-6 text-center"
					>
						<div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col items-center">
							<div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mb-3">
								<SparklesIcon className="w-5 h-5" />
							</div>
							<h2 className="text-base font-semibold text-slate-800 mb-1">
								{lang === "id" ? "Tautan Belum Dikonfigurasi" : "No Links Configured Yet"}
							</h2>
							<p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
								{lang === "id"
									? "Tautan Anda akan muncul otomatis di sini setelah diisi pada file app/data/profile.ts."
									: "Your links will appear automatically here once added to app/data/profile.ts."}
							</p>
						</div>
					</section>
				)}

				{/* 6. Minimalist Personal Footer */}
				<Footer profile={profile} lang={lang} />
			</div>
		</main>
	);
}
