exports.up = function(knex) {
    return knex.schema.table('rooms', function(t) {
        t.boolean('started').defaultTo(false).notNullable();
    });
};

exports.down = function(knex) {
    return knex.schema.table('rooms', function(t) {
        t.dropColumn('started');
    });
};
