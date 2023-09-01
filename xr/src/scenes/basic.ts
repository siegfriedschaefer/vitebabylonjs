import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, Nullable, Space } from "@babylonjs/core";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { GradientMaterial } from "@babylonjs/materials";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import { Button, AdvancedDynamicTexture } from "@babylonjs/gui";

/*
import { WebXRSessionManager, 
        } from '@babylonjs/core/XR';
*/

import { havokModule } from "../externals/havok";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";

class PhysicsSceneWithHavok {

    static START_X = 0.0;
    static START_Y = -1.0;
    static START_Z = 1.5;
    static RUNNING_Y = 1.5;

    ball: Nullable<Mesh> = null;
    scene: Nullable<Scene> = null;
    sphereAggregate: Nullable<PhysicsAggregate> = null;
    trigger_state: number = 0;
    button1: Nullable<Button> = null;
    button2: Nullable<Button> = null;
    advancedTexture: Nullable<AdvancedDynamicTexture> = null;
    ground: Nullable<Mesh> = null;

    createScene = async (engine: Engine, canvas: HTMLCanvasElement): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);

        scene.createDefaultEnvironment({ createGround: false, createSkybox: false });

        // This creates and positions a free camera (non-mesh)
        var camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

        // This targets the camera to scene origin
        camera.setTarget(Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.9;

        // Our built-in 'sphere' shape.
        this.ball = MeshBuilder.CreateSphere("sphere", {diameter: 0.2, segments: 32}, scene);

        var gradientMaterial = new GradientMaterial("grad", scene);
        gradientMaterial.topColor = Color3.Red(); // Set the gradient top color
        gradientMaterial.bottomColor = Color3.Red(); // Set the gradient bottom color
        gradientMaterial.offset = 0.85;
        this.ball.material = gradientMaterial;

        // Move the sphere under the ground, we will not be able to see it
        this.ball.position.x = PhysicsSceneWithHavok.START_X;
        this.ball.position.y = PhysicsSceneWithHavok.START_Y;
        this.ball.position.z = PhysicsSceneWithHavok.START_Z;
        this.ball.visibility = 0.0;

        // Our built-in 'ground' shape.
        this.ground = MeshBuilder.CreateGround("ground", {width: 1, height: 2}, scene);
        this.ground.position.z = 2.0;
        this.ground.position.y = -1.0;
        this.ground.rotate(new Vector3(1, 0, 0), Math.PI / 45, Space.WORLD);
        this.ground.visibility = 0.0;

        // GUI
        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this.button1 = Button.CreateSimpleButton("but1", "Throw new ball");
        this.button1.width = "400px"
        this.button1.height = "150px";
        this.button1.color = "white";
        this.button1.cornerRadius = 20;
        this.button1.background = "green";
        this.button1.onPointerUpObservable.add(this.thrownewball);

        this.button2 = Button.CreateSimpleButton("but2", "Enable XR");
        this.button2.width = "400px"
        this.button2.height = "150px";
        this.button2.color = "white";
        this.button2.cornerRadius = 20;
        this.button2.background = "blue";
        this.button2.onPointerUpObservable.add(this.enablexr);
        this.advancedTexture.addControl(this.button2); 
    
        // PHYSICS!
        scene.enablePhysics(new Vector3(0,-9.81,0), new HavokPlugin(true, await havokModule));

        // Create a static box shape.
        var groundAggregate = new PhysicsAggregate(this.ground, PhysicsShapeType.BOX, { mass: 0, restitution: 0.2 }, scene);

        scene.beforeRender = () => {
            if (this.scene != null) {
                if (this.ball != null) {

                    // This is a hack to get the ball back to the start position.
                    // The ball is thrown again when the button is clicked.
                    // This is needed because of the havok physics engine to function properly.
                    // The havok plugin does not allow to reset the ball to the start position.
                    // You have to dispose the ball and create a new PhysicsAggregate.

                    if (this.trigger_state == 0) {
                        // do nothing, action starts with first click on button
                        if (this.ball.position.y < -1.5) {
                            this.ball.visibility = 0.0;
                        }
                    } else if (this.trigger_state == 1) {
                        if (this.sphereAggregate != null) {
                            this.sphereAggregate.dispose();
                        }
                        this.trigger_state = 2;
                    }   else if (this.trigger_state == 2) {
                            this.ball.position.x = PhysicsSceneWithHavok.START_X;
                            this.ball.position.y = PhysicsSceneWithHavok.RUNNING_Y;
                            this.ball.position.z = PhysicsSceneWithHavok.START_Z;
                            this.trigger_state = 3;
                    } else if (this.trigger_state == 3) {
                            this.sphereAggregate = new PhysicsAggregate(this.ball!, PhysicsShapeType.SPHERE, { mass: 2, restitution: 0.6 }, this.scene);
                            this.trigger_state = 0;
                    } else {
                    }
                }
            }
        }

        this.scene = scene;
        return scene;
    }

    // egal, wo sich der Ball befindet, er soll bei jedem Klick auf den Button neu geworfen werden
    thrownewball = () => {
        console.log("thrownewball: " + this.ball!.position.y + " " + this.trigger_state);
        if (this.ball != null) {
            this.ball.visibility = 1.0;
        }
        this.trigger_state = 1;
    }

    enablexr = () => {
        (async () => {
            if ((this.scene !== undefined) && (this.scene !== null)) {
                try {
                    const xr = await this.scene.createDefaultXRExperienceAsync({
                        disableDefaultUI: true,
                        disableTeleportation: true,
                    });
        
                    const session = await xr.baseExperience.enterXRAsync(
                        'immersive-ar',
                        'unbounded',
                        xr.renderTarget,
                    );

                    if ((this.button2 != null) && (this.advancedTexture != null) && (this.button1 != null)
                        && (this.ball != null) && (this.ground != null)) {
                        this.button2.dispose();
                        this.advancedTexture.removeControl(this.button2);
                        this.advancedTexture.addControl(this.button1);
                        this.ground.visibility = 1.0;
                        this.button1.linkWithMesh(this.ground);
                        this.button1.linkOffsetYInPixels = 500;
                        this.button1.linkOffsetX = 0;

                    }


                } catch (e) {
                    console.log(e);
                }
            }
        })();
    };
}

export { PhysicsSceneWithHavok };