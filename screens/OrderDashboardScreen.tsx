/**
 * Order Dashboard Screen - Restaurant Staff
 * Path: screens/OrderDashboardScreen.tsx
 *
 * Kanban-style real-time order management.
 * Dark theme, large touch targets, Supabase realtime subscriptions.
 *
 * Features:
 * - 4 status sections: New | Confirmed | Preparing | Ready
 * - Real-time via Supabase subscription on `orders` table
 * - Order cards with table number, items, time, total
 * - Action buttons: Confirm, Start Preparing, Mark Ready, Mark Served
 * - Printable ticket view on confirm
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface Order {
  id: string;
  place_id: string;
  table_number: string | null;
  order_number: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
  items: OrderItem[];
  special_requests: string | null;
  total: number;
  created_at: string;
  confirmed_at: string | null;
  prepared_at: string | null;
  served_at: string | null;
}

type RouteParams = {
  OrderDashboard: {
    placeId: string;
    placeName?: string;
  };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr === 1) return '1 hr ago';
  return `${diffHr} hrs ago`;
}

function isUrgent(dateStr: string): boolean {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return diffMs > 5 * 60 * 1000; // >5 minutes
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'New', color: '#EF4444', icon: 'alert-circle' },
  confirmed: { label: 'Confirmed', color: '#F59E0B', icon: 'checkmark-circle' },
  preparing: { label: 'Preparing', color: '#3B82F6', icon: 'flame' },
  ready: { label: 'Ready', color: '#10B981', icon: 'checkmark-done-circle' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function OrderDashboardScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'OrderDashboard'>>();
  const { placeId, placeName: initialPlaceName } = route.params;

  const [placeName, setPlaceName] = useState(initialPlaceName || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [ticketOrder, setTicketOrder] = useState<Order | null>(null);

  // Refresh timer
  const [, setTick] = useState(0);
  const prevPendingCount = useRef(0);

  // Auto-refresh time display every 30s
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── Load Orders ────────────────────────────────────────────────────────────

  const loadOrders = useCallback(async () => {
    if (!placeId) return;

    const { data: activeData } = await supabase
      .from('orders')
      .select('*')
      .eq('place_id', placeId)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: true });

    if (activeData) {
      const pendingCount = activeData.filter(o => o.status === 'pending').length;
      // Vibrate on new orders
      if (pendingCount > prevPendingCount.current && prevPendingCount.current > 0) {
        Vibration.vibrate([0, 200, 100, 200]);
      }
      prevPendingCount.current = pendingCount;
      setOrders(activeData as Order[]);
    }

    setLoading(false);
  }, [placeId]);

  // ─── Initial Load + Realtime ────────────────────────────────────────────────

  useEffect(() => {
    if (!placeId) return;

    // Load place name if not provided
    if (!initialPlaceName) {
      supabase
        .from('places')
        .select('name')
        .eq('id', placeId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setPlaceName(data.name || '');
        });
    }

    loadOrders();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`dashboard-${placeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `place_id=eq.${placeId}`,
        },
        (payload: any) => {
          const newOrder = payload.new as Order;
          const eventType = payload.eventType;

          if (eventType === 'INSERT') {
            if (['pending', 'confirmed', 'preparing', 'ready'].includes(newOrder.status)) {
              setOrders(prev => [...prev, newOrder]);
              if (newOrder.status === 'pending') {
                Vibration.vibrate([0, 200, 100, 200]);
              }
            }
          } else if (eventType === 'UPDATE') {
            if (['served', 'cancelled'].includes(newOrder.status)) {
              setOrders(prev => prev.filter(o => o.id !== newOrder.id));
            } else {
              setOrders(prev =>
                prev.map(o => (o.id === newOrder.id ? newOrder : o))
              );
            }
          } else if (eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Auto-refresh fallback every 30s
    const interval = setInterval(loadOrders, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [placeId, loadOrders, initialPlaceName]);

  // ─── Order Actions ──────────────────────────────────────────────────────────

  const updateOrderStatus = async (
    orderId: string,
    newStatus: string,
    extraFields: Record<string, any> = {}
  ) => {
    const updates: Record<string, any> = { status: newStatus, ...extraFields };

    if (newStatus === 'confirmed') {
      updates.confirmed_at = new Date().toISOString();
    } else if (newStatus === 'ready') {
      updates.prepared_at = new Date().toISOString();
    } else if (newStatus === 'served') {
      updates.served_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (error) {
      console.error('[Dashboard] Error updating order:', error);
      Alert.alert('Error', 'Failed to update order. Please try again.');
    }
  };

  const handleConfirm = (order: Order) => {
    updateOrderStatus(order.id, 'confirmed');
    // Show printable ticket
    setTicketOrder(order);
  };

  const handleStartPreparing = (orderId: string) => {
    updateOrderStatus(orderId, 'preparing');
  };

  const handleMarkReady = (orderId: string) => {
    updateOrderStatus(orderId, 'ready');
  };

  const handleMarkServed = (orderId: string) => {
    updateOrderStatus(orderId, 'served');
  };

  const handleCancel = (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => updateOrderStatus(orderId, 'cancelled', {
            cancelled_at: new Date().toISOString(),
          }),
        },
      ]
    );
  };

  // ─── Computed ───────────────────────────────────────────────────────────────

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const getDisplayOrders = () => {
    switch (activeTab) {
      case 'pending': return pendingOrders;
      case 'confirmed': return confirmedOrders;
      case 'preparing': return preparingOrders;
      case 'ready': return readyOrders;
      default: return orders;
    }
  };

  // ─── Render Order Card ──────────────────────────────────────────────────────

  const renderOrderCard = ({ item: order }: { item: Order }) => {
    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const urgent = order.status === 'pending' && isUrgent(order.created_at);
    const orderItems: OrderItem[] = order.items || [];
    const orderNum = order.order_number || order.id.slice(0, 6).toUpperCase();

    return (
      <View style={[styles.orderCard, urgent && styles.orderCardUrgent]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.tableNumber}>
              {order.table_number ? `Table ${order.table_number}` : 'No Table'}
            </Text>
            <Text style={styles.orderNumber}>#{orderNum}</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
              <Ionicons name={config.icon as any} size={12} color="#fff" />
              <Text style={styles.statusBadgeText}>{config.label}</Text>
            </View>
            <Text style={[styles.timeText, urgent && styles.timeTextUrgent]}>
              {timeAgo(order.created_at)}
            </Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.cardItems}>
          {orderItems.slice(0, 5).map((item, idx) => (
            <View key={item.id || idx} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              {item.notes && (
                <Text style={styles.itemNote} numberOfLines={1}>{item.notes}</Text>
              )}
            </View>
          ))}
          {orderItems.length > 5 && (
            <Text style={styles.moreItems}>+{orderItems.length - 5} more items</Text>
          )}
        </View>

        {/* Special requests */}
        {order.special_requests && (
          <View style={styles.specialRequests}>
            <Ionicons name="chatbubble-outline" size={12} color="#F59E0B" />
            <Text style={styles.specialRequestsText} numberOfLines={2}>
              {order.special_requests}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.totalText}>${(order.total || 0).toFixed(2)}</Text>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {order.status === 'pending' && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnCancel]}
                  onPress={() => handleCancel(order.id)}
                >
                  <Ionicons name="close" size={16} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnConfirm]}
                  onPress={() => handleConfirm(order)}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Confirm</Text>
                </TouchableOpacity>
              </>
            )}
            {order.status === 'confirmed' && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrepare]}
                onPress={() => handleStartPreparing(order.id)}
              >
                <Ionicons name="flame" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Start</Text>
              </TouchableOpacity>
            )}
            {order.status === 'preparing' && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnReady]}
                onPress={() => handleMarkReady(order.id)}
              >
                <Ionicons name="checkmark-done" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Ready</Text>
              </TouchableOpacity>
            )}
            {order.status === 'ready' && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnServed]}
                onPress={() => handleMarkServed(order.id)}
              >
                <Ionicons name="restaurant" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Served</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ─── Ticket View Modal ──────────────────────────────────────────────────────

  const renderTicketModal = () => {
    if (!ticketOrder) return null;
    const orderItems: OrderItem[] = ticketOrder.items || [];
    const orderNum = ticketOrder.order_number || ticketOrder.id.slice(0, 6).toUpperCase();
    const time = new Date(ticketOrder.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <Modal visible={!!ticketOrder} animationType="fade" transparent>
        <View style={styles.ticketOverlay}>
          <View style={styles.ticketCard}>
            <Text style={styles.ticketTitle}>ORDER TICKET</Text>
            <View style={styles.ticketDivider} />

            <Text style={styles.ticketTable}>
              TABLE {ticketOrder.table_number || '--'}
            </Text>
            <Text style={styles.ticketOrderNum}>#{orderNum}</Text>
            <Text style={styles.ticketTime}>{time}</Text>

            <View style={styles.ticketDivider} />

            {orderItems.map((item, idx) => (
              <View key={item.id || idx} style={styles.ticketItem}>
                <Text style={styles.ticketItemText}>
                  {item.quantity}x {item.name}
                </Text>
                {item.notes && (
                  <Text style={styles.ticketItemNote}>{item.notes}</Text>
                )}
              </View>
            ))}

            {ticketOrder.special_requests && (
              <>
                <View style={styles.ticketDivider} />
                <Text style={styles.ticketNotes}>
                  NOTES: {ticketOrder.special_requests}
                </Text>
              </>
            )}

            <View style={styles.ticketDivider} />
            <Text style={styles.ticketFooter}>Tavvy</Text>

            <TouchableOpacity
              style={styles.ticketCloseBtn}
              onPress={() => setTicketOrder(null)}
            >
              <Text style={styles.ticketCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A05BE" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{placeName}</Text>
            <Text style={styles.headerSubtitle}>Order Dashboard</Text>
          </View>
          <TouchableOpacity onPress={loadOrders}>
            <Ionicons name="refresh" size={22} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{orders.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{pendingOrders.length}</Text>
            <Text style={styles.statLabel}>New</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{preparingOrders.length}</Text>
            <Text style={styles.statLabel}>Cooking</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{readyOrders.length}</Text>
            <Text style={styles.statLabel}>Ready</Text>
          </View>
        </View>

        {/* Tab Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabRow}
          contentContainerStyle={styles.tabRowContent}
        >
          {[
            { key: 'all', label: `All (${orders.length})` },
            { key: 'pending', label: `New (${pendingOrders.length})` },
            { key: 'confirmed', label: `Confirmed (${confirmedOrders.length})` },
            { key: 'preparing', label: `Preparing (${preparingOrders.length})` },
            { key: 'ready', label: `Ready (${readyOrders.length})` },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Orders List */}
        <FlatList
          data={getDisplayOrders()}
          renderItem={renderOrderCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#333" />
              <Text style={styles.emptyText}>No orders in this section</Text>
            </View>
          }
        />
      </SafeAreaView>

      {renderTicketModal()}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
  },

  // Header
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
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },

  // Stats
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
  },

  // Tabs
  tabRow: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  tabRowContent: {
    paddingHorizontal: 16,
    gap: 4,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#8A05BE',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },

  // Orders List
  ordersList: {
    padding: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#333',
  },
  orderCardUrgent: {
    borderLeftColor: '#EF4444',
    backgroundColor: '#1a1012',
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {},
  tableNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  orderNumber: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  timeText: {
    fontSize: 11,
    color: '#888',
  },
  timeTextUrgent: {
    color: '#EF4444',
    fontWeight: '600',
  },

  // Items
  cardItems: {
    marginBottom: 10,
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemQty: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A05BE',
    width: 26,
  },
  itemName: {
    fontSize: 14,
    color: '#ddd',
    flex: 1,
  },
  itemNote: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    maxWidth: 100,
  },
  moreItems: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  // Special Requests
  specialRequests: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  specialRequestsText: {
    fontSize: 12,
    color: '#F59E0B',
    flex: 1,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 10,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  actionBtnCancel: {
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  actionBtnConfirm: {
    backgroundColor: '#10B981',
  },
  actionBtnPrepare: {
    backgroundColor: '#3B82F6',
  },
  actionBtnReady: {
    backgroundColor: '#10B981',
  },
  actionBtnServed: {
    backgroundColor: '#8A05BE',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#555',
  },

  // Ticket Modal
  ticketOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ticketCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    letterSpacing: 2,
  },
  ticketDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 12,
    borderStyle: 'dashed',
  },
  ticketTable: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
  },
  ticketOrderNum: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  ticketTime: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
  ticketItem: {
    marginBottom: 8,
  },
  ticketItemText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  ticketItemNote: {
    fontSize: 13,
    color: '#666',
    paddingLeft: 12,
    marginTop: 2,
  },
  ticketNotes: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  ticketFooter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  ticketCloseBtn: {
    marginTop: 16,
    backgroundColor: '#8A05BE',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ticketCloseBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
