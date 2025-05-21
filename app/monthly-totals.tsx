import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import { ArrowLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface DataEntry {
  id: string;
  numeric_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
}

interface MonthlyTotal {
  year: string;
  month: string;
  total: number;
  entries: DataEntry[];
}

export default function MonthlyTotalsScreen() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const { session } = useAuth();
  const user = session?.user;

  const [loading, setLoading] = useState(true);
  const [monthlyTotals, setMonthlyTotals] = useState<Record<string, Record<string, MonthlyTotal>>>({});
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        console.log('No user ID found, skipping data load');
        setLoading(false);
        return;
      }

      console.log('Loading all entries for monthly totals, user ID:', user.id);
      
      const { data, error } = await supabase
        .from('data_entries')
        .select('*')
        .eq('owner_id', user.id)
        .eq('deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entries:', error);
        throw error;
      }

      console.log('Supabase query response:', data ? 'Data received' : 'No data received');
      const entries = data || [];
      console.log(`Loaded ${entries.length} entries for monthly totals`);
      
      if (entries.length > 0) {
        console.log('Sample entry:', JSON.stringify(entries[0], null, 2));
      } else {
        console.log('No entries found. Showing empty state');
      }
      
      // Calculate monthly totals
      calculateMonthlyTotals(entries);
    } catch (err) {
      console.error('Error loading entries:', err);
      // Still set monthly totals to empty object to properly show empty state
      setMonthlyTotals({});
    } finally {
      setLoading(false);
    }
  };

  const getValidDate = (dateString: any): Date | null => {
    try {
      // Check if it's already a Date object
      if (dateString instanceof Date) {
        return isNaN(dateString.getTime()) ? null : dateString;
      }
      
      // Check if it's a timestamp number
      if (typeof dateString === 'number') {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
      }
      
      // Check standard ISO string format (YYYY-MM-DDTHH:mm:ss.sssZ)
      if (typeof dateString === 'string') {
        // Try direct parsing first
        let date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date;
        }
        
        // Handle YYYY-MM-DD format specifically
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateString.split('-').map(Number);
          date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
        
        // Try alternative formats
        // SQL timestamp format (YYYY-MM-DD HH:mm:ss)
        if (dateString.includes(' ') && dateString.includes('-') && dateString.includes(':')) {
          date = new Date(dateString.replace(' ', 'T') + 'Z');
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
        
        // Try just the date part
        if (dateString.includes('-')) {
          const dateParts = dateString.split('-');
          if (dateParts.length === 3) {
            date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
            if (!isNaN(date.getTime())) {
              return date;
            }
          }
        }
        
        // Try Unix timestamp (seconds)
        const timestamp = parseInt(dateString);
        if (!isNaN(timestamp)) {
          date = new Date(timestamp * 1000); // Convert seconds to milliseconds
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
      
      // Could not parse the date
      console.warn(`Could not parse date: ${dateString} (type: ${typeof dateString})`);
      return null;
    } catch (err) {
      console.error('Error parsing date:', err);
      return null;
    }
  };

  const calculateMonthlyTotals = (entries: DataEntry[]) => {
    try {
      console.log(`Calculating monthly totals for ${entries.length} entries...`);
      const totals: Record<string, Record<string, MonthlyTotal>> = {};

      if (entries.length === 0) {
        console.log('No entries for monthly totals');
        setMonthlyTotals({});
        return;
      }

      entries.forEach((entry) => {
        // Make sure entry exists and has a creation date
        if (!entry || !entry.created_at) {
          console.warn(`Entry ${entry?.id || 'unknown'} missing created_at date`);
          return;
        }

        // Use our flexible date parsing function
        const date = getValidDate(entry.created_at);
        if (!date) {
          console.warn(`Invalid date format for entry ${entry.id}: ${entry.created_at}`);
          return;
        }

        const year = date.getFullYear().toString();
        const month = date.toLocaleString('default', { month: 'long' });
        const monthKey = `${month}-${year}`;

        // Create year object if it doesn't exist
        if (!totals[year]) {
          totals[year] = {};
        }

        // Create month total if it doesn't exist
        if (!totals[year][month]) {
          totals[year][month] = {
            year,
            month,
            total: 0,
            entries: []
          };
        }

        // Add entry amount to total and add entry to list
        totals[year][month].total += (entry.total_amount || 0);
        totals[year][month].entries.push(entry);
      });

      const years = Object.keys(totals);
      console.log(`Monthly totals created with ${years.length} years: ${years.join(', ')}`);
      
      setMonthlyTotals(totals);
      
      // Auto-expand current year if it exists
      const currentYear = new Date().getFullYear().toString();
      if (totals[currentYear]) {
        setExpandedYear(currentYear);
        console.log(`Auto-expanded current year: ${currentYear}`);
      } else if (years.length > 0) {
        // Otherwise expand the most recent year
        const sortedYears = years.sort().reverse();
        setExpandedYear(sortedYears[0]);
        console.log(`Auto-expanded most recent year: ${sortedYears[0]}`);
      }
    } catch (err) {
      console.error('Error calculating monthly totals:', err);
      setMonthlyTotals({});
    }
  };

  const toggleYearExpansion = (year: string) => {
    if (expandedYear === year) {
      setExpandedYear(null);
    } else {
      setExpandedYear(year);
    }
  };

  const formatCurrency = (amount: number) => {
    // Format with INR currency symbol (₹)
    return '₹' + new Intl.NumberFormat('en-IN').format(amount);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadEntries();
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const renderMonthlyTotals = () => {
    const years = Object.keys(monthlyTotals).sort().reverse();
    
    if (years.length === 0) {
      return (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>
            No data available for monthly totals. Try adding some entries first.
          </Text>
          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/create')}
          >
            <View style={styles.buttonContent}>
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.emptyStateButtonText}>Create New Entry</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: colors.secondary }]}
            onPress={handleRefresh}
          >
            <View style={styles.buttonContent}>
              <RefreshCw size={20} color="#FFFFFF" />
              <Text style={styles.refreshButtonText}>Refresh Data</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.totalsContainer}>
        {years.map(year => (
          <View key={year} style={styles.yearContainer}>
            <TouchableOpacity 
              style={[styles.yearHeader, { backgroundColor: colors.card }]}
              onPress={() => toggleYearExpansion(year)}
            >
              <Text style={[styles.yearText, { color: colors.text }]}>{year}</Text>
              <ChevronRight 
                size={20} 
                color={colors.text} 
                style={{ 
                  transform: [{ rotate: expandedYear === year ? '90deg' : '0deg' }],
                  opacity: 0.7
                }} 
              />
            </TouchableOpacity>

            {expandedYear === year && (
              <View style={styles.monthsContainer}>
                {Object.keys(monthlyTotals[year])
                  .sort((a, b) => {
                    const monthA = new Date(`${a} 1, 2000`).getMonth();
                    const monthB = new Date(`${b} 1, 2000`).getMonth();
                    return monthB - monthA; // Reverse sort for most recent first
                  })
                  .map(month => (
                    <View 
                      key={month}
                      style={[styles.monthItem, { backgroundColor: colors.card }]}
                    >
                      <Text style={[styles.monthText, { color: colors.text }]}>{month}</Text>
                      <Text style={[styles.totalAmount, { color: colors.primary }]}>
                        {formatCurrency(monthlyTotals[year][month].total)}
                      </Text>
                    </View>
                  ))
                }
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Monthly Totals</Text>
        </View>
        
        <TouchableOpacity style={styles.headerRightButton} onPress={handleRefresh}>
          <RefreshCw size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
              Loading monthly totals...
            </Text>
          </View>
        ) : (
          renderMonthlyTotals()
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 16,
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  emptyStateButton: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    minWidth: 200,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    minWidth: 200,
  },
  refreshButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  headerRightButton: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  yearContainer: {
    marginBottom: 12,
  },
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  yearText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  monthsContainer: {
    marginTop: 8,
    marginLeft: 10,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  monthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  monthText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
}); 