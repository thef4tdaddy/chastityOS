export const safeToDate = (v) => {
  if (!v) return null;
  // Firestore Timestamp objects have a toDate() method
  if (typeof v.toDate === 'function') {
    const d = v.toDate();
    return isNaN(d?.getTime?.()) ? null : d;
  }
  // If it's already a Date instance, ensure it's valid
  if (v instanceof Date) {
    return isNaN(v.getTime()) ? null : v;
  }
  // Try to parse strings or numbers into a Date
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};
