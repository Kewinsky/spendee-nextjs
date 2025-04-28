export const extractTabName = (path: string): string => {
  const parts = path.split(/[-/]/).filter(Boolean);

  const formattedName = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return formattedName;
};
