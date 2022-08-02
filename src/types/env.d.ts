export { };

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_APP_TOKEN: string;
      DISCORD_ORG_GUILD_ID: string;
      DISCORD_TICKET_CATEGORY_ID: string;

      PG_DB_HOST: string;
      PG_DB_PORT: string;
      PG_DB_USERNAME: string;
      PG_DB_PASSWORD: string;
      PG_DB_DATABASE: string
    }
  }
}