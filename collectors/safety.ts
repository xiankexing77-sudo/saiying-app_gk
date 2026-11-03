/**
 * 采集 URL 安全检查。夹具模式不发起请求；以后若接 live HTTP，
 * 重定向后的最终 URL 也必须再过一遍这里，并且不得绕过登录。
 */

const COLLECTABLE_HOSTS = new Set([
  "www.worldphoto.org",
  "worldphoto.org",
  "www.sony.co.uk",
  "sony.co.uk",
  "www.sony.com.my",
  "sony.com.my",
  "www.sony.eu",
  "sony.eu",
]);

function isIpLiteral(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (/^\d+$/.test(host)) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  if (host.includes(":")) return true;
  return false;
}

function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "metadata.google.internal" || host.endsWith(".internal")) return true;
  return isIpLiteral(host);
}

/** 协议、凭据、端口和内网主机检查。调用方再套自己的域名清单。 */
export function parsePublicHttps(input: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("采集 URL 无法解析");
  }
  if (url.protocol !== "https:") {
    throw new Error("采集 URL 必须是 https");
  }
  if (url.username || url.password) {
    throw new Error("采集 URL 不能携带凭据");
  }
  if (url.port && url.port !== "443") {
    throw new Error("采集 URL 不能使用非 443 端口");
  }
  if (isBlockedHost(url.hostname)) {
    throw new Error(`拒绝主机：${url.hostname}`);
  }
  return url;
}

export function assertSafePublicUrl(input: string) {
  const url = parsePublicHttps(input);
  if (!COLLECTABLE_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(`拒绝主机：${url.hostname}`);
  }
  return url.toString();
}
