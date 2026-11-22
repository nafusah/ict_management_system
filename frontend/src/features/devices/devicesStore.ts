import { createCollection } from '../../shared/data/createCollection'
import type { Device } from '../../shared/data/types'

export const devicesStore = createCollection<Device>('devices', 'DEV', '/devices')
export const useDevicesStore = devicesStore.useStore
export const useDevices = () => devicesStore.useStore((s) => s.items)
