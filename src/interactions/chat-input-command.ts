import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	CacheType,
	ChatInputCommandInteraction,
	Client,
	GuildTextBasedChannel
} from "discord.js";
import { AppDataSource } from "../database";
import { TicketConfig } from "../database/entities/TicketConfig";
import { ButtonCommands, ChatInputCommands } from "../types/index";

const ticketConfigRepository = AppDataSource.getRepository(TicketConfig);

export async function chatInputCommandInteraction(
	_: Client,
	interaction: ChatInputCommandInteraction<CacheType>
) {
	switch (interaction.commandName) {
		case ChatInputCommands.SETUP_TICKETS: {
			const guildId = interaction.guildId || "";
			const channel = interaction.options.getChannel(
				"channel"
			) as GuildTextBasedChannel;

			const ticketConfig = await ticketConfigRepository.findOneBy({ guildId });

			const messageOptions = {
				content:
					"Interact with the buttons",
				components: [
					new ActionRowBuilder<ButtonBuilder>().setComponents(
						new ButtonBuilder()
							.setCustomId(ButtonCommands.CREATE_TICKET)
							.setEmoji("🎫")
							.setLabel("Create Ticket")
							.setStyle(ButtonStyle.Primary)
					),
				],
			};

			try {
				if (!ticketConfig) {
					const msg = await channel.send(messageOptions);
					const newTicketConfig = ticketConfigRepository.create({
						guildId,
						messageId: msg.id,
						channelId: channel.id,
					});

					await ticketConfigRepository.save(newTicketConfig);
					console.log("Saved new configuration to database");

					await interaction.reply({
						content: "Ticket system initialized.",
						ephemeral: true,
					});
				} else {
					console.log("Ticket config exists... Updating Values");
					const msg = await channel.send(messageOptions);
					ticketConfig.channelId = channel.id;
					ticketConfig.messageId = msg.id;

					await ticketConfigRepository.save(ticketConfig);
					await interaction.reply({
						content: `New message sent in ${channel}. Updated Database Record.`,
						ephemeral: true,
					});
				}
			} catch (err) {
				console.log(err);
				await interaction.reply({
					content: "Something went wrong...",
					ephemeral: true,
				});
			}
		}
	}
}