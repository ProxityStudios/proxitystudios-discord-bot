import {
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

client.on("ready", () => console.log(`${client.user?.tag} logged in`));

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
		await client.login(DISCORD_APP_TOKEN);
		await rest.put(Routes.applicationGuildCommands(client.user.id, DISCORD_ORG_GUILD_ID), {
			body: commands,
		});
	} catch (err) {
		console.error(err);
	}
}

main();