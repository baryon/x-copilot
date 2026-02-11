import { useEffect, useState } from 'react';

interface StatusMessageProps {
  message: string;
  type: 'success' | 'error' | '';
}

export default function StatusMessage({ message, type }: StatusMessageProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [message]);

  if (!visible || !message) return null;

  return (
    <div className={`text-center text-xs mt-2 min-h-[18px] ${
      type === 'success' ? 'text-x-success' : type === 'error' ? 'text-x-error' : ''
    }`}>
      {message}
    </div>
  );
}
