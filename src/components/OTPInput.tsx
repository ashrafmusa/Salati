import React, { useRef, ChangeEvent, KeyboardEvent } from 'react';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

const OTPInput: React.FC<OTPInputProps> = ({ value, onChange, length = 6 }) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const newOtp = [...value];
    newOtp[index] = e.target.value.slice(-1); // Only take the last digit
    onChange(newOtp.join(''));

    // Move to next input if a digit is entered
    if (e.target.value && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').slice(0, length);
    if (/^\d+$/.test(paste)) {
        onChange(paste);
        // Focus the last filled input
        const focusIndex = Math.min(paste.length, length - 1);
        inputsRef.current[focusIndex]?.focus();
    }
  };


  return (
    <div className="flex justify-center gap-2 sm:gap-3" dir="ltr">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          // FIX: The ref callback should not return a value. Changed from `(el) => (...)` to `(el) => { ... }` to fix the type error.
          ref={(el) => { inputsRef.current[index] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={index === 0 ? handlePaste : undefined}
          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:border-primary transition bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
      ))}
    </div>
  );
};

export default OTPInput;