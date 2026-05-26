import React, { useState } from 'react';
import { MenuItem, Ingredient, Order, AuthRequest } from '../types';
import { 
  ClipboardList, ShoppingBag, Leaf, AlertTriangle, Send, 
  CheckCircle, Plus, ShieldAlert, KeyRound, Check, X 
} from 'lucide-react';

interface PrincipalPanelProps {
  menu: MenuItem[];
  ingredients: Ingredient[];
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  authRequests: AuthRequest[];
  setAuthRequests: React.Dispatch<React.SetStateAction<AuthRequest[]>>;
}

export default function PrincipalPanel({
  menu,
  ingredients,
  orders,
  setOrders,
  authRequests,
  setAuthRequests
}: PrincipalPanelProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'auth_req'>('orders');

  // PIN Canceling states
  const [pinInput, setPinInput] = useState('');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [pinError, setPinError] = useState(false);

  // States for submitting authorization requests to the Admin
  const [reqType, setReqType] = useState<'price_change' | 'inventory_restock' | 'menu_add'>('price_change');
  const [reqDescription, setReqDescription] = useState('');
  
  // Dynamic payload inputs
  const [selectedItemId, setSelectedItemId] = useState(menu[0]?.id || '');
  const [newPriceValue, setNewPriceValue] = useState('');
  const [selectedIngId, setSelectedIngId] = useState(ingredients[0]?.id || '');
  const [restockAmountValue, setRestockAmountValue] = useState('');
  
  // Menu Item formulation
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'taco' | 'bebida'>('taco');
  const [newItemDesc, setNewItemDesc] = useState('');

  // Handle submit of structural auth request to Admin
  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqDescription.trim()) {
      alert('Por favor describe el motivo de la solicitud.');
      return;
    }

    let payload: any = {};
    let descriptiveTitle = '';

    if (reqType === 'price_change') {
      const price = parseFloat(newPriceValue);
      if (isNaN(price) || price <= 0) {
        alert('Ingresa un precio válido');
        return;
      }
      const item = menu.find(m => m.id === selectedItemId);
      payload = { itemId: selectedItemId, newPrice: price };
      descriptiveTitle = `Cambiar precio de "${item?.name}" de $${item?.price.toFixed(2)} a $${price.toFixed(2)}`;
    } else if (reqType === 'inventory_restock') {
      const amt = parseFloat(restockAmountValue);
      if (isNaN(amt) || amt <= 0) {
        alert('Ingresa una cantidad de reabastecimiento válida');
        return;
      }
      const ing = ingredients.find(i => i.id === selectedIngId);
      payload = { ingredientId: selectedIngId, restockAmount: amt };
      descriptiveTitle = `Reabastecer ${amt} ${ing?.unit} de "${ing?.name}"`;
    } else if (reqType === 'menu_add') {
      const price = parseFloat(newItemPrice);
      if (!newItemName.trim() || isNaN(price) || price <= 0) {
        alert('Ingresa información válida para el nuevo platillo');
        return;
      }
      payload = {
        newItem: {
          id: `item-${Date.now()}`,
          name: newItemName.trim(),
          category: newItemCategory,
          price,
          description: newItemDesc.trim()
        }
      };
      descriptiveTitle = `Añadir "${newItemName.trim()}" al menú por $${price.toFixed(2)}`;
    }

    const newRequest: AuthRequest = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      requestedBy: 'principal',
      type: reqType,
      description: `${descriptiveTitle} — Motivo: ${reqDescription.trim()}`,
      payload,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setAuthRequests(prev => [newRequest, ...prev]);
    
    // Clear inputs
    setReqDescription('');
    setNewPriceValue('');
    setRestockAmountValue('');
    setNewItemName('');
    setNewItemPrice('');
    setNewItemDesc('');
    
    alert('¡Solicitud de autorización enviada con éxito al Administrador!');
  };

  // Status updates for orders
  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
  };

  // Trigger cancel flow
  const initiateCancelOrder = (orderId: string) => {
    setCancellingOrderId(orderId);
    setPinInput('');
    setPinError(false);
  };

  // Perform secure cancellation with PIN 3344
  const handleVerifyPinAndCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '3344') {
      if (cancellingOrderId) {
        setOrders(prev => prev.map(order => 
          order.id === cancellingOrderId 
            ? { ...order, status: 'cancelled', cancelledBy: 'principal' } 
            : order
        ));
        alert('El pedido ha sido cancelado exitosamente por la Cuenta Principal.');
      }
      setCancellingOrderId(null);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const lowStockCount = ingredients.filter(i => i.quantity <= i.minLimit).length;

  return (
    <div className="space-y-6">
      
      {/* Dynamic warning banner for low stock of ingredients */}
      {lowStockCount > 0 && (
        <div className="bg-yellow-50 border-l-4 border-amber-500 rounded p-4 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="text-amber-600 w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-900">¡Alerta de Inventario Crítico!</h4>
            <p className="text-xs text-slate-700 mt-1">
              Hay <b className="text-slate-900">{lowStockCount} insumos</b> por debajo del límite mínimo. 
              Por favor, solicite reabastecimiento al Administrador en la pestaña correspondiente.
            </p>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex bg-slate-200 p-1 rounded-lg border border-slate-300">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded transition-all uppercase tracking-tight ${
            activeTab === 'orders' ? 'bg-red-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:text-red-700 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Monitor de Pedidos y Entrega
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded transition-all uppercase tracking-tight ${
            activeTab === 'inventory' ? 'bg-red-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:text-red-700 hover:bg-slate-100'
          }`}
        >
          <Leaf className="w-4 h-4" />
          Inventario de Ingredientes
        </button>
        <button
          onClick={() => setActiveTab('auth_req')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded transition-all uppercase tracking-tight ${
            activeTab === 'auth_req' ? 'bg-red-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:text-red-700 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          Solicitar Autorización
        </button>
      </div>

      {/* Content panels */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs text-slate-800">
        
        {/* Tab 1: Orders and cancellations */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Pedidos Recibidos e Historial Comercial</h3>
              <p className="text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded font-mono">
                PIN Cancelaciones: <span className="text-red-600 font-bold">Requerido</span>
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                No hay pedidos en cola hoy.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col md:flex-row md:items-start justify-between gap-4 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-red-600 font-mono">{order.id}</span>
                        <span className="text-xs text-slate-500 font-mono">{new Date(order.createdAt).toLocaleTimeString()}</span>
                        <span className="text-xs text-slate-600 font-mono bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                          {order.customerEmail}
                        </span>
                        {order.delivery ? (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-mono font-bold">
                            🛵 Domicilio
                          </span>
                        ) : (
                          <span className="text-[10px] bg-green-50 text-emerald-800 border border-green-200 px-2 py-0.5 rounded font-mono font-bold">
                            🏪 Sucursal
                          </span>
                        )}
                        
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                          order.status === 'pending' ? 'bg-yellow-50 border-yellow-200 text-amber-800' :
                          order.status === 'preparing' ? 'bg-cyan-50 border-cyan-200 text-cyan-800' :
                          order.status === 'in_route' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' :
                          order.status === 'delivered' ? 'bg-green-50 border-green-200 text-emerald-800' :
                          'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          {order.status === 'pending' ? 'Pendiente' :
                           order.status === 'preparing' ? 'Preparando en Comal' :
                           order.status === 'in_route' ? 'En Moto Reparto' :
                           order.status === 'delivered' ? 'Entregado y Cobrado' :
                           `Cancelado por ${order.cancelledBy || 'sistema'}`}
                        </span>
                      </div>

                      {/* Line items */}
                      <div className="pl-3 border-l-2 border-red-600/30 space-y-1 py-0.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-xs text-slate-700">
                            • <b className="text-slate-900">{item.quantity}x</b> {item.name}{' '}
                            <span className="text-slate-500">(${item.price} c/u)</span>
                          </div>
                        ))}
                      </div>

                      {order.delivery && order.address && (
                        <p className="text-xs text-slate-700 bg-white p-2 rounded border border-slate-200">
                          <span className="font-bold text-red-600">Dirección de Entrega:</span> {order.address}
                        </p>
                      )}

                      {order.paymentMethod && (
                        <p className="text-xs text-slate-705 text-slate-700">
                          <span className="font-bold text-slate-800">Método de Pago:</span> <span className="bg-red-50 text-red-700 border border-red-200 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">{order.paymentMethod}</span>
                        </p>
                      )}

                      {order.notes && (
                        <p className="text-xs text-amber-700 italic">
                          <span className="font-bold text-slate-600 not-italic">Notas Especiales:</span> "{order.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end justify-between min-w-[160px] border-t md:border-t-0 border-slate-200 pt-3 md:pt-0 gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block font-mono">Consumo total</span>
                        <span className="text-lg font-black text-slate-900 font-mono">${order.total.toFixed(2)}</span>
                      </div>

                      {/* Action workflow */}
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                              className="text-[10px] bg-cyan-700 hover:bg-cyan-600 text-white font-bold px-3 py-1 rounded-md"
                            >
                              Cocinar
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, order.delivery ? 'in_route' : 'delivered')}
                              className="text-[10px] bg-indigo-700 hover:bg-indigo-600 text-white font-bold px-3 py-1 rounded-md"
                            >
                              {order.delivery ? 'Despachar Motocicleta' : 'Entregar al Cliente'}
                            </button>
                          )}
                          {order.status === 'in_route' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                              className="text-[10px] bg-emerald-700 hover:bg-emerald-600 text-slate-900 font-extrabold px-3 py-1 rounded-md"
                            >
                              Confirmar Recepción
                            </button>
                          )}
                          <button
                            onClick={() => initiateCancelOrder(order.id)}
                            className="text-[10px] bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1 rounded-md"
                          >
                            Cancelar Pedido
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

        {/* Tab 2: Ingredients list as staff */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">Inventario Escaneado</h3>
                <p className="text-xs text-slate-500 mt-0.5">Control de peso y stock para bebidas y guisos.</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">Modo: Solo Lectura / Alertas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ingredients.map(ing => {
                const isLow = ing.quantity <= ing.minLimit;
                return (
                  <div key={ing.id} className={`bg-slate-50 border rounded-lg p-4 flex flex-col justify-between shadow-xs ${
                    isLow ? 'border-red-300 bg-red-50/40' : 'border-slate-200'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-bold text-slate-900">{ing.name}</span>
                        {isLow ? (
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded">
                            ⚠️ Crítico
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-800 bg-green-100 border border-green-200 px-2 py-0.5 rounded">
                            Normal
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1 mt-2 mb-1">
                        <span className="text-2xl font-black text-slate-900 font-mono">
                          {ing.quantity.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{ing.unit}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">Límite mínimo: {ing.minLimit} {ing.unit}</p>
                    </div>

                    {isLow && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <button
                          onClick={() => {
                            setActiveTab('auth_req');
                            setReqType('inventory_restock');
                            setSelectedIngId(ing.id);
                            setRestockAmountValue(Math.max((ing.minLimit * 3) - ing.quantity, 1000).toString());
                            setReqDescription(`El ingrediente '${ing.name}' se encuentra en estado crítico de ${ing.quantity} ${ing.unit}. Se solicita reabastecimiento urgente de comal.`);
                          }}
                          className="w-full text-center text-[10px] py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold uppercase transition-all"
                        >
                          Generar Orden de Suministro
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Request admin authorization to do anything */}
        {activeTab === 'auth_req' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">Enviar Solicitud de Autorización</h3>
                <p className="text-xs text-slate-500 mt-0.5">El administrador debe autorizar cambios de precios, sumas de inventarios o platillos nuevos.</p>
              </div>
            </div>

            <form onSubmit={handleSendRequest} className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-tight mb-1">Tipo de Modificación</label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 text-slate-950 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-red-600"
                  >
                    <option value="price_change">💵 Cambiar Precio de Taco o Bebida</option>
                    <option value="inventory_restock">📦 Reabastecer Insumos de Inventario</option>
                    <option value="menu_add">🌮 Dar de Alta Nuevo Platillo</option>
                  </select>
                </div>

                {/* Conditional Sub-selectors */}
                {reqType === 'price_change' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-tight mb-1">Seleccionar Taco o Bebida</label>
                    <div className="flex gap-2">
                      <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 text-slate-950 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-red-650"
                      >
                        {menu.map(item => (
                          <option key={item.id} value={item.id}>{item.name} (${item.price.toFixed(2)})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.5"
                        required
                        placeholder="Nuevo precio"
                        value={newPriceValue}
                        onChange={(e) => setNewPriceValue(e.target.value)}
                        className="w-28 bg-white border border-slate-300 text-slate-950 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-red-650 font-mono"
                      />
                    </div>
                  </div>
                )}

                {reqType === 'inventory_restock' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-tight mb-1">Seleccionar Ingrediente</label>
                    <div className="flex gap-2">
                      <select
                        value={selectedIngId}
                        onChange={(e) => setSelectedIngId(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 text-slate-950 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-red-650"
                      >
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>{ing.name} (Tiene {ing.quantity} {ing.unit})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        required
                        placeholder="Cantidad a sumar"
                        value={restockAmountValue}
                        onChange={(e) => setRestockAmountValue(e.target.value)}
                        className="w-28 bg-white border border-slate-300 text-slate-950 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-red-650 font-mono"
                      />
                    </div>
                  </div>
                )}

                {reqType === 'menu_add' && (
                  <div className="p-4 bg-white rounded border border-slate-200 space-y-3 col-span-2 shadow-xs">
                    <span className="text-[10px] font-mono text-red-650 uppercase font-black tracking-wider">Formulario de Platillo Propuesto</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-650 mb-1">Nombre</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Gringa Especial"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-slate-950 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-red-650"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-650 mb-1">Precio Sugerido</label>
                        <input
                          type="number"
                          step="0.5"
                          required
                          placeholder="$35.00"
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-slate-950 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-red-650 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-650 mb-1">Categoría</label>
                        <select
                          value={newItemCategory}
                          onChange={(e) => setNewItemCategory(e.target.value as any)}
                          className="w-full bg-white border border-slate-300 text-slate-950 rounded px-2.5 py-1 text-xs"
                        >
                          <option value="taco">Taco / Platillo</option>
                          <option value="bebida">Bebida</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-650 mb-1">Descripción</label>
                      <input
                        type="text"
                        placeholder="Descripción rápida de los ingredientes..."
                        value={newItemDesc}
                        onChange={(e) => setNewItemDesc(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-950 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-red-650"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Justificación o Motivo para el Administrador</label>
                <textarea
                  required
                  placeholder="Por favor describe por qué es necesario este cambio..."
                  rows={3}
                  value={reqDescription}
                  onChange={(e) => setReqDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-950 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-red-650"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-650 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  Enviar Propuesta de Cambio
                </button>
              </div>

            </form>

            {/* List of previously sent requests */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest">Historial de solicitudes creadas:</h4>
              
              {authRequests.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No has emitido solicitudes en esta sesión.</p>
              ) : (
                <div className="space-y-2">
                  {authRequests.map(req => (
                    <div key={req.id} className="bg-slate-50 p-3 rounded border border-slate-200 flex items-center justify-between text-xs shadow-xs">
                      <div>
                        <p className="font-bold text-slate-800">{req.description}</p>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {req.id} • Creado el {new Date(req.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] border ${
                        req.status === 'pending' ? 'bg-yellow-50 text-amber-805 border-yellow-200 animate-pulse' :
                        req.status === 'approved' ? 'bg-green-50 text-emerald-800 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {req.status === 'pending' ? 'En espera' : req.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* PIN entry dialog for cancellation */}
      {cancellingOrderId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border-2 border-red-600 rounded p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-8 h-8" />
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase">Autenticación de Cancelación</h3>
                <p className="text-xs text-red-650 font-bold">Código PIN de Seguridad Requerido para continuar.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-100 p-3 rounded border border-slate-200 font-mono">
              Para cancelar el pedido <b className="text-red-600">{cancellingOrderId}</b>, debes introducir tu PIN de Cuenta Principal proporcionado por la gerencia.
            </p>

            <form onSubmit={handleVerifyPinAndCancel} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-tight">Introducir PIN (4 dígitos)</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/\D/g, ''));
                    setPinError(false);
                  }}
                  className="w-full text-center tracking-widest text-2xl bg-white border border-slate-300 rounded py-2 text-slate-900 font-mono focus:outline-none focus:border-red-600"
                />
                
                {pinError && (
                  <p className="text-xs text-red-600 font-bold text-center mt-2">
                    ❌ PIN Incorrecto. Intenta de nuevo. (Tip: Es 3344)
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingOrderId(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold uppercase transition-all"
                >
                  Regresar / Descartar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-650 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs flex items-center gap-1.5 uppercase transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  Autorizar Cancelación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
