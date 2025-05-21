import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faHome,
  faUser,
  faPlus,
  faArrowLeft,
  faSearch,
  faDatabase,
  faEye,
  faEyeSlash,
  faEdit,
  faTrash,
  faUsers,
  faSave,
  faDesktop,
  faMoon,
  faSun,
  faChevronDown,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

interface IconButtonProps {
  icon: IconProp;
  onPress?: () => void;
  size?: number;
  color?: string;
  style?: any;
}

export function IconButton({ icon, onPress, size = 24, color, style }: IconButtonProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.iconButton, style]}
      activeOpacity={0.7}
    >
      <FontAwesomeIcon
        icon={icon}
        size={size}
        color={color || colors.text}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    padding: 8,
  },
});

// Export all icons
export const icons = {
  Home: faHome,
  User: faUser,
  Plus: faPlus,
  ArrowLeft: faArrowLeft,
  Search: faSearch,
  Database: faDatabase,
  Eye: faEye,
  EyeOff: faEyeSlash,
  Edit: faEdit,
  Trash: faTrash,
  Users: faUsers,
  Save: faSave,
  Monitor: faDesktop,
  Moon: faMoon,
  Sun: faSun,
  ChevronDown: faChevronDown,
  ChevronRight: faChevronRight,
};