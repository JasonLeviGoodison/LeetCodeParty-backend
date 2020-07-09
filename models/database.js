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
		t.timestamps();
	}),
	createTableDefinition("room_members", function(t) {
		t.string('uuid').primary();
		t.string('room_uuid').references('uuid').inTable('rooms').notNullable();
		t.string('participant_user_uuid').references('uuid').inTable('users').notNullable();
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
