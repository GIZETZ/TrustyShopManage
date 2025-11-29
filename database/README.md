
# Documentation Base de Données

## Schéma de la base de données

Voir le fichier `schema.sql` pour le schéma complet PostgreSQL.

## Commandes disponibles

### Créer la base de données
```bash
npm run db:push
```

### Sauvegarder la base de données
```bash
npm run db:backup
```
Crée un fichier JSON dans `database/backups/`

### Restaurer la base de données
```bash
# Restaurer depuis la sauvegarde la plus récente
npm run db:restore

# Restaurer depuis un fichier spécifique
npm run db:restore database/backups/backup-2025-01-29.json
```

### Export SQL
```bash
npm run db:export-sql
```
Crée un fichier SQL exécutable dans `database/backups/`

### Sauvegarde automatique
```bash
npm run db:auto-backup
```
Lance un service qui effectue une sauvegarde toutes les 24h et garde les 30 dernières.

## Structure de la table `orders`

| Colonne | Type | Description |
|---------|------|-------------|
| id | VARCHAR (UUID) | Identifiant unique |
| customer | TEXT | Nom du client |
| items | TEXT[] | Liste des articles |
| total_amount | INTEGER | Montant total (centimes) |
| paid_amount | INTEGER | Montant payé (centimes) |
| status | TEXT | Statut: paid, partial, pending |
| note | TEXT | Notes optionnelles |
| images | TEXT[] | URLs des images |
| created_at | TIMESTAMP | Date de création |

## Scénario de récupération d'urgence

### Si la base de données est complètement perdue :

1. **Provisionner une nouvelle base de données Replit**
   - Aller dans l'onglet "Database"
   - Créer une nouvelle base PostgreSQL

2. **Recréer le schéma**
   ```bash
   npm run db:push
   ```

3. **Restaurer les données**
   ```bash
   # Depuis le backup JSON le plus récent
   npm run db:restore
   
   # OU depuis un fichier SQL
   psql $DATABASE_URL < database/backups/backup-2025-01-29.sql
   ```

## Bonnes pratiques

- ✅ Effectuer une sauvegarde avant chaque déploiement majeur
- ✅ Garder les backups dans un système de contrôle de version (Git)
- ✅ Tester régulièrement la restauration
- ✅ Utiliser la sauvegarde automatique en production
