const mongoSanitize = require("mongo-sanitize");
const sanitize = (req, res, next) => {
    if(req.body) {
        req.body = mongoSanitize(req.body);
    }
    if (req.query) {
        req.query = mongoSanitize(req.query);
    }
    next();
}
module.exports = sanitize;