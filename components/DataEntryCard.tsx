import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { ChevronRight } from 'lucide-react-native';
import Card from './Card';

interface DataEntry {
  id: string;
  numeric_id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  // For TypeScript compatibility with existing code
  updatedAt?: string;
  totalAmount?: number;
}

interface DataEntryCardProps {
  entry: DataEntry;
  onPress: () => void;
  isHighlighted?: boolean;
  searchQuery?: string;
}

export default function DataEntryCard({ entry, onPress, isHighlighted, searchQuery = '' }: DataEntryCardProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };
  
  // Highlight text that matches the search query
  const highlightText = (text: string, shouldHighlight: boolean = false) => {
    if (!shouldHighlight || !searchQuery || !text) return text;
    
    const query = searchQuery.toLowerCase().trim();
    if (!text.toLowerCase().includes(query)) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <Text key={i} style={styles.highlightedText}>
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  // Use correct property based on what's available
  const updatedDate = entry.updatedAt || entry.updated_at;
  const totalAmount = entry.totalAmount !== undefined ? entry.totalAmount : entry.total_amount;

  return (
    <Card style={{
      ...styles.card,
      ...(isHighlighted ? styles.highlightedCard : {})
    }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.touchable}>
        <View style={styles.contentContainer}>
          <View style={styles.mainContent}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {isHighlighted && searchQuery ? highlightText(entry.name || 'details', true) : (entry.name || 'details')}
            </Text>
            {entry.description ? (
              <Text 
                style={[styles.description, { color: colors.secondaryText }]} 
                numberOfLines={1}
              >
                {isHighlighted && searchQuery ? highlightText(entry.description, true) : entry.description}
              </Text>
            ) : null}
            <Text style={[styles.date, { color: colors.secondaryText }]}>
              Updated: {formatDate(updatedDate)}
            </Text>
          </View>
          
          <View style={styles.rightContent}>
            {totalAmount !== undefined && (
              <Text style={[styles.amount, { color: colors.primary }]}>
                {isHighlighted && searchQuery && totalAmount.toString().toLowerCase().includes(searchQuery.toLowerCase())
                  ? highlightText(formatCurrency(totalAmount), true)
                  : formatCurrency(totalAmount)
                }
              </Text>
            )}
            <ChevronRight size={20} color={colors.secondaryText} />
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    flex: 1,
  },
  highlightedCard: {
    borderWidth: 2,
    borderColor: 'rgba(255, 200, 0, 0.5)',
  },
  touchable: {
    padding: 16,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  mainContent: {
    flex: 1,
    marginRight: 12,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  date: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  amount: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  highlightedText: {
    backgroundColor: 'rgba(255, 230, 0, 0.3)',
    borderRadius: 2,
  },
});