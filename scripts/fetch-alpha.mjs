#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { buildDailySocialCopy, buildRssXml, classifyItem, scoreAlpha } from '../src/alpha.mjs';

const token = process.env.GITHUB_TOKEN || '';

async function fetchGitHubRisingAI() {
	const since = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
	const q = `(ai OR llm OR mcp OR agent) created:>${since} stars:>30`;
	const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
		q,
	)}&sort=stars&order=desc&per_page=15`;
	const headers = { 'User-Agent': 'ai-alpha-cn/1.0', Accept: 'application/vnd.github+json' };
	if (token) headers.Authorization = `Bearer ${token}`;

	const res = await fetch(url, { headers });
	if (!res.ok) {
		console.warn(`GitHub fetch failed: ${res.status}`);
		return [];
	}
	const data = await res.json();
	return (data.items || []).map((r) => ({
		id: `gh-${r.id}`,
		source: 'GitHub',
		title: r.full_name,
		summary: r.description || 'No description provided.',
		url: r.html_url,
		language: r.language || 'Multi',
		stars: r.stargazers_count || 0,
		points: 0,
		comments: r.open_issues_count || 0,
		publishedAt: r.created_at,
		tags: classifyItem(r.full_name, `${r.description || ''} ${(r.topics || []).join(' ')}`),
		alphaScore: scoreAlpha({ stars: r.stargazers_count || 0 }),
	}));
}

async function fetchHackerNewsAI() {
	const sinceUnix = Math.floor((Date.now() - 48 * 60 * 60 * 1000) / 1000);
	const url = `https://hn.algolia.com/api/v1/search?tags=story&query=AI%20OR%20LLM%20OR%20MCP%20OR%20Agent%20OR%20Claude&numericFilters=created_at_i>${sinceUnix},points>25&hitsPerPage=15`;
	const res = await fetch(url);
	if (!res.ok) {
		console.warn(`HN fetch failed: ${res.status}`);
		return [];
	}
	const data = await res.json();
	return (data.hits || []).map((h) => ({
		id: `hn-${h.objectID}`,
		source: 'HackerNews',
		title: h.title || '',
		summary: h.url ? `外链讨论 · ${new URL(h.url).hostname}` : 'Hacker News 社区热议帖',
		url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
		hnUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
		language: 'EN',
		stars: 0,
		points: h.points || 0,
		comments: h.num_comments || 0,
		publishedAt: h.created_at,
		tags: classifyItem(h.title || '', ''),
		alphaScore: scoreAlpha({ points: h.points || 0, comments: h.num_comments || 0 }),
	}));
}

async function main() {
	const [ghItems, hnItems] = await Promise.all([fetchGitHubRisingAI(), fetchHackerNewsAI()]);
	const combined = [...ghItems, ...hnItems].sort((a, b) => b.alphaScore - a.alphaScore);

	const feed = {
		generatedAt: new Date().toISOString(),
		counts: { github: ghItems.length, hn: hnItems.length, total: combined.length },
		items: combined,
	};

	fs.mkdirSync(path.resolve('docs'), { recursive: true });
	fs.writeFileSync(path.resolve('docs/alpha.json'), JSON.stringify(feed, null, 2) + '\n', 'utf8');
	fs.writeFileSync(path.resolve('docs/rss.xml'), buildRssXml(feed), 'utf8');
	fs.writeFileSync(path.resolve('docs/daily-copy.txt'), buildDailySocialCopy(feed), 'utf8');

	console.log(`AI Alpha CN updated: ${ghItems.length} GitHub + ${hnItems.length} HN = ${combined.length} items.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
