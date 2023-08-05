// init
function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const syncAwait = (timout = 200) => new Promise(resolve => setTimeout(resolve, timout));

window.addEventListener('load', function init() {
  const { Create, Rect, Point } = window['TigCore'];
  const canvas = document.getElementById('Canvas');
  const core = new Create(canvas, { width: 400, height: 400 });
  core.on('FPS', console.log);
  core.run();
  const rect = new Rect(new Point(100, 100), 10, 10);
  rect.dragging = true;
  console.log(rect);
  rect.top = 200;
  rect.left = 200;
  core.add(rect);
});
