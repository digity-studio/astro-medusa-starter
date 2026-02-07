import { sdk } from "../sdk";

interface RegionParams {
  params: {
    countryCode: string;
  };
}

export const getRegionParams = async () => {
  try {
    const { regions } = await sdk.store.region.list();

    let paths: RegionParams[] = [];

    regions.forEach((region) => {
      region.countries?.forEach((country) => {
        if (!country.iso_2) {
          return;
        }

        paths.push({
          params: {
            countryCode: country.iso_2.toLowerCase(),
          },
        });
      });
    });

    return paths;
  } catch (error) {
    console.error(error);
    return [];
  }
};
