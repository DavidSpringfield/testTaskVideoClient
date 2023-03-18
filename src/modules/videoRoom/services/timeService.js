import { interval } from "rxjs";

export function getDisplayTime(seconds) {
    let minutes = parseInt(seconds / 60);
    seconds = seconds % 60;
    if (minutes < 10)
        minutes = `0${minutes}`;
    if (seconds < 10)
        seconds = `0${seconds}`;
    return `${minutes}:${seconds}`;
}

export function startTimer(introTimeSec, tickCallback, stopCallback) {
    const timer = interval(1000).subscribe(async () => {
        introTimeSec = --introTimeSec;
        tickCallback(introTimeSec);
        if (introTimeSec <= 0) {
            timer.unsubscribe();
            stopCallback();
        }
    });
}