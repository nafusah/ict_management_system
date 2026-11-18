import { getStoredToken, request } from '../../shared/data/api'
import { createCollection } from '../../shared/data/createCollection'
import {
  SEED_BRANDS,
  SEED_DEVICE_TYPES,
  SEED_INK_COLORS,
  SEED_PRINTER_TYPES,
  SEED_PROVIDERS,
  SEED_SERVICES,
  SEED_SUBSCRIPTION_CATEGORIES,
} from '../../shared/data/seed'
import type {
  BrandItem,
  DeviceTypeItem,
  InkColorItem,
  PrinterTypeItem,
  ServiceItem,
  ServiceProviderItem,
  SubscriptionCategoryItem,
} from '../../shared/data/types'

export const deviceTypesStore = createCollection<DeviceTypeItem>(
  'device-types',
  'TYPE',
  SEED_DEVICE_TYPES,
  '/dictionary/device-types',
)
export const printerTypesStore = createCollection<PrinterTypeItem>(
  'printer-types',
  'PRT',
  SEED_PRINTER_TYPES,
  '/dictionary/printer-types',
)
export const inkColorsStore = createCollection<InkColorItem>(
  'ink-colors',
  'CLR',
  SEED_INK_COLORS,
  '/dictionary/ink-colors',
)
export const brandsStore = createCollection<BrandItem>('brands', 'BRD', SEED_BRANDS, '/dictionary/brands')
export const servicesStore = createCollection<ServiceItem>('services', 'SRV', SEED_SERVICES, '/dictionary/services')
export const providersStore = createCollection<ServiceProviderItem>(
  'providers',
  'PRV',
  SEED_PROVIDERS,
  '/dictionary/providers',
)
export const subscriptionCategoriesStore = createCollection<SubscriptionCategoryItem>(
  'subscription-categories',
  'CAT',
  SEED_SUBSCRIPTION_CATEGORIES,
  '/dictionary/subscription-categories',
)

export const useDeviceTypes = () => deviceTypesStore.useStore((s) => s.items)
export const usePrinterTypes = () => printerTypesStore.useStore((s) => s.items)
export const useInkColors = () => inkColorsStore.useStore((s) => s.items)
export const useBrands = () => brandsStore.useStore((s) => s.items)
export const useServices = () => servicesStore.useStore((s) => s.items)
export const useProviders = () => providersStore.useStore((s) => s.items)
export const useSubscriptionCategories = () => subscriptionCategoriesStore.useStore((s) => s.items)

export async function savePrinterType(
  data: Omit<PrinterTypeItem, 'id'>,
  id?: string,
): Promise<PrinterTypeItem> {
  if (getStoredToken()) {
    if (id) {
      const updated = await request.put<PrinterTypeItem>(
        `/dictionary/printer-types/${encodeURIComponent(id)}`,
        data,
      )
      printerTypesStore.setAll(printerTypesStore.getAll().map((p) => (p.id === id ? updated : p)))
      return updated
    }
    const created = await request.post<PrinterTypeItem>('/dictionary/printer-types', data)
    printerTypesStore.setAll([created, ...printerTypesStore.getAll()])
    return created
  }

  if (id) {
    const updated: PrinterTypeItem = { ...data, id }
    printerTypesStore.update(updated)
    return updated
  }
  printerTypesStore.add(data)
  return printerTypesStore.getAll()[0]
}

export async function deletePrinterType(id: string): Promise<void> {
  if (getStoredToken()) {
    await request.delete(`/dictionary/printer-types/${encodeURIComponent(id)}`)
    printerTypesStore.setAll(printerTypesStore.getAll().filter((p) => p.id !== id))
    return
  }
  printerTypesStore.remove(id)
}
