import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft } from 'lucide-react-native';

type ColumnType = 'text' | 'number' | 'amount' | 'date';

interface Column {
  name: string;
  type: ColumnType;
}

export default function CreateDataScreen() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const { session } = useAuth();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState<Column[]>([{ name: '', type: 'text' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const addColumn = () => {
    setColumns([...columns, { name: '', type: 'text' }]);
  };

  const updateColumn = (index: number, field: keyof Column, value: string) => {
    const newColumns = [...columns];
    newColumns[index] = { 
      ...newColumns[index], 
      [field]: field === 'type' ? value as ColumnType : value 
    };
    setColumns(newColumns);
  };

  const removeColumn = (index: number) => {
    if (columns.length > 1) {
      const newColumns = columns.filter((_, i) => i !== index);
      setColumns(newColumns);
    }
  };

  const validateStep1 = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  const handleCreate = async () => {
    // Validate columns
    if (columns.some(col => !col.name.trim())) {
      setError('All columns must have names');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First create the data entry
      const { data: entry, error: createError } = await supabase
        .from('data_entries')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          owner_id: session?.user?.id
        })
        .select()
        .single();

      if (createError) throw createError;

      // Then create the columns
      const columnsToInsert = columns.map((col, index) => ({
        data_entry_id: entry.id,
        name: col.name.trim(),
        type: col.type,
        order: index + 1
      }));

      const { error: columnsError } = await supabase
        .from('table_columns')
        .insert(columnsToInsert);

      if (columnsError) throw columnsError;

      // Navigate to the table detail screen using the numeric_id
      router.push({
        pathname: '/table/[id]',
        params: { id: entry.numeric_id.toString() }
      });
    } catch (err: any) {
      console.error('Error creating data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={handleGoHome}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepIndicator, { color: colors.secondaryText }]}>
          Step 1 of 2
        </Text>
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>Create New Data</Text>
      <Text style={[styles.description, { color: colors.secondaryText }]}>
        Enter the details for your new data entry
      </Text>

      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}

      <View style={styles.form}>
        <Input
          label="Name"
          placeholder="Enter a name for your data"
          value={name}
          onChangeText={setName}
          containerStyle={styles.inputContainer}
        />

        <Input
          label="Description (Optional)"
          placeholder="Enter a description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          containerStyle={styles.inputContainer}
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Go to Home"
            onPress={handleGoHome}
            variant="outline"
            style={styles.button}
          />
          <Button
            title="Continue"
            onPress={validateStep1}
            style={styles.button}
          />
        </View>
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => setStep(1)}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepIndicator, { color: colors.secondaryText }]}>
          Step 2 of 2
        </Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>Define Columns</Text>
      <Text style={[styles.description, { color: colors.secondaryText }]}>
        Add columns to structure your data
      </Text>

      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}

      <View style={styles.form}>
        {columns.map((column, index) => (
          <View key={index} style={styles.columnContainer}>
            <View style={styles.columnHeader}>
              <Text style={[styles.columnLabel, { color: colors.text }]}>
                Column {index + 1}
              </Text>
              {columns.length > 1 && (
                <TouchableOpacity 
                  onPress={() => removeColumn(index)}
                  style={[styles.removeButton, { borderColor: colors.error }]}
                >
                  <Text style={{ color: colors.error }}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <Input
              label="Name"
              placeholder="Enter column name"
              value={column.name}
              onChangeText={(value) => updateColumn(index, 'name', value)}
              containerStyle={styles.columnInput}
            />

            <View style={styles.typeContainer}>
              <Text style={[styles.typeLabel, { color: colors.text }]}>Type</Text>
              <View style={styles.typeButtons}>
                {(['text', 'number', 'amount', 'date'] as ColumnType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      { 
                        backgroundColor: column.type === type ? colors.primary : 'transparent',
                        borderColor: column.type === type ? colors.primary : colors.border
                      }
                    ]}
                    onPress={() => updateColumn(index, 'type', type)}
                  >
                    <Text 
                      style={[
                        styles.typeButtonText,
                        { color: column.type === type ? '#FFFFFF' : colors.text }
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}

        <Button
          title="Add Column"
          onPress={addColumn}
          variant="outline"
          fullWidth
          style={styles.addButton}
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={handleGoHome}
            variant="outline"
            style={styles.button}
          />
          <Button
            title="Save"
            onPress={handleCreate}
            loading={isLoading}
            style={styles.button}
          />
        </View>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {step === 1 ? renderStep1() : renderStep2()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepIndicator: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  description: {
    fontSize: 16,
    marginBottom: 32,
    fontFamily: 'Inter-Regular',
  },
  error: {
    marginBottom: 16,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  columnContainer: {
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  columnLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  columnInput: {
    marginBottom: 16,
  },
  typeContainer: {
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
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
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
  addButton: {
    marginBottom: 16,
  },
});