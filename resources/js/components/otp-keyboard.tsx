import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OtpKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

export function OtpKeyboard({ value, onChange, maxLength = 6, disabled = false }: OtpKeyboardProps) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleDigitClick = (digit: string) => {
    if (disabled) return;
    
    if (inputValue.length < maxLength) {
      const newValue = inputValue + digit;
      setInputValue(newValue);
      onChange(newValue);
    }
  };

  const handleBackspace = () => {
    if (disabled) return;
    
    if (inputValue.length > 0) {
      const newValue = inputValue.slice(0, -1);
      setInputValue(newValue);
      onChange(newValue);
    }
  };

  const handleClear = () => {
    if (disabled) return;
    
    setInputValue('');
    onChange('');
  };

  return (
    <div className="w-full">
      {/* OTP Display */}
      <div className="mb-4 flex items-center justify-center">
        {Array.from({ length: maxLength }).map((_, index) => (
          <div
            key={index}
            className="mx-1 flex h-12 w-10 items-center justify-center rounded-md border-2 border-gray-300 bg-white font-mono text-xl font-bold dark:border-gray-700 dark:bg-gray-800"
          >
            {inputValue[index] || ''}
          </div>
        ))}
      </div>

      {/* OTP Keyboard */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            type="button"
            variant="outline"
            className="h-14 text-xl font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30"
            onClick={() => handleDigitClick(num.toString())}
            disabled={disabled}
          >
            {num}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          className="h-14 text-xl font-semibold text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
          onClick={handleClear}
          disabled={disabled}
        >
          Clear
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-14 text-xl font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30"
          onClick={() => handleDigitClick('0')}
          disabled={disabled}
        >
          0
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-14 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/30"
          onClick={handleBackspace}
          disabled={disabled}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

export default OtpKeyboard; 