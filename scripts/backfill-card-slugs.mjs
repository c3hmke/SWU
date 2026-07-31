import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const DATABASE_NAME = 'swu-singles-nz';
const isRemote = process.argv.slice(2).includes('--remote');
const locationFlag = isRemote ? '--remote' : '--local';

const cards = readCards();
const statements = cards
  .map(card => ({ ...card, slug: createCardSlug(card) }))
  .map(card => `update cards set slug = ${sqlString(card.slug)} where id = ${sqlString(card.id)} and slug is null;`);

if (statements.length === 0) {
  console.log('No cards require slug backfilling.');
  process.exit(0);
}

const tempDir = await mkdtemp(join(tmpdir(), 'swu-card-slug-backfill-'));
const sqlPath = join(tempDir, 'backfill-card-slugs.sql');

try {
  await writeFile(sqlPath, `${statements.join('\n')}\n`, 'utf8');

  const result = spawnSync(
    'npx',
    ['wrangler', 'd1', 'execute', DATABASE_NAME, locationFlag, '--yes', '--json', '--file', sqlPath],
    { encoding: 'utf8' }
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  console.log(`Backfilled immutable slugs for ${statements.length} cards.`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

function readCards() {
  const result = spawnSync(
    'npx',
    [
      'wrangler', 'd1', 'execute', DATABASE_NAME, locationFlag, '--json',
      '--command', 'select id, name from cards where slug is null order by id'
    ],
    { encoding: 'utf8' }
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  const payload = JSON.parse(result.stdout);
  return Array.isArray(payload?.[0]?.results) ? payload[0].results : [];
}

function createCardSlug(card) {
  const nameSlug = slugify(card.name);
  const cardId = card.id.toLowerCase();
  return nameSlug ? `${nameSlug}-${cardId}` : cardId;
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sqlString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}
