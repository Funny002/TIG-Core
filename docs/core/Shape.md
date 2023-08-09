# Shape 图形

> 在 Shape 中定义了一些基本的属性和方法，子类可以根据自己的需求进行重写。
> `Shape` 是一个抽象类，不能直接实例化，可以通过它的子类进行实例化。 所有的图形都需要继承自它。
>
> 在我的设想中每一个 `Shape` 都是一个画布，可以在上面绘制任何图形设置单独的效果和样式，然后将它添加到`Canvas (舞台)`上。
> 所以在定义结构和方法时依赖 `Size` 去创建一个`合适大小的画布`，如果你不想使用默认的 `Size` 可以自己定义。
>
> ps: 如无特殊要求应该使用 ShapeItem 抽象类，这样可以避免一些不必要的麻烦和报错。
>
>> 如果你继承 Shape 抽象类必须自己实现 draw 方法否则将报错。
>
>> Q: 为什么要这样做？
>>
>> A: 因为在 Shape 类中并不知道你要绘制什么图形，所以只能把这个方法交给子类去实现。
>
>> Q: 我实现了 draw 方法，但还是无法显示图形？
>>
>> A: 很抱歉的告诉你因为`Shape`结构设计问题，你可能需要重构 `Size` 属性。

|  名称  |                  类型                  | 说明   |
 |:----:|:------------------------------------:|------|
| draw | (ctx:CanvasRenderingContext2D): void | 绘画图形 |

### 属性

|    名称    |               类型                | 只读 |          默认值          |      说明      |
|:--------:|:-------------------------------:|----|:---------------------:|:------------:|
|  bitmap  |            ImageData            | 是  |       undefined       |     像素数据     | 
| children |      Array<Shape\| Point>       | 是  |          []           |      子项      | 
|   size   | { width:number; height:number } | 是  | { width:0, height:0 } |      大小      | 
|   top    |             number              | 否  |           0           | top?.y  距离顶部 | 
|   left   |             number              | 否  |           0           | left?.x 距离左侧 | 
|  index   |             number              | 否  |          -1           |   相当于父级索引    |
|  parent  |              Shape              | 否  |       undefined       |      父级      | 
| visible  |             boolean             | 否  |         true          |     是否可见     | 
| selected |             boolean             | 否  |         true          |    是否可选中     | 
| bounding |            Bounding             | 否  |       Bounding        |      边框      | 

### 方法

> ps: 部分方法并不是直接给 Shape 抽象类使用的，而是为了继承的子类提供方法

| 名称             | 参数                                                                    | 说明                 |
|:---------------|:----------------------------------------------------------------------|:-------------------|
| update         | (): void                                                              | 更新图形               |
| remove         | (): void                                                              | 调用父节点的删除子项         |
| crashDetection | (shape: Shape): boolean                                               | 像素碰撞检测             |
| destroy        | (status?:boolean): void                                               | 销毁，传入 true 将子项一起销毁 |
| push           | (shape: Shape \| Point): void                                         | 向后添加内容             |
| unshift        | (shape: Shape \| Point): void                                         | 向前添加内容             |
| startDraw      | (ctx:CanvasRenderingContext2D): void                                  | 将图形复制到画布上          |
| removeChild    | (index: number): Shape \| Point \| undefined                          | 删除子项               |
| isPointInShape | (x: number, y: number): Shape     \|    undefined                     | 判断坐标是否在图形上方        |
| on             | (key:string, (data: { graphics: Shape[], event: MouseEvent } => void) | 绑定事件               |
| off            | (key:string, (data: { graphics: Shape[], event: MouseEvent } => void) | 解绑事件               |

### 事件

|     名称      |              类型              | 只读 |    默认值    |  说明  |
|:-----------:|:----------------------------:|----|:---------:|:----:|
|    click    | (event: MouseEvent): boolean | 否  | undefined |  点击  | 
|  dblclick   | (event: MouseEvent): boolean | 否  | undefined |  双击  | 
| contextmenu | (event: MouseEvent): boolean | 否  | undefined |  右击  | 
|  mousedown  | (event: MouseEvent): boolean | 否  | undefined | 鼠标按下 |
|   mouseup   | (event: MouseEvent): boolean | 否  | undefined | 鼠标抬起 |
|  mousemove  | (event: MouseEvent): boolean | 否  | undefined | 鼠标移动 |

## 衍生子类

> ps: 以下子类都是继承自 Shape 抽象类，可以直接使用
>

### ShapeItem 抽象类

> 以下属性和方法，全部是继承自 Shape 抽象类，除一些特殊说明外，其他的都是一样的
>

#### 属性

|    名称    |      类型      | 只读 | 默认值 | 说明 |
|:--------:|:------------:|----|:---:|:--:|
| children | Array<Point> | 是  | []  | 子项 | 

#### 方法

|   名称    |          参数          |   说明   |
|:-------:|:--------------------:|:------:|
|  push   | (shape: Point): void | 向后添加内容 |
| unshift | (shape: Point): void | 向前添加内容 |

### ShapeGroup 类

> 请注意 ！！！
>
> `ShapeGroup` 子项的 `坐标起点` 都是`相对定位`，实际的位置需要 `ShapeGroup` 的 `top` 和 `left` 属性来确定
>

|    名称    |      类型      | 只读 | 默认值 | 说明 |
|:--------:|:------------:|----|:---:|:--:|
| children | Array<Shape> | 是  | []  | 子项 | 

#### 方法

|   名称    |          参数          |   说明   |
|:-------:|:--------------------:|:------:|
|  push   | (shape: Shape): void | 向后添加内容 |
| unshift | (shape: Shape): void | 向前添加内容 |
