import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDailySocialCopy, buildRssXml, classifyItem, scoreAlpha } from '../src/alpha.mjs';

describe('AI Alpha CN core', () => {
	test('classifies MCP and Agent items into Chinese categories', () => {
		const tags = classifyItem('mcp-agent-shield', 'Autonomous coding agent MCP firewall');
		assert.ok(tags.includes('Agent / 自动化'));
		assert.ok(tags.includes('MCP / 协议生态'));
	});

	test('scores high-traction items higher and builds valid RSS + social copy', () => {
		assert.ok(scoreAlpha({ stars: 800 }) > scoreAlpha({ stars: 40 }));
		const feed = {
			generatedAt: '2026-11-23T12:00:00Z',
			items: [
				{
					source: 'GitHub',
					title: 'demo/ai-tool',
					summary: 'Fast local agent runtime',
					url: 'https://github.com/demo/ai-tool',
					stars: 420,
					points: 0,
					tags: ['Agent / 自动化'],
				},
			],
		};
		assert.match(buildRssXml(feed), /<rss version="2.0">/);
		assert.match(buildDailySocialCopy(feed), /海外 AI 一手信息差日报/);
	});
});
