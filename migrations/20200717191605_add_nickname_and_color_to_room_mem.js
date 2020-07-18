exports.up = function(knex) {
    return knex.schema.table('room_members', function(t) {
        t.string('nickname').defaultTo("").notNullable();
        t.string('nickname_color').defaultTo("").notNullable();
    });
};

exports.down = function(knex) {
    return knex.schema.table('room_members', function(t) {
        t.dropColumn('nickname');
        t.dropColumn('nickname_color');
    });
};
