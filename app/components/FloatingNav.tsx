import React, { useEffect, useState, useRef } from "react";
import type { ProfileData, Language } from "../data/profile";
import { getLocalizedText, TRANSLATIONS } from "../lib/i18n";
import { HomeIcon, CompassIcon, ContactIcon, GlobeIcon } from "./Icons";

export type TabId = "home" | "explore" | "contact";

interface FloatingNavProps {
	profile: ProfileData;
	lang: Language;
	activeTab: TabId;
	onSelectTab: (tabId: TabId) => void;
	onToggleLang?: (lang: Language) => void;
}

interface NavItem {
	id: TabId;
	label: string;
	icon: React.ReactNode;
}

export function FloatingNav({
	profile,
	lang,
	activeTab,
	onSelectTab,
	onToggleLang,
}: FloatingNavProps) {
	const [isScrollingDown, setIsScrollingDown] = useState<boolean>(false);
	const [isLangOpen, setIsLangOpen] = useState<boolean>(false);
	const lastScrollY = useRef<number>(0);
	const desktopTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const mobileTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const desktopLangRef = useRef<HTMLDivElement | null>(null);
	const mobileLangRef = useRef<HTMLDivElement | null>(null);

	// Close language dropdown on outside click or Escape key
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				desktopLangRef.current &&
				!desktopLangRef.current.contains(e.target as Node) &&
				mobileLangRef.current &&
				!mobileLangRef.current.contains(e.target as Node)
			) {
				setIsLangOpen(false);
			}
		};
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsLangOpen(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, []);

	// 3 Dedicated App-Like Tabs (Strictly Home, Explore, Contact — NO Links)
	const navItems: NavItem[] = [
		{
			id: "home",
			label: profile.navigation?.homeLabel
				? getLocalizedText(profile.navigation.homeLabel, lang, TRANSLATIONS[lang].nav.home)
				: TRANSLATIONS[lang].nav.home,
			icon: <HomeIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
		},
		{
			id: "explore",
			label: profile.navigation?.exploreLabel
				? getLocalizedText(profile.navigation.exploreLabel, lang, TRANSLATIONS[lang].nav.explore)
				: TRANSLATIONS[lang].nav.explore,
			icon: <CompassIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
		},
		{
			id: "contact",
			label: profile.navigation?.contactLabel
				? getLocalizedText(profile.navigation.contactLabel, lang, TRANSLATIONS[lang].nav.contact)
				: TRANSLATIONS[lang].nav.contact,
			icon: <ContactIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
		},
	];

	// Scroll-direction detection for mobile compact mode when content is long
	useEffect(() => {
		const handleScroll = () => {
			const currentY = window.scrollY;
			if (currentY > lastScrollY.current + 15 && currentY > 120) {
				setIsScrollingDown(true);
			} else if (currentY < lastScrollY.current - 15 || currentY < 80) {
				setIsScrollingDown(false);
			}
			lastScrollY.current = currentY;
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Keyboard arrow navigation for tabs according to W3C ARIA Tab Pattern
	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLButtonElement>,
		currentIndex: number,
		refs: (HTMLButtonElement | null)[]
	) => {
		let targetIndex = -1;
		if (e.key === "ArrowRight" || e.key === "ArrowDown") {
			targetIndex = (currentIndex + 1) % navItems.length;
		} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
			targetIndex = (currentIndex - 1 + navItems.length) % navItems.length;
		} else if (e.key === "Home") {
			targetIndex = 0;
		} else if (e.key === "End") {
			targetIndex = navItems.length - 1;
		}

		if (targetIndex !== -1) {
			e.preventDefault();
			const targetItem = navItems[targetIndex];
			onSelectTab(targetItem.id);
			refs[targetIndex]?.focus();
		}
	};

	return (
		<>
			{/* DESKTOP: Floating Bottom Navigation Dock */}
			<aside
				aria-label="Desktop Tab Navigation"
				className="hidden sm:flex fixed bottom-8 left-1/2 -translate-x-1/2 z-40 transition-all duration-300"
			>
				<div
					role="tablist"
					aria-label={TRANSLATIONS[lang].nav.tabNavAria}
					className="glass-liquid-nav rounded-full p-2 flex items-center gap-1.5 shadow-2xl border border-[var(--glass-border-specular)] backdrop-blur-2xl"
				>
					{navItems.map((item, index) => {
						const isActive = activeTab === item.id;
						return (
							<button
								key={item.id}
								ref={(el) => {
									desktopTabRefs.current[index] = el;
								}}
								type="button"
								role="tab"
								id={`desktop-tab-${item.id}`}
								aria-selected={isActive}
								aria-controls={`tabpanel-${item.id}`}
								tabIndex={isActive ? 0 : -1}
								onClick={() => onSelectTab(item.id)}
								onKeyDown={(e) =>
									handleKeyDown(e, index, desktopTabRefs.current)
								}
								className={`relative px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] ${
									isActive
										? "glass-nav-active shadow-sm text-theme-primary font-bold"
										: "text-theme-secondary hover:text-theme-primary hover:bg-[var(--glass-surface-hover)]"
								}`}
							>
								{item.icon}
								<span>{item.label}</span>
							</button>
						);
					})}

					{/* Vertical Separator */}
					<div className="w-px h-4 bg-[var(--glass-border-subtle)] mx-1" aria-hidden="true" />

					{/* Integrated Language Globe Button & Dropdown (Upward Opening) */}
					<div className="relative" ref={desktopLangRef}>
						<button
							type="button"
							aria-label={TRANSLATIONS[lang].nav.langSelectAria}
							aria-haspopup="menu"
							aria-expanded={isLangOpen}
							onClick={() => setIsLangOpen((prev) => !prev)}
							className={`px-3 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] ${
								isLangOpen
									? "bg-[var(--glass-surface-hover)] text-theme-primary font-bold"
									: "text-theme-secondary hover:text-theme-primary hover:bg-[var(--glass-surface-hover)]"
							}`}
						>
							<GlobeIcon className="w-3.5 h-3.5" />
							<span className="uppercase text-[11px] font-bold">{lang}</span>
							<span className={`text-[8px] transition-transform duration-200 ${isLangOpen ? "rotate-180" : ""}`}>▴</span>
						</button>

						{/* Dropdown Menu (Opens Upward Above Bottom Dock) */}
						{isLangOpen && (
							<div
								role="menu"
								aria-label={TRANSLATIONS[lang].nav.langSelectAria}
								className="absolute bottom-full mb-3 right-0 glass-liquid-secondary rounded-2xl p-1.5 shadow-2xl border border-[var(--glass-border-specular)] min-w-[160px] flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl"
							>
								<button
									type="button"
									role="menuitem"
									aria-label={TRANSLATIONS[lang].nav.langOptionEn}
									onClick={() => {
										onToggleLang?.("en");
										setIsLangOpen(false);
									}}
									className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
										lang === "en"
											? "bg-theme-accent-subtle text-theme-accent font-bold"
											: "text-theme-secondary hover:text-theme-primary hover:bg-[var(--glass-surface-hover)]"
									}`}
								>
									<span>{TRANSLATIONS[lang].nav.langOptionEn}</span>
									{lang === "en" && <span className="text-[11px] font-bold">✓</span>}
								</button>
								<button
									type="button"
									role="menuitem"
									aria-label={TRANSLATIONS[lang].nav.langOptionId}
									onClick={() => {
										onToggleLang?.("id");
										setIsLangOpen(false);
									}}
									className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
										lang === "id"
											? "bg-theme-accent-subtle text-theme-accent font-bold"
											: "text-theme-secondary hover:text-theme-primary hover:bg-[var(--glass-surface-hover)]"
									}`}
								>
									<span>{TRANSLATIONS[lang].nav.langOptionId}</span>
									{lang === "id" && <span className="text-[11px] font-bold">✓</span>}
								</button>
							</div>
						)}
					</div>
				</div>
			</aside>

			{/* MOBILE: Floating Bottom Navigation Dock */}
			<aside
				aria-label="Mobile Tab Navigation Dock"
				className={`sm:hidden fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
					isScrollingDown
						? "bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] scale-95 opacity-90"
						: "bottom-[calc(1.75rem+env(safe-area-inset-bottom,0px))] scale-100 opacity-100"
				}`}
			>
				<div
					role="tablist"
					aria-label={TRANSLATIONS[lang].nav.mobileTabNavAria}
					className="glass-liquid-nav rounded-full px-3 py-2 flex items-center gap-1.5 shadow-xl border border-[var(--glass-border-specular)]"
				>
					{navItems.map((item, index) => {
						const isActive = activeTab === item.id;
						return (
							<button
								key={item.id}
								ref={(el) => {
									mobileTabRefs.current[index] = el;
								}}
								type="button"
								role="tab"
								id={`mobile-tab-${item.id}`}
								aria-selected={isActive}
								aria-controls={`tabpanel-${item.id}`}
								tabIndex={isActive ? 0 : -1}
								onClick={() => onSelectTab(item.id)}
								onKeyDown={(e) =>
									handleKeyDown(e, index, mobileTabRefs.current)
								}
								className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] ${
									isActive
										? "glass-nav-active shadow-sm"
										: "text-theme-secondary hover:text-theme-primary hover:bg-[var(--glass-surface-hover)]"
								}`}
							>
								{item.icon}
								<span className="text-[11px]">{item.label}</span>
							</button>
						);
					})}

					{/* Vertical Separator */}
					<div className="w-px h-4 bg-[var(--glass-border-subtle)] mx-0.5" aria-hidden="true" />

					{/* Integrated Language Globe Button & Dropdown (Pops up above bottom dock) */}
					<div className="relative" ref={mobileLangRef}>
						<button
							type="button"
							aria-label={TRANSLATIONS[lang].nav.langSelectAria}
							aria-haspopup="menu"
							aria-expanded={isLangOpen}
							onClick={() => setIsLangOpen((prev) => !prev)}
							className={`px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] ${
								isLangOpen
									? "bg-[var(--glass-surface-hover)] text-theme-primary"
									: "text-theme-secondary hover:text-theme-primary hover:bg-[var(--glass-surface-hover)]"
							}`}
						>
							<GlobeIcon className="w-3.5 h-3.5" />
							<span className="uppercase text-[10px] font-bold">{lang}</span>
							<span className={`text-[8px] transition-transform duration-200 ${isLangOpen ? "rotate-180" : ""}`}>▴</span>
						</button>

						{/* Dropdown Menu (pops up above bottom dock) */}
						{isLangOpen && (
							<div
								role="menu"
								aria-label={TRANSLATIONS[lang].nav.langSelectAria}
								className="absolute bottom-full mb-3 right-0 glass-liquid-secondary rounded-2xl p-1.5 shadow-2xl border border-[var(--glass-border-specular)] min-w-[145px] flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
							>
								<button
									type="button"
									role="menuitem"
									aria-label={TRANSLATIONS[lang].nav.langOptionEn}
									onClick={() => {
										onToggleLang?.("en");
										setIsLangOpen(false);
									}}
									className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
										lang === "en"
											? "bg-theme-accent-subtle text-theme-accent font-bold"
											: "text-theme-secondary hover:text-theme-primary hover:bg-[var(--glass-surface-hover)]"
									}`}
								>
									<span>{TRANSLATIONS[lang].nav.langOptionEn}</span>
									{lang === "en" && <span className="text-[11px] font-bold">✓</span>}
								</button>
								<button
									type="button"
									role="menuitem"
									aria-label={TRANSLATIONS[lang].nav.langOptionId}
									onClick={() => {
										onToggleLang?.("id");
										setIsLangOpen(false);
									}}
									className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
										lang === "id"
											? "bg-theme-accent-subtle text-theme-accent font-bold"
											: "text-theme-secondary hover:text-theme-primary hover:bg-[var(--glass-surface-hover)]"
									}`}
								>
									<span>{TRANSLATIONS[lang].nav.langOptionId}</span>
									{lang === "id" && <span className="text-[11px] font-bold">✓</span>}
								</button>
							</div>
						)}
					</div>
				</div>
			</aside>
		</>
	);
}
