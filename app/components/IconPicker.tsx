import React, { useState, useMemo, useRef } from "react";
import type { Language } from "../data/profile";
import { getLocalizedText, TRANSLATIONS, DEFAULT_LANGUAGE } from "../lib/i18n";
import {
	ICON_CATEGORIES,
	PRESET_ICONS,
	getRecommendedIcon,
	getPresetIcon,
	LinkIconRenderer,
	type IconCategory,
	type PresetIconDefinition,
} from "./IconLibrary";

export interface IconPickerProps {
	platform: string;
	iconType: "preset" | "upload" | "url";
	icon: string;
	iconUrl: string;
	iconMediaId: string;
	lang?: Language;
	onChange: (updates: {
		icon_type: "preset" | "upload" | "url";
		icon: string;
		icon_url: string;
		icon_media_id: string;
	}) => void;
	onError: (message: string) => void;
}

export function IconPicker({
	platform,
	iconType = "preset",
	icon = "globe",
	iconUrl = "",
	iconMediaId = "",
	lang = DEFAULT_LANGUAGE,
	onChange,
	onError,
}: IconPickerProps) {
	const t = TRANSLATIONS[lang].studio;
	const [activeTab, setActiveTab] = useState<"preset" | "upload" | "url">(iconType || "preset");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<IconCategory>("all");
	const [isUploading, setIsUploading] = useState(false);
	const [urlPreviewError, setUrlPreviewError] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Recommended icon for current platform
	const recommendedIconId = useMemo(() => getRecommendedIcon(platform), [platform]);
	const recommendedIcon = useMemo(() => getPresetIcon(recommendedIconId), [recommendedIconId]);
	const currentPreset = useMemo(() => getPresetIcon(icon), [icon]);

	// Filter preset icons
	const filteredIcons = useMemo(() => {
		const q = searchQuery.toLowerCase().trim();
		return PRESET_ICONS.filter((item) => {
			if (selectedCategory !== "all" && item.category !== selectedCategory) {
				return false;
			}
			if (!q) return true;
			return (
				item.name.id.toLowerCase().includes(q) ||
				item.name.en.toLowerCase().includes(q) ||
				item.id.toLowerCase().includes(q) ||
				item.keywords.some((k) => k.toLowerCase().includes(q))
			);
		});
	}, [searchQuery, selectedCategory]);

	// Handle file upload
	const handleFileUpload = async (file: File) => {
		if (!file) return;

		// Client size check (2 MiB limit for icons)
		if (file.size > 2 * 1024 * 1024) {
			onError(lang === "id" ? "Ukuran file ikon maksimal 2 MiB." : "Icon file size must not exceed 2 MiB.");
			return;
		}

		setIsUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("category", "icon");

			const res = await fetch("/api/studio/media", {
				method: "POST",
				body: formData,
			});

			const data = (await res.json()) as {
				status?: string;
				error?: string;
				asset?: { id: string; original_filename: string };
			};

			if (!res.ok || data.error || !data.asset) {
				onError(data.error || (lang === "id" ? "Gagal mengunggah gambar ikon." : "Failed to upload icon image."));
			} else {
				onChange({
					icon_type: "upload",
					icon_media_id: data.asset.id,
					icon_url: "",
					icon,
				});
				setActiveTab("upload");
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : (lang === "id" ? "Kesalahan jaringan saat mengunggah ikon." : "Network error while uploading icon.");
			onError(msg);
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleResetToDefault = () => {
		onChange({
			icon_type: "preset",
			icon: recommendedIconId,
			icon_url: "",
			icon_media_id: "",
		});
		setActiveTab("preset");
	};

	const handleRemoveIcon = () => {
		onChange({
			icon_type: "preset",
			icon: "globe",
			icon_url: "",
			icon_media_id: "",
		});
		setActiveTab("preset");
	};

	return (
		<div className="flex flex-col gap-3 rounded-2xl bg-slate-950/80 border border-slate-800 p-3.5 sm:p-4">
			{/* Top Bar: Active Selected Icon Status & Actions */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
				<div className="flex items-center gap-3 min-w-0">
					{/* Icon Preview Box with Subtle Checkerboard Pattern for transparent support */}
					<div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 p-2 relative shadow-inner overflow-hidden">
						<LinkIconRenderer
							link={{
								platform,
								icon,
								icon_type: iconType,
								icon_url: iconUrl,
								icon_media_id: iconMediaId,
							}}
							isStudioPreview={true}
							className="w-7 h-7"
						/>
					</div>

					<div className="min-w-0">
						<div className="flex items-center gap-1.5 flex-wrap">
							<span className="text-xs font-bold text-white">
								{iconType === "upload"
									? t.iconPicker.customUpload
									: iconType === "url"
									? t.iconPicker.externalUrl
									: (lang === "id" ? currentPreset.name.id : currentPreset.name.en)}
							</span>
							<span
								className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
									iconType === "upload"
										? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
										: iconType === "url"
										? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
										: "bg-violet-500/20 text-violet-400 border border-violet-500/30"
								}`}
							>
								{iconType === "upload" ? "R2 Storage" : iconType === "url" ? "HTTPS URL" : t.iconPicker.presetSvg}
							</span>
						</div>
						<p className="text-[11px] text-slate-400 truncate mt-0.5">
							{iconType === "upload"
								? `ID: ${iconMediaId}`
								: iconType === "url"
								? iconUrl || (lang === "id" ? "URL belum dimasukkan" : "No URL entered")
								: `${t.iconPicker.category} ${currentPreset.category}`}
						</p>
					</div>
				</div>

				{/* Quick Reset & Remove Controls */}
				<div className="flex items-center gap-2 shrink-0">
					<button
						type="button"
						onClick={handleResetToDefault}
						className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
						title={lang === "id" ? `Kembalikan ke ikon standar (${recommendedIcon.name.id})` : `Reset to default icon (${recommendedIcon.name.en})`}
					>
						<span>↺</span>
						<span>{t.iconPicker.resetDefault}</span>
					</button>
					<button
						type="button"
						onClick={handleRemoveIcon}
						className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 border border-slate-700/60 hover:border-rose-800/60 text-slate-400 hover:text-rose-300 text-[11px] font-medium transition-colors cursor-pointer"
						title={lang === "id" ? "Hapus ikon kustom dan kembali ke ikon standar" : "Remove custom icon and revert to standard"}
					>
						{t.iconPicker.removeIcon}
					</button>
				</div>
			</div>

			{/* Mode Selection Tabs */}
			<div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
				<button
					type="button"
					onClick={() => setActiveTab("preset")}
					className={`py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
						activeTab === "preset"
							? "bg-violet-600 text-white shadow-sm font-bold"
							: "text-slate-400 hover:text-white hover:bg-slate-800/60"
					}`}
				>
					{t.iconPicker.tabPreset}
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("upload")}
					className={`py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
						activeTab === "upload"
							? "bg-violet-600 text-white shadow-sm font-bold"
							: "text-slate-400 hover:text-white hover:bg-slate-800/60"
					}`}
				>
					{t.iconPicker.tabUpload}
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("url")}
					className={`py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
						activeTab === "url"
							? "bg-violet-600 text-white shadow-sm font-bold"
							: "text-slate-400 hover:text-white hover:bg-slate-800/60"
					}`}
				>
					{t.iconPicker.tabUrl}
				</button>
			</div>

			{/* TAB 1: BASIC ICONS (PRESET LIBRARY) */}
			{activeTab === "preset" && (
				<div className="flex flex-col gap-2.5">
					{/* Search & Category Filter */}
					<div className="flex flex-col sm:flex-row gap-2">
						<div className="relative flex-1">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={t.iconPicker.searchPlaceholder}
								className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-violet-500 focus:outline-none"
							/>
							<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
								🔍
							</span>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
								>
									✕
								</button>
							)}
						</div>
					</div>

					{/* Category Pill Filters */}
					<div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar text-[11px]">
						{ICON_CATEGORIES.map((cat) => (
							<button
								key={cat.id}
								type="button"
								onClick={() => setSelectedCategory(cat.id)}
								className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
									selectedCategory === cat.id
										? "bg-slate-200 text-slate-900 font-bold"
										: "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
								}`}
							>
								{cat.id === "all" ? t.iconPicker.allCategories : cat.label[lang]}
							</button>
						))}
					</div>

					{/* Responsive Visual Icon Grid (Icons only, compact & clean) */}
					<div className="max-h-56 overflow-y-auto p-2 rounded-xl bg-slate-900/70 border border-slate-800/80 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
						{filteredIcons.length === 0 ? (
							<div className="col-span-full py-8 text-center text-xs text-slate-500">
								{lang === "id" ? `Tidak ada ikon yang sesuai dengan pencarian "${searchQuery}".` : `No icons found matching "${searchQuery}".`}
							</div>
						) : (
							filteredIcons.map((item) => {
								const isSelected = iconType === "preset" && icon === item.id;
								const SvgComp = item.svg;
								return (
									<button
										key={item.id}
										type="button"
										onClick={() =>
											onChange({
												icon_type: "preset",
												icon: item.id,
												icon_url: "",
												icon_media_id: "",
											})
										}
										title={`${lang === "id" ? item.name.id : item.name.en} • ${item.category}`}
										className={`p-2.5 aspect-square rounded-xl border flex items-center justify-center transition-all cursor-pointer relative group ${
											isSelected
												? "bg-violet-950/80 border-violet-500 ring-2 ring-violet-500/50 shadow-md scale-105"
												: "bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 hover:scale-105"
										}`}
									>
										<SvgComp className={`w-5 h-5 ${item.colorClass || "text-slate-300"} group-hover:scale-110 transition-transform`} />
									</button>
								);
							})
						)}
					</div>
				</div>
			)}

			{/* TAB 2: UPLOAD CUSTOM ICON */}
			{activeTab === "upload" && (
				<div className="flex flex-col gap-3">
					<div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 flex flex-col items-center justify-center text-center gap-2">
						<input
							type="file"
							ref={fileInputRef}
							accept=".png,.jpg,.jpeg,.webp,.avif,image/png,image/jpeg,image/webp,image/avif"
							className="hidden"
							onChange={(e) => {
								const file = e.target.files?.[0];
								if (file) handleFileUpload(file);
							}}
						/>

						{isUploading ? (
							<div className="py-4 flex flex-col items-center gap-2 text-violet-400 text-xs">
								<span className="animate-spin text-lg">⏳</span>
								<span>{lang === "id" ? "Mengunggah ikon ke Cloudflare R2..." : "Uploading icon to Cloudflare R2..."}</span>
							</div>
						) : (
							<>
								<div className="w-10 h-10 rounded-full bg-violet-950/60 border border-violet-800/60 flex items-center justify-center text-violet-400 text-lg">
									⬆
								</div>
								<div className="text-xs text-slate-300 font-semibold">
									{lang === "id" ? "Pilih gambar ikon dari perangkat Anda" : "Choose icon image from your device"}
								</div>
								<p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
									{t.iconPicker.uploadNotice}
								</p>
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="mt-1 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
								>
									{lang === "id" ? "Pilih File Gambar" : "Choose Image File"}
								</button>
							</>
						)}
					</div>

					{/* Uploaded state indicator */}
					{iconType === "upload" && iconMediaId && (
						<div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
									<img
										src={`/api/studio/media/${iconMediaId}/preview`}
										alt="Uploaded Icon"
										className="w-full h-full object-contain"
									/>
								</div>
								<div>
									<div className="text-xs font-semibold text-emerald-300">
										{lang === "id" ? "Gambar Ikon Aktif" : "Active Icon Image"}
									</div>
									<div className="text-[10px] text-slate-400 font-mono">
										ID: {iconMediaId}
									</div>
								</div>
							</div>
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
							>
								{lang === "id" ? "Ganti" : "Change"}
							</button>
						</div>
					)}
				</div>
			)}

			{/* TAB 3: EXTERNAL ICON URL */}
			{activeTab === "url" && (
				<div className="flex flex-col gap-3">
					<div>
						<label htmlFor="icon-url-input" className="block text-xs font-semibold text-slate-300 mb-1">
							{lang === "id" ? "URL Gambar Ikon (HTTPS)" : "Icon Image URL (HTTPS)"}
						</label>
						<input
							id="icon-url-input"
							type="url"
							value={iconUrl}
							onChange={(e) => {
								setUrlPreviewError(false);
								onChange({
									icon_type: "url",
									icon_url: e.target.value.trim(),
									icon_media_id: "",
									icon,
								});
							}}
							placeholder="https://example.com/icon.png"
							className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:border-violet-500 focus:outline-none"
						/>
						<p className="text-[11px] text-slate-500 mt-1">
							{t.iconPicker.urlNotice}
						</p>
					</div>

					{/* Live URL Image Preview Card */}
					{iconUrl && (
						<div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
								{!urlPreviewError ? (
									<img
										src={iconUrl}
										alt="Preview"
										referrerPolicy="no-referrer"
										className="w-full h-full object-contain"
										onError={() => setUrlPreviewError(true)}
									/>
								) : (
									<span className="text-xs text-rose-400">⚠️</span>
								)}
							</div>
							<div className="min-w-0 flex-1">
								<div className="text-xs font-semibold text-white">
									{!urlPreviewError
										? (lang === "id" ? "Preview Gambar Berhasil" : "Image Preview Loaded")
										: (lang === "id" ? "Gagal Memuat Gambar" : "Failed to Load Image")}
								</div>
								<div className="text-[11px] text-slate-400 truncate font-mono">
									{!urlPreviewError
										? iconUrl
										: (lang === "id" ? "Pastikan URL mengarah ke file gambar publik yang valid dan mendukung HTTPS." : "Ensure the URL points to a valid public image file supporting HTTPS.")}
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
