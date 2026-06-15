import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const DATABASE_NAME = 'swu-singles-nz';

const args = process.argv.slice(2);
const isOfficial = args.includes('--official');
const jsonPath = args.find(arg => !arg.startsWith('--'));
const isRemote = args.includes('--remote');

if (!jsonPath) {
  console.error('Usage: npm run cards:import -- <path-to-set-json> [--remote]');
  console.error('   or: npm run cards:import:official -- <set-code-or-swu-id> [--remote]');
  process.exit(1);
}

const cardSet = isOfficial
  ? await fetchOfficialCardSet(jsonPath.toUpperCase())
  : validateCardSetImport(JSON.parse(await readFile(resolve(jsonPath), 'utf8')));
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
  let totalCards = null;

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

      totalCards ??= attributes.cardCount ?? null;

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

  if (!totalCards) {
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

function validateCardSetImport(value) {
  if (!isRecord(value)) {
    throw new Error('Card set import must be an object.');
  }

  const code = readRequiredString(value, 'code').toUpperCase();
  const swuId = readRequiredInteger(value, 'swuId');
  const name = readRequiredString(value, 'name');
  const totalCards = readRequiredInteger(value, 'totalCards');

  if (!/^[A-Z0-9]{2,5}$/.test(code)) {
    throw new Error('Set code must be 2-5 uppercase letters/numbers, e.g. SOR or LAWP.');
  }

  if (!Array.isArray(value.cards) || value.cards.length === 0) {
    throw new Error('cards must be a non-empty array.');
  }

  const seenCollectorNumbers = new Set();
  const cards = value.cards.map((card, index) => {
    if (!isRecord(card)) {
      throw new Error(`cards[${index}] must be an object.`);
    }

    const collectorNumber = readRequiredInteger(card, 'collectorNumber');
    if (collectorNumber < 1) {
      throw new Error(`cards[${index}].collectorNumber must be greater than 0.`);
    }

    if (seenCollectorNumbers.has(collectorNumber)) {
      throw new Error(`Duplicate collector number ${collectorNumber}.`);
    }

    seenCollectorNumbers.add(collectorNumber);

    return {
      collectorNumber,
      name: readRequiredString(card, 'name'),
      imageUrl: readOptionalString(card, 'imageUrl')
    };
  });

  return { code, swuId, name, totalCards, cards };
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

function readRequiredString(record, key) {
  const value = record[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${key} must be a non-empty string.`);
  }

  return value.trim();
}

function readOptionalString(record, key) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string when provided.`);
  }

  return value.trim() || null;
}

function readRequiredInteger(record, key) {
  const value = record[key];
  if (!Number.isInteger(value)) {
    throw new Error(`${key} must be an integer.`);
  }

  return value;
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
