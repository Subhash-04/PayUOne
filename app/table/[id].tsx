import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { ArrowLeft, Share2, Plus, Trash2, Home, X, Search, Calendar } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';

interface DataEntry {
  id: string;
  name: string;
  description?: string;
  numeric_id: number;
}

interface TableColumn {
  id: string;
  name: string;
  type: string;
  order: number;
}

interface TableRow {
  id: string;
  cells: Record<string, any>;
}

export default function TableDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  const [dataEntry, setDataEntry] = useState<DataEntry | null>(null);
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newRow, setNewRow] = useState<Record<string, string>>({});
  const [addingRow, setAddingRow] = useState(false);
  const [savingRow, setSavingRow] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumn, setNewColumn] = useState({ name: '', type: 'text' });
  const [addingColumn, setAddingColumn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userAccess, setUserAccess] = useState<'owner' | 'editor' | 'viewer' | 'none'>('none');
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const { session } = useAuth();
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateView, setDateView] = useState<'year' | 'month' | 'day'>('year');
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    async function checkUserAccess() {
      try {
        setIsCheckingAccess(true);
        
        if (!session?.user?.id) {
          setUserAccess('none');
          return;
        }
        
        // First check if user is the owner
        const { data: entryData, error: entryError } = await supabase
          .from('data_entries')
          .select('id, owner_id')
          .eq('numeric_id', parseInt(id));
          
        if (entryError) throw entryError;
        
        if (entryData && entryData.length > 0) {
          if (entryData[0].owner_id === session.user.id) {
            setUserAccess('owner');
            return;
          }
          
          // Check if user is a collaborator
          const { data: collabData, error: collabError } = await supabase
            .from('collaborators')
            .select('role')
            .eq('data_entry_id', entryData[0].id)
            .eq('user_id', session.user.id)
            .single();
            
          if (collabError) {
            if (collabError.code !== 'PGRST116') { // Not found error
              throw collabError;
            }
            setUserAccess('none');
            return;
          }
          
          if (collabData) {
            setUserAccess(collabData.role as 'editor' | 'viewer');
          } else {
            setUserAccess('none');
          }
        }
      } catch (err) {
        console.error('Error checking access:', err);
        setUserAccess('none');
      } finally {
        setIsCheckingAccess(false);
      }
    }
    
    checkUserAccess();
  }, [id, session]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get the data entry using numeric_id
      const { data: entryData, error: entryError } = await supabase
        .from('data_entries')
        .select('*')
        .eq('numeric_id', parseInt(id));

      if (entryError) throw entryError;

      // Check if any data was returned
      if (!entryData || entryData.length === 0) {
        setError('Data entry not found');
        setLoading(false);
        return;
      }

      // Use the first entry found
      const entry = entryData[0];
      setDataEntry(entry);

      // Then load columns
      const { data: columnData, error: columnError } = await supabase
        .from('table_columns')
        .select('*')
        .eq('data_entry_id', entry.id)
        .order('order', { ascending: true });

      if (columnError) throw columnError;
      setColumns(columnData || []);

      // Finally load rows with their cells
      const { data: rowData, error: rowError } = await supabase
        .from('table_rows')
        .select(`
          id,
          table_cells (
            column_id,
            value
          )
        `)
        .eq('data_entry_id', entry.id);

      if (rowError) throw rowError;
      
      if (rowData) {
        const formattedRows = rowData.map(row => ({
          id: row.id,
          cells: row.table_cells.reduce((acc: Record<string, any>, cell: any) => {
            acc[cell.column_id] = cell.value;
            return acc;
          }, {})
        }));
        setRows(formattedRows);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    setAddingRow(true);
    setNewRow({});
  };

  const handleSaveRow = async () => {
    if (!dataEntry) return;

    try {
      setSavingRow(true);

      // Create a new row
      const { data: rowData, error: rowError } = await supabase
        .from('table_rows')
        .insert({ data_entry_id: dataEntry.id })
        .select()
        .single();

      if (rowError) throw rowError;

      // Create cells for the row
      const cellsToInsert = columns.map(column => ({
        row_id: rowData.id,
        column_id: column.id,
        value: newRow[column.id] || null
      }));

      const { error: cellsError } = await supabase
        .from('table_cells')
        .insert(cellsToInsert);

      if (cellsError) throw cellsError;

      // Reload data to show new row
      await loadData();
      setAddingRow(false);
      setNewRow({});
    } catch (err: any) {
      console.error('Error saving row:', err);
      setError(err.message);
    } finally {
      setSavingRow(false);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    try {
      const { error } = await supabase
        .from('table_rows')
        .delete()
        .eq('id', rowId);

      if (error) throw error;

      // Remove the row from local state
      setRows(rows.filter(row => row.id !== rowId));
    } catch (err: any) {
      console.error('Error deleting row:', err);
      setError(err.message);
    }
  };

  const formatCellValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'number':
        return Number(value).toString();
      case 'amount':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          currencyDisplay: 'symbol'
        }).format(Number(value));
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return value.toString();
    }
  };

  const getPlaceholder = (type: string) => {
    switch (type) {
      case 'text':
        return 'Enter text (e.g. Product Name)';
      case 'number':
        return 'Enter number (e.g. 42)';
      case 'amount':
        return 'Enter amount (e.g. 99.99)';
      case 'date':
        return 'YYYY-MM-DD (e.g. 2025-05-15)';
      default:
        return 'Enter value';
    }
  };

  const getKeyboardType = (type: string) => {
    switch (type) {
      case 'number':
      case 'amount':
        return 'decimal-pad';
      default:
        return 'default';
    }
  };

  const handleAddColumn = async () => {
    if (!dataEntry || !newColumn.name) return;
    
    try {
      setAddingColumn(true);
      
      // Get max order to place new column at the end
      const maxOrder = columns.reduce((max, col) => Math.max(max, col.order), 0);
      
      // Add the column to the database
      const { data, error } = await supabase
        .from('table_columns')
        .insert({
          data_entry_id: dataEntry.id,
          name: newColumn.name,
          type: newColumn.type,
          order: maxOrder + 1
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Update local state
      setColumns([...columns, data]);
      
      // Clear form and close modal
      setNewColumn({ name: '', type: 'text' });
      setShowColumnModal(false);
      
    } catch (err: any) {
      console.error('Error adding column:', err);
      setError(err.message);
    } finally {
      setAddingColumn(false);
    }
  };

  const cellMatchesSearch = (value: any, type: string) => {
    if (!searchQuery.trim() || value === null || value === undefined) return false;
    
    const formattedValue = formatCellValue(value, type).toLowerCase();
    return formattedValue.includes(searchQuery.toLowerCase());
  };

  const handleCalendarClick = (rowId: string) => {
    setSelectedRow(rowId);
    setShowDateModal(true);
    setDateView('year');
    
    // Find the current date for this row
    const row = rows.find(r => r.id === rowId);
    if (row) {
      // Try to find a date cell
      const dateColumn = columns.find(col => col.type === 'date');
      if (dateColumn && row.cells[dateColumn.id]) {
        const dateValue = row.cells[dateColumn.id];
        if (dateValue) {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            setSelectedDate(date);
            setTempYear(date.getFullYear());
            setTempMonth(date.getMonth());
            return;
          }
        }
      }
    }
    
    // Default to today if no date found
    setSelectedDate(new Date());
    setTempYear(new Date().getFullYear());
    setTempMonth(new Date().getMonth());
  };
  
  const handleSetDate = async () => {
    if (!selectedDate || !selectedRow || !dataEntry) return;
    
    try {
      // Find the date column
      const dateColumn = columns.find(col => col.type === 'date');
      if (!dateColumn) {
        // If no date column exists, create one
        const { data: newColumn, error: columnError } = await supabase
          .from('table_columns')
          .insert({
            data_entry_id: dataEntry?.id,
            name: 'Date',
            type: 'date',
            order: columns.length + 1
          })
          .select()
          .single();
          
        if (columnError) throw columnError;
        
        // Add the new column to state
        setColumns([...columns, newColumn]);
        
        // Format the date
        const formattedDate = selectedDate.toISOString().split('T')[0];
        
        // Create a cell with the date value
        const { error: cellError } = await supabase
          .from('table_cells')
          .insert({
            row_id: selectedRow,
            column_id: newColumn.id,
            value: formattedDate
          });
          
        if (cellError) throw cellError;
      } else {
        // Format the date
        const formattedDate = selectedDate.toISOString().split('T')[0];
        
        // Update the existing date cell
        const { error } = await supabase
          .from('table_cells')
          .upsert({
            row_id: selectedRow,
            column_id: dateColumn.id,
            value: formattedDate
          });
          
        if (error) throw error;
      }
      
      // CRITICAL FIX: Also update the entry's created_at date to match the selected date
      // This ensures the entry appears in the correct place in the organized data view
      const { error: updateError } = await supabase
        .from('data_entries')
        .update({ 
          created_at: selectedDate.toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', dataEntry.id);
        
      if (updateError) {
        console.error('Error updating entry date:', updateError);
      } else {
        console.log('Successfully updated entry date to:', selectedDate.toISOString());
      }
      
      // Reload the data
      await loadData();
      
      // Close the modal
      setShowDateModal(false);
      
      // Show confirmation to user
      Alert.alert(
        "Date Updated", 
        "The entry date has been updated successfully. This will be reflected in the organized view on the home screen.",
        [{ text: "OK" }]
      );
    } catch (err: any) {
      console.error('Error setting date:', err);
      setError(err.message);
      Alert.alert("Error", "Failed to update date. Please try again.");
    }
  };
  
  const renderDateModal = () => {
    const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 10 + i);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const daysInMonth = new Date(tempYear, tempMonth + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return (
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {dateView === 'year' ? 'Select Year' : 
                 dateView === 'month' ? `Select Month (${tempYear})` : 
                 `Select Day (${months[tempMonth]} ${tempYear})`}
              </Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.datePickerContainer}>
              {dateView === 'year' && (
                <View style={styles.dateGrid}>
                  {years.map(year => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.dateItem,
                        tempYear === year && { backgroundColor: `${colors.primary}20` }
                      ]}
                      onPress={() => {
                        setTempYear(year);
                        setDateView('month');
                      }}
                    >
                      <Text 
                        style={[
                          styles.dateItemText,
                          { color: tempYear === year ? colors.primary : colors.text }
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {dateView === 'month' && (
                <View style={styles.dateGrid}>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.dateItem,
                        tempMonth === index && { backgroundColor: `${colors.primary}20` }
                      ]}
                      onPress={() => {
                        setTempMonth(index);
                        setDateView('day');
                      }}
                    >
                      <Text 
                        style={[
                          styles.dateItemText,
                          { color: tempMonth === index ? colors.primary : colors.text }
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {dateView === 'day' && (
                <View style={styles.dateGrid}>
                  {days.map(day => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dateItem,
                        selectedDate && 
                        selectedDate.getDate() === day &&
                        selectedDate.getMonth() === tempMonth &&
                        selectedDate.getFullYear() === tempYear && 
                        { backgroundColor: `${colors.primary}20` }
                      ]}
                      onPress={() => {
                        const newDate = new Date(tempYear, tempMonth, day);
                        setSelectedDate(newDate);
                      }}
                    >
                      <Text 
                        style={[
                          styles.dateItemText,
                          { 
                            color: selectedDate && 
                                   selectedDate.getDate() === day &&
                                   selectedDate.getMonth() === tempMonth &&
                                   selectedDate.getFullYear() === tempYear
                                   ? colors.primary : colors.text 
                          }
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalActions}>
              {dateView !== 'year' && (
                <Button
                  title="Back"
                  onPress={() => {
                    if (dateView === 'month') setDateView('year');
                    if (dateView === 'day') setDateView('month');
                  }}
                  variant="outline"
                  style={styles.modalButton}
                />
              )}
              
              {dateView === 'day' && selectedDate && (
                <Button
                  title="Set Date"
                  onPress={handleSetDate}
                  style={styles.modalButton}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (isCheckingAccess) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Checking access...</Text>
      </View>
    );
  }

  if (error === 'Data entry not found') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            The requested table data could not be found.
          </Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, { color: '#FFF' }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (userAccess === 'none') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyText, { color: colors.text, fontWeight: 'bold', fontSize: 20, marginBottom: 8 }]}>
            Access Denied
          </Text>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            You don't have permission to view this table data.
          </Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, { color: '#FFF' }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{dataEntry?.name || 'Data Entry'}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {dataEntry?.description && (
          <Text style={[styles.description, { color: colors.secondaryText }]}>
            {dataEntry.description}
          </Text>
        )}

        <View style={styles.tableContainer}>
          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
            <Search size={18} color={colors.secondaryText} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search table content..."
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

          {(userAccess === 'owner' || userAccess === 'editor') && (
            <TouchableOpacity
              style={[styles.addColumnButton, { backgroundColor: colors.card }]}
              onPress={() => setShowColumnModal(true)}
            >
              <Plus size={18} color={colors.primary} />
              <Text style={[styles.addColumnText, { color: colors.primary }]}>
                Add Column
              </Text>
            </TouchableOpacity>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={[styles.headerRow, { backgroundColor: colors.card }]}>
                {columns.map((column) => (
                  <View key={column.id} style={styles.headerCell}>
                    <Text style={[styles.headerText, { color: colors.text }]}>
                      {column.name}
                    </Text>
                    <Text style={[styles.typeText, { color: colors.secondaryText }]}>
                      {column.type}
                    </Text>
                  </View>
                ))}
                <View style={[styles.headerCell, styles.actionCell]}>
                  <Text style={[styles.headerText, { color: colors.text }]}>
                    Actions
                  </Text>
                </View>
              </View>

              {rows.map((row) => (
                <View key={row.id} style={[styles.row, { backgroundColor: colors.card }]}>
                  {columns.map((column) => {
                    const cellValue = row.cells[column.id];
                    const isMatch = cellMatchesSearch(cellValue, column.type);
                    
                    return (
                    <View key={column.id} style={styles.cell}>
                        <Text 
                          style={[
                            styles.cellText, 
                            { color: colors.text },
                            isMatch && styles.highlightedCell,
                          ]}
                        >
                          {formatCellValue(cellValue, column.type)}
                      </Text>
                    </View>
                    );
                  })}
                  <View style={[styles.cell, styles.actionCell]}>
                    {(userAccess === 'owner' || userAccess === 'editor') && (
                    <TouchableOpacity
                        onPress={() => handleCalendarClick(row.id)}
                        style={[styles.calendarButton, { backgroundColor: `${colors.primary}20` }]}
                    >
                        <Calendar size={18} color={colors.primary} />
                    </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              {addingRow && (
                <View style={[styles.row, { backgroundColor: colors.card }]}>
                  {columns.map((column) => (
                    <View key={column.id} style={styles.cell}>
                      <TextInput
                        style={[styles.input, { 
                          color: colors.text,
                          backgroundColor: colors.background 
                        }]}
                        value={newRow[column.id] || ''}
                        onChangeText={(text) => setNewRow({ ...newRow, [column.id]: text })}
                        placeholder={getPlaceholder(column.type)}
                        placeholderTextColor={colors.secondaryText}
                        keyboardType={getKeyboardType(column.type)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {!addingRow ? (
            (userAccess === 'owner' || userAccess === 'editor') && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.card }]}
              onPress={handleAddRow}
            >
              <Plus size={20} color={colors.primary} />
              <Text style={[styles.addButtonText, { color: colors.primary }]}>
                Add Row
              </Text>
            </TouchableOpacity>
            )
          ) : (
            <View style={styles.rowActions}>
              <Button
                title="Cancel"
                onPress={() => setAddingRow(false)}
                variant="outline"
                style={styles.actionButton}
              />
              <Button
                title="Save"
                onPress={handleSaveRow}
                loading={savingRow}
                style={styles.actionButton}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.homeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Home size={24} color="#FFFFFF" />
            <Text style={styles.homeButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showColumnModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowColumnModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add New Column
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Column Name</Text>
              <TextInput
                style={[styles.modalInput, { 
                  color: colors.text,
                  backgroundColor: colors.background
                }]}
                value={newColumn.name}
                onChangeText={(text) => setNewColumn({...newColumn, name: text})}
                placeholder="e.g. Price, Date, Category"
                placeholderTextColor={colors.secondaryText}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Column Type</Text>
              <View style={styles.typeButtons}>
                {['text', 'number', 'amount', 'date'].map(type => (
                  <TouchableOpacity 
                    key={type}
                    style={[
                      styles.typeButton,
                      newColumn.type === type && { 
                        backgroundColor: `${colors.primary}20` 
                      }
                    ]}
                    onPress={() => setNewColumn({...newColumn, type})}
                  >
                    <Text 
                      style={[
                        styles.typeButtonText,
                        { color: newColumn.type === type ? colors.primary : colors.text }
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setNewColumn({ name: '', type: 'text' });
                  setShowColumnModal(false);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Add Column"
                onPress={handleAddColumn}
                loading={addingColumn}
                style={styles.modalButton}
                disabled={!newColumn.name}
              />
            </View>
          </View>
        </View>
      </Modal>
      
      {renderDateModal()}
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
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
  },
  tableContainer: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 8,
  },
  headerCell: {
    padding: 16,
    minWidth: 150,
  },
  headerText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  row: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 8,
  },
  cell: {
    padding: 16,
    minWidth: 150,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  input: {
    padding: 8,
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    minWidth: 100,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  actionCell: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 40,
    gap: 12,
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  addColumnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  addColumnText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  modalInput: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    minWidth: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 4,
  },
  highlightedCell: {
    backgroundColor: 'rgba(255, 230, 0, 0.3)',
    fontWeight: 'bold',
    borderRadius: 4,
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
  shareButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    maxHeight: 400,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dateItem: {
    width: '30%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});