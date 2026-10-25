import React, { useState, useEffect, useCallback } from "react";
import type { Route } from "./+types/studio";
import { authenticateAdmin } from "../lib/auth.server";
import {
	getDatabaseStatus,
	getProfileRecord,
	getLinks,
	getContactMethods,
	getExploreItems,
	getAppearanceRecord,
	getPublishMetadata,
	type DatabaseStatus,
	type ProfileRecord,
	type LinkRecord,
	type ContactMethodRecord,
	type ExploreItemRecord,
	type ExploreBlockType,
	type AppearanceRecord,
	type PublishMetadataRecord,
} from "../lib/db.server";
import type { MediaAssetRecord } from "../lib/media.server";

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
			publishMetadata: null as PublishMetadataRecord | null,
			envMode: import.meta.env.MODE,
		};
	}

	const [dbStatus, draftProfile, draftLinks, draftContacts, draftExplore, draftAppearance, publishMetadata] = await Promise.all([
		getDatabaseStatus(env?.DB),
		env?.DB ? getProfileRecord(env.DB, "draft") : null,
		env?.DB ? getLinks(env.DB, "draft") : [],
		env?.DB ? getContactMethods(env.DB, "draft") : [],
		env?.DB ? getExploreItems(env.DB, "draft") : [],
		env?.DB ? getAppearanceRecord(env.DB, "draft") : null,
		env?.DB ? getPublishMetadata(env.DB) : null,
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
		draftAppearance,
		publishMetadata,
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
	{ id: "clicks", label: "Click Monitor", badge: "Phase 5" },
	{ id: "settings", label: "Settings", badge: "Phase 6" },
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

	// Links modals & state
	const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
	const [isEditLinkOpen, setIsEditLinkOpen] = useState(false);
	const [editingLink, setEditingLink] = useState<LinkRecord | null>(null);
	const [isDeleteLinkOpen, setIsDeleteLinkOpen] = useState(false);
	const [deletingLink, setDeletingLink] = useState<LinkRecord | null>(null);
	const [linkForm, setLinkForm] = useState({
		title_id: "",
		title_en: "",
		description_id: "",
		description_en: "",
		url: "",
		platform: "website",
		icon: "globe",
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
	const [mediaTarget, setMediaTarget] = useState<"avatar" | "cover" | "background" | "background_poster" | "explore_cover" | null>(null);
	const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>("all");
	const [mediaList, setMediaList] = useState<MediaAssetRecord[]>([]);
	const [isLoadingMedia, setIsLoadingMedia] = useState(false);
	const [isUploadingMedia, setIsUploadingMedia] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);

	// Explore items state (Phase 4)
	const [exploreItems, setExploreItems] = useState<ExploreItemRecord[]>(loaderData.draftExplore || []);
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
		tags: "",
		year: "",
		rating: "",
		artist: "",
		is_enabled: true,
	});

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
			icon: l.icon || "globe",
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
	const handlePublishChanges = async () => {
		setIsPublishing(true);
		try {
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
				showToast(`Berhasil dipublikasikan! Versi v${data.version || 2} kini aktif di web publik.`, "success");
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

	const handleOpenMediaLibrary = (target: "avatar" | "cover" | "background" | "background_poster" | "explore_cover") => {
		setMediaTarget(target);
		const initialCategory = target === "avatar" ? "avatar" : target === "cover" ? "cover" : target === "explore_cover" ? "all" : "background";
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
				cover_image: `/api/studio/media/${asset.id}/preview`,
			}));
		}
		setIsMediaModalOpen(false);
		showToast(`Media berhasil dipilih untuk ${mediaTarget}.`, "success");
	};

	// HANDLERS: EXPLORE EDITOR (PHASE 4)
	// =========================================================================
	const handleOpenAddExplore = () => {
		setExploreForm({
			type: "project",
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

		return {
			type: exploreForm.type,
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
								<span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
									Phase 2
								</span>
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
							{hasUnpublished ? "Ada perubahan draft" : `Terbit v${pubMeta?.version || 1}`}
						</span>
					</div>

					{/* Preview Draft Button */}
					<button
						type="button"
						onClick={() => setIsPreviewOpen(true)}
						className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer shrink-0"
						title="Lihat preview draft sebelum dipublikasikan"
					>
						<span>👁 Preview Draft</span>
					</button>

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
										npx wrangler d1 migrations apply mobio-db --local
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
											{hasUnpublished ? "Draft Menunggu Terbit" : `Versi Aktif v${pubMeta?.version || 1}`}
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
											<span className="text-emerald-400 font-bold text-[10px]">ATOMIC D1</span>
										</div>
										<h3 className="text-base font-bold text-white">Transaksional</h3>
										<p className="text-xs text-slate-400 mt-1 leading-relaxed">
											Draft tersimpan aman di tabel draft tanpa mengubah tampilan pengunjung publik sampai diterbitkan.
										</p>
									</div>
									<div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
										Zero Partial State
									</div>
								</div>
							</div>

							{/* Summary metrics */}
							<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
								<h3 className="text-base font-bold text-white mb-1">Entitas Konten D1 (Draft)</h3>
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

													{/* Platform Icon Badge */}
													<div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 font-mono text-xs uppercase shrink-0">
														{link.platform.substring(0, 3)}
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
								<div className="flex items-center gap-2 self-start sm:self-auto">
									<button
										type="button"
										onClick={() => setIsResetAppearanceOpen(true)}
										className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
									>
										Reset Default
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

							{/* 1. Theme Presets Panel */}
							<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
								<h3 className="text-sm font-bold text-white mb-1">Preset Tema Visual</h3>
								<p className="text-xs text-slate-400 mb-4">
									Pilih salah satu preset tema teruji untuk menerapkan palet warna dan karakteristik Liquid Glass secara instan.
								</p>

								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
									{/* Frost Aurora */}
									<button
										type="button"
										onClick={() => {
											setAppearance((prev) => ({
												...prev,
												palette: "frost-aurora",
												glass_intensity: "medium",
												accent_color: "#8b5cf6",
												glass_blur: "16px",
												glass_opacity: 0.70,
												glass_tint: "rgba(255, 255, 255, 0.65)",
												background_overlay_color: "rgba(248, 250, 252, 0.45)",
												background_overlay_opacity: 0.45,
											}));
											markUnpublished();
											showToast("Preset Frost Aurora diterapkan.", "info");
										}}
										className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
											appearance.palette === "frost-aurora"
												? "bg-violet-950/40 border-violet-500 ring-2 ring-violet-500/30"
												: "bg-slate-950/60 border-slate-800 hover:border-slate-700"
										}`}
									>
										<div className="w-full h-12 rounded-lg bg-gradient-to-r from-violet-200 via-sky-100 to-pink-200 mb-2 border border-white/40 flex items-center justify-center text-xs text-slate-800 font-bold">
											Frost Aurora
										</div>
										<div className="text-xs font-bold text-white">Frost Aurora (Default)</div>
										<div className="text-[11px] text-slate-400 mt-0.5">Icy lavender & violet glow</div>
									</button>

									{/* Dark Liquid */}
									<button
										type="button"
										onClick={() => {
											setAppearance((prev) => ({
												...prev,
												palette: "dark-liquid",
												glass_intensity: "deep",
												accent_color: "#a78bfa",
												glass_blur: "24px",
												glass_opacity: 0.85,
												glass_tint: "rgba(15, 23, 42, 0.75)",
												background_overlay_color: "rgba(2, 6, 23, 0.65)",
												background_overlay_opacity: 0.65,
											}));
											markUnpublished();
											showToast("Preset Dark Liquid diterapkan.", "info");
										}}
										className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
											appearance.palette === "dark-liquid"
												? "bg-violet-950/40 border-violet-500 ring-2 ring-violet-500/30"
												: "bg-slate-950/60 border-slate-800 hover:border-slate-700"
										}`}
									>
										<div className="w-full h-12 rounded-lg bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950 mb-2 border border-slate-800 flex items-center justify-center text-xs text-violet-300 font-bold">
											Dark Liquid
										</div>
										<div className="text-xs font-bold text-white">Dark Liquid</div>
										<div className="text-[11px] text-slate-400 mt-0.5">Obsidian slate & deep glass</div>
									</button>

									{/* Sky Aurora */}
									<button
										type="button"
										onClick={() => {
											setAppearance((prev) => ({
												...prev,
												palette: "sky-aurora",
												glass_intensity: "medium",
												accent_color: "#0284c7",
												glass_blur: "16px",
												glass_opacity: 0.70,
												glass_tint: "rgba(240, 249, 255, 0.70)",
												background_overlay_color: "rgba(240, 249, 255, 0.45)",
												background_overlay_opacity: 0.45,
											}));
											markUnpublished();
											showToast("Preset Sky Aurora diterapkan.", "info");
										}}
										className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
											appearance.palette === "sky-aurora"
												? "bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/30"
												: "bg-slate-950/60 border-slate-800 hover:border-slate-700"
										}`}
									>
										<div className="w-full h-12 rounded-lg bg-gradient-to-r from-cyan-100 via-sky-200 to-indigo-100 mb-2 border border-white/40 flex items-center justify-center text-xs text-slate-800 font-bold">
											Sky Aurora
										</div>
										<div className="text-xs font-bold text-white">Sky Aurora</div>
										<div className="text-[11px] text-slate-400 mt-0.5">Fresh cyan mesh & sky blue</div>
									</button>
								</div>
							</div>

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
										{/* Aspect Ratio */}
										<div>
											<label className="block text-xs font-semibold text-slate-300 mb-2">
												Rasio Aspek Cover
											</label>
											<div className="flex flex-wrap gap-2">
												{[
													{ label: "Ultrawide (21:9)", val: "aspect-[21/9] sm:aspect-[24/9]" },
													{ label: "Standar (16:9)", val: "aspect-[16/9]" },
													{ label: "Panorama (3:1)", val: "aspect-[3/1]" },
												].map((opt) => (
													<button
														key={opt.val}
														type="button"
														onClick={() => {
															setAppearance({ ...appearance, cover_aspect_ratio: opt.val });
															markUnpublished();
														}}
														className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
															appearance.cover_aspect_ratio === opt.val
																? "bg-violet-600 text-white border-violet-500 shadow-sm"
																: "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
														}`}
													>
														{opt.label}
													</button>
												))}
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

							{/* 5. Liquid Glass Material Controls */}
							<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
								<h3 className="text-sm font-bold text-white mb-1">Kontrol Material Liquid Glass</h3>
								<p className="text-xs text-slate-400 mb-4">
									Kendalikan intensitas blur optik, tingkat transparansi, garis tepi specular, dan warna aksen tombol.
								</p>

								{/* Accent Color Picker */}
								<div className="mb-6 pb-4 border-b border-slate-800">
									<label className="block text-xs font-semibold text-slate-300 mb-2">
										Warna Aksen Antarmuka
									</label>
									<div className="flex items-center gap-3">
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
											className="w-28 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono uppercase focus:outline-none focus:border-violet-500"
										/>
										{/* Quick chips */}
										<div className="flex flex-wrap gap-1.5">
											{["#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#ec4899", "#f59e0b"].map((c) => (
												<button
													key={c}
													type="button"
													onClick={() => {
														setAppearance({ ...appearance, accent_color: c });
														markUnpublished();
													}}
													className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110 cursor-pointer"
													style={{ backgroundColor: c }}
													title={c}
												/>
											))}
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
									<button
										type="button"
										onClick={handleOpenAddExplore}
										className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
									>
										<span>+ Tambah Item Explore</span>
									</button>
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
											{ id: "project", label: "Proyek" },
											{ id: "gallery", label: "Galeri" },
											{ id: "image", label: "Foto" },
											{ id: "video", label: "Video" },
											{ id: "music", label: "Musik" },
											{ id: "game", label: "Game" },
											{ id: "review", label: "Review" },
											{ id: "note", label: "Catatan" },
											{ id: "link", label: "Link" },
											{ id: "custom", label: "Kustom" },
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
										const matchesType = exploreFilterType === "all" || item.type === exploreFilterType;
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
					    ROADMAP SECTIONS (HONEST PHASE 5 & 6)
					    ========================================================================= */}
					{["clicks", "settings"].includes(activeSection) && (
						<div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center">
							<div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
									/>
								</svg>
							</div>

							<h3 className="text-lg font-bold text-white mb-1">
								Modul {navTabs.find((t) => t.id === activeSection)?.label}
							</h3>
							<p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed mb-6">
								Fitur ini dijadwalkan pada <strong>Phase 4 & 5 (Click Monitor, Explore Showcase & Advanced Settings)</strong>.
								Sesuai batasan implementasi, modul ini belum aktif dan tidak menyediakan form atau tombol palsu.
							</p>

							<button
								type="button"
								onClick={() => handleSelectSection("overview")}
								className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors cursor-pointer"
							>
								Kembali ke Overview
							</button>
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

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label htmlFor="lf-platform" className="block text-xs font-semibold text-slate-300 mb-1">
										Platform
									</label>
									<select
										id="lf-platform"
										value={linkForm.platform}
										onChange={(e) => setLinkForm({ ...linkForm, platform: e.target.value })}
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
										<option value="custom">Lainnya / Custom</option>
									</select>
								</div>
								<div>
									<label htmlFor="lf-icon" className="block text-xs font-semibold text-slate-300 mb-1">
										Ikon
									</label>
									<select
										id="lf-icon"
										value={linkForm.icon}
										onChange={(e) => setLinkForm({ ...linkForm, icon: e.target.value })}
										className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
									>
										<option value="globe">Globe (Web)</option>
										<option value="github">GitHub</option>
										<option value="linkedin">LinkedIn</option>
										<option value="twitter">Twitter</option>
										<option value="instagram">Instagram</option>
										<option value="youtube">YouTube</option>
										<option value="message-square">Chat / Message</option>
										<option value="external-link">External Link</option>
									</select>
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
							{/* Content Type Selector */}
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
									<option value="gallery">Galeri Foto (Photo Showcase)</option>
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

							{/* Localized Title */}
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

							{/* Localized Subtitle */}
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

							{/* URL & Cover Image */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label htmlFor="ef-url" className="block text-xs font-semibold text-slate-300 mb-1">
										Tautan Tujuan (URL)
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
								<div>
									<label htmlFor="ef-cover" className="block text-xs font-semibold text-slate-300 mb-1">
										Gambar Sampul / Thumbnail
									</label>
									<div className="flex gap-2">
										<input
											id="ef-cover"
											type="text"
											value={exploreForm.cover_image}
											onChange={(e) => setExploreForm({ ...exploreForm, cover_image: e.target.value })}
											placeholder="https://... atau media R2"
											className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none font-mono text-xs"
										/>
										<button
											type="button"
											onClick={() => handleOpenMediaLibrary("explore_cover")}
											className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold whitespace-nowrap cursor-pointer"
											title="Pilih gambar dari Media Library R2"
										>
											Pilih Media
										</button>
									</div>
								</div>
							</div>

							{/* Type-Specific Dynamic Fields */}
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

							{/* Enabled Switch */}
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

							{/* Actions */}
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
			    MODALS: PUBLISH CONFIRMATION
			    ========================================================================= */}
			{isPublishModalOpen && (
				<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
						<div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mb-4">
							<span className="text-xl">🚀</span>
						</div>
						<h3 className="text-lg font-bold text-white mb-2">Terbitkan Seluruh Perubahan?</h3>
						<p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
							Perubahan pada <strong>Profil</strong>, <strong>Tautan</strong>, dan <strong>Kontak</strong> yang ada di draft akan langsung dipromosikan ke pengunjung publik secara atomik.
						</p>
						<div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 mb-4 text-xs text-slate-400">
							<div>• Target Versi: <span className="text-emerald-400 font-bold">v{(pubMeta?.version || 1) + 1}</span></div>
							<div>• Diterbitkan Oleh: <span className="text-slate-200">{user.email}</span></div>
						</div>
						<div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
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
								className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
							>
								{isPublishing ? "Mempublikasikan..." : "Ya, Terbitkan Sekarang"}
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

						{/* Phone Simulator Body */}
						<div
							className="bg-slate-950 border border-slate-800 rounded-[2rem] p-4 sm:p-5 flex flex-col items-center max-h-[75vh] overflow-y-auto relative overflow-hidden"
							style={{
								...(appearance?.accent_color ? { borderColor: `${appearance.accent_color}40` } : {}),
							}}
						>
							{/* Cover Banner Preview if Enabled */}
							{Boolean(appearance.cover_enabled) && (
								<div className="w-full rounded-2xl overflow-hidden mb-[-2rem] z-0 h-24 relative shadow-md">
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

							{/* Profile Card Preview */}
							<div className="w-full flex flex-col items-center text-center mb-6 z-10">
								<div className="w-20 h-20 rounded-full border-2 border-white/20 overflow-hidden bg-slate-800 mb-2 shadow-lg">
									{profile.avatar_url ? (
										<img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
									) : (
										<span className="text-2xl font-bold text-slate-400 flex items-center justify-center h-full">
											{profile.name[0] || "?"}
										</span>
									)}
								</div>
								<h4 className="text-base font-bold text-white">{profile.name || "Nama Pengguna"}</h4>
								<p
									className="text-xs font-medium"
									style={{ color: appearance.accent_color || "#a78bfa" }}
								>
									{profile.handle || "@handle"}
								</p>
								{(previewLang === "id" ? profile.location_id : profile.location_en) && (
									<span className="text-[11px] text-slate-400 mt-1">
										📍 {previewLang === "id" ? profile.location_id : profile.location_en}
									</span>
								)}
								{(previewLang === "id" ? profile.bio_id : profile.bio_en) && (
									<p className="text-xs text-slate-300 mt-2 leading-relaxed">
										{previewLang === "id" ? profile.bio_id : profile.bio_en}
									</p>
								)}
							</div>

							{/* Links Preview */}
							<div className="w-full flex flex-col gap-2 mb-6">
								<div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
									Tautan ({links.filter((l) => l.is_enabled).length})
								</div>
								{links.filter((l) => l.is_enabled).length === 0 ? (
									<p className="text-xs text-slate-500 italic">Tidak ada tautan aktif.</p>
								) : (
									links
										.filter((l) => l.is_enabled)
										.map((l) => (
											<div
												key={l.id}
												className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-left flex items-center justify-between"
											>
												<span className="text-xs font-semibold text-white">
													{previewLang === "id" ? l.title_id || l.title_en : l.title_en || l.title_id}
												</span>
												<span className="text-xs text-slate-500">↗</span>
											</div>
										))
								)}
							</div>

							{/* Contacts Preview */}
							<div className="w-full flex flex-col gap-2">
								<div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
									Kontak ({contacts.filter((c) => c.is_enabled).length})
								</div>
								{contacts.filter((c) => c.is_enabled).length === 0 ? (
									<p className="text-xs text-slate-500 italic">Tidak ada metode kontak aktif.</p>
								) : (
									contacts
										.filter((c) => c.is_enabled)
										.map((c) => (
											<div
												key={c.id}
												className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-left flex items-center justify-between"
											>
												<div className="flex items-center gap-2">
													<span className="text-[10px] uppercase font-bold text-violet-400">
														{c.platform}
													</span>
													<span className="text-xs font-semibold text-white">
														{previewLang === "id" ? c.label_id || c.label_en : c.label_en || c.label_id}
													</span>
												</div>
												<span className="text-[11px] text-slate-400 font-mono">{c.value}</span>
											</div>
										))
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
