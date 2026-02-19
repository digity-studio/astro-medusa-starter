import { sdk } from "@lib/sdk";
import type { HttpTypes } from "@medusajs/types";

const DEFAULT_REGION = import.meta.env.DEFAULT_REGION;

const regionMap = new Map<string, HttpTypes.StoreRegion>();

export const listRegions = async () => {
  try {
    const { regions } = await sdk.store.region.list();
    return regions;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch regions");
  }
};

export const getRegion = async (countryCode: string) => {
  try {
    if (regionMap.has(countryCode)) {
      return regionMap.get(countryCode);
    }

    const regions = await listRegions();

    if (!regions) {
      return null;
    }

    regions.forEach((region) => {
      region.countries?.forEach((country) => {
        regionMap.set(country.iso_2 ?? "", region);
      });
    });

    const region = countryCode
      ? regionMap.get(countryCode)
      : regionMap.get(DEFAULT_REGION);

    return region;
  } catch {
    return null;
  }
};
