# Cours Complet : Configuration de la Base de Données

## Table des Matières
1. [Introduction](#introduction)
2. [Architecture Générale](#architecture-générale)
3. [Configuration par Fichier](#configuration-par-fichier)
4. [Variables d'Environnement](#variables-denvironnement)
5. [Connexion à la Base de Données](#connexion-à-la-base-de-données)
6. [Schéma de Données](#schéma-de-données)
7. [Gestion des Migrations](#gestion-des-migrations)
8. [Environnements de Déploiement](#environnements-de-déploiement)
9. [Scripts et Outils](#scripts-et-outils)
10. [Sécurité et Bonnes Pratiques](#sécurité-et-bonnes-pratiques)
11. [Dépannage](#dépannage)

---

## Introduction

Cette application utilise une architecture moderne de base de données basée sur **PostgreSQL** avec l'ORM **Drizzle** et la plateforme **Neon Serverless**. Ce cours explique en détail comment la connexion est configurée et gérée à travers tous les fichiers de l'application.

### Technologies Utilisées
- **Base de données** : PostgreSQL 15
- **Hébergeur** : Neon Serverless / Render
- **ORM** : Drizzle ORM
- **Driver** : @neondatabase/serverless
- **Migration** : Drizzle Kit

---

## Architecture Générale

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │───▶│   Drizzle ORM    │───▶│   PostgreSQL    │
│   (Node.js)     │    │                  │    │   (Neon)        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   server/db.ts  │    │ shared/schema.ts │    │   DATABASE_URL  │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Flux de Connexion
1. L'application démarre
2. Chargement des variables d'environnement
3. Initialisation de la connexion Neon
4. Configuration de Drizzle ORM
5. Mise à disposition des modèles de données

---

## Configuration par Fichier

### 1. `package.json` - Dépendances

```json
{
  "dependencies": {
    "@neondatabase/serverless": "^0.10.4",  // Driver Neon
    "drizzle-orm": "^0.39.1",                // ORM Drizzle
    "drizzle-zod": "^0.7.0",                 // Validation Zod
    "dotenv": "^17.2.3"                      // Variables d'environnement
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.4"                 // Outils de migration
  }
}
```

**Rôle** : Définit toutes les bibliothèques nécessaires pour la connexion et la gestion de la base de données.

---

### 2. `.env` - Variables d'Environnement Locales

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

**Important** : Ce fichier est dans `.gitignore` pour protéger les informations sensibles.

**Structure de l'URL** :
```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```

---

### 3. `drizzle.config.ts` - Configuration Drizzle

```typescript
import { defineConfig } from "drizzle-kit";

// Validation de la présence de la variable d'environnement
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",           // Dossier des migrations
  schema: "./shared/schema.ts",   // Fichier de schéma
  dialect: "postgresql",          // Type de base de données
  dbCredentials: {
    url: process.env.DATABASE_URL, // URL de connexion
  },
});
```

**Rôle** : Configure Drizzle Kit pour générer et gérer les migrations de base de données.

---

### 4. `server/db.ts` - Point d'Entrée de la Connexion

```typescript
import "dotenv/config";                    // Charge les variables d'environnement
import { drizzle } from "drizzle-orm/neon-http";  // Import Drizzle pour Neon
import { neon } from "@neondatabase/serverless";  // Client Neon
import * as schema from "../shared/schema.js";    // Import du schéma

// Validation critique de la variable d'environnement
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Création de la connexion Neon
const sql = neon(process.env.DATABASE_URL);

// Initialisation de Drizzle avec la connexion et le schéma
export const db = drizzle(sql, { schema });
```

**Explication détaillée** :

1. **`dotenv/config`** : Charge automatiquement les variables du fichier `.env`
2. **`neon()`** : Crée un client HTTP pour Neon Serverless
3. **`drizzle()`** : Initialise l'ORM avec la connexion et les modèles
4. **Export `db`** : Rend l'instance disponible pour toute l'application

---

## Variables d'Environnement

### Structure Complète

```bash
# Base de données
DATABASE_URL=postgresql://user:pass@host:5432/db

# Environnement
NODE_ENV=development

# Serveur
PORT=5000
HOST=0.0.0.0

# Session (si utilisé)
SESSION_SECRET=votre_secret_aleatoire
```

### Hiérarchie de Chargement

1. **Fichier `.env`** (priorité locale)
2. **Variables système** (production)
3. **Valeurs par défaut** (code)

---

## Connexion à la Base de Données

### Processus de Connexion

```mermaid
sequenceDiagram
    participant App as Application
    participant Env as .env
    participant Neon as Neon Serverless
    participant DB as PostgreSQL

    App->>Env: Charge DATABASE_URL
    App->>Neon: Crée client HTTP
    Neon->>DB: Établit connexion
    App->>Neon: Initialise Drizzle
    Neon->>App: Retourne instance db
```

### Types de Connexion

#### 1. **Neon Serverless (HTTP)**
```typescript
import { neon } from "@neondatabase/serverless";
const sql = neon(DATABASE_URL);
```

**Avantages** :
- Sans état (stateless)
- Auto-scaling
- Pay-per-use
- Idéal pour serverless

#### 2. **Connexion Directe (TCP)**
```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);
```

**Utilisation** : Pour connexions persistantes traditionnelles.

---

## Schéma de Données

### `shared/schema.ts` - Définition des Modèles

```typescript
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Définition de la table 'orders'
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customer: text("customer").notNull(),
  items: text("items").array().notNull(),
  totalAmount: integer("total_amount").notNull(),
  paidAmount: integer("paid_amount").notNull().default(0),
  status: text("status").notNull(),
  note: text("note"),
  images: text("images").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schémas de validation Zod
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const updateOrderSchema = insertOrderSchema.partial();

// Types TypeScript
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
```

### `database/schema.sql` - Schéma SQL Brut

```sql
-- Extension pour générer des UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  customer TEXT NOT NULL,
  items TEXT[] NOT NULL,
  total_amount INTEGER NOT NULL,
  paid_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  note TEXT,
  images TEXT[],
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
```

---

## Gestion des Migrations

### Cycle de Vie des Migrations

1. **Modification du schéma** dans `shared/schema.ts`
2. **Génération de la migration** :
   ```bash
   npx drizzle-kit generate
   ```
3. **Application de la migration** :
   ```bash
   npx drizzle-kit push
   ```

### Fichiers de Migration

Les migrations sont générées dans le dossier `./migrations/` :

```typescript
// migrations/0001_initial_schema.sql
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... colonnes
);
```

---

## Environnements de Déploiement

### 1. Développement Local

**Configuration** :
- Fichier `.env` local
- Base de données Neon de développement
- Hot-reload avec Vite

**Démarrage** :
```bash
npm run dev
```

### 2. Production (Render)

**`render.yaml`** :
```yaml
services:
  - type: web
    name: commercant-marchandise
    env: node
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: commercant-db
          property: connectionString
      - key: PORT
        value: "5000"

databases:
  - name: commercant-db
    engine: postgres
    plan: free
    version: "15"
```

**Processus de déploiement** :
1. Render crée automatiquement la base de données
2. L'URL de connexion est injectée dans `DATABASE_URL`
3. L'application se connecte automatiquement

---

## Scripts et Outils

### Scripts npm Disponibles

```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx server/index.ts",
    "build": "vite build && tsc -p tsconfig.server.json",
    "start": "cross-env NODE_ENV=production node dist/server/index.js"
  }
}
```

### Scripts de Base de Données

#### `database/backup.ts` - Sauvegarde
```typescript
export async function backupDatabase() {
  const orders = await db.select().from(ordersTable);
  const backup = {
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    data: orders
  };
  
  await fs.writeFile(
    `database/backups/backup-${new Date().toISOString().split('T')[0]}.json`,
    JSON.stringify(backup, null, 2)
  );
}
```

#### `database/restore.ts` - Restauration
```typescript
export async function restoreDatabase(backupFile: string) {
  const backup = JSON.parse(await fs.readFile(backupFile, 'utf-8'));
  
  // Vide la table
  await db.delete(ordersTable);
  
  // Insère les données
  await db.insert(ordersTable).values(backup.data);
}
```

#### `database/auto-backup.ts` - Sauvegarde Automatique
```typescript
setInterval(async () => {
  await backupDatabase();
  console.log('Sauvegarde automatique effectuée');
}, 24 * 60 * 60 * 1000); // Toutes les 24h
```

---

## Sécurité et Bonnes Pratiques

### 1. Protection des Données Sensibles

**`.gitignore`** :
```
.env
.env.local
.env.production
```

**Règles de sécurité** :
- ✅ Jamais de `DATABASE_URL` dans le code
- ✅ Utilisation de variables d'environnement
- ✅ Connexions SSL obligatoires
- ✅ Validation des entrées avec Zod

### 2. Gestion des Erreurs

**Validation au démarrage** :
```typescript
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}
```

**Gestion des erreurs de connexion** :
```typescript
try {
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });
} catch (error) {
  console.error("Database connection failed:", error);
  process.exit(1);
}
```

### 3. Optimisation des Performances

**Indexation** :
```sql
CREATE INDEX idx_orders_customer ON orders(customer);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

**Connexions poolées** (si nécessaire) :
```typescript
import { Pool } from "@neondatabase/serverless";
const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);
```

---

## Dépannage

### Problèmes Courants

#### 1. "DATABASE_URL not set"
**Cause** : Variable d'environnement manquante
**Solution** :
```bash
# Vérifier
echo $DATABASE_URL

# Créer le fichier .env
echo "DATABASE_URL=votre_url" > .env
```

#### 2. "Connection timeout"
**Cause** : Mauvaise URL ou firewall
**Solution** :
- Vérifier le format de l'URL
- Ajouter `?sslmode=require`
- Vérifier les règles réseau

#### 3. "Table doesn't exist"
**Cause** : Migration non appliquée
**Solution** :
```bash
npx drizzle-kit push
```

#### 4. "Permission denied"
**Cause** : Mauvais identifiants
**Solution** :
- Régénérer la base de données
- Mettre à jour les identifiants
- Redémarrer l'application

### Outils de Debug

```bash
# Tester la connexion
npx drizzle-kit studio

# Vérifier le schéma
npx drizzle-kit introspect

# Générer les migrations
npx drizzle-kit generate
```

---

## Conclusion

Cette architecture de base de données offre :

- **Scalabilité** : Neon Serverless s'adapte automatiquement
- **Sécurité** : Variables d'environnement et SSL
- **Maintenabilité** : Migrations automatisées avec Drizzle
- **Performance** : Indexation et connexion optimisée
- **Portabilité** : Configuration par environnement

La clé du succès est une configuration rigoureuse des variables d'environnement et une gestion proactive des migrations.

---

## Références Rapides

### Commandes Essentielles
```bash
# Développement
npm run dev

# Construction
npm run build

# Base de données
npx drizzle-kit push
npx drizzle-kit generate
npx drizzle-kit studio

# Sauvegarde
npm run db:backup
npm run db:restore
```

### Fichiers Clés
- `server/db.ts` : Connexion principale
- `shared/schema.ts` : Modèles de données
- `drizzle.config.ts` : Configuration Drizzle
- `.env` : Variables d'environnement
- `render.yaml` : Configuration production
