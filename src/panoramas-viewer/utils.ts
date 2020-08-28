import { MathUtils, Vector3, Camera } from "three";

export const log = console.log;

// 角度转化为经度[-180, 180]
export function getLontitude(degree: number) {
  // -190 -> 170
  // -370 -> -10
  // 200 -> -160

  const remainder = (degree %= 360);
  if (Math.abs(remainder) < 180) {
    degree = remainder;
  } else {
    degree = degree + (degree > 0 ? -1 : 1) * 360;
  }

  return degree;
}

// 经纬度转化为世界坐标
export function latLon2WorldVector(
  r: number,
  latitude: number,
  longtitude: number
) {
  let x, y, z;

  // 纬度方向旋转不能超过正负 85 度角（即接近南北极附近）
  latitude = Math.max(-85, Math.min(85, latitude));

  // 角度转弧度 radian = (2π / 360) * degreee
  const radianY = MathUtils.degToRad(latitude);
  const radianX = MathUtils.degToRad(longtitude);
  x = r * Math.cos(radianY) * Math.cos(radianX);
  y = r * Math.sin(radianY);
  z = r * Math.cos(radianY) * Math.sin(radianX);

  return new Vector3(x, y, z);
}

// 屏幕坐标 {event.clientX, event.clienY} 转世界坐标
export function screenPos2WorldVector(
  x: number,
  y: number,
  width: number,
  height: number,
  camera: Camera
): Vector3 {
  const pX = (x / width) * 2 - 1;
  const pY = -(y / height) * 2 + 1;
  const vector = new Vector3(pX, pY, -1).unproject(camera);
  return vector;
}

// 世界坐标转屏幕坐标
export function worldVector2ScreenPos(
  worldVector: Vector3,
  width: number,
  height: number,
  camera: Camera
) {
  const vector = worldVector.clone().project(camera);

  // https://stackoverflow.com/questions/29816080/convert-point3d-to-screen2d-get-wrong-result-in-three-js
  // vector.z > 1 表示在 camera 的背面同一个坐标点
  if(vector.z > 1){
    return {
      x: 9999,
      y: 9999
    }
  }
  return {
    x: Math.round(((vector.x + 1) * width) / 2),
    y: Math.round(((1 - vector.y) * height) / 2),
    z: vector.z
  };
}

export function throttle(fn: Function, wait: number = 0) {
  let callback = fn;
  let timerId: any = null;

  // 是否是第一次执行
  let firstInvoke = true;

  function throttled(this: any) {
    let context = this;
    let args = arguments;

    if (firstInvoke) {
      callback.apply(context, args);
      firstInvoke = false;
      return;
    }

    if (timerId) {
      return;
    }

    timerId = setTimeout(function () {
      clearTimeout(timerId);
      timerId = null;
      callback.apply(context, args);
    }, wait);
  }

  return throttled;
}

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
