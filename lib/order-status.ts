export const CLOSED_ORDER_STATUSES = new Set(['delivered','collected','cancelled','refunded']);
export const RECEIVED_ITEM_STATUSES = new Set(['delivered','collected']);

export function isClosedOrder(status:string){return CLOSED_ORDER_STATUSES.has(status)}
export function canAcknowledgeItem(fulfilmentMethod:string,status:string){return fulfilmentMethod==='doorstep'?status==='dispatched':['ready','dispatched'].includes(status)}
