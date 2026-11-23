/**
 * AI Alpha CN — Core classification, scoring, and RSS/copy generation
 */

export const CATEGORIES = [
	{ id: 'agent', label: 'Agent / 自动化', re: /\b(agent|agentic|autonomous|openclaw|swarm|workflow|orchestrat)/i },
	{ id: 'mcp', label: 'MCP / 协议生态', re: /\b(mcp|model context protocol|x402|a2a|skill|plugin)/i },
	{ id: 'coding', label: 'AI 编程工具', re: /\b(claude code|codex|cursor|copilot|coding|ide|swe-bench|devtool)/i },
	{ id: 'model', label: '模型 / 推理加速', re: /\b(llm|vllm|gguf|quant|inference|deepseek|gemini|claude|gpt|qwen|local model)/i },
	{ id: 'money', label: '出海 / 变现机会', re: /\b(bounty|saas|usdc|monetiz|revenue|indie|startup|payment)/i },
];

export function classifyItem(title = '', desc = '') {
	const text = `${title} ${desc}`;
	const matched = CATEGORIES.filter((c) => c.re.test(text)).map((c) => c.label);
	return matched.length ? matched.slice(0, 2) : ['前沿开源'];
}

export function scoreAlpha({ stars = 0, points = 0, comments = 0 }) {
	const raw = stars * 1.2 + points * 1.5 + comments * 0.8;
	return Math.min(100, Math.max(10, Math.round(Math.log10(raw + 10) * 32)));
}

export function buildRssXml(feed, siteUrl = 'https://teylerboal-dev.github.io/ai-alpha-cn/') {
	const esc = (s) =>
		String(s || '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	const items = (feed.items || [])
		.slice(0, 20)
		.map(
			(it) => `    <item>
      <title>${esc(`[${it.source}] ${it.title}`)}</title>
      <link>${esc(it.url)}</link>
      <description>${esc(`${it.tags.join(' / ')} · ${it.summary}`)}</description>
      <pubDate>${new Date(it.publishedAt || feed.generatedAt).toUTCString()}</pubDate>
    </item>`,
		)
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AI Alpha CN · 海外 AI 一手信息差日报</title>
    <link>${esc(siteUrl)}</link>
    <description>每日自动抓取海外 GitHub 新晋 AI 爆款与 Hacker News 前沿热议，专为中文开发者与独立变现者打造。</description>
    <lastBuildDate>${new Date(feed.generatedAt).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

export function buildDailySocialCopy(feed) {
	const date = (feed.generatedAt || new Date().toISOString()).slice(0, 10);
	const top = (feed.items || []).slice(0, 5);
	const lines = [
		`🔥 海外 AI 一手信息差日报（${date}）`,
		'',
		'今天英文技术圈最值得抄作业的 5 个新动态：',
		'',
	];
	top.forEach((it, idx) => {
		const metric = it.source === 'GitHub' ? `⭐ ${it.stars}` : `🔥 ${it.points} pts`;
		lines.push(`${idx + 1}. 【${it.tags[0]}】${it.title}（${metric}）`);
		if (it.summary) lines.push(`   ${it.summary.slice(0, 110)}`);
		lines.push(`   ${it.url}`);
		lines.push('');
	});
	lines.push('完整实时榜单 & RSS 订阅：https://teylerboal-dev.github.io/ai-alpha-cn/');
	return lines.join('\n');
}
