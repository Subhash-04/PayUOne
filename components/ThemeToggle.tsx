import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Modal, Pressable } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react-native';
import Colors, { addAlpha } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'light', icon: Sun, label: 'Light', preview: Colors.light },
    { value: 'system', icon: Monitor, label: 'System', preview: isDark ? Colors.dark : Colors.light },
    { value: 'dark', icon: Moon, label: 'Dark', preview: Colors.dark },
  ] as const;

  const selectedOption = options.find(option => option.value === theme);

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.card }]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <selectedOption.icon size={20} color={colors.text} />
        <Text style={[styles.triggerText, { color: colors.text }]}>
          {selectedOption.label}
        </Text>
        <ChevronDown size={16} color={colors.text} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsOpen(false)}
        >
          <View 
            style={[
              styles.dropdown,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              }
            ]}
          >
            {options.map(({ value, icon: Icon, label, preview }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.option,
                  {
                    backgroundColor: theme === value ? addAlpha(colors.primary, 0.1) : 'transparent',
                  },
                ]}
                onPress={() => {
                  setTheme(value);
                  setIsOpen(false);
                }}
              >
                <View style={styles.optionContent}>
                  <Icon
                    size={20}
                    color={theme === value ? colors.primary : colors.text}
                  />
                  <Text
                    style={[
                      styles.label,
                      {
                        color: theme === value ? colors.primary : colors.text,
                        fontWeight: theme === value ? '600' : '400',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
                <View style={styles.preview}>
                  <LinearGradient
                    colors={[preview.gradientStart, preview.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.previewGradient}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  triggerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdown: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  preview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewGradient: {
    width: '100%',
    height: '100%',
  },
});