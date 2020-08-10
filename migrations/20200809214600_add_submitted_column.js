exports.up = function(knex) {
    return knex.schema.table('room_members', function(t) {
        t.boolean('submitted').defaultTo(false).notNullable();
    });
};

exports.down = function(knex) {
    return knex.schema.table('room_members', function(t) {
        t.dropColumn('submitted');
    });
};
