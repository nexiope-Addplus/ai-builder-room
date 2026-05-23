// Fetch AI-related news from public RSS feeds and upsert into Supabase.
// Run via GitHub Actions on a 2-hour cron, or manually:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/fetch-news.mjs

const SOURCES = [
  { name: "GeekNews", url: "https://news.hada.io/rss/news", filter: false },
  { name: "AI타임즈", url: "https://www.aitimes.com/rss/allArticle.xml", filter: true }
];

const AI_KEYWORDS = /AI|인공지능|GPT|Claude|머신러닝|딥러닝|LLM|생성형|에이전트|로봇|챗봇|GenAI|OpenAI|Anthropic|구글|MS|메타|엔비디아/i;

function decodeEntities(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(html) {
  return decodeEntities(String(html || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function unwrapCdata(text) {
  return String(text || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return m ? unwrapCdata(m[1]) : "";
}

function parseRSS(xml) {
  const items = [];
  const rssMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of rssMatches) {
    items.push({
      title: stripTags(tag(block, "title")),
      link: tag(block, "link").trim(),
      description: stripTags(tag(block, "description")),
      pubDate: tag(block, "pubDate").trim() || tag(block, "dc:date").trim()
    });
  }
  const atomMatches = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  for (const block of atomMatches) {
    const linkAttr = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
    const link = linkAttr ? linkAttr[1] : tag(block, "link").trim();
    const content = tag(block, "content") || tag(block, "summary");
    items.push({
      title: stripTags(tag(block, "title")),
      link: link.trim(),
      description: stripTags(content),
      pubDate: tag(block, "published").trim() || tag(block, "updated").trim()
    });
  }
  return items;
}

async function fetchSource(src) {
  const res = await fetch(src.url, {
    headers: { "User-Agent": "ai-builder-room-news-fetcher/1.0" }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  return parseRSS(xml);
}

function toRow(src, item) {
  if (!item.title || !item.link) return null;
  if (src.filter && !AI_KEYWORDS.test(`${item.title} ${item.description}`)) return null;
  let publishedAt = null;
  if (item.pubDate) {
    const t = new Date(item.pubDate).getTime();
    if (!Number.isNaN(t)) publishedAt = new Date(t).toISOString();
  }
  return {
    source: src.name,
    title: item.title.slice(0, 500),
    url: item.link.slice(0, 1000),
    summary: item.description ? item.description.slice(0, 800) : null,
    published_at: publishedAt
  };
}

async function upsert(rows, supabaseUrl, serviceKey) {
  const res = await fetch(`${supabaseUrl}/rest/v1/news_items?on_conflict=url`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal"
    },
    body: JSON.stringify(rows)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upsert failed ${res.status}: ${text}`);
  }
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const collected = [];
  for (const src of SOURCES) {
    try {
      const items = await fetchSource(src);
      for (const item of items.slice(0, 25)) {
        const row = toRow(src, item);
        if (row) collected.push(row);
      }
      console.log(`[${src.name}] parsed ${items.length} items`);
    } catch (error) {
      console.error(`[${src.name}] fetch failed:`, error.message);
    }
  }

  if (!collected.length) {
    console.log("No items collected, exiting");
    return;
  }

  await upsert(collected, supabaseUrl, serviceKey);
  console.log(`Upserted ${collected.length} rows (duplicates ignored)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
