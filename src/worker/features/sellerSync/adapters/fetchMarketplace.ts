import type { ExternalListing, Seller, SellerAdapter, SyncCard } from '../model';

const API_BASE_URL = 'https://api.fetchtcg.com';
const WEB_BASE_URL = 'https://www.fetchtcg.com';
const MAX_PAGES = 50;
const PAGE_SIZE = 10;
const USER_AGENT = 'SWU Singles NZ inventory sync (+https://swu-singles-nz.pages.dev)';

type FetchListingsResponse = {
  searchResults?: {
    content?: FetchListing[];
    totalPages?: number;
  };
};

type FetchListing = {
  id?: number;
  card?: {
    id?: string;
    name?: string;
    cardCode?: string;
    set?: {
      displayName?: string;
    };
  };
  condition?: string | null;
  listedPriceInRequestedCurrency?: number;
  requestedCurrency?: string;
  remainingQuantity?: number;
  sellerBusinessName?: string | null;
  sellerProfileName?: string | null;
  sellerRating?: number | null;
  business?: boolean | null;
  regionAddress?: {
    suburb?: string | null;
    city?: string | null;
    country?: string | null;
    allowPickups?: boolean | null;
  } | null;
  listedCountry?: string | null;
  urlName?: string | null;
};

export const fetchMarketplaceAdapter: SellerAdapter = {
  key: 'fetch-marketplace',

  async fetchListings(_seller: Seller, _cards: SyncCard[]): Promise<ExternalListing[]> {
    const listings: ExternalListing[] = [];

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const data = await fetchListingPage(page);
      const pageListings = data.searchResults?.content ?? [];

      listings.push(...pageListings.flatMap(mapFetchListing));

      const totalPages = data.searchResults?.totalPages ?? page + 1;
      if (pageListings.length === 0 || page + 1 >= totalPages) {
        break;
      }
    }

    return listings;
  }
};

async function fetchListingPage(page: number): Promise<FetchListingsResponse> {
  const url = new URL('/v1/market/listings', API_BASE_URL);
  url.searchParams.set('pageSize', PAGE_SIZE.toString());
  url.searchParams.set('page', page.toString());
  url.searchParams.set('gameIds', 'star');
  url.searchParams.set('countryCode', 'NZ');
  url.searchParams.set('currencyCode', 'NZD');

  const response = await fetch(url.toString(), {
    headers: {
      accept: 'application/json',
      origin: WEB_BASE_URL,
      referer: `${WEB_BASE_URL}/marketplace/games/star`,
      'user-agent': USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`Fetch marketplace request failed with status ${response.status}`);
  }

  return response.json() as Promise<FetchListingsResponse>;
}

function mapFetchListing(listing: FetchListing): ExternalListing[] {
  const id = listing.id?.toString();
  const productName = createProductName(listing);
  const priceNzd = listing.listedPriceInRequestedCurrency;
  const quantity = listing.remainingQuantity ?? 0;

  if (!id || !productName || typeof priceNzd !== 'number' || priceNzd < 0 || quantity < 1) {
    return [];
  }

  const sellerName = listing.sellerBusinessName || listing.sellerProfileName || null;

  return [{
    externalId: id,
    productName,
    condition: mapCondition(listing.condition),
    priceNzd,
    quantity,
    productUrl: `${WEB_BASE_URL}/marketplace/listings/${id}`,
    marketplaceSellerName: sellerName,
    marketplaceSellerProfileName: listing.sellerProfileName ?? null,
    marketplaceSellerLocation: formatLocation(listing),
    marketplaceSellerRating: typeof listing.sellerRating === 'number' ? listing.sellerRating : null,
    marketplaceIsStore: typeof listing.business === 'boolean' ? listing.business : null,
    marketplaceAllowPickups:
      typeof listing.regionAddress?.allowPickups === 'boolean' ? listing.regionAddress.allowPickups : null,
    raw: listing
  }];
}

function createProductName(listing: FetchListing): string | null {
  const card = listing.card;
  const cardName = card?.name?.trim();
  const setName = card?.set?.displayName?.trim();
  const collectorNumber = card?.cardCode?.match(/^\d+/)?.[0];

  if (!cardName || !setName || !collectorNumber) {
    return null;
  }

  return `${cardName} (${collectorNumber}) [${setName}]`;
}

function mapCondition(condition: string | null | undefined): string | null {
  switch (condition) {
    case 'raw-m':
      return 'Mint';
    case 'raw-nm':
      return 'Near Mint';
    case 'raw-lp':
      return 'Lightly Played';
    case 'raw-mp':
      return 'Moderately Played';
    case 'raw-hp':
      return 'Heavily Played';
    case 'raw-dmg':
      return 'Damaged';
    default:
      return condition ?? null;
  }
}

function formatLocation(listing: FetchListing): string | null {
  const parts = [listing.regionAddress?.suburb, listing.regionAddress?.city, listing.regionAddress?.country ?? listing.listedCountry]
    .map(part => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(', ') : null;
}
