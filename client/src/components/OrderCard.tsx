import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Order } from "@/lib/mockData";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronDown, ChevronUp, ShoppingBag, User, Calendar, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md border-border/50 bg-card">
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
          <Badge 
            variant="outline" 
            className={cn("font-medium px-2.5 py-0.5", statusColor[order.status])}
          >
            {statusLabel[order.status]}
          </Badge>
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
        <button className="text-muted-foreground">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
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
