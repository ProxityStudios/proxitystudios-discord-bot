import {
	ActivityType,
	ChannelType,
	Client,
	GatewayIntentBits,
	PermissionsBitField,
	REST,
	RESTPostAPIApplicationCommandsJSONBody,
	Routes,
	SlashCommandBuilder
} from "discord.js";
import "dotenv/config";
import { AppDataSource } from "./database";
import { Ticket } from "./database/entities/Ticket";
import { buttonCommandInteraction } from "./interactions/button-command";
import { chatInputCommandInteraction } from "./interactions/chat-input-command";
import { ChatInputCommands, CustomEvents } from "./types";

const { DISCORD_APP_TOKEN, DISCORD_ORG_GUILD_ID } = process.env;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const rest = new REST({ version: "10" }).setToken(DISCORD_APP_TOKEN);

const commands: RESTPostAPIApplicationCommandsJSONBody[] = [
	new SlashCommandBuilder()
		.setName(ChatInputCommands.SETUP_TICKETS)
		.setDescription(
			"Initializes the ticket system for the channel."
		)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription("The channel to send the message to")
				.setRequired(true)
				.addChannelTypes(ChannelType.GuildText)
		)
		.toJSON(),
];

const ticketRepository = AppDataSource.getRepository(Ticket);

client.on("ready", async () => {
	console.log(`${client.user.tag} logged in. Ready`)

	const [, totalTickets] = await ticketRepository.findAndCount();
	const [, activeTickets] = await ticketRepository.findAndCountBy({ status: "opened" });
	const [, closedTickets] = await ticketRepository.findAndCountBy({ status: "closed" });

	client.user.setActivity({ name: `Tickets(${totalTickets}): ${activeTickets} active, ${closedTickets} closed`, type: ActivityType.Listening })
});

client.on("interactionCreate", async (interaction) => {
	if (interaction.isChatInputCommand())
		client.emit(CustomEvents.CHAT_INPUT_COMMAND_INTERACTION, client, interaction);
	else if (interaction.isButton())
		client.emit(CustomEvents.BUTTON_COMMAND_INTERACTION, client, interaction);
});

client.on(CustomEvents.CHAT_INPUT_COMMAND_INTERACTION, chatInputCommandInteraction);
client.on(CustomEvents.BUTTON_COMMAND_INTERACTION, buttonCommandInteraction);

async function main() {
	try {
		await AppDataSource.initialize();
		console.log("Database initialized")

		console.log("Contacting to client")
		await client.login(DISCORD_APP_TOKEN);

		console.log("ApplicationGuildCommands: Commands registering...")
		await rest.put(Routes.applicationGuildCommands(client.user.id, DISCORD_ORG_GUILD_ID), {
			body: commands,
		});
		console.log("ApplicationGuildCommands: Commands registered.")

	} catch (err) {
		console.error(err);
	}
}

main();