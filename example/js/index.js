// init
function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const syncAwait = (timout = 200) => new Promise(resolve => setTimeout(resolve, timout));

window.addEventListener('load', function init() {
  const { Create, Rect, Line, Point } = window['TigCore'];
  const canvas = document.getElementById('Canvas');
  const core = new Create(canvas, { width: 400, height: 400, throttle: 10 });
  core.on('FPS', console.log);
  core.run();
  const rect = new Rect(100, 100, 10, 10);
  core.insert(rect);

  const rect_1 = new Rect(10, 10, 10, 10);
  core.insert(rect_1);

  rect.on('mousedown', ({ offsetX: x, offsetY: y }) => {
    const state = { x, y };
    const shape = { x: rect.left, y: rect.top };

    function onMouseMove({ offsetX, offsetY }) {
      rect.top = shape.y + (offsetY - state.y);
      rect.left = shape.x + (offsetX - state.x);
      rect.remove();
      core.insert(rect);
    }

    function onMouseUp(event) {
      console.log(core);
      rect.off('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    rect.on('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });
});
