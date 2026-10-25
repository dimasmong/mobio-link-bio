import React, { useEffect, useRef } from "react";
import type { BackgroundConfig } from "../data/profile";

interface FixedBackgroundProps {
	config: BackgroundConfig;
}

export function FixedBackground({ config }: FixedBackgroundProps) {
	const videoRef = useRef<HTMLVideoElement>(null);

	// Pause video when document is hidden or user prefers reduced motion
	useEffect(() => {
		if (config.type !== "video" || !videoRef.current) return;

		const video = videoRef.current;
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

		if (mediaQuery.matches) {
			video.pause();
		}

		const handleVisibilityChange = () => {
			if (document.hidden) {
				video.pause();
			} else if (!mediaQuery.matches) {
				video.play().catch(() => {});
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [config.type]);

	const overlayStyle: React.CSSProperties = {
		backgroundColor: config.overlayColor || "rgba(248, 250, 252, 0.45)",
		opacity: config.overlayOpacity ?? 0.45,
	};

	const filterStyle: React.CSSProperties = {
		filter: `${config.blur && config.blur !== "0px" ? `blur(${config.blur})` : ""} brightness(${config.brightness ?? 1})`,
		transform: config.scale && config.scale !== 1 ? `scale(${config.scale})` : undefined,
	};

	return (
		<div
			className="fixed inset-0 w-full h-full -z-20 pointer-events-none overflow-hidden select-none"
			aria-hidden="true"
		>
			{/* 1. Gradient / Animated Frost Aurora Mesh */}
			{config.type === "gradient" && (
				<div
					className={`w-full h-full ${config.animation !== false ? "frost-aurora-mesh" : "bg-slate-50"}`}
					style={filterStyle}
				/>
			)}

			{/* 2. Static Image Background */}
			{config.type === "image" && config.src && (
				<img
					src={config.src}
					alt=""
					className="w-full h-full object-cover"
					style={{
						objectPosition: config.position || "center center",
						...filterStyle,
					}}
					loading="eager"
				/>
			)}

			{/* 3. Video Background */}
			{config.type === "video" && config.src && (
				<video
					ref={videoRef}
					src={config.src}
					poster={config.poster}
					autoPlay
					muted
					loop
					playsInline
					className="w-full h-full object-cover"
					style={{
						objectPosition: config.position || "center center",
						...filterStyle,
					}}
				/>
			)}

			{/* Adaptive Translucent Overlay to Guarantee Readability */}
			<div
				className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300"
				style={overlayStyle}
			/>
		</div>
	);
}
