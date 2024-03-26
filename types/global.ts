import { makeCloudflareApiCaller } from 'universe/api/cloudflare';
import { makeDigitalOceanApiCaller } from 'universe/api/digitalocean';
import { $originApi } from 'universe/constant';

export type ApiCallerFactory =
  | typeof makeCloudflareApiCaller
  | typeof makeDigitalOceanApiCaller;

export type WithOriginalApi<T> = { [$originApi]: 'cloudflare' | 'digitalocean' } & T;
