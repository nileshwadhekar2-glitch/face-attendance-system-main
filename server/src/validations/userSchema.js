const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().required(),
    matric_no: Joi.string()
        .regex(/^[a-zA-Z0-9/\-]*$/)
        .required()
        .messages({
            'string.pattern.base': 'Matric Number contains invalid characters. Only alphanumeric, slashes, and dashes are allowed.',
            'string.empty': 'Matric Number is required'
        }),
    level: Joi.string().optional().allow(''),
    department: Joi.string().optional().allow(''),
    course: Joi.string().optional().allow(''),
    photo: Joi.string().optional().allow(''),
    descriptor: Joi.array().items(Joi.number()).optional(),
    section: Joi.string().optional().allow(''),
    classIds: Joi.array().items(Joi.string(), Joi.number()).optional()
}).unknown(true);

module.exports = { registerSchema };
