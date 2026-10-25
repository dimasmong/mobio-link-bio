import React from "react";
import type { ContactConfig, Language } from "../data/profile";
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
			return <EmailIcon className="w-5 h-5 text-violet-600" />;
		case "whatsapp":
			return <WhatsAppIcon className="w-5 h-5 text-emerald-600" />;
		case "telegram":
			return <TelegramIcon className="w-5 h-5 text-sky-500" />;
		case "instagram":
			return <InstagramIcon className="w-5 h-5 text-pink-600" />;
		default:
			return <ContactIcon className="w-5 h-5 text-slate-700" />;
	}
}

function isValidContactUrl(url?: string): boolean {
	if (!url) return false;
	const trimmed = url.trim();
	return trimmed.length > 0 && trimmed !== "#";
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
				<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100/70 text-violet-700 border border-violet-200/60 mb-2">
					<ContactIcon className="w-3.5 h-3.5" />
					<h2 id="contact-heading">{config.title[lang]}</h2>
				</div>
				{config.description && config.description[lang]?.trim() && (
					<p className="text-xs sm:text-sm text-slate-500 max-w-md">
						{config.description[lang]}
					</p>
				)}
			</div>

			{activeMethods.length > 0 ? (
				/* Contact Methods Grid */
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
					{activeMethods.map((method) => {
						const isEmail = method.url.startsWith("mailto:");

						return (
							<a
								key={method.id}
								href={method.url}
								target={isEmail ? undefined : "_blank"}
								rel={isEmail ? undefined : "noopener noreferrer"}
								className="glass-liquid-card rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 text-left"
							>
								<div className="flex items-center gap-3.5 min-w-0 flex-1">
									<div className="w-11 h-11 rounded-xl bg-white/80 border border-white/90 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
										{getContactPlatformIcon(method.platform)}
									</div>
									<div className="min-w-0 flex-1">
										<h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-violet-700 transition-colors leading-snug">
											{method.label[lang]}
										</h3>
										<p className="text-xs text-slate-500 truncate mt-0.5">
											{method.value}
										</p>
									</div>
								</div>
								<div className="w-7 h-7 rounded-full bg-slate-100/70 flex items-center justify-center text-slate-400 group-hover:text-violet-600 group-hover:bg-violet-50 transition-colors shrink-0">
									<ExternalLinkIcon className="w-3.5 h-3.5" />
								</div>
							</a>
						);
					})}
				</div>
			) : (
				/* Professional Liquid Glass Empty State */
				<div className="glass-liquid-secondary rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center">
					<div className="w-12 h-12 rounded-full bg-emerald-100/80 border border-emerald-200/50 text-emerald-600 flex items-center justify-center mb-4 shadow-2xs">
						<ContactIcon className="w-6 h-6" />
					</div>
					<h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
						{lang === "id" ? "Kontak Belum Dikonfigurasi" : "No Contact Methods Configured Yet"}
					</h3>
					<p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
						{lang === "id"
							? "Saluran komunikasi langsung seperti WhatsApp, Telegram, atau Email akan muncul di sini setelah diatur pada file app/data/profile.ts."
							: "Direct communication channels like WhatsApp, Telegram, or Email will appear here once configured in app/data/profile.ts."}
					</p>
				</div>
			)}
		</section>
	);
}
