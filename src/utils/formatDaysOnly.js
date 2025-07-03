export function formatDaysOnly(seconds) { const days=Math.floor(seconds/86400); return `${days} day${days!==1?'s':''}`; }
