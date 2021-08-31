# Very Realistic Dinghy Racing Simulator 2021
A game made for the Eggplant Podcast Community Game Jam for July and August 2021.  
[Play it here!][1]  
Warning: it may not render correctly on older browsers, and some newer browsers. Not extensively tested.

### Interesting features
- **Vaguely realistic sailing physics**  
I started this project aiming to simulate sailing in the dumbest way possible,
but it turned out that in order to get the right behaviour I had to surprisingly deep
into the physics of sails and the forces that act on them. The level at which you can
start making dumb approximations is a lot further down the rabbit hole than I had
assumed.
- **All rendered efficiently in a single shader**  
There are no textures. Everything on screen (except the text) is generated in the same shader using signed distance fields
and other shadertoy inspired tricks.
This allowed me to combine the vertices for each element (the boat, the particles, the sail, the water, etc.)
into a single mega-geometry and render it with a single draw call in webGl. Did it make any difference
to performance? I doubt it, but it was a fun exercise and proof of concept.

[1]: https://diuilicin.itch.io/very-realistic-dinghy-racing-simulator-2021
