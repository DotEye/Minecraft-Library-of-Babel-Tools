import {
    BOOK_MULTIPLIER,
    CHARACTERS,
    CHUNKX_MULTIPLIER,
    CHUNKY_MULTIPLIER,
    CHUNKZ_MULTIPLIER,
    CIPHER_KEY,
    CIPHER_MAP,
    CIPHER_TWEAK,
    NEGATIVE_CHUNK_XZ_OFFSET,
    NEGATIVE_CHUNK_Y_OFFSET,
    NUM_BLOCKS_PER_CHUNK,
    NUM_CHARACTERS,
    SHELF_MULTIPLIER,
    SHULKER_MULTIPLIER,
    STRING_LENGTH,
} from './constants';
import FF3Cipher from 'ff3';

const cipher = new FF3Cipher(CIPHER_KEY, CIPHER_TWEAK, Object.keys(CIPHER_MAP).length);

function mapThroughCipher(page) {
    return Array.from(page).map(letter => CIPHER_MAP[letter]).join('');
}

function encrypt(page) {
    return cipher.encrypt(mapThroughCipher(page));
}

function searchString(startingPageId, searchText) {
    searchText = mapThroughCipher(searchText);
    let pageId = 0n;
    while (true) {
        const page = getPage(startingPageId + pageId);
        if (page.includes(searchText)) return fromPageId(startingPageId + pageId);
        const negativePage = getPage(startingPageId - pageId);
        if (negativePage.includes(searchText)) return fromPageId(startingPageId - pageId);
        pageId++;
    }
}

function fromPageId(pageId) {
    const chunkX = Number(pageId / CHUNKX_MULTIPLIER);
    pageId = pageId % CHUNKX_MULTIPLIER;
    const chunkY = Number(pageId / CHUNKY_MULTIPLIER);
    pageId = pageId % CHUNKY_MULTIPLIER;
    const chunkZ = Number(pageId / CHUNKZ_MULTIPLIER);
    pageId = pageId % CHUNKZ_MULTIPLIER;
    const shelf = pageId / SHELF_MULTIPLIER;
    pageId = pageId % SHELF_MULTIPLIER;
    const shulker = pageId / SHULKER_MULTIPLIER;
    pageId = pageId % SHULKER_MULTIPLIER;
    return {
        x: (chunkX - NEGATIVE_CHUNK_XZ_OFFSET) * NUM_BLOCKS_PER_CHUNK,
        y: (chunkY - NEGATIVE_CHUNK_Y_OFFSET) * NUM_BLOCKS_PER_CHUNK,
        z: (chunkZ - NEGATIVE_CHUNK_XZ_OFFSET) * NUM_BLOCKS_PER_CHUNK,
        shelf,
        shulker,
        book: pageId / BOOK_MULTIPLIER,
        page: pageId % BOOK_MULTIPLIER,
    };
}

export function getPage(pageId) {
    let result = '';
    while (pageId !== 0n) {
        const remainder = pageId % NUM_CHARACTERS;
        pageId = pageId / NUM_CHARACTERS;
        result = CHARACTERS[remainder] + result;
    }

    result = result.padStart(STRING_LENGTH);
    return encrypt(result);
}

addEventListener('message', event => {
    const {pageId, searchText} = event.data;
    postMessage(searchString(pageId, searchText));
});
