/* eslint-disable no-console */

/**
 * Node script (run from project root) to embed markdown knowledge into Supabase.
 *
 * Requirements:
 * - REACT_APP_VOYAGE_KEY
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_ANON_KEY
 */

const fs = require('fs/promises');
const path = require('path');

async function loadDotEnvIfPresent() {
  // Minimal .env loader (no dependencies). Does not override existing env vars.
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const raw = await fs.readFile(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!key) continue;
      if (process.env[key] == null) process.env[key] = value;
    }
  } catch (e) {
    // ignore missing .env
  }
}

async function listMarkdownFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listMarkdownFiles(full)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

function splitIntoChunks(text, chunkWords = 500, overlapWords = 50) {
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const words = normalized.split(' ');

  const chunks = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkWords, words.length);
    const chunk = words.slice(start, end).join(' ').trim();
    if (chunk) chunks.push(chunk);
    if (end >= words.length) break;
    start = Math.max(0, end - overlapWords);
  }
  return chunks;
}

async function embedChunk(voyageKey, chunkText) {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${voyageKey}`,
    },
    body: JSON.stringify({ input: [chunkText], model: 'voyage-3' }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Voyage embeddings failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length !== 1024) {
    throw new Error(`Unexpected embedding shape; expected 1024 dims, got ${embedding?.length}`);
  }
  return embedding;
}

async function main() {
  await loadDotEnvIfPresent();

  const voyageKey = process.env.REACT_APP_VOYAGE_KEY;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!voyageKey) throw new Error('Missing REACT_APP_VOYAGE_KEY');
  if (!supabaseUrl) throw new Error('Missing REACT_APP_SUPABASE_URL');
  if (!supabaseAnonKey) throw new Error('Missing REACT_APP_SUPABASE_ANON_KEY');

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const knowledgeDir = path.resolve(process.cwd(), 'src', 'knowledge');
  const mdFiles = await listMarkdownFiles(knowledgeDir);
  if (mdFiles.length === 0) {
    console.log('No markdown files found under src/knowledge/. Nothing to embed.');
    return;
  }

  const jobs = [];
  for (const filePath of mdFiles) {
    const raw = await fs.readFile(filePath, 'utf8');
    const chunks = splitIntoChunks(raw, 500, 50);
    const fileName = path.relative(knowledgeDir, filePath).replaceAll(path.sep, '/');
    chunks.forEach((chunk, chunkIndex) => {
      jobs.push({ fileName, chunkIndex, chunk });
    });
  }

  let embeddedCount = 0;
  const total = jobs.length;

  for (const job of jobs) {
    const embedding = await embedChunk(voyageKey, job.chunk);

    const { error } = await supabase.from('knowledge_base').insert({
      content: job.chunk,
      embedding,
      file_name: job.fileName,
      chunk_index: job.chunkIndex,
    });

    if (error) throw new Error(`Supabase insert failed: ${error.message}`);

    embeddedCount += 1;
    console.log(`Embedded chunk ${embeddedCount} of ${total} from file ${job.fileName}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

