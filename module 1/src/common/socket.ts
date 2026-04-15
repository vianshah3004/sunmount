import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { logger } from "./logger";

let io: Server | null = null;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {
    logger.info("Client connected", { socketId: socket.id });

    socket.on("disconnect", () => {
      logger.info("Client disconnected", { socketId: socket.id });
    });
  });

  return io;
};

const emitIfReady = (eventName: string, payload: unknown) => {
  if (!io) {
    logger.warn("Socket server not initialized yet", { eventName, payload });
    return;
  }

  io.emit(eventName, payload);
};

export const emitInventoryUpdate = (payload: {
  productCode: string;
  newQuantity: number;
}) => {
  emitIfReady("inventory:update", payload);
};

export const emitLowStock = (payload: {
  productCode: string;
  quantity: number;
  lowStockThreshold: number;
}) => {
  emitIfReady("low_stock", payload);
};

export const emitOrderUpdate = (payload: {
  orderId: string;
  type: "SALE" | "PURCHASE";
  status: string;
}) => {
  emitIfReady("order:update", payload);
};

export const emitOrderCreated = (payload: {
  orderId: string;
  type: "SALE" | "PURCHASE";
  status: string;
  orderNumber: string;
}) => {
  emitIfReady("order:created", payload);
};

export const emitOrderStatusChanged = (payload: {
  orderId: string;
  type: "SALE" | "PURCHASE";
  fromStatus: string;
  toStatus: string;
}) => {
  emitIfReady("order:statusChanged", payload);
};

export const emitManufacturingUpdate = (payload: {
  batchNumber: string;
  status: string;
}) => {
  emitIfReady("manufacturing:update", payload);
};
