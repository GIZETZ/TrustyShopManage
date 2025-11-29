
import { backupDatabase } from "./backup";
import * as fs from "fs";
import * as path from "path";

// Nettoyer les anciennes sauvegardes (garder les 30 dernières)
function cleanOldBackups() {
  const backupDir = path.join(process.cwd(), "database", "backups");
  
  if (!fs.existsSync(backupDir)) {
    return;
  }
  
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith("backup-") && f.endsWith(".json"))
    .map(f => ({
      name: f,
      path: path.join(backupDir, f),
      time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  
  // Garder seulement les 30 plus récentes
  const toDelete = files.slice(30);
  
  toDelete.forEach(file => {
    fs.unlinkSync(file.path);
    console.log(`🗑️  Ancienne sauvegarde supprimée: ${file.name}`);
  });
}

async function autoBackup() {
  console.log("\n🤖 Sauvegarde automatique démarrée");
  console.log(`📅 ${new Date().toLocaleString()}\n`);
  
  try {
    await backupDatabase();
    cleanOldBackups();
    console.log("\n✅ Sauvegarde automatique terminée\n");
  } catch (error) {
    console.error("\n❌ Échec de la sauvegarde automatique\n");
  }
}

// Exécuter une sauvegarde immédiatement
autoBackup();

// Puis toutes les 24 heures
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
setInterval(autoBackup, TWENTY_FOUR_HOURS);

console.log("🤖 Service de sauvegarde automatique actif");
console.log("📅 Prochaine sauvegarde dans 24 heures");
