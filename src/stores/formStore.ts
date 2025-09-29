/**
 * Form Store - Form State Management
 * Manages form state, validation, and dirty tracking for complex forms
 */
import React from "react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Define common form field value types
export type FormFieldValue =
  | string
  | number
  | boolean
  | Date
  | string[]
  | null
  | undefined;

export interface FormField {
  value: FormFieldValue;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState {
  // Form registry - stores forms by ID
  forms: Record<
    string,
    {
      fields: Record<string, FormField>;
      isSubmitting: boolean;
      isValid: boolean;
      isDirty: boolean;
      submitCount: number;
      lastSubmitted?: Date;
    }
  >;

  // Actions
  createForm: (
    formId: string,
    initialValues?: Record<string, FormFieldValue>,
  ) => void;
  destroyForm: (formId: string) => void;
  setFieldValue: (
    formId: string,
    fieldName: string,
    value: FormFieldValue,
  ) => void;
  setFieldError: (formId: string, fieldName: string, error?: string) => void;
  touchField: (formId: string, fieldName: string) => void;
  resetForm: (
    formId: string,
    newValues?: Record<string, FormFieldValue>,
  ) => void;
  setSubmitting: (formId: string, isSubmitting: boolean) => void;
  incrementSubmitCount: (formId: string) => void;

  // Validation
  validateField: (
    formId: string,
    fieldName: string,
    validator: (value: FormFieldValue) => string | undefined,
  ) => void;
  validateForm: (
    formId: string,
    validators: Record<string, (value: FormFieldValue) => string | undefined>,
  ) => boolean;

  // Utility getters
  getForm: (formId: string) => FormState["forms"][string] | undefined;
  getFieldValue: (formId: string, fieldName: string) => FormFieldValue;
  getFieldError: (formId: string, fieldName: string) => string | undefined;
  isFieldTouched: (formId: string, fieldName: string) => boolean;
  isFieldDirty: (formId: string, fieldName: string) => boolean;
  isFormValid: (formId: string) => boolean;
  isFormDirty: (formId: string) => boolean;
  isFormSubmitting: (formId: string) => boolean;
}

// Helper functions to break down complexity
const createFieldsFromValues = (
  initialValues: Record<string, FormFieldValue>,
): Record<string, FormField> => {
  const fields: Record<string, FormField> = {};
  Object.entries(initialValues).forEach(([key, value]) => {
    fields[key] = {
      value,
      touched: false,
      dirty: false,
    };
  });
  return fields;
};

const createFormInstance = (initialValues: Record<string, FormFieldValue>) => ({
  fields: createFieldsFromValues(initialValues),
  isSubmitting: false,
  isValid: true,
  isDirty: false,
  submitCount: 0,
});

const updateFieldInForm = (
  form: FormState["forms"][string],
  fieldName: string,
  updates: Partial<FormField>,
) => {
  const field = form.fields[fieldName] || {
    value: undefined,
    touched: false,
    dirty: false,
  };

  return {
    ...form,
    fields: {
      ...form.fields,
      [fieldName]: {
        ...field,
        ...updates,
      },
    },
  };
};

const calculateFormDirty = (fields: Record<string, FormField>): boolean =>
  Object.values(fields).some((f) => f.dirty);

const calculateFormValid = (fields: Record<string, FormField>): boolean =>
  !Object.values(fields).some((f) => f.error);

// Validation functions
const validateSingleField = (
  get: () => FormState,
  formId: string,
  fieldName: string,
  validator: (value: FormFieldValue) => string | undefined,
) => {
  const form = get().forms[formId];
  if (!form) return;

  const field = form.fields[fieldName];
  if (!field) return;

  const error = validator(field.value);
  get().setFieldError(formId, fieldName, error);
};

const validateMultipleFields = (
  get: () => FormState,
  formId: string,
  validators: Record<string, (value: FormFieldValue) => string | undefined>,
): boolean => {
  const form = get().forms[formId];
  if (!form) return false;

  let isValid = true;
  Object.entries(validators).forEach(([fieldName, validator]) => {
    const field = form.fields[fieldName];
    if (!field) return;

    const error = validator(field.value);
    get().setFieldError(formId, fieldName, error);
    if (error) isValid = false;
  });

  return isValid;
};

// Form lifecycle actions
const createFormLifecycleActions = (
  set: (state: Partial<FormState> | ((state: FormState) => FormState)) => void,
) => ({
  createForm: (formId: string, initialValues = {}) =>
    set(
      (state: FormState) => {
        if (state.forms[formId]) return state;
        return {
          forms: {
            ...state.forms,
            [formId]: createFormInstance(initialValues),
          },
        };
      },
      false,
      `createForm:${formId}`,
    ),

  destroyForm: (formId: string) =>
    set(
      (state: FormState) => {
        const { [formId]: _removed, ...rest } = state.forms;
        return { forms: rest };
      },
      false,
      `destroyForm:${formId}`,
    ),
});

// Field manipulation actions
const createFieldActions = (
  set: (state: Partial<FormState> | ((state: FormState) => FormState)) => void,
) => ({
  setFieldValue: (formId: string, fieldName: string, value: FormFieldValue) =>
    set(
      (state: FormState) => {
        const form = state.forms[formId];
        if (!form) return state;

        const currentField = form.fields[fieldName];
        const isDirty = currentField ? currentField.value !== value : true;

        const updatedForm = updateFieldInForm(form, fieldName, {
          value,
          dirty: isDirty,
        });
        const formIsDirty = calculateFormDirty(updatedForm.fields);

        return {
          forms: {
            ...state.forms,
            [formId]: {
              ...updatedForm,
              isDirty: formIsDirty,
            },
          },
        };
      },
      false,
      `setFieldValue:${formId}.${fieldName}`,
    ),

  setFieldError: (formId: string, fieldName: string, error?: string) =>
    set(
      (state: FormState) => {
        const form = state.forms[formId];
        if (!form) return state;

        const updatedForm = updateFieldInForm(form, fieldName, { error });
        const isValid = calculateFormValid(updatedForm.fields);

        return {
          forms: {
            ...state.forms,
            [formId]: {
              ...updatedForm,
              isValid,
            },
          },
        };
      },
      false,
      `setFieldError:${formId}.${fieldName}`,
    ),

  touchField: (formId: string, fieldName: string) =>
    set(
      (state: FormState) => {
        const form = state.forms[formId];
        if (!form) return state;

        const updatedForm = updateFieldInForm(form, fieldName, {
          touched: true,
        });

        return {
          forms: {
            ...state.forms,
            [formId]: updatedForm,
          },
        };
      },
      false,
      `touchField:${formId}.${fieldName}`,
    ),
});

// Form state actions
const createFormStateActions = (
  set: (state: Partial<FormState> | ((state: FormState) => FormState)) => void,
) => ({
  resetForm: (formId: string, newValues = {}) =>
    set(
      (state: FormState) => {
        const form = state.forms[formId];
        if (!form) return state;

        return {
          forms: {
            ...state.forms,
            [formId]: {
              ...form,
              fields: createFieldsFromValues(newValues),
              isDirty: false,
              isValid: true,
            },
          },
        };
      },
      false,
      `resetForm:${formId}`,
    ),

  setSubmitting: (formId: string, isSubmitting: boolean) =>
    set(
      (state: FormState) => {
        const form = state.forms[formId];
        if (!form) return state;

        return {
          forms: {
            ...state.forms,
            [formId]: {
              ...form,
              isSubmitting,
              ...(isSubmitting ? {} : { lastSubmitted: new Date() }),
            },
          },
        };
      },
      false,
      `setSubmitting:${formId}`,
    ),

  incrementSubmitCount: (formId: string) =>
    set(
      (state: FormState) => {
        const form = state.forms[formId];
        if (!form) return state;

        return {
          forms: {
            ...state.forms,
            [formId]: {
              ...form,
              submitCount: form.submitCount + 1,
            },
          },
        };
      },
      false,
      `incrementSubmitCount:${formId}`,
    ),
});

// Form validation actions
const createValidationActions = (get: () => FormState) => ({
  validateField: (
    formId: string,
    fieldName: string,
    validator: (value: FormFieldValue) => string | undefined,
  ) => validateSingleField(get, formId, fieldName, validator),

  validateForm: (
    formId: string,
    validators: Record<string, (value: FormFieldValue) => string | undefined>,
  ) => validateMultipleFields(get, formId, validators),
});

// Form state actions
const createFormActions = (
  set: (state: Partial<FormState> | ((state: FormState) => FormState)) => void,
  get: () => FormState,
) => ({
  ...createFormLifecycleActions(set),
  ...createFieldActions(set),
  ...createFormStateActions(set),
  ...createValidationActions(get),
});

export const useFormStore = create<FormState>()(
  devtools(
    (set, get) => ({
      // Initial state
      forms: {},

      // All actions
      ...createFormActions(set, get),

      // Utility getters
      getForm: (formId: string) => get().forms[formId],
      getFieldValue: (formId: string, fieldName: string) =>
        get().forms[formId]?.fields[fieldName]?.value,
      getFieldError: (formId: string, fieldName: string) =>
        get().forms[formId]?.fields[fieldName]?.error,
      isFieldTouched: (formId: string, fieldName: string) =>
        get().forms[formId]?.fields[fieldName]?.touched ?? false,
      isFieldDirty: (formId: string, fieldName: string) =>
        get().forms[formId]?.fields[fieldName]?.dirty ?? false,
      isFormValid: (formId: string) => get().forms[formId]?.isValid ?? false,
      isFormDirty: (formId: string) => get().forms[formId]?.isDirty ?? false,
      isFormSubmitting: (formId: string) =>
        get().forms[formId]?.isSubmitting ?? false,
    }),
    {
      name: "form-store",
    },
  ),
);

// Selector hooks for better performance
export const useForm = (formId: string) =>
  useFormStore((state) => state.forms[formId]);

export const useFormField = (formId: string, fieldName: string) =>
  useFormStore((state) => state.forms[formId]?.fields[fieldName]);

export const useFormActions = () =>
  useFormStore((state) => ({
    createForm: state.createForm,
    destroyForm: state.destroyForm,
    setFieldValue: state.setFieldValue,
    setFieldError: state.setFieldError,
    touchField: state.touchField,
    resetForm: state.resetForm,
    setSubmitting: state.setSubmitting,
    validateField: state.validateField,
    validateForm: state.validateForm,
  }));

// Utility hook for easier form management
export const useFormManager = (formId: string, initialValues = {}) => {
  const form = useForm(formId);
  const actions = useFormActions();

  // Auto-create form on mount
  React.useEffect(() => {
    if (!form) {
      actions.createForm(formId, initialValues);
    }
  }, [formId, form, actions, initialValues]);

  // Auto-destroy form on unmount
  React.useEffect(() => {
    return () => {
      actions.destroyForm(formId);
    };
  }, [formId, actions]);

  return {
    form,
    ...actions,
  };
};
