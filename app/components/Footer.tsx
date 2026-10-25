import React from "react";
import type { ProfileData, Language } from "../data/profile";

interface FooterProps {
	profile: ProfileData;
	lang: Language;
}

export function Footer({ profile, lang }: FooterProps) {
	if (!profile.footer.showFooter) {
		return null;
	}

	const currentYear = new Date().getFullYear();
	const customText = profile.footer.customText?.[lang];

	return (
		<footer className="w-full mt-12 sm:mt-16 text-center text-xs text-theme-muted py-6 border-t border-[var(--glass-border-subtle)]">
			<p className="font-medium text-theme-secondary">
				© {currentYear} {profile.name}
				{customText && <span className="text-theme-muted"> • {customText}</span>}
			</p>
		</footer>
	);
}
