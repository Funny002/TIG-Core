// init
function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const syncAwait = (timout = 200) => new Promise(resolve => setTimeout(resolve, timout));

window.addEventListener('load', function init() {
  const { Create, Line, Point } = window['TigCore'];
  const canvas = document.getElementById('Canvas');
  const tig = new Create(canvas, { width: 400, height: 400 });
  tig.run();
  tig.on('fps', console.log);
  let left = 0, top = 0;
  const line = new Line(new Point(left, top));
  tig.add(line);
  (async () => {
    for (; top < 400 || left < 400;) {
      top += randomNum(5, 30);
      left += randomNum(5, 30);
      line.add(new Point(left, top));
      await syncAwait(500);
    }
    for (; line.top < 400 || line.left < 400;) {
      line.top += randomNum(5, 30);
      line.left += randomNum(5, 30);
      await syncAwait(500);
    }
  })();
});
