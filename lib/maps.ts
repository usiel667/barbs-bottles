type AddressParts = {
  address1: string;
  city: string;
  state: string;
  zipCode: string;
};

export function formatAddress({ address1, city, state, zipCode }: AddressParts) {
  return `${address1}, ${city}, ${state} ${zipCode}`;
}

export function getMapEmbedUrl(address: string) {
  const key = process.env.GOOGLE_MAPS_EMBED_KEY;
  if (!key) return null;
  const params = new URLSearchParams({ key, q: address, zoom: "15" });
  return `https://www.google.com/maps/embed/v1/place?${params}`;
}
