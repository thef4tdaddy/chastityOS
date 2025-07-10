export function padString(value,length,char='0'){ const str=String(value); if(str.length>=length)return str; return char.repeat(length-str.length)+str; }
