import {
    BOOK_MULTIPLIER,
    BOOKSHELF_COORDINATES,
    CHUNKX_MULTIPLIER,
    CHUNKY_MULTIPLIER,
    CHUNKZ_MULTIPLIER,
    CIPHER_MAP,
    NEARBY_BOOKSHELF_OFFSETS,
    NEGATIVE_CHUNK_XZ_OFFSET,
    NEGATIVE_CHUNK_Y_OFFSET,
    SHELF_MULTIPLIER,
    SHULKER_MULTIPLIER,
} from './constants';
import {
    nearbySearchButton,
    nearbySearchOutput,
    nearbySearchTextInput,
    nearbySearchXInput,
    nearbySearchYInput,
    nearbySearchZInput,
} from './dom';
import {getPage} from './worker';

function setupCopyButton(id, text) {
    const button = document.getElementById(id);
    button.addEventListener('click', () => {
        navigator.clipboard.writeText(text)
            .then(() => {
                button.innerText = 'Copied!';
                setTimeout(() => button.innerText = 'Copy', 2000);
            })
            .catch(() => alert('Failed to copy command.'));
    });
}

function distance(x1, y1, z1, x2, y2, z2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
}

// https://web.archive.org/web/20090717035140if_/javascript.about.com/od/problemsolving/a/modulobug.htm
function negativeMod(a, b) {
    return ((a % b) + b) % b;
}

function getStartingShelf(searchX, searchY, searchZ) {
    searchX = negativeMod(searchX, 16);
    searchY = negativeMod(searchY, 16);
    searchZ = negativeMod(searchZ, 16);
    const distances = BOOKSHELF_COORDINATES.map(shelf => distance(searchX, searchY, searchZ, ...shelf.split(' ').map(x => parseInt(x))));
    return distances.indexOf(Math.min(...distances));
}

function getPageId(chunkX, chunkY, chunkZ, shelf, shulker, book, page) {
    return BigInt(page)
        + BigInt(book) * BOOK_MULTIPLIER
        + BigInt(shulker) * SHULKER_MULTIPLIER
        + BigInt(shelf) * SHELF_MULTIPLIER
        + BigInt(chunkZ) * CHUNKZ_MULTIPLIER
        + BigInt(chunkY) * CHUNKY_MULTIPLIER
        + BigInt(chunkX) * CHUNKX_MULTIPLIER;
}

function getChunk(x, y, z) {
    return [
        Math.floor(x / 16) + NEGATIVE_CHUNK_XZ_OFFSET,
        Math.floor(y / 16) + NEGATIVE_CHUNK_Y_OFFSET,
        Math.floor(z / 16) + NEGATIVE_CHUNK_XZ_OFFSET
    ];
}

export let worker;
export function performSearch() {
    const searchText = nearbySearchTextInput.value.toUpperCase();
    gtag('event', 'search', {search_term: searchText});

    if (!Array.from(searchText).every(character => CIPHER_MAP[character])) {
        nearbySearchOutput.innerHTML = '<span class="error">Search text can only include letters and spaces.</span>';
        return;
    }

    disableInputs();
    worker = new Worker(new URL('worker.js', import.meta.url), {type: 'module'});
    worker.addEventListener('message', event => {
        const {x, y, z, shelf, shulker, book, page} = event.data;
        const {x: nearbyX, y: nearbyY, z: nearbyZ, yaw, pitch} = NEARBY_BOOKSHELF_OFFSETS[shelf];
        const teleportCommand = `/tp ${x + nearbyX} ${y + nearbyY} ${z + nearbyZ} ${yaw} ${pitch}`;
        const highlightCommand = `/highlight ${shelf + 1n} ${x} ${y} ${z}`;
        nearbySearchOutput.innerHTML = `
            <b>X</b>: ${x}<br>
            <b>Y</b>: ${y}<br>
            <b>Z</b>: ${z}<br>
            <b>Shelf</b>: ${shelf + 1n}<br>
            <b>Shulker</b>: ${shulker + 1n}<br>
            <b>Book</b>: ${book + 1n}<br>
            <b>Page</b>: ${page + 1n}<br>
            <p><b>Teleport Nearby</b>: ${teleportCommand} <button id="copy-teleport">Copy</button></p>
            <p><b>Highlight Shelf</b>: ${highlightCommand} <button id="copy-highlight">Copy</button></p>
        `;
        setupCopyButton('copy-teleport', teleportCommand);
        setupCopyButton('copy-highlight', highlightCommand);
        enableInputs();
    });

    const searchX = parseInt(nearbySearchXInput.value);
    const searchY = parseInt(nearbySearchYInput.value);
    const searchZ = parseInt(nearbySearchZInput.value);
    const [chunkX, chunkY, chunkZ] = getChunk(searchX, searchY, searchZ);
    nearbySearchOutput.innerHTML = 'Searching...';

    const shelf = getStartingShelf(searchX, searchY, searchZ);
    const pageId = getPageId(chunkX, chunkY, chunkZ, shelf, 0n, 0n, 0n);

    worker.postMessage({pageId, searchText});
}

export function enableInputs() {
    nearbySearchTextInput.disabled = false;
    nearbySearchXInput.disabled = false;
    nearbySearchYInput.disabled = false;
    nearbySearchZInput.disabled = false;
    nearbySearchButton.innerText = 'Search';
}

export function disableInputs() {
    nearbySearchTextInput.disabled = true;
    nearbySearchXInput.disabled = true;
    nearbySearchYInput.disabled = true;
    nearbySearchZInput.disabled = true;
    nearbySearchButton.innerText = 'Cancel';
}

let timeForOneSearch;
export function getEstimatedSearchTimeMultiplier() {
    if (timeForOneSearch === undefined) {
        const start = window.performance.now();
        for (let i = 0; i < 1000; ++i) getPage(1908921113007916746816n);
        timeForOneSearch = (window.performance.now() - start) / 10000;
    }
    return timeForOneSearch;
}

export function fillFromSearchParams() {
    const searchParams = new URLSearchParams(window.location.search);
    nearbySearchXInput.value = searchParams.get('x') ?? 0;
    nearbySearchYInput.value = searchParams.get('y') ?? 0;
    nearbySearchZInput.value = searchParams.get('z') ?? 0;
}
