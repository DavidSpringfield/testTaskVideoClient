## Project run locally
```
npm run serve
```

## Project setup
```
npm install
```

## Project deploy
```
npm run deploy
```
## How to use:
1. For testing we need 2 devices, e.g. smarphone and laptop. Both devices must have cameras.
2. To run and test the app:
    - On your smartphone go to https://search-7469a.web.app.
    - On your laptop, run app locally with npm run serve command, open browser.
    - On the smarphone click create room
    - On the laptop click join room
    - If smartphone either laptop disconnected, e.g. you refreshed browser page, need to do create-join process from scratch.
    - You can't just reconnect to the same room if one of the clients has been disconnected.
3. Please go to https://www.youtube.com/watch?v=nU_IC_Xx46U and look the short video.

## Steps to reproduce:
1. When both clients are in room, click on the change view button.
    ![image](https://user-images.githubusercontent.com/125875099/226133654-c3b3eeed-5b1f-4265-b36e-791bd2fbba8e.png)
2. If you are launching a desktop browser, on the left side video is from remote source, on the right side video is from local source.
    ![image](https://user-images.githubusercontent.com/125875099/226133754-a71f199e-b0d7-44eb-9cac-fd720abb7893.png)
3. If you launching a mobile browser, it has a bit different look. Remote video is on top, and local video is on bottom.
    ![image](https://user-images.githubusercontent.com/125875099/226133912-61e10cd6-fcc7-4db2-93b1-e81aef2d656f.png)

## Actual result:
    The remote and the local videos have different sizes because their streams come from 2 different cameras with different resolutions.

## Expected result:
    The remote and the local videos must:
    - be at the same size
    - width or height must be without absolute values like e.g. 640px, 480px. Only relative values(% or virtual height, width)
    - should be fixed in both mobile and desktop versions


