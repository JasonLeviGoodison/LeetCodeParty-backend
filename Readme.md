# LEETPARTY RESOURCES HAVE BEEN DEPROVISIONED
This code base still works but it no longer has a home.
You can see exactly how it worked in this video: https://www.youtube.com/watch?v=FWsNEeuXSiA

# Leetcode Party

## Running Server
If you already have the db set up, run this command

    make run

If not, check out the set up instructions below

## SET UP

### PostgreSQL DB
[Download](https://www.postgresql.org/download/)  and install PostgreSQL

Create a new database, which can be done using the following psql commands in your terminal:

```
psql
CREATE DATABASE leetparty;

```

Keep track of this database name (leetparty), you will need to add this to the new secrets file.

_Side Note: I also am a pretty big fan of this  [GUI representation app](https://eggerapps.at/postico/)  of a your psql databases. Feel free to use it to visualize your data a bit easier_

### Connect to local instance

knexfile.js is where all the db connection information is kept. Look at the "development" object in that file. It should look like this:

    development: {
        client: 'postgresql',
        host     : "localhost",
        user     : "leetparty",
        password : "",
        port     : ""
    }

If you DIDNT make a leetparty db above (either werent able to or forgot) change the "user" field to your computer username. Example: user: "jasongoodison"

## Secrets file

We use a secrets file that is gitignored so its never checked into git. This contains all the secrets used to connect to the db. For production, this is handled by Jason or Javin, but you should add this file locally anyway.

create a file "secrets.js" in the /config folder. It should look like this:

    module.exports = {
        ROLLBAR_ACCESS_CODE: 'NONE',
        DB_PASSWORD: 'YOUR_PASSWORD'
    }

## RUN THE SERVER

Now that you have the DB set up, you need to run:
    
    npm install

when thats finished start the server:

    make run

Your Server is up! Now make sure that your chrome extension points to this server.

## Error Observability

We are utilizing [rollbar.com](rollbar.com) to capture and track our error messages. You shouldnt need to use this in development.

## Database Migrations

### Adding a new Column

_Note: Look at the commands, please make sure you are building/running migrations for the current environment._

Create a new Migration

    ./node_modules/.bin/knex migrate:make MIGRATION_NAME --env development
    
Open up the migration file that this script generates. Modify the file to add any new columns you want.

Example:

    exports.up = function(knex) {
        return knex.schema.table('room_members', function(t) {
            t.string('nickname').notNullable();
            t.string('nickname_color').notNullable();
        });
    };
    
    exports.down = function(knex) {
        return knex.schema.table('room_members', function(t) {
            t.dropColumn('nickname');
            t.dropColumn('nickname_color');
        });
    };

Run the Migration:

`./node_modules/.bin/knex migrate:latest --env development`
