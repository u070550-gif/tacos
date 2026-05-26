import React, { useState } from 'react';
import { MenuItem, Ingredient, AuthorizedUser, Order, AuthRequest } from '../types';
import { 
  Users, ShoppingBag, ClipboardList, PenTool, Plus, Trash2, 
  Check, X, TrendingUp, DollarSign, Leaf, RefreshCw, Layers,
  Bell, AlertTriangle
} from 'lucide-react';
import MathAnalytics from './MathAnalytics';

interface AdminPanelProps {
  menu: MenuItem[];
  setMenu: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  authorizedUsers: AuthorizedUser[];
  setAuthorizedUsers: React.Dispatch<React.SetStateAction<AuthorizedUser[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  authRequests: AuthRequest[];
  setAuthRequests: React.Dispatch<React.SetStateAction<AuthRequest[]>>;
}

export default function AdminPanel({
  menu,
  setMenu,
  ingredients,
  setIngredients,
  authorizedUsers,
  setAuthorizedUsers,
  orders,
  setOrders,
  authRequests,
  setAuthRequests
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'inventory' | 'users' | 'requests' | 'math'>('orders');

  // Active user-triggered cancellation alarm state
  const [dismissedAlarms, setDismissedAlarms] = useState<string[]>(() => {
    const saved = localStorage.getItem('taqueria_dismissed_cancellation_alarms');
    return saved ? JSON.parse(saved) : [];
  });

  const clientCancellations = React.useMemo(() => {
    return orders.filter(o => o.status === 'cancelled' && o.cancelledBy === 'usuario');
  }, [orders]);

  const activeAlarms = React.useMemo(() => {
    return clientCancellations.filter(o => !dismissedAlarms.includes(o.id));
  }, [clientCancellations, dismissedAlarms]);

  const handleDismissAlarm = (orderId: string) => {
    const updated = [...dismissedAlarms, orderId];
    setDismissedAlarms(updated);
    localStorage.setItem('taqueria_dismissed_cancellation_alarms', JSON.stringify(updated));
  };

  // Input states for adding new menu items
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuCategory, setNewMenuCategory] = useState<'taco' | 'bebida'>('taco');
  const [newMenuPrice, setNewMenuPrice] = useState('');
  const [newMenuDesc, setNewMenuDesc] = useState('');

  // Input states for adding new authorized users
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');

  // Edit price states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');

  // Handle addition of authorized customer email
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserName.trim()) return;

    // Check if user already exists
    if (authorizedUsers.some(u => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
      alert('Este correo ya está autorizado.');
      return;
    }

    const newUser: AuthorizedUser = {
      email: newUserEmail.toLowerCase().trim(),
      name: newUserName.trim(),
      registeredAt: new Date().toISOString()
    };

    setAuthorizedUsers(prev => [newUser, ...prev]);
    setNewUserEmail('');
    setNewUserName('');
  };

  // Delete authorized user
  const handleDeleteUser = (email: string) => {
    if (confirm(`¿Estás seguro de quitar la autorización para ${email}?`)) {
      setAuthorizedUsers(prev => prev.filter(u => u.email !== email));
    }
  };

  // Add item to menu
  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName.trim() || !newMenuPrice) return;

    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      name: newMenuName.trim(),
      category: newMenuCategory,
      price: parseFloat(newMenuPrice),
      description: newMenuDesc.trim()
    };

    setMenu(prev => [...prev, newItem]);
    setNewMenuName('');
    setNewMenuPrice('');
    setNewMenuDesc('');
    alert('¡Elemento agregado al menú exitosamente!');
  };

  // Start editing menu item price
  const startEditPrice = (item: MenuItem) => {
    setEditingItemId(item.id);
    setEditingPriceValue(item.price.toString());
  };

  // Save modified price
  const savePriceEdit = (itemId: string) => {
    const val = parseFloat(editingPriceValue);
    if (isNaN(val) || val <= 0) {
      alert('Por favor introduce un precio válido mayor a 0');
      return;
    }
    setMenu(prev => prev.map(item => item.id === itemId ? { ...item, price: val } : item));
    setEditingItemId(null);
  };

  // Delete menu item
  const handleDeleteMenuItem = (itemId: string) => {
    if (confirm('¿Estás seguro de eliminar este platillo del menú?')) {
      setMenu(prev => prev.filter(item => item.id !== itemId));
    }
  };

  // Handle direct ingredient adjustment
  const handleUpdateIngredientStock = (ingredientId: string, delta: number) => {
    setIngredients(prev => prev.map(ing => {
      if (ing.id === ingredientId) {
        const newQty = Math.max(0, ing.quantity + delta);
        return { ...ing, quantity: newQty };
      }
      return ing;
    }));
  };

  // Force Change Status of an order
  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status, cancelledBy: status === 'cancelled' ? 'admin' : undefined } 
        : order
    ));
  };

  // Handle Approving Authorization Request from Cuenta Principal
  const handleResolveRequest = (request: AuthRequest, approve: boolean) => {
    setAuthRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: approve ? 'approved' : 'rejected' } : r));

    if (approve) {
      if (request.type === 'price_change') {
        const { itemId, newPrice } = request.payload;
        setMenu(prev => prev.map(item => item.id === itemId ? { ...item, price: newPrice } : item));
        alert(`Solicitud aprobada: Se actualizó el precio en el menú.`);
      } else if (request.type === 'inventory_restock') {
        const { ingredientId, restockAmount } = request.payload;
        setIngredients(prev => prev.map(ing => ing.id === ingredientId ? { ...ing, quantity: ing.quantity + restockAmount } : ing));
        alert(`Solicitud aprobada: Se reabasteció el ingrediente.`);
      } else if (request.type === 'menu_add') {
        const { newItem } = request.payload;
        setMenu(prev => [...prev, newItem]);
        alert(`Solicitud aprobada: Se agregó "${newItem.name}" al menú de la taquería.`);
      }
    } else {
      alert('La solicitud ha sido rechazada.');
    }
  };

  // Calculate high-level metrics for top dashboard cards
  const metrics = React.useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const totalSales = activeOrders.reduce((acc, current) => acc + current.total, 0);
    const lowStockIngredientsCount = ingredients.filter(i => i.quantity <= i.minLimit).length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;

    return {
      totalSales,
      lowStockIngredientsCount,
      completedOrders,
      activeOrdersCount: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length
    };
  }, [orders, ingredients]);

  return (
    <div className="space-y-6">
      
      {/* Top metrics dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">Ventas Totales</span>
            <p className="text-xl font-black text-slate-900 font-mono mt-0.5">${metrics.totalSales.toFixed(2)}</p>
          </div>
          <div className="p-2 bg-green-50 text-green-700 border border-green-200 rounded">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">Pedidos Activos</span>
            <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{metrics.activeOrdersCount}</p>
          </div>
          <div className="p-2 bg-yellow-50 text-amber-700 border border-yellow-200 rounded">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">Bajo Stock</span>
            <p className="text-xl font-black text-red-650 font-mono mt-0.5">{metrics.lowStockIngredientsCount} insumos</p>
          </div>
          <div className="p-2 bg-red-50 text-red-650 border border-red-200 rounded">
            <Leaf className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">Pedidos Entregados</span>
            <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{metrics.completedOrders}</p>
          </div>
          <div className="p-2 bg-cyan-50 text-cyan-705 text-cyan-700 border border-cyan-200 rounded">
            <Check className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Cancellation Alerts Notification Tray */}
      {activeAlarms.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-650 p-4 rounded-r-lg shadow-sm space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-650 bg-red-600"></span>
              </span>
              <h4 className="text-xs font-black text-red-950 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Bell className="w-4 h-4 text-red-600 animate-bounce" />
                Notificación: Pedidos Cancelados por Clientes ({activeAlarms.length})
              </h4>
            </div>
            <button
              onClick={() => {
                const allIds = activeAlarms.map(o => o.id);
                const updated = [...dismissedAlarms, ...allIds];
                setDismissedAlarms(updated);
                localStorage.setItem('taqueria_dismissed_cancellation_alarms', JSON.stringify(updated));
              }}
              className="text-[9px] bg-red-100 hover:bg-red-200 text-red-900 border border-red-200 font-bold px-2 py-1 rounded transition-all cursor-pointer uppercase"
            >
              Silenciar Todos
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-1">
            {activeAlarms.map(o => (
              <div key={o.id} className="bg-white border border-red-100 p-2.5 rounded-lg flex items-center justify-between gap-3 shadow-xs">
                <div className="text-[11px] space-y-0.5 min-w-0">
                  <p className="font-mono font-bold text-red-900 truncate">
                    Pedido <span className="underline">{o.id}</span> - {o.customerEmail.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono italic truncate">
                    Para: {o.address || 'Domicilio'}
                  </p>
                  <p className="text-[10px] text-slate-700 font-semibold">
                    Total: ${o.total.toFixed(2)} ({o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')})
                  </p>
                </div>
                <button
                  onClick={() => handleDismissAlarm(o.id)}
                  className="text-[10px] bg-red-50 hover:bg-red-600 hover:text-white text-red-700 font-bold px-2.5 py-1.5 rounded transition-all border border-red-100 hover:border-red-600 cursor-pointer flex-shrink-0"
                >
                  Enterado ✓
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation tabs for Admin */}
      <div className="flex overflow-x-auto bg-slate-200 p-1 rounded-lg border border-slate-300 whitespace-nowrap gap-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded transition-all uppercase tracking-tight ${
            activeTab === 'orders' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-red-700 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Pedidos e Historial
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`relative flex items-center gap-2 px-4 py-2 text-xs font-bold rounded transition-all uppercase tracking-tight ${
            activeTab === 'requests' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-red-700 hover:bg-slate-100'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Solicitudes de Personal
          {authRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-650 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">
              {authRequests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded transition-all uppercase tracking-tight ${
            activeTab === 'menu' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-red-700 hover:bg-slate-100'
          }`}
        >
          <PenTool className="w-4 h-4" />
          Gestión del Menú
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded transition-all uppercase tracking-tight ${
            activeTab === 'inventory' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-red-700 hover:bg-slate-100'
          }`}
        >
          <Leaf className="w-4 h-4" />
          Inventario
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded transition-all uppercase tracking-tight ${
            activeTab === 'users' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-red-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Clientes Autorizados
        </button>
        <button
          onClick={() => setActiveTab('math')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded transition-all uppercase tracking-tight ${
            activeTab === 'math' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-red-700 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Matemáticas Avanzadas
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs text-slate-800">
        
        {/* Tab 1: Orders list & statuses */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Consola de Control de Ventas</h3>
              <p className="text-xs text-slate-500 font-mono">Admin: Control Máximo sin PIN</p>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                No hay ningún pedido registrado en la taquería.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-slate-900 rounded-lg p-5 border border-slate-700 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-bold text-amber-400 font-mono">{order.id}</span>
                        <span className="text-xs text-slate-400 font-mono">{new Date(order.createdAt).toLocaleTimeString()}</span>
                        <span className="text-xs text-slate-300 font-mono font-semibold bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                          {order.customerEmail}
                        </span>
                        {order.delivery ? (
                          <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono font-bold">
                            🛵 A Domicilio
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                            🏪 Para Recoger
                          </span>
                        )}
                        
                        {/* Status tag */}
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          order.status === 'pending' ? 'bg-amber-500 text-slate-950 text-xs' :
                          order.status === 'preparing' ? 'bg-cyan-500 text-slate-950 font-bold' :
                          order.status === 'in_route' ? 'bg-indigo-500 text-white' :
                          order.status === 'delivered' ? 'bg-emerald-500 text-slate-950 font-bold' :
                          'bg-rose-600 text-white ring-2 ring-rose-350'
                        }`}>
                          {order.status === 'pending' ? 'Pendiente' :
                           order.status === 'preparing' ? 'Preparando' :
                           order.status === 'in_route' ? 'En Ruta' :
                           order.status === 'delivered' ? 'Entregado' :
                           order.cancelledBy === 'usuario' ? '❌ Cancelado por Cliente' :
                           `Cancelado por ${order.cancelledBy || 'sistema'}`}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="pl-2 border-l-2 border-amber-500/30 space-y-1 py-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-xs text-slate-300">
                            • <b className="text-white">{item.quantity}x</b> {item.name}{' '}
                            <span className="text-slate-500">(${item.price} c/u)</span>
                          </div>
                        ))}
                      </div>

                      {order.delivery && order.address && (
                        <p className="text-xs text-slate-400">
                          <span className="font-semibold text-slate-300">Dirección de Entrega:</span> {order.address}
                        </p>
                      )}

                      {order.paymentMethod && (
                        <p className="text-xs text-slate-400">
                          <span className="font-semibold text-slate-300">Forma de Pago:</span> <span className="bg-slate-800 text-amber-300 border border-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">{order.paymentMethod}</span>
                        </p>
                      )}

                      {order.notes && (
                        <p className="text-xs text-amber-400 italic">
                          <span className="font-semibold text-slate-400 not-italic">Notas:</span> "{order.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end justify-between min-w-[150px] border-t md:border-t-0 border-slate-800 pt-3 md:pt-0 gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-mono">Total de Venta</span>
                        <span className="text-lg font-black text-white font-mono">${order.total.toFixed(2)}</span>
                      </div>

                      {/* Immediate Status Updates (Admin can change everything directly) */}
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <div className="flex flex-wrap gap-1">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                              className="text-[10px] bg-cyan-700 hover:bg-cyan-600 text-white font-bold px-2 py-1 rounded"
                            >
                              Cocinar
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, order.delivery ? 'in_route' : 'delivered')}
                              className="text-[10px] bg-indigo-700 hover:bg-indigo-600 text-white font-bold px-2 py-1 rounded"
                            >
                              {order.delivery ? 'Enviar' : 'Entregar'}
                            </button>
                          )}
                          {order.status === 'in_route' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                              className="text-[10px] bg-emerald-700 hover:bg-emerald-600 text-slate-900 font-extrabold px-2 py-1 rounded"
                            >
                              Listo / Entregado
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                            className="text-[10px] bg-rose-700 hover:bg-rose-600 text-white font-bold px-2 py-1 rounded"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pending Authorization Requests from staff */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white">Solicitudes Recibidas del Personal (Cuenta Principal)</h3>
              <p className="text-xs text-slate-400 font-mono">Filtrados por Resolver</p>
            </div>

            {authRequests.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                No hay solicitudes de autorización pendientes en este momento.
              </div>
            ) : (
              <div className="space-y-4">
                {authRequests.map(req => (
                  <div key={req.id} className="bg-slate-900 rounded-lg p-5 border border-slate-700">
                    <div className="flex items-center justify-between col-span-2 mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold uppercase">
                          {req.type === 'price_change' ? 'Cambio de Precio' : 
                           req.type === 'inventory_restock' ? 'Reabastecimiento de Insumos' : 'Adición de Platillo'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {req.id}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        req.status === 'pending' ? 'bg-amber-500/20 text-amber-400 animate-pulse' :
                        req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {req.status === 'pending' ? 'Pendiente' : req.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-200 mt-1 font-sans">{req.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">Solicitado por: Personal General ({req.requestedBy})</p>

                    {req.status === 'pending' && (
                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-800">
                        <button
                          onClick={() => handleResolveRequest(req, false)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-750 text-rose-400 rounded-lg border border-rose-500/20 font-semibold"
                        >
                          <X className="w-4 h-4" />
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleResolveRequest(req, true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg font-bold"
                        >
                          <Check className="w-4 h-4" />
                          Aprobar y Aplicar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Menu Catalog Management */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            
            {/* Adding a new platform item */}
            <form onSubmit={handleAddMenuItem} className="bg-slate-900 border border-slate-700/60 p-5 rounded-lg space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Agregar Nuevo Alimento o Bebida
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nombre del Platillo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Tacos de Barbacoa"
                    value={newMenuName}
                    onChange={(e) => setNewMenuName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Categoría</label>
                  <select
                    value={newMenuCategory}
                    onChange={(e) => setNewMenuCategory(e.target.value as 'taco' | 'bebida')}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="taco">🌮 Taco / Platillo</option>
                    <option value="bebida">🥤 Bebida Refrescante</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Precio al Público ($)</label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    placeholder="$15.00"
                    value={newMenuPrice}
                    onChange={(e) => setNewMenuPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Descripción de Ingredientes</label>
                <textarea
                  placeholder="Escribe de qué está compuesto este taco/platillo..."
                  value={newMenuDesc}
                  rows={2}
                  onChange={(e) => setNewMenuDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Platillo
                </button>
              </div>
            </form>

            {/* Menu List */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Menú de la Taquería</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menu.map(item => (
                  <div key={item.id} className="bg-slate-900 border border-slate-700/60 rounded-lg p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-bold">{item.name}</span>
                        <span className="text-[10px] font-mono bg-slate-800 text-amber-500 px-2 py-0.5 rounded uppercase">
                          {item.category === 'taco' ? '🌮 Taco' : '🥤 Bebida'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                      <div>
                        {editingItemId === item.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono">$</span>
                            <input
                              type="number"
                              value={editingPriceValue}
                              onChange={(e) => setEditingPriceValue(e.target.value)}
                              className="w-20 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white font-mono"
                            />
                            <button
                              onClick={() => savePriceEdit(item.id)}
                              className="p-1 bg-emerald-600 text-slate-950 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingItemId(null)}
                              className="p-1 bg-slate-750 text-slate-400 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-md font-bold text-emerald-400 font-mono">
                            ${item.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {editingItemId !== item.id && (
                          <button
                            onClick={() => startEditPrice(item)}
                            className="px-2.5 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded"
                          >
                            Modificar Precio
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="p-1 text-rose-400 hover:text-rose-500 bg-slate-800 hover:bg-rose-500/10 rounded border border-slate-700/60"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 4: Direct Inventory Management */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Ingredientes y Stock Físico</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ajustes directos de materia prima.</p>
              </div>
              <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                Lote Activo de Almacén
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ingredients.map(ing => {
                const isLow = ing.quantity <= ing.minLimit;
                return (
                  <div key={ing.id} className={`bg-slate-900 border rounded-lg p-4 flex flex-col justify-between ${
                    isLow ? 'border-rose-500/40 bg-rose-950/5' : 'border-slate-700/60'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">{ing.name}</span>
                        {isLow ? (
                          <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded uppercase animate-bounce">
                            ⚠️ Bajo Stock
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                            ✓ Ok
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-baseline gap-1 mt-2 mb-3">
                        <span className="text-2xl font-black text-slate-100 font-mono">
                          {ing.quantity.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{ing.unit}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">Límite mínimo: {ing.minLimit} {ing.unit}</p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-1 w-full justify-end">
                        <button
                          onClick={() => handleUpdateIngredientStock(ing.id, -1000)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded font-bold font-mono"
                        >
                          -1kg
                        </button>
                        <button
                          onClick={() => handleUpdateIngredientStock(ing.id, -250)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded font-bold font-mono"
                        >
                          -250g
                        </button>
                        <button
                          onClick={() => handleUpdateIngredientStock(ing.id, 250)}
                          className="px-2 py-1 bg-emerald-950 hover:bg-emerald-800 text-emerald-400 text-xs rounded font-bold border border-emerald-500/20 font-mono"
                        >
                          +250g
                        </button>
                        <button
                          onClick={() => handleUpdateIngredientStock(ing.id, 1000)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs rounded font-black font-mono"
                        >
                          +1kg
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: Authorized Customer Accounts */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Control de Accesos de Clientes</h3>
                <p className="text-xs text-slate-400 mt-0.5">Únicamente los correos de esta lista pueden ingresar a pedir.</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">Total: {authorizedUsers.length}</span>
            </div>

            {/* Authorize new user form */}
            <form onSubmit={handleAddUser} className="bg-slate-900 border border-slate-700/60 p-4 rounded-lg space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <Plus className="w-4 h-4 text-emerald-400" />
                Registrar y Autorizar Cliente Nuevo
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nombre Completo del Cliente</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Correo Electrónico (Para Login)</label>
                  <input
                    type="email"
                    required
                    placeholder="Ej. juan@gmail.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Autorizar Correo
                </button>
              </div>
            </form>

            {/* Registered users list table */}
            <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-700">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Correo Electrónico Autenticable</th>
                    <th className="p-3">Autorizado El</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {authorizedUsers.map(u => (
                    <tr key={u.email} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-white">{u.name}</td>
                      <td className="p-3 font-mono text-amber-500">{u.email}</td>
                      <td className="p-3 text-slate-400 font-mono">
                        {new Date(u.registeredAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.email)}
                          className="p-1.5 text-rose-400 hover:text-rose-500 hover:bg-rose-500/15 rounded border border-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
          </div>
        )}

        {/* Tab 6: Mathematical Analysis Panel */}
        {activeTab === 'math' && (
          <MathAnalytics orders={orders} menu={menu} ingredients={ingredients} />
        )}

      </div>

    </div>
  );
}
