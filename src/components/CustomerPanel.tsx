import React, { useState, useMemo } from 'react';
import { MenuItem, Order, OrderItem } from '../types';
import { 
  ShoppingBag, ClipboardList, Clock, Truck, 
  Trash2, Send, X, Plus, Minus, CheckCircle, Info,
  Coins, CreditCard, QrCode
} from 'lucide-react';

interface CustomerPanelProps {
  customerEmail: string;
  menu: MenuItem[];
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

export default function CustomerPanel({
  customerEmail,
  menu,
  orders,
  setOrders
}: CustomerPanelProps) {
  // Cart states: map of itemId -> quantity
  const [cart, setCart] = useState<{ [itemId: string]: number }>({});
  const [delivery, setDelivery] = useState<boolean>(true);
  const [address, setAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'order' | 'history'>('order');

  // Filter personal orders belonging to this customer
  const personalOrders = useMemo(() => {
    return orders
      .filter(o => o.customerEmail.toLowerCase() === customerEmail.toLowerCase())
      // Sort newest first
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, customerEmail]);

  // Adjust basket numbers
  const updateCartQty = (itemId: string, delta: number) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      const newQty = Math.max(0, current + delta);
      
      const copy = { ...prev };
      if (newQty === 0) {
        delete copy[itemId];
      } else {
        copy[itemId] = newQty;
      }
      return copy;
    });
  };

  // Clear overall basket
  const handleClearCart = () => {
    setCart({});
  };

  // Calculate prices
  const cartTotals = useMemo(() => {
    let subtotal = 0;
    const itemsList: OrderItem[] = [];

    Object.entries(cart).forEach(([itemId, val]) => {
      const item = menu.find(m => m.id === itemId);
      const qty = Number(val);
      if (item && qty > 0) {
        const cost = item.price * qty;
        subtotal += cost;
        itemsList.push({
          menuItemId: item.id,
          name: item.name,
          quantity: qty,
          price: item.price,
          category: item.category
        });
      }
    });

    const deliveryFee = delivery && subtotal > 0 ? 20.00 : 0;
    const total = subtotal + deliveryFee;

    return {
      subtotal,
      deliveryFee,
      total,
      itemsList
    };
  }, [cart, menu, delivery]);

  // Handle order creation
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartTotals.itemsList.length === 0) {
      alert('Tu carrito está vacío. Agrega unos deliciosos tacos primero.');
      return;
    }

    if (delivery && !address.trim()) {
      alert('Por favor, indica tu dirección exacta para enviar el pedido a domicilio.');
      return;
    }

    // Build unique ID
    const newOrderId = `ORD-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: Order = {
      id: newOrderId,
      customerEmail: customerEmail.toLowerCase().trim(),
      items: cartTotals.itemsList,
      total: cartTotals.total,
      delivery,
      address: delivery ? address.trim() : '',
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString(),
      notes: specialInstructions.trim() || undefined
    };

    setOrders(prev => [newOrder, ...prev]);
    
    // Reset inputs
    setCart({});
    setAddress('');
    setPaymentMethod('Efectivo');
    setSpecialInstructions('');
    
    // Redirect to history/tracking tab
    setActiveTab('history');
    alert(`¡Tu pedido ${newOrderId} ha sido recibido en cocina! Puedes monitorear su preparación en tiempo real desde la pestaña "Mis Tacos".`);
  };

  // Immediate self-cancellation if order has not yet been cooked (remains pending)
  const handleCustomerCancelOrder = (orderId: string) => {
    if (confirm('¿Estás seguro de cancelar este pedido de tacos? Todavía no inicia su preparación.')) {
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'cancelled', cancelledBy: 'usuario' } 
          : order
      ));
      alert('Pedido cancelado exitosamente.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Navigation for customer */}
      <div className="flex bg-slate-200 p-1 rounded-lg border border-slate-300">
        <button
          onClick={() => setActiveTab('order')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded transition-all uppercase tracking-tight ${
            activeTab === 'order' ? 'bg-red-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:text-red-700 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Ordenar Tacos y Bebidas
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded transition-all uppercase tracking-tight ${
            activeTab === 'history' ? 'bg-red-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:text-red-700 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Mis Tacos / Historial
          {personalOrders.some(o => o.status !== 'delivered' && o.status !== 'cancelled') && (
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
          )}
        </button>
      </div>

      {/* Main Container */}
      {activeTab === 'order' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Menu selection panel */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
              Nuestro Menú Tradicional
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menu.map(item => {
                const qtyInCart = cart[item.id] || 0;
                return (
                  <div 
                    key={item.id} 
                    className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-red-600/40 transition-all group shadow-xs"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-slate-900 group-hover:text-red-650 transition-colors">{item.name}</h4>
                        <span className="text-xs font-black text-red-600 font-mono">${item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1 mb-4">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-auto">
                      <span className="text-[10px] uppercase font-mono text-slate-500">
                        {item.category === 'taco' ? '🌮 Al Comal' : '🥤 Refrescante'}
                      </span>

                      {qtyInCart > 0 ? (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-2 py-1 rounded">
                          <button
                            onClick={() => updateCartQty(item.id, -1)}
                            className="bg-red-600 text-white hover:bg-red-700 p-1 rounded transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold text-slate-900 font-mono min-w-[14px] text-center">{qtyInCart}</span>
                          <button
                            onClick={() => updateCartQty(item.id, 1)}
                            className="bg-red-600 text-white hover:bg-red-700 p-1 rounded transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-red-600 hover:text-white text-slate-700 font-bold text-xs rounded transition-all uppercase tracking-tight"
                        >
                          Agregar Taco
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart pane */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm sticky top-6 text-slate-800">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase">
                  <ShoppingBag className="w-4 h-4 text-red-600" />
                  Ordenado Actual
                </span>
                {cartTotals.itemsList.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-[10px] text-red-650 hover:text-red-700 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Vaciar Plato
                  </button>
                )}
              </div>

              {cartTotals.itemsList.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Tu plato está vacío.<br />
                  Haz clic en el menú de la izquierda para seleccionar tus tacos favoritos.
                </div>
              ) : (
                <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs h-full">
                  
                  {/* Cart Item rows */}
                  <div className="divide-y divide-slate-200 max-h-[180px] overflow-y-auto pr-1">
                    {cartTotals.itemsList.map(item => (
                      <div key={item.menuItemId} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <span className="text-slate-500 font-mono">${item.price.toFixed(2)} x {item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold font-mono text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.menuItemId, -item.quantity)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipment Mode (Only A Domicilio) */}
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-red-650 flex-shrink-0" />
                    <div>
                      <span className="block text-xs font-black text-slate-900 uppercase">Envío Exclusivo Taquería</span>
                      <span className="block text-[10px] text-slate-500 font-mono">Todos nuestros pedidos son despachados únicamente a domicilio</span>
                    </div>
                  </div>

                  {/* Delivery Parameters */}
                  <div className="space-y-2 animate-fadeIn">
                    <label className="block text-slate-600 text-[10px] uppercase font-bold">Dirección Exacta de Calle, Col. y Núm.</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Av. Universidad #408, Col. Reforma"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-950 rounded p-2 text-xs focus:outline-none focus:border-red-600"
                    />
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <label className="block text-slate-600 text-[10px] uppercase font-bold">Método de Pago</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Efectivo')}
                        className={`py-2 px-1 rounded-lg border font-bold text-[10px] uppercase transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          paymentMethod === 'Efectivo'
                            ? 'bg-red-50 text-red-700 border-red-300 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Coins className="w-4 h-4 text-amber-500" />
                        Efectivo
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Tarjeta (Terminal)')}
                        className={`py-2 px-1 rounded-lg border font-bold text-[10px] uppercase transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          paymentMethod === 'Tarjeta (Terminal)'
                            ? 'bg-red-50 text-red-700 border-red-300 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-blue-500" />
                        Tarjeta
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Transferencia Spei')}
                        className={`py-2 px-1 rounded-lg border font-bold text-[10px] uppercase transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          paymentMethod === 'Transferencia Spei'
                            ? 'bg-red-50 text-red-700 border-red-300 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <QrCode className="w-4 h-4 text-purple-500" />
                        SPEI
                      </button>
                    </div>
                  </div>

                  {/* Personalization specifications */}
                  <div className="space-y-1">
                    <label className="block text-slate-600 text-[10px] uppercase font-bold">Indicaciones (Sin cebolla, con cebollitas, etc.)</label>
                    <input
                      type="text"
                      placeholder="Ej. Tacos pastor sin cebolla y las salsas por separado, por favor."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-950 rounded p-2 text-xs focus:outline-none focus:border-red-600"
                    />
                  </div>

                  {/* Calculated summary */}
                  <div className="border-t border-slate-200 pt-3 space-y-1.5 font-sans">
                    <div className="flex justify-between text-slate-650">
                      <span>Subtotal de consumo:</span>
                      <span className="text-slate-900 font-bold font-mono">${cartTotals.subtotal.toFixed(2)}</span>
                    </div>
                    {delivery && (
                      <div className="flex justify-between text-slate-650">
                        <span>Servicio de Repartidor:</span>
                        <span className="text-slate-900 font-bold font-mono">${cartTotals.deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-bold text-slate-900 border-t border-dashed border-slate-200 pt-2">
                      <span>MONTO TOTAL:</span>
                      <span className="text-red-600 text-md font-mono font-black">${cartTotals.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 font-bold text-white py-3 rounded uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    Enviar Pedido a Cocina
                  </button>

                </form>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* Tab 2: Orders history of the customer */
        <div className="space-y-6 text-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-black text-slate-900 uppercase">Historial de Consumo Personal</h3>
            <p className="text-xs text-slate-500 font-mono">Bajo tu cuenta: {customerEmail}</p>
          </div>

          {personalOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No tienes ningún pedido de tacos registrado con este correo.<br />
              ¡Ve a la pestaña "Ordenar Tacos y Bebidas" para darte tu primer banquete!
            </div>
          ) : (
            <div className="space-y-4">
              {personalOrders.map(order => (
                <div key={order.id} className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-red-650 font-mono">{order.id}</span>
                        <span className="text-xs text-slate-500 font-mono">{new Date(order.createdAt).toLocaleDateString()} a las {new Date(order.createdAt).toLocaleTimeString()}</span>
                        {order.delivery ? (
                          <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold uppercase font-mono">
                            🛵 Domicilio
                          </span>
                        ) : (
                          <span className="text-[9px] bg-green-50 text-emerald-800 border border-green-200 px-2 py-0.5 rounded font-bold uppercase font-mono">
                            🏪 Para Recoger
                          </span>
                        )}
                        {order.paymentMethod && (
                          <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold uppercase font-mono">
                            💳 {order.paymentMethod}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">Monto Cobrado</span>
                      <span className="text-lg font-black text-slate-900 font-mono">${order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Status Progress Bar */}
                  {order.status !== 'cancelled' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold font-mono uppercase mb-1">
                        <span className={order.status === 'pending' ? 'text-red-600 font-black' : ''}>Pendiente</span>
                        <span className={order.status === 'preparing' ? 'text-cyan-700 font-black' : ''}>Guisándose / Comal</span>
                        {order.delivery ? (
                          <span className={order.status === 'in_route' ? 'text-indigo-700 font-black' : ''}>Repartiendo</span>
                        ) : (
                          <span className={order.status === 'preparing' ? 'text-cyan-705 text-cyan-700 font-black' : ''}>Listo para pasar</span>
                        )}
                        <span className={order.status === 'delivered' ? 'text-emerald-800 font-black' : ''}>Entregado</span>
                      </div>
                      
                      {/* Interactive Progress Line */}
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden relative border border-slate-300">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            order.status === 'pending' ? 'w-1/4 bg-red-600 animate-pulse' :
                            order.status === 'preparing' ? 'w-2/4 bg-cyan-600' :
                            order.status === 'in_route' ? 'w-3/4 bg-indigo-600' :
                            'w-full bg-emerald-600'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Cancelled tag displays */}
                  {order.status === 'cancelled' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-750 text-xs flex items-center gap-2">
                      <X className="w-4 h-4 flex-shrink-0" />
                      <span>El pedido fue cancelado exitosamente por: <b className="uppercase font-bold text-red-700">{order.cancelledBy || 'sistema'}</b>.</span>
                    </div>
                  )}

                  {/* Bottom contents summary */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-slate-200 text-xs">
                    <div className="space-y-1.5 text-slate-600">
                      <div>
                        <span className="font-bold text-slate-800">Resumen de Plato:</span>{' '}
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                      {order.delivery && order.address && (
                        <p>
                          <span className="font-bold text-slate-800">Enviado a:</span> {order.address}
                        </p>
                      )}
                      {order.paymentMethod && (
                        <p>
                          <span className="font-bold text-slate-800">Método de Pago:</span> <span className="bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">{order.paymentMethod}</span>
                        </p>
                      )}
                      
                    </div>

                    {/* Customers can only self-cancel if order is pending */}
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCustomerCancelOrder(order.id)}
                        className="text-red-700 hover:text-white bg-white hover:bg-red-600 font-bold px-3 py-1.5 rounded border border-red-200 hover:border-red-600 transition-all self-end md:self-auto uppercase tracking-tight text-[11px]"
                      >
                        Cancelar Mi Pedido
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
