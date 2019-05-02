var app;
var stage;
var frame;

var width =256;
var height = 256;

var b = new Bump(PIXI);

var foreground = new PIXI.Container();
var reflections = new PIXI.Container();


foreground.zIndex = 10;
reflections.zIndex = 2;



PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

window.onload = function(){
  frame = document.querySelector("#game-frame");
  app = new PIXI.Application(
    { 
      width:frame.clientWidth,
      height:frame.clientWidth*(height/width),
      autoResize:true,
      resolution: window.devicePixelRatio,
      SCALE_MODE: PIXI.SCALE_MODES.NEAREST
    }
  );

  frame.appendChild(app.view);
  
  stage = app.stage;
  stage.addChild(foreground);
  stage.addChild(reflections);
  stage.updateLayersOrder = function () {
    stage.children.sort(function(a,b) {
        a.zIndex = a.zIndex || 0;
        b.zIndex = b.zIndex || 0;
        return b.zIndex - a.zIndex
    });
  };
  stage.updateLayersOrder();


  window.addEventListener("resize",this.resize);
  this.resize();
  setTimeout(function(){
    this.resize();
  },50);

  var music = PIXI.sound.Sound.from({
    url: 'sounds/untitled.wav',
    volume:0.002
  });
  music.play();

  var explorer_s = sheetToSprites("images/explorer.png",24,24,4,1);
  var explorer = new Entity("explorer");
  explorer.SetSprite(explorer_s[0]);
  explorer.position.set(50,50);
  explorer.behaviors.push(new Player(explorer,1));
  explorer.behaviors.push(new BasicWalker(explorer,"images/explorer.png",24,24,2,2,0.2));
  explorer.behaviors.push(new Reflection(explorer));


  var xs = [49,122,125,40,190];
  var ys = [15,252,125,155,25];
  var trees = sheetToSprites("images/trees.png",64,64,5,1);
  for(var i = 0; i < xs.length; i++){
    var tree = new Entity("tree");
    tree.SetSprite(trees[i]);
    tree.position.set(xs[i],ys[i]);
    tree.behaviors.push(new Reflection(tree));
  }
}
function resize(){
  var parent = app.view.parentNode;
  var w = parent.clientWidth;
  var h = parent.clientWidth*(height/width);
  stage.scale.x = w/width;
  stage.scale.y = w/width;

  app.renderer.resize(w,h);
}

var left = keyboard("ArrowLeft");
var right = keyboard("ArrowRight");
var up = keyboard("ArrowUp");
var down = keyboard("ArrowDown");


const DT = 1/30;
setInterval(function(){
  UPDATE();
},DT*1000);

function UPDATE(){
  for(var i = 0; i < entities.length; i++){
    entities[i].Update();
  }
  foreground.updateLayersOrder();
}
foreground.updateLayersOrder = function () {
  foreground.children.sort(function(a,b) {
      a.z = a.z || 0;
      b.z = b.z || 0;
      return b.z - a.z;
  });
};

var entities = [];
function Entity(name){
  this.position = new PIXI.Point(0,0);
  this.sprite = new PIXI.Sprite(null);
  this.sprite.anchor.set(0.5,1);
  foreground.addChild(this.sprite);

  this.sprite.z = 0;

  this.behaviors = [];

  this.SetSprite = function(tex){
    this.sprite.texture = tex;
  }

  this.Update = function(){
    
    for(var i = 0; i < this.behaviors.length; i++){
      this.behaviors[i].Update();
    }

    this.sprite.position.set(Math.round(this.position.x),Math.round(this.position.y));
    this.sprite.z = -this.sprite.position.y;
  }

  entities.push(this);
}

function Reflection(parent){
  this.reflection = new PIXI.Sprite(null);
  this.reflection.anchor.set(0.5,1);
  this.reflection.scale.y *= -1;
  this.reflection.tint = 0x999999;
  this.reflection.z = 0;
  foreground.addChild(this.reflection);
  
  this.Update = function(){
    this.reflection.position = parent.sprite.position;
    this.reflection.texture = parent.sprite.texture;
    this.reflection.scale.x = parent.sprite.scale.x;
    this.reflection.z = -parent.sprite.position.y;
  }

}

function Player(parent,speed){
  this.speed = speed;
  this.Update = function(){
    if(left.isDown){
      parent.position.x-=this.speed;
    }
    if(right.isDown){
      parent.position.x+=this.speed;
    }
    if(up.isDown){
      parent.position.y-=this.speed;
    }
    if(down.isDown){
      parent.position.y += this.speed;
    }

  }
}

function BasicWalker(parent,path_to_sheet,width,height,downframes=2,upframes=2,frametime=0.2){
  this.all_sprites = sheetToSprites(path_to_sheet,width,height,downframes+upframes,1);
  this.timer = 0;
  this.prevpos = new PIXI.Point(parent.position.x,parent.position.y);
  this.frame = 0;
  this.downs = [];
  this.ups = [];
  this.frametime = frametime;
  
  this.facing_up = false;
  this.facing_right = false;

  for(var i = 0; i < upframes+downframes; i++){
    if(i < downframes){
      this.downs.push(this.all_sprites[i]);
    }
    else{
      this.ups.push(this.all_sprites[i]);
    }
  }
  this.Update = function(){
    var walking = this.prevpos.x != parent.position.x || this.prevpos.y != parent.position.y;
    if(parent.position.x > this.prevpos.x)
      this.facing_right = true;
    if(parent.position.x < this.prevpos.x)
      this.facing_right = false;
    if(parent.position.y > this.prevpos.y)
      this.facing_up = false;
    if(parent.position.y < this.prevpos.y)
      this.facing_up = true;
    
    this.prevpos.x = parent.position.x; this.prevpos.y = parent.position.y;

    

    var current = this.downs;
    if(this.facing_up){
      current = this.ups;
    }

    if(this.facing_right){
      parent.sprite.scale.x = -1;
    }
    else{
      parent.sprite.scale.x = 1;
    }

    if(!walking){
      this.timer = 0;
      this.frame = 0;
    }
    else{
      this.timer -= DT;
      if(this.timer <= 0){
        this.timer += this.frametime;
        this.frame++;
        if(this.frame >= current.length){
          this.frame -= current.length;
        }
        
      }
    }
    parent.SetSprite(current[this.frame]);
  }
}

function sheetToSprites(path, width, height,nw,nh){
  var sheet = PIXI.BaseTexture.fromImage(path);
  var sprites = [];
  for(var y = 0; y < nh; y++){
    for(var x = 0; x < nw; x ++){
      var sprite = new PIXI.Texture(sheet, new PIXI.Rectangle(x*width,y*height,width,height));
      if(sprite != null){
        sprites.push(sprite);
      }
    }
  }
  return sprites;
}
















function keyboard(value) {
  let key = {};
  key.value = value;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = event => {
    if (event.key === key.value) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };

  //The `upHandler`
  key.upHandler = event => {
    if (event.key === key.value) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
      event.preventDefault();
    }
  };

  //Attach event listeners
  const downListener = key.downHandler.bind(key);
  const upListener = key.upHandler.bind(key);
  
  window.addEventListener(
    "keydown", downListener, false
  );
  window.addEventListener(
    "keyup", upListener, false
  );
  
  // Detach event listeners
  key.unsubscribe = () => {
    window.removeEventListener("keydown", downListener);
    window.removeEventListener("keyup", upListener);
  };
  
  return key;
}