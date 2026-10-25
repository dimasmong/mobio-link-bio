import React, { useState, useEffect, useCallback } from "react";
import type { Route } from "./+types/studio";
import { authenticateAdmin } from "../lib/auth.server";
import {
	getDatabaseStatus,
	getProfileRecord,
	getLinks,
	getContactMethods,
	getPublishMetadata,
	type DatabaseStatus,
	type ProfileRecord,
	type LinkRecord,
	type ContactMethodRecord,
	type PublishMetadataRecord,
} from "../lib/db.server";

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
			publishMetadata: null as PublishMetadataRecord | null,
			envMode: import.meta.env.MODE,
		};
	}

	const [dbStatus, draftProfile, draftLinks, draftContacts, publishMetadata] = await Promise.all([
		getDatabaseStatus(env?.DB),
		env?.DB ? getProfileRecord(env.DB, "draft") : null,
		env?.DB ? getLinks(env.DB, "draft") : [],
		env?.DB ? getContactMethods(env.DB, "draft") : [],
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
	{ id: "clicks", label: "Click Monitor", badge: "Phase 3" },
	{ id: "explore", label: "Explore", badge: "Phase 3" },
	{ id: "appearance", label: "Appearance", badge: "Phase 3" },
	{ id: "settings", label: "Settings", badge: "Phase 3" },
];

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
				const [pRes, lRes, cRes] = await Promise.all([
					fetch("/api/studio/profile"),
					fetch("/api/studio/links"),
					fetch("/api/studio/contact"),
				]);
				const pData = (await pRes.json()) as { profile?: ProfileRecord };
				const lData = (await lRes.json()) as { links?: LinkRecord[] };
				const cData = (await cRes.json()) as { contactMethods?: ContactMethodRecord[] };

				if (pData.profile) setProfile(pData.profile);
				if (lData.links) setLinks(lData.links);
				if (cData.contactMethods) setContacts(cData.contactMethods);

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

										{/* Avatar URL */}
										<div>
											<label htmlFor="p-avatar" className="block text-xs font-semibold text-slate-300 mb-1">
												URL Avatar
											</label>
											<input
												id="p-avatar"
												type="text"
												value={profile.avatar_url}
												onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
												placeholder="/images/avatar.jpg atau https://..."
												className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none transition-colors"
											/>
											<p className="text-[11px] text-slate-500 mt-1">
												Gunakan path lokal (contoh: <code>/images/avatar.jpg</code>) atau URL https:// gambar publik.
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
					    ROADMAP SECTIONS (HONEST PHASE 3 / FUTURE)
					    ========================================================================= */}
					{["clicks", "explore", "appearance", "settings"].includes(activeSection) && (
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
								Fitur ini dijadwalkan pada <strong>Phase 3 (Click Monitor, Explore & Custom Appearance)</strong>.
								Sesuai batasan implementasi Phase 2, modul ini belum aktif dan tidak menyediakan form atau tombol palsu.
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
						<div className="bg-slate-950 border border-slate-800 rounded-[2rem] p-4 sm:p-5 flex flex-col items-center max-h-[75vh] overflow-y-auto">
							{/* Profile Card Preview */}
							<div className="w-full flex flex-col items-center text-center mb-6">
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
								<p className="text-xs text-violet-400 font-medium">{profile.handle || "@handle"}</p>
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
