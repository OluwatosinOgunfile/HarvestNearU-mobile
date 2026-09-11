// Keep in step with proximityLabel in the web client so both surfaces describe the same farm identically.
const WALK_MINUTES_PER_KM = 12;
const LONGEST_USEFUL_WALK = 45;

export function walkMinutes(distanceKm: number) {
  return Math.max(5, Math.round(Math.max(0, Number(distanceKm) || 0) * WALK_MINUTES_PER_KM / 5) * 5);
}

export function proximityLabel(distanceKm: number) {
  const distance = Math.max(0, Number(distanceKm) || 0);
  if (distance < .35) return 'Under 5 min walk';
  const minutes = walkMinutes(distance);
  if (minutes <= LONGEST_USEFUL_WALK) return `About ${minutes} min walk`;
  return `${distance < 10 ? distance.toFixed(1) : Math.round(distance)} km away`;
}

export function titleCase(value: string) {
  return value.trim().toLocaleLowerCase('en-NG').replace(/(^|[\s\-/])([\p{L}\p{N}])/gu, (_, separator: string, character: string) => `${separator}${character.toLocaleUpperCase('en-NG')}`);
}
