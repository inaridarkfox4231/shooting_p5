// 四角形を動かす
// HPが設定されていて攻撃を受けると減る、消えたりする

var player; // プレイヤーのスプライト情報
var modeImages = [];
var modeImage;

var square; // squareのスプライト情報（こうするらしい）
var squareGroup;
var squareImages = [];
var squareImage;

var attack; // 攻撃のスプライト情報
var attackGroup;
var attackImages = [];
var attackImage;

var rdm; // 攻撃用の乱数

var fire; // fireのスプライト情報（こうする？）
var fireGroup;
var fireImages = [];
var fireImage;
var usePower = [5, 10, 15, 20, 20];
var firePenetrate = [false, true, false, false, true];

var item;
var itemGroup;
var itemImages = []; // アイテムの画像
var itemimage;

var hp_max = 100; // プレイヤーのHPの最大値
var pw_max = 100; // プレイヤーのパワーの最大値
var usableMode = 3; // 使えるモードの数（最初は1で最終的に5まで増える）

// state定数
const TITLE = 0;
const SELECT = 1;
const PLAY = 2;
const PAUSE = 3;
const GAMEOVER = 4;
const CLEAR = 5;

// e.keyCodeで参照するkeyCode定数
const K_ENTER = 13;
const K_RIGHT = 39;
const K_LEFT = 37;
const K_UP = 38;
const K_DOWN = 40;

// e,charCodeでテンキーの2, 6, 8, 4を上下左右キーの代わりにする。
const K_RIGHT_T = 54;
const K_LEFT_T = 52;
const K_UP_T = 56;
const K_DOWN_T = 50;

// e.charCodeで参照するkeyCode定数
const K_SPACE = 32;
const K_A = 97;
const K_B = 98;
const K_C = 99;
const K_D = 100;
const K_T = 116;
const K_Z = 122;

//　state変数、カーソル変数、stage変数
var state = TITLE;
var currentIndex = 0;
var stage = 0; // ステージ番号

// enemyOrderなど
var enemyOrder = []; // 敵が出てくる順番
var itemOrder = []; // アイテムが出てくる順番
var currentExistEnemy = 0; // 敵の存数。4がMAXでそれ以上増やせない。
var norma = -1; // 何匹倒せばいいか。たとえばstage1なら100.
var normaArray = [-1, 100, 0, 0, 0] // ここを参照する
var appearCount = 60; // 1秒ごとに出現する感じ。curEEがnormaよりも4よりも小さいと減っていく。0になると出現。

// タイトルとセレクト画面の画像
var titleImg;
var selectImg;
var gameoverImg;
var continueImg;
var clearImg;

// ショットフラグ→面倒なので廃止
//var shotflag = false; // クリックでフラグが立つ、30フレーム以内に離すと発射。
//var shottimer = 0; // クリック時にカウントを開始、30以内なら発射。

// 回す用
var i, j, k, tmp;

// 画像のpreload
function preloadImage(){
  titleImg = loadImage("./assets/title.png");
  selectImg = loadImage("./assets/select.png");
  gameoverImg = loadImage("./assets/gameover.png");
  continueImg = loadImage("./assets/continue.png");
  clearImg = loadImage("./assets/clear.png");
  for(i = 0; i < 5; i++){
    squareImage = loadImage("./assets/color_" + i + ".png");
    squareImages.push(squareImage);
  }
  for(i = 0; i < 4; i++){
    attackImage = loadImage("./assets/attack_" + i + ".png");
    attackImages.push(attackImage);
  }
  for(i = 0; i < 2; i++){
    itemImage = loadImage("./assets/item_" + i + ".png");
    itemImages.push(itemImage);
  }
  for(i = 0; i < 5; i++){
    fireImage = loadImage("./assets/fire_" + i + ".png");
    fireImages.push(fireImage);
  }
  for(i = 0; i < 5; i++){
    modeImage = loadImage("./assets/mode_" + i + ".png");
    modeImages.push(modeImage);
  }
  mode_0_Img = loadImage("./assets/mode_0.png");
  mode_1_Img = loadImage("./assets/mode_1.png");
}

function preload(){
  // 画像とか音とか入れることになったらって思うから分けるか
  preloadImage();
}

function setup(){
  createCanvas(640, 480);
  squareGroup = new Group();
  fireGroup = new Group();
  attackGroup = new Group();
  itemGroup = new Group();
  player = createSprite(width / 2, 460, 20, 20);
  for(i = 0; i < 5; i++){
    player.addImage('mode_' + i, modeImages[i]);
  }
  player.mode = 0; // 攻撃モード
  player.hp = hp_max; // プレイヤーのHP（ダメージを受けると減る、アイテムで回復）
  player.pw = pw_max; // プレイヤーのパワー（ショットを撃つと減る、時間経過で回復）
}

function draw(){
  clear();
  background(220);
  // ここでも位置修正するようにした
  if(state === PLAY){
    checkCollide();
    if(mouseIsPressed){ move(); }
    moveEnemy(); // 敵の動きを記述
    createAttacks(); // 攻撃を繰り出させる（ここでダメージ受ける）
    update(); // 毎ターン行う各種処理（パワーの回復など）
  }
  if(state === PLAY || state === GAMEOVER || state === CLEAR){
    drawGauges();
    drawSprites();
  }
  drawText(); // テキスト描画
}

// 文字関係
function drawText(){
  if(state === TITLE){
    image(titleImg, 50, 50);
  }else if(state === SELECT){
    image(selectImg, 50, 50);
    fill(255);
    rect(20, 60 + 40 * currentIndex, 20, 20);
  }else if(state === GAMEOVER){
    image(gameoverImg, 100, 100);
    image(continueImg, 100, 180);
    fill(255);
    rect(70, 190 + 40 * currentIndex, 20, 20);
  }else if(state === CLEAR){
    image(clearImg, 100, 100);
  }
}

// 衝突処理（こっちの攻撃、向こうの攻撃）
function checkCollide(){
  // こっちの攻撃の衝突判定
  if(fireGroup.size() !== 0){
    for(i = 0; i < fireGroup.size(); i++){
      fire = fireGroup[i];
      if(fire.position.y < 0){ // 画面外の炎を消す
        fire.remove();
        continue;
      }
      // 3WAY弾の軌道を変える処理
      if(fire.kind === 2 && !(fire.moveflag) && fire.position.y < 400){
        fire.setVelocity(0, -5);
        fire.moveflag === true;
      }
      for(j = 0; j < squareGroup.size(); j++){
        if(fire.collide(squareGroup[j])){
          if(vanish(fire, squareGroup[j])){
            break; // 弾が消える場合はそこで処理を抜ける
          }
        }
      }
    }
  }
  // 向こうの攻撃の衝突判定
  if(attackGroup.size() !== 0){
    for(i = 0; i < attackGroup.size(); i++){
      if(attackGroup[i].position.y > height){
        attackGroup[i].remove(); // 画面外に出たら消滅
        continue;
      }
      if(attackGroup[i].collide(player)){
        player.hp -= attackGroup[i].dmg;
        attackGroup[i].remove();
        if(player.hp < 0){ player.hp = 0; break; }
      }
    }
  }
  // アイテムの取得判定
  if(itemGroup.size() !== 0){
    for(i = 0; i < itemGroup.size(); i++){
      if(itemGroup[i].position.y > height){ // 画面外に出たアイテムは排除
        itemGroup[i].remove();
        continue;
      }
      if(itemGroup[i].collide(player)){
        console.log("GET!!");
        itemGetEvent(itemGroup[i].kind); // アイテムゲットイベント
        itemGroup[i].remove();
      }
    }
  }
}

function vanish(f, s){
  // 敵を倒す（fがfireでsがsquare）
  s.hp -= f.dmg;
  if(s.hp > 0){ f.remove(); return true; } // 倒せなかったとき
  else{
    // 倒せたとき（倒れるときにアイテムを落とす）（その敵の場所に発生させる）
    if(!(itemOrder[100 - norma] < 0)){
      makeItem(s.position.x, s.position.y, itemOrder[100 - norma]);
    }
    s.remove();
    currentExistEnemy -= 1; // 敵を倒したので減らす
    norma -= 1; // ノルマも減らさないとね
    if(!f.penetrate){ // 貫通しない場合
      f.remove(); return true;
    }
  }
  return false; // 貫通する場合
}

// アイテムをゲットした時のイベント
function itemGetEvent(kind){
  if(kind === 0){ // ハート1（HP20回復）
    player.hp = min(player.hp + 10, hp_max);
  }else if(kind === 1){ // スター1（POW50回復）
    player.pw = min(player.pw + 50, pw_max);
  }
}

// 動く（マウス押さえたままでも動くように関数化）
function move(){
  var new_x = mouseX;
  if(new_x < 25){ new_x = 25; }
  if(new_x > 615){ new_x = 615; }
  player.position.x = new_x;
}

// 敵の動き
function moveEnemy(){
  squareGroup.forEach(function(s){
    if(s.kind === 0){
      s.position.x = s.pivot_x + 30 * sin(s.phase + frameCount * PI / 60);
    }else if(s.kind === 1){
      s.position.y = s.pivot_y + 30 * sin(s.phase + frameCount * PI / 60);
    }else if(s.kind === 2){
      s.position.x = s.pivot_x + 30 * cos(s.phase + frameCount * PI / 120);
      s.position.y = s.pivot_y + 30 * sin(s.phase + frameCount * PI / 120);
    }else if(s.kind === 3){
      s.position.x = s.pivot_x + 50 * sin(s.phase + frameCount * PI / 120);
      s.position.y = s.pivot_y + 30 * sin(s.phase + frameCount * PI / 60);
    }
  })
}

// 攻撃生成
function createAttacks(){
  squareGroup.forEach(function(s){
    rdm = Math.floor(random(0, 200));
    if(s.kind === 0 && rdm < 5){
      createAttack(s.position.x, s.position.y + s.height, 0);
    }else if(s.kind === 1 && rdm < 2){
      createAttack(s.position.x, s.position.y + s.height, 1);
    }else if(s.kind === 2 && rdm < 3){
      createAttack(s.position.x, s.position.y + s.height, 2);
    }else if(s.kind === 3 && rdm < 2){
      createAttack(s.position.x, s.position.y + s.height, 3);
    }
  })
}

// 攻撃を作る
function createAttack(x, y, kind){
  if(kind === 0){
    attack = createSprite(x, y, 20, 20);
    attack.addImage(attackImages[0]);
    attack.setVelocity(0, 5);
    attack.dmg = 3;
    attack.addToGroup(attackGroup);
  }else if(kind === 1){
    attack = createSprite(x, y, 20, 20);
    attack.addImage(attackImages[1]);
    attack.setVelocity(0, 10);
    attack.dmg = 5;
    attack.addToGroup(attackGroup);
  }else if(kind === 2){
    for(i = 2; i < 5; i++){
      attack = createSprite(x, y, 20, 20);
      attack.addImage(attackImages[2]);
      attack.setVelocity(5 * cos(i * PI / 6), 5 * sin(i * PI / 6));
      attack.dmg = 2;
      attack.addToGroup(attackGroup);
    }
  }else if(kind === 3){
    // ホーミング連続で2発（はやいのとおそいの）（attraction使うと出来そう）
    for(i = 1; i < 3; i++){
      attack = createSprite(x, y, 20, 20);
      attack.addImage(attackImages[3]);
      attack.attractionPoint(3 * i, player.position.x, player.position.y);
      attack.dmg = 2;
      attack.addToGroup(attackGroup);
    }
  }
}

// PLAYの間の各種更新処理
function update(){
  // 毎秒6ずつパワー回復（アイテムで早くなったりしたら面白い？）
  if(player.pw < 100 && frameCount % 10 === 0){ player.pw += 1; }
  if(currentExistEnemy < 4 && currentExistEnemy < norma){
    appearCount -= 1;
    if(appearCount === 0){
      console.log("敵が出現");
      makeSquare(random(80, 320), random(80, 320), enemyOrder[100 - norma]);
      appearCount = 60;
    }
  }
  if(player.hp === 0){
    console.log("GAMEOVER");
    state = GAMEOVER; return;
  }
  if(norma === 0){
    state = CLEAR; // クリアしたら、
  }
}

// ゲージの表示
function drawGauges(){
  drawGauge(20, 20, 255, 201, 14, pw_max, player.pw);
  drawGauge(20, 35, 63, 72, 204, hp_max, player.hp);
}

// 各種ゲージの表示（場所と色と長さを指定する）
function drawGauge(x, y, r, g, b, length_max, length){
  if(length <= 0){ length = 0; }
  fill(255);
  rect(x - 1, y - 1, length_max + 1, 11);
  fill(r, g, b);
  rect(x, y, length, 10);
}

 // マウス移動で反応（押したままの移動だと発動しない）
function mouseMoved(){ if(state === PLAY){ move(); } }

// こっちの攻撃パート。ここでゲージが減る。
function mouseReleased(){
  if(state === PLAY){
    // モードによるショットの違い(3WAYなどはここに複数記述する)
    if(player.pw < usePower[player.mode]){ return; } // パワー不足
    player.pw -= usePower[player.mode]; // パワー消費
    if(player.mode === 0){
      createSingleFire(0, 1, 0, -5, 0)
    }else if(player.mode === 1){
      createSingleFire(1, 3, 0, -3, 0);
    }else if(player.mode === 2){
      // ここに記述
      createSingleFire(2, 2, 0, -5, 0);
      createSingleFire(2, 2, -5, -5, 1);
      createSingleFire(2, 2, 5, -5, 2);
    }else if(player.mode === 3){
      createSingleFire(3, 4, 0, -3, 0); // ぶつかると消滅して4方向に発射
    }else if(player.mode === 4){
      createSingleFire(4, 4, 0, 0, 0); // 直進
      createSingleFire(4, 2, 0, 0, 1); // 正弦波を描きながら進む（2つ）
      createSingleFire(4, 2, 0, 0, 2);
    }
  }
}

// ファイア生成部分を関数として分離（単独ショット）（他に3WAY:3方向同時発射、LASER:一定時間棒状の攻撃範囲、を考え中）
// fireworks:発射したのち破裂して周囲に攻撃、とか面白そう。敵に当たるとそこで破裂してどかーんみたいな。
function createSingleFire(kind, dmg, vx, vy, index){
  //if(player.pw < pw){ return; } // パワーが足りないと不発
  //player.pw -= pw;
  fire = createSprite(player.position.x, 432, 15, 15);
  fire.addImage(fireImages[kind]); // 画像
  fire.kind = kind;
  fire.penetrate = firePenetrate[kind]; // 貫通属性
  fire.dmg = dmg; // dmg
  fire.index = index; // 複数発射する場合の処理用
  fire.moveflag = false; // 軌道変更の際に使うフラグ
  fire.setVelocity(vx, vy); // 速度
  fire.addToGroup(fireGroup);
}

// キーを押すと正方形が大量発生
function keyTyped(e){
  //console.log(e);
  if(state === TITLE){
    if(e.keyCode === K_ENTER){
      state = SELECT; return;
    }
  }else if(state === SELECT){
    if(e.keyCode === K_DOWN || e.charCode === K_DOWN_T){
      currentIndex = (currentIndex + 1) % 5; return;
    }else if(e.keyCode === K_UP || e.charCode === K_UP_T){
      currentIndex = (currentIndex + 4) % 5; return;
    }else if(e.keyCode === K_ENTER){
      selectEvent(); return;
    }
    return;
  }else if(state === PLAY){
    //console.log(e); // keyCodeで反応するキーとcharCodeで反応するキーがある
    if(e.charCode === K_T){
      // デバッグコード
      console.log("write debug code");
      //setEnemyOrder(1);
      //console.log(enemyOrder);
      console.log("norma " + norma);
      console.log("currentExistEnemy " + currentExistEnemy);
      console.log("fireGroup.size " + fireGroup.size());
      console.log("attackGroup.size " + attackGroup.size());
      return;
    }else if(e.charCode === K_Z){
      // モードチェンジ！
      player.mode = (player.mode + 1) % usableMode;
      player.changeImage('mode_' + player.mode);
    }
  }else if(state === GAMEOVER){
    if(e.keyCode === K_DOWN || e.keyCode === K_UP || e.charCode === K_DOWN_T || e.charCode === K_UP_T){
      currentIndex = (currentIndex + 1) % 2;
    }else if(e.keyCode === K_ENTER){
      selectEvent();
    }
    return;
  }else if(state === CLEAR){
    if(e.keyCode === K_ENTER){
      selectEvent();
    }
  }
}

// 選択の結果によるイベント
function selectEvent(){
  if(state === SELECT){
    if(currentIndex === 0){
      state = TITLE; return;
    }else{
      // とりあえず2～4はエラーにしといて
      if(currentIndex > 1){
        console.log("Under construction.");
        return;
      }
      state = PLAY;
      stage = currentIndex;
      currentIndex = 0; // インデックスリセット
      stageSetup();
      return;
    }
  }else if(state === GAMEOVER){
    stageReset();
    if(currentIndex === 0){
      state = PLAY; // stageはそのまま
      stageSetup();
      return;
    }else{
      state = TITLE;
      currentIndex = 0;
      return;
    }
  }else if(state === CLEAR){
    stageReset();
    state = TITLE;
  }
}

// ゲームオーバー後のリセット処理
function stageReset(){
  // グループを初期化してpwとhpを戻す
  attackGroup.removeSprites();
  squareGroup.removeSprites();
  fireGroup.removeSprites();
  player.pw = pw_max;
  player.hp = hp_max;
}

// 多分この後〇とか△とか作る（？）
function makeEnemy(x, y, kind){
  if(kind < 5){
    makeSquare(x, y, kind); return;
  }
}

function makeSquare(x, y, kind){
  square = createSprite(x, y, 20, 20);
  square.addImage(squareImages[kind]);
  square.pivot_x = x;
  square.pivot_y = y;
  square.kind = kind;
  square.phase = Math.floor(random(0, 60));
  if(kind === 0){
    square.hp = 1;
  }else if(kind === 1){
    square.hp = 3;
  }else if(kind === 2){
    square.hp = 5;
  }else if(kind === 3){
    square.hp = 7;
  }
  square.addToGroup(squareGroup);
  currentExistEnemy += 1;
}

// アイテムを発生させる（ゆっくり落ちてくる）
function makeItem(x, y, kind){
  item = createSprite(x, y, 20, 20);
  item.kind = kind;
  item.addImage(itemImages[kind]);
  item.setVelocity(0, 2);
  item.addToGroup(itemGroup);
}

function getShuffled(n){
  // 0, 1, ..., n-1の入れ替えを取得する
  var array = [];
  var shuffled = [];
  for(i = 0; i < n; i++){ array.push(i); }
  for(i = 0; i < n; i++){
    k = Math.floor(random(0, n - 1 - i));
    shuffled.push(array[k]);
    array[k] = array[n - 1 - i];
  }
  return shuffled;
}

// enemyOrderを手に入れるコード
function setEnemyOrder(stageNumber){
  if(stageNumber === 1){
    var pre = [];
    var after = [];
    for(i = 0; i < 40; i++){ pre.push(0); }
    for(i = 0; i < 20; i++){ pre.push(1); }
    for(i = 0; i < 10; i++){ pre.push(2); after.push(0); after.push(1); }
    for(i = 0; i < 5; i++){ after.push(2); after.push(3); }
    var shuffled_pre = getShuffled(70);
    var shuffled_after = getShuffled(30);
    enemyOrder = [];
    for(i = 0; i < 70; i++){ enemyOrder.push(pre[shuffled_pre[i]]); }
    for(i = 0; i < 30; i++){ enemyOrder.push(after[shuffled_after[i]]); }
  }
}

// itemOrderを手に入れるコード
function setItemOrder(stageNumber){
  if(stageNumber === 1){
    var array = [];
    for(i = 0; i < 60; i++){ array.push(-1); }
    for(i = 0; i < 30; i++){ array.push(0); }
    for(i = 0; i < 10; i++){ array.push(1); }
    var shuffled = getShuffled(100);
    itemOrder = [];
    for(i = 0; i < 100; i++){ itemOrder.push(array[shuffled[i]]); }
  }
}

// ステージ選択時のあれこれ
function stageSetup(){
  setEnemyOrder(stage); // enemyOrderの決定
  setItemOrder(stage); // itemOrderの決定
  norma = normaArray[stage];
  currentExistEnemy = 0;
  appearCount = 60;
}
