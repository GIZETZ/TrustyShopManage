
import { db } from "../server/db";
import { orders } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

interface BackupData {
  version: string;
  timestamp: string;
  orders: any[];
}

async function restoreDatabase(backupFile?: string) {
  try {
    console.log("🔄 Début de la restauration de la base de données...");
    
    let filepath: string;
    
    if (backupFile) {
      // Utiliser le fichier spécifié
      filepath = backupFile;
    } else {
      // Trouver le fichier de sauvegarde le plus récent
      const backupDir = path.join(process.cwd(), "database", "backups");
      
      if (!fs.existsSync(backupDir)) {
        throw new Error("Aucun dossier de sauvegarde trouvé");
      }
      
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith("backup-") && f.endsWith(".json"))
        .sort()
        .reverse();
      
      if (files.length === 0) {
        throw new Error("Aucun fichier de sauvegarde trouvé");
      }
      
      filepath = path.join(backupDir, files[0]);
      console.log(`📁 Utilisation de la sauvegarde: ${files[0]}`);
    }
    
    // Lire le fichier de sauvegarde
    const backupContent = fs.readFileSync(filepath, "utf-8");
    const backup: BackupData = JSON.parse(backupContent);
    
    console.log(`📅 Sauvegarde du: ${backup.timestamp}`);
    console.log(`📊 ${backup.orders.length} commandes à restaurer`);
    
    // Demander confirmation en mode interactif
    if (process.stdin.isTTY) {
      console.log("\n⚠️  ATTENTION: Cette opération va SUPPRIMER toutes les données actuelles!");
      console.log("Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes...\n");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Supprimer toutes les commandes existantes
    await db.delete(orders);
    console.log("🗑️  Données actuelles supprimées");
    
    // Restaurer les commandes
    if (backup.orders.length > 0) {
      await db.insert(orders).values(backup.orders);
      console.log(`✅ ${backup.orders.length} commandes restaurées`);
    }
    
    console.log("✅ Restauration terminée avec succès!");
    
  } catch (error) {
    console.error("❌ Erreur lors de la restauration:", error);
    throw error;
  }
}

// Exécuter la restauration si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const backupFile = process.argv[2];
  restoreDatabase(backupFile)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { restoreDatabase };
