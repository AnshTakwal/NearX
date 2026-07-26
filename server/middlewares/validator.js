export const requireFields = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter((field) => !req.body[field]);
    if (missing.length > 0) {
      const isMultiple = missing.length > 1;
      return res.status(400).json({ 
        error: isMultiple ? `${missing.join(' and ')} are required` : `${missing[0]} is required` 
      });
    }
    next();
  };
};
