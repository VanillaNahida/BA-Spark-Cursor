<div align="center">

# BA-Spark 蔚蓝档案点击特效

_✨ 蔚蓝档案风格的鼠标点击&拖尾粒子特效 ✨_

[![License-GPL-green](https://img.shields.io/badge/License-GPL3.0-green.svg)](https://opensource.org/licenses/GPL-3.0) [![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript) [![Canvas](https://img.shields.io/badge/HTML5-Canvas-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

</div>

## 简介

轻量级复刻游戏 《蔚蓝档案》(Blue Archive) 的点击动效和鼠标指针样式。纯原生 JavaScript + Canvas 实现，可嵌入任意网页使用。

## 功能特性

- **点击爆发**：点击时产生圆形扩散波 + 旋转光环 + 飞溅粒子
- **鼠标拖尾**：按住/移动鼠标时产生渐变拖尾轨迹
- **可配置**：支持自定义颜色、缩放、透明度、速度等参数
- **零依赖**：纯原生实现，无需任何第三方库
- **事件穿透**：`pointer-events: none` 不影响页面交互

## 使用方法

1. 将 `ba-spark` 目录放入项目中
2. 在页面中引入：

```html
<canvas id="sparkCanvas"></canvas>
<link rel="stylesheet" href="./ba-spark/spark.css">
<script src="./ba-spark/spark.js" defer></script>
<link rel="stylesheet" href="./BlueArchiveCursor/cursor.css">
```

或者使用JSDelivr引入（推荐）

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/VanillaNahida/BA-Spark-Cursor/ba-spark/spark.css">
<canvas id="sparkCanvas"></canvas>
<script src="https://cdn.jsdelivr.net/gh/VanillaNahida/BA-Spark-Cursor/ba-spark/spark.js" defer></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/VanillaNahida/BA-Spark-Cursor/BlueArchiveCursor/cursor.css">
```

## API

```javascript
// 自定义创建
window.SparkEffect.create('sparkCanvas', {
    color: '45,175,255',   // RGB颜色
    scale: 1.5,            // 缩放
    opacity: 1.0,          // 透明度
    trailSpeed: 1.0,       // 拖尾速度
    clickSpeed: 1.0,       // 点击特效速度
    enableTrail: true      // 启用拖尾
});

// 外部触发点击特效（百分比坐标）
window.externalBoom(0.5, 0.5);

// 更新颜色
window.updateColor('255,100,50');
```

## 技术栈

- HTML5 Canvas
- 原生 JavaScript (ES6+)
- CSS3

## 致谢：

[DoomVoss/BASpark](https://github.com/DoomVoss/BASpark) 本项目的点击特效来源于该项目。  

[makipom/BlueArchive-Cursors](https://github.com/makipom/BlueArchive-Cursors) 本项目的鼠标样式来源于该项目。
