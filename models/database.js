var Promise = require('bluebird');

var tables = [
	createTableDefinition("users", function(t) {
		t.increments('id').primary();
		t.timestamps();
	}),
	createTableDefinition("rooms", function(t) {
		t.increments('id').primary();
		t.string("problem_id").notNullable();
		t.string("host_user_id").notNullable();
		t.timestamps();
	}),
	createTableDefinition("room_members", function(t) {
		t.increments('id').primary();
		t.string('room_id').notNullable();
		t.string('participant_user_id').notNullable();
		t.timestamps();
	})
];

module.exports.initialize = function(knex) {
	return new Promise(function(resolve, reject) {
		return Promise.each(tables, function(itm, index, arrayLength) {
			knex.schema.hasTable(itm.name)
			.then(function(exists) {
				if (!exists) {
					return knex.schema.createTable(itm.name, itm.init);
				}
			})
			.catch(function(err) {
				return err;
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
