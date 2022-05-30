import {nearbySearchButton, nearbySearchEst, nearbySearchOutput, nearbySearchTextInput} from './dom';
import {enableInputs, fillFromSearchParams, getEstimatedSearchTimeMultiplier, performSearch, worker} from './helper';

nearbySearchButton.addEventListener('click', () => {
    if (nearbySearchButton.innerText === 'Search') performSearch();
    else {
        worker.terminate();
        nearbySearchOutput.innerHTML = '';
        enableInputs();
    }
});

nearbySearchTextInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && nearbySearchButton.innerText === 'Search') performSearch();
});

nearbySearchTextInput.addEventListener('keyup', () => {
    const time = getEstimatedSearchTimeMultiplier() * 27 ** nearbySearchTextInput.value.length;
    const seconds = Math.ceil(time / 1000);
    if (seconds <= 60) nearbySearchEst.innerText = `${seconds} seconds`;
    else {
        const minutes = Math.ceil(seconds / 60);
        if (minutes <= 60) nearbySearchEst.innerText = `${minutes} minutes`;
        else {
            const hours = Math.ceil(minutes / 60);
            if (hours <= 24) nearbySearchEst.innerText = `${hours} hours`;
            else {
                const days = Math.ceil(hours / 24);
                if (days <= 365) nearbySearchEst.innerText = `${days} days`;
                else nearbySearchEst.innerText = `${Math.ceil(days / 365)} years`;
            }
        }
    }
});

fillFromSearchParams();
