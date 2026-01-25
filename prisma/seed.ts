import { randomUUID } from "node:crypto";
import { PrismaClient, $Enums } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import bcrypt from "bcryptjs";
import { slugifyValue } from "../lib/utils";

const prisma = new PrismaClient();

async function ignoreDuplicate<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return null;
    }
    throw error;
  }
}

async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 500): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

async function pauseEvery(count: number, every: number, ms = 250) {
  if (count > 0 && count % every === 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

const transportMeanCategoriesSeedData = [
  {
    name: "AGV-AMR",
    description: "Autonomous mobile robots and guided vehicles for intralogistics.",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  {
    name: "Forklift",
    description: "Counterbalance and reach trucks for versatile handling.",
    imageUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef",
  },
  {
    name: "Tugger Train",
    description: "Tugger tractors with tow carts for milk runs.",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
  },
];

type TransportMeanSeed = {
  name: string;
  categoryName: string;
  supplierName?: string;
  plantName: string;
  loadCapacityKg: number;
  units: number;
  cruiseSpeedKmh: number;
  maxSpeedKmh: number;
  sop: Date;
  eop: Date;
  flowSlug?: string;
  secondaryFlowSlug?: string;
  packagingMeanNames?: string[];
};

const transportMeansSeedData: TransportMeanSeed[] = [
  // Detroit Assembly (7)
  { name: "AGV Shuttle D1", categoryName: "AGV-AMR", supplierName: "Midwest Machining", plantName: "Detroit Assembly", loadCapacityKg: 800, units: 4, cruiseSpeedKmh: 6, maxSpeedKmh: 10, sop: new Date("2026-01-10"), eop: new Date("2031-01-01"), packagingMeanNames: ["Utility Cart 01", "Picking Cart 01"] },
  { name: "AGV Shuttle D2", categoryName: "AGV-AMR", supplierName: "North Steel", plantName: "Detroit Assembly", loadCapacityKg: 750, units: 3, cruiseSpeedKmh: 7, maxSpeedKmh: 11, sop: new Date("2026-03-01"), eop: new Date("2031-03-01"), packagingMeanNames: ["Kitting Cart 02"] },
  { name: "Forklift D1", categoryName: "Forklift", supplierName: "Midwest Machining", plantName: "Detroit Assembly", loadCapacityKg: 2000, units: 5, cruiseSpeedKmh: 12, maxSpeedKmh: 18, sop: new Date("2026-05-01"), eop: new Date("2032-05-01"), packagingMeanNames: ["High Density Tower 01"] },
  { name: "Forklift D2", categoryName: "Forklift", supplierName: "North Steel", plantName: "Detroit Assembly", loadCapacityKg: 2200, units: 4, cruiseSpeedKmh: 13, maxSpeedKmh: 20, sop: new Date("2026-06-01"), eop: new Date("2032-06-01"), packagingMeanNames: ["Plastic Box 03"] },
  { name: "Tugger Loop D1", categoryName: "Tugger Train", supplierName: "Midwest Machining", plantName: "Detroit Assembly", loadCapacityKg: 1500, units: 6, cruiseSpeedKmh: 9, maxSpeedKmh: 14, sop: new Date("2026-07-01"), eop: new Date("2032-07-01"), packagingMeanNames: ["Picking Cart 05", "Kitting Cart 04"] },
  { name: "Tugger Loop D2", categoryName: "Tugger Train", supplierName: "North Steel", plantName: "Detroit Assembly", loadCapacityKg: 1400, units: 5, cruiseSpeedKmh: 8, maxSpeedKmh: 13, sop: new Date("2026-08-01"), eop: new Date("2032-08-01"), packagingMeanNames: ["Utility Cart 07"] },
  { name: "AMR Conveyor D3", categoryName: "AGV-AMR", supplierName: "Midwest Machining", plantName: "Detroit Assembly", loadCapacityKg: 900, units: 3, cruiseSpeedKmh: 7, maxSpeedKmh: 12, sop: new Date("2026-09-01"), eop: new Date("2032-09-01"), packagingMeanNames: ["Shopstock Hook 02"] },

  // Barcelona Assembly (7)
  { name: "AGV BCN 01", categoryName: "AGV-AMR", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 700, units: 4, cruiseSpeedKmh: 6, maxSpeedKmh: 10, sop: new Date("2026-01-15"), eop: new Date("2031-01-15"), packagingMeanNames: ["Picking Cart 02", "Utility Cart 03"] },
  { name: "AGV BCN 02", categoryName: "AGV-AMR", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 680, units: 3, cruiseSpeedKmh: 7, maxSpeedKmh: 11, sop: new Date("2026-02-15"), eop: new Date("2031-02-15"), packagingMeanNames: ["Kitting Cart 06"] },
  { name: "Forklift BCN 01", categoryName: "Forklift", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 2300, units: 5, cruiseSpeedKmh: 12, maxSpeedKmh: 19, sop: new Date("2026-04-01"), eop: new Date("2032-04-01"), packagingMeanNames: ["High Density Tower 05"] },
  { name: "Forklift BCN 02", categoryName: "Forklift", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 2100, units: 4, cruiseSpeedKmh: 13, maxSpeedKmh: 20, sop: new Date("2026-05-01"), eop: new Date("2032-05-01"), packagingMeanNames: ["Plastic Box 06"] },
  { name: "Tugger BCN 01", categoryName: "Tugger Train", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 1600, units: 6, cruiseSpeedKmh: 9, maxSpeedKmh: 14, sop: new Date("2026-06-01"), eop: new Date("2032-06-01"), packagingMeanNames: ["Picking Cart 09"] },
  { name: "Tugger BCN 02", categoryName: "Tugger Train", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 1550, units: 5, cruiseSpeedKmh: 8, maxSpeedKmh: 13, sop: new Date("2026-07-01"), eop: new Date("2032-07-01"), packagingMeanNames: ["Utility Cart 05"] },
  { name: "AMR Dock BCN", categoryName: "AGV-AMR", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 800, units: 4, cruiseSpeedKmh: 7, maxSpeedKmh: 12, sop: new Date("2026-08-01"), eop: new Date("2032-08-01"), packagingMeanNames: ["Kitting Cart 10"] },

  // Stockholm Lines (7)
  { name: "AMR Nordic 01", categoryName: "AGV-AMR", supplierName: "Nordic Foams", plantName: "Stockholm Lines", loadCapacityKg: 820, units: 3, cruiseSpeedKmh: 6, maxSpeedKmh: 10, sop: new Date("2026-02-01"), eop: new Date("2031-02-01"), packagingMeanNames: ["Picking Cart 11", "Utility Cart 09"] },
  { name: "AMR Nordic 02", categoryName: "AGV-AMR", supplierName: "Baltic Fasteners", plantName: "Stockholm Lines", loadCapacityKg: 780, units: 4, cruiseSpeedKmh: 7, maxSpeedKmh: 11, sop: new Date("2026-03-01"), eop: new Date("2031-03-01"), packagingMeanNames: ["Kitting Cart 12"] },
  { name: "Forklift Nordic 01", categoryName: "Forklift", supplierName: "Baltic Fasteners", plantName: "Stockholm Lines", loadCapacityKg: 2100, units: 5, cruiseSpeedKmh: 12, maxSpeedKmh: 19, sop: new Date("2026-04-15"), eop: new Date("2032-04-15"), packagingMeanNames: ["High Density Tower 08"] },
  { name: "Forklift Nordic 02", categoryName: "Forklift", supplierName: "Nordic Foams", plantName: "Stockholm Lines", loadCapacityKg: 2050, units: 4, cruiseSpeedKmh: 13, maxSpeedKmh: 20, sop: new Date("2026-05-15"), eop: new Date("2032-05-15"), packagingMeanNames: ["Plastic Box 09"] },
  { name: "Tugger Nordic 01", categoryName: "Tugger Train", supplierName: "Baltic Fasteners", plantName: "Stockholm Lines", loadCapacityKg: 1500, units: 6, cruiseSpeedKmh: 9, maxSpeedKmh: 14, sop: new Date("2026-06-15"), eop: new Date("2032-06-15"), packagingMeanNames: ["Picking Cart 15"] },
  { name: "Tugger Nordic 02", categoryName: "Tugger Train", supplierName: "Nordic Foams", plantName: "Stockholm Lines", loadCapacityKg: 1450, units: 5, cruiseSpeedKmh: 8, maxSpeedKmh: 13, sop: new Date("2026-07-15"), eop: new Date("2032-07-15"), packagingMeanNames: ["Utility Cart 10"] },
  { name: "AMR Shuttle Nordic", categoryName: "AGV-AMR", supplierName: "Baltic Fasteners", plantName: "Stockholm Lines", loadCapacityKg: 900, units: 3, cruiseSpeedKmh: 7, maxSpeedKmh: 12, sop: new Date("2026-08-15"), eop: new Date("2032-08-15"), packagingMeanNames: ["Kitting Cart 15"] },

  // Extra heterogeneous fleet (20)
  { name: "Forklift BCN Demo", categoryName: "Forklift", supplierName: "Catalunya Metals", plantName: "Barcelona Assembly", loadCapacityKg: 2400, units: 3, cruiseSpeedKmh: 12, maxSpeedKmh: 20, sop: new Date("2027-01-05"), eop: new Date("2033-01-05"), packagingMeanNames: ["HD Rack 10"], flowSlug: "assembly-to-warehouse", secondaryFlowSlug: "assembly-to-customer" },
  { name: "AGV Night Runner", categoryName: "AGV-AMR", supplierName: "North Steel", plantName: "Detroit Assembly", loadCapacityKg: 650, units: 6, cruiseSpeedKmh: 6, maxSpeedKmh: 10, sop: new Date("2027-02-10"), eop: new Date("2033-02-10"), packagingMeanNames: ["Picking Cart 18"], flowSlug: "injection-to-assembly", secondaryFlowSlug: "assembly-to-customer" },
  { name: "Tugger Sunrise", categoryName: "Tugger Train", supplierName: "Midwest Machining", plantName: "Montreal Plastics", loadCapacityKg: 1300, units: 4, cruiseSpeedKmh: 8, maxSpeedKmh: 12, sop: new Date("2027-03-15"), eop: new Date("2033-03-15"), packagingMeanNames: ["Utility Cart 12"], flowSlug: "paint-to-assembly" },
  { name: "Forklift Rio", categoryName: "Forklift", supplierName: "Paulista Coatings", plantName: "Sao Paulo Molding", loadCapacityKg: 2100, units: 5, cruiseSpeedKmh: 11, maxSpeedKmh: 18, sop: new Date("2027-04-20"), eop: new Date("2033-04-20"), packagingMeanNames: ["Tallboy 05"], flowSlug: "assembly-to-warehouse" },
  { name: "AMR Queretaro Express", categoryName: "AGV-AMR", supplierName: "Aztec Fasteners", plantName: "Queretaro Trim", loadCapacityKg: 720, units: 5, cruiseSpeedKmh: 7, maxSpeedKmh: 11, sop: new Date("2027-05-25"), eop: new Date("2033-05-25"), packagingMeanNames: ["Picking Cart 20"], flowSlug: "injection-to-assembly" },
  { name: "Tugger Atlas", categoryName: "Tugger Train", supplierName: "Atlas Metals", plantName: "Casablanca Interiors", loadCapacityKg: 1480, units: 6, cruiseSpeedKmh: 8, maxSpeedKmh: 13, sop: new Date("2027-06-30"), eop: new Date("2033-06-30"), packagingMeanNames: ["Utility Cart 14"], flowSlug: "paint-to-assembly" },
  { name: "Forklift NordX", categoryName: "Forklift", supplierName: "Baltic Fasteners", plantName: "Stockholm Lines", loadCapacityKg: 2250, units: 4, cruiseSpeedKmh: 12, maxSpeedKmh: 19, sop: new Date("2027-07-05"), eop: new Date("2033-07-05"), packagingMeanNames: ["HD Rack 20"], flowSlug: "assembly-to-warehouse" },
  { name: "AGV Harbour", categoryName: "AGV-AMR", supplierName: "Harbour Composites", plantName: "Sydney Kitting", loadCapacityKg: 680, units: 4, cruiseSpeedKmh: 6, maxSpeedKmh: 10, sop: new Date("2027-08-10"), eop: new Date("2033-08-10"), packagingMeanNames: ["Picking Cart 25"], flowSlug: "assembly-to-customer" },
  { name: "Tugger Desert", categoryName: "Tugger Train", supplierName: "Gauteng Rubber", plantName: "Johannesburg Components", loadCapacityKg: 1550, units: 5, cruiseSpeedKmh: 8, maxSpeedKmh: 12, sop: new Date("2027-09-15"), eop: new Date("2033-09-15"), packagingMeanNames: ["Kitting Cart 22"], flowSlug: "injection-to-assembly" },
  { name: "Forklift Alpine", categoryName: "Forklift", supplierName: "Rhone Textiles", plantName: "Lyon Composites", loadCapacityKg: 2050, units: 4, cruiseSpeedKmh: 11, maxSpeedKmh: 17, sop: new Date("2027-10-20"), eop: new Date("2033-10-20"), packagingMeanNames: ["Plastic Box 15"], flowSlug: "paint-to-assembly" },
  { name: "AMR Pudong", categoryName: "AGV-AMR", supplierName: "Pudong Fasteners", plantName: "Shanghai Stamping", loadCapacityKg: 850, units: 5, cruiseSpeedKmh: 7, maxSpeedKmh: 12, sop: new Date("2027-11-25"), eop: new Date("2033-11-25"), packagingMeanNames: ["Tallboy 12"], flowSlug: "assembly-to-customer" },
  { name: "Tugger Sakura", categoryName: "Tugger Train", supplierName: "Chubu Springs", plantName: "Nagoya Plastics", loadCapacityKg: 1420, units: 4, cruiseSpeedKmh: 8, maxSpeedKmh: 13, sop: new Date("2027-12-30"), eop: new Date("2033-12-30"), packagingMeanNames: ["Utility Cart 16"], flowSlug: "injection-to-assembly" },
  { name: "Forklift Thames", categoryName: "Forklift", supplierName: "Pennine Glass", plantName: "Manchester Modules", loadCapacityKg: 2150, units: 5, cruiseSpeedKmh: 12, maxSpeedKmh: 18, sop: new Date("2028-01-04"), eop: new Date("2034-01-04"), packagingMeanNames: ["HD Rack 25"], flowSlug: "assembly-to-warehouse" },
  { name: "AGV Cascades", categoryName: "AGV-AMR", supplierName: "Maple Resin", plantName: "Montreal Plastics", loadCapacityKg: 760, units: 6, cruiseSpeedKmh: 6, maxSpeedKmh: 10, sop: new Date("2028-02-09"), eop: new Date("2034-02-09"), packagingMeanNames: ["Picking Cart 28"], flowSlug: "injection-to-assembly" },
  { name: "Tugger Riviera", categoryName: "Tugger Train", supplierName: "Ligurian Plastics", plantName: "Lyon Composites", loadCapacityKg: 1520, units: 5, cruiseSpeedKmh: 8, maxSpeedKmh: 12, sop: new Date("2028-03-15"), eop: new Date("2034-03-15"), packagingMeanNames: ["Kitting Cart 30"], flowSlug: "paint-to-assembly" },
  { name: "Forklift Atlas Heavy", categoryName: "Forklift", supplierName: "Atlas Metals", plantName: "Casablanca Interiors", loadCapacityKg: 2450, units: 3, cruiseSpeedKmh: 11, maxSpeedKmh: 19, sop: new Date("2028-04-20"), eop: new Date("2034-04-20"), packagingMeanNames: ["Plastic Box 18"], flowSlug: "assembly-to-customer" },
  { name: "AMR Coral", categoryName: "AGV-AMR", supplierName: "Harbour Composites", plantName: "Sydney Kitting", loadCapacityKg: 700, units: 5, cruiseSpeedKmh: 6, maxSpeedKmh: 10, sop: new Date("2028-05-25"), eop: new Date("2034-05-25"), packagingMeanNames: ["Utility Cart 18"], flowSlug: "assembly-to-warehouse" },
  { name: "Tugger Andes", categoryName: "Tugger Train", supplierName: "Andes Fibers", plantName: "Sao Paulo Molding", loadCapacityKg: 1490, units: 6, cruiseSpeedKmh: 8, maxSpeedKmh: 12, sop: new Date("2028-06-30"), eop: new Date("2034-06-30"), packagingMeanNames: ["Picking Cart 30"], flowSlug: "paint-to-assembly" },
  { name: "Forklift Delta", categoryName: "Forklift", supplierName: "Neckar Plast", plantName: "Stuttgart Paint", loadCapacityKg: 2180, units: 4, cruiseSpeedKmh: 12, maxSpeedKmh: 18, sop: new Date("2028-07-05"), eop: new Date("2034-07-05"), packagingMeanNames: ["HD Rack 30"], flowSlug: "assembly-to-customer" },
  { name: "AMR Atlas Mini", categoryName: "AGV-AMR", supplierName: "North Steel", plantName: "Detroit Assembly", loadCapacityKg: 600, units: 4, cruiseSpeedKmh: 6, maxSpeedKmh: 9, sop: new Date("2028-08-10"), eop: new Date("2034-08-10"), packagingMeanNames: ["Utility Cart 20"], flowSlug: "injection-to-assembly" },
];

const packagingMeanCategoriesSeedData = [
  {
    name: "Utility Cart",
    description: "Multipurpose cart designed for quick moves between inbound docks and kitting cells.",
    imageUrl: "https://images.unsplash.com/photo-1502877338535-766e1452684a",
  },
  {
    name: "Kitting Cart",
    description: "Ergonomic cart optimized for staging components near assembly lines.",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  {
    name: "Picking Cart",
    description: "Narrow footprint cart used for high-frequency picking runs.",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
  },
  {
    name: "Shopstock Hook",
    description: "Heavy-duty hook system that keeps frequently used parts within reach.",
    imageUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef",
  },
  {
    name: "Transtocker Hook",
    description: "Overhead hook compatible with automatic transtockers for fast swaps.",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
  },
  {
    name: "Tallboy",
    description: "Vertical storage tower maximizing cubic efficiency in tight aisles.",
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
  },
  {
    name: "HD Rack",
    description: "High-density racking unit supporting palletized and loose packaging.",
    imageUrl: "https://images.unsplash.com/photo-1560464024-54c5c887c1bf",
  },
  {
    name: "Plastic Box",
    description: "Durable plastic totes for closed-loop shuttles between suppliers and plant.",
    imageUrl: "https://images.unsplash.com/photo-1454165205744-3b78555e5572",
  },
  {
    name: "High Density Tower",
    description: "Automated tower providing dense storage for small packaging assets.",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
  },
];

const storageMeanCategoriesSeedData = [
  {
    name: "Automated Hanging Shopstock",
    description: "Robot-managed hanging aisles buffering painted subassemblies with real-time inventory tracking.",
    imageUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a",
  },
  {
    name: "Manual Hanging Shopstock",
    description: "Operator-friendly hanging rails that keep bulky trim sets within reach of assembly teams.",
    imageUrl: "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8",
  },
  {
    name: "Automated Transtocker",
    description: "High-throughput transtockers feeding cells with sequenced components under automated control.",
    imageUrl: "https://images.unsplash.com/photo-1489515215877-9227ee91edef",
  },
  {
    name: "Manual Transtocker",
    description: "Manually dispatched transtockers supporting flexible replenishment during short runs.",
    imageUrl: "https://images.unsplash.com/photo-1452698325353-b89e0069974b",
  },
  {
    name: "High Bay Rack",
    description: "High-bay rack structure maximizing cubic density for pallets and oversized loads.",
    imageUrl: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606",
  },
  {
    name: "ASRS",
    description: "Automated Storage and Retrieval Systems, grid orchestrating deep-lane buffering for fast movers.",
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
  },
  {
    name: "CRM",
    description: "Conveyor on Rail Motorized. Powered conveyor-on-rail network routing totes across mezzanines and paint shops.",
    imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e",
  },
];

const usersSeedData = [
  {
    email: "valery@opmobility.com",
    name: "Valery",
    password: "ChangeMe123",
    birthDate: new Date("1990-05-10"),
  },
  {
    email: "ops@opmobility.com",
    name: "Ops Team",
    password: "ChangeMe123",
    birthDate: new Date("1988-09-15"),
  },
];

type LaneSeed = { length: number; width: number; height: number; quantity: number };
type StorageMeanSeed = {
  name: string;
  description: string;
  status: $Enums.StorageStatus;
  price: number;
  plantName: string;
  supplierName?: string;
  flowSlug: string;
  sop: Date;
  eop: Date;
  storageMeanCategoryName: string;
  imageUrl?: string;
  lanes?: LaneSeed[];
  heightMm?: number;
  usefulSurfaceM2?: number;
  grossSurfaceM2?: number;
};

const manualTranstockerDefaults: Pick<StorageMeanSeed, "imageUrl" | "lanes"> = {
  imageUrl: "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
  lanes: [
    { length: 1200, width: 800, height: 600, quantity: 2 },
    { length: 1000, width: 600, height: 500, quantity: 1 },
  ],
};

const baseStorageMeansSeedData: StorageMeanSeed[] = [
  {
    name: "Cold room A1",
    description: "Primary refrigerated storage zone",
    status: $Enums.StorageStatus.ACTIVE,
    price: 12000,
    plantName: "Detroit Assembly",
    supplierName: "North Steel",
    flowSlug: "injection-to-paint",
    sop: new Date("2026-01-01"),
    eop: new Date("2036-01-01"),
    storageMeanCategoryName: "High Bay Rack",
  },
  {
    name: "Overflow zone C2",
    description: "Temporary holding area",
    status: $Enums.StorageStatus.DRAFT,
    price: 4000,
    plantName: "Barcelona Assembly",
    supplierName: "Catalunya Metals",
    flowSlug: "assembly-to-warehouse",
    sop: new Date("2026-09-01"),
    eop: new Date("2036-09-01"),
    storageMeanCategoryName: "Automated Transtocker",
  },
];

const manualTranstockerSeeds: StorageMeanSeed[] = [
  {
    name: "Dry warehouse B4",
    description: "Ambient storage for packaging",
    status: $Enums.StorageStatus.ACTIVE,
    price: 8000,
    plantName: "Montreal Plastics",
    supplierName: "Maple Resin",
    flowSlug: "paint-to-assembly",
    sop: new Date("2026-06-01"),
    eop: new Date("2036-06-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1100,
    usefulSurfaceM2: 45,
    grossSurfaceM2: 60,
  },
  {
    name: "Manual Transtocker A1",
    description: "Line-side buffer for trim sets with manual dispatching.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 5200,
    plantName: "Detroit Assembly",
    supplierName: "Midwest Machining",
    flowSlug: "injection-to-paint",
    sop: new Date("2026-02-01"),
    eop: new Date("2034-02-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1150,
    usefulSurfaceM2: 32,
    grossSurfaceM2: 45,
  },
  {
    name: "Manual Transtocker A2",
    description: "Flexible replenishment rack for kitting loops.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 5100,
    plantName: "Montreal Plastics",
    supplierName: "Maple Resin",
    flowSlug: "paint-to-assembly",
    sop: new Date("2026-03-01"),
    eop: new Date("2034-03-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1120,
    usefulSurfaceM2: 30,
    grossSurfaceM2: 40,
  },
  {
    name: "Manual Transtocker A3",
    description: "Sequenced racks for interior trims.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 4900,
    plantName: "Queretaro Trim",
    supplierName: "Aztec Fasteners",
    flowSlug: "assembly-to-warehouse",
    sop: new Date("2026-04-01"),
    eop: new Date("2034-04-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1100,
    usefulSurfaceM2: 28,
    grossSurfaceM2: 38,
  },
  {
    name: "Manual Transtocker A4",
    description: "Dedicated to paint shop WIP pallets.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 5600,
    plantName: "Sao Paulo Molding",
    supplierName: "Paulista Coatings",
    flowSlug: "paint-to-assembly",
    sop: new Date("2026-05-01"),
    eop: new Date("2034-05-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1180,
    usefulSurfaceM2: 36,
    grossSurfaceM2: 50,
  },
  {
    name: "Manual Transtocker A5",
    description: "Short-run components staging near assembly.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 5300,
    plantName: "Lyon Composites",
    supplierName: "Rhone Textiles",
    flowSlug: "assembly-to-warehouse",
    sop: new Date("2026-06-01"),
    eop: new Date("2034-06-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1140,
    usefulSurfaceM2: 34,
    grossSurfaceM2: 48,
  },
  {
    name: "Manual Transtocker A6",
    description: "Operator-managed rack for paint shop returns.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 5400,
    plantName: "Stuttgart Paint",
    supplierName: "Neckar Plast",
    flowSlug: "paint-to-assembly",
    sop: new Date("2026-07-01"),
    eop: new Date("2034-07-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1160,
    usefulSurfaceM2: 35,
    grossSurfaceM2: 49,
  },
  {
    name: "Manual Transtocker A7",
    description: "WIP rack for glazing kits.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 5050,
    plantName: "Barcelona Assembly",
    supplierName: "Catalunya Metals",
    flowSlug: "injection-to-paint",
    sop: new Date("2026-08-01"),
    eop: new Date("2034-08-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1090,
    usefulSurfaceM2: 30,
    grossSurfaceM2: 42,
  },
  {
    name: "Manual Transtocker A8",
    description: "Manual shuttle for interior kitting totes.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 4800,
    plantName: "Manchester Modules",
    supplierName: "Pennine Glass",
    flowSlug: "assembly-to-warehouse",
    sop: new Date("2026-09-01"),
    eop: new Date("2034-09-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1110,
    usefulSurfaceM2: 31,
    grossSurfaceM2: 43,
  },
  {
    name: "Manual Transtocker A9",
    description: "Buffers foam kits near assembly cells.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 5150,
    plantName: "Stockholm Lines",
    supplierName: "Nordic Foams",
    flowSlug: "paint-to-assembly",
    sop: new Date("2026-10-01"),
    eop: new Date("2034-10-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1130,
    usefulSurfaceM2: 33,
    grossSurfaceM2: 46,
  },
  {
    name: "Manual Transtocker A10",
    description: "Small lots for fasteners and clips.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 4700,
    plantName: "Johannesburg Components",
    supplierName: "Gauteng Rubber",
    flowSlug: "injection-to-paint",
    sop: new Date("2026-11-01"),
    eop: new Date("2034-11-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1170,
    usefulSurfaceM2: 35,
    grossSurfaceM2: 50,
  },
  {
    name: "Manual Transtocker A11",
    description: "Pre-assembly staging for leather trims.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 5500,
    plantName: "Casablanca Interiors",
    supplierName: "Atlas Metals",
    flowSlug: "paint-to-assembly",
    sop: new Date("2026-12-01"),
    eop: new Date("2034-12-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1120,
    usefulSurfaceM2: 30,
    grossSurfaceM2: 42,
  },
  {
    name: "Manual Transtocker A12",
    description: "Manual shuttle for electronic modules.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 4950,
    plantName: "Bangalore Systems",
    supplierName: "Coromandel Chemicals",
    flowSlug: "injection-to-paint",
    sop: new Date("2027-01-01"),
    eop: new Date("2035-01-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1150,
    usefulSurfaceM2: 34,
    grossSurfaceM2: 47,
  },
  {
    name: "Manual Transtocker A13",
    description: "Supports plastic trim kits in paint buffer.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 5350,
    plantName: "Shanghai Stamping",
    supplierName: "Pudong Fasteners",
    flowSlug: "paint-to-assembly",
    sop: new Date("2027-02-01"),
    eop: new Date("2035-02-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1160,
    usefulSurfaceM2: 35,
    grossSurfaceM2: 48,
  },
  {
    name: "Manual Transtocker A14",
    description: "Trim racks for export variants.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 5050,
    plantName: "Nagoya Plastics",
    supplierName: "Chubu Springs",
    flowSlug: "assembly-to-warehouse",
    sop: new Date("2027-03-01"),
    eop: new Date("2035-03-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1110,
    usefulSurfaceM2: 32,
    grossSurfaceM2: 44,
  },
  {
    name: "Manual Transtocker A15",
    description: "Manual shuttle for coastal deliveries.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 5000,
    plantName: "Sydney Kitting",
    supplierName: "Harbour Composites",
    flowSlug: "injection-to-paint",
    sop: new Date("2027-04-01"),
    eop: new Date("2035-04-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1120,
    usefulSurfaceM2: 33,
    grossSurfaceM2: 45,
  },
  {
    name: "Manual Transtocker A16",
    description: "Auxiliary rack for pilot builds.",
    status: $Enums.StorageStatus.DRAFT,
    price: 4500,
    plantName: "Detroit Assembly",
    supplierName: "North Steel",
    flowSlug: "assembly-to-warehouse",
    sop: new Date("2027-05-01"),
    eop: new Date("2035-05-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1130,
    usefulSurfaceM2: 34,
    grossSurfaceM2: 46,
  },
  {
    name: "Manual Transtocker A17",
    description: "Overflow rack for plastics bins.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 4600,
    plantName: "Montreal Plastics",
    supplierName: "Maple Resin",
    flowSlug: "injection-to-paint",
    sop: new Date("2027-06-01"),
    eop: new Date("2035-06-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1140,
    usefulSurfaceM2: 35,
    grossSurfaceM2: 47,
  },
  {
    name: "Manual Transtocker A18",
    description: "Manual buffer for paint rejects.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 4700,
    plantName: "Sao Paulo Molding",
    supplierName: "Andes Fibers",
    flowSlug: "paint-to-assembly",
    sop: new Date("2027-07-01"),
    eop: new Date("2035-07-01"),
    storageMeanCategoryName: "Manual Transtocker",
  },
  {
    name: "Manual Transtocker A19",
    description: "Kitting rack for headliners.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 5150,
    plantName: "Lyon Composites",
    supplierName: "Ligurian Plastics",
    flowSlug: "assembly-to-warehouse",
    sop: new Date("2027-08-01"),
    eop: new Date("2035-08-01"),
    storageMeanCategoryName: "Manual Transtocker",
  },
  {
    name: "Manual Transtocker A20",
    description: "Manual staging for color swaps.",
    status: $Enums.StorageStatus.ACTIVE,
    price: 5250,
    plantName: "Stuttgart Paint",
    supplierName: "Danube Castings",
    flowSlug: "injection-to-paint",
    sop: new Date("2027-09-01"),
    eop: new Date("2035-09-01"),
    storageMeanCategoryName: "Manual Transtocker",
    heightMm: 1150,
    usefulSurfaceM2: 36,
    grossSurfaceM2: 48,
  },
].map((seed) => ({ ...manualTranstockerDefaults, ...seed }));

const storageMeansSeedData: StorageMeanSeed[] = [...baseStorageMeansSeedData, ...manualTranstockerSeeds];

const flowSeedData = [
  { slug: "injection-to-paint", from: "INJECTION", to: "PAINT" },
  { slug: "paint-to-assembly", from: "PAINT", to: "ASSEMBLY" },
  { slug: "assembly-to-warehouse", from: "ASSEMBLY", to: "WAREHOUSE" },
  { slug: "injection-to-assembly", from: "INJECTION", to: "ASSEMBLY" },
  { slug: "assembly-to-customer", from: "ASSEMBLY", to: "CUSTOMER" },
] as const;

const plantSeedData = [
  { name: "Detroit Assembly", address: { street: "1200 Industrial Dr", city: "Detroit", zipcode: "48201", countryCode: "US" } },
  { name: "Montreal Plastics", address: { street: "45 Rue Industrielle", city: "Montreal", zipcode: "H1A 0A1", countryCode: "CA" } },
  { name: "Queretaro Trim", address: { street: "220 Parque Tech", city: "Queretaro", zipcode: "76100", countryCode: "MX" } },
  { name: "Sao Paulo Molding", address: { street: "88 Rua do Pólo", city: "Sao Paulo", zipcode: "01000-000", countryCode: "BR" } },
  { name: "Lyon Composites", address: { street: "15 Rue des Usines", city: "Lyon", zipcode: "69002", countryCode: "FR" } },
  { name: "Stuttgart Paint", address: { street: "12 Werkstrasse", city: "Stuttgart", zipcode: "70173", countryCode: "DE" } },
  { name: "Barcelona Assembly", address: { street: "34 Carrer Industrial", city: "Barcelona", zipcode: "08001", countryCode: "ES" } },
  { name: "Manchester Modules", address: { street: "5 Supply Park Way", city: "Manchester", zipcode: "M1 1AE", countryCode: "GB" } },
  { name: "Stockholm Lines", address: { street: "9 Logistikgatan", city: "Stockholm", zipcode: "111 20", countryCode: "SE" } },
  { name: "Johannesburg Components", address: { street: "18 Axis Road", city: "Johannesburg", zipcode: "2000", countryCode: "ZA" } },
  { name: "Casablanca Interiors", address: { street: "7 Zone Industrielle", city: "Casablanca", zipcode: "20050", countryCode: "MA" } },
  { name: "Bangalore Systems", address: { street: "210 Tech Park Rd", city: "Bangalore", zipcode: "560001", countryCode: "IN" } },
  { name: "Shanghai Stamping", address: { street: "66 Pudong Ave", city: "Shanghai", zipcode: "200120", countryCode: "CN" } },
  { name: "Nagoya Plastics", address: { street: "3 Chome Nishiki", city: "Nagoya", zipcode: "460-0003", countryCode: "JP" } },
  { name: "Sydney Kitting", address: { street: "14 Logistics Blvd", city: "Sydney", zipcode: "2000", countryCode: "AU" } },
] as const;

const supplierSeedData = [
  { name: "North Steel", address: { street: "310 Foundry Rd", city: "Detroit", zipcode: "48202", countryCode: "US" } },
  { name: "Maple Resin", address: { street: "72 Chemin Nord", city: "Montreal", zipcode: "H1B 1B1", countryCode: "CA" } },
  { name: "Aztec Fasteners", address: { street: "501 Ruta 57", city: "Queretaro", zipcode: "76116", countryCode: "MX" } },
  { name: "Paulista Coatings", address: { street: "12 Avenida Azul", city: "Sao Paulo", zipcode: "01010-010", countryCode: "BR" } },
  { name: "Rhone Textiles", address: { street: "21 Quai Sud", city: "Lyon", zipcode: "69003", countryCode: "FR" } },
  { name: "Neckar Plast", address: { street: "4 Farbstrasse", city: "Stuttgart", zipcode: "70176", countryCode: "DE" } },
  { name: "Catalunya Metals", address: { street: "56 Carrer del Port", city: "Barcelona", zipcode: "08019", countryCode: "ES" } },
  { name: "Pennine Glass", address: { street: "8 Canal Street", city: "Manchester", zipcode: "M2 3GX", countryCode: "GB" } },
  { name: "Nordic Foams", address: { street: "11 Fabriksvägen", city: "Stockholm", zipcode: "112 21", countryCode: "SE" } },
  { name: "Gauteng Rubber", address: { street: "19 Supply Rd", city: "Johannesburg", zipcode: "2001", countryCode: "ZA" } },
  { name: "Atlas Metals", address: { street: "5 Port Logistique", city: "Casablanca", zipcode: "20060", countryCode: "MA" } },
  { name: "Coromandel Chemicals", address: { street: "14 Bannerghatta Rd", city: "Bangalore", zipcode: "560029", countryCode: "IN" } },
  { name: "Pudong Fasteners", address: { street: "88 Zhangyang Rd", city: "Shanghai", zipcode: "200135", countryCode: "CN" } },
  { name: "Chubu Springs", address: { street: "2-10 Sakae", city: "Nagoya", zipcode: "460-0008", countryCode: "JP" } },
  { name: "Harbour Composites", address: { street: "41 Botany Rd", city: "Sydney", zipcode: "2015", countryCode: "AU" } },
  { name: "Midwest Machining", address: { street: "220 Industrial Ave", city: "Detroit", zipcode: "48205", countryCode: "US" } },
  { name: "Ligurian Plastics", address: { street: "17 Via Mare", city: "Lyon", zipcode: "69007", countryCode: "FR" } },
  { name: "Andes Fibers", address: { street: "77 Rua Verde", city: "Sao Paulo", zipcode: "01015-030", countryCode: "BR" } },
  { name: "Baltic Fasteners", address: { street: "23 Skeppsgatan", city: "Stockholm", zipcode: "116 30", countryCode: "SE" } },
  { name: "Danube Castings", address: { street: "9 Hafenstrasse", city: "Stuttgart", zipcode: "70180", countryCode: "DE" } },
] as const;

const projectSeedData = [
  { name: "Aurora Sedan Program", code: "AUR01", sop: new Date("2026-03-01"), eop: new Date("2032-12-31") },
  { name: "Beacon SUV Refresh", code: "BEC11", sop: new Date("2026-07-01"), eop: new Date("2031-06-30") },
  { name: "Comet EV Launch", code: "COM21", sop: new Date("2027-01-15"), eop: new Date("2033-12-31") },
  { name: "Draco Crossover", code: "DRA31", sop: new Date("2026-10-01"), eop: new Date("2032-03-31") },
  { name: "Equinox Van", code: "EQX41", sop: new Date("2027-04-01"), eop: new Date("2034-04-30") },
  { name: "Falcon Pickup", code: "FAL51", sop: new Date("2026-09-01"), eop: new Date("2031-12-31") },
  { name: "Glacier Bus", code: "GLA61", sop: new Date("2027-02-01"), eop: new Date("2033-06-30") },
  { name: "Helios Coupe", code: "HEL71", sop: new Date("2026-05-15"), eop: new Date("2032-05-31") },
  { name: "Ion Compact", code: "ION81", sop: new Date("2026-11-01"), eop: new Date("2032-09-30") },
  { name: "Jade Luxury", code: "JAD91", sop: new Date("2027-06-01"), eop: new Date("2033-08-31") },
  { name: "Kestrel Fleet", code: "KES02", sop: new Date("2026-08-01"), eop: new Date("2031-10-31") },
  { name: "Lumen Utility", code: "LUM12", sop: new Date("2027-03-01"), eop: new Date("2032-12-31") },
  { name: "Mirage Roadster", code: "MIR22", sop: new Date("2026-12-01"), eop: new Date("2032-11-30") },
  { name: "Nova EV", code: "NOV32", sop: new Date("2027-05-01"), eop: new Date("2034-01-31") },
  { name: "Orion Shuttle", code: "ORI42", sop: new Date("2026-04-01"), eop: new Date("2031-12-31") },
  { name: "Pioneer Wagon", code: "PIO52", sop: new Date("2026-09-15"), eop: new Date("2032-07-31") },
  { name: "Quasar Van", code: "QUA62", sop: new Date("2027-01-01"), eop: new Date("2033-09-30") },
  { name: "Radiant CUV", code: "RAD72", sop: new Date("2026-06-01"), eop: new Date("2032-02-28") },
  { name: "Stratus Sedan", code: "STR82", sop: new Date("2026-10-15"), eop: new Date("2032-12-31") },
  { name: "Titan Pickup", code: "TIT92", sop: new Date("2027-02-15"), eop: new Date("2033-10-31") },
] as const;

const countriesSeedData = [
  { name: "Afghanistan", code: "AF" },
  { name: "Albania", code: "AL" },
  { name: "Algeria", code: "DZ" },
  { name: "American Samoa", code: "AS" },
  { name: "Andorra", code: "AD" },
  { name: "Angola", code: "AO" },
  { name: "Anguilla", code: "AI" },
  { name: "Antarctica", code: "AQ" },
  { name: "Antigua and Barbuda", code: "AG" },
  { name: "Argentina", code: "AR" },
  { name: "Armenia", code: "AM" },
  { name: "Aruba", code: "AW" },
  { name: "Australia", code: "AU" },
  { name: "Austria", code: "AT" },
  { name: "Azerbaijan", code: "AZ" },
  { name: "Bahamas", code: "BS" },
  { name: "Bahrain", code: "BH" },
  { name: "Bangladesh", code: "BD" },
  { name: "Barbados", code: "BB" },
  { name: "Belarus", code: "BY" },
  { name: "Belgium", code: "BE" },
  { name: "Belize", code: "BZ" },
  { name: "Benin", code: "BJ" },
  { name: "Bermuda", code: "BM" },
  { name: "Bhutan", code: "BT" },
  { name: "Bolivia", code: "BO" },
  { name: "Bosnia and Herzegovina", code: "BA" },
  { name: "Botswana", code: "BW" },
  { name: "Bouvet Island", code: "BV" },
  { name: "Brazil", code: "BR" },
  { name: "British Indian Ocean Territory", code: "IO" },
  { name: "Brunei Darussalam", code: "BN" },
  { name: "Bulgaria", code: "BG" },
  { name: "Burkina Faso", code: "BF" },
  { name: "Burundi", code: "BI" },
  { name: "Cambodia", code: "KH" },
  { name: "Cameroon", code: "CM" },
  { name: "Canada", code: "CA" },
  { name: "Cape Verde", code: "CV" },
  { name: "Cayman Islands", code: "KY" },
  { name: "Central African Republic", code: "CF" },
  { name: "Chad", code: "TD" },
  { name: "Chile", code: "CL" },
  { name: "China", code: "CN" },
  { name: "Christmas Island", code: "CX" },
  { name: "Cocos (Keeling) Islands", code: "CC" },
  { name: "Colombia", code: "CO" },
  { name: "Comoros", code: "KM" },
  { name: "Congo", code: "CG" },
  { name: "Congo, the Democratic Republic of the", code: "CD" },
  { name: "Cook Islands", code: "CK" },
  { name: "Costa Rica", code: "CR" },
  { name: "Cote d'Ivoire", code: "CI" },
  { name: "Croatia", code: "HR" },
  { name: "Cuba", code: "CU" },
  { name: "Cyprus", code: "CY" },
  { name: "Czech Republic", code: "CZ" },
  { name: "Denmark", code: "DK" },
  { name: "Djibouti", code: "DJ" },
  { name: "Dominica", code: "DM" },
  { name: "Dominican Republic", code: "DO" },
  { name: "Ecuador", code: "EC" },
  { name: "Egypt", code: "EG" },
  { name: "El Salvador", code: "SV" },
  { name: "Equatorial Guinea", code: "GQ" },
  { name: "Eritrea", code: "ER" },
  { name: "Estonia", code: "EE" },
  { name: "Ethiopia", code: "ET" },
  { name: "Falkland Islands (Malvinas)", code: "FK" },
  { name: "Faroe Islands", code: "FO" },
  { name: "Fiji", code: "FJ" },
  { name: "Finland", code: "FI" },
  { name: "France", code: "FR" },
  { name: "French Guiana", code: "GF" },
  { name: "French Polynesia", code: "PF" },
  { name: "French Southern Territories", code: "TF" },
  { name: "Gabon", code: "GA" },
  { name: "Gambia", code: "GM" },
  { name: "Georgia", code: "GE" },
  { name: "Germany", code: "DE" },
  { name: "Ghana", code: "GH" },
  { name: "Gibraltar", code: "GI" },
  { name: "Greece", code: "GR" },
  { name: "Greenland", code: "GL" },
  { name: "Grenada", code: "GD" },
  { name: "Guadeloupe", code: "GP" },
  { name: "Guam", code: "GU" },
  { name: "Guatemala", code: "GT" },
  { name: "Guernsey", code: "GG" },
  { name: "Guinea", code: "GN" },
  { name: "Guinea-Bissau", code: "GW" },
  { name: "Guyana", code: "GY" },
  { name: "Haiti", code: "HT" },
  { name: "Heard Island and McDonald Islands", code: "HM" },
  { name: "Holy See (Vatican City State)", code: "VA" },
  { name: "Honduras", code: "HN" },
  { name: "Hong Kong", code: "HK" },
  { name: "Hungary", code: "HU" },
  { name: "Iceland", code: "IS" },
  { name: "India", code: "IN" },
  { name: "Indonesia", code: "ID" },
  { name: "Iran, Islamic Republic of", code: "IR" },
  { name: "Iraq", code: "IQ" },
  { name: "Ireland", code: "IE" },
  { name: "Isle of Man", code: "IM" },
  { name: "Israel", code: "IL" },
  { name: "Italy", code: "IT" },
  { name: "Jamaica", code: "JM" },
  { name: "Japan", code: "JP" },
  { name: "Jersey", code: "JE" },
  { name: "Jordan", code: "JO" },
  { name: "Kazakhstan", code: "KZ" },
  { name: "Kenya", code: "KE" },
  { name: "Kiribati", code: "KI" },
  { name: "Korea, Democratic People's Republic of", code: "KP" },
  { name: "Korea, Republic of", code: "KR" },
  { name: "Kuwait", code: "KW" },
  { name: "Kyrgyzstan", code: "KG" },
  { name: "Lao People's Democratic Republic", code: "LA" },
  { name: "Latvia", code: "LV" },
  { name: "Lebanon", code: "LB" },
  { name: "Lesotho", code: "LS" },
  { name: "Liberia", code: "LR" },
  { name: "Libyan Arab Jamahiriya", code: "LY" },
  { name: "Liechtenstein", code: "LI" },
  { name: "Lithuania", code: "LT" },
  { name: "Luxembourg", code: "LU" },
  { name: "Macao", code: "MO" },
  { name: "North Macedonia", code: "MK" },
  { name: "Madagascar", code: "MG" },
  { name: "Malawi", code: "MW" },
  { name: "Malaysia", code: "MY" },
  { name: "Maldives", code: "MV" },
  { name: "Mali", code: "ML" },
  { name: "Malta", code: "MT" },
  { name: "Marshall Islands", code: "MH" },
  { name: "Martinique", code: "MQ" },
  { name: "Mauritania", code: "MR" },
  { name: "Mauritius", code: "MU" },
  { name: "Mayotte", code: "YT" },
  { name: "Mexico", code: "MX" },
  { name: "Micronesia, Federated States of", code: "FM" },
  { name: "Moldova, Republic of", code: "MD" },
  { name: "Monaco", code: "MC" },
  { name: "Mongolia", code: "MN" },
  { name: "Montenegro", code: "ME" },
  { name: "Montserrat", code: "MS" },
  { name: "Morocco", code: "MA" },
  { name: "Mozambique", code: "MZ" },
  { name: "Myanmar", code: "MM" },
  { name: "Namibia", code: "NA" },
  { name: "Nauru", code: "NR" },
  { name: "Nepal", code: "NP" },
  { name: "Netherlands", code: "NL" },
  { name: "New Caledonia", code: "NC" },
  { name: "New Zealand", code: "NZ" },
  { name: "Nicaragua", code: "NI" },
  { name: "Niger", code: "NE" },
  { name: "Nigeria", code: "NG" },
  { name: "Niue", code: "NU" },
  { name: "Norfolk Island", code: "NF" },
  { name: "Northern Mariana Islands", code: "MP" },
  { name: "Norway", code: "NO" },
  { name: "Oman", code: "OM" },
  { name: "Pakistan", code: "PK" },
  { name: "Palau", code: "PW" },
  { name: "Palestinian Territory, Occupied", code: "PS" },
  { name: "Panama", code: "PA" },
  { name: "Papua New Guinea", code: "PG" },
  { name: "Paraguay", code: "PY" },
  { name: "Peru", code: "PE" },
  { name: "Philippines", code: "PH" },
  { name: "Pitcairn", code: "PN" },
  { name: "Poland", code: "PL" },
  { name: "Portugal", code: "PT" },
  { name: "Puerto Rico", code: "PR" },
  { name: "Qatar", code: "QA" },
  { name: "Reunion", code: "RE" },
  { name: "Romania", code: "RO" },
  { name: "Russian Federation", code: "RU" },
  { name: "Rwanda", code: "RW" },
  { name: "Saint Helena", code: "SH" },
  { name: "Saint Kitts and Nevis", code: "KN" },
  { name: "Saint Lucia", code: "LC" },
  { name: "Saint Pierre and Miquelon", code: "PM" },
  { name: "Saint Vincent and the Grenadines", code: "VC" },
  { name: "Samoa", code: "WS" },
  { name: "San Marino", code: "SM" },
  { name: "Sao Tome and Principe", code: "ST" },
  { name: "Saudi Arabia", code: "SA" },
  { name: "Senegal", code: "SN" },
  { name: "Serbia", code: "RS" },
  { name: "Seychelles", code: "SC" },
  { name: "Sierra Leone", code: "SL" },
  { name: "Singapore", code: "SG" },
  { name: "Slovakia", code: "SK" },
  { name: "Slovenia", code: "SI" },
  { name: "Solomon Islands", code: "SB" },
  { name: "Somalia", code: "SO" },
  { name: "South Africa", code: "ZA" },
  { name: "South Georgia and the South Sandwich Islands", code: "GS" },
  { name: "South Sudan", code: "SS" },
  { name: "Spain", code: "ES" },
  { name: "Sri Lanka", code: "LK" },
  { name: "Sudan", code: "SD" },
  { name: "Suriname", code: "SR" },
  { name: "Svalbard and Jan Mayen", code: "SJ" },
  { name: "Swaziland", code: "SZ" },
  { name: "Sweden", code: "SE" },
  { name: "Switzerland", code: "CH" },
  { name: "Syrian Arab Republic", code: "SY" },
  { name: "Taiwan, Province of China", code: "TW" },
  { name: "Tajikistan", code: "TJ" },
  { name: "Tanzania, United Republic of", code: "TZ" },
  { name: "Thailand", code: "TH" },
  { name: "Timor-Leste", code: "TL" },
  { name: "Togo", code: "TG" },
  { name: "Tokelau", code: "TK" },
  { name: "Tonga", code: "TO" },
  { name: "Trinidad and Tobago", code: "TT" },
  { name: "Tunisia", code: "TN" },
  { name: "Turkey", code: "TR" },
  { name: "Turkmenistan", code: "TM" },
  { name: "Turks and Caicos Islands", code: "TC" },
  { name: "Tuvalu", code: "TV" },
  { name: "Uganda", code: "UG" },
  { name: "Ukraine", code: "UA" },
  { name: "United Arab Emirates", code: "AE" },
  { name: "United Kingdom", code: "GB" },
  { name: "United States", code: "US" },
  { name: "United States Minor Outlying Islands", code: "UM" },
  { name: "Uruguay", code: "UY" },
  { name: "Uzbekistan", code: "UZ" },
  { name: "Vanuatu", code: "VU" },
  { name: "Venezuela", code: "VE" },
  { name: "Viet Nam", code: "VN" },
  { name: "Virgin Islands, British", code: "VG" },
  { name: "Virgin Islands, U.S.", code: "VI" },
  { name: "Wallis and Futuna", code: "WF" },
  { name: "Western Sahara", code: "EH" },
  { name: "Yemen", code: "YE" },
  { name: "Zambia", code: "ZM" },
  { name: "Zimbabwe", code: "ZW" },
  { name: "Curacao", code: "CW" },
  { name: "Bonaire, Saint Eustatius and Saba", code: "BQ" },
  { name: "Sint Maarten (Dutch part)", code: "SX" },
  { name: "Kosovo", code: "XK" },
];

const buildSlug = (name: string, fallbackPrefix: string) => {
  const slug = slugifyValue(name);
  return slug.length ? slug : `${fallbackPrefix}-${randomUUID().slice(0, 8)}`;
};

async function getCountryMap(codes: Set<string>) {
  const countries = await prisma.country.findMany({
    where: { code: { in: Array.from(codes) } },
    select: { id: true, code: true },
  });
  const map = new Map(countries.map((country) => [country.code, country.id]));

  const missing = Array.from(codes).filter((code) => !map.has(code));
  if (missing.length) {
    throw new Error(`Missing countries for codes: ${missing.join(", ")}`);
  }

  return map;
}

async function seedPackagingMeanCategories() {
  for (const category of packagingMeanCategoriesSeedData) {
    const slug = buildSlug(category.name, "packaging");
    const existing = await prisma.packagingMeanCategory.findUnique({
      where: { slug },
      include: { image: { include: { image: true } } },
    });

    if (existing) {
      await prisma.packagingMeanCategory.update({
        where: { id: existing.id },
        data: { description: category.description, name: category.name },
      });
      if (!existing.image && category.imageUrl) {
        const image = await prisma.image.create({
          data: {
            imageUrl: category.imageUrl,
          },
        });
        await prisma.packagingMeanCategoryImage.create({
          data: {
            packagingMeanCategoryId: existing.id,
            imageId: image.id,
          },
        });
      }
      continue;
    }

    const created = await prisma.packagingMeanCategory.create({
      data: {
        name: category.name,
        description: category.description,
        slug,
      },
    });

    if (category.imageUrl) {
      const image = await prisma.image.create({
        data: {
          imageUrl: category.imageUrl,
        },
      });
      await prisma.packagingMeanCategoryImage.create({
        data: {
          packagingMeanCategoryId: created.id,
          imageId: image.id,
        },
      });
    }
  }
  console.info(`Seeded/updated ${packagingMeanCategoriesSeedData.length} packaging mean categories.`);
}

const partFamilySeedNames = ["Bumper", "Tailgate", "Console", "Dashboard", "Door Panel", "Roof Rack", "Seat Frame", "Fascia", "Hood", "Trunk Lid"];

async function seedPartFamilies() {
  for (const name of partFamilySeedNames) {
    const slug = buildSlug(name, "family");
    await prisma.partFamily.upsert({
      where: { slug },
      create: {
        name,
        slug,
      },
      update: {
        name,
      },
    });
  }
  console.info(`Seeded/ensured ${partFamilySeedNames.length} part families.`);
}

const accessorySeedData = [
  { name: "Protective Cover", description: "Reusable weather cover", plantName: "Detroit Assembly", supplierName: "North Steel", unitPrice: 25 },
  { name: "Strap Kit", description: "Ratchet straps set", plantName: "Montreal Plastics", supplierName: "Maple Resin", unitPrice: 18 },
  { name: "Foam Insert", description: "Custom foam for fragile parts", plantName: "Queretaro Trim", supplierName: "Aztec Fasteners", unitPrice: 12 },
  { name: "Label Holder", description: "Magnetic label frame", plantName: "Barcelona Assembly", supplierName: "Catalunya Metals", unitPrice: 8 },
  { name: "Divider Set", description: "Adjustable dividers", plantName: "Lyon Composites", supplierName: "Rhone Textiles", unitPrice: 15 },
  { name: "Wheel Chock", description: "Rubber chock for carts", plantName: "Stuttgart Paint", supplierName: "Neckar Plast", unitPrice: 10 },
  { name: "Anti-Slip Mat", description: "Grip mat for trays", plantName: "Sao Paulo Molding", supplierName: "Paulista Coatings", unitPrice: 7 },
  { name: "Lid Clamp", description: "Clamp for plastic boxes", plantName: "Nagoya Plastics", supplierName: "Chubu Springs", unitPrice: 9 },
  { name: "Sensor Tag", description: "RFID tag holder", plantName: "Sydney Kitting", supplierName: "Harbour Composites", unitPrice: 14 },
  { name: "Corner Protector", description: "Edge protector set", plantName: "Shanghai Stamping", supplierName: "Pudong Fasteners", unitPrice: 11 },
];

const packagingImagePool = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
  "https://images.unsplash.com/photo-1560464024-54c5c887c1bf",
  "https://images.unsplash.com/photo-1454165205744-3b78555e5572",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
  "https://images.unsplash.com/photo-1502877338535-766e1452684a",
  "https://images.unsplash.com/photo-1487730116645-74489c95b41b",
];

async function seedAccessories() {
  const plants = await prisma.plant.findMany({ select: { id: true, name: true } });
  const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true } });
  const plantMap = new Map(plants.map((p) => [p.name, p.id]));
  const supplierMap = new Map(suppliers.map((s) => [s.name, s.id]));

  for (const acc of accessorySeedData) {
    const plantId = plantMap.get(acc.plantName);
    const supplierId = supplierMap.get(acc.supplierName || "");
    if (!plantId) continue;
    const slug = buildSlug(acc.name, "accessory");
    await retry(() =>
      prisma.accessory.upsert({
        where: { plantId_slug: { plantId, slug } },
        create: {
          name: acc.name,
          slug,
          description: acc.description,
          unitPrice: acc.unitPrice ?? 0,
          plantId,
          supplierId: supplierId ?? null,
        },
        update: {
          description: acc.description,
          unitPrice: acc.unitPrice ?? 0,
          supplierId: supplierId ?? null,
          plantId,
        },
      })
    );
  }
  console.info(`Seeded/ensured ${accessorySeedData.length} accessories.`);
}

async function seedPackagingMeans() {
  const categories = await prisma.packagingMeanCategory.findMany();
  const plants = await prisma.plant.findMany();
  const flows = await prisma.flow.findMany();
  const suppliers = await prisma.supplier.findMany();
  const accessories = await prisma.accessory.findMany();
  const partFamilies = await prisma.partFamily.findMany();
  const projects = await prisma.project.findMany();

  if (!categories.length || !plants.length || !flows.length || !suppliers.length || !accessories.length || !partFamilies.length || !projects.length) {
    throw new Error("Missing required seed dependencies for packaging means.");
  }

  let packagingCreated = 0;
  for (const [categoryIndex, category] of categories.entries()) {
    for (let i = 0; i < 40; i++) {
      const name = `${category.name} ${String(i + 1).padStart(2, "0")}`;
      const plantIndex = (i + categoryIndex * 3) % plants.length;
      const plant = plants[plantIndex];
      const flow = flows[(i + categoryIndex + plantIndex) % flows.length];
      const supplier = suppliers[(i + categoryIndex) % suppliers.length];
      const price = 500 + (i % 10) * 25;
      const width = 800 + (i % 5) * 10;
      const length = 1200 + (i % 7) * 15;
      const height = 1000 + (i % 4) * 20;
      const numberOfPackagings = 1 + (i % 9);
      const sop = new Date(2026, i % 12, 1 + (i % 27));
      const eop = new Date(sop);
      eop.setFullYear(eop.getFullYear() + 5);

      const packaging = await retry(() =>
        prisma.packagingMean.upsert({
          where: {
            plantId_name_packagingMeanCategoryId: {
              plantId: plant.id,
              name,
              packagingMeanCategoryId: category.id,
            },
          },
          update: {
            description: `Seeded ${category.name.toLowerCase()} packaging #${i + 1}`,
            price,
            width,
            length,
            height,
            numberOfPackagings,
            status: $Enums.PackagingStatus.ACTIVE,
            sop,
            eop,
            supplierId: supplier.id,
            flowId: flow.id,
          },
          create: {
            name,
            description: `Seeded ${category.name.toLowerCase()} packaging #${i + 1}`,
            price,
            width,
            length,
            height,
            numberOfPackagings,
            status: $Enums.PackagingStatus.ACTIVE,
            sop,
            eop,
            supplierId: supplier.id,
            plantId: plant.id,
            flowId: flow.id,
            packagingMeanCategoryId: category.id,
          },
        })
      );

      const images = Array.from({ length: 5 }, (_v, idx) => ({
        url: `${packagingImagePool[(i + idx) % packagingImagePool.length]}?auto=format&fit=crop&w=1200&q=80&sig=${category.slug}-${i}-${idx}`,
        sortOrder: idx,
      }));
      for (const img of images) {
        await retry(async () => {
          const image = await prisma.image.create({ data: { imageUrl: img.url } });
          await ignoreDuplicate(
            prisma.packagingMeanImage.create({
              data: { packagingMeanId: packaging.id, imageId: image.id, sortOrder: img.sortOrder },
            })
          );
        });
      }

      const accessoryLinks = Array.from({ length: 2 }, (_v, a) => {
        const accessory = accessories[(i + a) % accessories.length];
        return { packagingMeanId: packaging.id, accessoryId: accessory.id, qtyPerPackaging: 1 + (a % 3) };
      });
      await retry(() => prisma.packagingMeanAccessory.createMany({ data: accessoryLinks, skipDuplicates: true }));

      for (let p = 0; p < 2; p++) {
        const family = partFamilies[(i + p) % partFamilies.length];
        const project = projects[(i + p) % projects.length];
        const partName = `${category.name} Part ${p + 1} #${i + 1}`;
        const partSlug = buildSlug(`${partName}-${project.code}`, "part");
        const part = await retry(() =>
          prisma.part.upsert({
            where: { projectId_slug: { projectId: project.id, slug: partSlug } },
            update: { name: partName, partFamilyId: family.id },
            create: {
              name: partName,
              slug: partSlug,
              partFamilyId: family.id,
              projectId: project.id,
            },
          })
        );

        await retry(() =>
          prisma.packagingMeanPart.upsert({
            where: { packagingMeanId_partId: { packagingMeanId: packaging.id, partId: part.id } },
            update: {
              partsPerPackaging: 1 + (p % 4),
              levelsPerPackaging: 1 + (p % 2),
              verticalPitch: 50 + p * 10,
              horizontalPitch: 40 + p * 8,
              notes: "Seeded part link",
            },
            create: {
              packagingMeanId: packaging.id,
              partId: part.id,
              partsPerPackaging: 1 + (p % 4),
              levelsPerPackaging: 1 + (p % 2),
              verticalPitch: 50 + p * 10,
              horizontalPitch: 40 + p * 8,
              notes: "Seeded part link",
            },
          })
        );

        const acc = accessories[(i + p + 1) % accessories.length];
        await retry(() =>
          prisma.partAccessory.upsert({
            where: { partId_accessoryId: { partId: part.id, accessoryId: acc.id } },
            update: { qtyPerPart: 1 + (p % 2) },
            create: { partId: part.id, accessoryId: acc.id, qtyPerPart: 1 + (p % 2) },
          })
        );
      }

      packagingCreated += 1;
      await pauseEvery(packagingCreated, 50, 300);
    }
  }

  // Additional curated packaging means (15) ensuring link coverage with new flows
  const extraPackagingSeeds = [
    { name: "Utility Cart Special A", categoryName: "Utility Cart", plantName: "Detroit Assembly", supplierName: "North Steel", flowSlug: "injection-to-assembly", price: 720, width: 850, length: 1250, height: 1020, numberOfPackagings: 3 },
    { name: "Utility Cart Special B", categoryName: "Utility Cart", plantName: "Barcelona Assembly", supplierName: "Catalunya Metals", flowSlug: "assembly-to-customer", price: 740, width: 860, length: 1260, height: 1030, numberOfPackagings: 4 },
    { name: "Kitting Cart Special A", categoryName: "Kitting Cart", plantName: "Montreal Plastics", supplierName: "Maple Resin", flowSlug: "injection-to-assembly", price: 780, width: 870, length: 1240, height: 980, numberOfPackagings: 5 },
    { name: "Kitting Cart Special B", categoryName: "Kitting Cart", plantName: "Stockholm Lines", supplierName: "Baltic Fasteners", flowSlug: "assembly-to-customer", price: 795, width: 880, length: 1255, height: 990, numberOfPackagings: 6 },
    { name: "Picking Cart Special A", categoryName: "Picking Cart", plantName: "Casablanca Interiors", supplierName: "Atlas Metals", flowSlug: "paint-to-assembly", price: 820, width: 840, length: 1230, height: 970, numberOfPackagings: 3 },
    { name: "Picking Cart Special B", categoryName: "Picking Cart", plantName: "Sydney Kitting", supplierName: "Harbour Composites", flowSlug: "assembly-to-customer", price: 845, width: 850, length: 1245, height: 975, numberOfPackagings: 4 },
    { name: "HD Rack Special A", categoryName: "HD Rack", plantName: "Lyon Composites", supplierName: "Rhone Textiles", flowSlug: "assembly-to-warehouse", price: 1250, width: 900, length: 1400, height: 1200, numberOfPackagings: 2 },
    { name: "HD Rack Special B", categoryName: "HD Rack", plantName: "Stuttgart Paint", supplierName: "Neckar Plast", flowSlug: "assembly-to-customer", price: 1300, width: 920, length: 1420, height: 1220, numberOfPackagings: 2 },
    { name: "Plastic Box Special", categoryName: "Plastic Box", plantName: "Nagoya Plastics", supplierName: "Chubu Springs", flowSlug: "injection-to-assembly", price: 310, width: 650, length: 900, height: 650, numberOfPackagings: 30 },
    { name: "Tallboy Special", categoryName: "Tallboy", plantName: "Shanghai Stamping", supplierName: "Pudong Fasteners", flowSlug: "assembly-to-customer", price: 980, width: 780, length: 1100, height: 1800, numberOfPackagings: 3 },
    { name: "Transtocker Hook Special", categoryName: "Transtocker Hook", plantName: "Queretaro Trim", supplierName: "Aztec Fasteners", flowSlug: "injection-to-assembly", price: 860, width: 760, length: 1080, height: 900, numberOfPackagings: 4 },
    { name: "Shopstock Hook Special", categoryName: "Shopstock Hook", plantName: "Manchester Modules", supplierName: "Pennine Glass", flowSlug: "assembly-to-warehouse", price: 840, width: 750, length: 1070, height: 880, numberOfPackagings: 5 },
    { name: "High Density Tower Special", categoryName: "High Density Tower", plantName: "Barcelona Assembly", supplierName: "Catalunya Metals", flowSlug: "assembly-to-customer", price: 2100, width: 950, length: 1350, height: 1900, numberOfPackagings: 1 },
    { name: "Utility Cart Coastal", categoryName: "Utility Cart", plantName: "Sydney Kitting", supplierName: "Harbour Composites", flowSlug: "paint-to-assembly", price: 765, width: 860, length: 1250, height: 1040, numberOfPackagings: 3 },
    { name: "Kitting Cart Atlas", categoryName: "Kitting Cart", plantName: "Casablanca Interiors", supplierName: "Atlas Metals", flowSlug: "assembly-to-warehouse", price: 810, width: 870, length: 1260, height: 1000, numberOfPackagings: 4 },
  ];

  for (const [idx, seed] of extraPackagingSeeds.entries()) {
    const category = categories.find((c) => c.name === seed.categoryName);
    const plant = plants.find((p) => p.name === seed.plantName);
    const supplier = suppliers.find((s) => s.name === seed.supplierName);
    const flow = flows.find((f) => f.slug === seed.flowSlug) ?? flows[(idx + categories.length) % flows.length];
    if (!category || !plant || !flow || !supplier) continue;

    const name = seed.name;
    const packaging = await retry(() =>
      prisma.packagingMean.upsert({
        where: {
          plantId_name_packagingMeanCategoryId: {
            plantId: plant.id,
            name,
            packagingMeanCategoryId: category.id,
          },
        },
        update: {
          description: `${seed.categoryName} special seed`,
          price: seed.price,
          width: seed.width,
          length: seed.length,
          height: seed.height,
          numberOfPackagings: seed.numberOfPackagings,
          status: $Enums.PackagingStatus.ACTIVE,
          sop: new Date("2027-01-01"),
          eop: new Date("2032-01-01"),
          supplierId: supplier.id,
          flowId: flow.id,
        },
        create: {
          name,
          description: `${seed.categoryName} special seed`,
          price: seed.price,
          width: seed.width,
          length: seed.length,
          height: seed.height,
          numberOfPackagings: seed.numberOfPackagings,
          status: $Enums.PackagingStatus.ACTIVE,
          sop: new Date("2027-01-01"),
          eop: new Date("2032-01-01"),
          supplierId: supplier.id,
          plantId: plant.id,
          flowId: flow.id,
          packagingMeanCategoryId: category.id,
        },
      })
    );

    // minimal image
    const imageUrl = `${packagingImagePool[(idx + 2) % packagingImagePool.length]}?auto=format&fit=crop&w=1200&q=80&sig=special-${idx}`;
    const image = await prisma.image.create({ data: { imageUrl } });
    await ignoreDuplicate(
      prisma.packagingMeanImage.create({
        data: { packagingMeanId: packaging.id, imageId: image.id, sortOrder: 0 },
      })
    );

    // accessories
    const accessoryLinks = accessories.slice(idx % accessories.length, (idx % accessories.length) + 2).map((a, aIdx) => ({
      packagingMeanId: packaging.id,
      accessoryId: a.id,
      qtyPerPackaging: 1 + (aIdx % 2),
    }));
    if (accessoryLinks.length) {
      await prisma.packagingMeanAccessory.createMany({ data: accessoryLinks, skipDuplicates: true });
    }

    // one part link
    const family = partFamilies[(idx + 1) % partFamilies.length];
    const project = projects[(idx + 2) % projects.length];
    const partName = `${seed.categoryName} Special Part ${idx + 1}`;
    const partSlug = buildSlug(`${partName}-${project.code}`, "part");
    const part = await prisma.part.upsert({
      where: { projectId_slug: { projectId: project.id, slug: partSlug } },
      update: { name: partName, partFamilyId: family.id },
      create: { name: partName, slug: partSlug, partFamilyId: family.id, projectId: project.id },
    });

    await prisma.packagingMeanPart.upsert({
      where: { packagingMeanId_partId: { packagingMeanId: packaging.id, partId: part.id } },
      update: { partsPerPackaging: 2, levelsPerPackaging: 1, verticalPitch: 55, horizontalPitch: 45, notes: "Special seed link" },
      create: { packagingMeanId: packaging.id, partId: part.id, partsPerPackaging: 2, levelsPerPackaging: 1, verticalPitch: 55, horizontalPitch: 45, notes: "Special seed link" },
    });

    packagingCreated += 1;
  }

  console.info(`Seeded ${packagingCreated} packaging means with parts, accessories, and images.`);
}

async function seedTransportMeanCategories() {
  for (const category of transportMeanCategoriesSeedData) {
    const slug = buildSlug(category.name, "transport");
    const existing = await prisma.transportMeanCategory.findUnique({
      where: { slug },
      include: { image: { include: { image: true } } },
    });
    if (existing) {
      await prisma.transportMeanCategory.update({
        where: { id: existing.id },
        data: { description: category.description },
      });
      if (!existing.image && category.imageUrl) {
        const image = await prisma.image.create({
          data: {
            imageUrl: category.imageUrl,
          },
        });
        await prisma.transportMeanCategoryImage.create({
          data: {
            transportMeanCategoryId: existing.id,
            imageId: image.id,
          },
        });
      }
      continue;
    }
    const created = await prisma.transportMeanCategory.create({
      data: {
        name: category.name,
        description: category.description,
        slug,
      },
    });
    if (category.imageUrl) {
      const image = await prisma.image.create({
        data: {
          imageUrl: category.imageUrl,
        },
      });
      await prisma.transportMeanCategoryImage.create({
        data: {
          transportMeanCategoryId: created.id,
          imageId: image.id,
        },
      });
    }
  }
  console.info(`Seeded/updated ${transportMeanCategoriesSeedData.length} transport mean categories.`);
}

async function seedTransportMeans() {
  const plantMap = new Map<string, string>();
  const plants = await prisma.plant.findMany({ select: { id: true, name: true } });
  plants.forEach((p) => plantMap.set(p.name, p.id));

  const supplierMap = new Map<string, string>();
  const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true } });
  suppliers.forEach((s) => supplierMap.set(s.name, s.id));

  const categoryMap = new Map<string, string>();
  const categories = await prisma.transportMeanCategory.findMany({ select: { id: true, name: true, slug: true } });
  categories.forEach((c) => categoryMap.set(c.name, c.id));

  const packagingMap = new Map<string, string>();
  const packagingMeans = await prisma.packagingMean.findMany({ select: { id: true, name: true } });
  packagingMeans.forEach((pm) => packagingMap.set(pm.name, pm.id));

  const flows = await prisma.flow.findMany({ select: { id: true, slug: true } });
  const flowMap = new Map(flows.map((f) => [f.slug, f]));

  let created = 0;
  for (const seed of transportMeansSeedData) {
    const plantId = plantMap.get(seed.plantName);
    const categoryId = categoryMap.get(seed.categoryName);
    const supplierId = seed.supplierName ? supplierMap.get(seed.supplierName) : undefined;
    if (!plantId || !categoryId) continue;

    const slug = buildSlug(seed.name, "transport");
    const packagingLinks = (seed.packagingMeanNames ?? [])
      .map((name, idx) => ({
        packagingMeanId: packagingMap.get(name),
        maxQty: 1 + (idx % 3),
      }))
      .filter((l) => Boolean(l.packagingMeanId)) as Array<{ packagingMeanId: string; maxQty: number }>;

    const primaryFlow =
      (seed.flowSlug ? flowMap.get(seed.flowSlug) : undefined) ??
      flows[(created + seed.name.length) % flows.length] ??
      flows[0];
    const secondaryFlow =
      (seed.secondaryFlowSlug ? flowMap.get(seed.secondaryFlowSlug) : undefined) ??
      flows[(created + seed.name.length + 1) % flows.length] ??
      primaryFlow;

    const tm = await prisma.transportMean.upsert({
      where: { slug },
      update: {
        description: `Seeded ${seed.categoryName.toLowerCase()} transport mean`,
        transportMeanCategoryId: categoryId,
        supplierId: supplierId ?? null,
        plantId,
        loadCapacityKg: seed.loadCapacityKg,
        units: seed.units,
        cruiseSpeedKmh: seed.cruiseSpeedKmh,
        maxSpeedKmh: seed.maxSpeedKmh,
        sop: seed.sop,
        eop: seed.eop,
        packagingLinks: {
          deleteMany: {},
          create: packagingLinks.map((l) => ({
            packagingMeanId: l.packagingMeanId!,
            maxQty: l.maxQty,
          })),
        },
      },
      create: {
        name: seed.name,
        slug,
        description: `Seeded ${seed.categoryName.toLowerCase()} transport mean`,
        transportMeanCategoryId: categoryId,
        supplierId: supplierId ?? null,
        plantId,
        loadCapacityKg: seed.loadCapacityKg,
        units: seed.units,
        cruiseSpeedKmh: seed.cruiseSpeedKmh,
        maxSpeedKmh: seed.maxSpeedKmh,
        sop: seed.sop,
        eop: seed.eop,
        packagingLinks: packagingLinks.length
          ? {
              create: packagingLinks.map((l) => ({
                packagingMeanId: l.packagingMeanId!,
                maxQty: l.maxQty,
              })),
            }
          : undefined,
      },
    });
    created += 1;
    await prisma.transportMeanFlow.deleteMany({ where: { transportMeanId: tm.id } });
    await prisma.transportMeanFlow.createMany({
      data: [
        { transportMeanId: tm.id, flowId: primaryFlow.id },
        secondaryFlow && secondaryFlow.id !== primaryFlow.id
          ? { transportMeanId: tm.id, flowId: secondaryFlow.id }
          : null,
      ].filter(Boolean) as Array<{ transportMeanId: string; flowId: string }>,
      skipDuplicates: true,
    });
    await pauseEvery(created, 50, 300);
  }
  console.info(`Seeded ${created} transport means.`);
}

async function seedStorageMeanCategories() {
  for (const category of storageMeanCategoriesSeedData) {
    const slug = buildSlug(category.name, "storage");
    const existing = await prisma.storageMeanCategory.findUnique({
      where: { slug },
      include: { image: { include: { image: true } } },
    });

    if (existing) {
      await prisma.storageMeanCategory.update({
        where: { id: existing.id },
        data: {
          description: category.description,
        },
      });
      if (!existing.image && category.imageUrl) {
        const image = await prisma.image.create({
          data: {
            imageUrl: category.imageUrl,
          },
        });
        await prisma.storageMeanCategoryImage.create({
          data: {
            storageMeanCategoryId: existing.id,
            imageId: image.id,
          },
        });
      }
      continue;
    }

    const created = await prisma.storageMeanCategory.create({
      data: {
        name: category.name,
        description: category.description,
        slug,
      },
    });

    if (category.imageUrl) {
      const image = await prisma.image.create({
        data: {
          imageUrl: category.imageUrl,
        },
      });
      await prisma.storageMeanCategoryImage.create({
        data: {
          storageMeanCategoryId: created.id,
          imageId: image.id,
        },
      });
    }
  }
  console.info(`Seeded/updated ${storageMeanCategoriesSeedData.length} storage mean categories.`);
}

async function seedFlows() {
  await prisma.flow.createMany({
    data: flowSeedData.map((flow) => ({
      slug: flow.slug,
      from: flow.from as $Enums.FlowStation,
      to: flow.to as $Enums.FlowStation,
    })),
    skipDuplicates: true,
  });

  console.info(`Seeded ${flowSeedData.length} flows.`);
}

async function seedUsers() {
  for (const user of usersSeedData) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, passwordHash, birthDate: user.birthDate },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        birthDate: user.birthDate,
      },
    });
  }
}

async function seedPlants() {
  try {
    const countryCodes = new Set(plantSeedData.map((plant) => plant.address.countryCode));
    const countryMap = await getCountryMap(countryCodes);

    const existingPlants = await prisma.plant.findMany({ select: { id: true, name: true } });
    const existingPlantMap = new Map(existingPlants.map((p) => [p.name, p.id]));

    for (const plant of plantSeedData) {
      if (existingPlantMap.has(plant.name)) continue;
      const countryId = countryMap.get(plant.address.countryCode)!;
      await prisma.plant.create({
        data: {
          name: plant.name,
          address: {
            create: {
              street: plant.address.street,
              city: plant.address.city,
              zipcode: plant.address.zipcode,
              countryId,
            },
          },
        },
      });
    }

    console.info(`Seeded ${plantSeedData.length} plants with addresses.`);
  } catch (error) {
    if ((error instanceof PrismaClientKnownRequestError && error.code === "P2021") || (error as { code?: string }).code === "P2021") {
      console.warn("Skipping plant seeds; Plant/Address/Country table missing.");
      return;
    }
    throw error;
  }
}

async function seedSuppliers() {
  try {
    const allowedCountries = new Set(plantSeedData.map((plant) => plant.address.countryCode));
    const supplierCodes = new Set(supplierSeedData.map((supplier) => supplier.address.countryCode));

    const invalidCodes = Array.from(supplierCodes).filter((code) => !allowedCountries.has(code));
    if (invalidCodes.length) {
      throw new Error(`Supplier country codes not in plant seeds: ${invalidCodes.join(", ")}`);
    }

    const countryMap = await getCountryMap(supplierCodes);

    const existingSuppliers = await prisma.supplier.findMany({ select: { id: true, name: true } });
    const existingSupplierMap = new Map(existingSuppliers.map((s) => [s.name, s.id]));

    for (const supplier of supplierSeedData) {
      if (existingSupplierMap.has(supplier.name)) continue;
      const countryId = countryMap.get(supplier.address.countryCode)!;
      await prisma.supplier.create({
        data: {
          name: supplier.name,
          address: {
            create: {
              street: supplier.address.street,
              city: supplier.address.city,
              zipcode: supplier.address.zipcode,
              countryId,
            },
          },
        },
      });
    }

    console.info(`Seeded ${supplierSeedData.length} suppliers with addresses.`);
  } catch (error) {
    if ((error instanceof PrismaClientKnownRequestError && error.code === "P2021") || (error as { code?: string }).code === "P2021") {
      console.warn("Skipping supplier seeds; Supplier/Address/Country table missing.");
      return;
    }
    throw error;
  }
}

async function seedStorageMeans() {
  const plantMap = new Map<string, string>();
  const plants = await prisma.plant.findMany({ select: { id: true, name: true } });
  plants.forEach((plant) => plantMap.set(plant.name, plant.id));

  const supplierMap = new Map<string, string>();
  const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true } });
  suppliers.forEach((supplier) => supplierMap.set(supplier.name, supplier.id));

  const flowMap = new Map<string, string>();
  const flows = await prisma.flow.findMany({ select: { id: true, slug: true } });
  flows.forEach((flow) => flowMap.set(flow.slug, flow.id));

  const storageMeanCategoryMap = new Map<string, string>();
  const storageMeanCategories = await prisma.storageMeanCategory.findMany({ select: { id: true, name: true } });
  storageMeanCategories.forEach((category) => storageMeanCategoryMap.set(category.name, category.id));

  for (const storage of storageMeansSeedData) {
    const status = storage.status as $Enums.StorageStatus;
    const plantId = plantMap.get(storage.plantName);
    const flowId = flowMap.get(storage.flowSlug);
    const supplierId = storage.supplierName ? supplierMap.get(storage.supplierName) ?? null : null;
    const storageMeanCategoryId = storageMeanCategoryMap.get(storage.storageMeanCategoryName);

    if (!plantId) throw new Error(`Missing plant for storage mean seed: ${storage.plantName}`);
    if (!flowId) throw new Error(`Missing flow for storage mean seed: ${storage.flowSlug}`);
    if (!storageMeanCategoryId) throw new Error(`Missing storage mean category for storage mean seed: ${storage.storageMeanCategoryName}`);

    const storageMean = await prisma.storageMean.upsert({
      where: {
        plantId_name_storageMeanCategoryId: {
          plantId,
          name: storage.name,
          storageMeanCategoryId,
        },
      },
      update: {
        description: storage.description,
        status,
        price: storage.price,
        plantId,
        supplierId,
        heightMm: storage.heightMm ?? 0,
        usefulSurfaceM2: storage.usefulSurfaceM2 ?? 0,
        grossSurfaceM2: storage.grossSurfaceM2 ?? 0,
        sop: storage.sop,
        eop: storage.eop,
        storageMeanCategoryId,
      },
      create: {
        name: storage.name,
        description: storage.description,
        status,
        price: storage.price,
        plantId,
        supplierId,
        heightMm: storage.heightMm ?? 0,
        usefulSurfaceM2: storage.usefulSurfaceM2 ?? 0,
        grossSurfaceM2: storage.grossSurfaceM2 ?? 0,
        sop: storage.sop,
        eop: storage.eop,
        storageMeanCategoryId,
      },
      select: { id: true },
    });

    if (storage.imageUrl) {
      const existingImage = await prisma.image.findFirst({ where: { imageUrl: storage.imageUrl } });
      const image =
        existingImage ??
        (await prisma.image.create({
          data: {
            id: randomUUID(),
            imageUrl: storage.imageUrl,
          },
        }));

      await prisma.storageMeanImage.upsert({
        where: { storageMeanId_imageId: { storageMeanId: storageMean.id, imageId: image.id } },
        update: {},
        create: { storageMeanId: storageMean.id, imageId: image.id, sortOrder: 0 },
      });
    }



    await prisma.storageMeanFlow.createMany({
      data: [
        {
          storageMeanId: storageMean.id,
          flowId,
          sortOrder: 0,
        },
      ],
      skipDuplicates: true,
    });

    if (storage.lanes?.length) {
      const laneGroupName = "Default";
      const existingLaneGroup = await prisma.laneGroup.findFirst({
        where: { storageMeanId: storageMean.id, name: laneGroupName },
      });

      const laneGroup =
        existingLaneGroup ??
        (await prisma.laneGroup.create({
          data: {
            storageMeanId: storageMean.id,
            name: laneGroupName,
            description: "Seeded lane group",
          },
        }));

      await prisma.lane.deleteMany({ where: { laneGroupId: laneGroup.id } });

      for (const lane of storage.lanes) {
        await prisma.lane.create({
          data: {
            laneGroupId: laneGroup.id,
            lengthMm: lane.length,
            widthMm: lane.width,
            heightMm: lane.height,
            numberOfLanes: lane.quantity,
          },
        });
      }
    }
  }

  console.info(`Upserted ${storageMeansSeedData.length} storage means.`);
}

async function seedProjects() {
  await prisma.project.createMany({
    data: projectSeedData.map((project) => ({
      ...project,
      slug: buildSlug(project.name, "project"),
    })),
    skipDuplicates: true,
  });

  console.info(`Seeded ${projectSeedData.length} projects.`);
}

async function seedCountries() {
  try {
    await prisma.country.createMany({ data: countriesSeedData, skipDuplicates: true });
    console.info(`Seeded ${countriesSeedData.length} countries.`);
  } catch (error) {
    if ((error instanceof PrismaClientKnownRequestError && error.code === "P2021") || (error as { code?: string }).code === "P2021") {
      console.warn("Skipping country seeds; Country table missing.");
      return;
    }
    throw error;
  }
}

async function main() {
  await seedCountries();
  await seedPlants();
  await seedSuppliers();
  await seedFlows();
  await seedUsers();
  await seedStorageMeanCategories();
  await seedStorageMeans();
  await seedProjects();
  await seedPackagingMeanCategories();
  await seedPartFamilies();
  await seedAccessories();
  await seedPackagingMeans();
  await seedTransportMeanCategories();
  await seedTransportMeans();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
