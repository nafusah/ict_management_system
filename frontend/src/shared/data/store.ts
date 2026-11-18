import { getStoredToken } from './api'
import { devicesStore, useDevices } from '../../features/devices/devicesStore'
import {
  createInkVoucherOnServer,
  deleteInkVoucherOnServer,
  dispenseInkVoucherOnServer,
  inkDispensesStore,
  inkVouchersStore,
  inksStore,
  rejectInkVoucherOnServer,
  syncBatchInkDispenseWithServer as syncBatchInkDispenseBase,
  syncInkDispenseWithServer as syncInkDispenseBase,
  useInkDispenses,
  useInkVouchers,
  useInks,
} from '../../features/inks/inksStore'
import { subscriptionsStore, useSubscriptions } from '../../features/subscriptions/subscriptionsStore'
import {
  brandsStore,
  deletePrinterType,
  deviceTypesStore,
  inkColorsStore,
  printerTypesStore,
  providersStore,
  savePrinterType,
  servicesStore,
  subscriptionCategoriesStore,
  useBrands,
  useDeviceTypes,
  useInkColors,
  usePrinterTypes,
  useProviders,
  useServices,
  useSubscriptionCategories,
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
import type { Classification, Permission } from './types'

export {
  auditLogsStore,
  brandsStore,
  deletePrinterType,
  departmentsStore,
  devicesStore,
  deviceTypesStore,
  downloadDatabaseBackup,
  employeesStore,
  fetchSettingsFromApi,
  inkColorsStore,
  inkDispensesStore,
  inkVouchersStore,
  inksStore,
  printerTypesStore,
  providersStore,
  savePrinterType,
  saveSettingsToApi,
  servicesStore,
  subscriptionCategoriesStore,
  subscriptionsStore,
  useAuditLogs,
  useBrands,
  useDepartments,
  useDevices,
  useDeviceTypes,
  useEmployees,
  useInkColors,
  useInkDispenses,
  useInkVouchers,
  useInks,
  usePrinterTypes,
  useProviders,
  usersStore,
  useServices,
  useSubscriptionCategories,
  useSubscriptions,
  useUsers,
}
export type { GeneralSettingsData }

export {
  createInkVoucherOnServer,
  deleteInkVoucherOnServer,
  dispenseInkVoucherOnServer,
  rejectInkVoucherOnServer,
}

export function syncInkDispenseWithServer(
  inkId: string,
  department: string,
  quantity: number,
  date: string,
  scope: Classification = 'shared',
  recipientName?: string | null,
  recipientEmail?: string | null,
) {
  return syncInkDispenseBase(inkId, department, quantity, date, scope, recipientName, recipientEmail, () => {
    void auditLogsStore.hydrate()
  })
}

export function syncBatchInkDispenseWithServer(
  department: string,
  items: { inkId: string; quantity: number }[],
  date: string,
  scope: Classification = 'shared',
  recipientName?: string | null,
  recipientEmail?: string | null,
) {
  return syncBatchInkDispenseBase(department, items, date, scope, recipientName, recipientEmail, () => {
    void auditLogsStore.hydrate()
  })
}

function readStoredPermissions(): Permission[] | null {
  try {
    const raw = localStorage.getItem('it-management:session') ?? sessionStorage.getItem('it-management:session')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { permissions?: Permission[] }
    return Array.isArray(parsed.permissions) ? parsed.permissions : null
  } catch {
    return null
  }
}

export async function hydrateAllFromApi(explicitPerms?: Permission[]) {
  if (!getStoredToken()) return
  const perms = explicitPerms ?? readStoredPermissions()
  const hasAny = (...list: Permission[]) => !perms || list.some((p) => perms.includes(p))

  const jobs: Promise<void>[] = []

  if (hasAny('devices.view', 'devices.manage', 'dashboard.devices')) {
    jobs.push(devicesStore.hydrate(), deviceTypesStore.hydrate())
  } else if (hasAny('dictionary.deviceTypes')) {
    jobs.push(deviceTypesStore.hydrate())
  }

  if (hasAny('inks.view', 'inks.manage', 'dashboard.inks', 'inks.vouchers.view', 'inks.vouchers.create', 'inks.vouchers.approve')) {
    jobs.push(inksStore.hydrate(), printerTypesStore.hydrate(), inkColorsStore.hydrate())
  } else {
    if (hasAny('dictionary.printerTypes', 'dictionary.inkColors')) jobs.push(printerTypesStore.hydrate())
    if (hasAny('dictionary.inkColors')) jobs.push(inkColorsStore.hydrate())
  }

  if (hasAny('inks.view', 'inks.manage')) {
    jobs.push(inkDispensesStore.hydrate())
  }

  if (hasAny('inks.vouchers.view', 'inks.vouchers.create', 'inks.vouchers.approve')) {
    jobs.push(inkVouchersStore.hydrate())
  }

  if (hasAny('subscriptions.view', 'subscriptions.manage', 'dashboard.subscriptions')) {
    jobs.push(subscriptionsStore.hydrate())
  }

  if (hasAny('dictionary.brands', 'dictionary.printerTypes', 'devices.view', 'devices.manage', 'inks.view', 'inks.manage')) {
    jobs.push(brandsStore.hydrate())
  }

  if (hasAny('dictionary.services', 'subscriptions.view', 'subscriptions.manage')) {
    jobs.push(servicesStore.hydrate(), providersStore.hydrate())
  }

  if (hasAny('dictionary.services', 'subscriptions.view', 'subscriptions.manage', 'dashboard.subscriptions')) {
    jobs.push(subscriptionCategoriesStore.hydrate())
  }

  if (hasAny('employees.manage', 'settings.manage', 'devices.view', 'devices.manage', 'inks.view', 'inks.manage', 'inks.vouchers.view', 'inks.vouchers.create', 'inks.vouchers.approve', 'subscriptions.view', 'subscriptions.manage')) {
    jobs.push(departmentsStore.hydrate())
  }

  if (hasAny('employees.manage', 'settings.manage', 'devices.view', 'devices.manage', 'inks.view', 'inks.manage', 'inks.vouchers.view', 'inks.vouchers.create', 'inks.vouchers.approve')) {
    jobs.push(employeesStore.hydrate())
  }

  if (hasAny('settings.manage')) {
    jobs.push(usersStore.hydrate(), auditLogsStore.hydrate())
  }

  await Promise.allSettled(jobs)
}
