exports.up = function(knex) {
    return knex.schema.table('room_members', function(t) {
        t.dateTime('deleted_at').defaultTo(null);
    });
};

exports.down = function(knex) {
    return knex.schema.table('room_members', function(t) {
        t.dropColumn('deleted_at');
    });
};
