import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Order } from "@/lib/mockData";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronDown, ChevronUp, ShoppingBag, User, Calendar, AlertCircle, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrderCardProps {
  order: Order;
  onUpdate: (updatedOrder: Order) => void;
  onDelete: (orderId: string) => void;
}

export function OrderCard({ order, onUpdate, onDelete }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const percentagePaid = (order.paidAmount / order.totalAmount) * 100;
  const remaining = order.totalAmount - order.paidAmount;

  const statusColor = {
    paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    partial: "bg-amber-100 text-amber-700 border-amber-200",
    pending: "bg-rose-100 text-rose-700 border-rose-200",
  };

  const statusLabel = {
    paid: "Payé",
    partial: "Partiel",
    pending: "En attente",
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const totalAmount = Number(formData.get("totalAmount"));
    const paidAmount = Number(formData.get("paidAmount"));
    
    const updatedOrder: Order = {
      ...order,
      customer: formData.get("customer") as string,
      items: (formData.get("items") as string).split(',').map(i => i.trim()),
      totalAmount,
      paidAmount,
      status: paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
      note: formData.get("note") as string || undefined
    };

    onUpdate(updatedOrder);
    setIsEditDialogOpen(false);
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md border-border/50 bg-card group relative">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg leading-tight text-foreground">
                {order.customer}
              </h3>
              <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                <Calendar size={12} />
                {format(new Date(order.date), "d MMMM yyyy", { locale: fr })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn("font-medium px-2.5 py-0.5", statusColor[order.status])}
            >
              {statusLabel[order.status]}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="text-sm text-muted-foreground">Progression paiement</div>
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">
                {order.paidAmount.toLocaleString('fr-FR')} / {order.totalAmount.toLocaleString('fr-FR')} FCFA
              </div>
              {remaining > 0 && (
                <div className="text-xs font-semibold text-destructive mt-0.5">
                  Reste: {remaining.toLocaleString('fr-FR')} FCFA
                </div>
              )}
            </div>
          </div>
          
          <Progress value={percentagePaid} className="h-2 bg-secondary" />
          
          {order.note && (
            <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-md mt-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{order.note}</span>
            </div>
          )}
        </div>
      </div>

      <div 
        className={cn(
          "bg-muted/30 px-5 py-3 cursor-pointer flex items-center justify-between border-t border-border/50 transition-colors hover:bg-muted/50",
          isExpanded && "bg-muted/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ShoppingBag size={16} />
          <span>{order.items.length} Articles</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2" onClick={(e) => e.stopPropagation()}>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <Edit size={16} />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Modifier la commande</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Client</Label>
                    <Input id="customer" name="customer" defaultValue={order.customer} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="items">Articles (séparés par des virgules)</Label>
                    <Textarea id="items" name="items" defaultValue={order.items.join(', ')} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalAmount">Prix Total</Label>
                      <Input id="totalAmount" name="totalAmount" type="number" defaultValue={order.totalAmount} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paidAmount">Déjà Payé</Label>
                      <Input id="paidAmount" name="paidAmount" type="number" defaultValue={order.paidAmount} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Note</Label>
                    <Input id="note" name="note" defaultValue={order.note} />
                  </div>
                  <DialogFooter className="mt-6">
                    <Button type="submit" className="w-full">Mettre à jour</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(order.id)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
          <button className="text-muted-foreground">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-muted/30 px-5 pb-4 pt-1 animate-in slide-in-from-top-1 duration-200">
          <ul className="space-y-2">
            {order.items.map((item, index) => (
              <li key={index} className="text-sm text-foreground/80 flex items-start gap-2">
                <span className="block w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
