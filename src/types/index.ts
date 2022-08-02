export enum ChatInputCommands {
  SETUP_TICKETS = "setup-tickets"
}

export enum ButtonCommands {
  CREATE_TICKET = "createTicket",
  CLOSE_TICKET = "closeTicket",
  CREATE_TRANSCRIPT = "createTranscript",
  CLOSE_TICKET_CHANNEL = "closeTicketChannel"
}

export enum CustomEvents {
  CHAT_INPUT_COMMAND_INTERACTION = "chatInputCommandInteraction",
  BUTTON_COMMAND_INTERACTION = "buttonCommandInteraction"
}

export type TicketStatus = "opened" | "closed" | "failed" | "created";
