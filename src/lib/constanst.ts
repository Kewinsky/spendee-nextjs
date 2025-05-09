export const APP_NAME = process.env.APP_NAME || "spendee";
export const TOKEN_EXPIRATION = {
  SESSION: 60 * 60, // 1 hour
  VERIFY_EMAIL: 60 * 60 * 24, // 24h
  RESET_PASSWORD: 60 * 60, // 1h
  SESSION_WARNING_TIME: 60 * 5, // 5 min
};
