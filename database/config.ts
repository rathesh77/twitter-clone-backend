import dotenv from 'dotenv';

dotenv.config();

export default {
  uri : process.env['NEO4J_URI'],
  user : process.env['NEO4J_USERNAME'],
  password : process.env['NEO4J_PASSWORD']
};