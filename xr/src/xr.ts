import { Engine } from "@babylonjs/core";

import { PhysicsSceneWithHavok } from "./scenes/basic.ts";

export const babylonInit = async (): Promise<void> => {

    // create the canvas html element and attach it to the webpage
    var canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.border = "0%";
    canvas.style.left = "0%";
    canvas.style.top = "0%";
    canvas.style.position = "absolute";
    canvas.id = "gameCanvas";
    document.body.appendChild(canvas);

    // initialize babylon scene and engine
    var engine = new Engine(canvas, true);

    const physicsScene = new PhysicsSceneWithHavok();

    const scene = await physicsScene.createScene(engine, canvas);

    // run the main render loop
    engine.runRenderLoop(() => {
        scene.render();
    });
};

babylonInit().then(() => {
    // scene started rendering, everything is initialized
});

