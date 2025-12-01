import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { fromZodError } from "zod-validation-error";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import broadcastUpdate from main server file
let broadcastUpdate: (type: string, data: any) => void;

export function setBroadcastUpdate(fn: (type: string, data: any) => void) {
  broadcastUpdate = fn;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Get single order
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // Create order
  app.post("/api/orders", async (req, res) => {
    try {
      const validation = schema.insertOrderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: fromZodError(validation.error).message 
        });
      }

      const order = await storage.createOrder(validation.data);
      
      // Broadcast update to all connected clients
      if (broadcastUpdate) {
        broadcastUpdate('order_created', order);
      }
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Update order
  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const validation = schema.updateOrderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: fromZodError(validation.error).message 
        });
      }

      const order = await storage.updateOrder(req.params.id, validation.data);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Broadcast update to all connected clients
      if (broadcastUpdate) {
        broadcastUpdate('order_updated', order);
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Delete order
  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const success = await storage.deleteOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Broadcast update to all connected clients
      if (broadcastUpdate) {
        broadcastUpdate('order_deleted', { id: req.params.id });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // Upload image
  app.post("/api/upload", async (req, res) => {
    try {
      const contentLength = req.headers['content-length'];
      const contentType = req.headers['content-type'];
      
      if (!contentLength || !contentType || !contentType.startsWith('multipart/form-data')) {
        return res.status(400).json({ error: "Invalid multipart form data" });
      }

      // Parse multipart data manually
      const chunks: Buffer[] = [];
      let boundary = contentType.split('boundary=')[1];
      
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      
      const data = Buffer.concat(chunks);
      
      // Simple parsing to extract image data
      const boundaryMarker = `--${boundary}`;
      const parts = data.toString().split(boundaryMarker);
      
      let imageData: Buffer | null = null;
      let filename = '';
      
      for (const part of parts) {
        if (part.includes('Content-Disposition: form-data') && part.includes('name="image"')) {
          const filenameMatch = part.match(/filename="([^"]+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
          
          // Extract image data between headers and boundary
          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd !== -1) {
            const imageDataStart = headerEnd + 4;
            const imageDataEnd = part.lastIndexOf('\r\n');
            if (imageDataEnd > imageDataStart) {
              imageData = Buffer.from(part.slice(imageDataStart, imageDataEnd), 'binary');
            }
          }
          break;
        }
      }
      
      if (!imageData) {
        return res.status(400).json({ error: "No image data found" });
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = filename.split('.').pop() || 'jpg';
      const uniqueFilename = `${timestamp}_${randomString}.${extension}`;
      
      // Save file
      const filePath = path.join(uploadsDir, uniqueFilename);
      fs.writeFileSync(filePath, imageData);
      
      // Return public URL
      const imageUrl = `/uploads/${uniqueFilename}`;
      res.json({ url: imageUrl });
      
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  return httpServer;
}
