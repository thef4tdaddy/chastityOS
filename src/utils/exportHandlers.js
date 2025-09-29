export const handleExportClick = (type, handlers) => {
  const { handleExportTextReport, handleExportTrackerCSV, handleExportEventLogCSV, handleExportJSON } = handlers;
  
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'export_click', export_type: type });
  
  if (type === 'text') handleExportTextReport();
  else if (type === 'tracker') handleExportTrackerCSV();
  else if (type === 'eventlog') handleExportEventLogCSV();
  else if (type === 'json') handleExportJSON();
};