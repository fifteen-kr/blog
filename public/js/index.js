import { Halo } from "../js/halo/index.js";

function main() {
    const halo_elem = /** @type {HTMLDivElement|null} */ (document.getElementById('header-halo'));
    if(halo_elem) {
        const halo = new Halo(halo_elem);
    }
}

main();