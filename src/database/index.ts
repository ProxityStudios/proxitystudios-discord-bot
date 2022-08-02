import { DataSource } from "typeorm";
import { Ticket } from "./entities/Ticket";
import { TicketConfig } from "./entities/TicketConfig";

const { PG_DB_HOST, PG_DB_PORT, PG_DB_USERNAME, PG_DB_PASSWORD, PG_DB_DATABASE } = process.env;

export const AppDataSource = new DataSource({
	type: "postgres",
	host: PG_DB_HOST,
	port: parseInt(PG_DB_PORT || "3306"),
	username: PG_DB_USERNAME,
	password: PG_DB_PASSWORD,
	database: PG_DB_DATABASE,
	synchronize: true,
	ssl: {
		rejectUnauthorized: false,
	},
	entities: [TicketConfig, Ticket],
});