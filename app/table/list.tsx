import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { ArrowLeft, User, Search, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import DataEntryCard from '@/components/DataEntryCard';
import { useAuth } from '@/hooks/useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

interface DataEntry {
  id: string;
  numeric_id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  deleted?: boolean;
  role?: string;
}

export default function DataListScreen() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const { session } = useAuth();
  
  const [entries, setEntries] = useState<DataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletedEntries, setDeletedEntries] = useState<Set<string>>(new Set());
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState(Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEntries, setFilteredEntries] = useState<DataEntry[]>([]);

  useEffect(() => {
    loadEntries();

    // Load deleted entries from AsyncStorage if available
    const loadDeletedEntries = async () => {
      try {
        if (session?.user?.id) {
          // If we have real data, try to load real deleted entries from DB or storage
          const { data, error } = await supabase
            .from('data_entries')
            .select('id')
            .eq('owner_id', session.user.id)
            .eq('deleted', true);

          if (!error && data) {
            const deletedIds = new Set(data.map(item => item.id));
            setDeletedEntries(deletedIds);
          }
        }
      } catch (err) {
        console.error('Error loading deleted entries:', err);
      }
    };

    loadDeletedEntries();
  }, [session]); // Add session as dependency to reload when auth changes

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      // If user is not authenticated, return empty data
      if (!session?.user?.id) {
        // Only show mock data for demonstration if a specific flag is set
        // Otherwise show empty state
        const showDemoData = false; // Set to true only for demo purposes
        
        if (showDemoData) {
          const mockEntries = Array(5).fill(null).map((_, index) => ({
            id: `mock-${index}`,
            numeric_id: index + 1,
            name: 'details',
            description: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_amount: 0
          }));
          
          setEntries(mockEntries);
        } else {
          setEntries([]);
        }
        return;
      }

      // If user is authenticated, try to fetch real data with explicit deleted filter
      const { data, error: fetchError } = await supabase
        .from('data_entries')
        .select('*')
        .eq('owner_id', session.user.id)
        .eq('deleted', false) // Only fetch non-deleted entries
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Set actual data (even if empty array)
      setEntries(data || []);
    } catch (err: any) {
      console.error('Error loading entries:', err);
      setError('Failed to load data entries. Please try again.');
      // Show empty state instead of mock data on error
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEntryPress = (entry: DataEntry) => {
    // If entry is marked as deleted, don't allow access
    if (entry.deleted || deletedEntries.has(entry.id)) {
      Alert.alert(
        "Entry Deleted", 
        "This entry has been deleted and can no longer be accessed.",
        [{ text: "OK" }]
      );
      return;
    }

    // Make sure to check for real-time deletion
    if (!entry.id.startsWith('mock-') && session?.user?.id) {
      // Check if entry still exists and isn't deleted
      supabase
        .from('data_entries')
        .select('deleted')
        .eq('id', entry.id)
        .single()
        .then(({ data, error }) => {
          if (error || (data && data.deleted)) {
            Alert.alert(
              "Entry Not Available",
              "This entry has been deleted or is no longer available.",
              [{ text: "OK" }]
            );
            // Refresh data to update UI
            handleManualRefresh();
            return;
          }
          
          // If not deleted, proceed with navigation
          navigateToEntry(entry);
        });
    } else {
      navigateToEntry(entry);
    }
  };

  const navigateToEntry = (entry: DataEntry) => {
    // If not authenticated, redirect to login
    if (!session?.user?.id) {
      Alert.alert(
        "Authentication Required", 
        "Please log in to view entry details.",
        [
          {
            text: "Login",
            onPress: () => router.push('/(auth)'),
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
      return;
    }

    router.push({
      pathname: '/table/[id]',
      params: { id: entry.numeric_id.toString() }
    });
  };

  const confirmDelete = (entry: DataEntry) => {
    // If not authenticated, show login prompt
    if (!session?.user?.id) {
      Alert.alert(
        "Authentication Required", 
        "Please log in to delete entries.",
        [
          {
            text: "Login",
            onPress: () => router.push('/(auth)'),
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
      return;
    }

    Alert.alert(
      'Delete Data Entry',
      `Are you sure you want to delete "${entry.name || 'this entry'}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(entry),
        },
      ],
    );
  };

  const performDelete = async (entry: DataEntry) => {
    if (deleting) return; // Prevent multiple delete operations
    
    try {
      // Set deleting state immediately to show loading spinner
      setDeleting(entry.id);

      // Add to deletedEntries Set
      setDeletedEntries(prev => {
        const newSet = new Set(prev);
        newSet.add(entry.id);
        return newSet;
      });
      
      // For mock data - mark as deleted in state only
      if (entry.id.startsWith('mock-')) {
        setTimeout(() => {
          // Mark the entry as deleted
          setEntries(prev => prev.map(e => 
            e.id === entry.id ? { ...e, deleted: true } : e
          ));
          setDeleting(null);
          
          // Show confirmation
          Alert.alert(
            'Success',
            'Entry marked as deleted',
            [{ text: 'OK' }]
          );
        }, 500);
        return;
      } 
      
      // For real data - mark as deleted in Supabase
      if (session?.user?.id) {
        // First check if entry still exists and isn't already deleted
        const { data: checkData, error: checkError } = await supabase
          .from('data_entries')
          .select('id, deleted')
          .eq('id', entry.id)
          .eq('owner_id', session.user.id)
          .single();
          
        if (checkError) {
          throw new Error('Entry not found or already deleted');
        }
        
        if (checkData.deleted) {
          throw new Error('This entry has already been deleted by another session');
        }
        
        // Update with soft delete
        const { error: updateError } = await supabase
          .from('data_entries')
          .update({ 
            deleted: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', entry.id)
          .eq('owner_id', session.user.id);

        if (updateError) {
          console.error('Error updating deletion status:', updateError);
          throw new Error(updateError.message);
        }
      }
      
      // Update local state - remove from displayed list
      setEntries(prev => prev.filter(e => e.id !== entry.id));
        
      // Show success message
      Alert.alert(
        'Success',
        'Entry deleted successfully',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('Error marking entry as deleted:', err);
      
      // Revert deletion state in UI
      setDeletedEntries(prev => {
        const newSet = new Set(prev);
        newSet.delete(entry.id);
        return newSet;
      });
      
      // Handle different types of authentication errors
      if (err.message?.includes('auth') || 
          err.message?.includes('Authentication') || 
          err.message?.includes('permission') || 
          err.message?.includes('session')) {
        Alert.alert(
          'Authentication Error', 
          err.message || 'You need to be logged in with proper permissions to delete entries.',
          [
            {
              text: "Login Again",
              onPress: () => router.push('/(auth)'),
            },
            {
              text: "Cancel",
              style: "cancel"
            }
          ]
        );
      } else {
        // For other types of errors
        Alert.alert('Error', 'Failed to delete entry: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setDeleting(null);
    }
  };

  const renderAuthWarning = () => {
    if (session?.user?.id) return null;
    
    return (
      <TouchableOpacity 
        style={[styles.authWarning, { backgroundColor: `${colors.primary}15` }]}
        onPress={() => router.push('/(auth)')}
      >
        <User size={18} color={colors.primary} />
        <Text style={[styles.authWarningText, { color: colors.primary }]}>
          Log in to save your data
        </Text>
      </TouchableOpacity>
    );
  };

  // Set up real-time subscriptions for data changes
  useEffect(() => {
    // Skip realtime subscription setup to prevent WebSocket errors
    console.log('Skipping realtime subscription setup - using polling instead');
    
    // Return empty cleanup function
    return () => {};
  }, [session?.user?.id]);

  // Add a periodic refresh mechanism
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (session?.user?.id) {
        setLastRefreshTimestamp(Date.now());
        loadEntries();
      }
    }, 15000); // Refresh every 15 seconds (more frequent than before)
    
    return () => clearInterval(refreshInterval);
  }, [session?.user?.id]);

  // Add a manual refresh function
  const handleManualRefresh = () => {
    setLastRefreshTimestamp(Date.now());
    loadEntries();
  };

  // Filter entries based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEntries(entries);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = entries.filter(entry => {
      const nameMatch = entry.name?.toLowerCase().includes(query);
      const descMatch = entry.description?.toLowerCase().includes(query);
      const amountMatch = entry.total_amount?.toString().includes(query);
      
      return nameMatch || descMatch || amountMatch;
    });
    
    setFilteredEntries(filtered);
  }, [searchQuery, entries]);

  // Function to check if an entry matches the search query
  const entryMatchesSearch = (entry: DataEntry) => {
    if (!searchQuery.trim()) return false;
    
    const query = searchQuery.toLowerCase().trim();
    return (
      entry.name?.toLowerCase().includes(query) ||
      entry.description?.toLowerCase().includes(query) ||
      entry.total_amount?.toString().includes(query)
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: colors.text }]}>Your Data</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleManualRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {renderAuthWarning()}
        
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Data
          </Text>
          <TouchableOpacity onPress={handleManualRefresh} style={styles.refreshButton}>
            <Text style={{ color: colors.primary }}>Refresh</Text>
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <Search size={18} color={colors.secondaryText} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search your data..."
            placeholderTextColor={colors.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={colors.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.message, { color: colors.secondaryText }]}>
              Loading...
            </Text>
          </View>
        ) : error ? (
          <Text style={[styles.message, { color: colors.error }]}>
            {error}
          </Text>
        ) : filteredEntries.length === 0 ? (
          searchQuery.trim() ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Results Found
              </Text>
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                No matches found for "{searchQuery}"
              </Text>
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Data Entries Yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                Create your first data entry to get started
              </Text>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/create')}
              >
                <Text style={styles.createButtonText}>Create Data Entry</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          filteredEntries.map((entry) => {
            // Check if the entry is deleted either by flag or by being in the deletedEntries Set
            const isDeleted = entry.deleted || deletedEntries.has(entry.id);
            const isMatched = entryMatchesSearch(entry);
            
            return (
              <View key={entry.id} style={styles.entryContainer}>
                <View style={[
                  styles.entryCardContainer,
                  isDeleted && styles.deletedEntryContainer
                ]}>
                  {isDeleted && (
                    <View style={[
                      styles.strikethrough,
                      { backgroundColor: colors.error }
                    ]} />
                  )}
                  <DataEntryCard
                    entry={entry}
                    onPress={() => handleEntryPress(entry)}
                    isHighlighted={isMatched}
                    searchQuery={searchQuery}
                  />
                </View>
              </View>
            );
          })
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  message: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryCardContainer: {
    flex: 1,
  },
  authWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  authWarningText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  deletedEntryContainer: {
    opacity: 0.6,
    position: 'relative',
  },
  strikethrough: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#ff3b30',
    opacity: 0.9,
    zIndex: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 4,
  },
  highlightedText: {
    backgroundColor: 'rgba(255, 230, 0, 0.3)',
    fontWeight: 'bold',
    borderRadius: 4,
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
});