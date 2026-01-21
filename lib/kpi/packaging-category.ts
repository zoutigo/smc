import { PackagingStatus, type Prisma } from "@prisma/client";
import { z } from "zod";

import { getPrisma } from "@/lib/prisma";

export const packagingCategoryFiltersSchema = z.object({
  plantId: z.string().uuid().optional(),
  flowId: z.string().uuid().optional(),
  status: z
    .enum(["ACTIVE", "INACTIVE", "DRAFT", "ALL"])
    .optional()
    .transform((val) => val ?? "ACTIVE"),
});

export type PackagingCategoryFilters = z.infer<typeof packagingCategoryFiltersSchema>;

export function parsePackagingCategoryFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): PackagingCategoryFilters {
  const asObject =
    params instanceof URLSearchParams
      ? Object.fromEntries(params.entries())
      : Object.fromEntries(
          Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
        );

  const parsed = packagingCategoryFiltersSchema.safeParse(asObject);
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

export type PackagingCategoryKpiResponse = {
  category: { id: string; name: string; slug: string; description: string | null };
  overview: {
    countPackagingMeans: number;
    countPlants: number;
    totalFullValue: number;
    totalVolume: number;
    totalCapacity: number;
    avgEuroPerCapacity: number;
  };
  overviewCharts: {
    valueByPlant: { plantId: string; plantName: string; fullValue: number }[];
    capacityByPlant: { plantId: string; plantName: string; capacity: number }[];
    volumeHistogram: { bucket: string; count: number }[];
  };
  overviewTable: {
    id: string;
    name: string;
    plant: string;
    supplier: string;
    price: number;
    numberOfPackagings: number;
    volumeUnit: number;
    capacityUnit: number;
    fullParkValue: number;
  }[];
  cost: {
    cards: {
      valuePackaging: number;
      valueAccessories: number;
      valueFull: number;
      avgFullUnitCost: number;
      topSupplier: string | null;
      countAccessoryOverrides: number;
    };
    charts: {
      valueByPlant: { plantId: string; plantName: string; packaging: number; accessories: number }[];
      valueBySupplier: { supplierId: string; supplierName: string; value: number }[];
      costVsCapacity: { id: string; name: string; fullUnitCost: number; capacityUnit: number }[];
    };
    table: {
      id: string;
      name: string;
      price: number;
      accessoriesUnit: number;
      fullUnitCost: number;
      parkValue: number;
      accessoriesParkValue: number;
    }[];
  };
  capacity: {
    cards: {
      avgCapacityUnit: number;
      totalCapacity: number;
      avgDensity: number;
      topDensity: { name: string; density: number } | null;
      countNoCapacity: number;
      medianEuroPerCapacity: number;
    };
    charts: {
      densityTop: { id: string; name: string; density: number }[];
      densityVsCost: { id: string; name: string; density: number; fullUnitCost: number }[];
      capacityByPlant: { plantId: string; plantName: string; capacity: number }[];
    };
    table: {
      id: string;
      name: string;
      capacityUnit: number;
      volumeUnit: number;
      density: number;
      euroPerCapacity: number;
    }[];
  };
  parts: {
    cards: {
      distinctParts: number;
      topPart: string | null;
      avgPartsPerPm: number;
      partsWithoutProject: number;
      partFamilies: number;
      monoPartPct: number;
      multiPartPct: number;
    };
    charts: {
      topParts: { partId: string; partName: string; count: number }[];
      topPartFamilies: { partFamilyId: string; partFamily: string; count: number }[];
      plantFamilyCoverage: { plant: string; partFamily: string; count: number }[];
    };
    table: {
      partId: string;
      partName: string;
      packagingMeans: {
        id: string;
        name: string;
        partsPerPackaging: number;
        verticalPitch: number | null;
        horizontalPitch: number | null;
        notes: string | null;
      }[];
    }[];
  };
  accessories: {
    cards: {
      distinctAccessories: number;
      accessoriesValue: number;
      avgAccessoryUnitCost: number;
      topAccessory: string | null;
      pctWithAccessories: number;
      countPriceOverride: number;
    };
    charts: {
      topAccessories: { accessoryId: string; accessory: string; value: number }[];
      accessoriesBySupplier: { supplierId: string; supplier: string; value: number }[];
      donutWithAccessories: { label: string; count: number }[];
    };
    table: {
      packagingMeanId: string;
      packagingMean: string;
      accessory: string;
      qtyPerPackaging: number;
      unitPrice: number;
      unitPriceOverride: number | null;
      unitCost: number;
      parkCost: number;
    }[];
  };
};

type ComputedPm = {
  id: string;
  name: string;
  slug: string;
  plantId: string;
  plantName: string;
  supplierId: string | null;
  supplierName: string;
  price: number;
  numberOfPackagings: number;
  volumeUnit: number;
  capacityUnit: number;
  capacityPark: number;
  accessoriesUnit: number;
  accessoriesPark: number;
  fullUnitCost: number;
  fullParkValue: number;
  density: number;
  euroPerCapacity: number;
  status: PackagingStatus;
  parts: {
    partId: string;
    partName: string;
    partFamilyId: string | null;
    partFamilyName: string | null;
    projectId: string | null;
    partsPerPackaging: number;
    verticalPitch: number | null;
    horizontalPitch: number | null;
    notes: string | null;
  }[];
  accessories: {
    accessoryId: string;
    accessoryName: string;
    supplierId: string | null;
    supplierName: string | null;
    qtyPerPackaging: number;
    unitPriceOverride: number | null;
    unitPriceBase: number;
  }[];
};

export async function getPackagingCategoryKpis(
  categorySlug: string,
  filters: PackagingCategoryFilters
): Promise<PackagingCategoryKpiResponse> {
  const prisma = getPrisma();

  const category = await prisma.packagingMeanCategory.findUnique({
    where: { slug: categorySlug },
    select: { id: true, name: true, slug: true, description: true },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const where: Prisma.PackagingMeanWhereInput = {
    packagingMeanCategoryId: category.id,
  };

  if (filters.plantId) where.plantId = filters.plantId;
  if (filters.flowId) where.flowId = filters.flowId;
  if (filters.status && filters.status !== "ALL") where.status = filters.status as PackagingStatus;

  const packagingMeans = await prisma.packagingMean.findMany({
    where,
    include: {
      plant: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
      parts: {
        include: {
          part: {
            select: {
              id: true,
              name: true,
              projectId: true,
              partFamilyId: true,
              partFamily: { select: { id: true, name: true } },
            },
          },
        },
      },
      accessories: {
        include: {
          accessory: {
            select: { id: true, name: true, unitPrice: true, supplierId: true, supplier: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  const computed: ComputedPm[] = packagingMeans.map((pm) => {
    const volumeUnit = (pm.width * pm.length * pm.height) / 1_000_000_000;
    const parts = pm.parts.map((p) => ({
      partId: p.partId,
      partName: p.part.name,
      partFamilyId: p.part.partFamilyId,
      partFamilyName: p.part.partFamily?.name ?? null,
      projectId: p.part.projectId,
      partsPerPackaging: p.partsPerPackaging ?? 0,
      verticalPitch: p.verticalPitch,
      horizontalPitch: p.horizontalPitch,
      notes: p.notes,
    }));

    const accessories = pm.accessories.map((acc) => ({
      accessoryId: acc.accessoryId,
      accessoryName: acc.accessory?.name ?? "—",
      supplierId: acc.accessory?.supplierId ?? null,
      supplierName: acc.accessory?.supplier?.name ?? null,
      qtyPerPackaging: acc.qtyPerPackaging,
      unitPriceOverride: acc.unitPriceOverride,
      unitPriceBase: acc.accessory?.unitPrice ?? 0,
    }));

    const accessoriesUnit = accessories.reduce((sum, a) => {
      const unitPrice = a.unitPriceOverride ?? a.unitPriceBase;
      return sum + a.qtyPerPackaging * unitPrice;
    }, 0);

    const capacityUnit = parts.reduce((sum, part) => sum + part.partsPerPackaging, 0);
    const density = volumeUnit > 0 ? capacityUnit / volumeUnit : 0;
    const euroPerCapacity = capacityUnit > 0 ? (pm.price + accessoriesUnit) / capacityUnit : 0;

    return {
      id: pm.id,
      name: pm.name,
      slug: pm.name,
      plantId: pm.plant.id,
      plantName: pm.plant.name,
      supplierId: pm.supplierId,
      supplierName: pm.supplier?.name ?? "—",
      price: pm.price,
      numberOfPackagings: pm.numberOfPackagings,
      volumeUnit,
      capacityUnit,
      capacityPark: capacityUnit * pm.numberOfPackagings,
      accessoriesUnit,
      accessoriesPark: accessoriesUnit * pm.numberOfPackagings,
      fullUnitCost: pm.price + accessoriesUnit,
      fullParkValue: (pm.price + accessoriesUnit) * pm.numberOfPackagings,
      density,
      euroPerCapacity,
      status: pm.status,
      parts,
      accessories,
    };
  });

  const totalFullValue = computed.reduce((sum, item) => sum + item.fullParkValue, 0);
  const totalVolume = computed.reduce((sum, item) => sum + item.volumeUnit * item.numberOfPackagings, 0);
  const totalCapacity = computed.reduce((sum, item) => sum + item.capacityPark, 0);
  const countPlants = new Set(computed.map((i) => i.plantId)).size;
  const avgEuroPerCapacity = totalCapacity > 0 ? totalFullValue / totalCapacity : 0;

  const valueByPlantMap = new Map<string, { plantName: string; packaging: number; accessories: number }>();
  computed.forEach((item) => {
    const entry = valueByPlantMap.get(item.plantId) ?? { plantName: item.plantName, packaging: 0, accessories: 0 };
    entry.packaging += item.price * item.numberOfPackagings;
    entry.accessories += item.accessoriesPark;
    valueByPlantMap.set(item.plantId, entry);
  });

  const valueByPlant = Array.from(valueByPlantMap.entries()).map(([plantId, value]) => ({
    plantId,
    plantName: value.plantName,
    fullValue: value.packaging + value.accessories,
  }));

  const capacityByPlant = Array.from(
    computed.reduce((map, item) => {
      const next = map.get(item.plantId) ?? { plantName: item.plantName, capacity: 0 };
      next.capacity += item.capacityPark;
      map.set(item.plantId, next);
      return map;
    }, new Map<string, { plantName: string; capacity: number }>())
  ).map(([plantId, value]) => ({ plantId, plantName: value.plantName, capacity: value.capacity }));

  const volumeHistogram = buildHistogram(
    computed.map((i) => i.volumeUnit),
    [0.1, 0.5, 1, 2, 5, 10, 20]
  );

  const overviewTable = computed
    .sort((a, b) => b.fullParkValue - a.fullParkValue)
    .slice(0, 20)
    .map((item) => ({
      id: item.id,
      name: item.name,
      plant: item.plantName,
      supplier: item.supplierName,
      price: item.price,
      numberOfPackagings: item.numberOfPackagings,
      volumeUnit: item.volumeUnit,
      capacityUnit: item.capacityUnit,
      fullParkValue: item.fullParkValue,
    }));

  const supplierValues = computed.reduce((map, item) => {
    const key = item.supplierId ?? "unknown";
    const existing = map.get(key) ?? { name: item.supplierName ?? "—", value: 0 };
    existing.value += item.fullParkValue;
    map.set(key, existing);
    return map;
  }, new Map<string, { name: string; value: number }>());

  const topSupplierEntry = Array.from(supplierValues.entries()).sort((a, b) => b[1].value - a[1].value)[0];
  const topSupplier = topSupplierEntry ? topSupplierEntry[1].name : null;

  const countAccessoryOverrides = computed.filter((pm) => pm.accessories.some((a) => a.unitPriceOverride != null)).length;

  const valueBySupplier = Array.from(supplierValues.entries()).map(([supplierId, value]) => ({
    supplierId,
    supplierName: value.name,
    value: value.value,
  }));

  const costVsCapacity = computed.map((item) => ({
    id: item.id,
    name: item.name,
    fullUnitCost: item.fullUnitCost,
    capacityUnit: item.capacityUnit,
  }));

  const costTable = computed.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    accessoriesUnit: item.accessoriesUnit,
    fullUnitCost: item.fullUnitCost,
    parkValue: item.fullParkValue,
    accessoriesParkValue: item.accessoriesPark,
  }));

  const avgCapacityUnit = computed.length
    ? computed.reduce((sum, item) => sum + item.capacityUnit, 0) / computed.length
    : 0;
  const avgDensity = computed.length ? computed.reduce((sum, item) => sum + item.density, 0) / computed.length : 0;
  const topDensityItem = computed
    .filter((i) => i.density > 0)
    .sort((a, b) => b.density - a.density)
    .at(0);
  const countNoCapacity = computed.filter((i) => i.capacityUnit === 0).length;
  const medianEuroPerCapacity = median(
    computed.filter((i) => i.euroPerCapacity > 0).map((i) => i.euroPerCapacity)
  );

  const densityTop = computed
    .filter((i) => i.density > 0)
    .sort((a, b) => b.density - a.density)
    .slice(0, 10)
    .map((item) => ({ id: item.id, name: item.name, density: item.density }));

  const densityVsCost = computed
    .filter((i) => i.density > 0)
    .map((item) => ({ id: item.id, name: item.name, density: item.density, fullUnitCost: item.fullUnitCost }));

  const capacityTable = computed.map((item) => ({
    id: item.id,
    name: item.name,
    capacityUnit: item.capacityUnit,
    volumeUnit: item.volumeUnit,
    density: item.density,
    euroPerCapacity: item.euroPerCapacity,
  }));

  const partUsage = new Map<
    string,
    { name: string; projectId: string | null; partFamilyId: string | null; partFamilyName: string | null; count: number }
  >();
  const partFamilyUsage = new Map<string, { name: string; count: number }>();
  const plantFamilyCoverage = new Map<string, Map<string, number>>();
  let monoCount = 0;
  let multiCount = 0;
  let partsWithoutProject = 0;

  computed.forEach((pm) => {
    if (pm.parts.length <= 1) monoCount += 1;
    else multiCount += 1;
    pm.parts.forEach((part) => {
      if (!part.projectId) partsWithoutProject += 1;
      const p = partUsage.get(part.partId) ?? {
        name: part.partName,
        projectId: part.projectId,
        partFamilyId: part.partFamilyId,
        partFamilyName: part.partFamilyName,
        count: 0,
      };
      p.count += 1;
      partUsage.set(part.partId, p);

      if (part.partFamilyId) {
        const pf = partFamilyUsage.get(part.partFamilyId) ?? { name: part.partFamilyName ?? "Unknown", count: 0 };
        pf.count += 1;
        partFamilyUsage.set(part.partFamilyId, pf);
      }

      const plantMap = plantFamilyCoverage.get(pm.plantId) ?? new Map<string, number>();
      const key = part.partFamilyName ?? "Unknown";
      plantMap.set(key, (plantMap.get(key) ?? 0) + 1);
      plantFamilyCoverage.set(pm.plantId, plantMap);
    });
  });

  const distinctParts = partUsage.size;
  const topPartEntry = Array.from(partUsage.entries()).sort((a, b) => b[1].count - a[1].count)[0];
  const topPart = topPartEntry ? topPartEntry[1].name : null;
  const avgPartsPerPm = computed.length ? computed.reduce((sum, pm) => sum + pm.parts.length, 0) / computed.length : 0;
  const partFamilies = partFamilyUsage.size;
  const monoPartPct = computed.length ? (monoCount / computed.length) * 100 : 0;
  const multiPartPct = computed.length ? (multiCount / computed.length) * 100 : 0;

  const topParts = Array.from(partUsage.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15)
    .map(([partId, p]) => ({ partId, partName: p.name, count: p.count }));

  const topPartFamilies = Array.from(partFamilyUsage.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15)
    .map(([partFamilyId, pf]) => ({ partFamilyId, partFamily: pf.name, count: pf.count }));

  const plantFamilyCoverageArray: { plant: string; partFamily: string; count: number }[] = [];
  plantFamilyCoverage.forEach((familyMap, plantId) => {
    const plantName = computed.find((pm) => pm.plantId === plantId)?.plantName ?? "Unknown";
    familyMap.forEach((count, pf) => {
      plantFamilyCoverageArray.push({ plant: plantName, partFamily: pf, count });
    });
  });

  const partsTableMap = new Map<
    string,
    {
      partId: string;
      partName: string;
      packagingMeans: {
        id: string;
        name: string;
        partsPerPackaging: number;
        verticalPitch: number | null;
        horizontalPitch: number | null;
        notes: string | null;
      }[];
    }
  >();

  computed.forEach((pm) => {
    pm.parts.forEach((part) => {
      const entry =
        partsTableMap.get(part.partId) ??
        ({
          partId: part.partId,
          partName: part.partName,
          packagingMeans: [],
        } satisfies PackagingCategoryKpiResponse["parts"]["table"][number]);
      entry.packagingMeans.push({
        id: pm.id,
        name: pm.name,
        partsPerPackaging: part.partsPerPackaging,
        verticalPitch: part.verticalPitch,
        horizontalPitch: part.horizontalPitch,
        notes: part.notes,
      });
      partsTableMap.set(part.partId, entry);
    });
  });

  const partsTable = Array.from(partsTableMap.values());

  const accessoryUsage = new Map<
    string,
    { name: string; value: number; supplierId: string | null; supplier: string | null }
  >();
  computed.forEach((pm) => {
    pm.accessories.forEach((acc) => {
      const unitCost = (acc.unitPriceOverride ?? acc.unitPriceBase) * acc.qtyPerPackaging;
      const parkCost = unitCost * pm.numberOfPackagings;
      const entry =
        accessoryUsage.get(acc.accessoryId) ?? {
          name: acc.accessoryName,
          value: 0,
          supplierId: acc.supplierId,
          supplier: acc.supplierName,
        };
      entry.value += parkCost;
      accessoryUsage.set(acc.accessoryId, entry);
    });
  });

  const distinctAccessories = accessoryUsage.size;
  const accessoriesValue = computed.reduce((sum, pm) => sum + pm.accessoriesPark, 0);
  const avgAccessoryUnitCost =
    computed.length > 0 ? computed.reduce((sum, pm) => sum + pm.accessoriesUnit, 0) / computed.length : 0;
  const topAccessoryEntry = Array.from(accessoryUsage.entries()).sort((a, b) => b[1].value - a[1].value)[0];
  const topAccessory = topAccessoryEntry ? topAccessoryEntry[1].name : null;
  const pctWithAccessories = computed.length
    ? (computed.filter((pm) => pm.accessories.length > 0).length / computed.length) * 100
    : 0;
  const countPriceOverride = computed.filter((pm) => pm.accessories.some((acc) => acc.unitPriceOverride != null)).length;

  const topAccessories = Array.from(accessoryUsage.entries())
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 15)
    .map(([accessoryId, acc]) => ({ accessoryId, accessory: acc.name, value: acc.value }));

  const accessoriesBySupplier = Array.from(
    accessoryUsage.values().reduce((map, acc) => {
      const key = acc.supplierId ?? "unknown";
      const existing = map.get(key) ?? { supplier: acc.supplier ?? "—", value: 0 };
      existing.value += acc.value;
      map.set(key, existing);
      return map;
    }, new Map<string, { supplier: string; value: number }>())
  ).map(([supplierId, value]) => ({ supplierId, supplier: value.supplier, value: value.value }));

  const donutWithAccessories = [
    { label: "With accessories", count: computed.filter((pm) => pm.accessories.length > 0).length },
    { label: "Without accessories", count: computed.filter((pm) => pm.accessories.length === 0).length },
  ];

  const accessoriesTable: PackagingCategoryKpiResponse["accessories"]["table"] = [];
  computed.forEach((pm) => {
    pm.accessories.forEach((acc) => {
      const unitPrice = acc.unitPriceOverride ?? acc.unitPriceBase;
      const unitCost = unitPrice * acc.qtyPerPackaging;
      const parkCost = unitCost * pm.numberOfPackagings;
      accessoriesTable.push({
        packagingMeanId: pm.id,
        packagingMean: pm.name,
        accessory: acc.accessoryName,
        qtyPerPackaging: acc.qtyPerPackaging,
        unitPrice,
        unitPriceOverride: acc.unitPriceOverride,
        unitCost,
        parkCost,
      });
    });
  });

  return {
    category,
    overview: {
      countPackagingMeans: computed.length,
      countPlants,
      totalFullValue,
      totalVolume,
      totalCapacity,
      avgEuroPerCapacity,
    },
    overviewCharts: {
      valueByPlant,
      capacityByPlant,
      volumeHistogram,
    },
    overviewTable,
    cost: {
      cards: {
        valuePackaging: valueByPlant.reduce((sum, item) => sum + (valueByPlantMap.get(item.plantId)?.packaging ?? 0), 0),
        valueAccessories: computed.reduce((sum, item) => sum + item.accessoriesPark, 0),
        valueFull: totalFullValue,
        avgFullUnitCost: computed.length
          ? computed.reduce((sum, item) => sum + item.fullUnitCost, 0) / computed.length
          : 0,
        topSupplier,
        countAccessoryOverrides,
      },
      charts: {
        valueByPlant: Array.from(valueByPlantMap.entries()).map(([plantId, value]) => ({
          plantId,
          plantName: value.plantName,
          packaging: value.packaging,
          accessories: value.accessories,
        })),
        valueBySupplier,
        costVsCapacity,
      },
      table: costTable,
    },
    capacity: {
      cards: {
        avgCapacityUnit,
        totalCapacity,
        avgDensity,
        topDensity: topDensityItem ? { name: topDensityItem.name, density: topDensityItem.density } : null,
        countNoCapacity,
        medianEuroPerCapacity,
      },
      charts: {
        densityTop,
        densityVsCost,
        capacityByPlant,
      },
      table: capacityTable,
    },
    parts: {
      cards: {
        distinctParts,
        topPart,
        avgPartsPerPm,
        partsWithoutProject,
        partFamilies,
        monoPartPct,
        multiPartPct,
      },
      charts: {
        topParts,
        topPartFamilies,
        plantFamilyCoverage: plantFamilyCoverageArray,
      },
      table: partsTable,
    },
    accessories: {
      cards: {
        distinctAccessories,
        accessoriesValue,
        avgAccessoryUnitCost,
        topAccessory,
        pctWithAccessories,
        countPriceOverride,
      },
      charts: {
        topAccessories,
        accessoriesBySupplier,
        donutWithAccessories,
      },
      table: accessoriesTable,
    },
  };
}

function buildHistogram(values: number[], thresholds: number[]): { bucket: string; count: number }[] {
  const counts = new Array(thresholds.length + 1).fill(0);
  values.forEach((v) => {
    const idx = thresholds.findIndex((t) => v <= t);
    const bucketIndex = idx === -1 ? thresholds.length : idx;
    counts[bucketIndex] += 1;
  });
  const buckets: { bucket: string; count: number }[] = [];
  thresholds.forEach((t, i) => {
    const prev = i === 0 ? 0 : thresholds[i - 1];
    buckets.push({ bucket: `${prev.toFixed(1)}–${t.toFixed(1)} m³`, count: counts[i] });
  });
  buckets.push({ bucket: `>${thresholds[thresholds.length - 1]} m³`, count: counts[thresholds.length] });
  return buckets;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}
