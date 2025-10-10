/**
 * UI Component Library
 *
 * A comprehensive collection of reusable UI components for ChastityOS.
 * All components are fully typed, accessible, and follow consistent design patterns.
 *
 * @example
 * ```tsx
 * import { Button, Input, Card, Badge } from '@/components/ui';
 *
 * function MyComponent() {
 *   return (
 *     <Card>
 *       <Input label="Name" />
 *       <Badge variant="success">Active</Badge>
 *       <Button variant="primary">Submit</Button>
 *     </Card>
 *   );
 * }
 * ```
 */

// Button Components
export { Button, IconButton } from "./Button";
export type { ButtonProps, IconButtonProps } from "./Button";

// Form Components
export {
  Input,
  Textarea,
  FormField,
  Switch,
  Checkbox,
  Radio,
  RadioGroup,
} from "./Form";
export type {
  InputProps,
  TextareaProps,
  FormFieldProps,
  SwitchProps,
  CheckboxProps,
  RadioProps,
  RadioGroupProps,
  RadioOption,
} from "./Form";

// Feedback Components
export {
  Spinner,
  LoadingState,
  Alert,
  EmptyState,
  ErrorState,
} from "./Feedback";
export type {
  SpinnerProps,
  LoadingStateProps,
  AlertProps,
  EmptyStateProps,
  ErrorStateProps,
} from "./Feedback";

// Layout Components
export { Card, CardHeader, CardBody, CardFooter, Divider } from "./Layout";
export type {
  CardProps,
  CardHeaderProps,
  CardBodyProps,
  CardFooterProps,
  DividerProps,
} from "./Layout";

// Data Display Components
export { Badge, Avatar, Progress } from "./DataDisplay";
export type { BadgeProps, AvatarProps, ProgressProps } from "./DataDisplay";

// Tooltip Component
export { Tooltip } from "./Tooltip";
export type { TooltipProps } from "./Tooltip";

// Toggle Components
export { ToggleGroup } from "./ToggleGroup";
export type { ToggleGroupProps, ToggleGroupOption } from "./ToggleGroup";
