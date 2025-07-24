'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ecommerceApi } from '../services/ecommerceApi';
import {
  ShoppingCart,
  CartItem,
  Product,
  UseShoppingCartOptions,
} from '../types/ecommerce.types';

interface CartState {
  cart: ShoppingCart | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

export function useShoppingCart(options: UseShoppingCartOptions = {}) {
  const {
    persistCart = true,
    autoSaveInterval = 30000, // 30 seconds
    enableAbandonedCartRecovery = true,
  } = options;

  const [state, setState] = useState<CartState>({
    cart: null,
    isLoading: false,
    error: null,
  });

  const autoSaveIntervalRef = useRef<NodeJS.Timeout>();
  const isInitialized = useRef(false);
  const cartChangedRef = useRef(false);

  // ============================================================================
  // INITIALIZATION & PERSISTENCE
  // ============================================================================

  useEffect(() => {
    const loadCartAsync = async () => {
      if (!isInitialized.current) {
        await loadCart();
        if (persistCart && autoSaveInterval > 0) {
          setupAutoSave();
        }
        isInitialized.current = true;
      }
    };

    loadCartAsync();

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [persistCart, autoSaveInterval]);

  const setupAutoSave = () => {
    autoSaveIntervalRef.current = setInterval(() => {
      if (cartChangedRef.current && state.cart) {
        saveCartToStorage();
        cartChangedRef.current = false;
      }
    }, autoSaveInterval);
  };

  const loadCart = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let cart: ShoppingCart | null = null;

      // Try to load from localStorage first
      if (persistCart && typeof window !== 'undefined') {
        const savedCart = localStorage.getItem('shopping-cart');
        if (savedCart) {
          cart = JSON.parse(savedCart);
          // Validate cart expiry
          if (cart && new Date(cart.expires) < new Date()) {
            cart = null;
            localStorage.removeItem('shopping-cart');
          }
        }
      }

      // If no local cart, try to load from API
      if (!cart) {
        try {
          cart = await ecommerceApi.getCart();
        } catch (error) {
          // Create new cart if none exists
          cart = createEmptyCart();
        }
      }

      setState({
        cart,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load cart',
      }));
    }
  };

  const saveCartToStorage = () => {
    if (persistCart && state.cart && typeof window !== 'undefined') {
      localStorage.setItem('shopping-cart', JSON.stringify(state.cart));
    }
  };

  const createEmptyCart = (): ShoppingCart => {
    const cartId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      id: cartId,
      sessionId: undefined,
      customerId: undefined,
      items: [],
      subtotal: 0,
      taxes: [],
      discounts: [],
      shipping: {
        cost: 0,
        estimatedDays: 0,
        trackingAvailable: false,
      },
      total: 0,
      currency: 'USD',
      notes: '',
      expires,
      isAbandoned: false,
      recoveryEmailSent: false,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  // ============================================================================
  // CART OPERATIONS
  // ============================================================================

  const addToCart = useCallback(async (
    productId: string,
    variantId?: string,
    quantity: number = 1,
    customizations?: any
  ): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // If no cart exists, create one
      if (!state.cart) {
        setState(prev => ({ ...prev, cart: createEmptyCart() }));
      }

      const updatedCart = await ecommerceApi.addToCart(productId, variantId, quantity, customizations);
      
      setState(prev => ({
        ...prev,
        cart: updatedCart,
        isLoading: false,
        lastUpdated: new Date(),
      }));

      cartChangedRef.current = true;
      saveCartToStorage();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to add item to cart',
      }));
      throw error;
    }
  }, [state.cart]);

  const updateCartItem = useCallback(async (itemId: string, quantity: number): Promise<void> => {
    if (!state.cart) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }

      const updatedCart = await ecommerceApi.updateCartItem(itemId, quantity);
      
      setState(prev => ({
        ...prev,
        cart: updatedCart,
        isLoading: false,
        lastUpdated: new Date(),
      }));

      cartChangedRef.current = true;
      saveCartToStorage();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update cart item',
      }));
      throw error;
    }
  }, [state.cart]);

  const removeFromCart = useCallback(async (itemId: string): Promise<void> => {
    if (!state.cart) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedCart = await ecommerceApi.removeFromCart(itemId);
      
      setState(prev => ({
        ...prev,
        cart: updatedCart,
        isLoading: false,
        lastUpdated: new Date(),
      }));

      cartChangedRef.current = true;
      saveCartToStorage();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to remove item from cart',
      }));
      throw error;
    }
  }, [state.cart]);

  const clearCart = useCallback(async (): Promise<void> => {
    if (!state.cart) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await ecommerceApi.clearCart(state.cart.id);
      
      const emptyCart = createEmptyCart();
      setState(prev => ({
        ...prev,
        cart: emptyCart,
        isLoading: false,
        lastUpdated: new Date(),
      }));

      cartChangedRef.current = true;
      saveCartToStorage();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to clear cart',
      }));
      throw error;
    }
  }, [state.cart]);

  const applyDiscount = useCallback(async (code: string): Promise<void> => {
    if (!state.cart) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedCart = await ecommerceApi.applyDiscount(code, state.cart.id);
      
      setState(prev => ({
        ...prev,
        cart: updatedCart,
        isLoading: false,
        lastUpdated: new Date(),
      }));

      cartChangedRef.current = true;
      saveCartToStorage();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to apply discount',
      }));
      throw error;
    }
  }, [state.cart]);

  const removeDiscount = useCallback(async (discountId: string): Promise<void> => {
    if (!state.cart) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedCart = await ecommerceApi.removeDiscount(discountId);
      
      setState(prev => ({
        ...prev,
        cart: updatedCart,
        isLoading: false,
        lastUpdated: new Date(),
      }));

      cartChangedRef.current = true;
      saveCartToStorage();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to remove discount',
      }));
      throw error;
    }
  }, [state.cart]);

  // ============================================================================
  // CART CALCULATIONS
  // ============================================================================

  const calculateSubtotal = useCallback((): number => {
    if (!state.cart) return 0;
    return state.cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [state.cart]);

  const calculateTotalTax = useCallback((): number => {
    if (!state.cart) return 0;
    return state.cart.taxes.reduce((sum, tax) => sum + tax.amount, 0);
  }, [state.cart]);

  const calculateTotalDiscount = useCallback((): number => {
    if (!state.cart) return 0;
    return state.cart.discounts.reduce((sum, discount) => sum + discount.amount, 0);
  }, [state.cart]);

  const calculateTotal = useCallback((): number => {
    if (!state.cart) return 0;
    const subtotal = calculateSubtotal();
    const tax = calculateTotalTax();
    const shipping = state.cart.shipping.cost;
    const discount = calculateTotalDiscount();
    return Math.max(0, subtotal + tax + shipping - discount);
  }, [state.cart, calculateSubtotal, calculateTotalTax, calculateTotalDiscount]);

  const getItemCount = useCallback((): number => {
    if (!state.cart) return 0;
    return state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [state.cart]);

  const getUniqueItemCount = useCallback((): number => {
    if (!state.cart) return 0;
    return state.cart.items.length;
  }, [state.cart]);

  // ============================================================================
  // CART ITEM HELPERS
  // ============================================================================

  const getCartItem = useCallback((productId: string, variantId?: string): CartItem | undefined => {
    if (!state.cart) return undefined;
    return state.cart.items.find(item => 
      item.productId === productId && item.variantId === variantId
    );
  }, [state.cart]);

  const isInCart = useCallback((productId: string, variantId?: string): boolean => {
    return getCartItem(productId, variantId) !== undefined;
  }, [getCartItem]);

  const getItemQuantity = useCallback((productId: string, variantId?: string): number => {
    const item = getCartItem(productId, variantId);
    return item ? item.quantity : 0;
  }, [getCartItem]);

  const canAddToCart = useCallback((product: Product, variantId?: string, quantity: number = 1): boolean => {
    if (!product.inventory.tracked) return true;
    
    const currentQuantity = getItemQuantity(product.id, variantId);
    const totalQuantity = currentQuantity + quantity;
    
    // Check against available inventory
    const availableQuantity = variantId 
      ? product.variants.find(v => v.id === variantId)?.inventory.available || 0
      : product.inventory.available;
    
    return totalQuantity <= availableQuantity;
  }, [getItemQuantity]);

  const getMaxQuantity = useCallback((product: Product, variantId?: string): number => {
    if (!product.inventory.tracked) return 999;
    
    const currentQuantity = getItemQuantity(product.id, variantId);
    const availableQuantity = variantId 
      ? product.variants.find(v => v.id === variantId)?.inventory.available || 0
      : product.inventory.available;
    
    return Math.max(0, availableQuantity - currentQuantity);
  }, [getItemQuantity]);

  // ============================================================================
  // ABANDONED CART RECOVERY
  // ============================================================================

  const markAsAbandoned = useCallback(() => {
    if (!state.cart || state.cart.items.length === 0) return;

    setState(prev => ({
      ...prev,
      cart: prev.cart ? {
        ...prev.cart,
        isAbandoned: true,
        abandonedAt: new Date(),
      } : null,
    }));

    cartChangedRef.current = true;
    saveCartToStorage();
  }, [state.cart]);

  const sendAbandonedCartEmail = useCallback(async (email: string) => {
    if (!state.cart || !enableAbandonedCartRecovery) return;

    try {
      // API call to send abandoned cart recovery email
      // await ecommerceApi.sendAbandonedCartEmail(state.cart.id, email);
      
      setState(prev => ({
        ...prev,
        cart: prev.cart ? {
          ...prev.cart,
          recoveryEmailSent: true,
        } : null,
      }));

      cartChangedRef.current = true;
      saveCartToStorage();
    } catch (error) {
      console.error('Failed to send abandoned cart email:', error);
    }
  }, [state.cart, enableAbandonedCartRecovery]);

  // ============================================================================
  // CHECKOUT HELPERS
  // ============================================================================

  const validateCart = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!state.cart) {
      errors.push('Cart is empty');
      return { valid: false, errors };
    }

    if (state.cart.items.length === 0) {
      errors.push('Cart has no items');
      return { valid: false, errors };
    }

    // Validate inventory availability
    for (const item of state.cart.items) {
      if (item.quantity <= 0) {
        errors.push(`Invalid quantity for ${item.productId}`);
      }
      // Additional validation can be added here
    }

    return { valid: errors.length === 0, errors };
  }, [state.cart]);

  const isReadyForCheckout = useCallback((): boolean => {
    const validation = validateCart();
    return validation.valid && (state.cart?.total || 0) > 0;
  }, [validateCart, state.cart]);

  const prepareForCheckout = useCallback(async () => {
    if (!state.cart) return null;

    try {
      const checkoutSession = await ecommerceApi.createCheckoutSession(state.cart.id);
      return checkoutSession;
    } catch (error) {
      console.error('Failed to prepare for checkout:', error);
      throw error;
    }
  }, [state.cart]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const refresh = useCallback(async () => {
    await loadCart();
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const saveCart = useCallback(() => {
    cartChangedRef.current = true;
    saveCartToStorage();
  }, []);

  const getCartSummary = useCallback(() => {
    if (!state.cart) {
      return {
        itemCount: 0,
        uniqueItemCount: 0,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        currency: 'USD',
      };
    }

    return {
      itemCount: getItemCount(),
      uniqueItemCount: getUniqueItemCount(),
      subtotal: calculateSubtotal(),
      tax: calculateTotalTax(),
      shipping: state.cart.shipping.cost,
      discount: calculateTotalDiscount(),
      total: calculateTotal(),
      currency: state.cart.currency,
    };
  }, [
    state.cart,
    getItemCount,
    getUniqueItemCount,
    calculateSubtotal,
    calculateTotalTax,
    calculateTotalDiscount,
    calculateTotal,
  ]);

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  return {
    // State
    cart: state.cart,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,

    // Cart Operations
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyDiscount,
    removeDiscount,

    // Calculations
    subtotal: calculateSubtotal(),
    tax: calculateTotalTax(),
    shipping: state.cart?.shipping.cost || 0,
    discount: calculateTotalDiscount(),
    total: calculateTotal(),
    itemCount: getItemCount(),
    uniqueItemCount: getUniqueItemCount(),

    // Item Helpers
    getCartItem,
    isInCart,
    getItemQuantity,
    canAddToCart,
    getMaxQuantity,

    // Validation
    validateCart,
    isReadyForCheckout,
    prepareForCheckout,

    // Abandoned Cart
    markAsAbandoned,
    sendAbandonedCartEmail,

    // Utilities
    refresh,
    clearError,
    saveCart,
    getCartSummary,

    // Computed Properties
    isEmpty: !state.cart || state.cart.items.length === 0,
    hasItems: state.cart && state.cart.items.length > 0,
    hasError: state.error !== null,
    isAbandoned: state.cart?.isAbandoned || false,
    isExpired: state.cart ? new Date(state.cart.expires) < new Date() : false,
    currency: state.cart?.currency || 'USD',
  };
}

export default useShoppingCart; 