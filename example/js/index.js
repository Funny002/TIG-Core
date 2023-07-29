// init
function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

window.addEventListener('load', function init() {
  const TigCore = window.TigCore || TigCore;
  const canvas = document.getElementById('Canvas');
  const tig = new TigCore.Create(canvas, { width: 400, height: 400 });
  console.log(tig, TigCore);
  tig.run();
  tig.onFps(ftp => {
    console.log(ftp);
  });
  const line = new TigCore.Line();
  tig.add(line);
  let left = 0, top = 0;
  line.add(new TigCore.Point(left, top));
  const func = setInterval(() => {
    top += randomNum(5, 30);
    left += randomNum(5, 30);
    line.add(new TigCore.Point(left, top));
    if (top > 400 || left > 400) {
      clearInterval(func);
    }
  }, 500);
});
