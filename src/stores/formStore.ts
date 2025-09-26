/**
 * Form Store - Form State Management
 * Manages form state, validation, and dirty tracking for complex forms
 */
import React from "react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface FormField {
  value: any;
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
  createForm: (formId: string, initialValues?: Record<string, any>) => void;
  destroyForm: (formId: string) => void;
  setFieldValue: (formId: string, fieldName: string, value: any) => void;
  setFieldError: (formId: string, fieldName: string, error?: string) => void;
  touchField: (formId: string, fieldName: string) => void;
  resetForm: (formId: string, newValues?: Record<string, any>) => void;
  setSubmitting: (formId: string, isSubmitting: boolean) => void;
  incrementSubmitCount: (formId: string) => void;

  // Validation
  validateField: (
    formId: string,
    fieldName: string,
    validator: (value: any) => string | undefined,
  ) => void;
  validateForm: (
    formId: string,
    validators: Record<string, (value: any) => string | undefined>,
  ) => boolean;

  // Utility getters
  getForm: (formId: string) => any;
  getFieldValue: (formId: string, fieldName: string) => any;
  getFieldError: (formId: string, fieldName: string) => string | undefined;
  isFieldTouched: (formId: string, fieldName: string) => boolean;
  isFieldDirty: (formId: string, fieldName: string) => boolean;
  isFormValid: (formId: string) => boolean;
  isFormDirty: (formId: string) => boolean;
  isFormSubmitting: (formId: string) => boolean;
}

export const useFormStore = create<FormState>()(
  devtools(
    (set, get) => ({
      // Initial state
      forms: {},

      // Actions
      createForm: (formId: string, initialValues = {}) =>
        set(
          (state) => {
            if (state.forms[formId]) return state; // Don't recreate existing forms

            const fields: Record<string, FormField> = {};
            Object.entries(initialValues).forEach(([key, value]) => {
              fields[key] = {
                value,
                touched: false,
                dirty: false,
              };
            });

            return {
              forms: {
                ...state.forms,
                [formId]: {
                  fields,
                  isSubmitting: false,
                  isValid: true,
                  isDirty: false,
                  submitCount: 0,
                },
              },
            };
          },
          false,
          `createForm:${formId}`,
        ),

      destroyForm: (formId: string) =>
        set(
          (state) => {
            const { [formId]: removed, ...rest } = state.forms;
            return { forms: rest };
          },
          false,
          `destroyForm:${formId}`,
        ),

      setFieldValue: (formId: string, fieldName: string, value: any) =>
        set(
          (state) => {
            const form = state.forms[formId];
            if (!form) return state;

            const field = form.fields[fieldName] || {
              touched: false,
              dirty: false,
            };
            const isDirty = field.value !== value;

            const updatedFields = {
              ...form.fields,
              [fieldName]: {
                ...field,
                value,
                dirty: isDirty,
              },
            };

            const formIsDirty = Object.values(updatedFields).some(
              (f) => f.dirty,
            );

            return {
              forms: {
                ...state.forms,
                [formId]: {
                  ...form,
                  fields: updatedFields,
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
          (state) => {
            const form = state.forms[formId];
            if (!form) return state;

            const field = form.fields[fieldName] || {
              value: "",
              touched: false,
              dirty: false,
            };
            const updatedFields = {
              ...form.fields,
              [fieldName]: {
                ...field,
                error,
              },
            };

            const isValid = !Object.values(updatedFields).some((f) => f.error);

            return {
              forms: {
                ...state.forms,
                [formId]: {
                  ...form,
                  fields: updatedFields,
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
          (state) => {
            const form = state.forms[formId];
            if (!form) return state;

            const field = form.fields[fieldName] || { value: "", dirty: false };

            return {
              forms: {
                ...state.forms,
                [formId]: {
                  ...form,
                  fields: {
                    ...form.fields,
                    [fieldName]: {
                      ...field,
                      touched: true,
                    },
                  },
                },
              },
            };
          },
          false,
          `touchField:${formId}.${fieldName}`,
        ),

      resetForm: (formId: string, newValues = {}) =>
        set(
          (state) => {
            const form = state.forms[formId];
            if (!form) return state;

            const fields: Record<string, FormField> = {};
            Object.entries(newValues).forEach(([key, value]) => {
              fields[key] = {
                value,
                touched: false,
                dirty: false,
              };
            });

            return {
              forms: {
                ...state.forms,
                [formId]: {
                  ...form,
                  fields,
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
          (state) => {
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
          (state) => {
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

      // Validation
      validateField: (
        formId: string,
        fieldName: string,
        validator: (value: any) => string | undefined,
      ) => {
        const form = get().forms[formId];
        if (!form) return;

        const field = form.fields[fieldName];
        if (!field) return;

        const error = validator(field.value);
        get().setFieldError(formId, fieldName, error);
      },

      validateForm: (
        formId: string,
        validators: Record<string, (value: any) => string | undefined>,
      ) => {
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
      },

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
