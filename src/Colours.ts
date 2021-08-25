import {formatHex} from "culori";

export function randomHue(sat: number, val: number) {
    let colString = formatHex({mode: "oklch", l:val, c:sat, h:Math.random()*360}) + "ff";
    return Number.parseInt(colString.slice(1), 16);
}
