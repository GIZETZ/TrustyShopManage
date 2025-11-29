
import { db } from "../server/db";
import { orders } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

async function exportToSQL() {
  try {
    console.log("🔄 Export en SQL...");
    
    const allOrders = await db.select().from(orders);
    
    let sql = `-- Export de la base de données
-- Date: ${new Date().toISOString()}
-- Nombre de commandes: ${allOrders.length}

-- Nettoyage
TRUNCATE TABLE orders CASCADE;

-- Insertion des données
`;
    
    for (const order of allOrders) {
      const items = `ARRAY[${order.items.map(i => `'${i.replace(/'/g, "''")}'`).join(", ")}]`;
      const images = order.images 
        ? `ARRAY[${order.images.map(i => `'${i.replace(/'/g, "''")}'`).join(", ")}]`
        : "NULL";
      const note = order.note ? `'${order.note.replace(/'/g, "''")}'` : "NULL";
      
      sql += `INSERT INTO orders (id, customer, items, total_amount, paid_amount, status, note, images, created_at) VALUES (
  '${order.id}',
  '${order.customer.replace(/'/g, "''")}',
  ${items},
  ${order.totalAmount},
  ${order.paidAmount},
  '${order.status}',
  ${note},
  ${images},
  '${order.createdAt.toISOString()}'
);\n\n`;
    }
    
    const backupDir = path.join(process.cwd(), "database", "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const filename = `backup-${new Date().toISOString().replace(/:/g, "-")}.sql`;
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, sql, "utf-8");
    
    console.log(`✅ Export SQL réussi: ${filename}`);
    console.log(`📁 Fichier: ${filepath}`);
    
    return filepath;
  } catch (error) {
    console.error("❌ Erreur lors de l'export SQL:", error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  exportToSQL()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { exportToSQL };
