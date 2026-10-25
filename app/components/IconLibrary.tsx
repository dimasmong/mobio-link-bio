import React, { useState } from "react";

export type IconCategory =
	| "all"
	| "social"
	| "communication"
	| "media"
	| "entertainment"
	| "gaming"
	| "shopping"
	| "finance"
	| "productivity"
	| "technology"
	| "portfolio"
	| "general";

export interface PresetIconDefinition {
	id: string;
	name: { id: string; en: string };
	category: Exclude<IconCategory, "all">;
	keywords: string[];
	colorClass?: string;
	svg: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
}

export const ICON_CATEGORIES: { id: IconCategory; label: { id: string; en: string } }[] = [
	{ id: "all", label: { id: "Semua", en: "All" } },
	{ id: "social", label: { id: "Sosial", en: "Social" } },
	{ id: "communication", label: { id: "Komunikasi", en: "Communication" } },
	{ id: "media", label: { id: "Media & Audio", en: "Media & Audio" } },
	{ id: "entertainment", label: { id: "Hiburan", en: "Entertainment" } },
	{ id: "gaming", label: { id: "Gaming", en: "Gaming" } },
	{ id: "shopping", label: { id: "Belanja", en: "Shopping" } },
	{ id: "finance", label: { id: "Keuangan", en: "Finance" } },
	{ id: "productivity", label: { id: "Produktivitas", en: "Productivity" } },
	{ id: "technology", label: { id: "Teknologi", en: "Technology" } },
	{ id: "portfolio", label: { id: "Portofolio", en: "Portfolio" } },
	{ id: "general", label: { id: "Umum", en: "General" } },
];

export const PRESET_ICONS: PresetIconDefinition[] = [
	// =========================================================================
	// 1. SOCIAL
	// =========================================================================
	{
		id: "github",
		name: { id: "GitHub", en: "GitHub" },
		category: "social",
		keywords: ["github", "git", "code", "repo", "coding", "developer"],
		colorClass: "text-slate-800 dark:text-white",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
				<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
			</svg>
		),
	},
	{
		id: "linkedin",
		name: { id: "LinkedIn", en: "LinkedIn" },
		category: "social",
		keywords: ["linkedin", "job", "career", "professional", "network"],
		colorClass: "text-[#0a66c2]",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
				<path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 0 0 1.66-1.66 1.66 1.66 0 1 0-3.32 0c0 .92.74 1.66 1.66 1.66m1.39 9.74v-8.37H5.07v8.37h2.78Z" />
			</svg>
		),
	},
	{
		id: "twitter",
		name: { id: "Twitter / X", en: "Twitter / X" },
		category: "social",
		keywords: ["twitter", "x", "tweet", "social"],
		colorClass: "text-slate-900 dark:text-white",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
				<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
			</svg>
		),
	},
	{
		id: "instagram",
		name: { id: "Instagram", en: "Instagram" },
		category: "social",
		keywords: ["instagram", "ig", "photo", "reel", "story"],
		colorClass: "text-[#e4405f]",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
				<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
				<line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
			</svg>
		),
	},
	{
		id: "youtube",
		name: { id: "YouTube", en: "YouTube" },
		category: "social",
		keywords: ["youtube", "video", "channel", "stream", "yt"],
		colorClass: "text-[#ff0000]",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
				<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
			</svg>
		),
	},
	{
		id: "tiktok",
		name: { id: "TikTok", en: "TikTok" },
		category: "social",
		keywords: ["tiktok", "tt", "short", "video"],
		colorClass: "text-slate-900 dark:text-white",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
				<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
			</svg>
		),
	},
	{
		id: "facebook",
		name: { id: "Facebook", en: "Facebook" },
		category: "social",
		keywords: ["facebook", "fb", "meta", "social"],
		colorClass: "text-[#1877f2]",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
				<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
			</svg>
		),
	},
	{
		id: "threads",
		name: { id: "Threads", en: "Threads" },
		category: "social",
		keywords: ["threads", "meta", "instagram", "text"],
		colorClass: "text-slate-900 dark:text-white",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
				<path d="M12.001 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm4.819 12.684c-.452 2.228-2.28 3.516-4.697 3.516-2.909 0-5.068-2.036-5.068-5.352 0-3.374 2.23-5.374 5.257-5.374 2.871 0 4.887 1.849 4.887 4.508 0 1.956-1.127 3.195-2.784 3.195-.826 0-1.489-.413-1.696-1.071h-.056c-.395.733-1.184 1.109-2.144 1.109-1.298 0-2.294-.883-2.294-2.313 0-1.842 1.542-2.744 3.967-2.744.376 0 .809.019 1.166.075v-.432c0-1.373-.827-2.181-2.275-2.181-1.034 0-1.88.432-2.125 1.09h-1.636c.282-1.504 1.767-2.463 3.817-2.463 2.501 0 4.02 1.391 4.02 3.704v4.474c0 .489.151.752.489.752.282 0 .546-.15.714-.413l.997 1.077c-.451.62-1.166 1.015-1.998 1.015-.752 0-1.373-.413-1.565-1.075h-.057c-.244.47-.639.808-1.128 1.015z" />
			</svg>
		),
	},
	{
		id: "bluesky",
		name: { id: "Bluesky", en: "Bluesky" },
		category: "social",
		keywords: ["bluesky", "bsky", "social"],
		colorClass: "text-[#0085ff]",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
				<path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 7.44-1.258 7.823-2.316.383 1.058 2.81 7.506 7.823 2.316 4.557-5.073 1.082-6.498-2.83-7.078-.139-.016-.277-.034-.415-.056.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.479 0-.689-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
			</svg>
		),
	},
	{
		id: "reddit",
		name: { id: "Reddit", en: "Reddit" },
		category: "social",
		keywords: ["reddit", "community", "forum"],
		colorClass: "text-[#ff4500]",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
				<path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.56 12 8 12.56 8 13.25c0 .688.56 1.25 1.25 1.25.688 0 1.249-.562 1.249-1.25 0-.69-.56-1.25-1.249-1.25zm5.5 0c-.687 0-1.248.56-1.248 1.25 0 .688.561 1.25 1.249 1.25.688 0 1.249-.562 1.249-1.25 0-.69-.56-1.25-1.249-1.25zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
			</svg>
		),
	},
	{
		id: "twitch",
		name: { id: "Twitch", en: "Twitch" },
		category: "social",
		keywords: ["twitch", "stream", "live", "gaming"],
		colorClass: "text-[#9146ff]",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
				<path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
			</svg>
		),
	},
	{
		id: "pinterest",
		name: { id: "Pinterest", en: "Pinterest" },
		category: "social",
		keywords: ["pinterest", "pin", "board", "design"],
		colorClass: "text-[#e60023]",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
				<path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
			</svg>
		),
	},

	// =========================================================================
	// 2. COMMUNICATION
	// =========================================================================
	{
		id: "email",
		name: { id: "Email", en: "Email" },
		category: "communication",
		keywords: ["email", "mail", "inbox", "contact", "surat"],
		colorClass: "text-violet-600",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<rect width="20" height="16" x="2" y="4" rx="2" />
				<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
			</svg>
		),
	},
	{
		id: "whatsapp",
		name: { id: "WhatsApp", en: "WhatsApp" },
		category: "communication",
		keywords: ["whatsapp", "wa", "chat", "message", "pesan"],
		colorClass: "text-[#25d366]",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
			</svg>
		),
	},
	{
		id: "telegram",
		name: { id: "Telegram", en: "Telegram" },
		category: "communication",
		keywords: ["telegram", "tg", "chat", "bot"],
		colorClass: "text-[#229ed9]",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="m22 2-7 20-4-9-9-4Z" />
				<path d="M22 2 11 13" />
			</svg>
		),
	},
	{
		id: "discord",
		name: { id: "Discord", en: "Discord" },
		category: "communication",
		keywords: ["discord", "community", "chat", "voice", "server"],
		colorClass: "text-[#5865f2]",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
				<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
			</svg>
		),
	},
	{
		id: "message",
		name: { id: "Pesan / Chat", en: "Message / Chat" },
		category: "communication",
		keywords: ["message", "chat", "sms", "pesan"],
		colorClass: "text-violet-600",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
			</svg>
		),
	},
	{
		id: "phone",
		name: { id: "Telepon", en: "Phone" },
		category: "communication",
		keywords: ["phone", "call", "telepon", "kontak"],
		colorClass: "text-emerald-600",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
			</svg>
		),
	},
	{
		id: "slack",
		name: { id: "Slack", en: "Slack" },
		category: "communication",
		keywords: ["slack", "workplace", "team", "channel"],
		colorClass: "text-[#4a154b]",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
				<path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
			</svg>
		),
	},

	// =========================================================================
	// 3. MEDIA & AUDIO
	// =========================================================================
	{
		id: "music",
		name: { id: "Musik", en: "Music" },
		category: "media",
		keywords: ["music", "song", "audio", "spotify", "lagu"],
		colorClass: "text-emerald-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M9 18V5l12-2v13" />
				<circle cx="6" cy="18" r="3" />
				<circle cx="18" cy="16" r="3" />
			</svg>
		),
	},
	{
		id: "headphones",
		name: { id: "Headphones", en: "Headphones" },
		category: "media",
		keywords: ["headphones", "audio", "listen", "podcast"],
		colorClass: "text-violet-600",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
			</svg>
		),
	},
	{
		id: "mic",
		name: { id: "Mikrofon", en: "Microphone" },
		category: "media",
		keywords: ["mic", "microphone", "podcast", "voice", "audio"],
		colorClass: "text-rose-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
				<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
				<line x1="12" x2="12" y1="19" y2="22" />
			</svg>
		),
	},
	{
		id: "film",
		name: { id: "Film / Sinema", en: "Film / Cinema" },
		category: "media",
		keywords: ["film", "movie", "video", "cinema", "bioskop"],
		colorClass: "text-amber-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18" />
				<line x1="7" x2="7" y1="2" y2="22" />
				<line x1="17" x2="17" y1="2" y2="22" />
				<line x1="2" x2="22" y1="12" y2="12" />
				<line x1="2" x2="7" y1="7" y2="7" />
				<line x1="2" x2="7" y1="17" y2="17" />
				<line x1="17" x2="22" y1="17" y2="17" />
				<line x1="17" x2="22" y1="7" y2="7" />
			</svg>
		),
	},
	{
		id: "camera",
		name: { id: "Kamera", en: "Camera" },
		category: "media",
		keywords: ["camera", "photo", "foto", "photography"],
		colorClass: "text-cyan-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
				<circle cx="12" cy="13" r="3" />
			</svg>
		),
	},
	{
		id: "image",
		name: { id: "Gambar", en: "Image" },
		category: "media",
		keywords: ["image", "picture", "photo", "gallery"],
		colorClass: "text-blue-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
				<circle cx="9" cy="9" r="2" />
				<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
			</svg>
		),
	},

	// =========================================================================
	// 4. ENTERTAINMENT
	// =========================================================================
	{
		id: "sparkles",
		name: { id: "Sparkles", en: "Sparkles" },
		category: "entertainment",
		keywords: ["sparkles", "magic", "stars", "featured", "spesial"],
		colorClass: "text-amber-400",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
			</svg>
		),
	},
	{
		id: "flame",
		name: { id: "Api / Populer", en: "Fire / Trending" },
		category: "entertainment",
		keywords: ["flame", "fire", "hot", "trending", "populer"],
		colorClass: "text-orange-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" />
			</svg>
		),
	},
	{
		id: "heart",
		name: { id: "Hati / Suka", en: "Heart / Love" },
		category: "entertainment",
		keywords: ["heart", "love", "favorite", "suka"],
		colorClass: "text-rose-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
			</svg>
		),
	},
	{
		id: "star",
		name: { id: "Bintang", en: "Star" },
		category: "entertainment",
		keywords: ["star", "favorite", "bintang", "review"],
		colorClass: "text-yellow-400",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
			</svg>
		),
	},
	{
		id: "trophy",
		name: { id: "Piala / Prestasi", en: "Trophy / Winner" },
		category: "entertainment",
		keywords: ["trophy", "winner", "award", "piala", "juara"],
		colorClass: "text-amber-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
				<path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
				<path d="M4 22h16" />
				<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
				<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
				<path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
			</svg>
		),
	},

	// =========================================================================
	// 5. GAMING
	// =========================================================================
	{
		id: "gamepad",
		name: { id: "Gamepad", en: "Gamepad" },
		category: "gaming",
		keywords: ["gamepad", "gaming", "playstation", "xbox", "game"],
		colorClass: "text-indigo-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<line x1="6" x2="10" y1="12" y2="12" />
				<line x1="8" x2="8" y1="10" y2="14" />
				<line x1="15" x2="15.01" y1="13" y2="13" />
				<line x1="18" x2="18.01" y1="11" y2="11" />
				<rect width="20" height="12" x="2" y="6" rx="6" />
			</svg>
		),
	},
	{
		id: "sword",
		name: { id: "Pedang / RPG", en: "Sword / RPG" },
		category: "gaming",
		keywords: ["sword", "rpg", "battle", "game"],
		colorClass: "text-rose-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
				<line x1="13" x2="19" y1="19" y2="13" />
				<line x1="16" x2="20" y1="16" y2="20" />
				<line x1="19" x2="21" y1="21" y2="19" />
			</svg>
		),
	},
	{
		id: "dice",
		name: { id: "Dadu / Board Game", en: "Dice / Board Game" },
		category: "gaming",
		keywords: ["dice", "boardgame", "luck", "dadu"],
		colorClass: "text-purple-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
				<circle cx="8" cy="8" r="1.5" fill="currentColor" />
				<circle cx="16" cy="16" r="1.5" fill="currentColor" />
				<circle cx="12" cy="12" r="1.5" fill="currentColor" />
			</svg>
		),
	},

	// =========================================================================
	// 6. SHOPPING
	// =========================================================================
	{
		id: "shopping-bag",
		name: { id: "Tas Belanja", en: "Shopping Bag" },
		category: "shopping",
		keywords: ["shopping", "bag", "store", "shop", "belanja", "toko"],
		colorClass: "text-emerald-600",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
				<path d="M3 6h18" />
				<path d="M16 10a4 4 0 0 1-8 0" />
			</svg>
		),
	},
	{
		id: "shopping-cart",
		name: { id: "Keranjang Belanja", en: "Shopping Cart" },
		category: "shopping",
		keywords: ["cart", "ecommerce", "trolley", "keranjang"],
		colorClass: "text-cyan-600",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<circle cx="8" cy="21" r="1" />
				<circle cx="19" cy="21" r="1" />
				<path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
			</svg>
		),
	},
	{
		id: "tag",
		name: { id: "Label / Diskon", en: "Tag / Discount" },
		category: "shopping",
		keywords: ["tag", "price", "discount", "promo", "diskon"],
		colorClass: "text-rose-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
				<circle cx="7" cy="7" r=".5" fill="currentColor" />
			</svg>
		),
	},
	{
		id: "gift",
		name: { id: "Hadiah / Gift", en: "Gift Box" },
		category: "shopping",
		keywords: ["gift", "present", "box", "hadiah"],
		colorClass: "text-pink-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<polyline points="20 12 20 22 4 22 4 12" />
				<rect width="20" height="5" x="2" y="7" />
				<line x1="12" x2="12" y1="22" y2="7" />
				<path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
				<path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
			</svg>
		),
	},

	// =========================================================================
	// 7. FINANCE
	// =========================================================================
	{
		id: "wallet",
		name: { id: "Dompet / Wallet", en: "Wallet" },
		category: "finance",
		keywords: ["wallet", "money", "pay", "dompet", "saldo"],
		colorClass: "text-emerald-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
				<path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
			</svg>
		),
	},
	{
		id: "credit-card",
		name: { id: "Kartu Kredit", en: "Credit Card" },
		category: "finance",
		keywords: ["card", "credit", "debit", "payment", "kartu"],
		colorClass: "text-blue-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<rect width="20" height="14" x="2" y="5" rx="2" />
				<line x1="2" x2="22" y1="10" y2="10" />
			</svg>
		),
	},
	{
		id: "dollar-sign",
		name: { id: "Uang / Donasi", en: "Money / Donate" },
		category: "finance",
		keywords: ["money", "dollar", "donate", "uang", "tip"],
		colorClass: "text-emerald-600",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<line x1="12" x2="12" y1="2" y2="22" />
				<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
			</svg>
		),
	},
	{
		id: "trending-up",
		name: { id: "Investasi / Pertumbuhan", en: "Growth / Analytics" },
		category: "finance",
		keywords: ["trending", "stock", "growth", "investasi", "saham"],
		colorClass: "text-green-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
				<polyline points="16 7 22 7 22 13" />
			</svg>
		),
	},

	// =========================================================================
	// 8. PRODUCTIVITY
	// =========================================================================
	{
		id: "calendar",
		name: { id: "Kalender / Jadwal", en: "Calendar / Schedule" },
		category: "productivity",
		keywords: ["calendar", "schedule", "event", "meeting", "janji"],
		colorClass: "text-sky-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
				<line x1="16" x2="16" y1="2" y2="6" />
				<line x1="8" x2="8" y1="2" y2="6" />
				<line x1="3" x2="21" y1="10" y2="10" />
			</svg>
		),
	},
	{
		id: "check-circle",
		name: { id: "Tugas / Selesai", en: "Task / Completed" },
		category: "productivity",
		keywords: ["task", "todo", "done", "check", "selesai"],
		colorClass: "text-emerald-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
				<polyline points="22 4 12 14.01 9 11.01" />
			</svg>
		),
	},
	{
		id: "book",
		name: { id: "Buku / Bacaan", en: "Book / Reading" },
		category: "productivity",
		keywords: ["book", "reading", "study", "belajar", "buku"],
		colorClass: "text-amber-600",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
				<path d="M6 6h10" />
				<path d="M6 10h10" />
			</svg>
		),
	},
	{
		id: "file-text",
		name: { id: "Dokumen / Artikel", en: "Document / Article" },
		category: "productivity",
		keywords: ["document", "article", "paper", "pdf", "tulisan"],
		colorClass: "text-slate-600 dark:text-slate-300",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
				<polyline points="14 2 14 8 20 8" />
				<line x1="16" x2="8" y1="13" y2="13" />
				<line x1="16" x2="8" y1="17" y2="17" />
				<polyline points="10 9 9 9 8 9" />
			</svg>
		),
	},
	{
		id: "map-pin",
		name: { id: "Lokasi / Peta", en: "Location / Map" },
		category: "productivity",
		keywords: ["location", "map", "place", "lokasi", "alamat"],
		colorClass: "text-rose-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
				<circle cx="12" cy="10" r="3" />
			</svg>
		),
	},

	// =========================================================================
	// 9. TECHNOLOGY
	// =========================================================================
	{
		id: "code",
		name: { id: "Kode / Pemrograman", en: "Code / Programming" },
		category: "technology",
		keywords: ["code", "developer", "coding", "html", "software"],
		colorClass: "text-violet-600",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<polyline points="16 18 22 12 16 6" />
				<polyline points="8 6 2 12 8 18" />
			</svg>
		),
	},
	{
		id: "terminal",
		name: { id: "Terminal / CLI", en: "Terminal / CLI" },
		category: "technology",
		keywords: ["terminal", "console", "cli", "command", "bash"],
		colorClass: "text-emerald-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<polyline points="4 17 10 11 4 5" />
				<line x1="12" x2="20" y1="19" y2="19" />
			</svg>
		),
	},
	{
		id: "database",
		name: { id: "Basis Data / SQL", en: "Database / SQL" },
		category: "technology",
		keywords: ["database", "sql", "data", "storage", "server"],
		colorClass: "text-cyan-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<ellipse cx="12" cy="5" rx="9" ry="3" />
				<path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
				<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
			</svg>
		),
	},
	{
		id: "server",
		name: { id: "Server / Cloud", en: "Server / Cloud" },
		category: "technology",
		keywords: ["server", "backend", "cloud", "infra"],
		colorClass: "text-indigo-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
				<rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
				<line x1="6" x2="6.01" y1="6" y2="6" />
				<line x1="6" x2="6.01" y1="18" y2="18" />
			</svg>
		),
	},
	{
		id: "globe",
		name: { id: "Website / Web", en: "Website / Web" },
		category: "technology",
		keywords: ["globe", "web", "internet", "website", "situs", "url"],
		colorClass: "text-slate-700 dark:text-slate-200",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<circle cx="12" cy="12" r="10" />
				<line x1="2" x2="22" y1="12" y2="12" />
				<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
			</svg>
		),
	},
	{
		id: "shield",
		name: { id: "Keamanan / Privasi", en: "Security / Privacy" },
		category: "technology",
		keywords: ["shield", "security", "protect", "aman"],
		colorClass: "text-emerald-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
			</svg>
		),
	},

	// =========================================================================
	// 10. PORTFOLIO & WORK
	// =========================================================================
	{
		id: "briefcase",
		name: { id: "Portofolio / Karir", en: "Portfolio / Work" },
		category: "portfolio",
		keywords: ["briefcase", "job", "work", "career", "portofolio"],
		colorClass: "text-amber-600",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
				<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
			</svg>
		),
	},
	{
		id: "palette",
		name: { id: "Desain / Kreatif", en: "Design / Creative" },
		category: "portfolio",
		keywords: ["palette", "design", "art", "creative", "desain"],
		colorClass: "text-purple-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
				<circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
				<circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
				<circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
				<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
			</svg>
		),
	},
	{
		id: "external-link",
		name: { id: "Tautan Eksternal", en: "External Link" },
		category: "portfolio",
		keywords: ["link", "external", "out", "tautan"],
		colorClass: "text-slate-600 dark:text-slate-300",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M15 3h6v6" />
				<path d="M10 14 21 3" />
				<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
			</svg>
		),
	},
	{
		id: "user",
		name: { id: "Tentang Saya", en: "About Me" },
		category: "portfolio",
		keywords: ["user", "profile", "about", "bio", "profil"],
		colorClass: "text-violet-600",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
				<circle cx="12" cy="7" r="4" />
			</svg>
		),
	},

	// =========================================================================
	// 11. GENERAL
	// =========================================================================
	{
		id: "coffee",
		name: { id: "Kopi / Donasi", en: "Coffee / Buy Me" },
		category: "general",
		keywords: ["coffee", "tip", "kopi", "cafe", "bantu"],
		colorClass: "text-amber-700",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<path d="M17 8h1a4 4 0 1 1 0 8h-1" />
				<path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
				<line x1="6" x2="6" y1="2" y2="4" />
				<line x1="10" x2="10" y1="2" y2="4" />
				<line x1="14" x2="14" y1="2" y2="4" />
			</svg>
		),
	},
	{
		id: "zap",
		name: { id: "Petir / Cepat", en: "Lightning / Fast" },
		category: "general",
		keywords: ["zap", "lightning", "energy", "petir", "power"],
		colorClass: "text-amber-400",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
			</svg>
		),
	},
	{
		id: "compass",
		name: { id: "Kompas / Eksplorasi", en: "Compass / Explore" },
		category: "general",
		keywords: ["compass", "explore", "navigasi", "arah"],
		colorClass: "text-sky-500",
		svg: (props) => (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
				<circle cx="12" cy="12" r="10" />
				<polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
			</svg>
		),
	},
];

/**
 * Returns recommended icon ID based on platform string.
 */
export function getRecommendedIcon(platform: string): string {
	const p = (platform || "").toLowerCase().trim();
	switch (p) {
		case "github":
			return "github";
		case "linkedin":
			return "linkedin";
		case "twitter":
		case "x":
			return "twitter";
		case "instagram":
			return "instagram";
		case "youtube":
			return "youtube";
		case "tiktok":
			return "tiktok";
		case "discord":
			return "discord";
		case "facebook":
			return "facebook";
		case "threads":
			return "threads";
		case "bluesky":
		case "bsky":
			return "bluesky";
		case "reddit":
			return "reddit";
		case "twitch":
			return "twitch";
		case "pinterest":
			return "pinterest";
		case "whatsapp":
			return "whatsapp";
		case "telegram":
			return "telegram";
		case "email":
			return "email";
		case "phone":
			return "phone";
		case "spotify":
		case "music":
			return "music";
		case "podcast":
			return "mic";
		case "gaming":
			return "gamepad";
		case "shop":
		case "store":
			return "shopping-bag";
		case "donate":
		case "tip":
			return "coffee";
		case "portfolio":
			return "briefcase";
		case "code":
		case "dev":
			return "code";
		default:
			return "globe";
	}
}

/**
 * Finds preset icon by ID, or falls back to globe.
 */
export function getPresetIcon(id?: string): PresetIconDefinition {
	if (!id) return PRESET_ICONS.find((i) => i.id === "globe") || PRESET_ICONS[0];
	const found = PRESET_ICONS.find((i) => i.id.toLowerCase() === id.toLowerCase());
	if (found) return found;
	// Also check aliases
	if (id === "x") return PRESET_ICONS.find((i) => i.id === "twitter") || PRESET_ICONS[0];
	if (id === "message-square" || id === "chat") return PRESET_ICONS.find((i) => i.id === "message") || PRESET_ICONS[0];
	return PRESET_ICONS.find((i) => i.id === "globe") || PRESET_ICONS[0];
}

/**
 * Universal Link Icon Renderer Component.
 * Supports:
 * 1. Uploaded Custom Icons (stored in R2 via Media Management, preview or public URL).
 * 2. External HTTPS Icon URLs (directly rendered in browser with fallback on load error).
 * 3. Expanded Built-in Preset Icons (SVG with platform color styling).
 */
export interface LinkIconRendererProps {
	link: {
		platform?: string;
		icon?: string;
		icon_type?: "preset" | "upload" | "url" | string;
		icon_url?: string;
		icon_media_id?: string;
		title?: unknown;
	};
	isStudioPreview?: boolean;
	className?: string;
}

export function LinkIconRenderer({
	link,
	isStudioPreview = false,
	className = "w-5 h-5",
}: LinkIconRendererProps) {
	const [hasLoadError, setHasLoadError] = useState(false);

	const iconType = link.icon_type || "preset";
	const presetFallback = getPresetIcon(link.icon || getRecommendedIcon(link.platform || ""));

	// 1. Uploaded Custom Icon from R2
	if (iconType === "upload" && link.icon_media_id && !hasLoadError) {
		const src = isStudioPreview
			? `/api/studio/media/${link.icon_media_id}/preview`
			: `/api/public/media/${link.icon_media_id}`;

		return (
			<img
				src={src}
				alt=""
				loading="lazy"
				className={`${className} object-contain rounded-sm select-none pointer-events-none`}
				onError={() => setHasLoadError(true)}
			/>
		);
	}

	// 2. External HTTPS Icon Image URL
	if (iconType === "url" && link.icon_url && !hasLoadError) {
		return (
			<img
				src={link.icon_url}
				alt=""
				loading="lazy"
				referrerPolicy="no-referrer"
				className={`${className} object-contain rounded-sm select-none pointer-events-none`}
				onError={() => setHasLoadError(true)}
			/>
		);
	}

	// 3. Preset Built-in SVG Icon (or fallback if image fails)
	const SvgComponent = presetFallback.svg;
	return <SvgComponent className={`${className} ${presetFallback.colorClass || "text-slate-800"}`} />;
}
