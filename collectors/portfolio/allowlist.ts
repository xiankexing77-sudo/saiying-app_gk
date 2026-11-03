import { parsePublicHttps } from "../safety";

/**
 * 本人作品采集的主机清单。赛事采集仍用更窄的官方入口。
 * 个人网站和出版社整站允许；报道和机构页只允许登记过的路径，避免以后打开 live HTTP 时扫整站。
 */
const HOST_RULES: { host: string; pathPrefix?: string }[] = [
  { host: "www.worldphoto.org" },
  { host: "worldphoto.org" },
  { host: "www.sony.co.uk" },
  { host: "sony.co.uk" },
  { host: "www.sony.com.my" },
  { host: "sony.com.my" },
  { host: "www.sony.eu" },
  { host: "sony.eu" },
  { host: "www.bindivora.co.uk" },
  { host: "bindivora.co.uk" },
  { host: "www.paulninson.com" },
  { host: "paulninson.com" },
  { host: "perimetereditions.com" },
  { host: "www.perimetereditions.com" },
  { host: "www.imperialcharity.org.uk" },
  { host: "imperialcharity.org.uk" },
  { host: "www.cnn.com", pathPrefix: "/travel/gallery/paul-ninson-photography-umoja" },
  { host: "cnn.com", pathPrefix: "/travel/gallery/paul-ninson-photography-umoja" },
];

export function assertPortfolioUrl(input: string) {
  const url = parsePublicHttps(input);
  const host = url.hostname.toLowerCase();
  const rule = HOST_RULES.find((item) => item.host === host);
  if (!rule) {
    throw new Error(`作品采集拒绝主机：${url.hostname}`);
  }
  if (rule.pathPrefix && !url.pathname.startsWith(rule.pathPrefix)) {
    throw new Error(`作品采集拒绝路径：${url.hostname}${url.pathname}`);
  }
  return url.toString();
}
