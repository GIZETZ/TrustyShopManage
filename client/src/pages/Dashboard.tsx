import { useState } from "react";
import { OrderCard } from "@/components/OrderCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchOrders, createOrder, updateOrder, deleteOrder, uploadImages, type Order, type CreateOrderData } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, TrendingUp, Wallet, AlertCircle, Filter, Check, Upload, X, ArrowUpDown, Download, FileText, Table } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [openSortPopover, setOpenSortPopover] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [orderItems, setOrderItems] = useState<string[]>([""]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportMonth, setExportMonth] = useState<string>("");
  const [exportYear, setExportYear] = useState<string>(new Date().getFullYear().toString());
  const [exportFormat, setExportFormat] = useState<string>("csv");

  // Sort options
  const sortOptions = [
    { value: "date-desc", label: "Date (plus récent)" },
    { value: "date-asc", label: "Date (plus ancien)" },
    { value: "customer-asc", label: "Client (A-Z)" },
    { value: "customer-desc", label: "Client (Z-A)" },
    { value: "amount-desc", label: "Montant (décroissant)" },
    { value: "amount-asc", label: "Montant (croissant)" },
    { value: "status", label: "Statut" }
  ];

  // Fetch orders from API
  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    retry: 2,
    retryDelay: 500,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Handle errors separately
  useEffect(() => {
    if (error) {
      console.error('Error fetching orders:', error);
      toast.error("Erreur lors du chargement des commandes");
    }
  }, [error]);

  // Function to refresh data
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-destructive text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold">Erreur de chargement</h2>
          <p className="text-muted-foreground mb-4">Impossible de charger les commandes</p>
          <Button onClick={() => refetch()} className="gap-2">
            <span>🔄</span>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Export functions
  const exportToCSV = (ordersToExport: Order[]) => {
    const headers = ['Date', 'Client', 'Articles', 'Montant Total', 'Montant Payé', 'Reste à Payer', 'Statut', 'Note'];
    
    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    
    const csvContent = [
      headers.join(';'), // Use semicolon as delimiter (Excel standard for French)
      ...ordersToExport.map(order => [
        new Date(order.createdAt).toLocaleDateString('fr-FR'),
        `"${order.customer.replace(/"/g, '""')}"`,
        `"${order.items.join(' | ').replace(/"/g, '""')}"`, // Use | as separator for items
        order.totalAmount.toString().replace('.', ','), // Use comma for decimal
        order.paidAmount.toString().replace('.', ','), // Use comma for decimal
        (order.totalAmount - order.paidAmount).toString().replace('.', ','), // Use comma for decimal
        order.status === 'paid' ? 'Payée' : order.status === 'partial' ? 'Partielle' : 'En attente',
        `"${(order.note || '').replace(/"/g, '""')}"`
      ].join(';'))
    ].join('\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes_${exportMonth}_${exportYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (ordersToExport: Order[]) => {
    const exportData = {
      periode: `${exportMonth} ${exportYear}`,
      date_export: new Date().toISOString(),
      total_commandes: ordersToExport.length,
      total_revenu: ordersToExport.reduce((sum, order) => sum + order.paidAmount, 0),
      total_dette: ordersToExport.reduce((sum, order) => sum + (order.totalAmount - order.paidAmount), 0),
      commandes: ordersToExport.map(order => ({
        id: order.id,
        date: order.createdAt,
        client: order.customer,
        articles: order.items,
        montant_total: order.totalAmount,
        montant_paye: order.paidAmount,
        reste_a_payer: order.totalAmount - order.paidAmount,
        statut: order.status,
        note: order.note,
        images: order.images
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes_${exportMonth}_${exportYear}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    if (!exportMonth || !exportYear) {
      toast.error("Veuillez sélectionner un mois et une année");
      return;
    }

    // Filter orders for selected month and year
    const ordersToExport = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() + 1 === parseInt(exportMonth) && 
             orderDate.getFullYear() === parseInt(exportYear);
    });

    if (ordersToExport.length === 0) {
      toast.error("Aucune commande trouvée pour cette période");
      return;
    }

    if (exportFormat === 'csv') {
      exportToCSV(ordersToExport);
    } else if (exportFormat === 'json') {
      exportToJSON(ordersToExport);
    }

    toast.success(`${ordersToExport.length} commandes exportées avec succès !`);
    setIsExportOpen(false);
  };

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      // Refresh data and show notification
      refreshData();
      setIsNewOrderOpen(false);
      setSelectedCustomer("");
      setSelectedImageFiles([]);
      setOrderItems([""]);
      toast.success("Commande créée avec succès !");
    },
    onError: () => {
      toast.error("Erreur lors de la création de la commande");
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateOrderData> }) => 
      updateOrder(id, data),
    onSuccess: () => {
      refreshData();
      toast.success("Commande modifiée avec succès !");
    },
    onError: () => {
      toast.error("Erreur lors de la modification");
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      refreshData();
      toast.success("Commande supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  // Summary Statistics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((acc, order) => acc + order.paidAmount, 0);
  const totalDue = orders.reduce((acc, order) => acc + (order.totalAmount - order.paidAmount), 0);

  // Get unique customers for autocomplete
  const customers = Array.from(new Set(orders.map(order => order.customer))).sort();

  // Filtered Orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sorted Orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "date-asc":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "customer-asc":
        return a.customer.localeCompare(b.customer);
      case "customer-desc":
        return b.customer.localeCompare(a.customer);
      case "amount-desc":
        return b.totalAmount - a.totalAmount;
      case "amount-asc":
        return a.totalAmount - b.totalAmount;
      case "status":
        const statusOrder: Record<string, number> = { pending: 0, partial: 1, paid: 2 };
        return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
      default:
        return 0;
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedImageFiles([...selectedImageFiles, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImageFiles(selectedImageFiles.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const customerName = selectedCustomer || (formData.get("customer_manual") as string);
    if (!customerName) return; 
    
    const validItems = orderItems.filter(i => i.trim() !== "");
    if (validItems.length === 0) return;

    const totalAmount = Number(formData.get("totalAmount"));
    const paidAmount = Number(formData.get("paidAmount"));

    // Upload images first if any
    let uploadedImageUrls: string[] = [];
    if (selectedImageFiles.length > 0) {
      try {
        uploadedImageUrls = await uploadImages(selectedImageFiles);
      } catch (error) {
        toast.error("Erreur lors du téléversement des images");
        return;
      }
    }

    const orderData: CreateOrderData = {
      customer: customerName,
      items: validItems,
      totalAmount,
      paidAmount,
      status: paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
      note: formData.get("note") as string || undefined,
      images: uploadedImageUrls
    };

    await createOrderMutation.mutateAsync(orderData);
    setIsNewOrderOpen(false);
    setSelectedCustomer("");
    setSelectedImageFiles([]);
    setOrderItems([""]);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, ""]);
  };

  const updateOrderItem = (index: number, value: string) => {
    const newItems = [...orderItems];
    newItems[index] = value;
    setOrderItems(newItems);
  };

  const removeOrderItem = (index: number) => {
    if (orderItems.length === 1) {
      setOrderItems([""]);
      return;
    }
    const newItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(newItems);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Section */}
      <header className="bg-card border-b border-border/50 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <img src="/icon-50.png" />
            </div>
            <h1 className="text-xl font-heading font-bold text-foreground">TrustyShop</h1>
          </div>
          <div className="flex gap-2">
            <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download size={18} />
                  <span className="hidden sm:inline">Exporter</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Exporter les commandes</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Mois</Label>
                    <Select value={exportMonth} onValueChange={setExportMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un mois" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Janvier</SelectItem>
                        <SelectItem value="2">Février</SelectItem>
                        <SelectItem value="3">Mars</SelectItem>
                        <SelectItem value="4">Avril</SelectItem>
                        <SelectItem value="5">Mai</SelectItem>
                        <SelectItem value="6">Juin</SelectItem>
                        <SelectItem value="7">Juillet</SelectItem>
                        <SelectItem value="8">Août</SelectItem>
                        <SelectItem value="9">Septembre</SelectItem>
                        <SelectItem value="10">Octobre</SelectItem>
                        <SelectItem value="11">Novembre</SelectItem>
                        <SelectItem value="12">Décembre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Année</Label>
                    <Select value={exportYear} onValueChange={setExportYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une année" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return <SelectItem key={year} value={year.toString()}>{year}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Format d'export</Label>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">
                          <div className="flex items-center gap-2">
                            <Table size={16} />
                            <span>CSV (Excel)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="json">
                          <div className="flex items-center gap-2">
                            <FileText size={16} />
                            <span>JSON</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsExportOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="button" onClick={handleExport}>
                      <Download size={16} className="mr-2" />
                      Exporter
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30">
                  <Plus size={18} />
                  <span className="hidden sm:inline">Nouvelle Commande</span>
                  <span className="sm:hidden">Ajouter</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] overflow-visible">
              <DialogHeader>
                <DialogTitle>Enregistrer une commande</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateOrder} className="space-y-4 mt-4">
                <div className="space-y-2 flex flex-col">
                  <Label>Client</Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between font-normal"
                      >
                        {selectedCustomer
                          ? selectedCustomer
                          : "Sélectionner ou saisir un client..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput placeholder="Rechercher un client..." />
                        <CommandList>
                          <CommandEmpty>
                             <div className="p-2 text-sm text-muted-foreground">
                               Appuyez sur Entrée pour ajouter ce nouveau client.
                             </div>
                             {/* In a real app, we'd handle "create new" explicitly here, 
                                 but for now let's just let them pick existing or type in a separate input if needed,
                                 or we can just pretend the combobox input is the value. 
                                 
                                 Actually, Shadcn's Command component is strict about list items.
                                 Let's add a manual input fallback if they don't find it in list.
                             */}
                          </CommandEmpty>
                          <CommandGroup>
                            {customers.map((customer) => (
                              <CommandItem
                                key={customer}
                                value={customer}
                                onSelect={(currentValue) => {
                                  setSelectedCustomer(currentValue === selectedCustomer ? "" : currentValue);
                                  setOpenCombobox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCustomer === customer ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {customer}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {/* Fallback input for new customers if not in list (simplified for UX) */}
                  {!customers.includes(selectedCustomer) && (
                     <Input 
                       name="customer_manual" 
                       placeholder="Ou saisissez un nouveau nom..." 
                       value={selectedCustomer}
                       onChange={(e) => setSelectedCustomer(e.target.value)}
                       className={cn(selectedCustomer && customers.includes(selectedCustomer) ? "hidden" : "block")}
                     />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Article(s)</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={addOrderItem} className="h-6 px-2 text-primary hover:text-primary hover:bg-primary/10">
                      <Plus size={14} className="mr-1" /> Ajouter
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {orderItems.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input 
                          value={item} 
                          onChange={(e) => updateOrderItem(index, e.target.value)}
                          placeholder={`Article ${index + 1} (Ex: 1 Pull Noir)`} 
                          required={index === 0}
                        />
                        {orderItems.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeOrderItem(index)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X size={18} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
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

                <div className="space-y-2">
                  <Label>Photos (Optionnel)</Label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {selectedImageFiles.map((file, idx) => (
                      <div key={idx} className="relative aspect-square bg-muted rounded-md overflow-hidden border border-border">
                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-destructive transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-md hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer text-muted-foreground hover:text-primary">
                      <Upload size={20} className="mb-1" />
                      <span className="text-[10px] font-medium">Ajouter</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button type="submit" className="w-full">Enregistrer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
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
            {/* Sort Button */}
            <Popover open={openSortPopover} onOpenChange={setOpenSortPopover}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
                  <ArrowUpDown size={16} />
                  Trier
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="end">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {sortOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={(currentValue: string) => {
                            setSortBy(currentValue === sortBy ? "" : currentValue);
                            setOpenSortPopover(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              sortBy === option.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
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
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Chargement des commandes...</p>
          </div>
        ) : sortedOrders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sortedOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onUpdate={(updatedOrder) => {
                  updateOrderMutation.mutate({ 
                    id: order.id, 
                    data: {
                      customer: updatedOrder.customer,
                      items: updatedOrder.items,
                      totalAmount: updatedOrder.totalAmount,
                      paidAmount: updatedOrder.paidAmount,
                      status: updatedOrder.status,
                      note: updatedOrder.note,
                      images: updatedOrder.images
                    }
                  });
                }}
                onDelete={(orderId) => {
                  if(confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
                    deleteOrderMutation.mutate(orderId);
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
