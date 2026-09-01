/**
 * Wanneer is een order klaar?
 *
 * Twee dingen: het geld is binnen (`status == "paid"`) en het werk is de deur
 * uit (`fulfilment` staat op iets anders dan "undecided"). De gekozen manier ís
 * de overdracht — er is geen aparte datum die het nog eens moet bevestigen.
 *
 * Eerder besliste `shippedAt` of iets afgehandeld was. Die datum staat op de
 * Shipping-tab, terwijl je de manier ook elders kon kiezen; koos je daar, dan
 * gebeurde er niets en leek de order te blijven hangen. `shippedAt` is nu een
 * detail dat je mag invullen en corrigeren, geen tweede voorwaarde.
 *
 * Deze strings stonden eerder viermaal los overgetypt (structure, dashboard,
 * app-route, badge). Eén bron, zodat ze niet uit elkaar kunnen lopen.
 */

export const HANDED_OVER = '(defined(fulfilment) && fulfilment != "undecided")'

/** Vraagt nog actie: wacht op betaling, of betaald maar nog niet overgedragen. */
export const OPEN_ORDER_FILTER =
  `(status == "awaiting-payment" || (status == "paid" && !${HANDED_OVER}))`

/** Afgehandeld of vervallen — hoort in het archief. */
export const DONE_ORDER_FILTER =
  `(status in ["cancelled", "refunded"] || (status == "paid" && ${HANDED_OVER}))`
