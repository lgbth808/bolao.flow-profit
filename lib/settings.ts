import { prisma } from "./prisma";

export const API_FOOTBALL_KEY_SETTING = "apiFootballKey";

export async function getSetting(key: string) {
  const setting = await prisma.appSetting.findUnique({
    where: { key }
  });

  return setting?.value ?? "";
}

export async function setSetting(key: string, value: string) {
  return prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value }
  });
}

export async function getApiFootballKey() {
  return getSetting(API_FOOTBALL_KEY_SETTING);
}
