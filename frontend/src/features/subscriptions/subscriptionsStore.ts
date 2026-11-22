import { createCollection } from '../../shared/data/createCollection'
import type { Subscription } from '../../shared/data/types'

export const subscriptionsStore = createCollection<Subscription>(
  'subscriptions',
  'SUB',
  '/subscriptions',
)

export const useSubscriptionsStore = subscriptionsStore.useStore
export const useSubscriptions = () => subscriptionsStore.useStore((s) => s.items)
