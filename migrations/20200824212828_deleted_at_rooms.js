exports.up = function(knex) {
    return knex.schema.table('rooms', function(t) {
        t.dateTime('deleted_at').defaultTo(null);
    });
};

exports.down = function(knex) {
    return knex.schema.table('rooms', function(t) {
        t.dropColumn('deleted_at');
    });
};
