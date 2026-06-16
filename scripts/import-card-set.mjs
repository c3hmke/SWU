import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const DATABASE_NAME = 'swu-singles-nz';

const args = process.argv.slice(2);
const setIdentifier = args.find(arg => !arg.startsWith('--'));
const isRemote = args.includes('--remote');

if (!setIdentifier) {
  console.error('Usage: npm run cards:import:official -- <set-code-or-swu-id> [--remote]');
  process.exit(1);
}

const cardSet = await fetchOfficialCardSet(setIdentifier.toUpperCase());
const sql = buildImportSql(cardSet);
const tempDir = await mkdtemp(join(tmpdir(), 'swu-card-import-'));
const sqlPath = join(tempDir, `${cardSet.code}.sql`);

try {
  await writeFile(sqlPath, sql, 'utf8');

  const result = spawnSync(
    'npx',
    ['wrangler', 'd1', 'execute', DATABASE_NAME, isRemote ? '--remote' : '--local', '--file', sqlPath],
    { stdio: 'inherit' }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log(`Imported ${cardSet.cards.length} cards for ${cardSet.name} (${cardSet.code}).`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

async function fetchOfficialCardSet(setIdentifier) {
  const pageSize = 100;
  const expansion = await fetchOfficialExpansion(setIdentifier);
  let page = 1;
  let pageCount = 1;
  const cardsByCollectorNumber = new Map();

  while (page <= pageCount) {
    const url = new URL('https://admin.starwarsunlimited.com/api/card-list');
    url.searchParams.set('locale', 'en');
    url.searchParams.set('pagination[page]', page.toString());
    url.searchParams.set('pagination[pageSize]', pageSize.toString());
    url.searchParams.set('filters[expansion][id][$eq]', expansion.id.toString());

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Official card API request failed with status ${response.status}.`);
    }

    const payload = await response.json();
    const rows = Array.isArray(payload.data) ? payload.data : [];
    pageCount = payload.meta?.pagination?.pageCount ?? pageCount;

    for (const row of rows) {
      const attributes = row.attributes;
      if (!attributes) {
        continue;
      }

      if (!Number.isInteger(attributes.cardNumber) || !attributes.title) {
        continue;
      }

      if (cardsByCollectorNumber.has(attributes.cardNumber)) {
        continue;
      }

      cardsByCollectorNumber.set(attributes.cardNumber, {
        collectorNumber: attributes.cardNumber,
        name: attributes.subtitle ? `${attributes.title} - ${attributes.subtitle}` : attributes.title,
        imageUrl: readOfficialImageUrl(attributes)
      });
    }

    page += 1;
  }

  const totalCards = cardsByCollectorNumber.size;

  if (totalCards === 0) {
    throw new Error(`No official cards found for expansion ${expansion.code} (${expansion.id}).`);
  }

  return {
    code: expansion.code,
    swuId: expansion.id,
    name: expansion.name,
    totalCards,
    cards: [...cardsByCollectorNumber.values()].sort((left, right) => left.collectorNumber - right.collectorNumber)
  };
}

async function fetchOfficialExpansion(setIdentifier) {
  const url = new URL('https://admin.starwarsunlimited.com/api/card-expansions');
  url.searchParams.set('locale', 'en');
  url.searchParams.set('pagination[pageSize]', '1');

  if (/^\d+$/.test(setIdentifier)) {
    url.searchParams.set('filters[id][$eq]', setIdentifier);
  } else {
    url.searchParams.set('filters[code][$eq]', setIdentifier);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Official expansion API request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const row = Array.isArray(payload.data) ? payload.data[0] : null;
  if (!row?.id || !row.attributes?.code || !row.attributes?.name) {
    throw new Error(`No official expansion found for ${setIdentifier}.`);
  }

  return { id: row.id, code: row.attributes.code, name: row.attributes.name };
}

function readOfficialImageUrl(attributes) {
  return (
    attributes.artFront?.data?.attributes?.formats?.card?.url ??
    attributes.artFront?.data?.attributes?.url ??
    attributes.artThumbnail?.data?.attributes?.formats?.thumbnail?.url ??
    attributes.artThumbnail?.data?.attributes?.url ??
    null
  );
}

function buildImportSql(cardSet) {
  const statements = [
    `insert into sets (code, swu_id, name, total_cards)
     values (${sqlString(cardSet.code)}, ${cardSet.swuId}, ${sqlString(cardSet.name)}, ${cardSet.totalCards})
     on conflict(code) do update set
       swu_id = excluded.swu_id,
       name = excluded.name,
       total_cards = excluded.total_cards,
       updated_at = CURRENT_TIMESTAMP;`
  ];

  for (const card of cardSet.cards) {
    const id = createCardId(cardSet.code, card.collectorNumber);
    statements.push(
      `insert into cards (id, set_code, collector_number, name, image_url)
       values (${sqlString(id)}, ${sqlString(cardSet.code)}, ${card.collectorNumber}, ${sqlString(card.name)}, ${sqlNullableString(card.imageUrl)})
       on conflict(id) do update set
         set_code = excluded.set_code,
         collector_number = excluded.collector_number,
         name = excluded.name,
         image_url = excluded.image_url,
         updated_at = CURRENT_TIMESTAMP;`
    );
  }

  return `${statements.join('\n\n')}\n`;
}

function createCardId(setCode, collectorNumber) {
  return `${setCode}${collectorNumber.toString().padStart(3, '0')}`;
}

function sqlString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlNullableString(value) {
  return value === null ? 'null' : sqlString(value);
}
