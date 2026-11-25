import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const site = new URL('https://jinchiling42-droid.github.io/sweet-sweet-home/');
const build = fileURLToPath(new URL('../dist/', import.meta.url));
const files = new Map();

for (const entry of await readdir(build, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const absolutePath = join(entry.parentPath, entry.name);
  const segments = relative(build, absolutePath).split(sep);
  // Pages omits hidden files when packaging the site.
  if (segments.some(segment => segment.startsWith('.'))) continue;
  files.set(segments.join('/'), absolutePath);
}

if (!files.has('index.html')) throw new Error('The build is missing dist/index.html.');

function pageUrl(path) {
  return new URL(path.split('/').map(encodeURIComponent).join('/'), site);
}

function checkReference(source, value) {
  const reference = value.trim();
  if (!reference || reference.startsWith('#') || reference.startsWith('data:')) return;

  const url = new URL(reference, pageUrl(source));
  if (url.origin !== site.origin || !url.pathname.startsWith(site.pathname)) {
    throw new Error(`${source} references a resource outside the Pages site: ${reference}`);
  }

  const path = decodeURIComponent(url.pathname.slice(site.pathname.length));
  if (!files.has(path || 'index.html')) {
    throw new Error(`${source} references a missing build file: ${reference}`);
  }
}

for (const [path, absolutePath] of files) {
  if (path.endsWith('.html')) {
    const html = await readFile(absolutePath, 'utf8');
    const assetTags = html.matchAll(/<(?:script|link|img|audio|video|source|track)\b[^>]*>/gi);
    for (const [tag] of assetTags) {
      for (const match of tag.matchAll(/\s(?:src|href|poster)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
        checkReference(path, match[1] ?? match[2] ?? match[3]);
      }
    }
  }
  if (path.endsWith('.css')) {
    const css = await readFile(absolutePath, 'utf8');
    for (const match of css.matchAll(/\burl\(\s*(?:"([^"]*)"|'([^']*)'|([^"'\s)]+))\s*\)/gi)) {
      checkReference(path, match[1] ?? match[2] ?? match[3]);
    }
  }
}

console.log(`Checked asset paths under ${site.pathname} across ${files.size} build files.`);

async function sha256(stream) {
  const hash = createHash('sha256');
  for await (const chunk of stream) hash.update(chunk);
  return hash.digest('hex');
}

async function verifyPublishedFile(path, absolutePath) {
  const url = path === 'index.html' ? site : pageUrl(path);
  const expected = await sha256(createReadStream(absolutePath));
  let failure;
  // GitHub Pages can briefly serve the previous release while its CDN updates.
  for (const delay of [0, 5000, 12000, 25000, 40000]) {
    if (delay) await sleep(delay);
    try {
      const response = await fetch(url, {
        cache: 'no-cache',
        redirect: 'error',
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`HTTP ${response.status}`);
      }
      if (!response.body || await sha256(response.body) !== expected) {
        throw new Error('Response does not match the release artifact.');
      }
      console.log(`Verified ${url.href}`);
      return;
    } catch (error) {
      failure = error;
    }
  }
  throw new Error(`Could not verify ${url.href}`, { cause: failure });
}

const [publishedUrl] = process.argv.slice(2);
if (publishedUrl !== undefined) {
  if (new URL(publishedUrl).href !== site.href) {
    throw new Error(`Expected Pages URL ${site.href}, received ${publishedUrl}`);
  }
  const assets = [...files];
  for (let i = 0; i < assets.length; i += 4) {
    await Promise.all(assets.slice(i, i + 4).map(([path, absolutePath]) =>
      verifyPublishedFile(path, absolutePath)));
  }
}
