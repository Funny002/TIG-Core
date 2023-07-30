// init
function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const syncAwait = (timout = 200) => new Promise(resolve => setTimeout(resolve, timout));

window.addEventListener('load', function init() {
  const TigCore = window.TigCore || TigCore;
  const canvas = document.getElementById('Canvas');
  const tig = new TigCore.Create(canvas, { width: 400, height: 400 });
  console.log(tig, TigCore);
  tig.run();
  tig.on('fps', console.log);
  const line = new TigCore.Line();
  tig.add(line);
  let left = 0, top = 0;
  line.add(new TigCore.Point(left, top));
  (async () => {
    for (; top < 400 || left < 400;) {
      top += randomNum(5, 30);
      left += randomNum(5, 30);
      line.add(new TigCore.Point(left, top));
      await syncAwait(500);
    }
    console.log(line);
    for (; line.top < 400 || line.left < 400;) {
      line.top += randomNum(5, 30);
      line.left += randomNum(5, 30);
      console.log(line);
      await syncAwait(500);
    }
  })();
});
