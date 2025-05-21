import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, FileText, Calendar, ChevronRight, DollarSign, X, RefreshCw } from 'lucide-react-native';
import { router, useNavigation } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/Avatar';
import { useFocusEffect } from '@react-navigation/native';

interface DataEntry {
  id: string;
  numeric_id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  owner_id: string;
  deleted: boolean;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const { session } = useAuth();
  const user = session?.user;

  const [loading, setLoading] = useState(true);
  const [recentEntries, setRecentEntries] = useState<DataEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadRecentEntries();
  }, []);

  // Add useFocusEffect to reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // This will execute when the screen comes into focus
      loadRecentEntries();
      return () => {
        // Optional cleanup function
      };
    }, [])
  );

  const loadRecentEntries = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      console.log('Loading recent entries...');
      
      const { data, error } = await supabase
        .from('data_entries')
        .select('*')
        .eq('owner_id', user.id)
        .eq('deleted', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching entries:', error);
        throw error;
      }

      const entries = data || [];
      console.log(`Loaded ${entries.length} recent entries`);
      setRecentEntries(entries);
    } catch (err) {
      console.error('Error loading entries:', err);
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

  const navigateToEntry = (entry: DataEntry) => {
    router.push({
      pathname: '/table/[id]',
      params: { id: entry.numeric_id.toString() }
    });
  };

  const quickActions = [
    {
      title: 'New Entry',
      icon: Plus,
      color: '#FF6B6B',
      onPress: () => router.push('/create'),
      containerStyle: styles.leftActionCard,
    },
    {
      title: 'View All',
      icon: FileText,
      color: '#4ECDC4',
      onPress: () => router.push('/table/list'),
      containerStyle: styles.rightActionCard,
    },
    {
      title: 'Organized Data',
      icon: Calendar,
      color: '#6C5CE7',
      onPress: () => router.push('/organized-data'),
      containerStyle: styles.leftActionCard,
    },
    {
      title: 'Monthly Totals',
      icon: DollarSign,
      color: '#00B894',
      onPress: () => router.push('/monthly-totals'),
      containerStyle: styles.rightActionCard,
    }
  ];

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadRecentEntries();
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.headerSubtext}>{user?.email}</Text>
            </View>
            <View style={styles.headerRightContainer}>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw 
                  size={20} 
                  color="white" 
                />
              </TouchableOpacity>
              <Avatar 
                name={user?.email?.split('@')[0] || 'User'} 
                size={60}
                backgroundColor="rgba(255, 255, 255, 0.25)"
              />
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Action Cards */}
      <View style={styles.actionCardsContainer}>
        <View style={styles.actionCardsRow}>
          {quickActions.slice(0, 2).map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, action.containerStyle, { backgroundColor: colors.card }]}
              onPress={action.onPress}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${action.color}20` }]}>
                <action.icon size={24} color={action.color} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.actionCardsRow}>
          {quickActions.slice(2, 4).map((action, index) => (
            <TouchableOpacity
              key={index + 2}
              style={[
                styles.actionCard, 
                action.containerStyle, 
                { backgroundColor: colors.card }
              ]}
              onPress={action.onPress}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${action.color}20` }]}>
                <action.icon size={24} color={action.color} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerGradient: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerContent: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  actionCardsContainer: {
    padding: 20,
    paddingBottom: 0,
  },
  actionCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  leftActionCard: {
    marginRight: 8,
  },
  rightActionCard: {
    marginLeft: 8,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
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
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 12,
    marginRight: 8,
  },
});