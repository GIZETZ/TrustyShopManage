import * as schema from "../shared/schema.js";
import { db } from "./db.js";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Orders
  getAllOrders(): Promise<schema.Order[]>;
  getOrder(id: string): Promise<schema.Order | undefined>;
  createOrder(order: schema.InsertOrder): Promise<schema.Order>;
  updateOrder(id: string, order: Partial<schema.InsertOrder>): Promise<schema.Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Orders
  async getAllOrders(): Promise<schema.Order[]> {
    return db.select().from(schema.orders).orderBy(schema.orders.createdAt);
  }

  async getOrder(id: string): Promise<schema.Order | undefined> {
    const result = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return result[0];
  }

  async createOrder(insertOrder: schema.InsertOrder): Promise<schema.Order> {
    const result = await db.insert(schema.orders).values(insertOrder).returning();
    return result[0];
  }

  async updateOrder(id: string, updateData: Partial<schema.InsertOrder>): Promise<schema.Order | undefined> {
    const result = await db
      .update(schema.orders)
      .set(updateData)
      .where(eq(schema.orders.id, id))
      .returning();
    return result[0];
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await db.delete(schema.orders).where(eq(schema.orders.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
