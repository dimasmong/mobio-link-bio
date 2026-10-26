/**
 * MOBIO STUDIO — Privacy-First Click Analytics Engine (Phase 5)
 * Telemetry and click tracking without collecting PII.
 */

export interface ClickRecord {
	id: string;
	link_id: string;
	clicked_at: string;
	referrer?: string;
}

export interface LinkClickBreakdown {
	linkId: string;
	titleId: string;
	titleEn: string;
	url: string;
	platform: string;
	icon: string;
	clicks: number;
	percentage: number;
}

export interface DailyClickPoint {
	date: string; // YYYY-MM-DD
	label: string; // "25 Oct"
	clicks: number;
}

export interface ReferrerCount {
	referrer: string;
	clicks: number;
	percentage: number;
}

export interface PageViewBreakdown {
	page: string;
	views: number;
	percentage: number;
}

export interface VisitorAnalyticsSummary {
	totalPageViewsPeriod: number;
	todayPageViews: number;
	last7DaysPageViews: number;
	last30DaysPageViews: number;
	totalPageViewsAllTime: number;
	uniqueVisitorSessions: number;
	pageBreakdown: PageViewBreakdown[];
	timeSeries: DailyClickPoint[];
}

export interface ClickAnalyticsSummary {
	range: "today" | "7d" | "30d" | "all";
	totalClicksPeriod: number;
	todayClicks: number;
	last7DaysClicks: number;
	last30DaysClicks: number;
	totalAllTime: number;
	activeLinksCount: number;
	topLink: LinkClickBreakdown | null;
	linkBreakdown: LinkClickBreakdown[];
	timeSeries: DailyClickPoint[];
	topReferrers: ReferrerCount[];
	// V4.1 Enhanced Interaction Metrics (Links, Explore, Contact)
	totalInteractionsPeriod: number;
	linkClicksPeriod: number;
	exploreClicksPeriod: number;
	contactClicksPeriod: number;
	todayInteractions: number;
	last7DaysInteractions: number;
	last30DaysInteractions: number;
	totalInteractionsAllTime: number;
	visitors?: VisitorAnalyticsSummary;
}

export interface StudioAnalyticsSummary extends ClickAnalyticsSummary {
	visitors: VisitorAnalyticsSummary;
}

/**
 * Sanitizes and extracts the referrer domain or platform.
 * Strips all query parameters, search paths, and individual profile links.
 */
function sanitizeReferrer(rawReferrer?: string): string {
	if (!rawReferrer) return "Direct / None";
	const trimmed = rawReferrer.trim();
	if (!trimmed) return "Direct / None";

	try {
		const parsed = new URL(trimmed);
		return parsed.hostname.replace(/^www\./, "").toLowerCase().slice(0, 100);
	} catch {
		return trimmed.slice(0, 100);
	}
}

/**
 * Records a minimal, privacy-preserving click event into Cloudflare D1.
 * Does NOT collect or store IP addresses, User-Agents, or device fingerprints.
 */
export async function recordClickEvent(
	db: D1Database,
	params: {
		linkId: string;
		referrer?: string;
	}
): Promise<void> {
	const id = crypto.randomUUID();
	const now = new Date().toISOString();
	const sanitizedRef = sanitizeReferrer(params.referrer);

	try {
		await db
			.prepare(
				`INSERT INTO click_events (id, link_id, clicked_at, referrer)
				 VALUES (?, ?, ?, ?);`
			)
			.bind(id, params.linkId, now, sanitizedRef)
			.run();
	} catch (err: unknown) {
		console.warn("Failed to record click event:", err);
	}
}

/**
 * Aggregates click analytics summary for a given time window.
 */
export async function getClickSummary(
	db: D1Database,
	range: "today" | "7d" | "30d" | "all" = "7d"
): Promise<ClickAnalyticsSummary> {
	const now = new Date();
	const nowIso = now.toISOString();

	// Calculate date boundary
	let dateBoundary = "1970-01-01T00:00:00.000Z";
	let daysCount = 7;

	if (range === "today") {
		const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
		dateBoundary = startOfToday.toISOString();
		daysCount = 1;
	} else if (range === "7d") {
		const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		dateBoundary = past7.toISOString();
		daysCount = 7;
	} else if (range === "30d") {
		const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		dateBoundary = past30.toISOString();
		daysCount = 30;
	} else if (range === "all") {
		dateBoundary = "1970-01-01T00:00:00.000Z";
		daysCount = 30; // generate 30 days time series
	}

	const todayIso = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
	const sevenDaysIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
	const thirtyDaysIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

	try {
		// 1. Total counts across multiple periods (Links and Navigation Interactions)
		const [
			periodRes, todayRes, sevenDaysRes, thirtyDaysRes, allTimeRes,
			pvPageCountsRes, todayPvRes, sevenDaysPvRes, thirtyDaysPvRes, allTimePvRes
		] = await Promise.all([
			db.prepare("SELECT count(*) as count FROM click_events WHERE datetime(clicked_at) >= datetime(?);").bind(dateBoundary).first<{ count: number }>(),
			db.prepare("SELECT count(*) as count FROM click_events WHERE datetime(clicked_at) >= datetime('now', 'start of day');").first<{ count: number }>(),
			db.prepare("SELECT count(*) as count FROM click_events WHERE datetime(clicked_at) >= datetime('now', '-7 days');").first<{ count: number }>(),
			db.prepare("SELECT count(*) as count FROM click_events WHERE datetime(clicked_at) >= datetime('now', '-30 days');").first<{ count: number }>(),
			db.prepare("SELECT count(*) as count FROM click_events;").first<{ count: number }>(),
			db.prepare("SELECT page, count(*) as count FROM page_views WHERE datetime(viewed_at) >= datetime(?) GROUP BY page;").bind(dateBoundary).all<{ page: string; count: number }>(),
			db.prepare("SELECT count(*) as count FROM page_views WHERE page IN ('explore', 'contact') AND datetime(viewed_at) >= datetime('now', 'start of day');").first<{ count: number }>(),
			db.prepare("SELECT count(*) as count FROM page_views WHERE page IN ('explore', 'contact') AND datetime(viewed_at) >= datetime('now', '-7 days');").first<{ count: number }>(),
			db.prepare("SELECT count(*) as count FROM page_views WHERE page IN ('explore', 'contact') AND datetime(viewed_at) >= datetime('now', '-30 days');").first<{ count: number }>(),
			db.prepare("SELECT count(*) as count FROM page_views WHERE page IN ('explore', 'contact');").first<{ count: number }>(),
		]);

		const totalClicksPeriod = periodRes?.count ?? 0;
		const todayClicks = todayRes?.count ?? 0;
		const last7DaysClicks = sevenDaysRes?.count ?? 0;
		const last30DaysClicks = thirtyDaysRes?.count ?? 0;
		const totalAllTime = allTimeRes?.count ?? 0;

		const pvMap = new Map<string, number>();
		(pvPageCountsRes.results ?? []).forEach((row) => {
			if (row.page) pvMap.set(row.page, row.count);
		});

		const exploreClicksPeriod = pvMap.get("explore") ?? 0;
		const contactClicksPeriod = pvMap.get("contact") ?? 0;
		const linkClicksPeriod = totalClicksPeriod;
		const totalInteractionsPeriod = linkClicksPeriod + exploreClicksPeriod + contactClicksPeriod;

		const todayInteractions = todayClicks + (todayPvRes?.count ?? 0);
		const last7DaysInteractions = last7DaysClicks + (sevenDaysPvRes?.count ?? 0);
		const last30DaysInteractions = last30DaysClicks + (thirtyDaysPvRes?.count ?? 0);
		const totalInteractionsAllTime = totalAllTime + (allTimePvRes?.count ?? 0);

		// 2. Link breakdown (joins published links with clicks)
		const linksQuery = range === "all"
			? `SELECT 
				l.id, l.title_id, l.title_en, l.url, l.platform, l.icon, l.sort_order,
				count(c.id) as clicks
			   FROM links l
			   LEFT JOIN click_events c ON l.id = c.link_id
			   GROUP BY l.id
			   ORDER BY clicks DESC, l.sort_order ASC;`
			: `SELECT 
				l.id, l.title_id, l.title_en, l.url, l.platform, l.icon, l.sort_order,
				count(c.id) as clicks
			   FROM links l
			   LEFT JOIN click_events c ON l.id = c.link_id AND datetime(c.clicked_at) >= datetime(?)
			   GROUP BY l.id
			   ORDER BY clicks DESC, l.sort_order ASC;`;

		const linksStmt = range === "all" ? db.prepare(linksQuery) : db.prepare(linksQuery).bind(dateBoundary);
		const linksRes = await linksStmt.all<{
			id: string;
			title_id: string;
			title_en: string;
			url: string;
			platform: string;
			icon: string;
			sort_order: number;
			clicks: number;
		}>();

		const rawLinks = linksRes.results ?? [];
		const linkBreakdown: LinkClickBreakdown[] = rawLinks.map((item) => {
			const clicks = Number(item.clicks) || 0;
			const percentage = totalClicksPeriod > 0 ? Math.round((clicks / totalClicksPeriod) * 1000) / 10 : 0;
			return {
				linkId: item.id,
				titleId: item.title_id,
				titleEn: item.title_en || item.title_id,
				url: item.url,
				platform: item.platform || "website",
				icon: item.icon || "globe",
				clicks,
				percentage,
			};
		});

		const topLink = linkBreakdown.length > 0 && linkBreakdown[0].clicks > 0 ? linkBreakdown[0] : null;

		// 3. Time Series Daily Trend (Combining Link Clicks and Explore/Contact Navigation)
		const timeSeriesRes = await db
			.prepare(
				`SELECT substr(replace(ts, 'T', ' '), 1, 10) as day, count(*) as count FROM (
					SELECT clicked_at as ts FROM click_events WHERE datetime(clicked_at) >= datetime(?)
					UNION ALL
					SELECT viewed_at as ts FROM page_views WHERE page IN ('explore', 'contact') AND datetime(viewed_at) >= datetime(?)
				) GROUP BY day ORDER BY day ASC;`
			)
			.bind(dateBoundary, dateBoundary)
			.all<{ day: string; count: number }>();

		const dayMap = new Map<string, number>();
		(timeSeriesRes.results ?? []).forEach((row) => {
			if (row.day) dayMap.set(row.day, row.count);
		});

		// Build continuous daily points
		const timeSeries: DailyClickPoint[] = [];
		const pointDays = range === "today" ? 1 : daysCount;
		for (let i = pointDays - 1; i >= 0; i--) {
			const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
			const yyyy = d.getUTCFullYear();
			const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
			const dd = String(d.getUTCDate()).padStart(2, "0");
			const dateStr = `${yyyy}-${mm}-${dd}`;

			const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			const label = `${d.getUTCDate()} ${monthNames[d.getUTCMonth()]}`;

			timeSeries.push({
				date: dateStr,
				label,
				clicks: dayMap.get(dateStr) || 0,
			});
		}

		// 4. Top Referrers
		const referrerRes = await db
			.prepare(
				`SELECT referrer, count(*) as count
				 FROM click_events
				 WHERE datetime(clicked_at) >= datetime(?)
				 GROUP BY referrer
				 ORDER BY count DESC
				 LIMIT 10;`
			)
			.bind(dateBoundary)
			.all<{ referrer: string; count: number }>();

		const topReferrers: ReferrerCount[] = (referrerRes.results ?? []).map((r) => {
			const count = r.count || 0;
			const percentage = totalClicksPeriod > 0 ? Math.round((count / totalClicksPeriod) * 100) : 0;
			return {
				referrer: r.referrer || "Direct / None",
				clicks: count,
				percentage,
			};
		});

		return {
			range,
			totalClicksPeriod,
			todayClicks,
			last7DaysClicks,
			last30DaysClicks,
			totalAllTime,
			activeLinksCount: linkBreakdown.length,
			topLink,
			linkBreakdown,
			timeSeries,
			topReferrers,
			// V4.1 Interaction Metrics
			totalInteractionsPeriod,
			linkClicksPeriod,
			exploreClicksPeriod,
			contactClicksPeriod,
			todayInteractions,
			last7DaysInteractions,
			last30DaysInteractions,
			totalInteractionsAllTime,
		};
	} catch (err: unknown) {
		console.warn("Failed to aggregate click summary:", err);
		return {
			range,
			totalClicksPeriod: 0,
			todayClicks: 0,
			last7DaysClicks: 0,
			last30DaysClicks: 0,
			totalAllTime: 0,
			activeLinksCount: 0,
			topLink: null,
			linkBreakdown: [],
			timeSeries: [],
			topReferrers: [],
			totalInteractionsPeriod: 0,
			linkClicksPeriod: 0,
			exploreClicksPeriod: 0,
			contactClicksPeriod: 0,
			todayInteractions: 0,
			last7DaysInteractions: 0,
			last30DaysInteractions: 0,
			totalInteractionsAllTime: 0,
		};
	}
}

/**
 * Clears all click telemetry data.
 */
export async function resetClickEvents(db: D1Database): Promise<void> {
	await db.prepare("DELETE FROM click_events;").run();
}

/**
 * Records a privacy-preserving page view event into Cloudflare D1.
 * Filters automated scrapers/bots and uses ephemeral session hash with zero raw IP storage.
 */
export async function recordPageView(
	db: D1Database,
	params: {
		page: string;
		sessionKey: string;
		referrer?: string;
		userAgent?: string;
	}
): Promise<void> {
	// 1. Filter automated search bots and crawler noise
	const ua = params.userAgent || "";
	if (/bot|spider|crawl|slurp|headless|bingpreview|facebookexternalhit|whatsapp|telegrambot/i.test(ua)) {
		return;
	}

	// 2. Validate and sanitize page identifier
	const rawPage = params.page?.toLowerCase().trim() || "home";
	const page = ["home", "explore", "contact"].includes(rawPage) ? rawPage : "home";

	// 3. Ephemeral anonymous session key (strictly scoped to current browser tab)
	const rawSession = params.sessionKey?.trim() || "";
	if (!rawSession || rawSession.length < 8) {
		return;
	}
	const sessionHash = rawSession.slice(0, 36);

	const id = crypto.randomUUID();
	const now = new Date().toISOString();
	const sanitizedRef = sanitizeReferrer(params.referrer);

	try {
		await db
			.prepare(
				`INSERT INTO page_views (id, page, session_hash, viewed_at, referrer)
				 VALUES (?, ?, ?, ?, ?);`
			)
			.bind(id, page, sessionHash, now, sanitizedRef)
			.run();
	} catch (err: unknown) {
		console.warn("Failed to record page view:", err);
	}
}

/**
 * Aggregates website visitor analytics (Page Views, Unique Visitor Sessions, Page Breakdown, Trends).
 */
export async function getVisitorSummary(
	db: D1Database,
	range: "today" | "7d" | "30d" | "all" = "7d"
): Promise<VisitorAnalyticsSummary> {
	const now = new Date();
	let dateBoundary = "1970-01-01 00:00:00";
	let daysCount = 7;

	if (range === "today") {
		const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
		dateBoundary = startOfToday.toISOString();
		daysCount = 1;
	} else if (range === "7d") {
		const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		dateBoundary = past7.toISOString();
		daysCount = 7;
	} else if (range === "30d") {
		const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		dateBoundary = past30.toISOString();
		daysCount = 30;
	} else if (range === "all") {
		dateBoundary = "1970-01-01 00:00:00";
		daysCount = 30;
	}

	try {
		const [periodRes, todayRes, sevenDaysRes, thirtyDaysRes, allTimeRes, sessionsRes, pagesRes, timeSeriesRes] =
			await Promise.all([
				db.prepare("SELECT count(*) as count FROM page_views WHERE datetime(viewed_at) >= datetime(?);").bind(dateBoundary).first<{ count: number }>(),
				db.prepare("SELECT count(*) as count FROM page_views WHERE datetime(viewed_at) >= datetime('now', 'start of day');").first<{ count: number }>(),
				db.prepare("SELECT count(*) as count FROM page_views WHERE datetime(viewed_at) >= datetime('now', '-7 days');").first<{ count: number }>(),
				db.prepare("SELECT count(*) as count FROM page_views WHERE datetime(viewed_at) >= datetime('now', '-30 days');").first<{ count: number }>(),
				db.prepare("SELECT count(*) as count FROM page_views;").first<{ count: number }>(),
				db.prepare("SELECT count(DISTINCT session_hash) as count FROM page_views WHERE datetime(viewed_at) >= datetime(?);").bind(dateBoundary).first<{ count: number }>(),
				db.prepare(
					`SELECT page, count(*) as views
					 FROM page_views
					 WHERE datetime(viewed_at) >= datetime(?)
					 GROUP BY page
					 ORDER BY views DESC;`
				).bind(dateBoundary).all<{ page: string; views: number }>(),
				db.prepare(
					`SELECT substr(replace(viewed_at, 'T', ' '), 1, 10) as day, count(*) as count
					 FROM page_views
					 WHERE datetime(viewed_at) >= datetime(?)
					 GROUP BY day
					 ORDER BY day ASC;`
				).bind(dateBoundary).all<{ day: string; count: number }>(),
			]);

		const totalPageViewsPeriod = periodRes?.count ?? 0;
		const todayPageViews = todayRes?.count ?? 0;
		const last7DaysPageViews = sevenDaysRes?.count ?? 0;
		const last30DaysPageViews = thirtyDaysRes?.count ?? 0;
		const totalPageViewsAllTime = allTimeRes?.count ?? 0;
		const uniqueVisitorSessions = sessionsRes?.count ?? 0;

		const rawPages = pagesRes.results ?? [];
		const pageBreakdown: PageViewBreakdown[] = rawPages.map((p) => {
			const views = p.views || 0;
			const percentage = totalPageViewsPeriod > 0 ? Math.round((views / totalPageViewsPeriod) * 100) : 0;
			return {
				page: p.page,
				views,
				percentage,
			};
		});

		const dayMap = new Map<string, number>();
		(timeSeriesRes.results ?? []).forEach((row) => {
			if (row.day) dayMap.set(row.day, row.count);
		});

		const timeSeries: DailyClickPoint[] = [];
		const pointDays = range === "today" ? 1 : daysCount;
		for (let i = pointDays - 1; i >= 0; i--) {
			const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
			const yyyy = d.getUTCFullYear();
			const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
			const dd = String(d.getUTCDate()).padStart(2, "0");
			const dateStr = `${yyyy}-${mm}-${dd}`;
			const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			const label = `${d.getUTCDate()} ${monthNames[d.getUTCMonth()]}`;

			timeSeries.push({
				date: dateStr,
				label,
				clicks: dayMap.get(dateStr) || 0,
			});
		}

		return {
			totalPageViewsPeriod,
			todayPageViews,
			last7DaysPageViews,
			last30DaysPageViews,
			totalPageViewsAllTime,
			uniqueVisitorSessions,
			pageBreakdown,
			timeSeries,
		};
	} catch (err: unknown) {
		console.warn("Failed to aggregate visitor summary:", err);
		return {
			totalPageViewsPeriod: 0,
			todayPageViews: 0,
			last7DaysPageViews: 0,
			last30DaysPageViews: 0,
			totalPageViewsAllTime: 0,
			uniqueVisitorSessions: 0,
			pageBreakdown: [],
			timeSeries: [],
		};
	}
}

/**
 * Combines both Click Monitor and Website Visitor Analytics in one call.
 */
export async function getStudioAnalyticsSummary(
	db: D1Database,
	range: "today" | "7d" | "30d" | "all" = "7d"
): Promise<StudioAnalyticsSummary> {
	const [clicks, visitors] = await Promise.all([
		getClickSummary(db, range),
		getVisitorSummary(db, range),
	]);

	return {
		...clicks,
		visitors,
	};
}

/**
 * Clears all visitor analytics telemetry.
 */
export async function resetVisitorEvents(db: D1Database): Promise<void> {
	await db.prepare("DELETE FROM page_views;").run();
}
