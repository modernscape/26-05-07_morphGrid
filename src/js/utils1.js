import * as THREE from "three"
// import { Vector3, CubicBezierCurve3 } from 'three';
import { Line2 } from "three/addons/lines/Line2.js"
import { LineMaterial } from "three/addons/lines/LineMaterial.js"
// import { LineDashedMaterial } from 'three/addons/lines/LineDashedMaterial.js';
import { LineGeometry } from "three/addons/lines/LineGeometry.js"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { PMREMGenerator } from "three"
import { RGBELoader } from "three/addons/loaders/RGBELoader.js"
// import { MeshSurfaceSampler } from 'three/addons/loaders/RGBELoader.js';
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js"

// export default class {}

/*****************************************************
export OK 
******************************************************/

// 「cameraの状態をローカルに保存」
export const saveCameraAttributeToLocal = (camera, orbitControls) => {
  const cameraState = saveCameraState(camera, orbitControls)
  localStorage.setItem("cameraState", JSON.stringify(cameraState))
}

// 「cameraの状態をローカルから読み込み」
export const loadCameraAttributeFromLocal = (camera, orbitControls) => {
  const state = JSON.parse(localStorage.getItem("cameraState"))
  if (state) {
    loadCameraState(camera, state, orbitControls)
  }
}

const saveCameraState = (camera, orbitControls) => {
  console.log("saveCameraState!")
  return {
    position: camera.position.toArray(),
    quaternion: camera.quaternion.toArray(),
    fov: camera.fov,
    near: camera.near,
    far: camera.far,
    x: orbitControls.target.x,
    y: orbitControls.target.y,
    z: orbitControls.target.z,
  }
}

const loadCameraState = (camera, state, orbitControls) => {
  camera.position.fromArray(state.position)
  camera.quaternion.fromArray(state.quaternion)
  camera.fov = state.fov
  camera.near = state.near
  camera.far = state.far
  orbitControls.target = new THREE.Vector3(state.x, state.y, state.z)
  camera.updateProjectionMatrix() // 必須: 投影行列を更新する
  console.log("loadCameraState!")
}

//「線形補完」
export const lerp = (x, y, p) => {
  return x + (y - x) * p
}

//「hdriで背景を生成」
export const makeEnvironment = (
  stage,
  imgName = "kloofendal_48d_partly_cloudy_puresky_4k.hdr",
) => {
  // const imgName = 'overcast_soil_puresky_4k.hdr';
  // const imgName = 'kloofendal_48d_partly_cloudy_puresky_4k.hdr';
  // const imgName = 'autumn_field_puresky_4k.hdr';

  const imgPath = "./src/img/hdri/"
  const pmremGenerator = new PMREMGenerator(stage.renderer)
  pmremGenerator.compileEquirectangularShader()

  const loader0 = new RGBELoader()
  loader0.load(imgPath + imgName, function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture
    stage.scene.environment = envMap
    stage.scene.background = envMap
    texture.dispose()
    pmremGenerator.dispose()
  })
}

//「BufferGeometryの表面上のランダムな点の配列を生成（positionsNum個）」
export const geometryPositionsWithNumber = (bufferGeometry, positionsNum) => {
  return new Promise((resolve, reject) => {
    const material = new THREE.MeshBasicMaterial()
    const mesh = new THREE.Mesh(bufferGeometry.toNonIndexed(), material)
    const sampler = new MeshSurfaceSampler(mesh).build()
    const particlesPosition = new Float32Array(positionsNum * 3)
    for (let i = 0; i < positionsNum; i++) {
      const newPosition = new THREE.Vector3()
      const normal = new THREE.Vector3()
      sampler.sample(newPosition, normal)
      particlesPosition.set(
        [newPosition.x, newPosition.y, newPosition.z],
        i * 3,
      )
    }
    resolve(particlesPosition) // :Float32Array
  })
}

/* 
Promise使用
*/
export const makeText = (str, fontPass, color) => {
  return new Promise((resolve, reject) => {
    const loader = new THREE.FontLoader()
    loader.load(fontPass, (font) => {
      const parameters = {
        font: font, //
        weight: "normal",
        style: "normal",
        size: 5 * Math.random() + 2.5,
        height: 0.1,
        curveSegment: 10,
        bevelEnabled: false,
        bevelThickness: 1,
        bevelSize: 0.5,
      }

      const textGeometry = new THREE.TextGeometry(str, parameters)
      const material = new THREE.MeshPhongMaterial({
        transparent: true,
        opacity: Math.random() * 0.5,
        color: color,
        // shininess: 10.0,
      })

      textGeometry.computeBoundingBox()
      const boundingBox = textGeometry.boundingBox

      const offsetX = (boundingBox.max.x + boundingBox.min.x) / 2
      const offsetY = (boundingBox.max.y + boundingBox.min.y) / 2
      const offsetZ = (boundingBox.max.z + boundingBox.min.z) / 2

      textGeometry.translate(-offsetX, -offsetY, -offsetZ)

      const text = new THREE.Mesh(textGeometry, material)
      text.rotation.x = (-Math.PI / 2) * Math.random()
      text.rotation.z = (Math.PI / 2) * Math.random()
      const range_l = 100
      const x = Math.random() * range_l - range_l / 2
      const y = Math.random() * range_l - range_l / 2
      const z = Math.random() * range_l - range_l / 2
      text.position.set(x, y, z)
      resolve(text) // textを返す
    })
  })
}

// 「ray をつくる」
export const makeRay = (window) => {
  return new Promise((resolve, reject) => {
    const L = 500
    const x0 = Math.random()
    const y0 = Math.random()
    const z0 = Math.random()
    const x1 = Math.random()
    const y1 = Math.random()
    const z1 = Math.random()

    const geometry = new LineGeometry()
    geometry.setPositions([
      x0 * L, //
      y0 * L,
      z0 * L,
      -x1 * L,
      -y1 * L,
      -z1 * L,
    ])
    const s = Math.random() * 0.7 + 0.3
    const l = Math.random() * 0.7
    const h = Math.random()
    const a = Math.random() * 0.5 + 0.5
    const range_width = 0.7
    const w = Math.random() * range_width
    const material = new LineMaterial({
      color: new THREE.Color().setHSL(h, s, l), //,
      linewidth: w,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight), // 解像度
      transparent: true,
      opacity: a,
    })

    const line2 = new LineSegments2(geometry, material)
    resolve(line2)
  })
}

// 「エッジを描く」 cf. makeEdgesHelper
export const makeEdges = (mesh, color, width, scene, window) => {
  return new Promise((resolve, reject) => {
    console.log("mesh.geometry")
    console.log(mesh.geometry)

    const geometry = new LineGeometry()
    geometry.setPositions([0, 0, 0, 0, 0, 0])

    const material = new LineMaterial({
      color: color, //new THREE.Color().setHSL(h, s, l), //,
      linewidth: 1.0,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight), // 解像度
      transparent: true,
      opacity: 0.5,
    })

    const line2 = new LineSegments2(geometry, material)
    resolve(line2)
    reject("エラー！")
  })
}

//「カーブに沿ってmeshesを動かす」
export const moveOnPath = (
  stage,
  curveJSON,
  pointsCount,
  meshes,
  interval = 0.1,
  wait = 3.0,
  duration = 20.0,
) => {
  const loader = new THREE.FileLoader()

  duration = meshes.length * interval

  const makeCurvesAndAnimateMeses = () => {
    // const k = 10;
    loader.setPath("./curves/")
    loader.load(curveJSON, function (data) {
      const bezierData = JSON.parse(data)
      // ベジェカーブをThree.jsで再構築
      let pointsOnCurves = []
      const h = Math.random()

      for (let i = 0; i < bezierData.length - 1; i++) {
        const p0 = new THREE.Vector3(...bezierData[i].co)
        const p1 = new THREE.Vector3(...bezierData[i].handle_right)
        const p2 = new THREE.Vector3(...bezierData[i + 1].handle_left)
        const p3 = new THREE.Vector3(...bezierData[i + 1].co)

        // CubicBezierCurve3を使ってカーブセグメントを作成
        const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3)
        pointsOnCurves.push(curve.getPoints(pointsCount))

        const geometry = new THREE.BufferGeometry().setFromPoints(
          curve.getPoints(pointsCount),
        )
        const material = new THREE.LineBasicMaterial({
          color: new THREE.Color().setHSL(h, 1.0, 0.5), //
          transparent: true,
          opacity: 0.2,
        })

        const curveObject = new THREE.Line(geometry, material)
        stage.scene.add(curveObject) // カーブ
      }

      // アニメーション
      for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i]
        const pos = pointsOnCurves[0][0]
        mesh.position.set(pos.x, pos.y, pos.z)
        let pathPoints = []
        for (let i = 0; i < pointsOnCurves.length; i++) {
          const points_ = pointsOnCurves[i]
          pathPoints.push(...vec3toObj(points_))
        }
        setAutoPlay(mesh, i, pathPoints, pos)
      }
    })

    const setAutoPlay = (mesh, i, pathPoints, startPos) => {
      flowAnim(mesh, i, pathPoints)
      gsap.to(
        {},
        {
          duration: meshes.length * 1 * interval + wait,
          ease: "none",
          repeat: 0,
          onRepeat: () => {
            mesh.position.set(startPos.x, startPos.y, startPos.z)
            flowAnim(mesh, i, pathPoints)
          },
        },
      )
    }

    const flowAnim = (mesh, i, pathPoints) => {
      gsap.to(mesh.position, {
        duration: meshes.length * 1 * interval + wait,
        delay: i * interval * Math.random(),
        motionPath: {
          path: pathPoints,
          autoRotate: true,
          curviness: 0,
        },
        ease: "none",
        repeat: 0,
        onStart: () => {
          mesh.material.opacity = 1.0
          mesh.rotation.x = 0 // Math.random() * 2; // Math.PI * 2;
        },
        onComplete: () => {
          mesh.material.opacity = 0.0
        },
      })

      gsap.to(mesh.rotation, {
        y: Math.random() * Math.PI * 20,
        z: Math.random() * Math.PI * 30,
        duration: 3 * Math.random(),
        delay: i * interval * Math.random(),
        ease: "none",
        repeat: 0,
        yoyo: false, //true,
      })
    }
  }
  makeCurvesAndAnimateMeses()
}

// export const shuffleArray = (array) => {
//   const copiedArray = array.slice(); // 元の配列をコピー
//   for (let i = array.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [array[i], array[j]] = [array[j], array[i]]; // 配列内の要素を交換
//   }
//   return array;
// };

export const shuffleArray = (array) => {
  const copiedArray = array.slice() // 元の配列をコピー
  for (let i = copiedArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copiedArray[i], copiedArray[j]] = [copiedArray[j], copiedArray[i]]
  }
  return copiedArray
}

/*****************************************************
export OK END
******************************************************/

// 画像からピクセル取得
export function imagePixel(path, w, h, ratio) {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  const width = w
  const height = h
  canvas.width = width
  canvas.height = height

  ctx.drawImage(path, 0, 0)
  const data = ctx.getImageData(0, 0, width, height).data
  const position = []
  const color = []
  const alpha = []

  for (let y = 0; y < height; y += ratio) {
    for (let x = 0; x < width; x += ratio) {
      const index = (y * width + x) * 4
      const r = data[index] / 255
      const g = data[index + 1] / 255
      const b = data[index + 2] / 255
      const a = data[index + 3] / 255

      const pX = x - width / 2
      const pY = -(y - height / 2)
      const pZ = 0

      position.push(pX, pY, pZ)
      color.push(r, g, b)
      alpha.push(a)
    }
  }
  return { position, color, alpha }
}

export const vec3toObj = (vector3Array) => {
  let result = []
  for (let i = 0; i < vector3Array.length; i++) {
    const vector = vector3Array[i]
    const obj = { x: vector.x, y: vector.y, z: vector.z }
    result.push(obj)
  }
  return result
}

export const drawLine = (point0, point1, scenes) => {
  // 1. 頂点情報の定義
  const points = [point0, point1]

  // 2. ジオメトリを作成
  const geometry = new THREE.BufferGeometry().setFromPoints(points)

  // 3. マテリアルを作成
  const material = new THREE.LineBasicMaterial({ color: 0xff0000 }) // 赤色

  // 4. Lineオブジェクトを作成
  const line = new THREE.Line(geometry, material)

  // console.log(stage.model);

  // 5. シーンに追加
  scene.add(line)
}

// wireframeをつくる
export function makeLines(mesh, scene) {
  const positions = mesh.geometry.attributes.position.array
  console.log(positions)

  const geometry = new LineGeometry()
  geometry.setPositions(positions)

  const material = new LineMaterial({
    color: 0xff0000,
    linewidth: 10, // 線の太さ
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight), // 解像度
    transparent: true,
    opacity: 0.5,
  })

  // Line2オブジェクトを作成
  const line = new Line2(geometry, material)
  scene.add(line)
}

// Canvas要素（ガウス分布）の生成
export function generateCanvas_Gaussian() {
  //canvas要素の生成
  var canvas = document.createElement("canvas")
  //canvas要素のサイズ
  canvas.width = 256 //横幅
  canvas.height = 256 //縦幅
  //コンテキストの取得
  var context = canvas.getContext("2d")

  //ガウス分布の平均値と分散
  var x_ = canvas.width / 2 //平均値（x座標）
  var y_ = canvas.height / 2 //平均値（y座標）
  var sigma2 = 5000 //分散
  //ビットマップデータのRGBAデータ格納配列
  var bitmapData = []
  //RGBAデータ格納配列への値の代入
  for (var j = 0; j < canvas.height; j++) {
    for (var i = 0; i < canvas.width; i++) {
      var index = (j * canvas.width + i) * 4 //各ピクセルの先頭を与えるインデクス番号
      var x = i,
        y = j
      //ガウス分布の値の取得
      var f = Math.exp(
        -((x - x_) * (x - x_) + (y - y_) * (y - y_)) / (2 * sigma2),
      )
      //ビットマップデータのRGBAデータ
      bitmapData[index + 0] = 255 * f //R値
      bitmapData[index + 1] = 255 * f //R値
      bitmapData[index + 2] = 255 * f //R値
      bitmapData[index + 3] = 255 //A値
    }
  }
  //イメージデータオブジェクトの生成
  var imageData = context.createImageData(canvas.width, canvas.height)
  for (var i = 0; i < canvas.width * canvas.height * 4; i++) {
    imageData.data[i] = bitmapData[i] //配列のコピー
  }
  //return imageData;

  //イメージデータオブジェクトからcanvasに描画する
  context.putImageData(imageData, 0, 0)
  return canvas
}

// Canvas要素の生成
export const generateCanvas = () => {
  //canvas要素の生成
  var canvas = document.createElement("canvas")
  //canvas要素のサイズ
  canvas.width = 256 //横幅
  canvas.height = 256 //縦幅
  //コンテキストの取得
  var context = canvas.getContext("2d")

  //ガウス分布の平均値と分散
  var x_ = canvas.width / 2 //平均値（x座標）
  var y_ = canvas.height / 2 //平均値（y座標）
  var sigma2 = 5000 //分散
  //ビットマップデータのRGBAデータ格納配列
  var bitmapData = []
  //RGBAデータ格納配列への値の代入
  for (var j = 0; j < canvas.height; j++) {
    for (var i = 0; i < canvas.width; i++) {
      var index = (j * canvas.width + i) * 4 //各ピクセルの先頭を与えるインデクス番号
      var x = i,
        y = j
      //ガウス分布の値の取得
      var f = Math.exp(
        -((x - x_) * (x - x_) + (y - y_) * (y - y_)) / (2 * sigma2),
      )
      //ビットマップデータのRGBAデータ
      bitmapData[index + 0] = 255 * f //R値
      bitmapData[index + 1] = 0 //G値
      bitmapData[index + 2] = 0 //B値
      bitmapData[index + 3] = 255 //A値
    }
  }
  //イメージデータオブジェクトの生成
  var imageData = context.createImageData(canvas.width, canvas.height)
  for (var i = 0; i < canvas.width * canvas.height * 4; i++) {
    imageData.data[i] = bitmapData[i] //配列のコピー
  }
  //return imageData;

  //イメージデータオブジェクトからcanvasに描画する
  context.putImageData(imageData, 0, 0)
  return canvas
}

// curve上の点の配列を返す
// curveList: [curve.json]
// pointsCount: 点の数

// ランダムなスプライン
export const _makePointsOnSpline = () => {
  const l = this.L_x / this.stepsNum // x方向の間隔
  let stepPoints = [] // 50個
  for (let i = 0; i < this.stepsNum; i++) {
    const x = l * i - this.L_x / 2
    const y = this.L_y * Math.random() - this.L_y / 2
    const z = this.L_z * Math.random() - this.L_z / 2
    stepPoints[i] = new THREE.Vector3(x, y, z)
  }

  // その座標をもとにスプラインを作成
  const spline = new THREE.CatmullRomCurve3(stepPoints) // 🌟🌟🌟🌟🌟

  // スプライン上の100個の点の座標の配列を作成
  const pointsCountOnSpline = 300
  const pointsOnSpline = [] // [{x,y,z}]
  for (let i = 0; i < pointsCountOnSpline; i++) {
    const l = i / pointsCountOnSpline
    const position = spline.getPoint(l) // 🌟🌟🌟🌟🌟
    pointsOnSpline.push({
      x: position.x, //
      y: position.y,
      z: position.z,
    })
  }
  return pointsOnSpline // [{x,y,z}]
}

// うまくいかない！
// export const makeText0 = (str, fontPass, color, scene, array) => {
//   const loader = new THREE.FontLoader();
//   loader.load(fontPass, (font) => {
//     const parameters = {
//       font: font, //
//       weight: 'normal',
//       style: 'normal',
//       size: 5 * Math.random() + 2.5,
//       height: 0.1,
//       curveSegment: 10,
//       bevelEnabled: false,
//       bevelThickness: 1,
//       bevelSize: 0.5,
//     };

//     const textGeometry = new THREE.TextGeometry(str, parameters);
//     const material = new THREE.MeshPhongMaterial({
//       transparent: true,
//       opacity: 0.3,
//       color: color,
//       shininess: 10.0,
//     });

//     textGeometry.computeBoundingBox();
//     const boundingBox = textGeometry.boundingBox;

//     const offsetX = (boundingBox.max.x + boundingBox.min.x) / 2;
//     const offsetY = (boundingBox.max.y + boundingBox.min.y) / 2;
//     const offsetZ = (boundingBox.max.z + boundingBox.min.z) / 2;

//     textGeometry.translate(-offsetX, -offsetY, -offsetZ);

//     const text = new THREE.Mesh(textGeometry, material);
//     scene.add(text);
//     text.rotation.x = (-Math.PI / 2) * Math.random();
//     text.rotation.z = (Math.PI / 2) * Math.random();
//     const range_l = 100;
//     const x = Math.random() * range_l - range_l / 2;
//     const y = Math.random() * range_l - range_l / 2;
//     const z = Math.random() * range_l - range_l / 2;
//     text.position.set(x, y, z);
//     array.push(text);

//     return text;
//   });
// };
