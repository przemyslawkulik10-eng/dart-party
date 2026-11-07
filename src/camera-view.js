// Inverse of the clockwise CSS rotation. Zoom and pan are already reflected
// in the transformed overlay's DOM bounding rectangle.
export function imagePoint(clientX,clientY,rect,rotation=0){
  const u=(clientX-rect.left)/rect.width,v=(clientY-rect.top)/rect.height;
  switch(((rotation%360)+360)%360){
    case 90:return [v,1-u];
    case 180:return [1-u,1-v];
    case 270:return [1-v,u];
    default:return [u,v];
  }
}
export function viewZoom(value){return Math.min(4,Math.max(1,value));}
