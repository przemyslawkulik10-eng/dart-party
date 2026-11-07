// A stream can stay connected while Safari suspends delivery of video frames.
// Calibration belongs to the stream; readiness belongs to fresh frame delivery.
export class CameraFrameGate {
  constructor(staleMs=4000){this.staleMs=staleMs;this.reset();}
  reset(time=null,now=0){this.time=time;this.lastFrame=now;this.ready=false;}
  sample({time,now,hidden=false,muted=false}){
    if(hidden||muted||!Number.isFinite(time)){this.reset(time,now);return false;}
    if(this.time!==null&&time!==this.time){this.lastFrame=now;this.ready=true;}
    this.time=time;
    if(now-this.lastFrame>this.staleMs)this.ready=false;
    return this.ready;
  }
}
