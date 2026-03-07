export function makeUrlsClickable(html) {
  const urlRegex = /(https?:\/\/[^\s<"]+)/g;

  return html.replace(urlRegex, (match, _url, offset) => {
    const before = html.substring(Math.max(0, offset - 100), offset);
    // Skip URLs inside any HTML attribute value (xmlns=", href=", src=", etc.)
    if (/=["'][^"']*$/.test(before)) {
      return match;
    }
    return `<a href="${match}">${match}</a>`;
  });
}
