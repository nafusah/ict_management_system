import { createCollection } from '../../shared/data/createCollection'
import { SEED_DEVICES } from '../../shared/data/seed'
import type { Device } from '../../shared/data/types'

export const devicesStore = createCollection<Device>('devices', 'DEV', SEED_DEVICES, '/devices')
export const useDevicesStore = devicesStore.useStore
export const useDevices = () => devicesStore.useStore((s) => s.items)
