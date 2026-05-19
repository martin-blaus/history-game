export type { HistoryEvent, Deck } from "./argentina";
export { argentina } from "./argentina";
export { mundo } from "./mundo";
export { filosofia } from "./filosofia";

import { argentina } from "./argentina";
import { mundo } from "./mundo";
import { filosofia } from "./filosofia";

export const DECKS = [argentina, mundo, filosofia];
