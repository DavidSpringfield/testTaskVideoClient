export function openFullscreen(id) {
    const elem = document.getElementById(id);
    elem.focus();
    if (elem.requestFullscreen)
        elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen)  /* Safari */
        elem.webkitRequestFullscreen();
    else if (elem.msRequestFullscreen)  /* IE11 */
        elem.msRequestFullscreen();
}

export function closeFullscreen() {
    try {
        if (!document.fullscreenElement) return;
        if (document.exitFullscreen)
            document.exitFullscreen();
        else if (document.webkitExitFullscreen)  /* Safari */
            document.webkitExitFullscreen();
        else if (document.msExitFullscreen)  /* IE11 */
            document.msExitFullscreen();
    }
    catch (error) {
        console.warn(error);
    }
}

export function toggleFullScreen(id) {
    const element = document.getElementById(id);

    // Use Fullscreen API
    if (!document.fullscreenElement && element) {
        element.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
}

export function toggleFullScreenWithIosSupport(id) {
    var element = document.getElementById(id);

    if (element.webkitEnterFullscreen) { // iOS Chrome and Safari
        if (!document.webkitFullscreenElement) {
            element.webkitEnterFullscreen();
        } else {
            document.webkitExitFullscreen();
        }
    } else if (element.requestFullscreen) { // Standard Fullscreen API
        if (!document.fullscreenElement) {
            element.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    }
}