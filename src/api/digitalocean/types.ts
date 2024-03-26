/**
 * `T` has an ID property.
 */
export type WithId<T = unknown> = { id: number } & T;

/**
 * https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_get
 */
export type Domain = {
  name: string;
  ttl: number;
  zone_file: string;
};

/**
 * https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_list
 */
export type Domains = {
  domains: Domain[];
};

/**
 * https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records
 */
export type ResourceRecord = WithId<{
  type: string;
  name: string;
  data: string;
  ttl: number;
  priority: number | null;
  port: number | null;
  weight: number | null;
  flags: number | null;
  tag: string | null;
}>;

/**
 * https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_list_records
 */
export type ResourceRecords = {
  domain_records: ResourceRecord[];
};

/**
 * https://docs.digitalocean.com/reference/api/api-reference/#section/Introduction/Links-and-Pagination
 */
export type Links = {
  links: { pages: { next: string } };
};
