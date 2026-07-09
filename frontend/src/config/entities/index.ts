import {
  vehicleCategoryConfig,
  tyrePositionConfig,
  tyreTypeConfig,
  failureCodeConfig,
  damageTypeConfig,
  removalReasonConfig,
  scrapReasonConfig,
  repairTypeConfig,
} from '@/config/entities/simple-lookups'
import {
  vehicleModelConfig,
  axleConfigurationConfig,
  tyreBrandConfig,
  tyrePatternConfig,
  tyreSizeConfig,
} from '@/config/entities/vehicle-tyre-taxonomy'
import {
  supplierConfig,
  retreadVendorConfig,
  customerConfig,
  siteConfig,
  warehouseConfig,
  projectConfig,
  inspectionChecklistConfig,
} from '@/config/entities/locations-partners'
import { vehicleConfig } from '@/config/entities/vehicle'
import type { EntityConfig } from '@/types/entity-config'

/** path -> config, used to auto-register generic CrudPage routes. */
export const masterDataEntityConfigs: Record<string, EntityConfig> = {
  '/master-data/vehicles': vehicleConfig,
  '/master-data/vehicle-models': vehicleModelConfig,
  '/master-data/vehicle-categories': vehicleCategoryConfig,
  '/master-data/axle-configurations': axleConfigurationConfig,
  '/master-data/tyre-brands': tyreBrandConfig,
  '/master-data/tyre-patterns': tyrePatternConfig,
  '/master-data/tyre-sizes': tyreSizeConfig,
  '/master-data/tyre-types': tyreTypeConfig,
  '/master-data/suppliers': supplierConfig,
  '/master-data/warehouses': warehouseConfig,
  '/master-data/sites': siteConfig,
  '/master-data/projects': projectConfig,
  '/master-data/customers': customerConfig,
  '/master-data/tyre-positions': tyrePositionConfig,
  '/master-data/failure-codes': failureCodeConfig,
  '/master-data/damage-types': damageTypeConfig,
  '/master-data/removal-reasons': removalReasonConfig,
  '/master-data/scrap-reasons': scrapReasonConfig,
  '/master-data/repair-types': repairTypeConfig,
  '/master-data/retread-vendors': retreadVendorConfig,
  '/master-data/inspection-checklists': inspectionChecklistConfig,
}
