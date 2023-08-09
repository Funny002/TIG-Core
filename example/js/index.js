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
  const rect = new Rect(new Point(100, 100), 10, 10);
  core.insert(rect);

  rect.on('mousedown', ({ offsetX: x, offsetY: y }) => {
    console.log('mousedown');
    const state = { x, y };
    const shape = { x: rect.left, y: rect.top };

    function onMouseMove({ offsetX, offsetY }) {
      rect.top = shape.y + (offsetY - state.y);
      rect.left = shape.x + (offsetX - state.x);
      rect.remove();
      core.insert(rect);
    }

    function onMouseUp(event) {
      onMouseMove(event);
      rect.off('mouseup', onMouseUp);
      rect.off('mousemove', onMouseMove);
    }

    rect.on('mouseup', onMouseUp);
    rect.on('mousemove', onMouseMove);
  });
});
