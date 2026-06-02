export const formatValidationErrors = errors => {
  if (!errors || errors.length === 0) {
    return 'Unknown validation error';
  }
  if (Array.isArray(errors.issues)) {
    return errors.issues
      .map(error => {
        const { path, message } = error;
        return `${path.join('.')} - ${message}`;
      })
      .join(', ');
  }
  return JSON.stringify(errors);
};
