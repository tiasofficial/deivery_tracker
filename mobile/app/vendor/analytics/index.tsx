import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatCurrency';
import { api } from '@/services/api';
import { useNavigation } from 'expo-router';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64; // Adjusting for container padding
const CHART_HEIGHT = 160;

export default function AnalyticsDashboard() {
  const navigation = useNavigation();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [summary, setSummary] = useState({ totalTrips: 0, totalCollection: 0, activeDrivers: 0, unsettledBalance: 0 });
  const [drivers, setDrivers] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  const fetchAnalyticsData = async () => {
    try {
      const [summaryRes, driversRes, boxesRes, collectionsRes] = await Promise.allSettled([
        api.get('/analytics/summary?period=month'),
        api.get('/analytics/drivers?period=month'),
        api.get('/analytics/boxes?period=month'),
        api.get('/analytics/collections')
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value.data?.success) {
        setSummary(summaryRes.value.data.data || { totalTrips: 0, totalCollection: 0, activeDrivers: 0, unsettledBalance: 0 });
      }
      if (driversRes.status === 'fulfilled' && driversRes.value.data?.success) {
        setDrivers(driversRes.value.data.data || []);
      }
      if (boxesRes.status === 'fulfilled' && boxesRes.value.data?.success) {
        setBoxes(boxesRes.value.data.data || []);
      }
      if (collectionsRes.status === 'fulfilled' && collectionsRes.value.data?.success) {
        setCollections(collectionsRes.value.data.data || []);
      }

    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAnalyticsData();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
  };

  // Compile weekly revenue trend
  // Defaults to last 6 days or padded zeros if empty
  const getRevenueTrend = () => {
    if (collections.length === 0) {
      return {
        revenueData: [0, 0, 0, 0, 0, 0],
        days: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6']
      };
    }
    
    // Group collections by date
    const sortableMap: Record<string, { net: number, label: string, ts: number }> = {};
    collections.forEach(c => {
      const date = new Date(c.tripDate);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!sortableMap[key]) {
        sortableMap[key] = {
          net: 0,
          label: `${date.getDate()}/${date.getMonth() + 1}`,
          ts: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
        };
      }
      const net = Math.max(0, Number(c.totalCollected || 0) - Number(c.transportFee || 0));
      sortableMap[key].net += net;
    });

    const grouped = Object.values(sortableMap).sort((a, b) => a.ts - b.ts);
    const sliced = grouped.slice(-6); // Take latest 6 days
    
    const revenueData = sliced.map(g => g.net);
    const days = sliced.map(g => g.label);

    // If only 1 point, add a dummy 0 point so we can draw a line
    if (revenueData.length === 1) {
      revenueData.unshift(0);
      days.unshift('-');
    }

    return { revenueData, days };
  };

  const { revenueData, days } = getRevenueTrend();
  const maxRevenue = Math.max(...revenueData, 100); // Prevent divide by zero

  // Generate SVG Path for curved line chart
  const points = revenueData.map((val, index) => {
    const x = (index / (revenueData.length - 1)) * CHART_WIDTH;
    const y = CHART_HEIGHT - (val / maxRevenue) * (CHART_HEIGHT - 30) - 10;
    return { x, y };
  });

  const linePath = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = points[index - 1];
    const cpX1 = prev.x + (point.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (point.x - prev.x) / 2;
    const cpY2 = point.y;
    return `${path} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${point.x} ${point.y}`;
  }, '');

  const areaPath = `${linePath} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* SUMMARY CARDS */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Collections</Text>
              <Text style={[styles.metricValue, { color: colors.success }]}>
                {formatCurrency(summary.totalCollection)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Trips Dispatched</Text>
              <Text style={styles.metricValue}>{summary.totalTrips}</Text>
            </View>
          </View>

          {/* LINE CHART: REVENUE */}
          <Text style={styles.sectionTitle}>Collection Trend (Recent Trips)</Text>
          <View style={styles.chartContainer}>
            <View style={{ height: CHART_HEIGHT, width: CHART_WIDTH }}>
              <Svg height={CHART_HEIGHT} width={CHART_WIDTH}>
                <Defs>
                  <LinearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.4" />
                    <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.0" />
                  </LinearGradient>
                </Defs>
                
                {/* Fill under the path */}
                <Path d={areaPath} fill="url(#gradientArea)" />
                
                {/* Main curve line */}
                <Path d={linePath} fill="none" stroke={colors.primary} strokeWidth="3" />
                
                {/* Circle nodes at data points */}
                {points.map((pt, i) => (
                  <Circle key={i} cx={pt.x} cy={pt.y} r="5" fill={colors.surface} stroke={colors.primary} strokeWidth="2" />
                ))}
              </Svg>
            </View>
            
            {/* Chart X Labels */}
            <View style={{ height: 20, marginTop: 12, position: 'relative' }}>
              {days.map((day, i) => {
                const pt = points[i];
                return (
                  <Text 
                    key={i} 
                    style={{ 
                      position: 'absolute', 
                      left: pt.x - 25, 
                      width: 50, 
                      textAlign: 'center', 
                      color: colors.textSecondary, 
                      fontSize: 11 
                    }}
                  >
                    {day}
                  </Text>
                );
              })}
            </View>
          </View>

          {/* DRIVER LEADERBOARD */}
          <Text style={styles.sectionTitle}>Driver Performance</Text>
          <View style={styles.card}>
            {drivers.length === 0 ? (
              <Text style={styles.emptyText}>No driver performance logged yet.</Text>
            ) : (
              drivers.map((driver, index) => {
                const percentage = summary.totalCollection > 0 
                  ? (driver.totalCollected / summary.totalCollection) * 100 
                  : 0;
                return (
                  <View key={driver.id} style={styles.leaderboardRow}>
                    <Text style={styles.driverName}>{index + 1}. {driver.name}</Text>
                    <View style={styles.barContainer}>
                      <View style={[styles.bar, { width: `${Math.max(percentage, 5)}%` }]} />
                    </View>
                    <Text style={styles.driverVal}>{formatCurrency(driver.totalCollected)}</Text>
                  </View>
                );
              })
            )}
          </View>

          {/* BOX TYPES METRICS */}
          <Text style={styles.sectionTitle}>Box Volumes Distributed</Text>
          <View style={styles.card}>
            {boxes.length === 0 ? (
              <Text style={styles.emptyText}>No boxes distributed yet.</Text>
            ) : (
              boxes.map((box) => (
                <View key={box.id} style={styles.boxRow}>
                  <Text style={styles.boxName}>{box.name}</Text>
                  <Text style={styles.boxQty}>{box.totalDelivered} units</Text>
                </View>
              ))
            )}
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  scroll: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  metricCard: { flex: 1, backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginHorizontal: 4, borderWidth: 1, borderColor: colors.border },
  metricLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  metricValue: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12, marginTop: 16 },
  chartContainer: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  xLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  xLabel: { color: colors.textSecondary, fontSize: 11, width: CHART_WIDTH / 6, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  driverName: { width: 100, color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' },
  barContainer: { flex: 1, height: 10, backgroundColor: colors.surfaceAlt, borderRadius: 5, marginHorizontal: 12, overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: colors.primary },
  driverVal: { color: colors.secondary, fontWeight: 'bold', width: 80, textAlign: 'right' },
  boxRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  boxName: { color: colors.textPrimary, fontWeight: '500' },
  boxQty: { color: colors.secondary, fontWeight: 'bold' },
  emptyText: { color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' }
});
