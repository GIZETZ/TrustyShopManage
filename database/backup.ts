
import { db } from "../server/db";
import { orders } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

interface BackupData {
  version: string;
  timestamp: string;
  orders: any[];
}

async function backupDatabase() {
  try {
    console.log("🔄 Début de la sauvegarde de la base de données...");
    
    // Récupérer toutes les commandes
    const allOrders = await db.select().from(orders);
    
    // Créer l'objet de sauvegarde
    const backup: BackupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      orders: allOrders,
    };
    
    // Créer le dossier backups s'il n'existe pas
    const backupDir = path.join(process.cwd(), "database", "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Nom du fichier avec timestamp
    const filename = `backup-${new Date().toISOString().replace(/:/g, "-")}.json`;
    const filepath = path.join(backupDir, filename);
    
    // Écrire le fichier de sauvegarde
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), "utf-8");
    
    console.log(`✅ Sauvegarde réussie: ${filename}`);
    console.log(`📊 ${allOrders.length} commandes sauvegardées`);
    console.log(`📁 Fichier: ${filepath}`);
    
    return filepath;
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde:", error);
    throw error;
  }
}

// Exécuter la sauvegarde si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  backupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { backupDatabase };
