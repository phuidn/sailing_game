import { Loader } from "@pixi/loaders";
import SailingGame from "./SailingGame";

let loader = Loader.shared;
console.log("loading...")
loader.add("frag_shader", "src/Engine/shader.frag")
      .add("vtx_shader", "src/Engine/vtx_shader.vert")
      .load(onLoad);

function onLoad() {
    console.log("loaded")
    let game = new SailingGame();
    game.start();
}