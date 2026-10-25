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
				className="inline-flex items-center gap-1.5 p-1 rounded-full glass-panel border border-white/80 shadow-2xs"
			>
				<div className="flex items-center pl-2.5 text-slate-400" aria-hidden="true">
					<GlobeIcon className="w-3.5 h-3.5" />
				</div>
				<div className="flex items-center gap-1 text-xs font-semibold">
					<button
						type="button"
						onClick={() => onToggle("id")}
						aria-pressed={currentLang === "id"}
						aria-label="Bahasa Indonesia"
						className={`px-3 py-1 rounded-full transition-all duration-150 cursor-pointer ${
							currentLang === "id"
								? "bg-violet-600 text-white shadow-2xs"
								: "text-slate-600 hover:text-slate-900 hover:bg-white/50"
						}`}
					>
						ID
					</button>
					<button
						type="button"
						onClick={() => onToggle("en")}
						aria-pressed={currentLang === "en"}
						aria-label="English"
						className={`px-3 py-1 rounded-full transition-all duration-150 cursor-pointer ${
							currentLang === "en"
								? "bg-violet-600 text-white shadow-2xs"
								: "text-slate-600 hover:text-slate-900 hover:bg-white/50"
						}`}
					>
						EN
					</button>
				</div>
			</div>
		</div>
	);
}
