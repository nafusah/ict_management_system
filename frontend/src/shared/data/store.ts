import { getStoredToken } from './api'
import { devicesStore, useDevices } from '../../features/devices/devicesStore'
import {
  inkDispensesStore,
  inksStore,
  syncBatchInkDispenseWithServer as syncBatchInkDispenseBase,
  syncInkDispenseWithServer as syncInkDispenseBase,
  useInkDispenses,
  useInks,
} from '../../features/inks/inksStore'
import { subscriptionsStore, useSubscriptions } from '../../features/subscriptions/subscriptionsStore'
import {
  brandsStore,
  deviceTypesStore,
  inkColorsStore,
  providersStore,
  servicesStore,
  useBrands,
  useDeviceTypes,
  useInkColors,
  useProviders,
  useServices,
} from '../../features/dictionary/dictionaryStore'
import {
  auditLogsStore,
  departmentsStore,
  downloadDatabaseBackup,
  employeesStore,
  fetchSettingsFromApi,
  saveSettingsToApi,
  useAuditLogs,
  useDepartments,
  useEmployees,
  usersStore,
  useUsers,
} from '../../features/settings/settingsStore'
import type { GeneralSettingsData } from '../../features/settings/settingsStore'

export {
  auditLogsStore,
  brandsStore,
  departmentsStore,
  devicesStore,
  deviceTypesStore,
  downloadDatabaseBackup,
  employeesStore,
  fetchSettingsFromApi,
  inkColorsStore,
  inkDispensesStore,
  inksStore,
  providersStore,
  saveSettingsToApi,
  servicesStore,
  subscriptionsStore,
  useAuditLogs,
  useBrands,
  useDepartments,
  useDevices,
  useDeviceTypes,
  useEmployees,
  useInkColors,
  useInkDispenses,
  useInks,
  useProviders,
  usersStore,
  useServices,
  useSubscriptions,
  useUsers,
}
export type { GeneralSettingsData }

export function syncInkDispenseWithServer(inkId: string, department: string, quantity: number, date: string) {
  syncInkDispenseBase(inkId, department, quantity, date, () => {
    void auditLogsStore.hydrate()
  })
}

export function syncBatchInkDispenseWithServer(
  department: string,
  items: { inkId: string; quantity: number }[],
  date: string,
) {
  syncBatchInkDispenseBase(department, items, date, () => {
    void auditLogsStore.hydrate()
  })
}

export async function hydrateAllFromApi() {
  if (!getStoredToken()) return
  await Promise.allSettled([
    devicesStore.hydrate(),
    deviceTypesStore.hydrate(),
    inksStore.hydrate(),
    inkDispensesStore.hydrate(),
    inkColorsStore.hydrate(),
    brandsStore.hydrate(),
    servicesStore.hydrate(),
    providersStore.hydrate(),
    subscriptionsStore.hydrate(),
    usersStore.hydrate(),
    departmentsStore.hydrate(),
    employeesStore.hydrate(),
    auditLogsStore.hydrate(),
  ])
}
