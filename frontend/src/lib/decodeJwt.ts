export const decodeUserIdFromToken = (token: string): string | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof window !== "undefined"
        ? decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
              .join("")
          )
        : Buffer.from(base64, "base64").toString("utf8");
    const data = JSON.parse(json);
    return typeof data.userId === "string" ? data.userId : null;
  } catch {
    return null;
  }
};

