/**
 * Select Component
 * Dropdown select field with label, error states, and icons
 */
import React, { forwardRef, useState, useRef, useEffect } from "react";

export interface SelectOption {
  /**
   * Option value
   */
  value: string | number;
  /**
   * Option label to display
   */
  label: string;
  /**
   * Whether option is disabled
   */
  disabled?: boolean;
  /**
   * Optional icon to display with option
   */
  icon?: React.ReactNode;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /**
   * Current value
   */
  value: string | number;
  /**
   * Change handler - receives the selected value
   */
  onChange: (value: string | number) => void;
  /**
   * Options to display in dropdown
   */
  options: SelectOption[];
  /**
   * Placeholder text when no value selected
   */
  placeholder?: string;
  /**
   * Select label
   */
  label?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Help text to display below select
   */
  helpText?: string;
  /**
   * Icon to display on the left side
   */
  icon?: React.ReactNode;
  /**
   * Whether the dropdown is searchable/filterable
   */
  searchable?: boolean;
  /**
   * Select size
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether to take full width
   * @default true
   */
  fullWidth?: boolean;
}

// Size classes
const sizeClasses = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-12 px-5 text-lg",
};

/**
 * Select Label Component
 */
const SelectLabel: React.FC<{
  label?: string;
  required?: boolean;
  htmlFor?: string;
}> = ({ label, required, htmlFor }) => {
  if (!label) return null;

  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
    >
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

/**
 * Select Icon Component
 */
const SelectIcon: React.FC<{
  icon: React.ReactNode;
}> = ({ icon }) => (
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <div className="text-gray-400">{icon}</div>
  </div>
);

/**
 * Select Arrow Icon Component
 */
const SelectArrow: React.FC<{ isOpen?: boolean }> = ({ isOpen = false }) => (
  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
    <svg
      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </div>
);

/**
 * Select Message Component
 */
const SelectMessage: React.FC<{
  error?: string;
  helpText?: string;
}> = ({ error, helpText }) => {
  if (error) {
    return (
      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
        <svg
          className="w-4 h-4 mr-1 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        {error}
      </p>
    );
  }

  if (helpText) {
    return (
      <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
        {helpText}
      </p>
    );
  }

  return null;
};

/**
 * Select Component
 *
 * @example
 * ```tsx
 * const options = [
 *   { value: 'option1', label: 'Option 1' },
 *   { value: 'option2', label: 'Option 2' },
 *   { value: 'option3', label: 'Option 3', disabled: true }
 * ];
 *
 * <Select
 *   label="Choose an option"
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 *   options={options}
 *   placeholder="Select..."
 * />
 *
 * <Select
 *   label="With Icon"
 *   icon={<SearchIcon />}
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 *   options={options}
 * />
 *
 * <Select
 *   label="With Error"
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 *   options={options}
 *   error="This field is required"
 * />
 * ```
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helpText,
      icon,
      searchable = false,
      size = "md",
      fullWidth = true,
      value,
      onChange,
      options,
      placeholder,
      className = "",
      id,
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
    // Generate unique ID if not provided
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    const selectClasses = `
      ${fullWidth ? "w-full" : ""}
      ${sizeClasses[size]}
      ${icon ? "pl-10" : ""}
      pr-10
      ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "focus:border-purple-500 focus:ring-purple-500/20"}
      border-2 border-gray-300 dark:border-gray-600
      bg-white dark:bg-gray-800
      rounded-lg
      font-medium
      text-gray-900 dark:text-white
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2
      disabled:opacity-50 disabled:cursor-not-allowed
      appearance-none
      cursor-pointer
      ${className}
    `
      .trim()
      .replace(/\s+/g, " ");

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = e.target.value;
      // Try to convert to number if original value was number
      const option = options.find((opt) => String(opt.value) === selectedValue);
      if (option) {
        onChange(option.value);
      }
    };

    // For searchable variant, we'll implement a custom dropdown
    if (searchable) {
      return (
        <SearchableSelect
          label={label}
          error={error}
          helpText={helpText}
          icon={icon}
          size={size}
          fullWidth={fullWidth}
          value={value}
          onChange={onChange}
          options={options}
          placeholder={placeholder}
          selectId={selectId}
          required={required}
          disabled={disabled}
        />
      );
    }

    return (
      <div className={fullWidth ? "w-full" : ""}>
        <SelectLabel label={label} required={required} htmlFor={selectId} />

        <div className="relative">
          {icon && <SelectIcon icon={icon} />}

          <select
            ref={ref}
            id={selectId}
            value={String(value)}
            onChange={handleChange}
            className={selectClasses}
            disabled={disabled}
            required={required}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={String(option.value)}
                value={String(option.value)}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <SelectArrow />
        </div>

        <SelectMessage error={error} helpText={helpText} />
      </div>
    );
  },
);

Select.displayName = "Select";

/**
 * Searchable Select Component
 * Custom dropdown with search/filter functionality
 */
const SearchableSelect: React.FC<{
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
  size: "sm" | "md" | "lg";
  fullWidth: boolean;
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  selectId: string;
  required?: boolean;
  disabled?: boolean;
}> = ({
  label,
  error,
  helpText,
  icon,
  size,
  fullWidth,
  value,
  onChange,
  options,
  placeholder,
  selectId,
  required,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label || placeholder || "Select...";

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleOptionClick = (option: SelectOption) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const selectClasses = `
    ${fullWidth ? "w-full" : ""}
    ${sizeClasses[size]}
    ${icon ? "pl-10" : ""}
    pr-10
    ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "focus:border-purple-500 focus:ring-purple-500/20"}
    border-2 border-gray-300 dark:border-gray-600
    bg-white dark:bg-gray-800
    rounded-lg
    font-medium
    text-gray-900 dark:text-white
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2
    disabled:opacity-50 disabled:cursor-not-allowed
    cursor-pointer
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <div className={fullWidth ? "w-full" : ""} ref={dropdownRef}>
      <SelectLabel label={label} required={required} htmlFor={selectId} />

      <div className="relative">
        {icon && <SelectIcon icon={icon} />}

        <div
          className={selectClasses}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={!selectedOption ? "text-gray-400" : ""}>
            {displayValue}
          </span>
        </div>

        <SelectArrow isOpen={isOpen} />

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg backdrop-blur-sm max-h-60 overflow-hidden"
            role="listbox"
          >
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Options List */}
            <div className="overflow-y-auto max-h-48">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={String(option.value)}
                    onClick={() => handleOptionClick(option)}
                    className={`
                      flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors
                      ${option.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 dark:hover:bg-gray-700"}
                      ${option.value === value ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" : "text-gray-900 dark:text-white"}
                    `}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {option.icon && (
                      <span className="flex-shrink-0">{option.icon}</span>
                    )}
                    <span className="text-sm">{option.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <SelectMessage error={error} helpText={helpText} />
    </div>
  );
};
