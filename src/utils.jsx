import { FlyToInterpolator } from "@deck.gl/core";
import {
  SF,
  DENVER,
  HONOLULU,
  sfZipCodes,
  denverZipCodes,
  honoluluZipCodes,
} from "./constant-variables";

// Helper: assign a dummy value based on zip code membership and last two digits.
export function assignManualValue(feature) {
  const zip = feature.properties.ZCTA5CE10;
  let value = 50;
  if (sfZipCodes.includes(zip)) {
    value = parseInt(zip.slice(-2)) * 10; // SF: last two digits * 10
  } else if (denverZipCodes.includes(zip)) {
    value = parseInt(zip.slice(-2)) * 5; // Denver: last two digits * 5
  } else if (honoluluZipCodes.includes(zip)) {
    value = parseInt(zip.slice(-2)) * 8; // Honolulu: last two digits * 8
  }
  feature.properties.value = value;
  return feature;
}

export const flyToCity = (cityConfig, setViewState) => {
  setViewState({
    ...cityConfig,
    transitionInterpolator: new FlyToInterpolator({ speed: 1.2 }),
    transitionDuration: "auto",
  });
};
