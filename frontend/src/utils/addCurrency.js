// Convert the number to a formatted string
export const addCurrency = num => {
  return `RS${num?.toLocaleString('en-IN')}`;
};
