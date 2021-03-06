var Promise = require('bluebird');

var tables = [
	createTableDefinition("users", function(t) {
		t.string('uuid').primary();
		t.timestamps();
	}),
	createTableDefinition("rooms", function(t) {
		t.string('uuid').primary();
		t.string("problem_id").notNullable();
		t.string("host_user_uuid").notNullable().references('uuid').inTable('users');
		t.boolean('started').notNullable().defaultTo(false);
		t.dateTime("deleted_at").defaultTo(null);
		t.timestamps();
	}),
	createTableDefinition("room_members", function(t) {
		t.string('uuid').primary();
		t.string('room_uuid').references('uuid').inTable('rooms').notNullable();
		t.string('participant_user_uuid').references('uuid').inTable('users').notNullable();
		t.string('nickname').notNullable();
		t.string('nickname_color').notNullable();
		t.boolean('ready').defaultTo(false).notNullable();
		t.boolean('submitted').defaultTo(false).notNullable();
		t.string('latest_submission_uuid').references('uuid').inTable('submissions');
		t.dateTime("deleted_at").defaultTo(null);
		t.timestamps();
	}),
	createTableDefinition("submissions", function(t) {
		t.string('uuid').primary();
		t.string('room_uuid').references('uuid').inTable('rooms').notNullable();
		t.string('user_uuid').references('uuid').inTable('users').notNullable();
		t.string('run_time').notNullable();
		t.string('memory_usage').notNullable();
		t.dateTime('start_writing_time').notNullable();
		t.dateTime('end_writing_time').notNullable();
		t.dateTime("deleted_at").defaultTo(null);
		t.timestamps();
	}),
	createTableDefinition("submission_receipts", function(t) {
		t.string('uuid').primary();
		t.string('submission_uuid').references('uuid').inTable('submissions').notNullable();
		t.string('viewer_user_uuid').references('uuid').inTable('users').notNullable();
		t.string('room_uuid').references('uuid').inTable('rooms').notNullable();
		t.dateTime("deleted_at").defaultTo(null);
		t.timestamps();
	})
];

module.exports.initialize = function(knex) {
	return new Promise(function(resolve, reject) {
		return Promise.each(tables, function(itm, index, arrayLength) {
			knex.schema.hasTable(itm.name)
			.then(function(exists) {
				if (!exists) {
					return knex.schema.createTable(itm.name, itm.init)
					.then(function() {
						return;
					})
					.catch(function(err) {
						console.log("Failed to create table: ", err);
						process.exit();
						return reject(err);
					});
				}
			});
		})
		.then(function() {
			return resolve();
		})
		.catch(function(err) {
			return reject(err);
		});
	});
}

function createTableDefinition(name, initializeFunc) {
	return {
		"name": name,
		"init": initializeFunc
	}
}
