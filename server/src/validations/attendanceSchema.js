const Joi = require('joi');

const markAttendanceSchema = Joi.object({
    faceLandmarks: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.number())
    ).required().messages({
        'any.required': 'Facial biometric data is strictly required.'
    })
}).unknown(true);

module.exports = {
    markAttendanceSchema
};
