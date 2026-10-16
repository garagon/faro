/** A tel: link without the spaces and dashes used for reading. */
export const telHref = (number: string) => `tel:${number.replace(/[^\d+]/g, '')}`;
/** A WhatsApp chat with an international number; nothing is written or sent by Faro. */
export const whatsappHref = (number: string) => `https://wa.me/${number.replace(/\D/g, '')}`;

// Readable grouping for the international numbers Faro lists. Unknown plans stay as published.
const plans: [prefix: string, groups: number[]][] = [
  ['+1', [3, 3, 4]],
  ['+507', [4, 4]],
  ['+507', [3, 4]],
  ['+54', [2, 4, 4]],
  ['+55', [2, 5, 4]],
];
export function displayPhone(phone: string) {
  const plan = plans.find(
    ([prefix, groups]) =>
      phone.startsWith(prefix) &&
      phone.length - prefix.length === groups.reduce((a, b) => a + b, 0) &&
      /^\+\d+$/.test(phone),
  );
  if (!plan) return phone;
  const [prefix, groups] = plan;
  let rest = phone.slice(prefix.length);
  const parts = groups.map((n) => {
    const part = rest.slice(0, n);
    rest = rest.slice(n);
    return part;
  });
  return `${prefix} ${parts.join(prefix === '+1' || prefix === '+507' ? '-' : ' ')}`;
}
