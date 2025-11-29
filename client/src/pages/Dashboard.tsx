import { useState } from "react";
import { mockOrders, Order } from "@/lib/mockData";
import { OrderCard } from "@/components/OrderCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, TrendingUp, Wallet, AlertCircle, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  // Summary Statistics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((acc, order) => acc + order.paidAmount, 0);
  const totalDue = orders.reduce((acc, order) => acc + (order.totalAmount - order.paidAmount), 0);

  // Filtered Orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      customer: formData.get("customer") as string,
      items: [(formData.get("item") as string)],
      totalAmount: Number(formData.get("totalAmount")),
      paidAmount: Number(formData.get("paidAmount")),
      date: new Date().toISOString(),
      status: Number(formData.get("paidAmount")) >= Number(formData.get("totalAmount")) ? 'paid' : 
              Number(formData.get("paidAmount")) > 0 ? 'partial' : 'pending',
      note: formData.get("note") as string || undefined
    };

    setOrders([newOrder, ...orders]);
    setIsNewOrderOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Section */}
      <header className="bg-card border-b border-border/50 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Wallet className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-heading font-bold text-foreground">Gestion Commerce</h1>
          </div>
          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30">
                <Plus size={18} />
                <span className="hidden sm:inline">Nouvelle Commande</span>
                <span className="sm:hidden">Ajouter</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Enregistrer une commande</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateOrder} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Client</Label>
                  <Input id="customer" name="customer" placeholder="Nom du client" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item">Article(s)</Label>
                  <Input id="item" name="item" placeholder="Ex: 1 Pull Noir" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">Prix Total</Label>
                    <Input id="totalAmount" name="totalAmount" type="number" placeholder="0" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paidAmount">Avance / Payé</Label>
                    <Input id="paidAmount" name="paidAmount" type="number" placeholder="0" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Note (Optionnel)</Label>
                  <Input id="note" name="note" placeholder="Ex: Reste à payer..." />
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" className="w-full">Enregistrer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-transparent border-emerald-100 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Recettes Totales</p>
                <p className="text-2xl font-bold text-emerald-700">{totalRevenue.toLocaleString('fr-FR')} FCFA</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-transparent border-rose-100 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Reste à Percevoir</p>
                <p className="text-2xl font-bold text-rose-700">{totalDue.toLocaleString('fr-FR')} FCFA</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-transparent border-blue-100 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Commandes</p>
                <p className="text-2xl font-bold text-blue-700">{totalOrders}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center sticky top-20 z-10 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un client ou un article..." 
              className="pl-10 bg-card border-muted-foreground/20 focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
             <Button 
                variant={statusFilter === 'all' ? 'default' : 'outline'} 
                onClick={() => setStatusFilter('all')}
                size="sm"
                className="rounded-full"
              >
                Tout
              </Button>
              <Button 
                variant={statusFilter === 'pending' ? 'default' : 'outline'} 
                onClick={() => setStatusFilter('pending')}
                size="sm"
                className="rounded-full"
              >
                En attente
              </Button>
              <Button 
                variant={statusFilter === 'partial' ? 'default' : 'outline'} 
                onClick={() => setStatusFilter('partial')}
                size="sm"
                className="rounded-full"
              >
                Partiel
              </Button>
              <Button 
                variant={statusFilter === 'paid' ? 'default' : 'outline'} 
                onClick={() => setStatusFilter('paid')}
                size="sm"
                className="rounded-full"
              >
                Soldé
              </Button>
          </div>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onUpdate={(updatedOrder) => {
                  setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
                }}
                onDelete={(orderId) => {
                  if(confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
                    setOrders(orders.filter(o => o.id !== orderId));
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground bg-card/50 rounded-xl border border-dashed border-border">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter size={24} className="opacity-50" />
            </div>
            <p className="text-lg font-medium">Aucune commande trouvée</p>
            <p className="text-sm">Essayez de modifier vos filtres de recherche.</p>
          </div>
        )}
      </main>
    </div>
  );
}
