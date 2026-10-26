import React, { useState, useEffect, useCallback } from "react";
import type { Route } from "./+types/studio";
import { authenticateAdmin } from "../lib/auth.server";
import {
	getDatabaseStatus,
	getProfileRecord,
	getLinks,
	getContactMethods,
	getExploreItems,
	getExploreCategories,
	getExploreSubcategories,
	getAppearanceRecord,
	getPublishMetadata,
	type DatabaseStatus,
	type ProfileRecord,
	type LinkRecord,
	type ContactMethodRecord,
	type ExploreItemRecord,
	type ExploreCategoryRecord,
	type ExploreSubcategoryRecord,
	type ExploreBlockType,
	type AppearanceRecord,
	type PublishMetadataRecord,
} from "../lib/db.server";
import type { MediaAssetRecord } from "../lib/media.server";
import { getStudioAnalyticsSummary, type StudioAnalyticsSummary, type ClickAnalyticsSummary } from "../lib/analytics.server";
import { IconPicker } from "../components/IconPicker";
import { LinkIconRenderer, getRecommendedIcon } from "../components/IconLibrary";
import {
	THEME_PRESETS,
	ACCENT_PRESETS,
	getThemePreset,
	computeThemeVariables,
	getContrastForeground,
	type ThemePreset,
	type AccentColorPreset,
} from "../lib/theme";
import { LAYOUT_THEMES } from "../lib/layouts";
import { PROFILE_CARD_STYLES, CARD_SIZES, type CardSize } from "../lib/profileCard";
import { FONT_PRESETS, FONT_CATEGORIES } from "../lib/typography";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "MOBIO Studio — Self-Hosted Administration" },
		{ name: "robots", content: "noindex, nofollow" },
		{ name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
	];
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare?.env;

	// Check authentication server-side
	const auth = await authenticateAdmin(request, env);

	if (!auth.isAuthenticated || !auth.user) {
		return {
			isAuthenticated: false,
			user: null,
			error: auth.error || "Autentikasi Cloudflare Access diperlukan untuk mengakses Studio.",
			reason: auth.reason,
			database: null as DatabaseStatus | null,
			draftProfile: null as ProfileRecord | null,
			draftLinks: [] as LinkRecord[],
			draftContacts: [] as ContactMethodRecord[],
			draftAppearance: null as AppearanceRecord | null,
			draftExplore: [] as ExploreItemRecord[],
			draftCategories: [] as ExploreCategoryRecord[],
			draftSubcategories: [] as ExploreSubcategoryRecord[],
			publishMetadata: null as PublishMetadataRecord | null,
			initialAnalytics: null as StudioAnalyticsSummary | null,
			envMode: import.meta.env.MODE,
		};
	}

	const [dbStatus, draftProfile, draftLinks, draftContacts, draftExplore, draftAppearance, publishMetadata, initialAnalytics, draftCategories, draftSubcategories] = await Promise.all([
		getDatabaseStatus(env?.DB),
		env?.DB ? getProfileRecord(env.DB, "draft") : null,
		env?.DB ? getLinks(env.DB, "draft") : [],
		env?.DB ? getContactMethods(env.DB, "draft") : [],
		env?.DB ? getExploreItems(env.DB, "draft") : [],
		env?.DB ? getAppearanceRecord(env.DB, "draft") : null,
		env?.DB ? getPublishMetadata(env.DB) : null,
		env?.DB ? getStudioAnalyticsSummary(env.DB, "7d") : null,
		env?.DB ? getExploreCategories(env.DB, "draft") : [],
		env?.DB ? getExploreSubcategories(env.DB, "draft") : [],
	]);

	return {
		isAuthenticated: true,
		user: auth.user,
		error: null,
		reason: auth.reason,
		database: dbStatus,
		draftProfile,
		draftLinks,
		draftContacts,
		draftExplore,
		draftCategories,
		draftSubcategories,
		draftAppearance,
		publishMetadata,
		initialAnalytics,
		envMode: import.meta.env.MODE,
	};
}

type StudioSection =
	| "overview"
	| "profile"
	| "links"
	| "contact"
	| "clicks"
	| "explore"
	| "appearance"
	| "settings";

interface NavTab {
	id: StudioSection;
	label: string;
	badge?: string;
	badgeColor?: string;
}

const navTabs: NavTab[] = [
	{ id: "overview", label: "Overview" },
	{ id: "profile", label: "Profile", badge: "Editor", badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-800" },
	{ id: "links", label: "Links", badge: "Editor", badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-800" },
	{ id: "contact", label: "Contact", badge: "Editor", badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-800" },
	{ id: "appearance", label: "Appearance", badge: "Editor", badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-800" },
	{ id: "explore", label: "Explore", badge: "Editor", badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-800" },
	{ id: "clicks", label: "Click Monitor", badge: "Monitor", badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-800" },
	{ id: "settings", label: "Settings", badge: "System", badgeColor: "bg-slate-800 text-slate-300 border-slate-700" },
];

const defaultAppearanceFallback: AppearanceRecord = {
	id: "draft",
	palette: "frost-aurora",
	glass_intensity: "medium",
	background_type: "gradient",
	background_src: "",
	background_poster: "",
	background_animation: 1,
	background_overlay_opacity: 0.45,
	cover_enabled: 0,
	cover_url: "",
	cover_aspect_ratio: "16:9",
	accent_color: "#8b5cf6",
	background_position_x: 50.0,
	background_position_y: 50.0,
	background_scale: 1.0,
	background_overlay_color: "rgba(248, 250, 252, 0.45)",
	background_brightness: 1.0,
	glass_blur: "16px",
	glass_opacity: 0.70,
	glass_tint: "rgba(255, 255, 255, 0.65)",
	glass_border_opacity: 0.30,
	glass_highlight_intensity: 0.40,
	glass_shadow_intensity: 0.15,
	glass_radius: "1.5rem",
	background_media_id: "",
	background_poster_media_id: "",
	cover_media_id: "",
	layout_theme_id: "compact-center",
	profile_card_style_id: "immersive-fade",
	profile_card_size: "medium",
	font_family_id: "inter",
	created_at: "",
	updated_at: "",
};

export default function Studio({ loaderData }: Route.ComponentProps) {
	const [activeSection, setActiveSection] = useState<StudioSection>("overview");

	// Initial data states
	const [profile, setProfile] = useState<ProfileRecord>(() => {
		if (loaderData.draftProfile) return loaderData.draftProfile;
		return {
			id: "draft",
			name: "Your Name",
			handle: "@username",
			avatar_url: "",
			location_id: "",
			location_en: "",
			bio_id: "",
			bio_en: "",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};
	});

	const [links, setLinks] = useState<LinkRecord[]>(loaderData.draftLinks || []);
	const [contacts, setContacts] = useState<ContactMethodRecord[]>(loaderData.draftContacts || []);
	const [pubMeta, setPubMeta] = useState<PublishMetadataRecord | null>(loaderData.publishMetadata || null);

	// Notification toast
	const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
	const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
		setToast({ message, type });
		setTimeout(() => setToast(null), 4500);
	}, []);

	// Busy states
	const [isSavingProfile, setIsSavingProfile] = useState(false);
	const [isPublishing, setIsPublishing] = useState(false);
	const [isDiscarding, setIsDiscarding] = useState(false);

	// Modals
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const [previewLang, setPreviewLang] = useState<"id" | "en">("id");
	const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
	const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
	const [presetFilter, setPresetFilter] = useState<"all" | "light" | "dark">("all");
	const [appearanceSubTab, setAppearanceSubTab] = useState<"themes" | "layouts" | "card" | "typography" | "media" | "glass">("themes");
	const [fontSearch, setFontSearch] = useState("");
	const [fontCategoryFilter, setFontCategoryFilter] = useState<string>("all");

	// Links modals & state
	const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
	const [isEditLinkOpen, setIsEditLinkOpen] = useState(false);
	const [editingLink, setEditingLink] = useState<LinkRecord | null>(null);
	const [isDeleteLinkOpen, setIsDeleteLinkOpen] = useState(false);
	const [deletingLink, setDeletingLink] = useState<LinkRecord | null>(null);
	const [linkForm, setLinkForm] = useState<{
		title_id: string;
		title_en: string;
		description_id: string;
		description_en: string;
		url: string;
		platform: string;
		icon: string;
		icon_type: "preset" | "upload" | "url";
		icon_url: string;
		icon_media_id: string;
		is_enabled: boolean;
	}>({
		title_id: "",
		title_en: "",
		description_id: "",
		description_en: "",
		url: "https://",
		platform: "website",
		icon: "globe",
		icon_type: "preset",
		icon_url: "",
		icon_media_id: "",
		is_enabled: true,
	});

	// Contact modals & state
	const [isAddContactOpen, setIsAddContactOpen] = useState(false);
	const [isEditContactOpen, setIsEditContactOpen] = useState(false);
	const [editingContact, setEditingContact] = useState<ContactMethodRecord | null>(null);
	const [isDeleteContactOpen, setIsDeleteContactOpen] = useState(false);
	const [deletingContact, setDeletingContact] = useState<ContactMethodRecord | null>(null);
	const [contactForm, setContactForm] = useState({
		platform: "whatsapp",
		label_id: "",
		label_en: "",
		value: "",
		url: "",
		is_enabled: true,
	});

	// Appearance state (Phase 3)
	const [appearance, setAppearance] = useState<AppearanceRecord>(() => {
		if (loaderData.draftAppearance) return loaderData.draftAppearance;
		return defaultAppearanceFallback;
	});
	const [isSavingAppearance, setIsSavingAppearance] = useState(false);
	const [isResetAppearanceOpen, setIsResetAppearanceOpen] = useState(false);

	// Media Library Modal state (Cloudflare R2 + D1 Registry)
	const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
	const [mediaTarget, setMediaTarget] = useState<"avatar" | "cover" | "background" | "background_poster" | "explore_cover" | "gallery_photo" | null>(null);
	const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>("all");
	const [mediaList, setMediaList] = useState<MediaAssetRecord[]>([]);
	const [isLoadingMedia, setIsLoadingMedia] = useState(false);
	const [isUploadingMedia, setIsUploadingMedia] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);

	// Explore items & Categories state (Single-Tier Customizable Main Categories)
	const [exploreItems, setExploreItems] = useState<ExploreItemRecord[]>(loaderData.draftExplore || []);
	const [categories, setCategories] = useState<ExploreCategoryRecord[]>(loaderData.draftCategories || []);
	const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<ExploreCategoryRecord | null>(null);
	const [categoryForm, setCategoryForm] = useState({
		id: "",
		name_id: "",
		name_en: "",
		icon: "folder",
		color: "#8b5cf6",
		is_enabled: true,
	});
	const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
	const [subcategories, setSubcategories] = useState<ExploreSubcategoryRecord[]>(loaderData.draftSubcategories || []);
	const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
	const [editingSubcat, setEditingSubcat] = useState<ExploreSubcategoryRecord | null>(null);
	const [subcatForm, setSubcatForm] = useState({ category: "work", label_id: "", label_en: "", color: "#8b5cf6" });
	const [isSubmittingSubcat, setIsSubmittingSubcat] = useState(false);

	const [exploreFilterType, setExploreFilterType] = useState<string>("all");
	const [exploreSearchQuery, setExploreSearchQuery] = useState("");
	const [isAddExploreOpen, setIsAddExploreOpen] = useState(false);
	const [isEditExploreOpen, setIsEditExploreOpen] = useState(false);
	const [editingExplore, setEditingExplore] = useState<ExploreItemRecord | null>(null);
	const [isDeleteExploreOpen, setIsDeleteExploreOpen] = useState(false);
	const [deletingExplore, setDeletingExplore] = useState<ExploreItemRecord | null>(null);
	const [isSubmittingExplore, setIsSubmittingExplore] = useState(false);
	const [exploreForm, setExploreForm] = useState({
		type: "project" as ExploreBlockType,
		category: "all",
		subcategory_id: "",
		title_id: "",
		title_en: "",
		subtitle_id: "",
		subtitle_en: "",
		description_id: "",
		description_en: "",
		url: "",
		cover_image: "",
		badge_id: "",
		badge_en: "",
		photos: [] as { url: string; caption?: string; id?: string }[],
		tags: "",
		year: "",
		rating: "",
		artist: "",
		is_enabled: true,
	});

	// Analytics state (Click Monitor & Website Visitor Telemetry)
	const [analyticsRange, setAnalyticsRange] = useState<"today" | "7d" | "30d" | "all">("7d");
	const [analyticsData, setAnalyticsData] = useState<StudioAnalyticsSummary | null>(loaderData.initialAnalytics || null);
	const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
	const [isResetAnalyticsOpen, setIsResetAnalyticsOpen] = useState(false);
	const [isResettingAnalytics, setIsResettingAnalytics] = useState(false);
	const [resetAnalyticsTarget, setResetAnalyticsTarget] = useState<"all" | "clicks" | "visitors">("all");

	const fetchAnalytics = async (range: "today" | "7d" | "30d" | "all") => {
		setAnalyticsRange(range);
		setIsLoadingAnalytics(true);
		try {
			const res = await fetch(`/api/studio/analytics?range=${range}`);
			if (!res.ok) throw new Error("Gagal memuat analitik");
			const data = (await res.json()) as { status: string; analytics: StudioAnalyticsSummary };
			setAnalyticsData(data.analytics);
		} catch (err) {
			console.error("fetchAnalytics error:", err);
			showToast("Gagal memuat data analitik.", "error");
		} finally {
			setIsLoadingAnalytics(false);
		}
	};

	// Auto refresh analytics when navigating to Click Monitor tab
	useEffect(() => {
		if (activeSection === "clicks") {
			fetchAnalytics(analyticsRange);
		}
	}, [activeSection]);

	const handleResetAnalytics = async () => {
		setIsResettingAnalytics(true);
		try {
			const res = await fetch(`/api/studio/analytics?target=${resetAnalyticsTarget}`, { method: "DELETE" });
			if (!res.ok) throw new Error("Gagal mereset analitik");
			await fetchAnalytics(analyticsRange);
			setIsResetAnalyticsOpen(false);
			showToast("Data analitik berhasil direset.", "success");
		} catch (err) {
			console.error("handleResetAnalytics error:", err);
			showToast("Gagal mereset data analitik.", "error");
		} finally {
			setIsResettingAnalytics(false);
		}
	};

	const copyToClipboard = async (text: string, label: string = "URL") => {
		try {
			if (typeof navigator !== "undefined" && navigator.clipboard) {
				await navigator.clipboard.writeText(text);
				showToast(`${label} berhasil disalin ke clipboard!`, "success");
			} else {
				showToast("Clipboard tidak didukung pada browser ini.", "error");
			}
		} catch {
			showToast("Gagal menyalin ke clipboard.", "error");
		}
	};

	// Sync initial section from URL query parameter e.g. /studio?tab=profile
	useEffect(() => {
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			const tab = params.get("tab") as StudioSection;
			if (tab && navTabs.some((t) => t.id === tab)) {
				setActiveSection(tab);
			}
		}
	}, []);

	const handleSelectSection = (section: StudioSection) => {
		setActiveSection(section);
		if (typeof window !== "undefined") {
			const url = new URL(window.location.href);
			url.searchParams.set("tab", section);
			window.history.replaceState(null, "", url.toString());
		}
	};

	// Mark unpublished changes active in local state
	const markUnpublished = useCallback(() => {
		setPubMeta((prev) => ({
			...(prev || {
				id: "current",
				version: 1,
				published_at: "",
				published_by: "system",
				notes: "",
				has_unpublished_changes: 1,
				draft_updated_at: new Date().toISOString(),
			}),
			has_unpublished_changes: 1,
			draft_updated_at: new Date().toISOString(),
		}));
	}, []);

	// =========================================================================
	// 1. ACCESS GATE (FAIL-CLOSED STATE) FOR UNAUTHENTICATED VISITORS
	// =========================================================================
	if (!loaderData.isAuthenticated || !loaderData.user) {
		return (
			<div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
				<div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center">
					<div
						className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-violet-600/20 blur-3xl pointer-events-none"
						aria-hidden="true"
					/>

					<div className="w-14 h-14 rounded-2xl bg-violet-950/80 border border-violet-800/50 text-violet-400 flex items-center justify-center mx-auto mb-4">
						<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
							<path d="M7 11V7a5 5 0 0 1 10 0v4" />
						</svg>
					</div>

					<h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
						MOBIO Studio — Akses Dibatasi
					</h1>

					<p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
						Halaman administrasi ini dilindungi oleh <strong>Cloudflare Access (Email OTP)</strong>.
						Hanya pemilik deployment dengan alamat email terverifikasi yang diizinkan mengakses.
					</p>

					<div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 mb-6 text-left">
						<div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
							Status Keamanan
						</div>
						<div className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
							<span className="w-2 h-2 rounded-full bg-rose-500" />
							<span>{loaderData.error || "Token Cloudflare Access tidak ditemukan."}</span>
						</div>
					</div>

					<a
						href="/"
						className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
					>
						<span>← Kembali ke Website Publik</span>
					</a>
				</div>
			</div>
		);
	}

	const { user, database } = loaderData;
	const isDbReady = database?.isReady ?? false;
	const hasUnpublished = Boolean(pubMeta?.has_unpublished_changes);

	// =========================================================================
	// HANDLERS: PROFILE
	// =========================================================================
	const handleSaveProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!profile.name.trim()) {
			showToast("Nama tampilan (Display name) wajib diisi.", "error");
			return;
		}
		if (!profile.handle.trim()) {
			showToast("Handle / username wajib diisi.", "error");
			return;
		}

		setIsSavingProfile(true);
		try {
			const res = await fetch("/api/studio/profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(profile),
			});
			const data = (await res.json()) as { error?: string; status?: string };
			if (!res.ok || data.error) {
				showToast(data.error || "Gagal menyimpan draft profil.", "error");
			} else {
				showToast("Draft profil berhasil disimpan ke D1!", "success");
				markUnpublished();
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Kesalahan jaringan.";
			showToast(`Gagal menyimpan: ${msg}`, "error");
		} finally {
			setIsSavingProfile(false);
		}
	};

	// =========================================================================
	// HANDLERS: LINKS
	// =========================================================================
	const handleOpenAddLink = () => {
		setLinkForm({
			title_id: "",
			title_en: "",
			description_id: "",
			description_en: "",
			url: "https://",
			platform: "website",
			icon: "globe",
			icon_type: "preset",
			icon_url: "",
			icon_media_id: "",
			is_enabled: true,
		});
		setIsAddLinkOpen(true);
	};

	const handleSaveNewLink = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const res = await fetch("/api/studio/links", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(linkForm),
			});
			const data = (await res.json()) as { error?: string; status?: string; link?: LinkRecord };
			if (!res.ok || data.error) {
				showToast(data.error || "Gagal menambahkan tautan.", "error");
			} else if (data.link) {
				setLinks((prev) => [...prev, data.link!]);
				setIsAddLinkOpen(false);
				showToast("Tautan baru berhasil ditambahkan ke draft!", "success");
				markUnpublished();
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Kesalahan jaringan.";
			showToast(msg, "error");
		}
	};

	const handleOpenEditLink = (l: LinkRecord) => {
		setEditingLink(l);
		setLinkForm({
			title_id: l.title_id,
			title_en: l.title_en,
			description_id: l.description_id || "",
			description_en: l.description_en || "",
			url: l.url,
			platform: l.platform,
			icon: l.icon || getRecommendedIcon(l.platform),
			icon_type: l.icon_type || "preset",
			icon_url: l.icon_url || "",
			icon_media_id: l.icon_media_id || "",
			is_enabled: Boolean(l.is_enabled),
		});
		setIsEditLinkOpen(true);
	};

	const handleSaveEditLink = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingLink) return;

		try {
			const res = await fetch("/api/studio/links", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: editingLink.id, ...linkForm }),
			});
			const data = (await res.json()) as { error?: string; status?: string };
			if (!res.ok || data.error) {
				showToast(data.error || "Gagal memperbarui tautan.", "error");
			} else {
				setLinks((prev) =>
					prev.map((item) =>
						item.id === editingLink.id
							? {
									...item,
									...linkForm,
									is_enabled: linkForm.is_enabled ? 1 : 0,
									updated_at: new Date().toISOString(),
							  }
							: item
					)
				);
				setIsEditLinkOpen(false);
				setEditingLink(null);
				showToast("Tautan berhasil diperbarui di draft!", "success");
				markUnpublished();
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Kesalahan jaringan.";
			showToast(msg, "error");
		}
	};

	const handleToggleLink = async (l: LinkRecord) => {
		const newEnabled = !l.is_enabled;
		try {
			const res = await fetch("/api/studio/links", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: l.id, is_enabled: newEnabled }),
			});
			const data = (await res.json()) as { error?: string; status?: string };
			if (!res.ok || data.error) {
				showToast(data.error || "Gagal mengubah status tautan.", "error");
			} else {
				setLinks((prev) =>
					prev.map((item) => (item.id === l.id ? { ...item, is_enabled: newEnabled ? 1 : 0 } : item))
				);
				markUnpublished();
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Kesalahan jaringan.";
			showToast(msg, "error");
		}
	};

	const handleConfirmDeleteLink = async () => {
		if (!deletingLink) return;
		try {
			const res = await fetch("/api/studio/links", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: deletingLink.id }),
			});
			const data = (await res.json()) as { error?: string; status?: string };
			if (!res.ok || data.error) {
				showToast(data.error || "Gagal menghapus tautan.", "error");
			} else {
				setLinks((prev) => prev.filter((item) => item.id !== deletingLink.id));
				setIsDeleteLinkOpen(false);
				setDeletingLink(null);
				showToast("Tautan berhasil dihapus dari draft.", "success");
				markUnpublished();
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Kesalahan jaringan.";
			showToast(msg, "error");
		}
	};

	const handleMoveLink = async (index: number, direction: "up" | "down") => {
		const targetIndex = direction === "up" ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= links.length) return;

		const reordered = [...links];
		const temp = reordered[index];
		reordered[index] = reordered[targetIndex];
		reordered[targetIndex] = temp;

		setLinks(reordered);
		const orderedIds = reordered.map((l) => l.id);

		try {
			const res = await fetch("/api/studio/links", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "reorder", orderedIds }),
			});
			if (!res.ok) {
				showToast("Gagal menyimpan urutan baru.", "error");
			} else {
				markUnpublished();
			}
		} catch {
			showToast("Gagal menghubungi server untuk reorder.", "error");
		}
	};

	// =========================================================================
	// HANDLERS: CONTACT
	// =========================================================================
	const handleOpenAddContact = () => {
		setContactForm({
			platform: "whatsapp",
			label_id: "WhatsApp",
			label_en: "WhatsApp",
			value: "",
			url: "",
			is_enabled: true,
		});
		setIsAddContactOpen(true);
	};

	const handlePlatformChange = (p: string) => {
		let label = "Chat WhatsApp";
		let urlPrefix = "https://wa.me/";
		if (p === "telegram") {
			label = "Telegram";
			urlPrefix = "https://t.me/";
		} else if (p === "email") {
			label = "Kirim Email";
			urlPrefix = "mailto:";
		} else if (p === "instagram") {
			label = "Instagram";
			urlPrefix = "https://instagram.com/";
		} else if (p === "custom") {
			label = "Kontak Lainnya";
			urlPrefix = "https://";
		}
		setContactForm((prev) => ({
			...prev,
			platform: p,
			label_id: label,
			label_en: label,
			url: prev.value ? `${urlPrefix}${prev.value.replace(/[@+]/g, "")}` : "",
		}));
	};

	const handleContactValueChange = (val: string) => {
		let generatedUrl = val;
		const clean = val.trim();
		if (contactForm.platform === "whatsapp") {
			const cleanPhone = clean.replace(/[^0-9]/g, "");
			generatedUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : "";
		} else if (contactForm.platform === "telegram") {
			const cleanUser = clean.replace(/^@/, "");
			generatedUrl = cleanUser ? `https://t.me/${cleanUser}` : "";
		} else if (contactForm.platform === "email") {
			generatedUrl = clean ? `mailto:${clean}` : "";
		} else if (contactForm.platform === "instagram") {
			const cleanUser = clean.replace(/^@/, "");
			generatedUrl = cleanUser ? `https://instagram.com/${cleanUser}` : "";
		}
		setContactForm((prev) => ({
			...prev,
			value: val,
			url: prev.url && !prev.url.startsWith("http") && !prev.url.startsWith("mailto:") ? generatedUrl : (prev.url || generatedUrl),
		}));
	};

	const handleSaveNewContact = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const res = await fetch("/api/studio/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(contactForm),
			});
			const data = (await res.json()) as { error?: string; status?: string; contactMethod?: ContactMethodRecord };
			if (!res.ok || data.error) {
				showToast(data.error || "Gagal menambahkan kontak.", "error");
			} else if (data.contactMethod) {
				setContacts((prev) => [...prev, data.contactMethod!]);
				setIsAddContactOpen(false);
				showToast("Metode kontak berhasil ditambahkan ke draft!", "success");
				markUnpublished();
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Kesalahan jaringan.";
			showToast(msg, "error");
		}
	};

	const handleOpenEditContact = (c: ContactMethodRecord) => {
		setEditingContact(c);
		setContactForm({
			platform: c.platform,
			label_id: c.label_id,
			label_en: c.label_en,
			value: c.value,
			url: c.url,
			is_enabled: Boolean(c.is_enabled),
		});
		setIsEditContactOpen(true);
	};

	const handleSaveEditContact = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingContact) return;

		try {
			const res = await fetch("/api/studio/contact", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: editingContact.id, ...contactForm }),
			});
			const data = (await res.json()) as { error?: string; status?: string };
			if (!res.ok || data.error) {
				showToast(data.error || "Gagal memperbarui kontak.", "error");
			} else {
				setContacts((prev) =>
					prev.map((item) =>
						item.id === editingContact.id
							? {
									...item,
									...contactForm,
									platform: contactForm.platform as ContactMethodRecord["platform"],
									is_enabled: contactForm.is_enabled ? 1 : 0,
									updated_at: new Date().toISOString(),
							  }
							: item
					)
				);
				setIsEditContactOpen(false);
				setEditingContact(null);
				showToast("Kontak berhasil diperbarui di draft!", "success");
				markUnpublished();
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Kesalahan jaringan.";
			showToast(msg, "error");
		}
	};

	const handleToggleContact = async (c: ContactMethodRecord) => {
		const newEnabled = !c.is_enabled;
		try {
			const res = await fetch("/api/studio/contact", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: c.id, is_enabled: newEnabled }),
			});
			const data = (await res.json()) as { error?: string; status?: string };
			if (!res.ok || data.error) {
				showToast(data.error || "Gagal mengubah status kontak.", "error");
			} else {
				setContacts((prev) =>
					prev.map((item) => (item.id === c.id ? { ...item, is_enabled: newEnabled ? 1 : 0 } : item))
				);
				markUnpublished();
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Kesalahan jaringan.";
			showToast(msg, "error");
		}
	};

	const handleConfirmDeleteContact = async () => {
		if (!deletingContact) return;
		try {
			const res = await fetch("/api/studio/contact", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: deletingContact.id }),
			});
			const data = (await res.json()) as { error?: string; status?: string };
			if (!res.ok || data.error) {
				showToast(data.error || "Gagal menghapus kontak.", "error");
			} else {
				setContacts((prev) => prev.filter((item) => item.id !== deletingContact.id));
				setIsDeleteContactOpen(false);
				setDeletingContact(null);
				showToast("Metode kontak berhasil dihapus dari draft.", "success");
				markUnpublished();
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Kesalahan jaringan.";
			showToast(msg, "error");
		}
	};

	const handleMoveContact = async (index: number, direction: "up" | "down") => {
		const targetIndex = direction === "up" ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= contacts.length) return;

		const reordered = [...contacts];
		const temp = reordered[index];
		reordered[index] = reordered[targetIndex];
		reordered[targetIndex] = temp;

		setContacts(reordered);
		const orderedIds = reordered.map((c) => c.id);

		try {
			const res = await fetch("/api/studio/contact", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "reorder", orderedIds }),
			});
			if (!res.ok) {
				showToast("Gagal menyimpan urutan kontak.", "error");
			} else {
				markUnpublished();
			}
		} catch {
			showToast("Gagal menghubungi server untuk reorder kontak.", "error");
		}
	};

	// =========================================================================
	// HANDLERS: PUBLISH & DISCARD
	// =========================================================================
	const saveDraftAppearanceDirectly = async (updated: AppearanceRecord) => {
		try {
			await fetch("/api/studio/appearance", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "save", appearance: updated }),
			});
		} catch {
			// silent fallback
		}
	};

	const handlePublishChanges = async () => {
		setIsPublishing(true);
		try {
			// Ensure in-memory appearance changes are saved to draft first
			try {
				await fetch("/api/studio/appearance", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "save", appearance }),
				});
			} catch {}

			const res = await fetch("/api/studio/publish", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});
			const data = (await res.json()) as {
				error?: string;
				status?: string;
				version?: number;
				publishedAt?: string;
			};
			if (!res.ok || data.error) {
				showToast(data.error || "Gagal mempublikasikan perubahan.", "error");
			} else {
				setPubMeta({
					id: "current",
					version: data.version || (pubMeta?.version ? pubMeta.version + 1 : 2),
					published_at: data.publishedAt || new Date().toISOString(),
					published_by: user.email,
					notes: "Published from MOBIO Studio",
					has_unpublished_changes: 0,
					draft_updated_at: new Date().toISOString(),
				});
				setIsPublishModalOpen(false);
				showToast("Berhasil dipublikasikan! Perubahan kini aktif di website publik.", "success");
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Kesalahan jaringan.";
			showToast(msg, "error");
		} finally {
			setIsPublishing(false);
		}
	};

	const handleDiscardChanges = async () => {
		setIsDiscarding(true);
		try {
			const res = await fetch("/api/studio/discard", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});
			const data = (await res.json()) as { error?: string; status?: string };
			if (!res.ok || data.error) {
				showToast(data.error || "Gagal membatalkan perubahan draft.", "error");
			} else {
				// Re-fetch drafts
				const [pRes, lRes, cRes, aRes] = await Promise.all([
					fetch("/api/studio/profile"),
					fetch("/api/studio/links"),
					fetch("/api/studio/contact"),
					fetch("/api/studio/appearance"),
				]);
				const pData = (await pRes.json()) as { profile?: ProfileRecord };
				const lData = (await lRes.json()) as { links?: LinkRecord[] };
				const cData = (await cRes.json()) as { contactMethods?: ContactMethodRecord[] };
				const aData = (await aRes.json()) as { appearance?: AppearanceRecord };

				if (pData.profile) setProfile(pData.profile);
				if (lData.links) setLinks(lData.links);
				if (cData.contactMethods) setContacts(cData.contactMethods);
				if (aData.appearance) setAppearance(aData.appearance);

				setPubMeta((prev) => (prev ? { ...prev, has_unpublished_changes: 0 } : null));
				setIsDiscardModalOpen(false);
				showToast("Seluruh draft berhasil direset ke versi publik saat ini.", "info");
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Kesalahan jaringan.";
			showToast(msg, "error");
		} finally {
			setIsDiscarding(false);
		}
	};

	// =========================================================================
	// HANDLERS: APPEARANCE & MEDIA (PHASE 3)
	// =========================================================================
	const fetchMediaList = useCallback(async (category?: string) => {
		setIsLoadingMedia(true);
		setUploadError(null);
		try {
			const query = category && category !== "all" ? `?category=${category}` : "";
			const res = await fetch(`/api/studio/media${query}`);
			if (res.ok) {
				const data = (await res.json()) as { assets: MediaAssetRecord[] };
				setMediaList(data.assets || []);
			}
		} catch (err) {
			console.error("Gagal memuat daftar media:", err);
		} finally {
			setIsLoadingMedia(false);
		}
	}, []);

	const handleOpenMediaLibrary = (target: "avatar" | "cover" | "background" | "background_poster" | "explore_cover" | "gallery_photo") => {
		setMediaTarget(target);
		const initialCategory = target === "avatar" ? "avatar" : target === "cover" ? "cover" : target === "explore_cover" || target === "gallery_photo" ? "all" : "background";
		setMediaCategoryFilter(initialCategory);
		setIsMediaModalOpen(true);
		fetchMediaList(initialCategory);
	};

	const saveDraftProfileDirectly = async (updated: ProfileRecord) => {
		try {
			await fetch("/api/studio/profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updated),
			});
			markUnpublished();
		} catch (err) {
			console.error("Gagal menyimpan profil:", err);
		}
	};

	const handleSelectMedia = (asset: MediaAssetRecord) => {
		if (mediaTarget === "avatar") {
			const previewUrl = `/api/studio/media/${asset.id}/preview`;
			const updated = {
				...profile,
				avatar_media_id: asset.id,
				avatar_url: previewUrl,
			};
			setProfile(updated);
			saveDraftProfileDirectly(updated);
		} else if (mediaTarget === "cover") {
			setAppearance((prev) => ({
				...prev,
				cover_media_id: asset.id,
				cover_url: `/api/studio/media/${asset.id}/preview`,
			}));
			markUnpublished();
		} else if (mediaTarget === "background") {
			setAppearance((prev) => ({
				...prev,
				background_media_id: asset.id,
				background_src: `/api/studio/media/${asset.id}/preview`,
				background_type: asset.media_type === "video" ? "video" : "image",
			}));
			markUnpublished();
		} else if (mediaTarget === "background_poster") {
			setAppearance((prev) => ({
				...prev,
				background_poster_media_id: asset.id,
				background_poster: `/api/studio/media/${asset.id}/preview`,
			}));
			markUnpublished();
		} else if (mediaTarget === "explore_cover") {
			setExploreForm((prev) => ({
				...prev,
				cover_image: `/api/public/media/${asset.id}`,
			}));
		} else if (mediaTarget === "gallery_photo") {
			const newPhoto = {
				id: asset.id,
				url: `/api/public/media/${asset.id}`,
				caption: "",
			};
			setExploreForm((prev) => ({
				...prev,
				photos: [...(prev.photos || []), newPhoto],
				cover_image: prev.cover_image || `/api/public/media/${asset.id}`,
			}));
		}
		setIsMediaModalOpen(false);
		showToast(`Media berhasil dipilih untuk ${mediaTarget}.`, "success");
	};

	// HANDLERS: EXPLORE & SUBCATEGORIES (PHASE 4 & PHASE 6 & PHASE 8)
	// =========================================================================
	const handleOpenAddExplore = () => {
		setExploreForm({
			type: "project",
			category: "all",
			subcategory_id: "",
			title_id: "",
			title_en: "",
			subtitle_id: "",
			subtitle_en: "",
			description_id: "",
			description_en: "",
			url: "",
			cover_image: "",
			badge_id: "",
			badge_en: "",
			photos: [],
			tags: "",
			year: "",
			rating: "",
			artist: "",
			is_enabled: true,
		});
		setIsAddExploreOpen(true);
	};

	const handleOpenEditExplore = (item: ExploreItemRecord) => {
		let meta: Record<string, any> = {};
		if (item.metadata_json) {
			try {
				meta = JSON.parse(item.metadata_json);
			} catch {}
		}
		setEditingExplore(item);
		setExploreForm({
			type: (item.type as ExploreBlockType) || "project",
			category: item.category || "all",
			subcategory_id: item.subcategory_id || "",
			title_id: item.title_id || "",
			title_en: item.title_en || "",
			subtitle_id: item.subtitle_id || "",
			subtitle_en: item.subtitle_en || "",
			description_id: item.description_id || "",
			description_en: item.description_en || "",
			url: item.url || "",
			cover_image: item.cover_image || "",
			badge_id: item.badge_id || "",
			badge_en: item.badge_en || "",
			photos: Array.isArray(meta.photos) ? meta.photos : [],
			tags: Array.isArray(meta.tags) ? meta.tags.join(", ") : "",
			year: meta.year || "",
			rating: meta.rating || "",
			artist: meta.artist || "",
			is_enabled: Boolean(item.is_enabled),
		});
		setIsEditExploreOpen(true);
	};

	const buildExplorePayload = () => {
		const meta: Record<string, any> = {};
		if (exploreForm.tags) meta.tags = exploreForm.tags.split(",").map((s) => s.trim()).filter(Boolean);
		if (exploreForm.year) meta.year = exploreForm.year.trim();
		if (exploreForm.rating) meta.rating = exploreForm.rating.trim();
		if (exploreForm.artist) meta.artist = exploreForm.artist.trim();
		if (exploreForm.photos && exploreForm.photos.length > 0) meta.photos = exploreForm.photos;

		return {
			type: exploreForm.type,
			category: exploreForm.category.trim() || "all",
			subcategory_id: exploreForm.subcategory_id.trim() || "",
			title_id: exploreForm.title_id.trim(),
			title_en: exploreForm.title_en.trim() || exploreForm.title_id.trim(),
			subtitle_id: exploreForm.subtitle_id.trim(),
			subtitle_en: exploreForm.subtitle_en.trim(),
			description_id: exploreForm.description_id.trim(),
			description_en: exploreForm.description_en.trim(),
			url: exploreForm.url.trim(),
			cover_image: exploreForm.cover_image.trim(),
			badge_id: exploreForm.badge_id.trim(),
			badge_en: exploreForm.badge_en.trim(),
			metadata_json: JSON.stringify(meta),
			is_enabled: exploreForm.is_enabled ? 1 : 0,
		};
	};

	const handleSaveSubcategory = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!subcatForm.label_id.trim()) {
			showToast("Label subkategori wajib diisi.", "error");
			return;
		}
		setIsSubmittingSubcat(true);
		try {
			if (editingSubcat) {
				const res = await fetch("/api/studio/explore", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						action: "update_subcategory",
						id: editingSubcat.id,
						category: subcatForm.category,
						label_id: subcatForm.label_id.trim(),
						label_en: subcatForm.label_en.trim() || subcatForm.label_id.trim(),
						color: subcatForm.color,
					}),
				});
				if (res.ok) {
					setSubcategories((prev) =>
						prev.map((s) =>
							s.id === editingSubcat.id
								? {
										...s,
										category: subcatForm.category,
										label_id: subcatForm.label_id.trim(),
										label_en: subcatForm.label_en.trim() || subcatForm.label_id.trim(),
										color: subcatForm.color,
								  }
								: s
						)
					);
					setEditingSubcat(null);
					setSubcatForm({ category: "work", label_id: "", label_en: "", color: "#8b5cf6" });
					showToast("Subkategori berhasil diperbarui.", "success");
					markUnpublished();
				}
			} else {
				const res = await fetch("/api/studio/explore", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						action: "create_subcategory",
						category: subcatForm.category,
						label_id: subcatForm.label_id.trim(),
						label_en: subcatForm.label_en.trim() || subcatForm.label_id.trim(),
						color: subcatForm.color,
					}),
				});
				const data = (await res.json()) as { status: string; subcategory?: ExploreSubcategoryRecord };
				if (res.ok && data.subcategory) {
					setSubcategories((prev) => [...prev, data.subcategory!]);
					setSubcatForm({ category: "work", label_id: "", label_en: "", color: "#8b5cf6" });
					showToast("Subkategori baru berhasil ditambahkan.", "success");
					markUnpublished();
				}
			}
		} catch {
			showToast("Gagal menyimpan subkategori.", "error");
		} finally {
			setIsSubmittingSubcat(false);
		}
	};

	// Category Handlers (Single-Tier Customizable Main Categories)
	const handleSaveCategory = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!categoryForm.name_id.trim()) {
			showToast("Nama kategori (ID) wajib diisi.", "error");
			return;
		}
		setIsSubmittingCategory(true);
		try {
			if (editingCategory) {
				const res = await fetch("/api/studio/explore", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						action: "update_category",
						id: editingCategory.id,
						name_id: categoryForm.name_id.trim(),
						name_en: categoryForm.name_en.trim() || categoryForm.name_id.trim(),
						icon: categoryForm.icon.trim() || "folder",
						color: categoryForm.color || "#8b5cf6",
						is_enabled: categoryForm.is_enabled ? 1 : 0,
					}),
				});
				if (res.ok) {
					setCategories((prev) =>
						prev.map((c) =>
							c.id === editingCategory.id
								? {
										...c,
										name_id: categoryForm.name_id.trim(),
										name_en: categoryForm.name_en.trim() || categoryForm.name_id.trim(),
										icon: categoryForm.icon.trim() || "folder",
										color: categoryForm.color || "#8b5cf6",
										is_enabled: categoryForm.is_enabled ? 1 : 0,
								  }
								: c
						)
					);
					setEditingCategory(null);
					setCategoryForm({ id: "", name_id: "", name_en: "", icon: "folder", color: "#8b5cf6", is_enabled: true });
					showToast("Kategori berhasil diperbarui.", "success");
					markUnpublished();
				} else {
					const err = await res.json().catch(() => ({}));
					showToast((err as { error?: string })?.error || "Gagal memperbarui kategori.", "error");
				}
			} else {
				const catId = categoryForm.id.trim() || categoryForm.name_id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
				const res = await fetch("/api/studio/explore", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						action: "create_category",
						id: catId,
						name_id: categoryForm.name_id.trim(),
						name_en: categoryForm.name_en.trim() || categoryForm.name_id.trim(),
						icon: categoryForm.icon.trim() || "folder",
						color: categoryForm.color || "#8b5cf6",
						is_enabled: categoryForm.is_enabled ? 1 : 0,
					}),
				});
				const data = (await res.json()) as { status: string; category?: ExploreCategoryRecord; error?: string };
				if (res.ok && data.category) {
					setCategories((prev) => [...prev, data.category!]);
					setCategoryForm({ id: "", name_id: "", name_en: "", icon: "folder", color: "#8b5cf6", is_enabled: true });
					showToast("Kategori baru berhasil ditambahkan.", "success");
					markUnpublished();
				} else {
					showToast(data.error || "Gagal membuat kategori.", "error");
				}
			}
		} catch {
			showToast("Gagal menyimpan kategori.", "error");
		} finally {
			setIsSubmittingCategory(false);
		}
	};

	const handleDeleteCategory = async (id: string) => {
		try {
			const res = await fetch("/api/studio/explore", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "delete_category", id }),
			});
			if (res.ok) {
				setCategories((prev) => prev.filter((c) => c.id !== id));
				setExploreItems((prev) =>
					prev.map((item) => (item.category === id ? { ...item, category: "all" } : item))
				);
				if (editingCategory?.id === id) {
					setEditingCategory(null);
					setCategoryForm({ id: "", name_id: "", name_en: "", icon: "folder", color: "#8b5cf6", is_enabled: true });
				}
				showToast("Kategori berhasil dihapus. Item dialihkan ke 'Semua'.", "info");
				markUnpublished();
			} else {
				showToast("Gagal menghapus kategori.", "error");
			}
		} catch {
			showToast("Gagal menghapus kategori.", "error");
		}
	};

	const handleReorderCategory = async (idx: number, direction: "up" | "down") => {
		const targetIdx = direction === "up" ? idx - 1 : idx + 1;
		if (targetIdx < 0 || targetIdx >= categories.length) return;
		const reordered = [...categories];
		const [moved] = reordered.splice(idx, 1);
		reordered.splice(targetIdx, 0, moved);
		setCategories(reordered);
		markUnpublished();
		try {
			await fetch("/api/studio/explore", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "reorder_categories",
					ids: reordered.map((c) => c.id),
				}),
			});
		} catch {
			showToast("Gagal mengubah urutan kategori.", "error");
		}
	};

	const handleDeleteSubcategory = async (id: string) => {
		try {
			const res = await fetch("/api/studio/explore", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "delete_subcategory", id }),
			});
			if (res.ok) {
				setSubcategories((prev) => prev.filter((s) => s.id !== id));
				setExploreItems((prev) =>
					prev.map((item) => (item.subcategory_id === id ? { ...item, subcategory_id: "" } : item))
				);
				showToast("Subkategori berhasil dihapus.", "success");
				markUnpublished();
			}
		} catch {
			showToast("Gagal menghapus subkategori.", "error");
		}
	};

	const handleSaveNewExplore = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!exploreForm.title_id.trim()) {
			showToast("Judul item Explore wajib diisi.", "error");
			return;
		}

		setIsSubmittingExplore(true);
		try {
			const res = await fetch("/api/studio/explore", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(buildExplorePayload()),
			});
			const data = (await res.json()) as { status: string; item?: ExploreItemRecord; error?: string };
			if (!res.ok || data.error || !data.item) {
				showToast(data.error || "Gagal menambahkan item Explore.", "error");
			} else {
				setExploreItems((prev) => [...prev, data.item!]);
				setIsAddExploreOpen(false);
				showToast("Item Explore berhasil ditambahkan ke draft!", "success");
				markUnpublished();
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Kesalahan jaringan.";
			showToast(msg, "error");
		} finally {
			setIsSubmittingExplore(false);
		}
	};

	const handleSaveEditExplore = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingExplore) return;
		if (!exploreForm.title_id.trim()) {
			showToast("Judul item Explore wajib diisi.", "error");
			return;
		}

		setIsSubmittingExplore(true);
		try {
			const res = await fetch("/api/studio/explore", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: editingExplore.id, ...buildExplorePayload() }),
			});
			const data = (await res.json()) as { status: string; error?: string };
			if (!res.ok || data.error) {
				showToast(data.error || "Gagal memperbarui item Explore.", "error");
			} else {
				setExploreItems((prev) =>
					prev.map((item) =>
						item.id === editingExplore.id
							? { ...item, ...buildExplorePayload(), updated_at: new Date().toISOString() }
							: item
					)
				);
				setIsEditExploreOpen(false);
				setEditingExplore(null);
				showToast("Item Explore berhasil diperbarui di draft!", "success");
				markUnpublished();
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Kesalahan jaringan.";
			showToast(msg, "error");
		} finally {
			setIsSubmittingExplore(false);
		}
	};

	const handleToggleExploreVisibility = async (item: ExploreItemRecord) => {
		const newStatus = item.is_enabled ? 0 : 1;
		try {
			const res = await fetch("/api/studio/explore", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: item.id, is_enabled: newStatus }),
			});
			if (res.ok) {
				setExploreItems((prev) =>
					prev.map((x) => (x.id === item.id ? { ...x, is_enabled: newStatus } : x))
				);
				showToast(`Item Explore ${newStatus ? "diaktifkan" : "dinonaktifkan"}.`, "success");
				markUnpublished();
			} else {
				showToast("Gagal mengubah visibilitas item.", "error");
			}
		} catch {
			showToast("Kesalahan jaringan.", "error");
		}
	};

	const handleDuplicateExplore = async (item: ExploreItemRecord) => {
		try {
			const res = await fetch("/api/studio/explore", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "duplicate", id: item.id }),
			});
			const data = (await res.json()) as { status: string; item?: ExploreItemRecord; error?: string };
			if (res.ok && data.item) {
				setExploreItems((prev) => [...prev, data.item!]);
				showToast("Item Explore berhasil diduplikasi!", "success");
				markUnpublished();
			} else {
				showToast(data.error || "Gagal menduplikasi item.", "error");
			}
		} catch {
			showToast("Kesalahan jaringan.", "error");
		}
	};

	const handleMoveExplore = async (index: number, direction: "up" | "down") => {
		const targetIndex = direction === "up" ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= exploreItems.length) return;

		const updated = [...exploreItems];
		const temp = updated[index];
		updated[index] = updated[targetIndex];
		updated[targetIndex] = temp;

		setExploreItems(updated);
		try {
			await fetch("/api/studio/explore", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderedIds: updated.map((x) => x.id) }),
			});
			markUnpublished();
		} catch (err) {
			console.error("Gagal memperbarui urutan Explore:", err);
		}
	};

	const handleDeleteExplore = async (id: string) => {
		try {
			const res = await fetch("/api/studio/explore", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id }),
			});
			if (res.ok) {
				setExploreItems((prev) => prev.filter((x) => x.id !== id));
				setIsDeleteExploreOpen(false);
				setDeletingExplore(null);
				showToast("Item Explore berhasil dihapus dari draft.", "success");
				markUnpublished();
			} else {
				const data = (await res.json()) as { error?: string };
				showToast(data.error || "Gagal menghapus item Explore.", "error");
			}
		} catch {
			showToast("Kesalahan jaringan.", "error");
		}
	};

	const handleRemoveMedia = (target: "avatar" | "cover" | "background" | "background_poster") => {
		if (target === "avatar") {
			const updated = { ...profile, avatar_media_id: "", avatar_url: "" };
			setProfile(updated);
			saveDraftProfileDirectly(updated);
			showToast("Avatar dikembalikan ke monogram inisial.", "info");
		} else if (target === "cover") {
			setAppearance((prev) => ({ ...prev, cover_media_id: "", cover_url: "" }));
			markUnpublished();
			showToast("Cover kustom dihapus, menggunakan aurora sheen.", "info");
		} else if (target === "background") {
			setAppearance((prev) => ({
				...prev,
				background_media_id: "",
				background_src: "",
				background_type: "gradient",
			}));
			markUnpublished();
			showToast("Latar belakang dikembalikan ke gradient aurora mesh.", "info");
		} else if (target === "background_poster") {
			setAppearance((prev) => ({ ...prev, background_poster_media_id: "", background_poster: "" }));
			markUnpublished();
		}
	};

	const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;
		const file = files[0];

		const targetCategory =
			mediaTarget === "avatar"
				? "avatar"
				: mediaTarget === "cover"
				? "cover"
				: mediaTarget === "background"
				? "background"
				: "general";

		setIsUploadingMedia(true);
		setUploadError(null);

		const formData = new FormData();
		formData.append("file", file);
		formData.append("category", targetCategory);

		try {
			const res = await fetch("/api/studio/media", {
				method: "POST",
				body: formData,
			});

			const data = (await res.json()) as { asset?: MediaAssetRecord; error?: string };

			if (!res.ok) {
				setUploadError(data.error || "Gagal mengunggah file media.");
				showToast(data.error || "Gagal mengunggah media", "error");
				return;
			}

			if (data.asset) {
				showToast("Media berhasil diunggah!", "success");
				fetchMediaList(mediaCategoryFilter);
				handleSelectMedia(data.asset);
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Error upload";
			setUploadError(msg);
			showToast(msg, "error");
		} finally {
			setIsUploadingMedia(false);
			e.target.value = "";
		}
	};

	const handleDeleteMedia = async (asset: MediaAssetRecord) => {
		setDeletingMediaId(asset.id);
		setUploadError(null);
		try {
			const res = await fetch(`/api/studio/media?id=${asset.id}`, {
				method: "DELETE",
			});
			const data = (await res.json()) as { error?: string };
			if (!res.ok) {
				setUploadError(data.error || "Gagal menghapus media.");
				showToast(data.error || "Gagal menghapus media", "error");
				return;
			}
			showToast("Media berhasil dihapus.", "success");
			fetchMediaList(mediaCategoryFilter);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Error deleting media";
			setUploadError(msg);
			showToast(msg, "error");
		} finally {
			setDeletingMediaId(null);
		}
	};

	const handleSaveAppearance = async () => {
		setIsSavingAppearance(true);
		try {
			const res = await fetch("/api/studio/appearance", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "save", appearance }),
			});
			const data = (await res.json()) as { appearance?: AppearanceRecord; error?: string };
			if (!res.ok) {
				showToast(data.error || "Gagal menyimpan pengaturan tampilan.", "error");
				return;
			}
			if (data.appearance) {
				setAppearance(data.appearance);
			}
			markUnpublished();
			showToast("Pengaturan tampilan berhasil disimpan ke draft!", "success");
		} catch {
			showToast("Koneksi gagal saat menyimpan tampilan.", "error");
		} finally {
			setIsSavingAppearance(false);
		}
	};

	const handleResetAppearance = async () => {
		setIsSavingAppearance(true);
		try {
			const res = await fetch("/api/studio/appearance", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "reset" }),
			});
			const data = (await res.json()) as { appearance?: AppearanceRecord; error?: string };
			if (!res.ok) {
				showToast(data.error || "Gagal mereset tampilan.", "error");
				return;
			}
			if (data.appearance) {
				setAppearance(data.appearance);
			}
			markUnpublished();
			setIsResetAppearanceOpen(false);
			showToast("Tampilan berhasil dikembalikan ke default Frost Aurora!", "success");
		} catch {
			showToast("Koneksi gagal saat mereset tampilan.", "error");
		} finally {
			setIsSavingAppearance(false);
		}
	};

	// =========================================================================
	// RENDER STUDIO SHELL
	// =========================================================================
	return (
		<div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-violet-600 selection:text-white">
			{/* Toast Notifications */}
			{toast && (
				<div className="fixed top-5 right-5 z-50 max-w-md animate-fade-in shadow-2xl">
					<div
						className={`rounded-2xl p-4 border flex items-center gap-3 backdrop-blur-xl ${
							toast.type === "success"
								? "bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-950/50"
								: toast.type === "error"
								? "bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-rose-950/50"
								: "bg-slate-900/95 border-slate-700 text-slate-100 shadow-black/50"
						}`}
					>
						<span className="text-lg">
							{toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
						</span>
						<p className="text-xs sm:text-sm font-medium flex-1">{toast.message}</p>
						<button
							type="button"
							onClick={() => setToast(null)}
							className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg"
						>
							Tutup
						</button>
					</div>
				</div>
			)}

			{/* Top Bar Navigation & Publish Bar */}
			<header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<div className="flex items-center justify-between sm:justify-start gap-3">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
							M
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
									MOBIO Studio
								</h1>
							</div>
							<p className="text-[11px] text-slate-400 hidden sm:block">
								Profile, Links & Contact Management
							</p>
						</div>
					</div>

					{/* Mobile Public Link */}
					<a
						href="/"
						className="sm:hidden px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
					>
						<span>Web</span>
						<span>↗</span>
					</a>
				</div>

				{/* Publish Bar Controls */}
				<div className="flex items-center gap-2 overflow-x-auto sm:overflow-visible py-1 sm:py-0">
					{/* Status Tag */}
					<div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
						<span
							className={`w-2 h-2 rounded-full ${
								hasUnpublished ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
							}`}
						/>
						<span className="text-slate-300 text-[11px] font-medium">
							{hasUnpublished ? "Ada perubahan draft" : "Telah Terbit"}
						</span>
					</div>

					{/* Preview Draft Button (Real Website Preview) */}
					<a
						href="/studio/preview"
						target="_blank"
						rel="noopener noreferrer"
						className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer shrink-0"
						title="Buka Pratinjau Draft Real Website di tab baru"
					>
						<span>👁 Preview Draft</span>
						<span className="text-[10px] text-slate-400">↗</span>
					</a>

					{/* Discard Button (Only active when there are unpublished changes) */}
					{hasUnpublished && (
						<button
							type="button"
							onClick={() => setIsDiscardModalOpen(true)}
							className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-800/60 cursor-pointer shrink-0"
							title="Batalkan perubahan draft dan kembalikan ke published"
						>
							<span>Batalkan</span>
						</button>
					)}

					{/* Publish Changes Button */}
					<button
						type="button"
						onClick={() => setIsPublishModalOpen(true)}
						disabled={!hasUnpublished}
						className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
							hasUnpublished
								? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950 cursor-pointer animate-pulse"
								: "bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed"
						}`}
						title={hasUnpublished ? "Terbitkan perubahan ke website publik" : "Tidak ada perubahan draft baru"}
					>
						<span>🚀 Terbitkan Perubahan</span>
					</button>

					{/* Desktop Public Web Link */}
					<a
						href="/"
						className="hidden sm:flex px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors items-center gap-1.5 border border-slate-700 shrink-0"
					>
						<span>Lihat Website</span>
						<span aria-hidden="true">↗</span>
					</a>
				</div>
			</header>

			{/* Main Container with Sidebar + Content */}
			<div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 gap-6">
				{/* Sidebar Navigation */}
				<aside className="w-full md:w-64 shrink-0">
					<nav
						role="tablist"
						aria-label="Menu navigasi Studio"
						className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible"
					>
						{navTabs.map((tab) => {
							const isActive = activeSection === tab.id;
							return (
								<button
									key={tab.id}
									type="button"
									role="tab"
									aria-selected={isActive}
									onClick={() => handleSelectSection(tab.id)}
									className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 transition-all whitespace-nowrap cursor-pointer text-left ${
										isActive
											? "bg-violet-600 text-white shadow-sm"
											: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
									}`}
								>
									<span>{tab.label}</span>
									{tab.badge && (
										<span
											className={`text-[10px] px-1.5 py-0.5 rounded-md border ${
												isActive
													? "bg-violet-700 text-violet-100 border-violet-500/40"
													: tab.badgeColor
													? `${tab.badgeColor}`
													: "bg-slate-800 text-slate-500 border-slate-700"
											}`}
										>
											{tab.badge}
										</span>
									)}
								</button>
							);
						})}
					</nav>

					{/* Admin Profile pill in sidebar */}
					<div className="mt-4 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs hidden md:block">
						<div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
							Terautentikasi Sebagai
						</div>
						<div className="text-slate-200 font-semibold truncate">{user.email}</div>
						<div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1.5">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
							<span>Cloudflare D1 Ready</span>
						</div>
					</div>
				</aside>

				{/* Main Content Area */}
				<main className="flex-1 min-w-0">
					{/* =========================================================================
					    SECTION 1: OVERVIEW (METRICS & ARCHITECTURE)
					    ========================================================================= */}
					{activeSection === "overview" && (
						<div className="flex flex-col gap-6">
							{!isDbReady && (
								<div className="bg-amber-950/60 border border-amber-800/80 rounded-2xl p-5 text-amber-200">
									<h3 className="font-bold text-amber-100 mb-1">Setup Database D1 Diperlukan</h3>
									<p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed mb-3">
										{database?.error || "Tabel database belum ditemukan. Jalankan migrasi schema."}
									</p>
									<div className="bg-slate-950/80 border border-amber-900/50 rounded-xl p-3 font-mono text-[11px] text-amber-300 select-all">
										npx wrangler d1 migrations apply mobio-studio-db --local
									</div>
								</div>
							)}

							{/* Status Cards Grid */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
									<div>
										<div className="flex items-center justify-between text-xs text-slate-400 mb-2">
											<span>Autentikasi Access</span>
											<span className="w-2 h-2 rounded-full bg-emerald-400" />
										</div>
										<h3 className="text-base font-bold text-white truncate">{user.email}</h3>
										<p className="text-xs text-slate-400 mt-1">
											Metode: <span className="text-slate-300 font-medium">{user.identityType}</span>
										</p>
									</div>
									<div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-emerald-400 font-medium">
										✓ Server-side Gate Active
									</div>
								</div>

								<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
									<div>
										<div className="flex items-center justify-between text-xs text-slate-400 mb-2">
											<span>Status Publikasi</span>
											<span
												className={`w-2 h-2 rounded-full ${
													hasUnpublished ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
												}`}
											/>
										</div>
										<h3 className="text-base font-bold text-white">
											{hasUnpublished ? "Draft Menunggu Terbit" : "Website Aktif & Terbit"}
										</h3>
										<p className="text-xs text-slate-400 mt-1">
											Perubahan Draft:{" "}
											<span className="text-slate-200 font-semibold">
												{hasUnpublished ? "Ya (Belum dipublikasikan)" : "Tidak ada"}
											</span>
										</p>
									</div>
									<div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
										Dipublikasikan oleh: {pubMeta?.published_by || "system"}
									</div>
								</div>

								<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
									<div>
										<div className="flex items-center justify-between text-xs text-slate-400 mb-2">
											<span>Isolasi Draft & Publish</span>
											<span className="text-emerald-400 font-bold text-[10px]">AKTIF</span>
										</div>
										<h3 className="text-base font-bold text-white">Transaksional</h3>
										<p className="text-xs text-slate-400 mt-1 leading-relaxed">
											Draft tersimpan aman di tabel draft tanpa mengubah tampilan pengunjung publik sampai diterbitkan.
										</p>
									</div>
									<div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
										Tersinkronisasi
									</div>
								</div>
							</div>

							{/* Summary metrics */}
							<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
								<h3 className="text-base font-bold text-white mb-1">Ringkasan Konten Aktif</h3>
								<p className="text-xs text-slate-400 mb-4">
									Data yang sedang aktif dalam ruang kerja draft Anda
								</p>
								<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
									<div className="bg-slate-950/60 border border-slate-800/70 rounded-xl p-4">
										<div className="text-2xl font-black text-white mb-1">{links.length}</div>
										<div className="text-xs text-slate-400 font-medium">Tautan Vertikal</div>
									</div>
									<div className="bg-slate-950/60 border border-slate-800/70 rounded-xl p-4">
										<div className="text-2xl font-black text-white mb-1">{contacts.length}</div>
										<div className="text-xs text-slate-400 font-medium">Metode Kontak</div>
									</div>
									<div className="bg-slate-950/60 border border-slate-800/70 rounded-xl p-4 col-span-2 sm:col-span-1">
										<div className="text-2xl font-black text-emerald-400 mb-1">{profile.name ? "1" : "0"}</div>
										<div className="text-xs text-slate-400 font-medium">Profil Terkonfigurasi</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* =========================================================================
					    SECTION 2: PROFILE EDITOR (PHASE 2)
					    ========================================================================= */}
					{activeSection === "profile" && (
						<div className="flex flex-col gap-6">
							<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
									<div>
										<h2 className="text-lg font-bold text-white">Editor Profil (Draft)</h2>
										<p className="text-xs text-slate-400">
											Kelola identitas utama, avatar, username, dan bio bilingual Anda.
										</p>
									</div>
									<button
										type="button"
										onClick={handleSaveProfile}
										disabled={isSavingProfile}
										className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer self-start sm:self-auto"
									>
										{isSavingProfile ? "Menyimpan ke D1..." : "Simpan Draft Profil"}
									</button>
								</div>

								<form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
									{/* Form Fields Column */}
									<div className="lg:col-span-7 flex flex-col gap-4">
										{/* Display Name */}
										<div>
											<div className="flex justify-between items-center mb-1">
												<label htmlFor="p-name" className="text-xs font-semibold text-slate-300">
													Nama Tampilan (Display Name) <span className="text-rose-400">*</span>
												</label>
												<span className="text-[10px] text-slate-500">
													{profile.name.length}/80
												</span>
											</div>
											<input
												id="p-name"
												type="text"
												maxLength={80}
												required
												value={profile.name}
												onChange={(e) => setProfile({ ...profile, name: e.target.value })}
												placeholder="Your Name"
												className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none transition-colors"
											/>
										</div>

										{/* Username / Handle */}
										<div>
											<div className="flex justify-between items-center mb-1">
												<label htmlFor="p-handle" className="text-xs font-semibold text-slate-300">
													Username / Handle <span className="text-rose-400">*</span>
												</label>
												<span className="text-[10px] text-slate-500">
													{profile.handle.length}/40
												</span>
											</div>
											<input
												id="p-handle"
												type="text"
												maxLength={40}
												required
												value={profile.handle}
												onChange={(e) => {
													let val = e.target.value.trim();
													if (val && !val.startsWith("@")) val = `@${val}`;
													setProfile({ ...profile, handle: val });
												}}
												placeholder="@username"
												className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none transition-colors"
											/>
										</div>

										{/* Avatar */}
										<div>
											<label htmlFor="p-avatar" className="block text-xs font-semibold text-slate-300 mb-1">
												Foto Avatar
											</label>
											<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2">
												<button
													type="button"
													onClick={() => handleOpenMediaLibrary("avatar")}
													className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
												>
													<span>🖼️ Pilih dari Media Library</span>
												</button>
												{profile.avatar_url && (
													<button
														type="button"
														onClick={() => handleRemoveMedia("avatar")}
														className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
													>
														Gunakan Monogram Inisial
													</button>
												)}
											</div>
											<input
												id="p-avatar"
												type="text"
												value={profile.avatar_url}
												onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
												placeholder="/api/studio/media/... atau https://..."
												className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none transition-colors"
											/>
											<p className="text-[11px] text-slate-500 mt-1">
												Gunakan Media Library R2 (rekomendasi) atau tautkan URL gambar publik eksternal.
											</p>
										</div>

										{/* Locations */}
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div>
												<label htmlFor="p-loc-id" className="block text-xs font-semibold text-slate-300 mb-1">
													Lokasi (Indonesia)
												</label>
												<input
													id="p-loc-id"
													type="text"
													value={profile.location_id}
													onChange={(e) => setProfile({ ...profile, location_id: e.target.value })}
													placeholder="Indonesia"
													className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none transition-colors"
												/>
											</div>
											<div>
												<label htmlFor="p-loc-en" className="block text-xs font-semibold text-slate-300 mb-1">
													Location (English)
												</label>
												<input
													id="p-loc-en"
													type="text"
													value={profile.location_en}
													onChange={(e) => setProfile({ ...profile, location_en: e.target.value })}
													placeholder="Indonesia"
													className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none transition-colors"
												/>
											</div>
										</div>

										{/* Bio ID */}
										<div>
											<label htmlFor="p-bio-id" className="block text-xs font-semibold text-slate-300 mb-1">
												Bio Profil (Bahasa Indonesia)
											</label>
											<textarea
												id="p-bio-id"
												rows={3}
												value={profile.bio_id}
												onChange={(e) => setProfile({ ...profile, bio_id: e.target.value })}
												placeholder="Kosongkan jika ingin menyembunyikan bio..."
												className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none transition-colors resize-y"
											/>
										</div>

										{/* Bio EN */}
										<div>
											<label htmlFor="p-bio-en" className="block text-xs font-semibold text-slate-300 mb-1">
												Profile Bio (English)
											</label>
											<textarea
												id="p-bio-en"
												rows={3}
												value={profile.bio_en}
												onChange={(e) => setProfile({ ...profile, bio_en: e.target.value })}
												placeholder="Leave empty to hide bio..."
												className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none transition-colors resize-y"
											/>
										</div>
									</div>

									{/* Live Preview Box */}
									<div className="lg:col-span-5 flex flex-col items-center">
										<div className="w-full sticky top-24">
											<div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
												Live Preview (Profile Card)
											</div>
											<div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
												<div
													className="absolute -top-16 -left-16 w-32 h-32 rounded-full bg-violet-600/20 blur-2xl pointer-events-none"
													aria-hidden="true"
												/>

												{/* Avatar */}
												<div className="w-20 h-20 rounded-full border-2 border-white/20 overflow-hidden bg-slate-800 mb-3 shadow-inner flex items-center justify-center">
													{profile.avatar_url ? (
														<img
															src={profile.avatar_url}
															alt={profile.name}
															className="w-full h-full object-cover"
															onError={(e) => {
																(e.target as HTMLElement).style.display = "none";
															}}
														/>
													) : (
														<span className="text-2xl font-bold text-slate-400">
															{profile.name ? profile.name[0] : "?"}
														</span>
													)}
												</div>

												{/* Name & Handle */}
												<h3 className="text-lg font-bold text-white tracking-tight">
													{profile.name || "Nama Pengguna"}
												</h3>
												<p className="text-xs font-medium text-violet-400 mb-2">
													{profile.handle || "@handle"}
												</p>

												{/* Location Badge (if filled) */}
												{profile.location_id && (
													<div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 mb-3">
														<span>📍</span>
														<span>{profile.location_id}</span>
													</div>
												)}

												{/* Bio (if filled) */}
												{profile.bio_id && (
													<p className="text-xs text-slate-300 leading-relaxed mt-1 line-clamp-3">
														{profile.bio_id}
													</p>
												)}

												<div className="mt-4 pt-3 border-t border-slate-800/80 w-full text-[10px] text-slate-500">
													Tampilan kartu identitas di homepage publik
												</div>
											</div>
										</div>
									</div>
								</form>
							</div>
						</div>
					)}

					{/* =========================================================================
					    SECTION 3: LINKS EDITOR (PHASE 2)
					    ========================================================================= */}
					{activeSection === "links" && (
						<div className="flex flex-col gap-6">
							<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
									<div>
										<h2 className="text-lg font-bold text-white">Editor Tautan (Draft)</h2>
										<p className="text-xs text-slate-400">
											Atur tautan vertikal, urutan tampilan (Up/Down), dan status aktif/nonaktif.
										</p>
									</div>
									<button
										type="button"
										onClick={handleOpenAddLink}
										className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
									>
										<span>+ Tambah Tautan</span>
									</button>
								</div>

								{/* Links List */}
								{links.length === 0 ? (
									<div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
										<p className="text-sm text-slate-400 mb-3">Belum ada tautan di dalam draft.</p>
										<button
											type="button"
											onClick={handleOpenAddLink}
											className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
										>
											+ Tambah Tautan Pertama
										</button>
									</div>
								) : (
									<div className="flex flex-col gap-2.5">
										{links.map((link, idx) => (
											<div
												key={link.id}
												className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
													link.is_enabled
														? "bg-slate-950/60 border-slate-800 hover:border-slate-700"
														: "bg-slate-950/30 border-slate-800/40 opacity-60"
												}`}
											>
												<div className="flex items-center gap-3 min-w-0">
													{/* Reorder Up/Down */}
													<div className="flex flex-col gap-0.5">
														<button
															type="button"
															disabled={idx === 0}
															onClick={() => handleMoveLink(idx, "up")}
															className="w-6 h-6 rounded flex items-center justify-center text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
															title="Pindahkan ke atas"
														>
															▲
														</button>
														<button
															type="button"
															disabled={idx === links.length - 1}
															onClick={() => handleMoveLink(idx, "down")}
															className="w-6 h-6 rounded flex items-center justify-center text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
															title="Pindahkan ke bawah"
														>
															▼
														</button>
													</div>

													{/* Link Icon Badge */}
													<div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 overflow-hidden p-2">
														<LinkIconRenderer link={link} isStudioPreview={true} className="w-5 h-5" />
													</div>

													{/* Title & URL */}
													<div className="min-w-0">
														<div className="flex items-center gap-2">
															<span className="text-sm font-bold text-white truncate">
																{link.title_id || link.title_en}
															</span>
															{link.title_en && link.title_en !== link.title_id && (
																<span className="text-[11px] text-slate-400 truncate hidden md:inline">
																	({link.title_en})
																</span>
															)}
														</div>
														<div className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md font-mono">
															{link.url}
														</div>
													</div>
												</div>

												{/* Actions */}
												<div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
													{/* Enable/Disable Toggle */}
													<button
														type="button"
														onClick={() => handleToggleLink(link)}
														className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
															link.is_enabled
																? "bg-emerald-950 text-emerald-300 border border-emerald-800"
																: "bg-slate-800 text-slate-400 border border-slate-700"
														}`}
													>
														{link.is_enabled ? "Aktif" : "Nonaktif"}
													</button>

													{/* Edit */}
													<button
														type="button"
														onClick={() => handleOpenEditLink(link)}
														className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
													>
														Edit
													</button>

													{/* Delete */}
													<button
														type="button"
														onClick={() => {
															setDeletingLink(link);
															setIsDeleteLinkOpen(true);
														}}
														className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold transition-colors cursor-pointer border border-rose-800/60"
													>
														Hapus
													</button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					)}

					{/* =========================================================================
					    SECTION 4: CONTACT EDITOR (PHASE 2)
					    ========================================================================= */}
					{activeSection === "contact" && (
						<div className="flex flex-col gap-6">
							<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
									<div>
										<h2 className="text-lg font-bold text-white">Editor Kontak (Draft)</h2>
										<p className="text-xs text-slate-400">
											Kelola kartu komunikasi langsung: WhatsApp, Telegram, Email, dan Instagram.
										</p>
									</div>
									<button
										type="button"
										onClick={handleOpenAddContact}
										className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
									>
										<span>+ Tambah Kontak</span>
									</button>
								</div>

								{/* Contact List */}
								{contacts.length === 0 ? (
									<div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
										<p className="text-sm text-slate-400 mb-3">Belum ada metode kontak di dalam draft.</p>
										<button
											type="button"
											onClick={handleOpenAddContact}
											className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
										>
											+ Tambah Metode Kontak Pertama
										</button>
									</div>
								) : (
									<div className="flex flex-col gap-2.5">
										{contacts.map((contact, idx) => (
											<div
												key={contact.id}
												className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
													contact.is_enabled
														? "bg-slate-950/60 border-slate-800 hover:border-slate-700"
														: "bg-slate-950/30 border-slate-800/40 opacity-60"
												}`}
											>
												<div className="flex items-center gap-3 min-w-0">
													{/* Reorder Up/Down */}
													<div className="flex flex-col gap-0.5">
														<button
															type="button"
															disabled={idx === 0}
															onClick={() => handleMoveContact(idx, "up")}
															className="w-6 h-6 rounded flex items-center justify-center text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
															title="Pindahkan ke atas"
														>
															▲
														</button>
														<button
															type="button"
															disabled={idx === contacts.length - 1}
															onClick={() => handleMoveContact(idx, "down")}
															className="w-6 h-6 rounded flex items-center justify-center text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
															title="Pindahkan ke bawah"
														>
															▼
														</button>
													</div>

													{/* Platform Badge */}
													<div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-xs font-bold text-violet-400 uppercase shrink-0">
														{contact.platform.substring(0, 2)}
													</div>

													{/* Label & Value */}
													<div className="min-w-0">
														<div className="flex items-center gap-2">
															<span className="text-sm font-bold text-white truncate">
																{contact.label_id || contact.label_en}
															</span>
															<span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
																{contact.platform}
															</span>
														</div>
														<div className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md font-mono">
															{contact.value || contact.url}
														</div>
													</div>
												</div>

												{/* Actions */}
												<div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
													{/* Enable/Disable Toggle */}
													<button
														type="button"
														onClick={() => handleToggleContact(contact)}
														className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
															contact.is_enabled
																? "bg-emerald-950 text-emerald-300 border border-emerald-800"
																: "bg-slate-800 text-slate-400 border border-slate-700"
														}`}
													>
														{contact.is_enabled ? "Aktif" : "Nonaktif"}
													</button>

													{/* Edit */}
													<button
														type="button"
														onClick={() => handleOpenEditContact(contact)}
														className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
													>
														Edit
													</button>

													{/* Delete */}
													<button
														type="button"
														onClick={() => {
															setDeletingContact(contact);
															setIsDeleteContactOpen(true);
														}}
														className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold transition-colors cursor-pointer border border-rose-800/60"
													>
														Hapus
													</button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					)}

					{/* =========================================================================
					    SECTION 5: APPEARANCE STUDIO (PHASE 3)
					    ========================================================================= */}
					{activeSection === "appearance" && (
						<div className="flex flex-col gap-6">
							{/* Top Banner & Actions */}
							<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div>
									<h2 className="text-lg font-bold text-white">Appearance Studio (Draft)</h2>
									<p className="text-xs text-slate-400">
										Sesuaikan tema visual, gambar/video latar belakang, cover banner, foto avatar, dan efek Liquid Glass.
									</p>
								</div>
								<div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
									<button
										type="button"
										onClick={() => {
											const currentPreset = getThemePreset(appearance.palette);
											const resetApp: AppearanceRecord = {
												...appearance,
												accent_color: currentPreset.tokens.defaultAccent,
												glass_blur: currentPreset.tokens.glassBlur,
												glass_opacity: currentPreset.tokens.glassOpacity,
												glass_tint: currentPreset.tokens.glassSurfacePrimary,
												background_overlay_color: currentPreset.tokens.overlayColor,
												background_overlay_opacity: currentPreset.tokens.overlayOpacity,
											};
											setAppearance(resetApp);
											markUnpublished();
											saveDraftAppearanceDirectly(resetApp);
											showToast(`Karakteristik visual dikembalikan ke default ${currentPreset.name.id}.`, "info");
										}}
										className="px-3.5 py-2 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 text-xs font-semibold transition-colors cursor-pointer border border-violet-800/60"
										title="Reset penyesuaian aksen, blur, dan kaca kembali ke nilai asli preset ini"
									>
										↺ Reset ke Nilai Preset
									</button>
									<button
										type="button"
										onClick={() => setIsResetAppearanceOpen(true)}
										className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
									>
										Reset Default Pabrik
									</button>
									<button
										type="button"
										onClick={handleSaveAppearance}
										disabled={isSavingAppearance}
										className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer"
									>
										{isSavingAppearance ? "Menyimpan..." : "Simpan Tampilan (Draft)"}
									</button>
								</div>
							</div>

							{/* Subtab Navigation (V4 Customization Engine) */}
							<div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 no-scrollbar">
								{[
									{ id: "themes", label: "🎨 Tema Warna (30)" },
									{ id: "layouts", label: "📐 Tata Letak (20)" },
									{ id: "card", label: "🪪 Kartu Profil (10)" },
									{ id: "typography", label: "✍️ Tipografi (24)" },
									{ id: "media", label: "🖼️ Latar Belakang & Media" },
									{ id: "glass", label: "🧊 Efek Liquid Glass" },
								].map((tab) => (
									<button
										key={tab.id}
										type="button"
										onClick={() => setAppearanceSubTab(tab.id as any)}
										className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
											appearanceSubTab === tab.id
												? "bg-violet-600 text-white shadow-md shadow-violet-950"
												: "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
										}`}
									>
										{tab.label}
									</button>
								))}
							</div>

							{appearanceSubTab === "themes" && (
							/* 1. Theme Presets Panel */
							<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
									<div>
										<h3 className="text-sm font-bold text-white mb-1">Preset Tema Visual (30 Koleksi)</h3>
										<p className="text-xs text-slate-400">
											Pilih salah satu dari 30 preset premium teruji (15 Light Mode & 15 Dark Mode) untuk menerapkan karakteristik tema dan warna aksen secara instan.
										</p>
									</div>
									{/* Filter Tabs */}
									<div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 shrink-0 text-xs">
										<button
											type="button"
											onClick={() => setPresetFilter("all")}
											className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
												presetFilter === "all" ? "bg-violet-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
											}`}
										>
											Semua Tema (30)
										</button>
										<button
											type="button"
											onClick={() => setPresetFilter("light")}
											className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
												presetFilter === "light" ? "bg-violet-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
											}`}
										>
											☀️ Light (15)
										</button>
										<button
											type="button"
											onClick={() => setPresetFilter("dark")}
											className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
												presetFilter === "dark" ? "bg-violet-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
											}`}
										>
											🌙 Dark (15)
										</button>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
									{THEME_PRESETS.filter(
										(p) => presetFilter === "all" || p.mode === presetFilter
									).map((preset) => {
										const isSelected =
											appearance.palette === preset.id ||
											(preset.id === "ocean-breeze" && appearance.palette === "sky-aurora");

										return (
											<button
												key={preset.id}
												type="button"
												onClick={() => {
													const updatedAppearance: AppearanceRecord = {
														...appearance,
														palette: preset.id,
														glass_intensity: preset.mode === "dark" ? "deep" : "medium",
														accent_color: preset.tokens.defaultAccent,
														glass_blur: preset.tokens.glassBlur,
														glass_opacity: preset.tokens.glassOpacity,
														glass_tint: preset.tokens.glassSurfacePrimary,
														background_overlay_color: preset.tokens.overlayColor,
														background_overlay_opacity: preset.tokens.overlayOpacity,
													};
													setAppearance(updatedAppearance);
													markUnpublished();
													saveDraftAppearanceDirectly(updatedAppearance);
													showToast(`Preset ${preset.name.id} diterapkan & disimpan ke draft.`, "info");
												}}
												className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
													isSelected
														? "bg-violet-950/40 border-violet-500 ring-2 ring-violet-500/40 shadow-md"
														: "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950/90"
												}`}
											>
												<div>
													{/* Preview Gradient Chip */}
													<div
														className={`w-full h-12 rounded-lg bg-gradient-to-r ${preset.previewGradient} mb-2.5 border flex items-center justify-between px-3 text-xs font-bold shadow-inner ${
															preset.mode === "light"
																? "border-slate-300/40 text-slate-800"
																: "border-slate-700/50 text-white"
														}`}
													>
														<span className="truncate">{preset.name.id}</span>
														<span
															className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
																preset.mode === "light"
																	? "bg-white/80 text-slate-700 shadow-2xs"
																	: "bg-black/60 text-slate-200"
															}`}
														>
															{preset.mode}
														</span>
													</div>
													<div className="flex items-center justify-between gap-1">
														<span className="text-xs font-bold text-white truncate">
															{preset.name.id}
														</span>
														{isSelected && (
															<span className="text-[10px] text-violet-400 font-bold shrink-0">
																✓ Aktif
															</span>
														)}
													</div>
													<p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
														{preset.description.id}
													</p>
												</div>

												{/* Mini Token Indicators */}
												<div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
													<span
														className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
														style={{ backgroundColor: preset.tokens.defaultAccent }}
														title={`Default Accent: ${preset.tokens.defaultAccent}`}
													/>
													<span className="truncate">Aksen: {preset.tokens.defaultAccent}</span>
												</div>
											</button>
										);
									})}
								</div>
							</div>
							)}

							{/* 2. Layout Themes Subtab */}
							{appearanceSubTab === "layouts" && (
								<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
									<div className="mb-4">
										<h3 className="text-sm font-bold text-white mb-1">Pilihan Tata Letak Halaman (20 Koleksi)</h3>
										<p className="text-xs text-slate-400">
											Pilih komposisi struktural halaman publik. Mengatur lebar kolom, perataan, tata letak kartu tautan (vertikal tunggal, kisi 2 kolom, atau split desktop), dan kepadatan spasial.
										</p>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
										{LAYOUT_THEMES.map((layout) => {
											const isSelected = (appearance.layout_theme_id || "compact-center") === layout.id;
											return (
												<button
													key={layout.id}
													type="button"
													onClick={() => {
														const updated: AppearanceRecord = {
															...appearance,
															layout_theme_id: layout.id,
														};
														setAppearance(updated);
														markUnpublished();
														saveDraftAppearanceDirectly(updated);
														showToast(`Tata letak diubah ke ${layout.name.id}`, "info");
													}}
													className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
														isSelected
															? "bg-violet-950/40 border-violet-500 shadow-md ring-1 ring-violet-500"
															: "bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950"
													}`}
												>
													<div>
														<div className="flex items-center justify-between mb-1.5">
															<h4 className="text-xs font-bold text-white">{layout.name.id}</h4>
															{isSelected && (
																<span className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">
																	✓
																</span>
															)}
														</div>
														<div className="text-[11px] font-medium text-violet-300 mb-1">{layout.tagline.id}</div>
														<p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
															{layout.description.id}
														</p>
													</div>
													<div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
														<span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
															{layout.containerMaxWidth}
														</span>
														<span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
															{layout.linkArrangement}
														</span>
														{layout.isSplitDesktop && (
															<span className="px-2 py-0.5 rounded-md bg-violet-900/60 text-violet-200 border border-violet-700/60 font-semibold">
																Split Desktop
															</span>
														)}
													</div>
												</button>
											);
										})}
									</div>
								</div>
							)}

							{/* 3. Profile Card Design & Size Engine Subtab */}
							{appearanceSubTab === "card" && (
								<div className="flex flex-col gap-6">
									{/* Card Size Engine */}
									<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
										<div className="mb-4">
											<h3 className="text-sm font-bold text-white mb-1">Ukuran Kartu Profil (Card Size Engine)</h3>
											<p className="text-xs text-slate-400">
												Pilih skala dimensi kartu profil. Format bawaan Sedang (Medium) dioptimalkan agar lebih ringkas, proporsional, dan nyaman dilihat tanpa memakan layar.
											</p>
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
											{CARD_SIZES.map((sizeOpt) => {
												const isSelected = (appearance.profile_card_size || "medium") === sizeOpt.id;
												return (
													<button
														key={sizeOpt.id}
														type="button"
														onClick={() => {
															const updated: AppearanceRecord = {
																...appearance,
																profile_card_size: sizeOpt.id,
															};
															setAppearance(updated);
															markUnpublished();
															saveDraftAppearanceDirectly(updated);
															showToast(`Ukuran kartu diubah ke ${sizeOpt.name.id}`, "info");
														}}
														className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
															isSelected
																? "bg-violet-950/50 border-violet-500 shadow-md ring-1 ring-violet-500"
																: "bg-slate-950 border-slate-800 hover:border-slate-700"
														}`}
													>
														<div className="flex items-center justify-between">
															<span className="text-xs font-bold text-white">{sizeOpt.name.id}</span>
															{isSelected && (
																<span className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">
																	✓
																</span>
															)}
														</div>
														<span className="text-[11px] text-violet-300 font-medium">{sizeOpt.tagline.id}</span>
														<div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
															<span>Avatar: {sizeOpt.avatarPx}px</span>
															<span>•</span>
															<span>Batas: {sizeOpt.maxWidthClass}</span>
														</div>
													</button>
												);
											})}
										</div>
									</div>

									{/* 10 Profile Card Styles */}
									<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
										<div className="mb-4">
											<h3 className="text-sm font-bold text-white mb-1">Gaya Kartu Profil (10 Koleksi)</h3>
											<p className="text-xs text-slate-400">
												Pilih komposisi kartu profil. Geometri cover, overlap avatar, dan perataan identitas disesuaikan secara otomatis berdasarkan gaya yang dipilih.
											</p>
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
											{PROFILE_CARD_STYLES.map((styleOpt) => {
												const isSelected = (appearance.profile_card_style_id || "immersive-fade") === styleOpt.id;
												return (
													<button
														key={styleOpt.id}
														type="button"
														onClick={() => {
															const updated: AppearanceRecord = {
																...appearance,
																profile_card_style_id: styleOpt.id,
															};
															setAppearance(updated);
															markUnpublished();
															saveDraftAppearanceDirectly(updated);
															showToast(`Gaya profil diubah ke ${styleOpt.name.id}`, "info");
														}}
														className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
															isSelected
																? "bg-violet-950/40 border-violet-500 shadow-md ring-1 ring-violet-500"
																: "bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950"
														}`}
													>
														<div>
															<div className="flex items-center justify-between mb-1.5">
																<h4 className="text-xs font-bold text-white">{styleOpt.name.id}</h4>
																{isSelected && (
																	<span className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">
																		✓
																	</span>
																)}
															</div>
															<div className="text-[11px] font-medium text-violet-300 mb-1">{styleOpt.tagline.id}</div>
															<p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
																{styleOpt.description.id}
															</p>
														</div>
														<div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
															<span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
																{styleOpt.coverTreatment}
															</span>
														</div>
													</button>
												);
											})}
										</div>
									</div>
								</div>
							)}

							{/* 4. Typography Subtab */}
							{appearanceSubTab === "typography" && (
								<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
										<div>
											<h3 className="text-sm font-bold text-white mb-1">Tipografi & Koleksi Font (24 Pilihan)</h3>
											<p className="text-xs text-slate-400">
												Pilih jenis font Google Fonts premium untuk nama, bio, tautan, dan seluruh antarmuka. Hanya font yang aktif yang akan dimuat di halaman publik.
											</p>
										</div>
										<button
											type="button"
											onClick={() => {
												const updated: AppearanceRecord = {
													...appearance,
													font_family_id: "inter",
												};
												setAppearance(updated);
												markUnpublished();
												saveDraftAppearanceDirectly(updated);
												showToast("Font direset ke Inter", "info");
											}}
											className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold self-start sm:self-auto transition-colors cursor-pointer border border-slate-700"
										>
											↺ Reset ke Inter
										</button>
									</div>

									{/* Search & Category Filter */}
									<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
										<div className="relative flex-1">
											<input
												type="text"
												value={fontSearch}
												onChange={(e) => setFontSearch(e.target.value)}
												placeholder="Cari nama font..."
												className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
											/>
										</div>
										<div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
											<button
												type="button"
												onClick={() => setFontCategoryFilter("all")}
												className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
													fontCategoryFilter === "all" ? "bg-violet-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
												}`}
											>
												Semua (24)
											</button>
											{FONT_CATEGORIES.map((cat) => (
												<button
													key={cat.id}
													type="button"
													onClick={() => setFontCategoryFilter(cat.id)}
													className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
														fontCategoryFilter === cat.id ? "bg-violet-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
													}`}
												>
													{cat.name.id}
												</button>
											))}
										</div>
									</div>

									{/* Font Grid */}
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
										{FONT_PRESETS.filter((font) => {
											const matchCat = fontCategoryFilter === "all" || font.category === fontCategoryFilter;
											const matchSearch = !fontSearch || font.name.toLowerCase().includes(fontSearch.toLowerCase());
											return matchCat && matchSearch;
										}).map((font) => {
											const isSelected = (appearance.font_family_id || "inter") === font.id;
											return (
												<button
													key={font.id}
													type="button"
													onClick={() => {
														const updated: AppearanceRecord = {
															...appearance,
															font_family_id: font.id,
														};
														setAppearance(updated);
														markUnpublished();
														saveDraftAppearanceDirectly(updated);
														showToast(`Font diubah ke ${font.name}`, "info");
													}}
													className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
														isSelected
															? "bg-violet-950/40 border-violet-500 shadow-md ring-1 ring-violet-500"
															: "bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950"
													}`}
												>
													<div>
														<div className="flex items-center justify-between mb-1">
															<h4 className="text-xs font-bold text-white">{font.name}</h4>
															{isSelected && (
																<span className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">
																	✓
																</span>
															)}
														</div>
														<span className="text-[10px] text-violet-300 capitalize font-medium">
															{font.category}
														</span>
													</div>
													<div
														className="text-sm text-slate-200 py-2 px-2.5 rounded-lg bg-slate-900 border border-slate-800/80 truncate"
														style={{ fontFamily: font.cssFontFamily }}
													>
														Aa Bb Gg 123
													</div>
												</button>
											);
										})}
									</div>
								</div>
							)}

							{/* 5. Background & Media Subtab */}
							{appearanceSubTab === "media" && (
								<div className="flex flex-col gap-6">
							{/* 2. Fullscreen Background Panel */}
							<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
								<h3 className="text-sm font-bold text-white mb-1">Latar Belakang Layar Penuh (Fixed Background)</h3>
								<p className="text-xs text-slate-400 mb-4">
									Pilih antara gradient mesh aurora beranimasi, gambar statis, atau video berulang (muted, loop, playsInline).
								</p>

								{/* Background Type Switcher */}
								<div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-4 max-w-md">
									{(["gradient", "image", "video"] as const).map((type) => (
										<button
											key={type}
											type="button"
											onClick={() => {
												setAppearance((prev) => ({ ...prev, background_type: type }));
												markUnpublished();
											}}
											className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
												appearance.background_type === type
													? "bg-violet-600 text-white shadow-sm"
													: "text-slate-400 hover:text-slate-200"
											}`}
										>
											{type === "gradient" ? "Gradient Mesh" : type === "image" ? "Gambar Kustom" : "Video Kustom"}
										</button>
									))}
								</div>

								{/* Background: Gradient Mesh Details */}
								{appearance.background_type === "gradient" && (
									<div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between mb-4">
										<div>
											<div className="text-xs font-bold text-white">Animasi Aurora Mesh</div>
											<div className="text-[11px] text-slate-400">
												Menggerakkan lapisan gradien warna secara perlahan di latar belakang.
											</div>
										</div>
										<button
											type="button"
											onClick={() => {
												setAppearance((prev) => ({
													...prev,
													background_animation: prev.background_animation ? 0 : 1,
												}));
												markUnpublished();
											}}
											className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
												appearance.background_animation
													? "bg-emerald-950 text-emerald-300 border border-emerald-800"
													: "bg-slate-800 text-slate-400 border border-slate-700"
											}`}
										>
											{appearance.background_animation ? "Aktif" : "Nonaktif"}
										</button>
									</div>
								)}

								{/* Background: Custom Image Details */}
								{appearance.background_type === "image" && (
									<div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
										<div className="flex items-center gap-3">
											{appearance.background_src ? (
												<img
													src={appearance.background_src}
													alt="Latar belakang"
													className="w-16 h-12 rounded-lg object-cover border border-slate-700"
												/>
											) : (
												<div className="w-16 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-500">
													Kosong
												</div>
											)}
											<div>
												<div className="text-xs font-bold text-white">
													{appearance.background_src ? "Gambar Latar Terpilih" : "Belum Ada Gambar Terpilih"}
												</div>
												<div className="text-[11px] text-slate-400">Mendukung JPEG, PNG, WebP, AVIF hingga 15 MiB.</div>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => handleOpenMediaLibrary("background")}
												className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors cursor-pointer"
											>
												Pilih dari R2
											</button>
											{appearance.background_src && (
												<button
													type="button"
													onClick={() => handleRemoveMedia("background")}
													className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
												>
													Hapus
												</button>
											)}
										</div>
									</div>
								)}

								{/* Background: Custom Video Details */}
								{appearance.background_type === "video" && (
									<div className="flex flex-col gap-3 mb-4">
										<div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
											<div className="flex items-center gap-3">
												{appearance.background_src ? (
													<video
														src={appearance.background_src}
														muted
														className="w-16 h-12 rounded-lg object-cover border border-slate-700"
													/>
												) : (
													<div className="w-16 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-500">
														Video
													</div>
												)}
												<div>
													<div className="text-xs font-bold text-white">
														{appearance.background_src ? "Video Latar Terpilih" : "Belum Ada Video Terpilih"}
													</div>
													<div className="text-[11px] text-slate-400">Mendukung MP4 dan WebM hingga 50 MiB.</div>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<button
													type="button"
													onClick={() => handleOpenMediaLibrary("background")}
													className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors cursor-pointer"
												>
													Pilih Video R2
												</button>
												{appearance.background_src && (
													<button
														type="button"
														onClick={() => handleRemoveMedia("background")}
														className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
													>
														Hapus
													</button>
												)}
											</div>
										</div>

										{/* Poster Fallback Image */}
										<div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
											<div>
												<div className="text-xs font-semibold text-slate-300">Poster Fallback Video (Opsional)</div>
												<div className="text-[11px] text-slate-400">
													Ditampilkan sebelum video dimuat atau di perangkat dengan mode hemat daya.
												</div>
											</div>
											<div className="flex items-center gap-2">
												<button
													type="button"
													onClick={() => handleOpenMediaLibrary("background_poster")}
													className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
												>
													{appearance.background_poster ? "Ganti Poster" : "Pilih Poster"}
												</button>
												{appearance.background_poster && (
													<button
														type="button"
														onClick={() => handleRemoveMedia("background_poster")}
														className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
													>
														✕
													</button>
												)}
											</div>
										</div>
									</div>
								)}

								{/* Positioning & Overlay Controls */}
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
									<div>
										<label className="flex justify-between text-xs text-slate-300 font-medium mb-1">
											<span>Posisi X</span>
											<span className="font-mono text-slate-400">{Math.round(appearance.background_position_x ?? 50)}%</span>
										</label>
										<input
											type="range"
											min={0}
											max={100}
											value={appearance.background_position_x ?? 50}
											onChange={(e) => {
												setAppearance({ ...appearance, background_position_x: Number(e.target.value) });
												markUnpublished();
											}}
											className="w-full accent-violet-500"
										/>
									</div>

									<div>
										<label className="flex justify-between text-xs text-slate-300 font-medium mb-1">
											<span>Posisi Y</span>
											<span className="font-mono text-slate-400">{Math.round(appearance.background_position_y ?? 50)}%</span>
										</label>
										<input
											type="range"
											min={0}
											max={100}
											value={appearance.background_position_y ?? 50}
											onChange={(e) => {
												setAppearance({ ...appearance, background_position_y: Number(e.target.value) });
												markUnpublished();
											}}
											className="w-full accent-violet-500"
										/>
									</div>

									<div>
										<label className="flex justify-between text-xs text-slate-300 font-medium mb-1">
											<span>Skala / Zoom</span>
											<span className="font-mono text-slate-400">{(appearance.background_scale ?? 1.0).toFixed(1)}x</span>
										</label>
										<input
											type="range"
											min={0.5}
											max={2.5}
											step={0.1}
											value={appearance.background_scale ?? 1.0}
											onChange={(e) => {
												setAppearance({ ...appearance, background_scale: Number(e.target.value) });
												markUnpublished();
											}}
											className="w-full accent-violet-500"
										/>
									</div>

									<div>
										<label className="flex justify-between text-xs text-slate-300 font-medium mb-1">
											<span>Kecerahan Latar</span>
											<span className="font-mono text-slate-400">{(appearance.background_brightness ?? 1.0).toFixed(1)}x</span>
										</label>
										<input
											type="range"
											min={0.5}
											max={1.5}
											step={0.05}
											value={appearance.background_brightness ?? 1.0}
											onChange={(e) => {
												setAppearance({ ...appearance, background_brightness: Number(e.target.value) });
												markUnpublished();
											}}
											className="w-full accent-violet-500"
										/>
									</div>

									<div className="sm:col-span-2">
										<label className="flex justify-between text-xs text-slate-300 font-medium mb-1">
											<span>Opasitas Overlay Pelindung Keterbacaan</span>
											<span className="font-mono text-slate-400">{Math.round((appearance.background_overlay_opacity ?? 0.45) * 100)}%</span>
										</label>
										<input
											type="range"
											min={0}
											max={1}
											step={0.05}
											value={appearance.background_overlay_opacity ?? 0.45}
											onChange={(e) => {
												setAppearance({ ...appearance, background_overlay_opacity: Number(e.target.value) });
												markUnpublished();
											}}
											className="w-full accent-violet-500"
										/>
									</div>
								</div>
							</div>

							{/* 3. Cover Banner Panel */}
							<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
								<div className="flex items-center justify-between mb-4">
									<div>
										<h3 className="text-sm font-bold text-white">Banner Cover</h3>
										<p className="text-xs text-slate-400">
											Banner panoramik yang melayang anggun di atas kartu profil Liquid Glass.
										</p>
									</div>
									<button
										type="button"
										onClick={() => {
											setAppearance((prev) => ({
												...prev,
												cover_enabled: prev.cover_enabled ? 0 : 1,
											}));
											markUnpublished();
										}}
										className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
											appearance.cover_enabled
												? "bg-emerald-950 text-emerald-300 border border-emerald-800"
												: "bg-slate-800 text-slate-400 border border-slate-700"
										}`}
									>
										{appearance.cover_enabled ? "Aktif" : "Nonaktif"}
									</button>
								</div>

								{Boolean(appearance.cover_enabled) && (
									<div className="flex flex-col gap-4 pt-3 border-t border-slate-800">
										{/* Automatic Style-Driven Cover Geometry Note */}
										<div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
											<div className="w-6 h-6 rounded-lg bg-violet-950/80 border border-violet-700/50 flex items-center justify-center text-xs text-violet-300 shrink-0 mt-0.5">
												📐
											</div>
											<div className="text-xs text-slate-300 leading-relaxed">
												<div className="font-semibold text-white mb-0.5">
													Geometri Cover Otomatis (Style-Driven)
												</div>
												<p className="text-slate-400">
													Proporsi dan tinggi banner cover dikendalikan secara otomatis oleh{" "}
													<button
														type="button"
														onClick={() => setAppearanceSubTab("card")}
														className="text-violet-400 hover:text-violet-300 underline font-semibold cursor-pointer"
													>
														Gaya Kartu Profil
													</button>
													{" "}yang dipilih pada tab Kartu Profil (saat ini:{" "}
													<span className="text-violet-200 font-mono font-medium">
														{PROFILE_CARD_STYLES.find((s) => s.id === (appearance.profile_card_style_id || "immersive-fade"))?.name.id || appearance.profile_card_style_id || "Immersive Fade"}
													</span>
													).
												</p>
											</div>
										</div>

										{/* Custom Media or Specular Fallback */}
										<div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
											<div className="flex items-center gap-3">
												{appearance.cover_url ? (
													<img
														src={appearance.cover_url}
														alt="Banner cover"
														className="w-20 h-10 rounded-lg object-cover border border-slate-700"
													/>
												) : (
													<div className="w-20 h-10 rounded-lg bg-gradient-to-tr from-violet-200/60 via-sky-100/50 to-pink-200/50 border border-white/40 flex items-center justify-center text-[10px] text-slate-800 font-bold">
														Fallback Sheen
													</div>
												)}
												<div>
													<div className="text-xs font-bold text-white">
														{appearance.cover_url ? "Cover Gambar Kustom" : "Liquid Aurora Fallback (Bawaan)"}
													</div>
													<div className="text-[11px] text-slate-400">
														{appearance.cover_url
															? "Gambar cover kustom dari Cloudflare R2"
															: "Efek kilau aurora specular tanpa perlu upload file"}
													</div>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<button
													type="button"
													onClick={() => handleOpenMediaLibrary("cover")}
													className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors cursor-pointer"
												>
													Pilih dari R2
												</button>
												{appearance.cover_url && (
													<button
														type="button"
														onClick={() => handleRemoveMedia("cover")}
														className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
													>
														Gunakan Fallback
													</button>
												)}
											</div>
										</div>
									</div>
								)}
							</div>

							{/* 4. Avatar Media Panel */}
							<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
								<h3 className="text-sm font-bold text-white mb-1">Foto Avatar</h3>
								<p className="text-xs text-slate-400 mb-4">
									Gunakan foto profil kustom berbingkai kaca cair atau biarkan monogram inisial nama Anda tampil secara minimalis.
								</p>

								<div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
									<div className="flex items-center gap-4">
										{profile.avatar_url ? (
											<img
												src={profile.avatar_url}
												alt={profile.name}
												className="w-16 h-16 rounded-full object-cover ring-2 ring-violet-500 shadow-lg"
											/>
										) : (
											<div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-bold text-xl flex items-center justify-center ring-2 ring-violet-400">
												{profile.name[0] || "U"}
											</div>
										)}
										<div>
											<div className="text-xs font-bold text-white">
												{profile.avatar_url ? "Foto Profil Kustom" : "Monogram Inisial Otomatis"}
											</div>
											<div className="text-[11px] text-slate-400">
												Mendukung format JPEG, PNG, WebP, AVIF hingga batas 5 MiB.
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() => handleOpenMediaLibrary("avatar")}
											className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors cursor-pointer"
										>
											Pilih dari R2
										</button>
										{profile.avatar_url && (
											<button
												type="button"
												onClick={() => handleRemoveMedia("avatar")}
												className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
											>
												Gunakan Monogram
											</button>
										)}
									</div>
								</div>
							</div>
							</div>
							)}

							{/* 6. Liquid Glass Subtab */}
							{appearanceSubTab === "glass" && (
							<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
								<h3 className="text-sm font-bold text-white mb-1">Kontrol Material Liquid Glass</h3>
								<p className="text-xs text-slate-400 mb-4">
									Kendalikan intensitas blur optik, tingkat transparansi, garis tepi specular, dan warna aksen tombol.
								</p>

								{/* Accent Color Picker & 16 Presets Engine */}
								<div className="mb-6 pb-5 border-b border-slate-800">
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
										<div>
											<label className="block text-xs font-semibold text-slate-300">
												Warna Aksen Antarmuka (Interface Accent Color)
											</label>
											<p className="text-[11px] text-slate-400">
												Mengatur warna navigasi aktif, badge, tombol aksi utama, ring fokus aksesibilitas, dan indikator interaktif.
											</p>
										</div>
										{/* Reset Accent to Preset Default */}
										{(() => {
											const currentPreset = getThemePreset(appearance.palette);
											const isOverridden =
												appearance.accent_color &&
												appearance.accent_color.toLowerCase() !== currentPreset.tokens.defaultAccent.toLowerCase();
											if (!isOverridden) return null;
											return (
												<button
													type="button"
													onClick={() => {
														setAppearance((prev) => ({
															...prev,
															accent_color: currentPreset.tokens.defaultAccent,
														}));
														markUnpublished();
														showToast(`Aksen dikembalikan ke default preset: ${currentPreset.tokens.defaultAccent}`, "info");
													}}
													className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
												>
													↺ Reset ke Default Preset ({currentPreset.tokens.defaultAccent})
												</button>
											);
										})()}
									</div>

									<div className="flex flex-wrap items-center gap-4 mb-4">
										{/* Color Input Controls */}
										<div className="flex items-center gap-2">
											<input
												type="color"
												value={appearance.accent_color || "#8b5cf6"}
												onChange={(e) => {
													setAppearance({ ...appearance, accent_color: e.target.value });
													markUnpublished();
												}}
												className="w-10 h-10 rounded-xl bg-transparent border border-slate-700 cursor-pointer"
											/>
											<input
												type="text"
												value={appearance.accent_color || "#8b5cf6"}
												onChange={(e) => {
													setAppearance({ ...appearance, accent_color: e.target.value });
													markUnpublished();
												}}
												placeholder="#8B5CF6"
												maxLength={9}
												className="w-28 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono uppercase focus:outline-none focus:border-violet-500"
											/>
										</div>

										{/* Live Contrast Foreground & WCAG Indicator */}
										{(() => {
											const activeHex = appearance.accent_color || "#8b5cf6";
											const fg = getContrastForeground(activeHex);
											return (
												<div
													className="px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold shadow-xs"
													style={{
														backgroundColor: activeHex,
														color: fg,
														borderColor: `${activeHex}50`,
													}}
												>
													<span className="font-extrabold text-sm">Aa</span>
													<span>Teks Kontras Otomatis ({fg === "#ffffff" ? "Putih" : "Gelap"})</span>
													<span className="text-[10px] uppercase font-bold opacity-80 border-l border-current/30 pl-1.5">
														WCAG AA
													</span>
												</div>
											);
										})()}
									</div>

									{/* 16 Accent Color Chips */}
									<div>
										<span className="block text-[11px] font-semibold text-slate-400 mb-2">
											Pilihan Cepat Palet Aksen (16 Warna Terkurasi):
										</span>
										<div className="flex flex-wrap gap-2">
											{ACCENT_PRESETS.map((accent) => {
												const isSelected =
													(appearance.accent_color || "#8b5cf6").toLowerCase() === accent.hex.toLowerCase();
												return (
													<button
														key={accent.id}
														type="button"
														onClick={() => {
															setAppearance({ ...appearance, accent_color: accent.hex });
															markUnpublished();
														}}
														className={`w-7 h-7 rounded-full border transition-all cursor-pointer relative flex items-center justify-center ${
															isSelected
																? "ring-2 ring-white scale-110 shadow-md border-white"
																: "border-white/20 hover:scale-110 hover:border-white/50 opacity-90 hover:opacity-100"
														}`}
														style={{ backgroundColor: accent.hex }}
														title={`${accent.name.id} (${accent.hex})`}
													>
														{isSelected && (
															<span
																className="w-2 h-2 rounded-full"
																style={{ backgroundColor: getContrastForeground(accent.hex) }}
															/>
														)}
													</button>
												);
											})}
										</div>
									</div>
								</div>

								{/* Sliders Grid */}
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
									<div>
										<label className="flex justify-between text-xs text-slate-300 font-medium mb-1">
											<span>Blur Optik Kaca</span>
											<span className="font-mono text-slate-400">{appearance.glass_blur || "16px"}</span>
										</label>
										<input
											type="range"
											min={8}
											max={32}
											value={parseInt(appearance.glass_blur || "16", 10)}
											onChange={(e) => {
												setAppearance({ ...appearance, glass_blur: `${e.target.value}px` });
												markUnpublished();
											}}
											className="w-full accent-violet-500"
										/>
									</div>

									<div>
										<label className="flex justify-between text-xs text-slate-300 font-medium mb-1">
											<span>Opasitas Kaca Cair</span>
											<span className="font-mono text-slate-400">{Math.round((appearance.glass_opacity ?? 0.70) * 100)}%</span>
										</label>
										<input
											type="range"
											min={0.4}
											max={0.95}
											step={0.05}
											value={appearance.glass_opacity ?? 0.70}
											onChange={(e) => {
												setAppearance({ ...appearance, glass_opacity: Number(e.target.value) });
												markUnpublished();
											}}
											className="w-full accent-violet-500"
										/>
									</div>

									<div>
										<label className="flex justify-between text-xs text-slate-300 font-medium mb-1">
											<span>Opasitas Border Specular</span>
											<span className="font-mono text-slate-400">{Math.round((appearance.glass_border_opacity ?? 0.30) * 100)}%</span>
										</label>
										<input
											type="range"
											min={0.1}
											max={0.6}
											step={0.05}
											value={appearance.glass_border_opacity ?? 0.30}
											onChange={(e) => {
												setAppearance({ ...appearance, glass_border_opacity: Number(e.target.value) });
												markUnpublished();
											}}
											className="w-full accent-violet-500"
										/>
									</div>
								</div>
							</div>
							)}
						</div>
					)}

					{/* =========================================================================
					    EXPLORE EDITOR (PHASE 4)
					    ========================================================================= */}
					{activeSection === "explore" && (
						<div className="flex flex-col gap-6">
							<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
									<div>
										<h2 className="text-lg font-bold text-white">Editor Explore Showcase (Draft)</h2>
										<p className="text-xs text-slate-400">
											Kelola item konten modular (Galeri, Foto, Video, Musik, Game, Review, Portofolio Proyek, Catatan, Tautan, dan Blok Kustom).
										</p>
									</div>
									<div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
										<button
											type="button"
											onClick={() => {
												setEditingCategory(null);
												setCategoryForm({ id: "", name_id: "", name_en: "", icon: "folder", color: "#8b5cf6", is_enabled: true });
												setIsCategoryModalOpen(true);
											}}
											className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-all border border-slate-700 cursor-pointer flex items-center gap-1.5"
										>
											<span>📁 Kelola Kategori</span>
											<span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] text-slate-300">
												{categories.length}
											</span>
										</button>
										<button
											type="button"
											onClick={handleOpenAddExplore}
											className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
										>
											<span>+ Tambah Item Explore</span>
										</button>
									</div>
								</div>

								{/* Filters & Search */}
								<div className="flex flex-col sm:flex-row gap-3 mb-6">
									<div className="flex-1 relative">
										<input
											type="text"
											placeholder="Cari item explore berdasarkan judul atau deskripsi..."
											value={exploreSearchQuery}
											onChange={(e) => setExploreSearchQuery(e.target.value)}
											className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
										/>
									</div>
									<div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
										{[
											{ id: "all", label: "Semua" },
											...categories.map((c) => ({ id: c.id, label: c.name_id })),
										].map((cat) => (
											<button
												key={cat.id}
												type="button"
												onClick={() => setExploreFilterType(cat.id)}
												className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all cursor-pointer ${
													exploreFilterType === cat.id
														? "bg-violet-600 text-white"
														: "bg-slate-800 text-slate-400 hover:text-slate-200"
												}`}
											>
												{cat.label}
											</button>
										))}
									</div>
								</div>

								{/* Explore Items List */}
								{(() => {
									const filtered = exploreItems.filter((item) => {
										const matchesType = exploreFilterType === "all" || item.category === exploreFilterType || item.type === exploreFilterType;
										const matchesQuery =
											!exploreSearchQuery ||
											item.title_id.toLowerCase().includes(exploreSearchQuery.toLowerCase()) ||
											item.title_en.toLowerCase().includes(exploreSearchQuery.toLowerCase()) ||
											(item.description_id && item.description_id.toLowerCase().includes(exploreSearchQuery.toLowerCase()));
										return matchesType && matchesQuery;
									});

									if (filtered.length === 0) {
										return (
											<div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl p-6">
												<div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-violet-400 flex items-center justify-center mx-auto mb-3">
													<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
													</svg>
												</div>
												<p className="text-sm font-semibold text-slate-300 mb-1">
													{exploreItems.length === 0 ? "Belum ada item Explore di draft." : "Tidak ada item Explore yang cocok dengan filter."}
												</p>
												<p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
													{exploreItems.length === 0
														? "Tambahkan portofolio, foto galeri, video, atau musik untuk memperkaya profil publik Anda."
														: "Coba ubah kata kunci pencarian atau pilih kategori Semua."}
												</p>
												{exploreItems.length === 0 && (
													<button
														type="button"
														onClick={handleOpenAddExplore}
														className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors cursor-pointer"
													>
														+ Tambah Item Explore Pertama
													</button>
												)}
											</div>
										);
									}

									return (
										<div className="flex flex-col gap-3">
											{filtered.map((item) => {
												const realIndex = exploreItems.findIndex((x) => x.id === item.id);
												return (
													<div
														key={item.id}
														className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
															item.is_enabled
																? "bg-slate-950 border-slate-800 hover:border-slate-700"
																: "bg-slate-950/50 border-slate-850 opacity-60"
														}`}
													>
														{/* Left: Reorder, Thumbnail & Content Details */}
														<div className="flex items-center gap-3 min-w-0">
															{/* Reorder Up / Down */}
															<div className="flex flex-col gap-1 shrink-0">
																<button
																	type="button"
																	disabled={realIndex === 0}
																	onClick={() => handleMoveExplore(realIndex, "up")}
																	className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
																	title="Pindahkan ke atas"
																>
																	<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
																	</svg>
																</button>
																<button
																	type="button"
																	disabled={realIndex === exploreItems.length - 1}
																	onClick={() => handleMoveExplore(realIndex, "down")}
																	className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
																	title="Pindahkan ke bawah"
																>
																	<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
																	</svg>
																</button>
															</div>

															{/* Thumbnail */}
															{item.cover_image ? (
																<div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
																	<img
																		src={item.cover_image}
																		alt={item.title_id}
																		className="w-full h-full object-cover"
																		loading="lazy"
																	/>
																</div>
															) : (
																<div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0 uppercase font-mono text-xs font-bold">
																	{item.type.slice(0, 3)}
																</div>
															)}

															{/* Text Info */}
															<div className="min-w-0">
																<div className="flex items-center gap-2 mb-1 flex-wrap">
																	<span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-violet-950 text-violet-300 border border-violet-800">
																		{item.type}
																	</span>
																	{item.badge_id && (
																		<span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
																			{item.badge_id}
																		</span>
																	)}
																	{!item.is_enabled && (
																		<span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-950 text-rose-300 border border-rose-800">
																			Nonaktif
																		</span>
																	)}
																</div>
																<h3 className="text-sm font-bold text-white truncate">
																	{item.title_id}
																</h3>
																{item.subtitle_id && (
																	<p className="text-xs text-slate-400 truncate">
																		{item.subtitle_id}
																	</p>
																)}
																{item.url && (
																	<a
																		href={item.url}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="text-[11px] text-violet-400 hover:underline truncate block max-w-xs mt-0.5"
																	>
																		{item.url}
																	</a>
																)}
															</div>
														</div>

														{/* Right: Actions */}
														<div className="flex items-center gap-2 self-end sm:self-center shrink-0">
															<button
																type="button"
																onClick={() => handleToggleExploreVisibility(item)}
																className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
																	item.is_enabled
																		? "bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800"
																		: "bg-slate-800 hover:bg-slate-700 text-slate-400"
																}`}
																title={item.is_enabled ? "Klik untuk menonaktifkan" : "Klik untuk mengaktifkan"}
															>
																{item.is_enabled ? "Aktif" : "Nonaktif"}
															</button>
															<button
																type="button"
																onClick={() => handleDuplicateExplore(item)}
																className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
																title="Duplikasi item ini"
															>
																<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
																</svg>
															</button>
															<button
																type="button"
																onClick={() => handleOpenEditExplore(item)}
																className="p-1.5 rounded-lg bg-slate-800 hover:bg-violet-600 hover:text-white text-slate-300 text-xs transition-colors cursor-pointer"
																title="Edit item ini"
															>
																<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
																</svg>
															</button>
															<button
																type="button"
																onClick={() => {
																	setDeletingExplore(item);
																	setIsDeleteExploreOpen(true);
																}}
																className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs transition-colors cursor-pointer"
																title="Hapus item ini"
															>
																<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
																</svg>
															</button>
														</div>
													</div>
												);
											})}
										</div>
									);
								})()}
							</div>
						</div>
					)}

					{/* =========================================================================
					    SECTION: CLICK MONITOR & WEBSITE VISITOR ANALYTICS
					    ========================================================================= */}
					{activeSection === "clicks" && (
						<div className="space-y-6">
							{/* Header Bar */}
							<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
								<div>
									<div className="flex items-center gap-2 mb-1">
										<span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
										<h2 className="text-lg sm:text-xl font-bold text-white">
											Click Monitor & Website Visitor Analytics
										</h2>
									</div>
									<p className="text-xs sm:text-sm text-slate-400">
										Telemetri real-time terdistribusi Cloudflare D1. Privasi terjamin tanpa pelacakan cookie, tanpa IP, dan penyaringan bot otomatis.
									</p>
								</div>

								<div className="flex flex-wrap items-center gap-2">
									{/* Range Filter Pills */}
									<div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
										{(
											[
												{ id: "today", label: "Hari Ini" },
												{ id: "7d", label: "7 Hari" },
												{ id: "30d", label: "30 Hari" },
												{ id: "all", label: "Semua" },
											] as const
										).map((r) => (
											<button
												key={r.id}
												type="button"
												onClick={() => fetchAnalytics(r.id)}
												disabled={isLoadingAnalytics}
												className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
													analyticsRange === r.id
														? "bg-violet-600 text-white shadow-sm"
														: "text-slate-400 hover:text-white"
												}`}
											>
												{r.label}
											</button>
										))}
									</div>

									{/* Refresh Button */}
									<button
										type="button"
										onClick={() => fetchAnalytics(analyticsRange)}
										disabled={isLoadingAnalytics}
										title="Muat Ulang Analitik"
										className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
									>
										<svg
											className={`w-4 h-4 ${isLoadingAnalytics ? "animate-spin text-violet-400" : ""}`}
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
											/>
										</svg>
									</button>

									{/* Reset Clicks Button */}
									<button
										type="button"
										onClick={() => setIsResetAnalyticsOpen(true)}
										className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 hover:text-rose-100 text-xs font-semibold transition-colors cursor-pointer"
									>
										Reset Klik
									</button>
								</div>
							</div>

							{/* =========================================================================
							    PART A: WEBSITE VISITOR TELEMETRY
							    ========================================================================= */}
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
											</svg>
										</span>
										<h3 className="text-sm font-bold text-white uppercase tracking-wider">
											Statistik Kunjungan Website (Visitor Telemetry)
										</h3>
									</div>
									<span className="text-xs text-slate-400 font-mono">
										Total Sepanjang Waktu: <strong className="text-indigo-300">{analyticsData?.visitors?.totalPageViewsAllTime ?? 0}</strong>
									</span>
								</div>

								{/* 4 Visitor Metric Cards */}
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
									<div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
										<div className="flex items-center justify-between text-slate-400 mb-2">
											<span className="text-xs font-semibold uppercase tracking-wider">Kunjungan ({analyticsRange})</span>
											<span className="p-1.5 rounded-lg bg-indigo-950/60 text-indigo-400">
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
												</svg>
											</span>
										</div>
										<div className="text-2xl sm:text-3xl font-extrabold text-white">
											{analyticsData?.visitors?.totalPageViewsPeriod ?? 0}
										</div>
										<div className="text-[11px] text-slate-500 mt-2">
											Total Page Views dalam periode
										</div>
									</div>

									<div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
										<div className="flex items-center justify-between text-slate-400 mb-2">
											<span className="text-xs font-semibold uppercase tracking-wider">Kunjungan Hari Ini</span>
											<span className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400">
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
											</span>
										</div>
										<div className="text-2xl sm:text-3xl font-extrabold text-white">
											{analyticsData?.visitors?.todayPageViews ?? 0}
										</div>
										<div className="text-[11px] text-slate-500 mt-2">
											Sejak pukul 00:00 UTC hari ini
										</div>
									</div>

									<div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
										<div className="flex items-center justify-between text-slate-400 mb-2">
											<span className="text-xs font-semibold uppercase tracking-wider">Pengunjung Unik (Est.)</span>
											<span className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-400">
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
												</svg>
											</span>
										</div>
										<div className="text-2xl sm:text-3xl font-extrabold text-white">
											{analyticsData?.visitors?.uniqueVisitorSessions ?? 0}
										</div>
										<div className="text-[11px] text-slate-500 mt-2">
											Sesi browser unik aman privasi
										</div>
									</div>

									<div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
										<div className="flex items-center justify-between text-slate-400 mb-2">
											<span className="text-xs font-semibold uppercase tracking-wider">7 Hari Terakhir</span>
											<span className="p-1.5 rounded-lg bg-purple-950/60 text-purple-400">
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
												</svg>
											</span>
										</div>
										<div className="text-2xl sm:text-3xl font-extrabold text-white">
											{analyticsData?.visitors?.last7DaysPageViews ?? 0}
										</div>
										<div className="text-[11px] text-slate-500 mt-2">
											30 hari: {analyticsData?.visitors?.last30DaysPageViews ?? 0} kunjungan
										</div>
									</div>
								</div>

								{/* Page Breakdown & Visitor Trend Charts */}
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
									{/* Page Breakdown */}
									<div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
										<div className="flex items-center justify-between mb-4">
											<div>
												<h4 className="text-sm font-bold text-white">Rincian Kunjungan Halaman</h4>
												<p className="text-xs text-slate-400">Distribusi penayangan per rute halaman</p>
											</div>
											<span className="text-xs text-slate-400 font-mono">
												{analyticsData?.visitors?.totalPageViewsPeriod ?? 0} Views
											</span>
										</div>

										{(() => {
											const breakdown = analyticsData?.visitors?.pageBreakdown || [];
											const pageLabels: Record<string, { label: string; icon: string; color: string; barColor: string }> = {
												home: { label: "Beranda (Home & Bio)", icon: "🏠", color: "text-emerald-400", barColor: "bg-emerald-500" },
												explore: { label: "Eksplorasi (Showcase)", icon: "✨", color: "text-violet-400", barColor: "bg-violet-500" },
												contact: { label: "Kontak (Contact)", icon: "💬", color: "text-amber-400", barColor: "bg-amber-500" },
											};

											if (breakdown.length === 0) {
												return (
													<div className="h-36 flex items-center justify-center text-xs text-slate-500 italic border border-slate-800 rounded-2xl">
														Belum ada penayangan halaman pada periode ini.
													</div>
												);
											}

											return (
												<div className="space-y-3.5 pt-1">
													{breakdown.map((item) => {
														const meta = pageLabels[item.page] || {
															label: item.page,
															icon: "📄",
															color: "text-slate-300",
															barColor: "bg-slate-500",
														};
														return (
															<div key={item.page} className="space-y-1.5">
																<div className="flex items-center justify-between text-xs">
																	<span className="font-semibold text-white flex items-center gap-1.5">
																		<span>{meta.icon}</span>
																		<span>{meta.label}</span>
																	</span>
																	<span className="font-mono text-slate-300">
																		<strong className="text-white">{item.views}</strong> views ({item.percentage}%)
																	</span>
																</div>
																<div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
																	<div
																		className={`h-full rounded-full transition-all duration-500 ${meta.barColor}`}
																		style={{ width: `${Math.max(item.percentage, item.views > 0 ? 3 : 0)}%` }}
																	/>
																</div>
															</div>
														);
													})}
												</div>
											);
										})()}
									</div>

									{/* Visitor Daily Trend Chart */}
									<div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
										<div className="flex items-center justify-between mb-4">
											<div>
												<h4 className="text-sm font-bold text-white">Tren Kunjungan Harian</h4>
												<p className="text-xs text-slate-400">Frekuensi page views harian</p>
											</div>
											<div className="text-xs text-slate-400 font-mono">
												{analyticsData?.visitors?.timeSeries?.reduce((acc, curr) => acc + curr.clicks, 0) ?? 0} Views
											</div>
										</div>

										{(() => {
											const series = analyticsData?.visitors?.timeSeries || [];
											const maxViews = Math.max(...series.map((s) => s.clicks), 1);

											if (series.length === 0) {
												return (
													<div className="h-36 flex items-center justify-center text-xs text-slate-500 italic border border-slate-800 rounded-2xl">
														Belum ada data kunjungan harian untuk ditampilkan.
													</div>
												);
											}

											return (
												<div className="h-40 pt-4 flex flex-col justify-end">
													<div className="flex items-end gap-1.5 sm:gap-2 h-28 w-full">
														{series.map((item, idx) => {
															const heightPercent = Math.max((item.clicks / maxViews) * 100, item.clicks > 0 ? 8 : 4);
															return (
																<div
																	key={idx}
																	className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
																>
																	<span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
																		{item.clicks}
																	</span>
																	<div
																		className="w-full rounded-t-lg transition-all duration-300 relative group-hover:brightness-125"
																		style={{
																			height: `${heightPercent}%`,
																			background: item.clicks > 0
																				? "linear-gradient(to top, #3b82f6, #60a5fa)"
																				: "#1e293b",
																		}}
																	>
																		<div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
																			{item.clicks} kunjungan
																		</div>
																	</div>
																	<span className="text-[10px] text-slate-500 whitespace-nowrap">
																		{item.label}
																	</span>
																</div>
															);
														})}
													</div>
												</div>
											);
										})()}
									</div>
								</div>
							</div>

							{/* =========================================================================
							    PART B: LINK CLICKS & INTERACTION MONITOR
							    ========================================================================= */}
							<div className="pt-2 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="p-1.5 rounded-lg bg-violet-950/80 border border-violet-800/60 text-violet-400">
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
										</svg>
									</span>
									<h3 className="text-sm font-bold text-white uppercase tracking-wider">
										Interaksi & Klik Terpadu (Click Monitor V4.1)
									</h3>
								</div>
								<span className="text-xs text-slate-400 font-mono">
									Total Sepanjang Waktu: <strong className="text-violet-300">{analyticsData?.totalInteractionsAllTime ?? (analyticsData?.totalAllTime ?? 0)}</strong>
								</span>
							</div>

							{/* 4 Metric Cards: Total Interactions, Link Clicks, Explore Clicks, Contact Clicks */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
								{/* 1. Total Interaksi */}
								<div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
									<div className="flex items-center justify-between text-slate-400 mb-2">
										<span className="text-xs font-semibold uppercase tracking-wider">Total Interaksi ({analyticsRange})</span>
										<span className="p-1.5 rounded-lg bg-violet-950/60 text-violet-400">
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
											</svg>
										</span>
									</div>
									<div className="text-2xl sm:text-3xl font-extrabold text-white">
										{analyticsData?.totalInteractionsPeriod ?? (analyticsData?.totalClicksPeriod ?? 0)}
									</div>
									<div className="text-[11px] text-slate-500 mt-2">
										Akumulasi tautan & navigasi seksi
									</div>
								</div>

								{/* 2. Klik Tautan */}
								<div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
									<div className="flex items-center justify-between text-slate-400 mb-2">
										<span className="text-xs font-semibold uppercase tracking-wider">Klik Tautan (Links)</span>
										<span className="p-1.5 rounded-lg bg-blue-950/60 text-blue-400">
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
											</svg>
										</span>
									</div>
									<div className="text-2xl sm:text-3xl font-extrabold text-white">
										{analyticsData?.linkClicksPeriod ?? (analyticsData?.totalClicksPeriod ?? 0)}
									</div>
									<div className="text-[11px] text-slate-500 mt-2">
										{analyticsData?.activeLinksCount ?? 0} tautan aktif di bio
									</div>
								</div>

								{/* 3. Klik Navigasi Explore */}
								<div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
									<div className="flex items-center justify-between text-slate-400 mb-2">
										<span className="text-xs font-semibold uppercase tracking-wider">Klik Eksplorasi (Explore)</span>
										<span className="p-1.5 rounded-lg bg-pink-950/60 text-pink-400">
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										</span>
									</div>
									<div className="text-2xl sm:text-3xl font-extrabold text-white">
										{analyticsData?.exploreClicksPeriod ?? 0}
									</div>
									<div className="text-[11px] text-slate-500 mt-2">
										Interaksi & kunjungan tab Explore
									</div>
								</div>

								{/* 4. Klik Navigasi Contact */}
								<div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
									<div className="flex items-center justify-between text-slate-400 mb-2">
										<span className="text-xs font-semibold uppercase tracking-wider">Klik Kontak (Contact)</span>
										<span className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400">
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
											</svg>
										</span>
									</div>
									<div className="text-2xl sm:text-3xl font-extrabold text-white">
										{analyticsData?.contactClicksPeriod ?? 0}
									</div>
									<div className="text-[11px] text-slate-500 mt-2">
										Interaksi & kunjungan tab Kontak
									</div>
								</div>
							</div>

							{/* Daily Activity Chart */}
							<div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
								<div className="flex items-center justify-between mb-4">
									<div>
										<h3 className="text-sm font-bold text-white">Aktivitas Tren Interaksi Harian</h3>
										<p className="text-xs text-slate-400">Frekuensi klik tautan dan eksplorasi pengunjung per hari</p>
									</div>
									<div className="text-xs text-slate-400 font-mono">
										Total {analyticsData?.timeSeries?.reduce((acc, curr) => acc + curr.clicks, 0) ?? 0} interaksi
									</div>
								</div>

								{(() => {
									const series = analyticsData?.timeSeries || [];
									const maxClicks = Math.max(...series.map((s) => s.clicks), 1);

									if (series.length === 0) {
										return (
											<div className="h-40 flex items-center justify-center text-xs text-slate-500 italic">
												Belum ada data tren harian untuk ditampilkan.
											</div>
										);
									}

									return (
										<div className="pt-6 pb-2">
											<div className="h-44 flex items-end gap-2 sm:gap-4 overflow-x-auto pb-4 border-b border-slate-800">
												{series.map((item, idx) => {
													const heightPercent = Math.max(item.clicks > 0 ? 12 : 3, Math.round((item.clicks / maxClicks) * 100));
													return (
														<div
															key={idx}
															className="flex-1 min-w-[2.2rem] flex flex-col items-center gap-2 group h-full justify-end"
														>
															<span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
																{item.clicks}
															</span>
															<div
																className="w-full rounded-t-lg transition-all duration-300 relative group-hover:brightness-125"
																style={{
																	height: `${heightPercent}%`,
																	background: item.clicks > 0
																		? "linear-gradient(to top, #7c3aed, #a78bfa)"
																		: "#1e293b",
																}}
															>
																<div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
																	{item.clicks} interaksi
																</div>
															</div>
															<span className="text-[10px] text-slate-500 whitespace-nowrap">
																{item.label}
															</span>
														</div>
													);
												})}
											</div>
										</div>
									);
								})()}
							</div>

							{/* Link Performance Breakdown & First-Party URLs */}
							<div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
									<div>
										<h3 className="text-sm font-bold text-white">Peringkat & Performa Tautan</h3>
										<p className="text-xs text-slate-400">
											Rincian klik dan tautan first-party redirect (<code className="text-violet-400">/go/:linkId</code>)
										</p>
									</div>
									<span className="text-xs text-slate-500">
										{analyticsData?.linkBreakdown?.length ?? 0} tautan terdaftar
									</span>
								</div>

								{(!analyticsData?.linkBreakdown || analyticsData.linkBreakdown.length === 0) ? (
									<div className="p-8 text-center text-xs text-slate-500 italic border border-slate-800 rounded-2xl">
										Belum ada data tautan aktif di database.
									</div>
								) : (
									<div className="space-y-3">
										{analyticsData.linkBreakdown.map((item, idx) => {
											const redirectUrl = typeof window !== "undefined"
												? `${window.location.origin}/go/${item.linkId}`
												: `/go/${item.linkId}`;

											return (
												<div
													key={item.linkId}
													className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
												>
													<div className="flex items-start gap-3 min-w-0 flex-1">
														<div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
															#{idx + 1}
														</div>
														<div className="min-w-0 flex-1">
															<div className="flex items-center gap-2 mb-0.5">
																<h4 className="text-xs sm:text-sm font-bold text-white truncate">
																	{item.titleId || item.titleEn}
																</h4>
																{item.platform && (
																	<span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-violet-950/60 text-violet-300 border border-violet-800/50">
																		{item.platform}
																	</span>
																)}
															</div>
															<div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 truncate">
																<a
																	href={item.url}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="hover:text-violet-400 truncate max-w-xs"
																>
																	{item.url}
																</a>
																<span>•</span>
																<span className="font-mono text-[11px] text-violet-400">
																	/go/{item.linkId}
																</span>
															</div>
														</div>
													</div>

													<div className="flex items-center gap-4 shrink-0">
														<button
															type="button"
															onClick={() => copyToClipboard(redirectUrl, "URL Pengalihan")}
															className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
														>
															<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
															</svg>
															<span>Salin /go</span>
														</button>

														<div className="text-right min-w-[5rem]">
															<div className="text-sm font-extrabold text-white">
																{item.clicks} <span className="text-xs font-normal text-slate-400">klik</span>
															</div>
															<div className="text-[11px] text-slate-500 font-mono">
																{item.percentage}%
															</div>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>

							{/* Top Referrers */}
							<div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
								<h3 className="text-sm font-bold text-white mb-1">Sumber Lalu Lintas (Top Referrers)</h3>
								<p className="text-xs text-slate-400 mb-4">
									Domain asal klik teratas yang telah disanitasi demi privasi pengunjung.
								</p>

								{(!analyticsData?.topReferrers || analyticsData.topReferrers.length === 0) ? (
									<div className="p-6 text-center text-xs text-slate-500 italic border border-slate-800 rounded-2xl">
										Belum ada sumber lalu lintas rujukan tercatat.
									</div>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
										{analyticsData.topReferrers.map((ref, idx) => (
											<div
												key={idx}
												className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
											>
												<div className="flex items-center gap-2 min-w-0">
													<span className="w-2 h-2 rounded-full bg-violet-400" />
													<span className="text-xs font-semibold text-white truncate font-mono">
														{ref.referrer}
													</span>
												</div>
												<div className="text-right shrink-0">
													<span className="text-xs font-bold text-violet-300">
														{ref.clicks} klik
													</span>
													<span className="text-[10px] text-slate-500 ml-1">
														({ref.percentage}%)
													</span>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					)}

					{/* =========================================================================
					    SECTION: SETTINGS & SYSTEM STATUS (PHASE 6)
					    ========================================================================= */}
					{activeSection === "settings" && (
						<div className="space-y-6">
							{/* Header Bar */}
							<div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
								<div className="flex items-center gap-2 mb-1">
									<span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
									<h2 className="text-lg sm:text-xl font-bold text-white">
										Pengaturan & Status Sistem
									</h2>
								</div>
								<p className="text-xs sm:text-sm text-slate-400">
									Informasi runtime server, konektivitas database Cloudflare D1, penyimpanan aset R2, dan versi publikasi.
								</p>
							</div>

							{/* System Overview Cards */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
								<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
									<div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
										Database D1
									</div>
									<div className="text-lg font-bold text-white flex items-center gap-2">
										<span className={`w-2.5 h-2.5 rounded-full ${isDbReady ? "bg-emerald-500" : "bg-rose-500"}`} />
										<span>{isDbReady ? "Siap / Terhubung" : "Tidak Terhubung"}</span>
									</div>
									<div className="text-xs text-slate-500 mt-2">
										{database?.tablesCount ?? 0} tabel terdaftar
									</div>
								</div>

								<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
									<div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
										Lingkungan Runtime
									</div>
									<div className="text-lg font-bold text-white uppercase font-mono">
										{loaderData.envMode || "production"}
									</div>
									<div className="text-xs text-slate-500 mt-2">
										React Router v7 / Workers SSR
									</div>
								</div>

								<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
									<div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
										Status Publikasi
									</div>
									<div className="text-lg font-bold text-emerald-400 font-mono">
										Aktif
									</div>
									<div className="text-xs text-slate-500 mt-2">
										{hasUnpublished ? "Draft belum diterbitkan" : "Sinkron dengan publik"}
									</div>
								</div>

								<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
									<div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
										Admin Terautentikasi
									</div>
									<div className="text-sm font-bold text-white truncate" title={user.email}>
										{user.email}
									</div>
									<div className="text-xs text-slate-500 mt-2">
										Metode: {user.identityType}
									</div>
								</div>
							</div>

							{/* D1 Tables & Row Counts */}
							<div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
								<h3 className="text-sm font-bold text-white mb-1">Tabel Database Cloudflare D1</h3>
								<p className="text-xs text-slate-400 mb-4">
									Daftar tabel relasional schema D1 beserta jumlah record yang tersimpan.
								</p>

								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
									{(database?.tables || []).map((tbl) => (
										<div
											key={tbl.name}
											className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
										>
											<div className="flex items-center gap-2">
												<span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
												<span className="text-xs font-mono font-semibold text-slate-200">
													{tbl.name}
												</span>
											</div>
											<span className="text-xs font-bold font-mono text-violet-300">
												{tbl.rows} baris
											</span>
										</div>
									))}
								</div>
							</div>

							{/* Self-Hosted Architecture & Security Audit Info */}
							<div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
								<h3 className="text-sm font-bold text-white">Panduan Arsitektur & Keamanan Self-Hosted</h3>

								<div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
									<div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
										<div className="font-semibold text-white mb-1">🔐 Cloudflare Access Email OTP Guard</div>
										<p className="text-xs text-slate-400">
											Rute administrasi <code className="text-violet-400">/studio</code> dan seluruh API mutasi (<code className="text-violet-400">/api/studio/*</code>) dilindungi secara server-side oleh header <code className="text-slate-300">Cf-Access-Jwt-Assertion</code> dengan fail-closed gate.
										</p>
									</div>

									<div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
										<div className="font-semibold text-white mb-1">🛡️ Anti-Open-Redirect & CSRF Protection</div>
										<p className="text-xs text-slate-400">
											Sistem first-party redirect <code className="text-violet-400">/go/:linkId</code> memvalidasi skema protokol secara ketat (hanya http/https/mailto/tel) dan menolak skema berbahaya (javascript:, data:).
										</p>
									</div>

									<div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
										<div className="font-semibold text-white mb-1">✨ Static Fallback Zero-Downtime</div>
										<p className="text-xs text-slate-400">
											Website publik secara otomatis menggunakan fallback data TypeScript netral (<code className="text-slate-300">app/data/profile.ts</code>) apabila koneksi D1 mengalami gangguan jaringan atau saat pertama kali di-fork.
										</p>
									</div>
								</div>
							</div>
						</div>
					)}
				</main>
			</div>

			{/* =========================================================================
			    MODALS: ADD / EDIT LINK
			    ========================================================================= */}
			{(isAddLinkOpen || isEditLinkOpen) && (
				<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
					<div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl my-8">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-base font-bold text-white">
								{isAddLinkOpen ? "Tambah Tautan Baru" : "Edit Tautan"}
							</h3>
							<button
								type="button"
								onClick={() => {
									setIsAddLinkOpen(false);
									setIsEditLinkOpen(false);
								}}
								className="text-slate-400 hover:text-white text-sm cursor-pointer"
							>
								✕
							</button>
						</div>

						<form onSubmit={isAddLinkOpen ? handleSaveNewLink : handleSaveEditLink} className="flex flex-col gap-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label htmlFor="lf-title-id" className="block text-xs font-semibold text-slate-300 mb-1">
										Judul (Indonesia) <span className="text-rose-400">*</span>
									</label>
									<input
										id="lf-title-id"
										type="text"
										required
										value={linkForm.title_id}
										onChange={(e) => setLinkForm({ ...linkForm, title_id: e.target.value })}
										placeholder="Portfolio Utama"
										className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
									/>
								</div>
								<div>
									<label htmlFor="lf-title-en" className="block text-xs font-semibold text-slate-300 mb-1">
										Title (English) <span className="text-rose-400">*</span>
									</label>
									<input
										id="lf-title-en"
										type="text"
										required
										value={linkForm.title_en}
										onChange={(e) => setLinkForm({ ...linkForm, title_en: e.target.value })}
										placeholder="Primary Portfolio"
										className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
									/>
								</div>
							</div>

							<div>
								<label htmlFor="lf-url" className="block text-xs font-semibold text-slate-300 mb-1">
									URL Tujuan <span className="text-rose-400">*</span>
								</label>
								<input
									id="lf-url"
									type="text"
									required
									value={linkForm.url}
									onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
									placeholder="https://example.com"
									className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none font-mono"
								/>
								<p className="text-[11px] text-slate-500 mt-1">
									Hanya protokol <code>https:</code>, <code>http:</code>, <code>mailto:</code>, atau <code>tel:</code> yang diizinkan demi keamanan.
								</p>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label htmlFor="lf-desc-id" className="block text-xs font-semibold text-slate-300 mb-1">
										Deskripsi (ID, opsional)
									</label>
									<input
										id="lf-desc-id"
										type="text"
										value={linkForm.description_id}
										onChange={(e) => setLinkForm({ ...linkForm, description_id: e.target.value })}
										placeholder="Koleksi karya pilihan"
										className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
									/>
								</div>
								<div>
									<label htmlFor="lf-desc-en" className="block text-xs font-semibold text-slate-300 mb-1">
										Description (EN, optional)
									</label>
									<input
										id="lf-desc-en"
										type="text"
										value={linkForm.description_en}
										onChange={(e) => setLinkForm({ ...linkForm, description_en: e.target.value })}
										placeholder="Selected works"
										className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-4">
								<div>
									<label htmlFor="lf-platform" className="block text-xs font-semibold text-slate-300 mb-1">
										Platform / Tipe Layanan
									</label>
									<select
										id="lf-platform"
										value={linkForm.platform}
										onChange={(e) => {
											const newPlatform = e.target.value;
											setLinkForm((prev) => ({
												...prev,
												platform: newPlatform,
												icon: prev.icon_type === "preset" ? getRecommendedIcon(newPlatform) : prev.icon,
											}));
										}}
										className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
									>
										<option value="website">Website / Portfolio</option>
										<option value="github">GitHub</option>
										<option value="linkedin">LinkedIn</option>
										<option value="twitter">Twitter / X</option>
										<option value="instagram">Instagram</option>
										<option value="youtube">YouTube</option>
										<option value="discord">Discord</option>
										<option value="tiktok">TikTok</option>
										<option value="facebook">Facebook</option>
										<option value="threads">Threads</option>
										<option value="bluesky">Bluesky</option>
										<option value="reddit">Reddit</option>
										<option value="twitch">Twitch</option>
										<option value="pinterest">Pinterest</option>
										<option value="whatsapp">WhatsApp</option>
										<option value="telegram">Telegram</option>
										<option value="email">Email</option>
										<option value="phone">Telepon</option>
										<option value="spotify">Spotify / Audio</option>
										<option value="custom">Lainnya / Custom</option>
									</select>
								</div>

								{/* Custom Icon System */}
								<div>
									<label className="block text-xs font-semibold text-slate-300 mb-1.5">
										Ikon Tautan (Preset Library, Upload R2, atau URL Eksternal)
									</label>
									<IconPicker
										platform={linkForm.platform}
										iconType={linkForm.icon_type}
										icon={linkForm.icon}
										iconUrl={linkForm.icon_url}
										iconMediaId={linkForm.icon_media_id}
										onChange={(updates) =>
											setLinkForm((prev) => ({
												...prev,
												...updates,
											}))
										}
										onError={(msg) => showToast(msg, "error")}
									/>
								</div>
							</div>

							<div className="flex items-center gap-2 mt-1">
								<input
									id="lf-enabled"
									type="checkbox"
									checked={linkForm.is_enabled}
									onChange={(e) => setLinkForm({ ...linkForm, is_enabled: e.target.checked })}
									className="w-4 h-4 rounded text-violet-600 focus:ring-0 focus:outline-none bg-slate-950 border-slate-700"
								/>
								<label htmlFor="lf-enabled" className="text-xs text-slate-300 font-medium cursor-pointer">
									Aktifkan tautan ini secara langsung di draft
								</label>
							</div>

							<div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
								<button
									type="button"
									onClick={() => {
										setIsAddLinkOpen(false);
										setIsEditLinkOpen(false);
									}}
									className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
								>
									Batal
								</button>
								<button
									type="submit"
									className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors cursor-pointer"
								>
									{isAddLinkOpen ? "Simpan ke Draft" : "Perbarui Draft"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* =========================================================================
			    MODALS: DELETE LINK CONFIRMATION
			    ========================================================================= */}
			{isDeleteLinkOpen && deletingLink && (
				<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
						<h3 className="text-base font-bold text-white mb-2">Hapus Tautan?</h3>
						<p className="text-xs sm:text-sm text-slate-400 mb-4 leading-relaxed">
							Anda yakin ingin menghapus tautan <strong className="text-white">"{deletingLink.title_id || deletingLink.title_en}"</strong> dari draft? Tindakan ini akan dicatat sebagai perubahan belum terbit.
						</p>
						<div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
							<button
								type="button"
								onClick={() => {
									setIsDeleteLinkOpen(false);
									setDeletingLink(null);
								}}
								className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={handleConfirmDeleteLink}
								className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
							>
								Ya, Hapus Tautan
							</button>
						</div>
					</div>
				</div>
			)}

			{/* =========================================================================
			    MODALS: ADD / EDIT CONTACT
			    ========================================================================= */}
			{(isAddContactOpen || isEditContactOpen) && (
				<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
					<div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl my-8">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-base font-bold text-white">
								{isAddContactOpen ? "Tambah Metode Kontak Baru" : "Edit Metode Kontak"}
							</h3>
							<button
								type="button"
								onClick={() => {
									setIsAddContactOpen(false);
									setIsEditContactOpen(false);
								}}
								className="text-slate-400 hover:text-white text-sm cursor-pointer"
							>
								✕
							</button>
						</div>

						<form onSubmit={isAddContactOpen ? handleSaveNewContact : handleSaveEditContact} className="flex flex-col gap-4">
							<div>
								<label htmlFor="cf-platform" className="block text-xs font-semibold text-slate-300 mb-1">
									Platform Kontak <span className="text-rose-400">*</span>
								</label>
								<select
									id="cf-platform"
									value={contactForm.platform}
									onChange={(e) => handlePlatformChange(e.target.value)}
									className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
								>
									<option value="whatsapp">WhatsApp</option>
									<option value="telegram">Telegram</option>
									<option value="email">Email</option>
									<option value="instagram">Instagram Direct</option>
									<option value="custom">Custom / Lainnya</option>
								</select>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label htmlFor="cf-label-id" className="block text-xs font-semibold text-slate-300 mb-1">
										Label (Indonesia) <span className="text-rose-400">*</span>
									</label>
									<input
										id="cf-label-id"
										type="text"
										required
										value={contactForm.label_id}
										onChange={(e) => setContactForm({ ...contactForm, label_id: e.target.value })}
										placeholder="Chat WhatsApp"
										className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
									/>
								</div>
								<div>
									<label htmlFor="cf-label-en" className="block text-xs font-semibold text-slate-300 mb-1">
										Label (English) <span className="text-rose-400">*</span>
									</label>
									<input
										id="cf-label-en"
										type="text"
										required
										value={contactForm.label_en}
										onChange={(e) => setContactForm({ ...contactForm, label_en: e.target.value })}
										placeholder="WhatsApp Chat"
										className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
									/>
								</div>
							</div>

							<div>
								<label htmlFor="cf-value" className="block text-xs font-semibold text-slate-300 mb-1">
									Nilai Kontak / Handle / Nomor <span className="text-rose-400">*</span>
								</label>
								<input
									id="cf-value"
									type="text"
									required
									value={contactForm.value}
									onChange={(e) => handleContactValueChange(e.target.value)}
									placeholder={
										contactForm.platform === "whatsapp"
											? "+6281234567890"
											: contactForm.platform === "email"
											? "name@example.com"
											: "@username"
									}
									className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
								/>
							</div>

							<div>
								<label htmlFor="cf-url" className="block text-xs font-semibold text-slate-300 mb-1">
									URL Target Klik (Auto-generate / Manual) <span className="text-rose-400">*</span>
								</label>
								<input
									id="cf-url"
									type="text"
									required
									value={contactForm.url}
									onChange={(e) => setContactForm({ ...contactForm, url: e.target.value })}
									placeholder="https://wa.me/..."
									className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none font-mono"
								/>
							</div>

							<div className="flex items-center gap-2 mt-1">
								<input
									id="cf-enabled"
									type="checkbox"
									checked={contactForm.is_enabled}
									onChange={(e) => setContactForm({ ...contactForm, is_enabled: e.target.checked })}
									className="w-4 h-4 rounded text-violet-600 focus:ring-0 focus:outline-none bg-slate-950 border-slate-700"
								/>
								<label htmlFor="cf-enabled" className="text-xs text-slate-300 font-medium cursor-pointer">
									Aktifkan metode kontak ini di draft
								</label>
							</div>

							<div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
								<button
									type="button"
									onClick={() => {
										setIsAddContactOpen(false);
										setIsEditContactOpen(false);
									}}
									className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
								>
									Batal
								</button>
								<button
									type="submit"
									className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors cursor-pointer"
								>
									{isAddContactOpen ? "Simpan ke Draft" : "Perbarui Draft"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* =========================================================================
			    MODALS: DELETE CONTACT CONFIRMATION
			    ========================================================================= */}
			{isDeleteContactOpen && deletingContact && (
				<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
						<h3 className="text-base font-bold text-white mb-2">Hapus Metode Kontak?</h3>
						<p className="text-xs sm:text-sm text-slate-400 mb-4 leading-relaxed">
							Anda yakin ingin menghapus <strong className="text-white">"{deletingContact.label_id || deletingContact.platform}"</strong> ({deletingContact.value}) dari draft? Tindakan ini akan dicatat sebagai perubahan belum terbit.
						</p>
						<div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
							<button
								type="button"
								onClick={() => {
									setIsDeleteContactOpen(false);
									setDeletingContact(null);
								}}
								className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={handleConfirmDeleteContact}
								className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
							>
								Ya, Hapus Kontak
							</button>
						</div>
					</div>
				</div>
			)}

			{/* =========================================================================
			    MODALS: ADD / EDIT EXPLORE ITEM (PHASE 4)
			    ========================================================================= */}
			{(isAddExploreOpen || isEditExploreOpen) && (
				<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
					<div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl my-8">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-base font-bold text-white">
								{isAddExploreOpen ? "Tambah Item Explore Baru" : "Edit Item Explore"}
							</h3>
							<button
								type="button"
								onClick={() => {
									setIsAddExploreOpen(false);
									setIsEditExploreOpen(false);
									setEditingExplore(null);
								}}
								className="text-slate-400 hover:text-white text-sm cursor-pointer"
							>
								✕
							</button>
						</div>

						<form onSubmit={isAddExploreOpen ? handleSaveNewExplore : handleSaveEditExplore} className="flex flex-col gap-4">
							{/* 1. Content Type Selector */}
							<div>
								<label htmlFor="ef-type" className="block text-xs font-semibold text-slate-300 mb-1">
									Tipe Konten Modular <span className="text-rose-400">*</span>
								</label>
								<select
									id="ef-type"
									value={exploreForm.type}
									onChange={(e) => setExploreForm({ ...exploreForm, type: e.target.value as ExploreBlockType })}
									className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
								>
									<option value="project">Proyek (Portfolio Project)</option>
									<option value="gallery">Galeri Multi-Foto (Multi-Photo Showcase)</option>
									<option value="image">Foto Tunggal (Single Artwork)</option>
									<option value="video">Video (Video Player / Embed)</option>
									<option value="music">Musik (Audio Track / Playlist)</option>
									<option value="game">Game (Interactive Demo / Game)</option>
									<option value="review">Review (Media Review / Book)</option>
									<option value="note">Catatan (Announcement / Note)</option>
									<option value="link">Tautan (External Feature Link)</option>
									<option value="custom">Kustom (Custom Flexible Block)</option>
								</select>
							</div>

							{/* 2. Category & Subcategory Selector (Phase 6) */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
								<div>
									<div className="flex items-center justify-between mb-1">
										<label htmlFor="ef-category" className="block text-xs font-semibold text-slate-300">
											Kategori
										</label>
										<button
											type="button"
											onClick={() => {
												setEditingCategory(null);
												setCategoryForm({ id: "", name_id: "", name_en: "", icon: "folder", color: "#8b5cf6", is_enabled: true });
												setIsCategoryModalOpen(true);
											}}
											className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
										>
											+ Kelola Kategori
										</button>
									</div>
									<select
										id="ef-category"
										value={exploreForm.category}
										onChange={(e) => setExploreForm({ ...exploreForm, category: e.target.value, subcategory_id: "" })}
										className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-violet-500 focus:outline-none"
									>
										<option value="all">Semua / Umum (General)</option>
										{categories.map((cat) => (
											<option key={cat.id} value={cat.id}>
												{cat.name_id} ({cat.name_en})
											</option>
										))}
									</select>
								</div>
							</div>

							{/* 3. Localized Title & Subtitle */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label htmlFor="ef-title-id" className="block text-xs font-semibold text-slate-300 mb-1">
										Judul (Indonesia) <span className="text-rose-400">*</span>
									</label>
									<input
										id="ef-title-id"
										type="text"
										required
										value={exploreForm.title_id}
										onChange={(e) => setExploreForm({ ...exploreForm, title_id: e.target.value })}
										placeholder="e.g. Desain Dashboard Liquid Glass"
										className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
									/>
								</div>
								<div>
									<label htmlFor="ef-title-en" className="block text-xs font-semibold text-slate-300 mb-1">
										Title (English)
									</label>
									<input
										id="ef-title-en"
										type="text"
										value={exploreForm.title_en}
										onChange={(e) => setExploreForm({ ...exploreForm, title_en: e.target.value })}
										placeholder="e.g. Liquid Glass Dashboard Design"
										className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label htmlFor="ef-subtitle-id" className="block text-xs font-semibold text-slate-300 mb-1">
										Subjudul / Keterangan Singkat (ID)
									</label>
									<input
										id="ef-subtitle-id"
										type="text"
										value={exploreForm.subtitle_id}
										onChange={(e) => setExploreForm({ ...exploreForm, subtitle_id: e.target.value })}
										placeholder="e.g. Desain UI Eksperimental"
										className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
									/>
								</div>
								<div>
									<label htmlFor="ef-subtitle-en" className="block text-xs font-semibold text-slate-300 mb-1">
										Subtitle (EN)
									</label>
									<input
										id="ef-subtitle-en"
										type="text"
										value={exploreForm.subtitle_en}
										onChange={(e) => setExploreForm({ ...exploreForm, subtitle_en: e.target.value })}
										placeholder="e.g. Experimental UI Design"
										className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
									/>
								</div>
							</div>

							{/* Localized Description */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label htmlFor="ef-desc-id" className="block text-xs font-semibold text-slate-300 mb-1">
										Deskripsi Lengkap (ID)
									</label>
									<textarea
										id="ef-desc-id"
										rows={2}
										value={exploreForm.description_id}
										onChange={(e) => setExploreForm({ ...exploreForm, description_id: e.target.value })}
										placeholder="Ringkasan proyek atau konten..."
										className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
									/>
								</div>
								<div>
									<label htmlFor="ef-desc-en" className="block text-xs font-semibold text-slate-300 mb-1">
										Description (EN)
									</label>
									<textarea
										id="ef-desc-en"
										rows={2}
										value={exploreForm.description_en}
										onChange={(e) => setExploreForm({ ...exploreForm, description_en: e.target.value })}
										placeholder="Project or content summary..."
										className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
									/>
								</div>
							</div>

							{/* 4. Media Sampul & Gallery Manager (Phase 3 & Phase 8) */}
							<div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3">
								<div>
									<label htmlFor="ef-cover" className="block text-xs font-semibold text-slate-300 mb-1">
										Gambar Sampul Utama (Cover Image)
									</label>
									<div className="flex gap-2">
										<input
											id="ef-cover"
											type="text"
											value={exploreForm.cover_image}
											onChange={(e) => setExploreForm({ ...exploreForm, cover_image: e.target.value })}
											placeholder="/api/public/media/... atau https://..."
											className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-violet-500 focus:outline-none"
										/>
										<button
											type="button"
											onClick={() => handleOpenMediaLibrary("explore_cover")}
											className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold whitespace-nowrap cursor-pointer shadow-sm"
										>
											Pilih Media R2
										</button>
									</div>
									{exploreForm.cover_image && (
										<div className="mt-2.5 flex items-center gap-3">
											<div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
												<img
													src={exploreForm.cover_image}
													alt="Sampul"
													className="w-full h-full object-cover"
												/>
											</div>
											<span className="text-[11px] text-slate-400">Sampul aktif saat ini</span>
										</div>
									)}
								</div>

								{/* Multi-Photo Gallery Showcase Manager */}
								{(exploreForm.type === "gallery" || (exploreForm.photos && exploreForm.photos.length > 0)) && (
									<div className="pt-3 border-t border-slate-800">
										<div className="flex items-center justify-between mb-2">
											<div>
												<span className="text-xs font-bold text-pink-400 uppercase tracking-wider block">
													Koleksi Foto Galeri ({exploreForm.photos?.length || 0} Foto)
												</span>
												<p className="text-[11px] text-slate-400">
													Foto-foto ini akan tampil di galeri geser (slideshow lightbox) publik.
												</p>
											</div>
											<button
												type="button"
												onClick={() => handleOpenMediaLibrary("gallery_photo")}
												className="px-2.5 py-1.5 rounded-lg bg-pink-950/70 border border-pink-700/60 hover:bg-pink-900 text-pink-200 text-xs font-semibold cursor-pointer flex items-center gap-1 shadow-sm"
											>
												<span>+ Tambah Foto</span>
											</button>
										</div>

										{exploreForm.photos && exploreForm.photos.length > 0 ? (
											<div className="flex flex-col gap-2 mt-2 max-h-56 overflow-y-auto pr-1">
												{exploreForm.photos.map((photo, idx) => {
													const isCover = exploreForm.cover_image === photo.url;
													return (
														<div
															key={idx}
															className={`p-2.5 rounded-xl border flex items-center gap-3 ${
																isCover
																	? "bg-violet-950/40 border-violet-600/70"
																	: "bg-slate-900 border-slate-800"
															}`}
														>
															<div className="w-12 h-10 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-950">
																<img
																	src={photo.url}
																	alt={`Foto ${idx + 1}`}
																	className="w-full h-full object-cover"
																/>
															</div>
															<div className="flex-1 min-w-0">
																<input
																	type="text"
																	value={photo.caption || ""}
																	onChange={(e) => {
																		const val = e.target.value;
																		setExploreForm((prev) => ({
																			...prev,
																			photos: prev.photos.map((p, pIdx) =>
																				pIdx === idx ? { ...p, caption: val } : p
																			),
																		}));
																	}}
																	placeholder="Keterangan foto (opsional)..."
																	className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-500"
																/>
															</div>

															{/* Controls */}
															<div className="flex items-center gap-1 shrink-0">
																{isCover ? (
																	<span className="text-[10px] font-bold text-violet-300 bg-violet-950 px-2 py-0.5 rounded border border-violet-800">
																		Sampul
																	</span>
																) : (
																	<button
																		type="button"
																		onClick={() => {
																			setExploreForm((prev) => ({ ...prev, cover_image: photo.url }));
																			showToast("Foto ini dijadikan gambar sampul.", "info");
																		}}
																		className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
																	>
																		Jadikan Sampul
																	</button>
																)}

																{/* Reorder Buttons */}
																<button
																	type="button"
																	disabled={idx === 0}
																	onClick={() => {
																		setExploreForm((prev) => {
																			const copy = [...prev.photos];
																			const temp = copy[idx - 1];
																			copy[idx - 1] = copy[idx];
																			copy[idx] = temp;
																			return { ...prev, photos: copy };
																		});
																	}}
																	className="text-xs text-slate-400 hover:text-white disabled:opacity-30 px-1 cursor-pointer"
																	title="Geser ke atas"
																>
																	▲
																</button>
																<button
																	type="button"
																	disabled={idx === exploreForm.photos.length - 1}
																	onClick={() => {
																		setExploreForm((prev) => {
																			const copy = [...prev.photos];
																			const temp = copy[idx + 1];
																			copy[idx + 1] = copy[idx];
																			copy[idx] = temp;
																			return { ...prev, photos: copy };
																		});
																	}}
																	className="text-xs text-slate-400 hover:text-white disabled:opacity-30 px-1 cursor-pointer"
																	title="Geser ke bawah"
																>
																	▼
																</button>

																{/* Remove Button */}
																<button
																	type="button"
																	onClick={() => {
																		setExploreForm((prev) => ({
																			...prev,
																			photos: prev.photos.filter((_, pIdx) => pIdx !== idx),
																		}));
																	}}
																	className="text-xs text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded hover:bg-rose-950/50 cursor-pointer"
																	title="Hapus foto dari galeri"
																>
																	✕
																</button>
															</div>
														</div>
													);
												})}
											</div>
										) : (
											<p className="text-xs text-slate-500 italic mt-1">
												Belum ada foto dalam galeri ini. Klik "+ Tambah Foto" untuk memilih dari R2.
											</p>
										)}
									</div>
								)}
							</div>

							{/* 5. Tautan Tujuan (URL) */}
							<div>
								<label htmlFor="ef-url" className="block text-xs font-semibold text-slate-300 mb-1">
									Tautan Tujuan (URL Eksternal / Demo / Unduhan)
								</label>
								<input
									id="ef-url"
									type="text"
									value={exploreForm.url}
									onChange={(e) => setExploreForm({ ...exploreForm, url: e.target.value })}
									placeholder="https://..."
									className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none font-mono"
								/>
							</div>

							{/* 6. Type-Specific Dynamic Fields & Badges */}
							<div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3">
								<span className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">
									Pengaturan Tambahan ({exploreForm.type})
								</span>

								{(exploreForm.type === "project" || exploreForm.type === "game") && (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<div>
											<label htmlFor="ef-tags" className="block text-xs text-slate-400 mb-1">
												Tags (Pisahkan dengan koma)
											</label>
											<input
												id="ef-tags"
												type="text"
												value={exploreForm.tags}
												onChange={(e) => setExploreForm({ ...exploreForm, tags: e.target.value })}
												placeholder="React, Tailwind, Workers"
												className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
											/>
										</div>
										<div>
											<label htmlFor="ef-year" className="block text-xs text-slate-400 mb-1">
												Tahun Rilis / Versi
											</label>
											<input
												id="ef-year"
												type="text"
												value={exploreForm.year}
												onChange={(e) => setExploreForm({ ...exploreForm, year: e.target.value })}
												placeholder="2026"
												className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
											/>
										</div>
									</div>
								)}

								{(exploreForm.type === "review" || (exploreForm.type as string) === "book") && (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<div>
											<label htmlFor="ef-rating" className="block text-xs text-slate-400 mb-1">
												Skor / Rating (e.g. 4.9/5 atau 9.5)
											</label>
											<input
												id="ef-rating"
												type="text"
												value={exploreForm.rating}
												onChange={(e) => setExploreForm({ ...exploreForm, rating: e.target.value })}
												placeholder="4.9/5"
												className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
											/>
										</div>
										<div>
											<label htmlFor="ef-author" className="block text-xs text-slate-400 mb-1">
												Pencipta / Penulis
											</label>
											<input
												id="ef-author"
												type="text"
												value={exploreForm.artist}
												onChange={(e) => setExploreForm({ ...exploreForm, artist: e.target.value })}
												placeholder="Nama Pengarang"
												className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
											/>
										</div>
									</div>
								)}

								{exploreForm.type === "music" && (
									<div>
										<label htmlFor="ef-artist" className="block text-xs text-slate-400 mb-1">
											Artis / Musisi
										</label>
										<input
											id="ef-artist"
											type="text"
											value={exploreForm.artist}
											onChange={(e) => setExploreForm({ ...exploreForm, artist: e.target.value })}
											placeholder="Nama Artis / Band"
											className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
										/>
									</div>
								)}

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div>
										<label htmlFor="ef-badge-id" className="block text-xs text-slate-400 mb-1">
											Teks Badge ID (Opsional)
										</label>
										<input
											id="ef-badge-id"
											type="text"
											value={exploreForm.badge_id}
											onChange={(e) => setExploreForm({ ...exploreForm, badge_id: e.target.value })}
											placeholder="e.g. Featured, Terbaru, Top Pick"
											className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
										/>
									</div>
									<div>
										<label htmlFor="ef-badge-en" className="block text-xs text-slate-400 mb-1">
											Badge Text EN
										</label>
										<input
											id="ef-badge-en"
											type="text"
											value={exploreForm.badge_en}
											onChange={(e) => setExploreForm({ ...exploreForm, badge_en: e.target.value })}
											placeholder="e.g. Featured, New, Top Pick"
											className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
										/>
									</div>
								</div>
							</div>

							{/* 7. Enabled Switch */}
							<label className="flex items-center gap-2.5 cursor-pointer pt-1">
								<input
									type="checkbox"
									checked={exploreForm.is_enabled}
									onChange={(e) => setExploreForm({ ...exploreForm, is_enabled: e.target.checked })}
									className="w-4 h-4 rounded accent-violet-600 bg-slate-950 border-slate-800"
								/>
								<span className="text-xs font-semibold text-slate-300">
									Tampilkan item ini di halaman Explore publik (Aktif)
								</span>
							</label>

							{/* 8. Actions */}
							<div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
								<button
									type="button"
									onClick={() => {
										setIsAddExploreOpen(false);
										setIsEditExploreOpen(false);
										setEditingExplore(null);
									}}
									className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
								>
									Batal
								</button>
								<button
									type="submit"
									disabled={isSubmittingExplore}
									className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
								>
									{isSubmittingExplore ? "Menyimpan..." : isAddExploreOpen ? "Simpan ke Draft" : "Perbarui Draft"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* =========================================================================
			    MODALS: DELETE EXPLORE CONFIRMATION (PHASE 4)
			    ========================================================================= */}
			{isDeleteExploreOpen && deletingExplore && (
				<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
						<div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800/60 text-rose-400 flex items-center justify-center mb-4">
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
						</div>
						<h3 className="text-lg font-bold text-white mb-2">Hapus Item Explore?</h3>
						<p className="text-xs sm:text-sm text-slate-400 mb-4 leading-relaxed">
							Anda yakin ingin menghapus <strong className="text-white">"{deletingExplore.title_id}"</strong> ({deletingExplore.type}) dari draft Explore? Tindakan ini akan dicatat sebagai perubahan belum terbit.
						</p>
						<div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
							<button
								type="button"
								onClick={() => {
									setIsDeleteExploreOpen(false);
									setDeletingExplore(null);
								}}
								className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={() => handleDeleteExplore(deletingExplore.id)}
								className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
							>
								Ya, Hapus Item
							</button>
						</div>
					</div>
				</div>
			)}

			{/* =========================================================================
			    MODALS: CATEGORY MANAGER (PHASE 2 - SINGLE TIER)
			    ========================================================================= */}
			{isCategoryModalOpen && (
				<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
					<div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl my-8">
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="text-base font-bold text-white">Kelola Kategori Explore</h3>
								<p className="text-xs text-slate-400">Atur kategori satu tingkat untuk menyusun konten Explore. Menghapus kategori akan mengalihkan item ke 'Semua'.</p>
							</div>
							<button
								type="button"
								onClick={() => {
									setIsCategoryModalOpen(false);
									setEditingCategory(null);
								}}
								className="text-slate-400 hover:text-white text-sm cursor-pointer"
							>
								✕
							</button>
						</div>

						{/* Form Tambah / Edit */}
						<form onSubmit={handleSaveCategory} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 mb-5 flex flex-col gap-3">
							<span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
								{editingCategory ? "Edit Kategori" : "+ Tambah Kategori Baru"}
							</span>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label className="block text-xs text-slate-400 mb-1">Nama (ID) *</label>
									<input
										type="text"
										required
										value={categoryForm.name_id}
										onChange={(e) => setCategoryForm({ ...categoryForm, name_id: e.target.value })}
										placeholder="e.g. Karya Desain"
										className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:border-violet-500 focus:outline-none"
									/>
								</div>
								<div>
									<label className="block text-xs text-slate-400 mb-1">Nama (EN)</label>
									<input
										type="text"
										value={categoryForm.name_en}
										onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })}
										placeholder="e.g. Design Works"
										className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:border-violet-500 focus:outline-none"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label className="block text-xs text-slate-400 mb-1">Ikon Kategori</label>
									<select
										value={categoryForm.icon}
										onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
										className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-violet-500 focus:outline-none"
									>
										<option value="folder">📁 Folder / Umum</option>
										<option value="spark">✨ Spark / Unggulan</option>
										<option value="image">🖼 Gambar / Galeri</option>
										<option value="video">🎬 Video</option>
										<option value="music">🎵 Musik</option>
										<option value="gamepad">🎮 Game</option>
										<option value="star">⭐ Ulasan / Review</option>
										<option value="code">💻 Portofolio / Kode</option>
										<option value="bookmark">🔖 Bookmark</option>
										<option value="globe">🌐 Web / Link</option>
										<option value="palette">🎨 Kreatif</option>
									</select>
								</div>
								<div>
									<label className="block text-xs text-slate-400 mb-1">ID Kategori (Slug)</label>
									<input
										type="text"
										value={categoryForm.id}
										disabled={!!editingCategory}
										onChange={(e) => setCategoryForm({ ...categoryForm, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
										placeholder="Otomatis jika kosong"
										className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 disabled:opacity-50 focus:border-violet-500 focus:outline-none"
									/>
								</div>
							</div>

							<div className="flex items-center justify-between gap-3 pt-1">
								<div className="flex items-center gap-3">
									<div className="flex items-center gap-1.5">
										<label className="text-xs text-slate-400">Warna:</label>
										<input
											type="color"
											value={categoryForm.color || "#8b5cf6"}
											onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
											className="w-7 h-7 rounded-lg bg-transparent border border-slate-700 cursor-pointer"
										/>
									</div>
									<label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
										<input
											type="checkbox"
											checked={categoryForm.is_enabled}
											onChange={(e) => setCategoryForm({ ...categoryForm, is_enabled: e.target.checked })}
											className="w-4 h-4 rounded text-violet-600 bg-slate-900 border-slate-700"
										/>
										<span>Aktif</span>
									</label>
								</div>

								<div className="flex items-center gap-2">
									{editingCategory && (
										<button
											type="button"
											onClick={() => {
												setEditingCategory(null);
												setCategoryForm({ id: "", name_id: "", name_en: "", icon: "folder", color: "#8b5cf6", is_enabled: true });
											}}
											className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
										>
											Batal Edit
										</button>
									)}
									<button
										type="submit"
										disabled={isSubmittingCategory}
										className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
									>
										{isSubmittingCategory ? "Menyimpan..." : editingCategory ? "Perbarui" : "Tambah"}
									</button>
								</div>
							</div>
						</form>

						{/* Daftar Kategori */}
						<div>
							<h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
								Daftar Kategori ({categories.length})
							</h4>
							{categories.length === 0 ? (
								<p className="text-xs text-slate-500 italic py-4 text-center">
									Belum ada kategori. Tambahkan kategori pertama di atas.
								</p>
							) : (
								<div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
									{categories.map((cat, idx) => (
										<div
											key={cat.id}
											className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3"
										>
											<div className="flex items-center gap-2.5 min-w-0">
												<div className="flex flex-col gap-0.5 shrink-0">
													<button
														type="button"
														disabled={idx === 0}
														onClick={() => handleReorderCategory(idx, "up")}
														className="text-[10px] text-slate-500 hover:text-slate-200 disabled:opacity-20 cursor-pointer"
														title="Pindah ke Atas"
													>
														▲
													</button>
													<button
														type="button"
														disabled={idx === categories.length - 1}
														onClick={() => handleReorderCategory(idx, "down")}
														className="text-[10px] text-slate-500 hover:text-slate-200 disabled:opacity-20 cursor-pointer"
														title="Pindah ke Bawah"
													>
														▼
													</button>
												</div>
												<span
													className="w-3.5 h-3.5 rounded-full shrink-0"
													style={{ backgroundColor: cat.color || "#8b5cf6" }}
												/>
												<div className="min-w-0">
													<div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
														<span>{cat.name_id}</span>
														{cat.name_en && cat.name_en !== cat.name_id && (
															<span className="text-slate-400 font-normal">({cat.name_en})</span>
														)}
														{cat.is_enabled === 0 && (
															<span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400">Nonaktif</span>
														)}
													</div>
													<span className="text-[10px] text-violet-400 font-mono">
														id: {cat.id} • icon: {cat.icon || "folder"}
													</span>
												</div>
											</div>

											<div className="flex items-center gap-1.5 shrink-0">
												<button
													type="button"
													onClick={() => {
														setEditingCategory(cat);
														setCategoryForm({
															id: cat.id,
															name_id: cat.name_id,
															name_en: cat.name_en,
															icon: cat.icon || "folder",
															color: cat.color || "#8b5cf6",
															is_enabled: cat.is_enabled === 1,
														});
													}}
													className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold cursor-pointer"
												>
													Edit
												</button>
												<button
													type="button"
													onClick={() => handleDeleteCategory(cat.id)}
													className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-[11px] font-semibold cursor-pointer"
												>
													Hapus
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* =========================================================================
			    MODALS: PUBLISH CONFIRMATION
			    ========================================================================= */}
			{isPublishModalOpen && (
				<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
						<div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mb-4">
							<span className="text-xl">🚀</span>
						</div>
						<h3 className="text-lg font-bold text-white mb-2">Terbitkan Seluruh Perubahan?</h3>
						<p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
							Semua perubahan pada profil, tema visual, tata letak, tautan, kontak, dan karya yang tersimpan di ruang kerja draft akan langsung dipromosikan ke pengunjung publik secara atomik.
						</p>
						<div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
							<button
								type="button"
								disabled={isPublishing}
								onClick={() => setIsPublishModalOpen(false)}
								className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
							>
								Batal
							</button>
							<button
								type="button"
								disabled={isPublishing}
								onClick={handlePublishChanges}
								className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
							>
								{isPublishing ? "Menerbitkan..." : "Ya, Terbitkan Sekarang"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* =========================================================================
			    MODALS: DISCARD CONFIRMATION
			    ========================================================================= */}
			{isDiscardModalOpen && (
				<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
						<div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800/60 text-rose-400 flex items-center justify-center mb-4">
							<span className="text-xl">⚠️</span>
						</div>
						<h3 className="text-lg font-bold text-white mb-2">Batalkan Perubahan Draft?</h3>
						<p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
							Semua perubahan yang Anda buat di draft dan belum diterbitkan akan dihapus dan dikembalikan ke versi publik aktif saat ini.
						</p>
						<div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
							<button
								type="button"
								disabled={isDiscarding}
								onClick={() => setIsDiscardModalOpen(false)}
								className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
							>
								Jangan Batalkan
							</button>
							<button
								type="button"
								disabled={isDiscarding}
								onClick={handleDiscardChanges}
								className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
							>
								{isDiscarding ? "Mereset..." : "Ya, Batalkan Semua Draft"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* =========================================================================
			    MODALS: RESET APPEARANCE CONFIRMATION
			    ========================================================================= */}
			{isResetAppearanceOpen && (
				<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
						<div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/60 text-amber-400 flex items-center justify-center mb-4">
							<span className="text-xl">🎨</span>
						</div>
						<h3 className="text-lg font-bold text-white mb-2">Reset Pengaturan Tampilan?</h3>
						<p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
							Tampilan akan dikembalikan ke pengaturan default netral (Frost Aurora, background gradient mesh, Liquid Glass medium). Perubahan ini akan disimpan ke draft.
						</p>
						<div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
							<button
								type="button"
								onClick={() => setIsResetAppearanceOpen(false)}
								className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={handleResetAppearance}
								className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors cursor-pointer"
							>
								Ya, Reset ke Default
							</button>
						</div>
					</div>
				</div>
			)}

			{/* =========================================================================
			    MODALS: RESET ANALYTICS CONFIRMATION (PHASE 5)
			    ========================================================================= */}
			{isResetAnalyticsOpen && (
				<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
						<div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800/50 text-rose-400 flex items-center justify-center mb-4">
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</div>

						<h3 className="text-base font-bold text-white mb-2">Reset Data Analitik?</h3>
						<p className="text-xs sm:text-sm text-slate-400 mb-4 leading-relaxed">
							Pilih target data yang ingin direset pada tabel Cloudflare D1. Data yang telah dihapus tidak dapat dipulihkan kembali.
						</p>

						<div className="grid grid-cols-1 gap-2 mb-6 text-xs">
							{[
								{ id: "all", label: "Semua Data (Kunjungan & Klik)" },
								{ id: "visitors", label: "Hanya Data Kunjungan Website (page_views)" },
								{ id: "clicks", label: "Hanya Data Klik Tautan (click_events)" },
							].map((opt) => (
								<label
									key={opt.id}
									className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
										resetAnalyticsTarget === opt.id
											? "bg-rose-950/40 border-rose-600 text-white"
											: "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
									}`}
								>
									<input
										type="radio"
										name="reset-target"
										value={opt.id}
										checked={resetAnalyticsTarget === opt.id}
										onChange={() => setResetAnalyticsTarget(opt.id as any)}
										className="w-4 h-4 text-rose-600 bg-slate-900 border-slate-700"
									/>
									<span className="font-semibold">{opt.label}</span>
								</label>
							))}
						</div>

						<div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
							<button
								type="button"
								onClick={() => setIsResetAnalyticsOpen(false)}
								disabled={isResettingAnalytics}
								className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={handleResetAnalytics}
								disabled={isResettingAnalytics}
								className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
							>
								{isResettingAnalytics ? "Mereset..." : "Ya, Hapus Semua Klik"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* =========================================================================
			    MODALS: CLOUDFLARE R2 MEDIA LIBRARY
			    ========================================================================= */}
			{isMediaModalOpen && (
				<div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
					<div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl my-6 flex flex-col max-h-[85vh]">
						{/* Header */}
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800">
							<div>
								<div className="flex items-center gap-2">
									<h3 className="text-base font-bold text-white">Media Library (Cloudflare R2)</h3>
									{mediaTarget && (
										<span className="px-2 py-0.5 rounded-md bg-violet-950 border border-violet-800 text-violet-300 text-[10px] uppercase font-bold">
											Target: {mediaTarget}
										</span>
									)}
								</div>
								<p className="text-xs text-slate-400 mt-0.5">
									Pilih file yang sudah ada atau unggah media baru ke penyimpanan R2.
								</p>
							</div>

							<div className="flex items-center gap-2">
								{/* Upload Button */}
								<label
									className={`px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md ${
										isUploadingMedia ? "opacity-50 pointer-events-none" : ""
									}`}
								>
									<span>{isUploadingMedia ? "Mengunggah..." : "+ Upload Media"}</span>
									<input
										type="file"
										accept={
											mediaTarget === "avatar" || mediaTarget === "cover" || mediaTarget === "background_poster"
												? "image/jpeg,image/png,image/webp,image/avif"
												: "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
										}
										onChange={handleUploadFile}
										className="hidden"
									/>
								</label>

								<button
									type="button"
									onClick={() => setIsMediaModalOpen(false)}
									className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs cursor-pointer"
								>
									✕
								</button>
							</div>
						</div>

						{/* Category Filter Tabs */}
						<div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 text-xs">
							{[
								{ id: "all", label: "Semua Kategori" },
								{ id: "avatar", label: "Avatar" },
								{ id: "cover", label: "Cover" },
								{ id: "background", label: "Background" },
							].map((cat) => (
								<button
									key={cat.id}
									type="button"
									onClick={() => {
										setMediaCategoryFilter(cat.id);
										fetchMediaList(cat.id);
									}}
									className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
										mediaCategoryFilter === cat.id
											? "bg-slate-800 text-white border border-slate-700"
											: "text-slate-400 hover:text-slate-200"
									}`}
								>
									{cat.label}
								</button>
							))}
						</div>

						{/* Upload Error Banner */}
						{uploadError && (
							<div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center justify-between">
								<span>{uploadError}</span>
								<button
									type="button"
									onClick={() => setUploadError(null)}
									className="text-rose-400 hover:text-white ml-2 text-sm cursor-pointer"
								>
									✕
								</button>
							</div>
						)}

						{/* Media Asset Grid */}
						<div className="flex-1 overflow-y-auto pr-1">
							{isLoadingMedia ? (
								<div className="py-16 text-center text-xs text-slate-400">
									Memuat koleksi media dari Cloudflare R2...
								</div>
							) : mediaList.length === 0 ? (
								<div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl">
									<p className="text-sm text-slate-400 mb-2">Belum ada file media di kategori ini.</p>
									<p className="text-xs text-slate-500">
										Klik tombol <strong>+ Upload Media</strong> di kanan atas untuk mengunggah.
									</p>
								</div>
							) : (
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
									{mediaList.map((asset) => (
										<div
											key={asset.id}
											className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col group transition-all"
										>
											{/* Preview Area */}
											<div className="h-28 bg-slate-900 relative flex items-center justify-center overflow-hidden">
												{asset.media_type === "image" ? (
													<img
														src={`/api/studio/media/${asset.id}/preview`}
														alt={asset.original_filename}
														className="w-full h-full object-cover"
														loading="lazy"
													/>
												) : (
													<video
														src={`/api/studio/media/${asset.id}/preview`}
														muted
														className="w-full h-full object-cover"
													/>
												)}
												<span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-black/70 text-white backdrop-blur-sm">
													{asset.media_category}
												</span>
												<span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/70 text-slate-300 backdrop-blur-sm">
													{(asset.size_bytes / 1024 / 1024).toFixed(1)} MB
												</span>
											</div>

											{/* Info & Actions */}
											<div className="p-2.5 flex flex-col gap-1.5 flex-1 justify-between">
												<div className="truncate text-xs font-medium text-slate-200" title={asset.original_filename}>
													{asset.original_filename}
												</div>

												<div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
													<button
														type="button"
														onClick={() => handleSelectMedia(asset)}
														className="flex-1 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors cursor-pointer text-center"
													>
														Pilih
													</button>
													<button
														type="button"
														disabled={deletingMediaId === asset.id}
														onClick={() => handleDeleteMedia(asset)}
														className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs transition-colors cursor-pointer"
														title="Hapus media dari R2 & D1"
													>
														{deletingMediaId === asset.id ? "..." : "🗑️"}
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* =========================================================================
			    MODALS: PREVIEW DRAFT (PHONE SIMULATOR)
			    ========================================================================= */}
			{isPreviewOpen && (
				<div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
					<div className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-5 shadow-2xl relative my-6">
						{/* Top bar in modal */}
						<div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
							<div className="flex items-center gap-2">
								<span className="text-xs font-bold text-white uppercase tracking-wider">Preview Draft</span>
								<div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[10px]">
									<button
										type="button"
										onClick={() => setPreviewLang("id")}
										className={`px-2 py-0.5 rounded ${previewLang === "id" ? "bg-violet-600 text-white font-bold" : "text-slate-400"}`}
									>
										ID
									</button>
									<button
										type="button"
										onClick={() => setPreviewLang("en")}
										className={`px-2 py-0.5 rounded ${previewLang === "en" ? "bg-violet-600 text-white font-bold" : "text-slate-400"}`}
									>
										EN
									</button>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setIsPreviewOpen(false)}
								className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs cursor-pointer"
							>
								✕
							</button>
						</div>

						{/* Phone Simulator Body with Real Liquid Glass Theme Engine */}
						{(() => {
							const previewThemeVars = computeThemeVariables(appearance);
							return (
								<div
									className="rounded-[2.2rem] p-4 sm:p-5 flex flex-col items-center max-h-[75vh] overflow-y-auto relative overflow-hidden text-theme-primary transition-all duration-300 shadow-2xl border"
									data-theme={previewThemeVars["--theme-mode"]}
									style={{
										...(previewThemeVars as unknown as React.CSSProperties),
										borderColor: "var(--glass-border-specular)",
									}}
								>
									{/* Live Background Preview in Phone Simulator */}
									<div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
										{appearance.background_type === "gradient" && (
											<div
												className={`w-full h-full ${Boolean(appearance.background_animation) ? "frost-aurora-mesh" : ""}`}
												style={{
													background: "var(--bg-mesh-gradient)",
													filter: `brightness(${appearance.background_brightness ?? 1})`,
												}}
											/>
										)}
										{appearance.background_type === "image" && appearance.background_src && (
											<img
												src={appearance.background_src}
												alt=""
												className="w-full h-full object-cover"
												style={{
													objectPosition: `${appearance.background_position_x ?? 50}% ${appearance.background_position_y ?? 50}%`,
													transform: appearance.background_scale ? `scale(${appearance.background_scale})` : undefined,
													filter: `blur(${appearance.glass_blur || "0px"}) brightness(${appearance.background_brightness ?? 1})`,
												}}
											/>
										)}
										{appearance.background_type === "video" && (
											<div
												className="w-full h-full bg-slate-900 flex items-center justify-center text-xs text-slate-400"
												style={{
													backgroundImage: appearance.background_poster ? `url(${appearance.background_poster})` : undefined,
													backgroundSize: "cover",
												}}
											>
												{!appearance.background_poster && "🎥 Video Background Active"}
											</div>
										)}
										{/* Overlay */}
										<div
											className="absolute inset-0"
											style={{
												backgroundColor: appearance.background_overlay_color || previewThemeVars["--bg-overlay-color"],
												opacity: appearance.background_overlay_opacity ?? parseFloat(previewThemeVars["--bg-overlay-opacity"]),
											}}
										/>
									</div>

									{/* Profile Card Preview with Unified Cover Banner & Overlapping Avatar */}
									<div className="w-full glass-liquid-primary rounded-2xl overflow-hidden flex flex-col items-center text-center mb-4 z-10 shadow-md">
										{/* Cover Banner at top of card */}
										{Boolean(appearance.cover_enabled) && (
											<div className="w-full h-24 relative overflow-hidden z-0">
												{appearance.cover_url ? (
													<img
														src={appearance.cover_url}
														alt="Cover"
														className="w-full h-full object-cover"
													/>
												) : (
													<div className="w-full h-full bg-gradient-to-tr from-violet-200/60 via-sky-100/50 to-pink-200/50 flex items-center justify-center text-[10px] text-slate-800 font-bold">
														Liquid Aurora Sheen
													</div>
												)}
											</div>
										)}

										<div className={`w-full p-4 flex flex-col items-center ${Boolean(appearance.cover_enabled) ? "pt-0" : ""}`}>
											<div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 bg-gradient-to-tr from-white via-[var(--glass-surface-primary)] to-white/70 overflow-hidden shadow-lg ring-4 ring-[var(--glass-surface-primary)] flex items-center justify-center z-20 relative ${Boolean(appearance.cover_enabled) ? "-mt-8 sm:-mt-10 mb-2" : "mb-2"}`}>
												{profile.avatar_url ? (
													<img src={profile.avatar_url} alt={profile.name} className="w-full h-full rounded-full object-cover" />
												) : (
													<div
														className="w-full h-full rounded-full flex items-center justify-center font-bold text-xl sm:text-2xl shadow-inner select-none"
														style={{ backgroundColor: "var(--accent-color)", color: "var(--accent-foreground)" }}
													>
														{profile.name[0] || "?"}
													</div>
												)}
											</div>
											<h4 className="text-base font-bold text-theme-primary">{profile.name || "Nama Pengguna"}</h4>
											<p
												className="text-xs font-semibold px-2 py-0.5 rounded-full border mt-1 bg-theme-accent-subtle"
											>
												{profile.handle || "@handle"}
											</p>
											{(previewLang === "id" ? profile.location_id : profile.location_en) && (
												<span className="text-[11px] text-theme-muted mt-1.5">
													📍 {previewLang === "id" ? profile.location_id : profile.location_en}
												</span>
											)}
											{(previewLang === "id" ? profile.bio_id : profile.bio_en) && (
												<p className="text-xs text-theme-secondary mt-2 leading-relaxed">
													{previewLang === "id" ? profile.bio_id : profile.bio_en}
												</p>
											)}
										</div>
									</div>

									{/* Links Preview */}
									<div className="w-full flex flex-col gap-2 mb-4">
										<div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted px-1">
											Tautan ({links.filter((l) => l.is_enabled).length})
										</div>
										{links.filter((l) => l.is_enabled).length === 0 ? (
											<div className="glass-liquid-card rounded-xl p-3 text-center text-xs text-theme-muted italic">
												Tidak ada tautan aktif.
											</div>
										) : (
											links
												.filter((l) => l.is_enabled)
												.map((l) => (
													<div
														key={l.id}
														className="w-full p-2.5 rounded-xl glass-liquid-card text-left flex items-center justify-between gap-3 group"
													>
														<div className="flex items-center gap-2.5 min-w-0">
															<div className="w-7 h-7 rounded-lg bg-[var(--glass-surface-secondary)] border border-[var(--glass-border-specular)] flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-2xs">
																<LinkIconRenderer link={l} isStudioPreview={true} className="w-4 h-4" />
															</div>
															<span className="text-xs font-semibold text-theme-primary truncate">
																{previewLang === "id" ? l.title_id || l.title_en : l.title_en || l.title_id}
															</span>
														</div>
														<span className="text-xs text-theme-muted group-hover:text-[var(--accent-color)] shrink-0">↗</span>
													</div>
												))
										)}
									</div>

									{/* Contacts Preview */}
									<div className="w-full flex flex-col gap-2">
										<div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted px-1">
											Kontak ({contacts.filter((c) => c.is_enabled).length})
										</div>
										{contacts.filter((c) => c.is_enabled).length === 0 ? (
											<div className="glass-liquid-card rounded-xl p-3 text-center text-xs text-theme-muted italic">
												Tidak ada metode kontak aktif.
											</div>
										) : (
											contacts
												.filter((c) => c.is_enabled)
												.map((c) => (
													<div
														key={c.id}
														className="w-full p-2.5 rounded-xl glass-liquid-card text-left flex items-center justify-between"
													>
														<div className="flex items-center gap-2">
															<span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border bg-theme-accent-subtle">
																{c.platform}
															</span>
															<span className="text-xs font-semibold text-theme-primary">
																{previewLang === "id" ? c.label_id || c.label_en : c.label_en || c.label_id}
															</span>
														</div>
														<span className="text-[11px] text-theme-secondary font-mono">{c.value}</span>
													</div>
												))
										)}
									</div>
								</div>
							);
						})()}
					</div>
				</div>
			)}
		</div>
	);
}
