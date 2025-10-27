'use client';

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type FieldStatus = 'mandatory' | 'optional' | 'off';

export interface FormFieldState {
  key: string;
  label: string;
  status: FieldStatus;
}

const baseFields: FormFieldState[] = [
  { key: 'full_name', label: 'Full Name', status: 'mandatory' },
  { key: 'email', label: 'Email', status: 'mandatory' },
  { key: 'phone_number', label: 'Phone Number', status: 'optional' },
  { key: 'linkedin_link', label: 'LinkedIn Profile', status: 'optional' },
  { key: 'domicile', label: 'Domicile', status: 'off' },
  { key: 'gender', label: 'Gender', status: 'off' },
  { key: 'photo_profile', label: 'Photo Profile (Gesture Capture)', status: 'off' },
];

export const createDefaultFormBuilderFields = () =>
  baseFields.map((field) => ({ ...field }));

const initialState: FormFieldState[] = createDefaultFormBuilderFields();

export const formBuilderSlice = createSlice({
  name: 'formBuilder',
  initialState,
  reducers: {
    setFieldStatus: (state, action: PayloadAction<{ key: string; status: FieldStatus }>) => {
      const field = state.find((f) => f.key === action.payload.key);
      if (field) {
        field.status = action.payload.status;
      }
    },
    resetFormBuilder: () => createDefaultFormBuilderFields(),
    setFormBuilderFields: (_state, action: PayloadAction<FormFieldState[]>) =>
      action.payload,
  },
});

export const { setFieldStatus, resetFormBuilder, setFormBuilderFields } = formBuilderSlice.actions;

export default formBuilderSlice.reducer;
