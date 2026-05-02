export type GroceryProviderKey = "MOCK" | "SWIGGY_INSTAMART";

type ProviderEnv = Partial<Record<string, string | undefined>>;

export type GroceryProviderConfig = {
  activeProvider: GroceryProviderKey;
  requestedProvider: string;
  mockMode: boolean;
  swiggy: {
    enabled: boolean;
    configured: boolean;
    status: "NOT_CONNECTED" | "CONFIG_INCOMPLETE" | "READY_FOR_STUB_ONLY";
    clientIdConfigured: boolean;
    clientSecretConfigured: boolean;
    redirectUriConfigured: boolean;
    missing: string[];
  };
};

const SWIGGY_REQUIRED_ENV = [
  "SWIGGY_BUILDERS_CLIENT_ID",
  "SWIGGY_BUILDERS_CLIENT_SECRET",
  "SWIGGY_BUILDERS_REDIRECT_URI"
] as const;

function normalizeProvider(value: string | undefined): GroceryProviderKey {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "SWIGGY" || normalized === "SWIGGY_INSTAMART") return "SWIGGY_INSTAMART";
  return "MOCK";
}

function isTruthyEnv(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() ?? "");
}

export function getGroceryProviderConfig(env: ProviderEnv = process.env): GroceryProviderConfig {
  const requestedProvider = env.GROCERY_PROVIDER ?? "mock";
  const normalizedProvider = normalizeProvider(requestedProvider);
  const enabled = isTruthyEnv(env.SWIGGY_BUILDERS_ENABLED);
  const missing = SWIGGY_REQUIRED_ENV.filter((key) => !env[key]?.trim());
  const configured = enabled && missing.length === 0;

  return {
    activeProvider: normalizedProvider === "SWIGGY_INSTAMART" && configured ? "SWIGGY_INSTAMART" : "MOCK",
    requestedProvider,
    mockMode: normalizedProvider !== "SWIGGY_INSTAMART" || !configured,
    swiggy: {
      enabled,
      configured,
      status: !enabled ? "NOT_CONNECTED" : configured ? "READY_FOR_STUB_ONLY" : "CONFIG_INCOMPLETE",
      clientIdConfigured: Boolean(env.SWIGGY_BUILDERS_CLIENT_ID?.trim()),
      clientSecretConfigured: Boolean(env.SWIGGY_BUILDERS_CLIENT_SECRET?.trim()),
      redirectUriConfigured: Boolean(env.SWIGGY_BUILDERS_REDIRECT_URI?.trim()),
      missing
    }
  };
}
