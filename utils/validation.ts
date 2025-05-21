interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export const validateName = (name: string): ValidationResult => {
  if (!name.trim()) {
    return {
      isValid: false,
      errorMessage: 'Name is required',
    };
  }
  
  if (name.trim().length < 2) {
    return {
      isValid: false,
      errorMessage: 'Name must be at least 2 characters',
    };
  }
  
  return { isValid: true };
};

export const validatePhoneNumber = (phoneNumber: string): ValidationResult => {
  if (!phoneNumber.trim()) {
    return {
      isValid: false,
      errorMessage: 'Phone number is required',
    };
  }
  
  // Only allow 10 digits
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phoneNumber.replace(/\D/g, ''))) {
    return {
      isValid: false,
      errorMessage: 'Please enter a valid 10-digit phone number',
    };
  }
  
  return { isValid: true };
};

export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return {
      isValid: false,
      errorMessage: 'Email is required',
    };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      errorMessage: 'Please enter a valid email address',
    };
  }
  
  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return {
      isValid: false,
      errorMessage: 'Password is required',
    };
  }
  
  if (password.length < 8) {
    return {
      isValid: false,
      errorMessage: 'Password must be at least 8 characters',
    };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      errorMessage: 'Password must contain at least one uppercase letter',
    };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      errorMessage: 'Password must contain at least one special character',
    };
  }
  
  // Check for at least one digit
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      errorMessage: 'Password must contain at least one digit',
    };
  }
  
  return { isValid: true };
};