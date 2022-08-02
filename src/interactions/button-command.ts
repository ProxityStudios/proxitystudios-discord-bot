import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	CacheType,
	ChannelType,
	Client,
	GuildTextBasedChannel,
	PermissionsBitField
} from "discord.js";
import { AppDataSource } from "../database";
import { Ticket } from "../database/entities/Ticket";
import { TicketConfig } from "../database/entities/TicketConfig";
import { ButtonCommands } from "../types/index";

const ticketConfigRepository = AppDataSource.getRepository(TicketConfig);
const ticketRepository = AppDataSource.getRepository(Ticket);

export async function buttonCommandInteraction(
	client: Client,
	interaction: ButtonInteraction<CacheType>
) {
	const { guild, guildId, channelId } = interaction;

	switch (interaction.customId) {
		case ButtonCommands.CREATE_TICKET: {
			try {
				const ticketConfig = await ticketConfigRepository.findOneBy({
					guildId: guildId || "",
				});

				if (!ticketConfig) {
					console.log("No ticket config exists");
					return;
				}

				if (!guild) {
					console.log("Guild is null");
					return;
				}

				const ticket = await ticketRepository.findOneBy({
					createdBy: interaction.user.id,
					status: "opened",
				});

				if (ticket) {
					await interaction.reply({
						content: "You already have an existing ticket!",
						ephemeral: true,
					});
					return;
				}

				if (ticketConfig.messageId === interaction.message.id) {
					const newTicket = ticketRepository.create({
						createdBy: interaction.user.id,
					});

					const savedTicket = await ticketRepository.save(newTicket);
					const newTicketChannel = await guild.channels.create({
						name: `ticket-${savedTicket.id.toString().padStart(6, "0")}`,
						type: ChannelType.GuildText,
						parent: process.env.DISCORD_TICKET_CATEGORY_ID,
						permissionOverwrites: [
							{
								allow: ["ViewChannel", "SendMessages"],
								id: interaction.user.id,
							},
							{
								allow: ["ViewChannel", "SendMessages"],
								id: client.user.id,
							},
							{
								deny: ["ViewChannel", "SendMessages"],
								id: guildId,
							},
						],
					});

					const newTicketMessage = await newTicketChannel.send({
						content: "Ticket Menu",
						components: [
							new ActionRowBuilder<ButtonBuilder>().setComponents(
								new ButtonBuilder()
									.setCustomId(ButtonCommands.CLOSE_TICKET)
									.setStyle(ButtonStyle.Danger)
									.setLabel("Close Ticket")
							),
						],
					});

					await ticketRepository.update(
						{ id: savedTicket.id },
						{
							messageId: newTicketMessage.id,
							channelId: newTicketChannel.id,
							status: "opened",
						}
					);

					console.log("Updated Ticket Values");

					await interaction.reply({
						content: `Ticket Created! (${newTicketChannel})`,
						ephemeral: true,
					});
				}
			} catch (err) {
				console.log(err);
			}
			break;
		}
		case ButtonCommands.CLOSE_TICKET: {
			const user = interaction.user;
			const channel = interaction.channel as GuildTextBasedChannel;
			const ticket = await ticketRepository.findOneBy({ channelId });

			if (!ticket) return console.log("Ticket not found");

			if (user.id !== ticket.createdBy) {
				await interaction.reply({
					content: "You do not have permission to close this ticket!",
					ephemeral: true,
				});
				return;
			}

			if (user.id === ticket.createdBy) {
				console.log("User who created ticket is now trying to close it...");
				await ticketRepository.update({ id: ticket.id }, { status: "closed" });
				await channel.edit({
					permissionOverwrites: [
						{
							deny: ["ViewChannel", "SendMessages"],
							id: interaction.user.id,
						},
						{
							allow: ["ViewChannel", "SendMessages"],
							id: client.user.id,
						},
						{
							deny: ["ViewChannel", "SendMessages"],
							id: guildId,
						},
					],
				});

				await interaction.update({
					components: [
						new ActionRowBuilder<ButtonBuilder>().setComponents(
							new ButtonBuilder()
								.setCustomId(ButtonCommands.CREATE_TRANSCRIPT)
								.setStyle(ButtonStyle.Secondary)
								.setLabel("Create Transcript"),
							new ButtonBuilder()
								.setCustomId(ButtonCommands.CLOSE_TICKET_CHANNEL)
								.setStyle(ButtonStyle.Secondary)
								.setLabel("Close Channel")
						),
					],
				});

				await interaction.followUp({ content: "Ticket Closed" });
			}
			break;
		}
		case ButtonCommands.CLOSE_TICKET_CHANNEL: {
			const channel = interaction.channel as GuildTextBasedChannel;
			const ticket = await ticketRepository.findOneBy({ channelId });

			if (!ticket) return console.log("Ticket not found");

			if (!interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
				await interaction.reply({
					content: "You do not have permission to close this ticket!",
					ephemeral: true,
				});
				return;
			}

			await interaction.reply({ content: "Channel closing..." });
			await channel.delete("User request");
			break;
		}
	}
}