import { PackagingStatus, type Prisma } from "@prisma/client";
import { z } from "zod";

import { getPrisma } from "@/lib/prisma";

const KPI_TTL_MS = 1000 * 60 * 5;
const MAX_ITEMS = 200;
const packagingCache = new Map<string, { data: PackagingKpiResponse; expiresAt: number }>();

export const packagingKpiFiltersSchema = z.object({
  plantId: z.string().uuid().optional(),
  flowId: z.string().uuid().optional(),
  status: z
    .enum(["ACTIVE", "INACTIVE", "DRAFT", "ALL"])
    .optional()
    .transform((value) => value ?? "ACTIVE"),
});

export type PackagingKpiFilters = z.infer<typeof packagingKpiFiltersSchema>;

export function parsePackagingKpiFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): PackagingKpiFilters {
  const asObject =
    params instanceof URLSearchParams
      ? Object.fromEntries(params.entries())
      : Object.fromEntries(
          Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
        );

  const parsed = packagingKpiFiltersSchema.safeParse(asObject);

  if (!parsed.success) {
    throw parsed.error;
  }

  const data = parsed.data;

  return {
    plantId: data.plantId || undefined,
    flowId: data.flowId || undefined,
    status: data.status ?? "ACTIVE",
  };
}

type PackagingMeanComputed = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  status: PackagingStatus;
  price: number;
  numberOfPackagings: number;
  volumeUnitM3: number;
  volumeParkM3: number;
  valueBase: number;
  accessoriesUnitCost: number;
  fullUnitCost: number;
  fullParkValue: number;
  capacityUnit: number;
  capacityPark: number;
};

export type PackagingKpiResponse = {
  overview: {
    countPackagingMeans: number;
    countCategories: number;
    totalValueBase: number;
    totalValueFull: number;
    totalVolumeM3: number;
    totalCapacity: number;
  };
  charts: {
    valueByCategory: { categoryId: string; categoryName: string; fullValue: number }[];
    volumeByCategory: { categoryId: string; categoryName: string; volumeM3: number }[];
    priceVolumeScatter: {
      id: string;
      name: string;
      categoryName: string;
      price: number;
      volumeUnitM3: number;
    }[];
    statusDonut: { status: PackagingStatus; count: number }[];
  };
  categories: {
    id: string;
    name: string;
    slug: string;
    items: number;
    fullValue: number;
    volumeM3: number;
    capacity: number;
  }[];
};

export async function getPackagingMeansKpis(filters: PackagingKpiFilters): Promise<PackagingKpiResponse> {
  const start = Date.now();
  const prisma = getPrisma();
  const cacheKey = JSON.stringify(filters);
  const now = Date.now();
  const cached = packagingCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.data;
  const empty: PackagingKpiResponse = {
    overview: {
      countPackagingMeans: 0,
      countCategories: 0,
      totalValueBase: 0,
      totalValueFull: 0,
      totalVolumeM3: 0,
      totalCapacity: 0,
    },
    charts: {
      valueByCategory: [],
      volumeByCategory: [],
      priceVolumeScatter: [],
      statusDonut: [],
    },
    categories: [],
  };

  const where: Prisma.PackagingMeanWhereInput = {};

  if (filters.plantId) {
    where.plantId = filters.plantId;
  }

  if (filters.flowId) {
    where.flowId = filters.flowId;
  }

  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status as PackagingStatus;
  }

  let packagingMeans: Prisma.PackagingMeanGetPayload<{
    select: {
      id: true;
      name: true;
      price: true;
      width: true;
      length: true;
      height: true;
      numberOfPackagings: true;
      status: true;
      updatedAt: true;
      packagingMeanCategory: { select: { id: true; name: true; slug: true } };
      accessories: { select: { qtyPerPackaging: true; unitPriceOverride: true; accessory: { select: { unitPrice: true } } } };
      parts: { select: { partsPerPackaging: true } };
    };
  }>[] = [];

  try {
    packagingMeans = await prisma.packagingMean.findMany({
      where,
      select: {
        id: true,
        name: true,
        price: true,
        width: true,
        length: true,
        height: true,
        numberOfPackagings: true,
        status: true,
        updatedAt: true,
        packagingMeanCategory: { select: { id: true, name: true, slug: true } },
        accessories: { select: { qtyPerPackaging: true, unitPriceOverride: true, accessory: { select: { unitPrice: true } } } },
        parts: { select: { partsPerPackaging: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: MAX_ITEMS,
    });
  } catch (error) {
    console.error("[getPackagingMeansKpis] query failed, returning empty KPIs", error);
    return empty;
  }

  const computed: PackagingMeanComputed[] = packagingMeans.map((pm) => {
    if (!pm.packagingMeanCategory) {
      return null as unknown as PackagingMeanComputed;
    }
    const volumeUnitM3 = (pm.width * pm.length * pm.height) / 1_000_000_000;
    const accessoriesUnitCost = pm.accessories.reduce((sum, acc) => {
      const unitPrice = acc.unitPriceOverride ?? acc.accessory?.unitPrice ?? 0;
      return sum + acc.qtyPerPackaging * unitPrice;
    }, 0);

    const fullUnitCost = pm.price + accessoriesUnitCost;
    const capacityUnit = pm.parts.reduce((sum, part) => sum + (part.partsPerPackaging ?? 0), 0);

    return {
      id: pm.id,
      name: pm.name,
      categoryId: pm.packagingMeanCategory.id,
      categoryName: pm.packagingMeanCategory.name,
      categorySlug: pm.packagingMeanCategory.slug,
      status: pm.status,
      price: pm.price,
      numberOfPackagings: pm.numberOfPackagings,
      volumeUnitM3,
      volumeParkM3: volumeUnitM3 * pm.numberOfPackagings,
      valueBase: pm.price * pm.numberOfPackagings,
      accessoriesUnitCost,
      fullUnitCost,
      fullParkValue: fullUnitCost * pm.numberOfPackagings,
      capacityUnit,
      capacityPark: capacityUnit * pm.numberOfPackagings,
    };
  }).filter(Boolean);

  // Limit scatter size to avoid rendering very large datasets
  const maxScatterPoints = 80;

  const overview = computed.reduce(
    (acc, item) => {
      acc.totalValueBase += item.valueBase;
      acc.totalValueFull += item.fullParkValue;
      acc.totalVolumeM3 += item.volumeParkM3;
      acc.totalCapacity += item.capacityPark;
      return acc;
    },
    {
      totalValueBase: 0,
      totalValueFull: 0,
      totalVolumeM3: 0,
      totalCapacity: 0,
    }
  );

  const categoriesMap = new Map<
    string,
    { name: string; slug: string; items: number; fullValue: number; volumeM3: number; capacity: number }
  >();

  computed.forEach((item) => {
    const existing = categoriesMap.get(item.categoryId);
    const base = existing ?? {
      name: item.categoryName,
      slug: item.categorySlug,
      items: 0,
      fullValue: 0,
      volumeM3: 0,
      capacity: 0,
    };

    categoriesMap.set(item.categoryId, {
      ...base,
      items: base.items + 1,
      fullValue: base.fullValue + item.fullParkValue,
      volumeM3: base.volumeM3 + item.volumeParkM3,
      capacity: base.capacity + item.capacityPark,
    });
  });

  const valueByCategory: PackagingKpiResponse["charts"]["valueByCategory"] = [];
  const volumeByCategory: PackagingKpiResponse["charts"]["volumeByCategory"] = [];
  const categories: PackagingKpiResponse["categories"] = [];

  categoriesMap.forEach((value, categoryId) => {
    valueByCategory.push({
      categoryId,
      categoryName: value.name,
      fullValue: value.fullValue,
    });

    volumeByCategory.push({
      categoryId,
      categoryName: value.name,
      volumeM3: value.volumeM3,
    });

    categories.push({
      id: categoryId,
      name: value.name,
      slug: value.slug,
      items: value.items,
      fullValue: value.fullValue,
      volumeM3: value.volumeM3,
      capacity: value.capacity,
    });
  });

  const statusDonut = computed.reduce<Record<PackagingStatus, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {} as Record<PackagingStatus, number>);

  const statusDonutList: PackagingKpiResponse["charts"]["statusDonut"] = Object.entries(statusDonut).map(
    ([status, count]) => ({
      status: status as PackagingStatus,
      count,
    })
  );

  const result: PackagingKpiResponse = {
    overview: {
      countPackagingMeans: computed.length,
      countCategories: categoriesMap.size,
      totalValueBase: overview.totalValueBase,
      totalValueFull: overview.totalValueFull,
      totalVolumeM3: overview.totalVolumeM3,
      totalCapacity: overview.totalCapacity,
    },
    charts: {
      valueByCategory,
      volumeByCategory,
      priceVolumeScatter: (computed.length > maxScatterPoints ? computed.slice(0, maxScatterPoints) : computed).map((item) => ({
        id: item.id,
        name: item.name,
        categoryName: item.categoryName,
        price: item.price,
        volumeUnitM3: item.volumeUnitM3,
      })),
      statusDonut: statusDonutList,
    },
    categories,
  };

  packagingCache.set(cacheKey, { data: result, expiresAt: now + KPI_TTL_MS });
  if (process.env.DASHBOARD_DEBUG) {
    console.debug?.("[getPackagingMeansKpis] duration(ms)", Date.now() - start, "items", packagingMeans.length);
  }
  return result;
}
