import React from "react";
import type { Language } from "../data/profile";
import { GlobeIcon } from "./Icons";

interface LanguageToggleProps {
	currentLang: Language;
	onToggle: (lang: Language) => void;
}

export function LanguageToggle({ currentLang, onToggle }: LanguageToggleProps) {
	return (
		<div className="w-full flex items-center justify-end mb-4 sm:mb-6">
			<div
				role="region"
				aria-label={currentLang === "id" ? "Pengaturan bahasa" : "Language settings"}
				className="inline-flex items-center gap-1.5 p-1 rounded-full glass-liquid-secondary border border-[var(--glass-border-specular)] shadow-sm"
			>
				<div className="flex items-center pl-2.5 text-theme-muted" aria-hidden="true">
					<GlobeIcon className="w-3.5 h-3.5" />
				</div>
				<div className="flex items-center gap-1 text-xs font-semibold">
					<button
						type="button"
						onClick={() => onToggle("id")}
						aria-pressed={currentLang === "id"}
						aria-label="Bahasa Indonesia"
						style={currentLang === "id" ? { backgroundColor: "var(--accent-color)", color: "var(--accent-foreground)" } : undefined}
						className={`px-3 py-1 rounded-full transition-all duration-150 cursor-pointer ${
							currentLang === "id"
								? "shadow-2xs font-bold"
								: "text-theme-secondary hover:text-theme-primary hover:bg-[var(--glass-surface-hover)]"
						}`}
					>
						ID
					</button>
					<button
						type="button"
						onClick={() => onToggle("en")}
						aria-pressed={currentLang === "en"}
						aria-label="English"
						style={currentLang === "en" ? { backgroundColor: "var(--accent-color)", color: "var(--accent-foreground)" } : undefined}
						className={`px-3 py-1 rounded-full transition-all duration-150 cursor-pointer ${
							currentLang === "en"
								? "shadow-2xs font-bold"
								: "text-theme-secondary hover:text-theme-primary hover:bg-[var(--glass-surface-hover)]"
						}`}
					>
						EN
					</button>
				</div>
			</div>
		</div>
	);
}
