import { getOrderingContext, getOrder, submitOrder, orderEstimate, orderRequestKey, parseTableQR, OrderingContext } from '../lib/orderService';
import AsyncStorage from '@react-native-async-storage/async-storage';
/**
 * Order Screen - Customer Ordering
 * Path: screens/OrderScreen.tsx
 *
 * Features:
 * - Shows menu items with "+" add buttons
 * - Floating cart button with count badge
 * - Bottom sheet cart with quantity controls, item notes, special requests
 * - Table QR fills the table number; authenticated order submission is explicit
 * - After order: real-time status tracker (Pending > Confirmed > Preparing > Ready > Served)
 * - Uses Supabase realtime subscription for status updates
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../lib/supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_label: string | null;
  image_url: string | null;
  is_popular: boolean;
  is_new: boolean;
  dietary_tags: string[] | null;
  category_id: string;
  category_name?: string;
  meal_period?: string | null;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  meal_period: string | null;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total: number;
  cancel_reason?: string | null;
}

type MealPeriod = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'all_day';

type RouteParams = {
  Order: {
    placeId: string;
    placeName?: string;
    tableNumber?: string;
  };
};

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'served'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Sent',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
};
const STATUS_ICONS: Record<string, string> = {
  pending: '\u{1F4E4}',
  confirmed: '\u2705',
  preparing: '\u{1F468}\u200D\u{1F373}',
  ready: '\u{1F514}',
  served: '\u{1F37D}\uFE0F',
};

const PERIOD_LABELS: Record<MealPeriod, string> = {
  all: 'All',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  all_day: 'All Day',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function OrderScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'Order'>>();
  const { placeId, placeName: initialPlaceName, tableNumber: routeTableNumber } = route.params;
  const [tableNumber,setTableNumber]=useState(routeTableNumber || '');
  const [orderingContext,setOrderingContext]=useState<OrderingContext|null>(null);
  const [orderError,setOrderError]=useState('');
  const [signedIn,setSignedIn]=useState(false);
  const requestRef=useRef<{fingerprint:string;key:string}|null>(null);
  const postingRef=useRef(false);

  // Menu state
  const [placeName, setPlaceName] = useState(initialPlaceName || '');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<MealPeriod>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHydrated,setCartHydrated]=useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');

  // Order state
  const [placingOrder, setPlacingOrder] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderView, setOrderView] = useState(false);
  const [showQrScan, setShowQrScan] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const openTableScanner = async () => { const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission(); if(permission.granted)setShowQrScan(true);else setOrderError('Camera access is unavailable. Enter your table number instead.'); };

  // Realtime subscription ref
  const subscriptionRef = useRef<any>(null);

  // ─── Load Menu ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (placeId) loadMenu(placeId);
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [placeId]);

  const loadMenu = async (pid: string) => {
    setLoading(true);setCartHydrated(false);setCart([]);setOrderError('');
    try {
      if (pid==='demo-trattoria') { navigation.navigate('DemoRestaurant' as never); return; }
      const {data:{user}}=await supabase.auth.getUser();setSignedIn(!!user);
      // Tracking an existing order does not depend on an available menu.
      try{const activeId=await AsyncStorage.getItem(`tavvy:active-order:${pid}`);if(activeId&&user){const restored=await getOrder(activeId);setOrder(restored);setOrderView(true);subscribeToOrder(restored.id)}}catch{}
      const context=await getOrderingContext(pid,tableNumber);setOrderingContext(context);if(!context.ready)setOrderError('Ordering is unavailable. Please ask the restaurant.');
      const { data: placeData } = await supabase
        .from('places')
        .select('name')
        .eq('id', pid)
        .maybeSingle();
      if (placeData && !initialPlaceName) setPlaceName(placeData.name || '');

      const { data: menuData } = await supabase
        .from('menus')
        .select('id')
        .eq('place_id', pid)
        .eq('is_active',true).order('created_at',{ascending:false}).limit(1)
        .maybeSingle();

      if (!menuData) {
        setLoading(false);
        return;
      }

      const { data: categoriesData } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('menu_id', menuData.id)
        .order('sort_order', { ascending: true });

      if (categoriesData && categoriesData.length > 0) {
        setCategories(categoriesData);
        const categoryIds = categoriesData.map((c: MenuCategory) => c.id);

        const { data: itemsData } = await supabase
          .from('menu_items')
          .select('*')
          .in('category_id', categoryIds)
          .eq('is_available',true).not('price','is',null)
          .order('sort_order', { ascending: true });

        if (itemsData) {
          const catMap: Record<string, MenuCategory> = {};
          categoriesData.forEach((c: MenuCategory) => { catMap[c.id] = c; });

          const enrichedItems: MenuItem[] = itemsData.map((item: any) => ({
            ...item,
            category_name: catMap[item.category_id]?.name || '',
            meal_period: catMap[item.category_id]?.meal_period || null,
          }));
          setAllItems(enrichedItems);
          try { const saved=JSON.parse(await AsyncStorage.getItem(`tavvy:order-cart:${pid}`)||'null');if(Array.isArray(saved?.cart))setCart(saved.cart.flatMap((line:any)=>{const item=enrichedItems.find(row=>row.id===line.menuItem?.id);return item?[{menuItem:item,quantity:Math.min(20,Math.max(1,Number(line.quantity)||1)),notes:String(line.notes||'').slice(0,500)}]:[]}));if(saved?.notes)setSpecialRequests(String(saved.notes).slice(0,1000));if(saved?.tableNumber&&!routeTableNumber)setTableNumber(String(saved.tableNumber).slice(0,32));}catch{}
          setCartHydrated(true);

        }
      }
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Menu unavailable. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Cart Operations ────────────────────────────────────────────────────────

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map(ci =>
          ci.menuItem.id === item.id
            ? { ...ci, quantity: Math.min(20,ci.quantity + 1) }
            : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(ci => {
        if (ci.menuItem.id === itemId) {
          const newQty = Math.min(20,ci.quantity + delta);
          return newQty <= 0 ? null : { ...ci, quantity: newQty };
        }
        return ci;
      }).filter(Boolean) as CartItem[];
    });
  }, []);

  const updateItemNotes = useCallback((itemId: string, notes: string) => {
    setCart(prev =>
      prev.map(ci =>
        ci.menuItem.id === itemId ? { ...ci, notes } : ci
      )
    );
  }, []);

  const estimate=orderEstimate(cart.map(ci=>({price:ci.menuItem.price,quantity:ci.quantity})),orderingContext?.taxBasisPoints??null);
  const cartTotal=estimate.subtotal,cartCount=cart.reduce((sum,ci)=>sum+ci.quantity,0),taxAmount=estimate.tax??0,orderTotal=estimate.total??cartTotal;
  useEffect(()=>{if(cartHydrated&&!loading&&placeId!=='demo-trattoria')void AsyncStorage.setItem(`tavvy:order-cart:${placeId}`,JSON.stringify({cart,notes:specialRequests,tableNumber})).catch(()=>{});},[cart,specialRequests,tableNumber,cartHydrated,loading,placeId]);
  useEffect(()=>{const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setSignedIn(!!session?.user));return()=>subscription.unsubscribe()},[]);
  useEffect(()=>{if(!order?.id)return;const timer=setInterval(()=>{getOrder(order.id).then(setOrder).catch(()=>setOrderError('Order status is temporarily unavailable. We will keep trying.'))},15000);return()=>clearInterval(timer)},[order?.id]);

  // ─── Place Order ────────────────────────────────────────────────────────────

  const handlePlaceOrder = () => { void placeOrder(); };
  const placeOrder = async (tableOverride?: string) => {
    if (!cart.length || !placeId || postingRef.current || placeId==='demo-trattoria') return;
    postingRef.current=true;setPlacingOrder(true);setOrderError('');
    try {
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){Alert.alert('Sign in to order','Your cart will be kept.',[{text:'Cancel',style:'cancel'},{text:'Sign in',onPress:()=>navigation.navigate('Login' as never)}]);return}
      const selectedTable=tableOverride||tableNumber,context=await getOrderingContext(placeId,selectedTable);setOrderingContext(context);
      if(!context.ready||!context.tableValid)throw new Error(context.ready?'Confirm your active table number with the restaurant.':'Ordering is unavailable. Please ask the restaurant.');
      const draft={placeId,tableNumber:selectedTable,items:cart.map(ci=>({menu_item_id:ci.menuItem.id,quantity:ci.quantity,notes:ci.notes})),notes:specialRequests,customerName:'',expectedTotal:orderTotal};
      const fingerprint=JSON.stringify(draft);
      if(requestRef.current?.fingerprint!==fingerprint){let saved:any=null;try{saved=JSON.parse(await AsyncStorage.getItem(`tavvy:order-request:${placeId}`)||'null')}catch{}requestRef.current=saved?.fingerprint===fingerprint?saved:{fingerprint,key:orderRequestKey()};await AsyncStorage.setItem(`tavvy:order-request:${placeId}`,JSON.stringify(requestRef.current))}
      const orderData=await submitOrder(draft,requestRef.current!.key);
      try { await AsyncStorage.setItem(`tavvy:active-order:${placeId}`,orderData.id);await AsyncStorage.removeItem(`tavvy:order-request:${placeId}`); } catch {} requestRef.current=null;
      setOrder(orderData);setOrderView(true);setCartOpen(false);setCart([]);setSpecialRequests('');subscribeToOrder(orderData.id);
    }catch(error){setOrderError(error instanceof Error?error.message:'Order could not be sent. Retry with the same cart.')}
    finally{setPlacingOrder(false);postingRef.current=false}
  };

  // ─── Realtime Subscription ──────────────────────────────────────────────────

  const subscribeToOrder = (orderId: string) => {
    if(subscriptionRef.current)void supabase.removeChannel(subscriptionRef.current);
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload: any) => {
          const updated = payload.new as Order;
          setOrder(updated);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  // ─── QR Scan Handler ────────────────────────────────────────────────────────

  const handleBarCodeScanned = (result: { data: string }) => {
    const scannedTable=parseTableQR(result.data,placeId);
    if(!scannedTable){Alert.alert('Invalid table QR','Scan the Tavvy ordering QR code for this restaurant.');return}
    setTableNumber(scannedTable);setShowQrScan(false);setOrderError('');
  };

  // ─── Filtered Items ─────────────────────────────────────────────────────────

  const filteredItems = allItems.filter(item => {
    if (activePeriod !== 'all') {
      if (item.meal_period !== activePeriod && item.meal_period !== 'all_day' && item.meal_period !== null) {
        return false;
      }
    }
    if (activeCategory !== 'all') {
      if (item.category_id !== activeCategory) return false;
    }
    return true;
  });

  const availablePeriods: MealPeriod[] = ['all'];
  const periodsInData = new Set(categories.map(c => c.meal_period).filter(Boolean));
  if (periodsInData.has('dinner')) availablePeriods.push('dinner');
  if (periodsInData.has('lunch')) availablePeriods.push('lunch');
  if (periodsInData.has('breakfast')) availablePeriods.push('breakfast');

  // ─── Format Price ───────────────────────────────────────────────────────────

  const formatPrice = (price: number | null, priceLabel: string | null): string => {
    if (priceLabel) return priceLabel;
    if (price === null || price === undefined) return '';
    return `$${price.toFixed(2)}`;
  };

  // ─── Render Menu Item ───────────────────────────────────────────────────────

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const priceStr = formatPrice(item.price, item.price_label);
    const inCart = cart.find(ci => ci.menuItem.id === item.id);

    return (
      <View style={styles.menuItem}>
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.menuItemImage} />
        )}
        <View style={styles.menuItemInfo}>
          <View style={styles.menuItemHeader}>
            <Text style={styles.menuItemName} numberOfLines={1}>{item.name}</Text>
            {item.is_popular && <Text style={styles.popularBadge}>Popular</Text>}
          </View>
          {item.description && (
            <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
          )}
          <Text style={styles.menuItemPrice}>{priceStr}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, inCart && styles.addButtonActive]}
          onPress={() => addToCart(item)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          {inCart && <Text style={styles.addButtonQty}>{inCart.quantity}</Text>}
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Order Status Tracker ───────────────────────────────────────────────────

  const renderOrderStatus = () => {
    if (!order) return null;
    const currentIndex = ORDER_STATUSES.indexOf(order.status);

    return (
      <View style={styles.statusContainer}>
        <SafeAreaView edges={['top']}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>{order.status==='cancelled'?'Order cancelled':`Order #${order.order_number}`}</Text>
            <Text style={styles.statusSubtitle}>{order.status==='cancelled'?order.cancel_reason:order.status==='pending'?'Wait for restaurant confirmation. Pay the restaurant directly.':'Payment is handled by the restaurant.'}</Text>
            <Text style={styles.statusSubtitle}>
              {tableNumber ? `Table ${tableNumber}` : ''}
            </Text>
          </View>

          <View style={styles.statusTracker}>
            {ORDER_STATUSES.map((status, index) => {
              const isActive = index <= currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <View key={status} style={styles.statusStep}>
                  <View style={[
                    styles.statusDot,
                    isActive && styles.statusDotActive,
                    isCurrent && styles.statusDotCurrent,
                  ]}>
                    <Text style={styles.statusIcon}>{STATUS_ICONS[status]}</Text>
                  </View>
                  <Text style={[
                    styles.statusLabel,
                    isActive && styles.statusLabelActive,
                  ]}>
                    {STATUS_LABELS[status]}
                  </Text>
                  {index < ORDER_STATUSES.length - 1 && (
                    <View style={[
                      styles.statusLine,
                      isActive && styles.statusLineActive,
                    ]} />
                  )}
                </View>
              );
            })}
          </View>

          {order.status === 'served' && (
            <View style={styles.servedMessage}>
              <Text style={styles.servedText}>Your order has been served. Enjoy!</Text>
              <TouchableOpacity
                style={styles.newOrderButton}
                onPress={() => {
                  setOrder(null);
                  void AsyncStorage.removeItem(`tavvy:active-order:${placeId}`).catch(()=>{});
                  setOrderView(false);
                }}
              >
                <Text style={styles.newOrderButtonText}>New Order</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.backToMenuButton}
            onPress={() => { setOrderView(false); }}
          >
            <Text style={styles.backToMenuText}>Back to Menu</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  };

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A05BE" />
      </View>
    );
  }

  // ─── Order View ─────────────────────────────────────────────────────────────

  if (orderView && order) {
    return renderOrderStatus();
  }

  // ─── QR Scanner Modal ───────────────────────────────────────────────────────

  const renderQrScanner = () => (
    <Modal visible={showQrScan} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.qrContainer}>
        <SafeAreaView style={styles.qrSafeArea}>
          <View style={styles.qrHeader}>
            <TouchableOpacity onPress={() => setShowQrScan(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.qrTitle}>Scan Table QR Code</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={styles.qrCameraContainer}>
            <CameraView
              style={styles.qrCamera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarCodeScanned}
            />
            <View style={styles.qrOverlay}>
              <View style={styles.qrFrame} />
            </View>
          </View>
          <Text style={styles.qrHint}>
            Point your camera at the QR code on your table
          </Text>
          {/* Manual bypass if needed */}
          <TouchableOpacity
            style={styles.qrSkipButton}
            onPress={() => setShowQrScan(false)}
          >
            <Text style={styles.qrSkipText}>Enter table number instead</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );

  // ─── Cart Bottom Sheet ──────────────────────────────────────────────────────

  const renderCart = () => (
    <Modal visible={cartOpen} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.cartContainer}
      >
        <SafeAreaView style={styles.cartSafeArea}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Your Order</Text>
            <TouchableOpacity onPress={() => setCartOpen(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
            {cart.map(ci => (
              <View key={ci.menuItem.id} style={styles.cartItem}>
                <View style={styles.cartItemTop}>
                  <Text style={styles.cartItemName} numberOfLines={1}>{ci.menuItem.name}</Text>
                  <Text style={styles.cartItemPrice}>
                    ${((ci.menuItem.price || 0) * ci.quantity).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.cartItemControls}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateQuantity(ci.menuItem.id, -1)}
                  >
                    <Ionicons name="remove" size={16} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{ci.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateQuantity(ci.menuItem.id, 1)}
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.itemNoteInput}
                  placeholder="Add a note..."
                  placeholderTextColor="#666"
                  maxLength={500}
                    value={ci.notes}
                  onChangeText={(text) => updateItemNotes(ci.menuItem.id, text)}
                />
              </View>
            ))}

            <View style={styles.specialRequestsSection}>
              <Text style={styles.specialRequestsLabel}>Table number</Text>
              <TextInput style={styles.itemNoteInput} value={tableNumber} onChangeText={setTableNumber} maxLength={32} placeholder="Ask your server for your table number" placeholderTextColor="#888" />
              <TouchableOpacity onPress={() => void openTableScanner()}><Text style={{color:'#CDA1FF',paddingVertical:12}}>Scan table QR code</Text></TouchableOpacity>
              {orderError ? <Text accessibilityRole="alert" style={{color:'#FCA5A5'}}>{orderError}</Text> : null}
              {orderError && <TouchableOpacity onPress={()=>void loadMenu(placeId)}><Text style={{color:'#CDA1FF',paddingVertical:12}}>Refresh menu and total</Text></TouchableOpacity>}
              <Text style={{color:'#aaa'}}>Orders require restaurant confirmation. Payment is handled by the restaurant.</Text>
            </View>
            {/* Special Requests */}
            <View style={styles.specialRequestsSection}>
              <Text style={styles.specialRequestsLabel}>Special Requests</Text>
              <TextInput
                style={styles.specialRequestsInput}
                placeholder="Allergies, preferences, etc."
                placeholderTextColor="#666"
                multiline
                maxLength={1000}
                value={specialRequests}
                onChangeText={setSpecialRequests}
              />
            </View>
          </ScrollView>

          {/* Totals */}
          <View style={styles.cartFooter}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${cartTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{estimate.tax===null?'Not configured':`$${taxAmount.toFixed(2)}`}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <Text style={styles.totalLabelFinal}>Total</Text>
              <Text style={styles.totalValueFinal}>{estimate.total===null?'Unavailable':`$${orderTotal.toFixed(2)}`}</Text>
            </View>

            <TouchableOpacity
              style={[styles.placeOrderButton, placingOrder && styles.placeOrderButtonDisabled]}
              onPress={handlePlaceOrder}
              disabled={placingOrder || !orderingContext?.ready || !cart.length}
            >
              {placingOrder ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.placeOrderText}>{signedIn?'Place Order':'Sign in to place order'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{placeName}</Text>
            {tableNumber && (
              <Text style={styles.headerSubtitle}>Table {tableNumber}</Text>
            )}
          </View>
          {order && (
            <TouchableOpacity onPress={() => setOrderView(true)}>
              <Ionicons name="receipt-outline" size={22} color="#8A05BE" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {orderError ? <Text accessibilityRole="alert" style={{color:'#FCA5A5',padding:16}}>{orderError}</Text> : null}
      {/* Period & Category Filters */}
      <View style={styles.filters}>
        {availablePeriods.length > 2 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodRow}>
            {availablePeriods.map(period => (
              <TouchableOpacity
                key={period}
                style={[styles.periodPill, activePeriod === period && styles.periodPillActive]}
                onPress={() => setActivePeriod(period)}
              >
                <Text style={[styles.periodText, activePeriod === period && styles.periodTextActive]}>
                  {PERIOD_LABELS[period]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          <TouchableOpacity
            style={[styles.catPill, activeCategory === 'all' && styles.catPillActive]}
            onPress={() => setActiveCategory('all')}
          >
            <Text style={[styles.catText, activeCategory === 'all' && styles.catTextActive]}>All</Text>
          </TouchableOpacity>
          {categories
            .filter(cat => {
              if (activePeriod === 'all') return true;
              return cat.meal_period === activePeriod || cat.meal_period === 'all_day' || !cat.meal_period;
            })
            .map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catPill, activeCategory === cat.id && styles.catPillActive]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text style={[styles.catText, activeCategory === cat.id && styles.catTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {/* Menu Items */}
      <FlatList
        data={filteredItems}
        renderItem={renderMenuItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.menuList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No items in this category.</Text>
          </View>
        }
      />

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCartButton}
          onPress={() => setCartOpen(true)}
          activeOpacity={0.85}
        >
          <View style={styles.floatingCartContent}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={styles.floatingCartText}>View Cart</Text>
            <Text style={styles.floatingCartPrice}>${cartTotal.toFixed(2)}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Placing order overlay */}
      {placingOrder && (
        <View style={styles.placingOverlay}>
          <ActivityIndicator size="large" color="#8A05BE" />
          <Text style={styles.placingText}>Placing your order...</Text>
        </View>
      )}

      {renderCart()}
      {renderQrScanner()}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSafeArea: {
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8A05BE',
    fontWeight: '500',
    marginTop: 2,
  },

  // Filters
  filters: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  periodRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  periodPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    marginRight: 6,
  },
  periodPillActive: {
    backgroundColor: '#8A05BE',
  },
  periodText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
  },
  periodTextActive: {
    color: '#fff',
  },
  categoryRow: {
    paddingHorizontal: 16,
  },
  catPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 6,
  },
  catPillActive: {
    backgroundColor: '#8A05BE',
    borderColor: '#8A05BE',
  },
  catText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#aaa',
  },
  catTextActive: {
    color: '#fff',
  },

  // Menu List
  menuList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  menuItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  popularBadge: {
    fontSize: 10,
    color: '#FF5000',
    fontWeight: '600',
    backgroundColor: 'rgba(255,80,0,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  menuItemDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 3,
    lineHeight: 16,
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8A05BE',
    marginTop: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8A05BE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonActive: {
    backgroundColor: '#6B04A0',
  },
  addButtonQty: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    color: '#8A05BE',
    fontSize: 10,
    fontWeight: '700',
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 16,
    overflow: 'hidden',
  },

  // Empty
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
  },

  // Floating Cart Button
  floatingCartButton: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    backgroundColor: '#8A05BE',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#8A05BE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingCartContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadge: {
    backgroundColor: '#fff',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cartBadgeText: {
    color: '#8A05BE',
    fontSize: 12,
    fontWeight: '700',
  },
  floatingCartText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  floatingCartPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Cart Modal
  cartContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  cartSafeArea: {
    flex: 1,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  cartList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cartItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  cartItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A05BE',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  itemNoteInput: {
    marginTop: 8,
    fontSize: 13,
    color: '#fff',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  specialRequestsSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  specialRequestsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  specialRequestsInput: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  // Cart Footer
  cartFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 14,
    color: '#888',
  },
  totalValue: {
    fontSize: 14,
    color: '#fff',
  },
  totalRowFinal: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 14,
  },
  totalLabelFinal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  totalValueFinal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8A05BE',
  },
  placeOrderButton: {
    backgroundColor: '#8A05BE',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Placing overlay
  placingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  placingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  // QR Scanner
  qrContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  qrSafeArea: {
    flex: 1,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  qrTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  qrCameraContainer: {
    flex: 1,
    position: 'relative',
  },
  qrCamera: {
    flex: 1,
  },
  qrOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFrame: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: '#8A05BE',
    borderRadius: 16,
  },
  qrHint: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    padding: 16,
  },
  qrSkipButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  qrSkipText: {
    color: '#8A05BE',
    fontSize: 14,
    fontWeight: '500',
  },

  // Order Status
  statusContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  statusHeader: {
    marginBottom: 40,
    marginTop: 20,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  statusTracker: {
    paddingLeft: 20,
  },
  statusStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  statusDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  statusDotActive: {
    backgroundColor: '#8A05BE',
  },
  statusDotCurrent: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  statusIcon: {
    fontSize: 18,
  },
  statusLabel: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },
  statusLabelActive: {
    color: '#fff',
  },
  statusLine: {
    position: 'absolute',
    left: 21,
    top: 44,
    width: 2,
    height: 32,
    backgroundColor: '#1a1a1a',
  },
  statusLineActive: {
    backgroundColor: '#8A05BE',
  },
  servedMessage: {
    marginTop: 20,
    alignItems: 'center',
    gap: 16,
  },
  servedText: {
    fontSize: 16,
    color: '#8A05BE',
    fontWeight: '600',
    textAlign: 'center',
  },
  newOrderButton: {
    backgroundColor: '#8A05BE',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  newOrderButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  backToMenuButton: {
    marginTop: 24,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
  },
  backToMenuText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
});
