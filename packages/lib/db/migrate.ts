import { migrate } from 'drizzle-orm/libsql/migrator';
import db from './db';

export const migrateDb = migrate;

export const migrateDbNow = async function () {
	// local run
	await migrate(db, {
		migrationsFolder: '../migrations',
	});
}