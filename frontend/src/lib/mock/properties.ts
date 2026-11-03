import type { PropertyDetails, PropertyImage } from "@/types/property";

/**
 * Mock data for building the Buyer pages before the backend API is ready.
 * Shape must match GET /api/v1/properties/{id} (see src/types/property.ts).
 * Delete this file once the real API is integrated.
 */

const PLACEHOLDER_IMAGE_URL = "/mock/property-placeholder.svg";

function placeholderImages(title: string, count = 3): PropertyImage[] {
  return Array.from({ length: count }, (_, index) => ({
    url: PLACEHOLDER_IMAGE_URL,
    alt: `${title}, photo ${index + 1}`,
    order: index,
  }));
}

export const MOCK_PROPERTIES: readonly PropertyDetails[] = [
  {
    id: "7c9e6679-7425-40de-944b-e07fc1f90001",
    referenceCode: "P-1001",
    title: "Beachfront land, 20 perches, Habaraduwa",
    description:
      "A 20-perch beachfront block in Habaraduwa, Galle, with 24 ft road access and utilities close by. A short walk from the sea. The deed is freehold and a recent survey plan is available on request.",
    category: "LAND",
    listingType: "SALE",
    status: "PUBLISHED",
    price: 27_000_000,
    currency: "LKR",
    location: { address: "Habaraduwa, Galle", district: "Galle", latitude: 5.9987, longitude: 80.3125 },
    landDetails: { extentPerches: 20, pricePerPerch: 1_350_000, deedType: "Freehold", roadAccessFt: 24, facing: "South" },
    buildingDetails: null,
    rentalDetails: null,
    features: ["Walking distance to the beach", "Clear freehold deed", "Road frontage", "Electricity at boundary"],
    images: placeholderImages("Beachfront land, Habaraduwa"),
    owner: { name: "Ruwan Seneviratne", verified: true },
    createdAt: "2026-08-21T09:00:00Z",
  },
  {
    id: "7c9e6679-7425-40de-944b-e07fc1f90002",
    referenceCode: "P-1002",
    title: "3-bedroom apartment in Battaramulla",
    description:
      "Bright third-floor apartment close to the Parliament road, with covered parking, a backup generator and 24-hour security.",
    category: "APARTMENT",
    listingType: "SALE",
    status: "PUBLISHED",
    price: 68_000_000,
    currency: "LKR",
    location: { address: "Battaramulla, Colombo", district: "Colombo", latitude: 6.8995, longitude: 79.918 },
    landDetails: null,
    buildingDetails: { bedrooms: 3, bathrooms: 2, floorAreaSqft: 1_250, floors: 1 },
    rentalDetails: null,
    features: ["Covered parking", "Backup generator", "24-hour security", "Lift access"],
    images: placeholderImages("Apartment in Battaramulla"),
    owner: { name: "Amaya Perera", verified: true },
    createdAt: "2026-09-02T10:30:00Z",
  },
  {
    id: "7c9e6679-7425-40de-944b-e07fc1f90003",
    referenceCode: "P-1003",
    title: "4-bedroom family house in Nugegoda",
    description:
      "Two-storey family house on a quiet lane, close to schools and the High Level Road. Ten perches of land with a small garden.",
    category: "HOUSE",
    listingType: "SALE",
    status: "PUBLISHED",
    price: 86_000_000,
    currency: "LKR",
    location: { address: "Nugegoda, Colombo", district: "Colombo", latitude: 6.8649, longitude: 79.8997 },
    landDetails: { extentPerches: 10, pricePerPerch: null, deedType: "Freehold", roadAccessFt: 15, facing: "East" },
    buildingDetails: { bedrooms: 4, bathrooms: 3, floorAreaSqft: 2_400, floors: 2 },
    rentalDetails: null,
    features: ["Garden", "Two-car garage", "Close to schools", "Pipe-borne water"],
    images: placeholderImages("House in Nugegoda"),
    owner: { name: "Lahiru Fernando", verified: false },
    createdAt: "2026-09-15T08:15:00Z",
  },
  {
    id: "7c9e6679-7425-40de-944b-e07fc1f90004",
    referenceCode: "P-1004",
    title: "Luxury 3-bedroom apartment for rent, Colombo 03",
    description:
      "Fully furnished sea-view apartment with a swimming pool and gym. Suitable for families or professionals.",
    category: "APARTMENT",
    listingType: "RENT",
    status: "PUBLISHED",
    price: 380_000,
    currency: "LKR",
    location: { address: "Colombo 03, Colombo", district: "Colombo", latitude: 6.9006, longitude: 79.853 },
    landDetails: null,
    buildingDetails: { bedrooms: 3, bathrooms: 3, floorAreaSqft: 1_450, floors: 1 },
    rentalDetails: { monthlyRent: 380_000, depositAmount: 2_280_000, availableFrom: "2026-11-01", furnishing: "FURNISHED" },
    features: ["Sea view", "Swimming pool", "Gym", "Fully furnished"],
    images: placeholderImages("Apartment in Colombo 03"),
    owner: { name: "Sanduni Rahman", verified: true },
    createdAt: "2026-10-01T12:00:00Z",
  },
  {
    id: "7c9e6679-7425-40de-944b-e07fc1f90005",
    referenceCode: "P-1005",
    title: "40-perch freehold block in Weligama",
    description: "Flat, cleared land 1.2 km from Weligama town, ideal for a holiday home or villa project.",
    category: "LAND",
    listingType: "SALE",
    status: "PUBLISHED",
    price: 23_500_000,
    currency: "LKR",
    location: { address: "Weligama, Matara", district: "Matara", latitude: 5.9746, longitude: 80.4297 },
    landDetails: { extentPerches: 40, pricePerPerch: 587_500, deedType: "Freehold", roadAccessFt: 20, facing: "North" },
    buildingDetails: null,
    rentalDetails: null,
    features: ["Cleared and flat", "Close to town", "Electricity available"],
    images: placeholderImages("Land in Weligama", 2),
    owner: { name: "Nuwan Weerasinghe", verified: false },
    createdAt: "2026-10-10T07:45:00Z",
  },
  {
    // Not published: must NOT be visible to buyers. Used to test the "not found" path.
    id: "7c9e6679-7425-40de-944b-e07fc1f90006",
    referenceCode: "P-1006",
    title: "Commercial building awaiting review, Kandy",
    description: "Three-storey commercial building on the main road. Listing pending admin review.",
    category: "COMMERCIAL",
    listingType: "SALE",
    status: "PENDING_REVIEW",
    price: 145_000_000,
    currency: "LKR",
    location: { address: "Kandy City, Kandy", district: "Kandy", latitude: 7.2906, longitude: 80.6337 },
    landDetails: { extentPerches: 12, pricePerPerch: null, deedType: "Freehold", roadAccessFt: 30, facing: "West" },
    buildingDetails: { bedrooms: null, bathrooms: 4, floorAreaSqft: 6_000, floors: 3 },
    rentalDetails: null,
    features: ["Main road frontage", "Parking for 6 cars"],
    images: placeholderImages("Commercial building, Kandy", 1),
    owner: { name: "Buddhika Herath", verified: false },
    createdAt: "2026-10-20T09:00:00Z",
  },
];