# Gravity.js

[View Example](https://theithorian.github.io/Gravity/)

## Overview

Simple interactive particle simulator.

## Features

-   N-body simulation.
-   All elements are rendered to the DOM and not to a canvas. Renderers are configurable.
-   **Node.js NOT required** (though the website needs to be hosted to avoid CORS errors).
-   Customisable options and simulation configuration.
-   Can be easily integrated to any website.
-   Example simulation UI controls.
-   Collision with edges.
-   Option to toggle between inter-particle interaction and absolute device orientation forces.

## Controls

This is an overview of the controls in our [example](https://theithorian.github.io/Gravity/):

-   Click or tap anywhere to add a particle.
-   Click `Pause` / `Start` to pause or start the simulation
-   Click `Reset` to remove all particles
-   Click `Show additional options` to expand the additional option menu

### Additional Options

-   `Use Border?` > Adds a border around the edge of the window which particles will reflect off
-   `Disable Gravity?` > No force calculations will be made to the particles
-   `Vertical Gravity?` > Particles will not interact with eachother.
    -   On desktop, the particles will drop to the the ground.
    -   On mobile, the particles will travel in a direction dependent on the device oritentation
-   `Random Direction?` - Any new particales spawned will have a random direction and velocity.
-   `Enable Annotations?` > Annotations will be visible and additional annotation options will be available.
-   `Enable Lines Between Particles?` > Each particle will emit a line to every other plents. It makes for a cool effect!
-   ` Minimum Effective Gravity Displacement` > The distance to which any less displacement between particles has no more effect on the resultant force. Used to prevent "Black Holes".

### Shortcuts

-   `M`: Toggle the menu
-   `P`: Pause / Start the simulation
-   `R`: Reset the simulation
-   `Space`: Randomly place a particle
-   `D`: Display debug info

## Api documentation

### Usage

To use this in your own projects, download the Gravity directory, and import from the `module.js` file. Create a new instance of the Gravity class and attach it to an element in the DOM. The element must have an `<svg>` child for the annotations to work correctly.

In `index.html`:

```
<!DOCTYPE html>
<head>
    <script type="module" src="./index.js"></script>
</head>

<body style="margin: 0px; overflow: hidden">
    <div id="myElement" style="width: 100vw; height: 100vh; background-color: black">
        <svg></svg>
    </div>
</body>
```

In `index.js`:

```
import { Gravity } from './Gravity/module.js';

const myElement = document.getElementById('myElement');
const gravity = new Gravity();

// Attaches the instance with an element in the DOM
gravity.setElement(myElement)

...

```

In this example, now when `myElement` is clicked, a new particle is created and the simultation will start.

### Gravity class

The constructor takes two arguments: `config` and `motionDetector`.

The `config` object determines how the interactions between particles will behave and how they are rendered to the dom. The following properties can be set:

-   `enableBorder: boolean` - Enables the border around the container element.
-   `enableRandomParticleDirection: boolean` - New particles will have a random direction.
-   `disableGravity: boolean` - Particles will not interact with eachother.
-   `enableVerticalGravity: boolean` - Particles will not interact with eachother but will vertically down.
-   `enableDrawAnnotations: boolean` - Enables annotations.
-   `enableDrawLinesBetweenParticles: boolean` - Each particle will emit a line to each other.
-   `particleColors: string[]` - A list of hex colors. Each placed particle will take a random color from this list.
-   `minDisplacement: float` - The distance (in px) to which any less displacement between particles has no more effect on the resultant force.
-   `particleRenderer: function(particle)` - Takes the particle to be rendered. Should output a HTML node.
    -   E.g.
    ```
    gravity.config.particleRenderer: particle =>
        `<span style='color: white;'>
            ${particle.position.x.toFixed()}, ${particle.position.y.toFixed()}
        <\span>`
    ```

The `motionDetector` class contains additional functionality around detecting device motion and can be imported from `'Gravity/motionDetector.js'`. Instantiating this and passing to `Gravity()` will have the following effects:

-   If the client's broweser supports it and when `enableVerticalGravity=true`, the particles will drop in the direction of the Earth's gravity
-   If the client window is moved relative to the desktop, the absolute position of particles will remian the same. I.e. if the window is moved 100px to the right, every particle will be moved 100px to the left. This uses a custom event dispatcher.

#### Methods

-   `setElement(element)` - Attaches the instance to an element in the DOM.
-   `addParticle(x, y)` - Adds a particle to the DOM, at the position `(x, y)`.
-   `addParticleToDom(particle)` - Adds a particle instance to the DOM associated with this instance.
-   `clearAnnotations()` - Removes all annotations.
-   `step()` - Moves the simulation forward 1 step.
-   `removeParticleById(id)` - Removes a particle with the associated id from the insatnce.
-   `pauseSim()` - Pauses the simulation. No more steps are made until the sim is resumes.
-   `startSim()`- Starts the simulation again if it is paused.
-   `reset()` - Removes all particles from the instance
-   `resize()` - Recalculates the bounding box from the attached element's size. This should be called when the element changes size. This can be easily done by attaching a resize event listener:

```
window.addEventListener('resize', () => {
        gravity.resize();
    });
```

The following methods change the current config:

-   `toggleBorder()`
-   `toggleRandomDirection()`
-   `toggleGravity()`
-   `toggleAnnotations()`
-   `toggleLinesBetweenParticles()`
-   `changeMinimumDisplacement()`
-   `toggleVerticalGravity()`
