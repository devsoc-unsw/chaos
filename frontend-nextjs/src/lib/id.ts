import { Snowflake } from "@sapphire/snowflake";

const UNIX_EPOCH = new Date('1970-01-01T00:00:00.000Z');
export const snowflakeGenerator = new Snowflake(UNIX_EPOCH);