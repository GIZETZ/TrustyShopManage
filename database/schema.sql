
-- Schema de la base de données pour l'application de gestion des commandes

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

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Commentaires pour la documentation
COMMENT ON TABLE orders IS 'Table contenant toutes les commandes clients';
COMMENT ON COLUMN orders.id IS 'Identifiant unique de la commande';
COMMENT ON COLUMN orders.customer IS 'Nom du client';
COMMENT ON COLUMN orders.items IS 'Liste des articles commandés';
COMMENT ON COLUMN orders.total_amount IS 'Montant total de la commande en centimes';
COMMENT ON COLUMN orders.paid_amount IS 'Montant déjà payé en centimes';
COMMENT ON COLUMN orders.status IS 'Statut de la commande (paid, partial, pending)';
COMMENT ON COLUMN orders.note IS 'Notes additionnelles sur la commande';
COMMENT ON COLUMN orders.images IS 'URLs des images associées';
COMMENT ON COLUMN orders.created_at IS 'Date de création de la commande';
