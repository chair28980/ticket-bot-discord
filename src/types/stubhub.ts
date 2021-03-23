interface Ancestor {
  categories: Entity<"category">[];
  groupings: Entity<"grouping">[];
  performers: Entity<"performer">[];
}

interface Entity<T> {
  type?: T;
  name: string;
  id: number;
}

export interface Ticket {
  minListPrice: number;
  maxListPrice: number;
  totalTickets: number;
  totalListings: number;
}

interface Venue {
  id: number;
  name: string;
  city: string;
  postalCode: string;
  country: string;
  venueConfigId: number;
  venueConfigName: string;
}

export interface Event {
  id: number;
  status: string;
  locale: string;
  name: string;
  description: string;
  webURI: string;
  eventDateLocal: string;
  eventDateUTC: string;
  hideEventDate: boolean;
  hideEventTime: boolean;
  createdDate: string;
  lastUpdatedDate: string;
  timezone: string;
  currencyCode: string;
  venue: Venue;
  ancestors: Ancestor;
  performers: Entity<"performers">[];
  ticketInfo: Ticket;
}
export interface Listing {
  listingId: number;
  pricePerProduct: Money;
  isGA: number;
  row?: string;
  quantity: number;
  products?: Product[];
  sellerSectionName: string;
  sectionName: string;
  sectionId: number;
  isSectionMapped: boolean;
  zone: string;
  zoneId: number;
  splitOption: SplitOption | string;
  splitQuantity: string;
  buyQuantityOptions: number[];
  sellerOwnInd: number;
  deliveryTypeList: DeliveryTypeList | number[];
  listingAttributeList?: any[];
  listingAttributeCategoryList?: any[];
  faceValue?: Money;
}

interface Product {
  row: string;
  seat: string;
}

interface Money {
  amount: number;
  currency: string;
}

enum SplitOption {
  NONE = "NONE",
  NOSINGLES = "NOSINGLES",
  MULTIPLES = "MULTIPLES",
}

enum DeliveryTypeList {
  "Electronic" = 1,
  "Electronic Instant Download" = 2,
  "FedEx" = 3,
  "Pickup" = 4,
  "UPS" = 5,
  "Royal Mail" = 6,
  "Deutsche Post" = 7,
  "MobileId" = 8,
  "Mobile Ticket" = 9,
  "External Transfer" = 10,
  "Courier" = 11,
  "Mobile Ticket Instant" = 12,
  "MobileId Non Instant" = 13,
  "Electronic and Mobile Ticket" = 14,
  "Electronic and Mobile Ticket Instant" = 15,
  "LocalDelivery" = 16,
}

export interface StubHubEventResponse {
  numFound: number;
  events: Event[];
}

export interface StubHubListingResponse {
  eventId: number;
  totalListings: number;
  totalTickets: number;
  minQuantity: number;
  maxQuantity: number;
  numFound: number;
  start: number;
  rows: number;
  listings: Listing[];
}

export interface RefreshTokenResponse {
  token_type: string;
  application_name: string;
  client_id: string;
  access_token: string;
  issued_at: string;
  expires_in: string;
  refresh_token: string;
  refresh_token_issued_at: string;
  refresh_token_expires_in: string;
  status: string;
}

export interface AccessTokenResponse extends RefreshTokenResponse {
  api_product_list: string;
  user_guid: string;
}
