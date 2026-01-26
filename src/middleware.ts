import { HttpTypes } from "@medusajs/types";
import { DEFAULT_REGION, MEDUSA_BACKEND_URL } from "astro:env/client";
import { MEDUSA_PUBLISHABLE_KEY } from "astro:env/server";
import { defineMiddleware } from "astro:middleware";

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
};

/**
 * Fetches regions from Medusa and caches them in a map.
 * @returns A map of country codes to regions.
 */
async function getRegionMap() {
  const { regionMap, regionMapUpdated } = regionMapCache;

  if (!MEDUSA_BACKEND_URL) {
    throw new Error(
      "src/middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable?"
    );
  }

  const isCacheValid =
    regionMap.keys().next().value &&
    regionMapUpdated > Date.now() - 3600 * 1000; // 1 hour

  if (!isCacheValid) {
    const { regions } = await fetch(`${MEDUSA_BACKEND_URL}/store/regions`, {
      headers: {
        "x-publishable-api-key": MEDUSA_PUBLISHABLE_KEY,
      },
    }).then(async (response) => {
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message);
      }

      return json;
    });

    if (!regions?.length) {
      throw new Error(
        "No regions found. Please set up regions in your Medusa Admin."
      );
    }

    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((country) => {
        regionMapCache.regionMap.set(country.iso_2 ?? "", region);
      });
    });

    regionMapCache.regionMapUpdated = Date.now();
  }

  return regionMapCache.regionMap;
}

/**
 * Gets the country code from the URL pathname.
 * @param pathname
 * @returns The country code.
 */
async function getCountryCode(pathname: string) {
  let countryCode;

  const urlCountryCode = pathname.split("/")[1]?.toLowerCase();

  const regionMap = await getRegionMap();

  if (urlCountryCode && regionMap.has(urlCountryCode)) {
    countryCode = urlCountryCode;
  } else if (regionMap.has(DEFAULT_REGION)) {
    countryCode = DEFAULT_REGION;
  } else if (regionMap.keys().next().value) {
    countryCode = regionMap.keys().next().value;
  }

  return countryCode;
}

export const onRequest = defineMiddleware(async (context, next) => {
  let redirectUrl = context.url.href;
  const origin = context.url.origin;
  const pathname = context.url.pathname;
  const search = context.url.search;

  const countryCode = await getCountryCode(pathname);

  const urlHasCountryCode =
    (countryCode && pathname.split("/")[1] === countryCode) ||
    pathname.split("/")[1].includes(`${countryCode}/`);

  if (urlHasCountryCode) {
    return next();
  }

  const redirectPath = pathname === "/" ? "" : pathname;

  const queryString = search || "";

  if (!urlHasCountryCode && countryCode) {
    redirectUrl = `${origin}/${countryCode}${redirectPath}${queryString}`;
    return context.redirect(redirectUrl, 307);
  }

  return next();
});
