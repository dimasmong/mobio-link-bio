import React, { useEffect, useState, useRef } from "react";
import type { ProfileData, Language } from "../data/profile";
import { HomeIcon, CompassIcon, ContactIcon } from "./Icons";

export type TabId = "home" | "explore" | "contact";

interface FloatingNavProps {
	profile: ProfileData;
	lang: Language;
	activeTab: TabId;
	onSelectTab: (tabId: TabId) => void;
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
}: FloatingNavProps) {
	const [isScrollingDown, setIsScrollingDown] = useState<boolean>(false);
	const lastScrollY = useRef<number>(0);
	const desktopTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const mobileTabRefs = useRef<(HTMLButtonElement | null)[]>([]);

	// 3 Dedicated App-Like Tabs (Strictly Home, Explore, Contact — NO Links)
	const navItems: NavItem[] = [
		{
			id: "home",
			label: profile.navigation.homeLabel[lang],
			icon: <HomeIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
		},
		{
			id: "explore",
			label: profile.navigation.exploreLabel[lang],
			icon: <CompassIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
		},
		{
			id: "contact",
			label: profile.navigation.contactLabel[lang],
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
			{/* DESKTOP: Floating Top Navigation Bar */}
			<aside
				aria-label="Desktop Tab Navigation"
				className="hidden sm:flex fixed top-5 left-1/2 -translate-x-1/2 z-40 transition-all duration-300"
			>
				<div
					role="tablist"
					aria-label={lang === "id" ? "Menu navigasi tab" : "Tab navigation menu"}
					className="glass-liquid-nav rounded-full p-1.5 flex items-center gap-1 shadow-lg border border-white/80"
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
								className={`relative px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
									isActive
										? "glass-nav-active shadow-sm"
										: "text-slate-600 hover:text-slate-950 hover:bg-white/40"
								}`}
							>
								{item.icon}
								<span>{item.label}</span>
							</button>
						);
					})}
				</div>
			</aside>

			{/* MOBILE: Floating Bottom Navigation Dock */}
			<aside
				aria-label="Mobile Tab Navigation Dock"
				className={`sm:hidden fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
					isScrollingDown
						? "bottom-3 scale-95 opacity-90"
						: "bottom-5 scale-100 opacity-100"
				}`}
			>
				<div
					role="tablist"
					aria-label={lang === "id" ? "Menu tab navigasi mobile" : "Mobile tab navigation menu"}
					className="glass-liquid-nav rounded-full px-3 py-2 flex items-center gap-1.5 shadow-xl border border-white/85"
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
								className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
									isActive
										? "glass-nav-active shadow-sm"
										: "text-slate-600 hover:text-slate-950 hover:bg-white/40"
								}`}
							>
								{item.icon}
								<span className="text-[11px]">{item.label}</span>
							</button>
						);
					})}
				</div>
			</aside>
		</>
	);
}
