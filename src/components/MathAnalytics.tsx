import React, { useState, useMemo } from 'react';
import { MenuItem, Order, Ingredient } from '../types';
import { TrendingUp, Award, Layers, Calculator, Info } from 'lucide-react';

interface MathAnalyticsProps {
  orders: Order[];
  menu: MenuItem[];
  ingredients: Ingredient[];
}

export default function MathAnalytics({ orders, menu, ingredients }: MathAnalyticsProps) {
  const [optimizerCombo1, setOptimizerCombo1] = useState<number>(45); // profit of combo Pastor ($)
  const [optimizerCombo2, setOptimizerCombo2] = useState<number>(55); // profit of combo Asada ($)

  // 1. DYNAMIC MATRIX CALCULATION (Recipe consumption)
  // Let's show how matrix mathematics can represent the transition of ingredients: I_new = I_old - R * Q
  // Where R is the matrix of ingredients per taco type, and Q is the vector of quantities sold.
  const matrixCalculation = useMemo(() => {
    // Vector Q (Quantities of Tacos Sold)
    const pastorSold = orders
      .filter(o => o.status !== 'cancelled')
      .flatMap(o => o.items)
      .filter(i => i.menuItemId === 't-pastor')
      .reduce((sum, item) => sum + item.quantity, 0);

    const asadaSold = orders
      .filter(o => o.status !== 'cancelled')
      .flatMap(o => o.items)
      .filter(i => i.menuItemId === 't-asada')
      .reduce((sum, item) => sum + item.quantity, 0);

    const campechanoSold = orders
      .filter(o => o.status !== 'cancelled')
      .flatMap(o => o.items)
      .filter(i => i.menuItemId === 't-campechano')
      .reduce((sum, item) => sum + item.quantity, 0);

    // Dynamic Vectors and Matrix
    // Taco Al Pastor recipe needs: 30g Pastor meat, 1 tortilla, 10g onion, 5g cilantro
    // Taco de Asada recipe needs: 40g Asada meat, 1.5 tortillas (double), 8g onion, 5g cilantro
    // Taco Campechano recipe needs: 20g Asada + 20g Chorizo + 5g Chicharrón, 1 tortilla, 8g onion, 5g cilantro
    const consumptionMatrix = [
      { ingredient: 'Carne Pastor (g)', pastor: 30, asada: 0, campechano: 0, total: pastorSold * 30 },
      { ingredient: 'Bistec Asada (g)', pastor: 0, asada: 40, campechano: 20, total: asadaSold * 40 + campechanoSold * 20 },
      { ingredient: 'Tortillas (pzas)', pastor: 1, asada: 1.5, campechano: 1, total: pastorSold * 1 + asadaSold * 1.5 + campechanoSold * 1 },
      { ingredient: 'Cebolla (g)', pastor: 10, asada: 8, campechano: 8, total: pastorSold * 10 + asadaSold * 8 + campechanoSold * 8 },
      { ingredient: 'Cilantro (g)', pastor: 5, asada: 5, campechano: 5, total: pastorSold * 5 + asadaSold * 5 + campechanoSold * 5 }
    ];

    return {
      pastorSold,
      asadaSold,
      campechanoSold,
      consumptionMatrix
    };
  }, [orders]);

  // 2. LINEAR REGRESSION: Demand forecasting based on historical timeline hours
  // Let X be the hour of the day, Y be the sales amount ($)
  const regressionResult = useMemo(() => {
    // Generate data points from completed orders
    const hourlySales: { [hour: number]: number } = {};
    // Seed default hours for statistical stability
    for (let h = 13; h <= 22; h++) {
      hourlySales[h] = 0;
    }

    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        const orderHour = new Date(order.createdAt).getUTCHours();
        // Convert to local-ish school hours (13 to 22)
        const hourKey = orderHour >= 0 && orderHour <= 23 ? orderHour : 15;
        if (hourKey >= 13 && hourKey <= 22) {
          hourlySales[hourKey] += order.total;
        }
      }
    });

    const dataPoints = Object.keys(hourlySales).map(hourStr => {
      const x = parseInt(hourStr, 10);
      const y = hourlySales[x];
      return { x, y };
    });

    const n = dataPoints.length;
    if (n === 0) return { slope: 0, intercept: 0, rValue: 0, dataPoints: [] };

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    dataPoints.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumX2 += p.x * p.x;
      sumY2 += p.y * p.y;
    });

    const denominatorSlope = n * sumX2 - sumX * sumX;
    const slope = denominatorSlope !== 0 ? (n * sumXY - sumX * sumY) / denominatorSlope : 0;
    const intercept = (sumY - slope * sumX) / n;

    // Correlation coefficient r
    const numeratorR = n * sumXY - sumX * sumY;
    const denominatorR = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const rValue = denominatorR !== 0 ? numeratorR / denominatorR : 0;

    return {
      slope,
      intercept,
      rValue,
      dataPoints
    };
  }, [orders]);

  // 3. LINEAR PROGRAMMING SIMPLEX ALGORITHM logic (Combo Maximization)
  // Combo 1 (Tacos de Pastor Combo x1): demands 150g Pastor, 4 Tortillas. Profit = optimizerCombo1 ($)
  // Combo 2 (Tacos de Asada Combo x2): demands 160g Asada, 6 Tortillas. Profit = optimizerCombo2 ($)
  // Available ingredients inside physical inventory:
  const mathLPResult = useMemo(() => {
    // Get real current ingredients or defaults
    const pastorStock = ingredients.find(i => i.id === 'i-pastor')?.quantity || 15000;
    const asadaStock = ingredients.find(i => i.id === 'i-asada')?.quantity || 12000;
    const tortillaStock = ingredients.find(i => i.id === 'i-tortilla')?.quantity || 1000;

    // Constraints:
    // 150x1 + 0x2 <= pastorStock   ==>  x1 <= pastorStock / 150
    // 0x1 + 160x2 <= asadaStock    ==>  x2 <= asadaStock / 160
    // 4x1 + 6x2 <= tortillaStock   ==>  Tortilla constraint
    
    // Let's sweep the feasible space systematically (grid search representing Simplex vertex scanning)
    // Vertices coordinates in the feasible polygon are:
    // (0,0)
    // (max_x1, 0) where max_x1 = min(pastorStock/150, tortillaStock/4)
    // (0, max_x2) where max_x2 = min(asadaStock/160, tortillaStock/6)
    // Intersection of: 4x1 + 6x2 = tortillaStock AND 150x1 = pastorStock (if exists)
    // Intersection of: 4x1 + 6x2 = tortillaStock AND 160x2 = asadaStock (if exists)
    // Let's find vertices of the feasible region mathematically!
    
    const limitX1Past_only = pastorStock / 150;
    const limitX2Asad_only = asadaStock / 160;
    
    const vertexA = { x1: 0, x2: 0, profit: 0 };
    
    // Vertex B: maximum possible x1 at x2=0
    const valX1_B = Math.min(limitX1Past_only, tortillaStock / 4);
    const vertexB = { x1: valX1_B, x2: 0, profit: valX1_B * optimizerCombo1 };
    
    // Vertex C: maximum possible x2 at x1=0
    const valX2_C = Math.min(limitX2Asad_only, tortillaStock / 6);
    const vertexC = { x1: 0, x2: valX2_C, profit: valX2_C * optimizerCombo2 };

    // Vertex D (Intersection of Tortilla constraint and Pastor limit, if asada constraint is not violated)
    // 4*x1_p + 6*x2_p = tortillaStock => x1_p = pastorStock/150, x2_p = (tortillaStock - 4*x1_p)/6
    const x1_D = limitX1Past_only;
    const x2_D = (tortillaStock - 4 * x1_D) / 6;
    const testD_Valid = x2_D >= 0 && (x2_D * 160 <= asadaStock);
    const vertexD = testD_Valid ? { x1: x1_D, x2: x2_D, profit: x1_D * optimizerCombo1 + x2_D * optimizerCombo2 } : null;

    // Vertex E (Intersection of Tortilla constraint and Asada limit, if pastor constraint is not violated)
    // 4*x1_e + 6*x2_e = tortillaStock => x2_e = asadaStock/160, x1_e = (tortillaStock - 6*x2_e)/4
    const x2_E = limitX2Asad_only;
    const x1_E = (tortillaStock - 6 * x2_E) / 4;
    const testE_Valid = x1_E >= 0 && (x1_E * 150 <= pastorStock);
    const vertexE = testE_Valid ? { x1: x1_E, x2: x2_E, profit: x1_E * optimizerCombo1 + x2_E * optimizerCombo2 } : null;

    // Collect all valid vertices
    const vertices = [vertexA, vertexB, vertexC];
    if (vertexD) vertices.push(vertexD);
    if (vertexE) vertices.push(vertexE);

    // Find the vertex that yields maximum profit
    let optimalVertex = vertexA;
    vertices.forEach(v => {
      if (v.profit > optimalVertex.profit) {
        optimalVertex = v;
      }
    });

    return {
      pastorStock,
      asadaStock,
      tortillaStock,
      limitX1Past_only,
      limitX2Asad_only,
      vertices,
      optimalVertex
    };
  }, [ingredients, optimizerCombo1, optimizerCombo2]);

  return (
    <div className="space-y-8 bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-xl border border-amber-900/40">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <span className="text-xs font-mono text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full">
            Modelo Matemático Estratégico
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-amber-500" />
            Análisis y Optimización Científica
          </h2>
        </div>
        <div className="text-sm font-mono text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          Modos: <span className="text-emerald-400 font-semibold">Simplex</span> •{' '}
          <span className="text-cyan-400 font-semibold">Matriz Insumo</span> •{' '}
          <span className="text-pink-400 font-semibold">Regresión</span>
        </div>
      </div>

      {/* Grid of calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Module A: LP Combo Maximization (Simplex Metaphor) */}
        <div className="bg-slate-800/80 rounded-xl p-5 border border-amber-500/20 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Layers className="text-amber-500 w-5 h-5" />
                Maximización de Ganancias (Simplex)
              </h3>
              <span className="text-xs text-amber-400 font-mono">Programación Lineal</span>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Modelado para optimizar la producción de paquetes de tacos utilizando comales al máximo. 
              Encontramos las cantidades óptimas de <b>Paquetes Pastor ($x_1$)</b> y <b>Paquetes Asada ($x_2$)</b> 
              para maximizar la utilidad neta sujeta al stock actual de ingredientes físicamente disponibles.
            </p>

            {/* Input Variables */}
            <div className="grid grid-cols-2 gap-4 bg-slate-900/80 p-3 rounded-lg border border-slate-700/80 mb-4">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400">Utilidad Pastor ($x_1$)</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-500 font-mono">$</span>
                  <input
                    type="number"
                    value={optimizerCombo1}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOptimizerCombo1(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-0.5 text-sm font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400">Utilidad Asada ($x_2$)</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-500 font-mono">$</span>
                  <input
                    type="number"
                    value={optimizerCombo2}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOptimizerCombo2(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-0.5 text-sm font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Constraints */}
            <div className="text-xs space-y-2 font-mono text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-850">
              <div className="text-amber-500 text-[10px] uppercase font-bold tracking-wider mb-1">Restricciones Físicas de Holgura:</div>
              <div className="flex justify-between">
                <span>1) Carne Pastor: 150g · $x_1$ ≤ {mathLPResult.pastorStock}g</span>
                <span className="text-slate-500">(Disponible: {Math.floor(mathLPResult.pastorStock / 150)} combos)</span>
              </div>
              <div className="flex justify-between">
                <span>2) Biftec Asada: 160g · $x_2$ ≤ {mathLPResult.asadaStock}g</span>
                <span className="text-slate-500">(Disponible: {Math.floor(mathLPResult.asadaStock / 160)} combos)</span>
              </div>
              <div className="flex justify-between">
                <span>3) Tortillas: 4 · $x_1$ + 6 · $x_2$ ≤ {mathLPResult.tortillaStock} pzas</span>
                <span className="text-slate-500">(Comal disponible: {mathLPResult.tortillaStock} pza)</span>
              </div>
            </div>
          </div>

          {/* LP Optimal Output Area */}
          <div className="mt-4 bg-emerald-950/40 border border-emerald-500/20 rounded-lg p-3 text-emerald-100 flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Punto Óptimo Encontrado (Vértice Maximizado)</div>
              <div className="text-lg font-bold text-white mt-1">
                {Math.floor(mathLPResult.optimalVertex.x1)} Combos Pastor ({Math.floor(mathLPResult.optimalVertex.x1 * 4)} tortillas)<br/>
                {Math.floor(mathLPResult.optimalVertex.x2)} Combos Asada ({Math.floor(mathLPResult.optimalVertex.x2 * 6)} tortillas)
              </div>
            </div>
            <div className="text-right border-l border-emerald-500/20 pl-4">
              <div className="text-[10px] font-mono text-emerald-400">UTILIDAD MAXIMA ($Z^*$)</div>
              <span className="text-2xl font-black text-emerald-400">${mathLPResult.optimalVertex.profit.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Module B: Demand Regression Forecast */}
        <div className="bg-slate-800/80 rounded-xl p-5 border border-cyan-500/20 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="text-cyan-500 w-5 h-5" />
                Modelado de Regresión y Demanda Temporal
              </h3>
              <span className="text-xs text-cyan-400 font-mono">Regresión Lineal Simple</span>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Calculamos la tendencia de flujo de ventas sobre el rango de horario pico (1pm a 10pm) analizando la 
              pendiente promedio por mínimos cuadrados para estimar horas con mayor demanda.
            </p>

            {/* Regression Calculations */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-4 text-slate-300">
              <div className="bg-slate-900 p-2.5 rounded border border-slate-700">
                <div className="text-[10px] text-cyan-400 uppercase">Ecuación Pendiente ($y = \beta_1 x + \beta_0$)</div>
                <div className="text-sm font-bold text-white mt-1">
                  y = {regressionResult.slope.toFixed(2)}x + {regressionResult.intercept.toFixed(2)}
                </div>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-700">
                <div className="text-[10px] text-cyan-400 uppercase">Coeficiente Correlación ($R$)</div>
                <div className="text-sm font-bold text-white mt-1 flex items-center gap-1">
                  r = {regressionResult.rValue.toFixed(4)}
                  <span className={`text-[10px] px-1 py-0.2 rounded font-semibold ${
                    Math.abs(regressionResult.rValue) > 0.7 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {Math.abs(regressionResult.rValue) > 0.7 ? 'Fuerte' : 'Moderada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Forecast Tool */}
            <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-850">
              <div className="text-[10px] text-cyan-400 uppercase font-mono font-bold">Proyección por Interpolación / Extrapolación:</div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400">A las 8:00 PM:</span>
                  <p className="font-bold text-white">${(regressionResult.slope * 20 + regressionResult.intercept).toFixed(2)} MXN</p>
                </div>
                <div>
                  <span className="text-slate-400">A las 10:00 PM:</span>
                  <p className="font-bold text-white">${(regressionResult.slope * 22 + regressionResult.intercept).toFixed(2)} MXN</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2 bg-cyan-950/40 border border-cyan-500/20 rounded-lg text-xs leading-relaxed text-slate-300">
            <span className="text-cyan-400 font-bold block mb-1">💡 Conclusión Estadística:</span>
            {regressionResult.slope > 0 ? (
              <span>Las ventas tienen una tendencia <b className="text-emerald-400">positiva</b> (creciente) de <b>${regressionResult.slope.toFixed(2)} pesos</b> por hora adicional de operación vespertina. Excelente para planear horarios de asado.</span>
            ) : (
              <span>Las ventas tienden a estabilizarse o disminuir hacia el final de la noche. Se recomienda optimizar el encendido de carbón temprano.</span>
            )}
          </div>
        </div>

      </div>

      {/* Matrix Multiplication Panel */}
      <div className="bg-slate-800/60 border border-slate-700/65 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
          <Layers className="text-emerald-500 w-5 h-5" />
          Álgebra de Producción: Insumo-Producto Matricial
        </h3>
        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          En un comal real, el consumo de materia prima se representa algebraicamente como una sustracción matricial:{' '}
          <code className="text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded">I_final = I_inicial - [C] x [Q]</code>. 
          Donde <code className="text-emerald-400 font-bold bg-slate-950 px-1 rounded">[C]</code> es la matriz de recetas y 
          <code className="text-emerald-400 font-bold bg-slate-950 px-1 rounded">[Q]</code> es el vector columna de productos ordenados.
        </p>

        {/* Matrix Graphic */}
        <div className="overflow-x-auto">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-center bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs">
            {/* Column Matrix (Initial) */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 mb-1">Matriz Recetas [C]</span>
              <div className="border-l border-r-2 border-slate-600 px-2 text-center text-[11px] space-y-1.5 py-2">
                <div>Pastor: [30g, 1t, 10g, 5g]</div>
                <div>Asada: [40g, 1.5t, 8g, 5g]</div>
                <div>Campechano: [20g, 1t, 8g, 5g]</div>
              </div>
            </div>

            <div className="text-slate-500 font-bold text-lg select-none">✕</div>

            {/* Vector Column Q */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-cyan-400 mb-1">Ventas [Q]</span>
              <div className="border-l-2 border-r-2 border-cyan-500 px-4 text-center py-2 text-white font-bold space-y-1 bg-cyan-950/20">
                <div>[{matrixCalculation.pastorSold}] Pastor</div>
                <div>[{matrixCalculation.asadaSold}] Asada</div>
                <div>[{matrixCalculation.campechanoSold}] Camp.</div>
              </div>
            </div>

            <div className="text-slate-500 font-bold text-lg select-none">＝</div>

            {/* Result Vector Column */}
            <div className="flex flex-col items-center w-full md:w-auto">
              <span className="text-[10px] text-emerald-400 mb-1">Cálculo de Consumo Total [C x Q]</span>
              <div className="border-l-2 border-r border-emerald-500/80 px-2 text-slate-200 py-1 space-y-1.5 w-full">
                {matrixCalculation.consumptionMatrix.map((item, index) => (
                  <div key={index} className="flex justify-between gap-6">
                    <span className="text-slate-400">{item.ingredient}:</span>
                    <span className="text-emerald-400 font-bold">{item.total.toLocaleString()} {item.ingredient.includes('Tortilla') ? 'pzas' : 'g'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 italic">
          <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Este cálculo permite al Administrador planear la cadena de suministro exacta basándose en el vector de demanda sin merma.</span>
        </div>
      </div>
      
    </div>
  );
}
