# Leetcode Party

## Running Server

    make run

## Setting up

### PostgreSQL DB
[Download](https://www.postgresql.org/download/macosx/)  and install PostgreSQL

Create a new database, which can be done using the following psql commands in your terminal:

```
psql
CREATE DATABASE leetparty;

```

Keep track of this database name (leetparty), you will need to add this to the new secrets file.

_Side Note: I also am a pretty big fan of this  [GUI representation app](https://eggerapps.at/postico/)  of a your psql databases. Feel free to use it to visualize your data a bit easier_

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