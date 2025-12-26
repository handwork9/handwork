import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastType } from '../components/common/Toast';

interface ToastData {
  title: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onPress?: () => void;
}

interface ToastContextType {
  showToast: (data: ToastData) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [toastData, setToastData] = useState<ToastData>({
    title: '',
    message: '',
    type: 'info',
  });

  const showToast = useCallback((data: ToastData) => {
    setToastData(data);
    setVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        visible={visible}
        title={toastData.title}
        message={toastData.message}
        type={toastData.type}
        duration={toastData.duration}
        onDismiss={hideToast}
        onPress={toastData.onPress}
      />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
