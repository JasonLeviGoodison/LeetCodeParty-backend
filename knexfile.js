// Update with your config settings.
let Secrets = require('./config/secrets');
let Base = require('./config/base');

module.exports = {
  development: {
    client: 'postgresql',
    host     : "localhost",
    user     : "leetparty",
    password : "",
    port     : ""
  },
  production: {
    client: 'postgresql',
    host     : Base.PG_CONNECTION_HOST,
    user     : Base.PG_CONNECTION_DB_NAME,
    password : Secrets.DB_PASSWORD,
    port     : "5432"
  }
};
