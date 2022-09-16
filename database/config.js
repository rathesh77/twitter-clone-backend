const dotenv = require("dotenv");

dotenv.config();

module.exports = {
   uri : process.env["NEO4J_URI"],
   user : process.env["NEO4J_USER"],
   password : process.env["NEO4J_PWD"]
}