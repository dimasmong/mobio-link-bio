/**
 * MOBIO STUDIO — Privacy-First Click Analytics Engine (Phase 5)
 * Telemetry and click tracking without collecting PII.
 */

export interface ClickRecord {
	id: string;
	link_id: string;
	clicked_at: string;
	referrer?: string;
	country?: string;
	user_agent_hash?: string;
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
}

/**
 * Computes a fast SHA-256 privacy hash for user-agent / client identifiers.
 */
async function computePrivacyHash(input: string): Promise<string> {
	if (!input) return "";
	try {
		const encoder = new TextEncoder();
		const data = encoder.encode(input);
		const hashBuffer = await crypto.subtle.digest("SHA-256", data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
		return hex.slice(0, 16); // Only first 16 chars needed for deduplication without re-identification
	} catch {
		return "";
	}
}

/**
 * Sanitizes and extracts the referrer domain or platform.
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
 * Records a click event into Cloudflare D1.
 */
export async function recordClickEvent(
	db: D1Database,
	params: {
		linkId: string;
		referrer?: string;
		userAgent?: string;
		country?: string;
	}
): Promise<void> {
	const id = crypto.randomUUID();
	const now = new Date().toISOString();
	const sanitizedRef = sanitizeReferrer(params.referrer);
	const uaHash = await computePrivacyHash(params.userAgent || "");
	const country = (params.country || "").toUpperCase().slice(0, 4);

	try {
		await db
			.prepare(
				`INSERT INTO click_events (id, link_id, clicked_at, referrer, country, user_agent_hash)
				 VALUES (?, ?, ?, ?, ?, ?);`
			)
			.bind(id, params.linkId, now, sanitizedRef, country, uaHash)
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
		// 1. Total counts across multiple periods
		const [periodRes, todayRes, sevenDaysRes, thirtyDaysRes, allTimeRes] = await Promise.all([
			db.prepare("SELECT count(*) as count FROM click_events WHERE clicked_at >= ?;").bind(dateBoundary).first<{ count: number }>(),
			db.prepare("SELECT count(*) as count FROM click_events WHERE clicked_at >= ?;").bind(todayIso).first<{ count: number }>(),
			db.prepare("SELECT count(*) as count FROM click_events WHERE clicked_at >= ?;").bind(sevenDaysIso).first<{ count: number }>(),
			db.prepare("SELECT count(*) as count FROM click_events WHERE clicked_at >= ?;").bind(thirtyDaysIso).first<{ count: number }>(),
			db.prepare("SELECT count(*) as count FROM click_events;").first<{ count: number }>(),
		]);

		const totalClicksPeriod = periodRes?.count ?? 0;
		const todayClicks = todayRes?.count ?? 0;
		const last7DaysClicks = sevenDaysRes?.count ?? 0;
		const last30DaysClicks = thirtyDaysRes?.count ?? 0;
		const totalAllTime = allTimeRes?.count ?? 0;

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
			   LEFT JOIN click_events c ON l.id = c.link_id AND c.clicked_at >= ?
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

		// 3. Time Series Daily Trend
		// Fetch counts grouped by date
		const timeSeriesRes = await db
			.prepare(
				`SELECT substr(clicked_at, 1, 10) as day, count(*) as count
				 FROM click_events
				 WHERE clicked_at >= ?
				 GROUP BY day
				 ORDER BY day ASC;`
			)
			.bind(dateBoundary)
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
				 WHERE clicked_at >= ?
				 GROUP BY referrer
				 ORDER BY count DESC
				 LIMIT 5;`
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
		};
	}
}

/**
 * Clears all click telemetry data.
 */
export async function resetClickEvents(db: D1Database): Promise<void> {
	await db.prepare("DELETE FROM click_events;").run();
}
