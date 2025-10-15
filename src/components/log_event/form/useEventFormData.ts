import { useState } from "react";

// Custom hook for form data management
export const useEventFormData = () => {
  const [formData, setFormData] = useState({
    type: "note",
    notes: "",
    timestamp: new Date().toISOString().slice(0, 16),
    mood: "",
    intensity: 5,
    tags: "",
    isPrivate: false,
  });

  const resetForm = () => {
    setFormData({
      type: "note",
      notes: "",
      timestamp: new Date().toISOString().slice(0, 16),
      mood: "",
      intensity: 5,
      tags: "",
      isPrivate: false,
    });
  };

  return { formData, setFormData, resetForm };
};
