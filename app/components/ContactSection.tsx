import React from "react";
import type { ContactConfig, Language } from "../data/profile";
import { getLocalizedText, TRANSLATIONS } from "../lib/i18n";
import {
	EmailIcon,
	WhatsAppIcon,
	TelegramIcon,
	InstagramIcon,
	ContactIcon,
	ExternalLinkIcon,
} from "./Icons";

interface ContactSectionProps {
	config: ContactConfig;
	lang: Language;
}

function getContactPlatformIcon(platform: string) {
	switch (platform) {
		case "email":
			return <EmailIcon className="w-5 h-5 text-violet-500" />;
		case "whatsapp":
			return <WhatsAppIcon className="w-5 h-5 text-emerald-500" />;
		case "telegram":
			return <TelegramIcon className="w-5 h-5 text-sky-500" />;
		case "instagram":
			return <InstagramIcon className="w-5 h-5 text-pink-500" />;
		default:
			return <ContactIcon className="w-5 h-5 text-[var(--accent-color)]" />;
	}
}

function isValidContactUrl(url?: string): boolean {
	if (!url) return false;
	const trimmed = url.trim();
	return trimmed.length > 0 && trimmed !== "#";
}

function getLocalizedContactTitle(
	title: { id?: string | null; en?: string | null } | undefined,
	lang: Language
): string {
	const rawEn = (title?.en || "").trim();
	const rawId = (title?.id || "").trim();

	if (lang === "en") {
		if (rawEn && rawEn !== "Hubungi Saya") {
			return rawEn;
		}
		return TRANSLATIONS.en.public.contactHeading;
	} else {
		if (rawId) {
			return rawId;
		}
		return TRANSLATIONS.id.public.contactHeading;
	}
}

export function getContactMethodLabel(
	method: { label?: { id?: string | null; en?: string | null }; platform?: string },
	lang: Language
): string {
	const rawEn = (method.label?.en || "").trim();
	const rawId = (method.label?.id || "").trim();

	if (lang === "en") {
		// If label is explicitly English and not the default Indonesian seed string
		if (
			rawEn &&
			rawEn !== "Kirim Email" &&
			rawEn !== "Hubungi Saya" &&
			rawEn !== "Chat WhatsApp" &&
			rawEn !== "Kontak Lainnya"
		) {
			return rawEn;
		}
		if (method.platform === "email" || rawId === "Kirim Email" || rawEn === "Kirim Email") {
			return TRANSLATIONS.en.public.sendEmail || "Send Email";
		}
		if (method.platform === "whatsapp" || rawId === "Chat WhatsApp") {
			return "Chat on WhatsApp";
		}
		if (method.platform === "custom" || rawId === "Kontak Lainnya") {
			return "Other Contact";
		}
		return getLocalizedText(
			method.label,
			"en",
			method.platform ? method.platform.charAt(0).toUpperCase() + method.platform.slice(1) : "Contact"
		);
	} else {
		if (rawId) return rawId;
		if (method.platform === "email") {
			return TRANSLATIONS.id.public.sendEmail || "Kirim Email";
		}
		if (method.platform === "whatsapp") {
			return "Chat WhatsApp";
		}
		return getLocalizedText(
			method.label,
			"id",
			method.platform ? method.platform.charAt(0).toUpperCase() + method.platform.slice(1) : "Kontak"
		);
	}
}

const lastContactClickRef = { id: "", time: 0 };
function trackContactInteraction(targetId?: string) {
	if (typeof window === "undefined") return;
	const now = Date.now();
	if (lastContactClickRef.id === targetId && now - lastContactClickRef.time < 600) {
		return;
	}
	lastContactClickRef.id = targetId || "";
	lastContactClickRef.time = now;

	try {
		fetch("/api/public/telemetry", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				type: "interaction",
				category: "contact",
				targetId,
			}),
			keepalive: true,
		}).catch(() => {});
	} catch {
		// silent fallback
	}
}

export function ContactSection({ config, lang }: ContactSectionProps) {
	if (!config.enabled) return null;

	const activeMethods = (config.methods || []).filter((m) =>
		isValidContactUrl(m.url)
	);

	return (
		<section
			id="contact"
			aria-labelledby="contact-heading"
			className="w-full my-4 sm:my-6"
		>
			{/* Section Header */}
			<div className="flex flex-col items-center text-center mb-6 px-2">
				<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-[var(--glass-surface-interactive)] text-theme-primary border border-[var(--glass-border-specular)] shadow-sm backdrop-blur-md mb-2.5">
					<span className="w-5 h-5 rounded-full bg-[var(--accent-color)] text-[var(--accent-foreground)] flex items-center justify-center shrink-0 shadow-2xs">
						<ContactIcon className="w-3 h-3" />
					</span>
					<h2 id="contact-heading" className="tracking-tight">
						{getLocalizedContactTitle(config.title, lang)}
					</h2>
				</div>
				{config.description &&
					getLocalizedText(config.description, lang) &&
					!getLocalizedText(config.description, lang).toLowerCase().includes("silakan hubungi") &&
					!getLocalizedText(config.description, lang).toLowerCase().includes("reach out via any") && (
					<p className="text-xs sm:text-sm text-theme-muted max-w-md">
						{getLocalizedText(config.description, lang)}
					</p>
				)}
			</div>

			{activeMethods.length > 0 ? (
				/* Contact Methods Stack — Unified full-width vertical rhythm matching Home links */
				<div className="w-full flex flex-col gap-3 sm:gap-3.5">
					{activeMethods.map((method) => {
						const isEmail = method.url.startsWith("mailto:");

						return (
							<a
								key={method.id}
								href={method.url}
								target={isEmail ? undefined : "_blank"}
								rel={isEmail ? undefined : "noopener noreferrer"}
								onClick={() => {
									trackContactInteraction(method.id);
								}}
								className="glass-liquid-card rounded-2xl px-5 py-4 sm:py-4.5 flex items-center justify-between gap-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] text-left w-full transition-all"
							>
								{/* Left: Platform Icon */}
								<div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--glass-surface-secondary)] border border-[var(--glass-border-specular)] shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[var(--glass-surface-hover)] transition-all overflow-hidden p-2.5">
									{getContactPlatformIcon(method.platform)}
								</div>

								{/* Center: Title & Value */}
								<div className="min-w-0 flex-1 text-left">
									<h3 className="text-sm sm:text-base font-semibold text-theme-primary group-hover:text-[var(--accent-color)] transition-colors leading-snug whitespace-nowrap truncate">
										{getContactMethodLabel(method, lang)}
									</h3>
									<p className="text-xs sm:text-sm text-theme-secondary font-normal mt-0.5 truncate break-all leading-relaxed">
										{method.value}
									</p>
								</div>

								{/* Right: Refined External Link Indicator */}
								<div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--glass-surface-secondary)] border border-[var(--glass-border-subtle)] flex items-center justify-center text-theme-muted group-hover:text-[var(--accent-color)] group-hover:bg-[var(--accent-subtle)] group-hover:border-[var(--accent-border)] group-hover:translate-x-0.5 transition-all shrink-0">
									<ExternalLinkIcon className="w-3.5 h-3.5" />
								</div>
							</a>
						);
					})}
				</div>
			) : (
				/* Professional Liquid Glass Empty State */
				<div className="glass-liquid-secondary rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center w-full">
					<div className="w-12 h-12 rounded-full bg-emerald-100/80 border border-emerald-200/50 text-emerald-600 flex items-center justify-center mb-4 shadow-2xs">
						<ContactIcon className="w-6 h-6" />
					</div>
					<h3 className="text-base sm:text-lg font-bold text-theme-primary mb-1.5">
						{TRANSLATIONS[lang].public.contactEmptyTitle}
					</h3>
					<p className="text-xs sm:text-sm text-theme-muted max-w-md leading-relaxed">
						{TRANSLATIONS[lang].public.contactEmptyDesc}
					</p>
				</div>
			)}
		</section>
	);
}
