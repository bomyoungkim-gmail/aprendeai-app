import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AuthInputProps {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password';
  placeholder?: string;
  icon: LucideIcon;
  error?: string;
  register: any; // react-hook-form register
  required?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  id,
  label,
  type,
  placeholder,
  icon: Icon,
  error,
  register,
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          {...register(id)}
          type={type}
          id={id}
          className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
