exports.up = function(knex) {
    return knex.schema.table('room_members', function(t) {
        t.string('latest_submission_uuid').references('uuid').inTable('submissions').defaultTo(null);
    });
};

exports.down = function(knex) {
    return knex.schema.table('room_members', function(t) {
        t.dropColumn('latest_submission_uuid');
    });
};
