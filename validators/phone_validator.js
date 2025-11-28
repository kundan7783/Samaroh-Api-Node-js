
const { body } = require("express-validator");

exports.phoneValidator = [
  body("phone")
    .notEmpty().withMessage("Phone number is required")   // <- Correct validator
    .trim()
    .matches(/^(\+91|91)?[6-9][0-9]{9}$/)
    .withMessage("Invalid phone number format"),
];

