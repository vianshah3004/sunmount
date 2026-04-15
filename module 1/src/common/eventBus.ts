import { EventEmitter } from "node:events";

export const INVENTORY_EVENTS = {
  SALE_CREATED: "SALE_CREATED",
  PURCHASE_COMPLETED: "PURCHASE_COMPLETED",
  WIP_STARTED: "WIP_STARTED",
  WIP_COMPLETED: "WIP_COMPLETED"
} as const;

export type InventoryEventName = keyof typeof INVENTORY_EVENTS;

export type InventoryEventPayload = {
  productCode: string;
  quantity: number;
  referenceId?: string;
};

type EventPayloadMap = {
  SALE_CREATED: InventoryEventPayload;
  PURCHASE_COMPLETED: InventoryEventPayload;
  WIP_STARTED: InventoryEventPayload;
  WIP_COMPLETED: InventoryEventPayload;
};

class TypedInventoryEventBus extends EventEmitter {
  emitEvent<TEvent extends keyof EventPayloadMap>(
    eventName: TEvent,
    payload: EventPayloadMap[TEvent]
  ) {
    return this.emit(eventName, payload);
  }

  onEvent<TEvent extends keyof EventPayloadMap>(
    eventName: TEvent,
    handler: (payload: EventPayloadMap[TEvent]) => void | Promise<void>
  ) {
    this.on(eventName, handler);
  }
}

export const eventBus = new TypedInventoryEventBus();
