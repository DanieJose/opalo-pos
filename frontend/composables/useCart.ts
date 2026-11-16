export interface CartItem {
  variante_id: number;
  producto_id: number;
  producto_nombre: string;
  imagen_url?: string | null;
  talla: string;
  color: string;
  sku: string;
  precio_unitario: number;
  descuento_unitario?: number;
  cantidad: number;
  descuento: number;
  subtotal: number;
  total_linea?: number;
  stock_disponible: number;
  tipo_impuesto?: 'ISV_15' | 'ISV_18' | 'EXENTO';
  precio_incluye_isv?: boolean;
}

export const useCart = () => {
  const items = useState<CartItem[]>('pos_cart_items', () => []);
  const customer = useState<any | null>('pos_cart_customer', () => null);

  const subtotalGravado15 = computed(() => {
    const raw = items.value.reduce((acc, item) => {
      if (item.tipo_impuesto === 'EXENTO') return acc;
      const totalCobrado = (item.precio_unitario * item.cantidad) - item.descuento;
      const base = item.precio_incluye_isv 
        ? parseFloat((totalCobrado / 1.15).toFixed(2)) 
        : totalCobrado;
      return acc + base;
    }, 0);
    return parseFloat(raw.toFixed(2));
  });

  // Requerimiento SAR: Subtotal Gravable (18%) e ISV (18%) siempre en 0
  const subtotalGravado18 = computed(() => {
    return 0.00;
  });

  const subtotalExento = computed(() => {
    const raw = items.value.reduce((acc, item) => {
      if (item.tipo_impuesto === 'EXENTO') {
        return acc + ((item.precio_unitario * item.cantidad) - item.descuento);
      }
      return acc;
    }, 0);
    return parseFloat(raw.toFixed(2));
  });

  const subtotal = computed(() => {
    return parseFloat((subtotalGravado15.value + subtotalExento.value).toFixed(2));
  });

  const isv15 = computed(() => {
    const raw = items.value.reduce((acc, item) => {
      if (item.tipo_impuesto === 'EXENTO') return acc;
      const totalCobrado = (item.precio_unitario * item.cantidad) - item.descuento;
      if (item.precio_incluye_isv) {
        const base = parseFloat((totalCobrado / 1.15).toFixed(2));
        return acc + (totalCobrado - base);
      } else {
        return acc + parseFloat((totalCobrado * 0.15).toFixed(2));
      }
    }, 0);
    return parseFloat(raw.toFixed(2));
  });

  // Requerimiento SAR: ISV (18%) siempre en 0.00
  const isv18 = computed(() => {
    return 0.00;
  });

  const hasIsv18 = computed(() => {
    return false;
  });

  // Total ISV consolidado para compatibilidad
  const isv = computed(() => {
    return parseFloat((isv15.value + isv18.value).toFixed(2));
  });

  const totalDescuento = computed(() => {
    const raw = items.value.reduce((acc, item) => acc + (item.descuento || 0), 0);
    return parseFloat(raw.toFixed(2));
  });

  const total = computed(() => {
    return parseFloat((subtotal.value + isv.value).toFixed(2));
  });

  const totalItemsCount = computed(() => {
    return items.value.reduce((acc, item) => acc + item.cantidad, 0);
  });

  const addItem = (variante: any, producto: any, cantidad = 1) => {
    const existingIndex = items.value.findIndex((i) => i.variante_id === variante.id);
    const precioBase = parseFloat(variante.precio_venta || producto.precio_base || 0);
    const precioIncluyeIsv = Boolean(
      variante.precio_incluye_isv !== undefined 
        ? variante.precio_incluye_isv 
        : producto.precio_incluye_isv
    );

    // Calcular descuento unitario configurado en el producto o variante (solo si aplica_descuento está activado)
    let descuentoUnitario = 0;
    const hasDiscount = Boolean(producto.aplica_descuento);

    if (hasDiscount) {
      const pct = parseFloat(variante.descuento_porcentaje || producto.descuento_porcentaje || 0);
      if (pct > 0) {
        descuentoUnitario = parseFloat((precioBase * (pct / 100)).toFixed(2));
      } else if (variante.precio_con_descuento) {
        const finalPrice = parseFloat(variante.precio_con_descuento);
        if (finalPrice > 0 && finalPrice < precioBase) {
          descuentoUnitario = parseFloat((precioBase - finalPrice).toFixed(2));
        }
      } else if (producto.precio_con_descuento) {
        const finalPrice = parseFloat(producto.precio_con_descuento);
        if (finalPrice > 0 && finalPrice < precioBase) {
          descuentoUnitario = parseFloat((precioBase - finalPrice).toFixed(2));
        }
      }
    }

    if (existingIndex > -1) {
      const currentItem = items.value[existingIndex];
      const nuevaCantidad = currentItem.cantidad + cantidad;

      if (nuevaCantidad > variante.stock) {
        return {
          success: false,
          message: `Stock máximo alcanzado para ${variante.talla} / ${variante.color}. Disponibles: ${variante.stock}`
        };
      }

      currentItem.cantidad = nuevaCantidad;
      const descUnit = currentItem.descuento_unitario !== undefined ? currentItem.descuento_unitario : descuentoUnitario;
      currentItem.descuento = descUnit * currentItem.cantidad;
      const totalCobrado = (currentItem.precio_unitario * currentItem.cantidad) - currentItem.descuento;
      currentItem.total_linea = totalCobrado;
      currentItem.subtotal = currentItem.precio_incluye_isv 
        ? parseFloat((totalCobrado / 1.15).toFixed(2)) 
        : totalCobrado;
      return { success: true };
    }

    if (variante.stock < cantidad) {
      return {
        success: false,
        message: `No hay suficiente stock disponible. Disponibles: ${variante.stock}`
      };
    }

    const totalItemDiscount = descuentoUnitario * cantidad;
    const totalCobrado = (precioBase * cantidad) - totalItemDiscount;
    const itemSubtotal = precioIncluyeIsv 
      ? parseFloat((totalCobrado / 1.15).toFixed(2)) 
      : totalCobrado;

    items.value.push({
      variante_id: variante.id,
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      imagen_url: producto.imagen_url || null,
      talla: variante.talla,
      color: variante.color,
      sku: variante.sku,
      precio_unitario: precioBase,
      descuento_unitario: descuentoUnitario,
      cantidad,
      descuento: totalItemDiscount,
      subtotal: itemSubtotal,
      total_linea: totalCobrado,
      stock_disponible: variante.stock,
      tipo_impuesto: producto.tipo_impuesto || 'ISV_15',
      precio_incluye_isv: precioIncluyeIsv
    });

    return { success: true };
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (index < 0 || index >= items.value.length) return;
    const item = items.value[index];

    if (newQty <= 0) {
      removeItem(index);
      return;
    }

    if (newQty > item.stock_disponible) {
      return {
        success: false,
        message: `Solo hay ${item.stock_disponible} unidades disponibles de este producto`
      };
    }

    const descUnit = item.descuento_unitario !== undefined ? item.descuento_unitario : 0;
    item.cantidad = newQty;
    item.descuento = descUnit * newQty;
    const totalCobrado = (item.precio_unitario * item.cantidad) - item.descuento;
    item.total_linea = totalCobrado;
    item.subtotal = item.precio_incluye_isv 
      ? parseFloat((totalCobrado / 1.15).toFixed(2)) 
      : totalCobrado;
    return { success: true };
  };

  const updateDiscount = (index: number, newDiscount: number) => {
    if (index < 0 || index >= items.value.length) return;
    const item = items.value[index];
    const maxDiscount = item.precio_unitario * item.cantidad;
    const validDiscount = Math.max(0, Math.min(newDiscount, maxDiscount));
    item.descuento = parseFloat(validDiscount.toFixed(2));
    item.descuento_unitario = item.cantidad > 0 ? parseFloat((item.descuento / item.cantidad).toFixed(2)) : 0;
    const totalCobrado = (item.precio_unitario * item.cantidad) - item.descuento;
    item.total_linea = totalCobrado;
    item.subtotal = item.precio_incluye_isv 
      ? parseFloat((totalCobrado / 1.15).toFixed(2)) 
      : totalCobrado;
  };

  const removeItem = (index: number) => {
    if (index >= 0 && index < items.value.length) {
      items.value.splice(index, 1);
    }
  };

  const clearCart = () => {
    items.value = [];
    customer.value = null;
  };

  const setCustomer = (newCustomer: any) => {
    customer.value = newCustomer;
  };

  return {
    items,
    customer,
    subtotal,
    isv,
    isv15,
    isv18,
    hasIsv18,
    subtotalGravado15,
    subtotalGravado18,
    subtotalExento,
    totalDescuento,
    total,
    totalItemsCount,
    addItem,
    updateQuantity,
    updateDiscount,
    removeItem,
    clearCart,
    setCustomer
  };
};

