// src/components/ui/Button.jsx
import { FaSpinner } from 'react-icons/fa';

export default function Button({
  children,
  variant = 'primary', // primary | secondary | danger | outline
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) {
  const base = `
    relative overflow-hidden rounded-2xl font-semibold transition-all duration-300 ease-out
    flex items-center justify-center gap-3 shadow-lg hover:shadow-2xl
    focus:outline-none focus:ring-4 focus:ring-red-200
    disabled:opacity-60 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-red-600 to-rose-600 text-white
      hover:from-red-700 hover:to-rose-700 hover:scale-[1.03] active:scale-[0.97]
    `,
    secondary: `
      bg-white border-2 border-red-600 text-red-600
      hover:bg-red-50 hover:border-red-700 hover:scale-[1.03]
    `,
    danger: `
      bg-gradient-to-r from-red-700 to-rose-800 text-white
      hover:from-red-800 hover:to-rose-900 hover:scale-[1.03]
    `,
    outline: `
      border-2 border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-600
      hover:bg-red-50 hover:scale-[1.03]
    `,
  };

  const sizes = {
    sm: 'px-5 py-2.5 text-sm',
    md: 'px-8 py-4 text-base',
    lg: 'px-10 py-5 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <FaSpinner className="animate-spin text-xl" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="text-xl transition-transform group-hover:scale-110" />}
          {children}
        </>
      )}

      {/* Shine effect on hover */}
      <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
    </button>
  );
}