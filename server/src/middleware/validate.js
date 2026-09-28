const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
    // Only validate the fields specified in the schema, allow other fields to pass through (like files)
    const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });

    if (error) {
        // Map Joi error to a cleaner array of strings
        const errorMessages = error.details.map((detail) => detail.message);
        return res.status(400).json({
            success: false,
            error: 'Validation Failed',
            details: errorMessages
        });
    }

    // Replace req.body with validated and type-casted values (if any)
    req.body = value;
    next();
};

module.exports = validate;
