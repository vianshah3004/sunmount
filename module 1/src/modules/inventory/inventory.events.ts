import { INVENTORY_EVENTS, eventBus } from "../../common/eventBus";
import { logger } from "../../common/logger";
import { inventoryService } from "./inventory.service";

export const registerInventoryEventHandlers = () => {
  eventBus.onEvent(INVENTORY_EVENTS.SALE_CREATED, async (payload) => {
    try {
      await inventoryService.updateInventory({
        productCode: payload.productCode,
        type: "SALE",
        quantity: payload.quantity,
        referenceId: payload.referenceId
      });
    } catch (error) {
      logger.error("Failed to process SALE_CREATED event", { error, payload });
    }
  });

  eventBus.onEvent(INVENTORY_EVENTS.PURCHASE_COMPLETED, async (payload) => {
    try {
      await inventoryService.updateInventory({
        productCode: payload.productCode,
        type: "PURCHASE",
        quantity: payload.quantity,
        referenceId: payload.referenceId
      });
    } catch (error) {
      logger.error("Failed to process PURCHASE_COMPLETED event", { error, payload });
    }
  });

  eventBus.onEvent(INVENTORY_EVENTS.WIP_STARTED, async (payload) => {
    try {
      await inventoryService.updateInventory({
        productCode: payload.productCode,
        type: "WIP_RAW",
        quantity: payload.quantity,
        referenceId: payload.referenceId
      });
    } catch (error) {
      logger.error("Failed to process WIP_STARTED event", { error, payload });
    }
  });

  eventBus.onEvent(INVENTORY_EVENTS.WIP_COMPLETED, async (payload) => {
    try {
      await inventoryService.updateInventory({
        productCode: payload.productCode,
        type: "WIP_OUTPUT",
        quantity: payload.quantity,
        referenceId: payload.referenceId
      });
    } catch (error) {
      logger.error("Failed to process WIP_COMPLETED event", { error, payload });
    }
  });
};
