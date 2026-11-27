// Static data: currency, default users, flights, Vista Mare units, destinations

const EUR_RATE = 0.92;

const DEFAULT_USERS = []; // Authentication is handled by Supabase; no public default credentials.

const DEFAULT_FLIGHTS = [
  { id: "F1", flightNo: "KTA102", airline: "Cyprus Airways", from: "TLV", to: "LCA", depTime: "10:40", arrTime: "11:45", duration: "1h 05m", stops: 0, cabin: "Economy", priceUSD: 140, seats: 19 },
  { id: "F2", flightNo: "KTA108", airline: "Aegean Airlines", from: "TLV", to: "LCA", depTime: "15:15", arrTime: "16:20", duration: "1h 05m", stops: 0, cabin: "Flex", priceUSD: 175, seats: 12 },
  { id: "F3", flightNo: "KTA101", airline: "Aegean Airlines", from: "TLV", to: "ATH", depTime: "07:15", arrTime: "09:35", duration: "2h 20m", stops: 0, cabin: "Economy", priceUSD: 185, seats: 24 },
  { id: "F4", flightNo: "KTA103", airline: "Corendon Airlines", from: "TLV", to: "HER", depTime: "13:20", arrTime: "15:10", duration: "1h 50m", stops: 0, cabin: "Flex", priceUSD: 215, seats: 14 },
  { id: "F5", flightNo: "KTA104", airline: "Aegean Airlines", from: "TLV", to: "SKG", depTime: "06:30", arrTime: "11:15", duration: "4h 45m", stops: 1, cabin: "Economy", priceUSD: 195, seats: 11 },
  { id: "F6", flightNo: "KTA105", airline: "Cyprus Airways", from: "TLV", to: "PFO", depTime: "16:00", arrTime: "17:10", duration: "1h 10m", stops: 0, cabin: "Business", priceUSD: 340, seats: 8 },
  { id: "F7", flightNo: "KTA106", airline: "Aegean Airlines", from: "TLV", to: "RHO", depTime: "09:10", arrTime: "11:05", duration: "1h 55m", stops: 0, cabin: "Economy", priceUSD: 205, seats: 16 }
];

// Vista Mare Cyprus Units (Official room types from vistamarecyprus.com — rates checked live on website)
const FALLBACK_RESORT_IMG = "https://vistamarecyprus.com/wp-content/uploads/2026/10/home-new-1-768x1024.webp";
const FALLBACK_DEST_IMG = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80";

const VISTA_MARE_UNITS = [
  {
    id: "VM_LOFT",
    name: "Standard (Loft)",
    capacity: "Up to 2 guests • Loft",
    rateUSD: 0,
    priceNote: "Rates by Date • Check on Website",
    img: "https://vistamarecyprus.com/wp-content/uploads/2026/10/03-07-scaled.webp",
    desc: "Modern loft room in Yeni İskele with outdoor pool access, Wi-Fi, housekeeping, and breakfast option."
  },
  {
    id: "VM_SEA",
    name: "Standard – Sea View",
    capacity: "Up to 2 guests • Sea View",
    rateUSD: 0,
    priceNote: "Rates by Date • Check on Website",
    img: "https://vistamarecyprus.com/wp-content/uploads/2026/10/03-10-scaled.webp",
    desc: "Wake up to Mediterranean sea views on the east coast of Northern Cyprus with direct hotel service."
  },
  {
    id: "VM_MTN",
    name: "Standard – Mountain View",
    capacity: "Up to 2 guests • Mountain View",
    rateUSD: 0,
    priceNote: "Rates by Date • Check on Website",
    img: "https://vistamarecyprus.com/wp-content/uploads/2026/10/03-08-scaled.webp",
    desc: "Comfortable room overlooking the mountains in Yeni İskele with outdoor pool & guest parking."
  },
  {
    id: "VM_PREM",
    name: "Deluxe & Premium Sea-View Rooms",
    capacity: "Standard, Deluxe & Premium • Loft Options",
    rateUSD: 0,
    priceNote: "Rates by Date • Check on Website",
    img: "https://vistamarecyprus.com/wp-content/uploads/2026/10/03-01-scaled.webp",
    desc: "Spacious seaside accommodation in Yeni İskele with optional Larnaca Airport (LCA) pick-up transfer."
  }
];

const DESTINATIONS = [
  {
    code: "LCA",
    title: "LARNACA + VISTA MARE",
    name: "Larnaca",
    fromPriceUSD: 140,
    img: "https://images.pexels.com/photos/36725370/pexels-photo-36725370.jpeg?auto=compress&cs=tinysrgb&w=1400",
    desc: "Discover Cyprus at your own pace, from the Larnaca waterfront to the island’s eastern coast. You can also explore a selected stay at Vista Mare in Yeni İskele."
  },
  {
    code: "ATH",
    title: "ATHENS",
    name: "Athens",
    fromPriceUSD: 185,
    img: "https://images.pexels.com/photos/17313270/pexels-photo-17313270.jpeg?auto=compress&cs=tinysrgb&w=1400",
    desc: "Discover the heritage and energy of Greece’s capital, from the Acropolis and historic districts to its contemporary dining and culture."
  },
  {
    code: "SKG",
    title: "THESSALONIKI",
    name: "Thessaloniki",
    fromPriceUSD: 195,
    img: "https://images.pexels.com/photos/37845027/pexels-photo-37845027.jpeg?auto=compress&cs=tinysrgb&w=1400",
    desc: "Experience Thessaloniki’s lively waterfront, Byzantine heritage, welcoming neighbourhoods and celebrated local cuisine."
  },
  {
    code: "HER",
    title: "HERAKLION",
    name: "Heraklion",
    fromPriceUSD: 215,
    img: "https://images.pexels.com/photos/36789371/pexels-photo-36789371.jpeg?auto=compress&cs=tinysrgb&w=1400",
    desc: "Discover Heraklion, the gateway to Crete’s Minoan heritage, distinctive cuisine and varied coastal landscapes."
  },
  {
    code: "RHO",
    title: "RHODES",
    name: "Rhodes",
    fromPriceUSD: 205,
    img: "https://images.pexels.com/photos/31096100/pexels-photo-31096100.jpeg?auto=compress&cs=tinysrgb&w=1400",
    desc: "Explore Rhodes’ medieval Old Town, scenic coastline and relaxed island atmosphere."
  },
  {
    code: "PFO",
    title: "PAPHOS",
    name: "Paphos",
    fromPriceUSD: 230,
    img: "https://images.pexels.com/photos/30563627/pexels-photo-30563627.jpeg?auto=compress&cs=tinysrgb&w=1400",
    desc: "Discover Paphos on Cyprus’s southwest coast, with its archaeological heritage, picturesque harbour and Mediterranean beaches."
  }
];
