import "dotenv/config";

const config = {
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
};

export default config;
