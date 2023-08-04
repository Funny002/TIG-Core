// init
function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const syncAwait = (timout = 200) => new Promise(resolve => setTimeout(resolve, timout));

window.addEventListener('load', function init() {
  const { Create, Rect, Point } = window['TigCore'];
  const canvas = document.getElementById('Canvas');
  const tig = new Create(canvas, { width: 400, height: 400 });
  tig.run();
  tig.add(new Rect(new Point(100, 100), 10, 10));
  // tig.on('fps', console.log);
  // let i = 0;
  // const func = setInterval(() => {
  //   const item = new Rect(new Point(10 * i, 0), 10, 10);
  //   console.log(item);
  //   tig.add(item);
  //   i++;
  //   if (i >= 10) clearInterval(func);
  // }, 500);
  // const line = new Line(new Point(left, top));
  // (async () => {
  //   for (; top < 400 || left < 400;) {
  //     top += randomNum(5, 30);
  //     left += randomNum(5, 30);
  //     line.add(new Point(left, top));
  //     await syncAwait(500);
  //   }
  //   for (; line.top < 400 || line.left < 400;) {
  //     line.top += randomNum(5, 30);
  //     line.left += randomNum(5, 30);
  //     await syncAwait(500);
  //   }
  // })();
});
