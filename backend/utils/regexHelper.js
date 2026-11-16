/**
 * Utility to escape special characters for safe use in RegExp constructors.
 * Prevents RegExp injection and syntax crashes when user searches for symbols like 'C++', 'Math (1)', etc.
 */
const escapeRegex = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = {
  escapeRegex,
};
