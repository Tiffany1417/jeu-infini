(function () {
  // Définir les variables.
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var player, score, stop, ticker;
  var scoretotal = 0;
  var ground = [], water = [], enemies = [], environment = [];

  // Variables des platformes.
  var platformHeight, platformLength, gapLength;
  var platformWidth = 32;
  var platformBase = canvas.height - platformWidth;  // rangée du bas
  var platformSpacer = 64;

  

  
    //Prendre un nombre au hasard entre les plages.
   
  function rand(low, high) {
    return Math.floor( Math.random() * (high - low + 1) + low );
  }

  function bound(num, low, high) {
    return Math.max( Math.min(num, high), low);
  }

  
    //Télécharger toutes les images.
   
  var assetLoader = (function() {
    // Dictionnaire d'images.
    this.imgs        = {
      'fond1'         : 'imgs/fond1.png',
      'nuages'        : 'imgs/nuages.png',
      'paysage1'      : 'imgs/paysage1.png',
      'paysage2'      : 'imgs/paysage2.png',
      'sol'           : 'imgs/sol.png',
      'water'         : 'imgs/eau.png',
      'sol1'          : 'imgs/sol_haut_1.png',
      'sol2'          : 'imgs/sol_haut_2.png',
      'pont'          : 'imgs/pont.png',
      'plante'        : 'imgs/plante.png',
      'buisson1'      : 'imgs/buisson1.png',
      'buisson2'      : 'imgs/buisson2.png',
      'sol_bord'      : 'imgs/sol_bord.png',
      'pics'          : 'imgs/pics.png',
      'plateforme'    : 'imgs/plateforme.png',
      'ennemi'         : 'imgs/ennemi.png'
    };

    var assetsLoaded = 0;                                // Combien d'actifs ont été téléchargés.
    var numImgs      = Object.keys(this.imgs).length;    // Nombre total d'actifs d'images.
    this.totalAssest = numImgs;                          // Nombre total d'actifs.

    
      //S'assurer que tous les actifs sont téléchargés avant de les utiliser.
     
    function assetLoaded(dic, name) {
      // Ne pas compter les actifs déjà chargés.
      if (this[dic][name].status !== 'loading') {
        return;
      }

      this[dic][name].status = 'loaded';
      assetsLoaded++;

      // Rappel terminé.
      if (assetsLoaded === this.totalAssest && typeof this.finished === 'function') {
        this.finished();
      }
    }

    
      //Créer des actifs, définir des rappels pour le chargement des actifs, définir la source des actifs.
     
    this.downloadAll = function() {
      var _this = this;
      var src;

      // Chargement des images.
      for (var img in this.imgs) {
        if (this.imgs.hasOwnProperty(img)) {
          src = this.imgs[img];

          // Créer une fermeture pour la liaison d'événement.
          (function(_this, img) {
            _this.imgs[img] = new Image();
            _this.imgs[img].status = 'loading';
            _this.imgs[img].name = img;
            _this.imgs[img].onload = function() { assetLoaded.call(_this, 'imgs', img) };
            _this.imgs[img].src = src;
          })(_this, img);
        }
      }
    }

    return {
      imgs: this.imgs,
      totalAssest: this.totalAssest,
      downloadAll: this.downloadAll
    };
  })();

  assetLoader.finished = function() {
    startGame();
  }

  
    //Créer un Spritesheet.
   
  function SpriteSheet(path, frameWidth, frameHeight) {
    this.image = new Image();
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;

    // Calculer le nombre de frames (images) dans une rangée après le chargement de l'image.
    var self = this;
    this.image.onload = function() {
      self.framesPerRow = Math.floor(self.image.width / self.frameWidth);
    };

    this.image.src = path;
  }

  
   //Créer l'animation d'un spritesheet.
   
  function Animation(spritesheet, frameSpeed, startFrame, endFrame) {

    var animationSequence = [];  // Tableau contenant l'ordre de l'animation.
    var currentFrame = 0;        // Le cadre actuel à dessiner.
    var counter = 0;             // Garder une trace de la fréquence de frames.

    // Plage de début et de fin pour les frames.
    for (var frameNumber = startFrame; frameNumber <= endFrame; frameNumber++)
      animationSequence.push(frameNumber);

    
      //Mettre à jour l'animation.
     
    this.update = function() {

      // Mettre à jour à la frame suivante si c'est le moment.
      if (counter == (frameSpeed - 1))
        currentFrame = (currentFrame + 1) % animationSequence.length;

      // Mettre à jour le compteur.
      counter = (counter + 1) % frameSpeed;
    };

    
     //Dessiner la frame actuelle.
     
    this.draw = function(x, y) {
      // Obtenir la rangée et le col de la frame.
      var row = Math.floor(animationSequence[currentFrame] / spritesheet.framesPerRow);
      var col = Math.floor(animationSequence[currentFrame] % spritesheet.framesPerRow);

      ctx.drawImage(
        spritesheet.image,
        col * spritesheet.frameWidth, row * spritesheet.frameHeight,
        spritesheet.frameWidth, spritesheet.frameHeight,
        x, y,
        spritesheet.frameWidth, spritesheet.frameHeight);
    };
  }

  
    //Créer un fond de parallax.
   
  var background = (function() {
    var nuages   = {};
    var paysage1 = {};
    var paysage2 = {};

    
      //Dessine les fonds à l'écran à différentes vitesses.
     
    this.draw = function() {
      ctx.drawImage(assetLoader.imgs.fond1, 0, 0);

      // Fond "pan" (?).
      nuages.x -= nuages.speed;
      paysage1.x -= paysage1.speed;
      paysage2.x -= paysage2.speed;

      // Dessiner des images côte à côte en boucle.
      ctx.drawImage(assetLoader.imgs.nuages, nuages.x, nuages.y);
      ctx.drawImage(assetLoader.imgs.nuages, nuages.x + canvas.width, nuages.y);

      ctx.drawImage(assetLoader.imgs.paysage1, paysage1.x, paysage1.y);
      ctx.drawImage(assetLoader.imgs.paysage1, paysage1.x + canvas.width, paysage1.y);

      ctx.drawImage(assetLoader.imgs.paysage2, paysage2.x, paysage2.y);
      ctx.drawImage(assetLoader.imgs.paysage2, paysage2.x + canvas.width, paysage2.y);

      // Si l'image fait défiler l'écran, réinitialiser.
      if (nuages.x + assetLoader.imgs.nuages.width <= 0)
        nuages.x = 0;
      if (paysage1.x + assetLoader.imgs.paysage1.width <= 0)
        paysage1.x = 0;
      if (paysage2.x + assetLoader.imgs.paysage2.width <= 0)
        paysage2.x = 0;
    };

    
    //Réinitialiser l'arrière-plan à zéro.
     
    this.reset = function()  {
      nuages.x = 0;
      nuages.y = 0;
      nuages.speed = 0.2;

      paysage1.x = 0;
      paysage1.y = 0;
      paysage1.speed = 0.4;

      paysage2.x = 0;
      paysage2.y = 0;
      paysage2.speed = 0.6;
    }

    return {
      draw: this.draw,
      reset: this.reset
    };
  })();


  function Vector(x, y, dx, dy) {
    // Position.
    this.x = x || 0;
    this.y = y || 0;
    // Direction.
    this.dx = dx || 0;
    this.dy = dy || 0;
  }

  
   // Avancer la position des vecteurs avec dx, dy.
  
  Vector.prototype.advance = function() {
    this.x += this.dx;
    this.y += this.dy;
  };

  
   //Obtenir la distance minimale entre deux vecteurs.
   
  Vector.prototype.minDist = function(vec) {
    var minDist = Infinity;
    var max     = Math.max( Math.abs(this.dx), Math.abs(this.dy),
                            Math.abs(vec.dx ), Math.abs(vec.dy ) );
    var slice   = 1 / max;

    var x, y, distSquared;

    // Obtenir le milieu de chaque vecteur.
    var vec1 = {}, vec2 = {};
    vec1.x = this.x + this.width/2;
    vec1.y = this.y + this.height/2;
    vec2.x = vec.x + vec.width/2;
    vec2.y = vec.y + vec.height/2;
    for (var percent = 0; percent < 1; percent += slice) {
      x = (vec1.x + this.dx * percent) - (vec2.x + vec.dx * percent);
      y = (vec1.y + this.dy * percent) - (vec2.y + vec.dy * percent);
      distSquared = x * x + y * y;

      minDist = Math.min(minDist, distSquared);
    }

    return Math.sqrt(minDist);
  };

  
   //L'objet joueur.
   
  var player = (function(player) {
    // Ajouter des propriétés directement à l'objet importé du joueur.
    player.width     = 60;
    player.height    = 96;
    player.speed     = 6;

    // Sauter.
    player.gravity   = 1;
    player.dy        = 0;
    player.jumpDy    = -10;
    player.isFalling = false;
    player.isJumping = false;

    // Spritesheets.
    player.sheet     = new SpriteSheet('imgs/personnage.png', player.width, player.height);
    player.walkAnim  = new Animation(player.sheet, 4, 0, 15);
    player.jumpAnim  = new Animation(player.sheet, 4, 15, 15);
    player.fallAnim  = new Animation(player.sheet, 4, 11, 11);
    player.anim      = player.walkAnim;

    Vector.call(player, 0, 0, 0, player.dy);

    var jumpCounter = 0;  // Combien de temps le bouton de saut peut être enfoncé.

    
     //Mettre à jour la position et l'animation du joueur.
     
    player.update = function() {

      // Sauter si pas en train de sauter ou de tomber.
      if (KEY_STATUS.space && player.dy === 0 && !player.isJumping) {
        player.isJumping = true;
        player.dy = player.jumpDy;
        jumpCounter = 12;
      }

      // Sauter plus haut si la barre d'espace est continuellement appuyée.
      if (KEY_STATUS.space && jumpCounter) {
        player.dy = player.jumpDy;
      }

      jumpCounter = Math.max(jumpCounter-1, 0);

      this.advance();

      // Ajouter de la gravité.
      if (player.isFalling || player.isJumping) {
        player.dy += player.gravity;
      }

      // Changer l'animation en cas de chute.
      if (player.dy > 0) {
        player.anim = player.fallAnim;
      }
      // Changer l'animation en cas de saut.
      else if (player.dy < 0) {
        player.anim = player.jumpAnim;
      }
      else {
        player.anim = player.walkAnim;
      }

      player.anim.update();
    };

    
     //Dessiner le joueur à sa position actuelle.
     
    player.draw = function() {
      player.anim.draw(player.x, player.y);
    };

    
     //Réinitialiser la position du joueur.
     
    player.reset = function() {
      player.x = 64;
      player.y = 250;
    };

    return player;
  })(Object.create(Vector.prototype));

 //Sprites ennemis

  function Sprite(x, y, type) {
    this.x      = x;
    this.y      = y;
    this.width  = platformWidth;
    this.height = platformWidth;
    this.type   = type;
    Vector.call(this, x, y, 0, 0);

    
     //Mettre à jour la position du sprite à la vitesse du joueur.
     
    this.update = function() {
      this.dx = -player.speed;
      this.advance();
    };

    
     //Dessiner le sprite à sa position actuelle.

    this.draw = function() {
      ctx.save();
      ctx.translate(0.5,0.5);
      ctx.drawImage(assetLoader.imgs[this.type], this.x, this.y);
      ctx.restore();
    };
  }
  Sprite.prototype = Object.create(Vector.prototype);

  
   //Obtenir le type d'une plate-forme en fonction de sa hauteur.
   
  function getType() {
    var type;
    switch (platformHeight) {
      case 0:
      case 1:
        type = Math.random() > 0.5 ? 'sol1' : 'sol2';
        break;
      case 2:
        type = 'sol';
        break;
      case 3:
        type = 'pont';
        break;
      case 4:
        type = 'plateforme';
        break;
    }
    if (platformLength === 1 && platformHeight < 3 && rand(0, 3) === 0) {
      type = 'sol_bord';
    }

    return type;
  }

  
   //Mettre à jour toutes les positions au sol et dessiner. Vérifier également la collision avec le joueur.
   
  function updateGround() {
    // Sol animé.
    player.isFalling = true;
    for (var i = 0; i < ground.length; i++) {
      ground[i].update();
      ground[i].draw();

      // Empêcher le joueur de tomber lorsqu'il se pose sur une plate-forme.
      var angle;
      if (player.minDist(ground[i]) <= player.height/2 + platformWidth/2 &&
          (angle = Math.atan2(player.y - ground[i].y, player.x - ground[i].x) * 180/Math.PI) > -130 &&
          angle < -50) {
        player.isJumping = false;
        player.isFalling = false;
        player.y = ground[i].y - player.height + 5;
        player.dy = 0;
      }
    }

    // Enlever le sol qui est sorti de l'écran.
    if (ground[0] && ground[0].x < -platformWidth) {
      ground.splice(0, 1);
    }
  }

  
   //Mettre à jour la position de l'eau et dessiner.
   
  function updateWater() {
    // Animer l'eau.
    for (var i = 0; i < water.length; i++) {
      water[i].update();
      water[i].draw();
    }

    // Enlever l'eau qui est sortie de l'écran.
    if (water[0] && water[0].x < -platformWidth) {
      var w = water.splice(0, 1)[0];
      w.x = water[water.length-1].x + platformWidth;
      water.push(w);
    }
  }

  
    //Mettre à jour toutes les positions de l'environnement et dessiner.

  function updateEnvironment() {
    // Animer l'environnement.
    for (var i = 0; i < environment.length; i++) {
      environment[i].update();
      environment[i].draw();
    }

    // Enlever l'environnement qui est sorti de l'écran.
    if (environment[0] && environment[0].x < -platformWidth) {
      environment.splice(0, 1);
    }
  }

  
   //Mettre à jour la position de tous les ennemis et dessiner. Vérifier également la collision avec le joueur.
   
  function updateEnemies() {
    // Animer les ennemis.
    for (var i = 0; i < enemies.length; i++) {
      enemies[i].update();
      enemies[i].draw();

      // Le joueur a couru sur l'ennemi.
      if (player.minDist(enemies[i]) <= player.width - platformWidth/2) {
        gameOver();
      }
    }

    // Enlever les ennemis qui ont quitté l'écran.
    if (enemies[0] && enemies[0].x < -platformWidth) {
      enemies.splice(0, 1);
    }
  }

  
    //Mettre à jour la position du joueur et dessiner.
   
  function updatePlayer() {
    player.update();
    player.draw();

    // Game over.
    if (player.y + player.height >= canvas.height) {
      gameOver();
    }
  }

  
    //Générer de nouveaux sprites hors de l'écran.
   
  function spawnSprites() {
    // Augmenter le score.
    score++;
    scoretotal++;

    // D'abord créer un écart.
    if (gapLength > 0) {
      gapLength--;
    }
    // Puis créer un sol.
    else if (platformLength > 0) {
      var type = getType();

      ground.push(new Sprite(
        canvas.width + platformWidth % player.speed,
        platformBase - platformHeight * platformSpacer,
        type
      ));
      platformLength--;

      // Ajouter des sprites d'environnement aléatoires.
      spawnEnvironmentSprites();

      // Ajouter des ennemis aléatoires.
      spawnEnemySprites();
    }
    // Recommencer.
    else {
      // Augmenter la longueur de l'écart à chaque augmentation de vitesse de 4.
      gapLength = rand(player.speed - 2, player.speed);
      // N'autoriser qu'un terrain à augmenter de 1.
      platformHeight = bound(rand(0, platformHeight + rand(0, 2)), 0, 4);
      platformLength = rand(Math.floor(player.speed/2), player.speed * 4);
    }
  }

  
   //Générer de nouveaux sprites d'environnement hors écran.
   
  function spawnEnvironmentSprites() {
    if (score > 40 && rand(0, 20) === 0 && platformHeight < 3) {
      if (Math.random() > 0.5) {
        environment.push(new Sprite(
          canvas.width + platformWidth % player.speed,
          platformBase - platformHeight * platformSpacer - platformWidth,
          'plante'
        ));
      }
      else if (platformLength > 2) {
        environment.push(new Sprite(
          canvas.width + platformWidth % player.speed,
          platformBase - platformHeight * platformSpacer - platformWidth,
          'buisson1'
        ));
        environment.push(new Sprite(
          canvas.width + platformWidth % player.speed + platformWidth,
          platformBase - platformHeight * platformSpacer - platformWidth,
          'buisson2'
        ));
      }
    }
  }

  
    //Générer de nouveaux sprites ennemis hors de l'écran.
   
  function spawnEnemySprites() {
    if (score > 100 && Math.random() > 0.96 && enemies.length < 3 && platformLength > 5 &&
        (enemies.length ? canvas.width - enemies[enemies.length-1].x >= platformWidth * 3 ||
         canvas.width - enemies[enemies.length-1].x < platformWidth : true)) {
      enemies.push(new Sprite(
        canvas.width + platformWidth % player.speed,
        platformBase - platformHeight * platformSpacer - platformWidth,
        Math.random() > 0.5 ? 'pics' : 'ennemi'
      ));
    }
  }

  
    //Boucle de jeu.
   
  function animate() {
    if (!stop) {
      requestAnimFrame( animate );
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      background.draw();

      // Mettre à jour des entités.
      updateWater();
      updateEnvironment();
      updatePlayer();
      updateGround();
      updateEnemies();

      // Dessiner le score.
      ctx.fillText('Score: ' + score + 'm', canvas.width - 140, 30);
     

      // Générer un nouveau sprite.
      if (ticker % Math.floor(platformWidth / player.speed) === 0) {
        spawnSprites();
      }

      // N'augmenter la vitesse du joueur que lorsque le joueur saute.

      if (ticker > (Math.floor(platformWidth / player.speed) * player.speed * 20) && player.dy !== 0) {
        player.speed = bound(++player.speed, 0, 15);
        player.walkAnim.frameSpeed = Math.floor(platformWidth / player.speed) - 1;

        // Réinitialiser le compteur.
        ticker = 0;

        // Créer une plate-forme pour combler le vide créé par l'augmentation de la vitesse du joueur.
        if (gapLength === 0) {
          var type = getType();
          ground.push(new Sprite(
            canvas.width + platformWidth % player.speed,
            platformBase - platformHeight * platformSpacer,
            type
          ));
          platformLength--;
        }
      }

      ticker++;
    }
  }

  
    //Garder une trace des événements de la barre d'espace.
   
  var KEY_CODES = {
    32: 'space'
  };
  var KEY_STATUS = {};
  for (var code in KEY_CODES) {
    if (KEY_CODES.hasOwnProperty(code)) {
       KEY_STATUS[KEY_CODES[code]] = false;
    }
  }
  document.onkeydown = function(e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
      e.preventDefault();
      KEY_STATUS[KEY_CODES[keyCode]] = true;
    }
  };
  document.onkeyup = function(e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
      e.preventDefault();
      KEY_STATUS[KEY_CODES[keyCode]] = false;
    }
  };

  
   //Demander une animation Polyfill.
   
  var requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(callback, element){
              window.setTimeout(callback, 1000 / 60);
            };
  })();

  
    //Commencer le jeu - réinitialiser toutes les variables et entités, générer le sol et l'eau.
   
  function startGame() {
    document.getElementById('game-over').style.display = 'none';
    ground = [];
    water = [];
    environment = [];
    enemies = [];
    player.reset();
    ticker = 0;
    stop = false;
    score = 0;
    platformHeight = 2;
    platformLength = 15;
    gapLength = 0;

    ctx.font = '16px arial, sans-serif';

    for (var i = 0; i < 30; i++) {
      ground.push(new Sprite(i * (platformWidth-3), platformBase - platformHeight * platformSpacer, 'sol'));
    }

    for (i = 0; i < canvas.width / 32 + 2; i++) {
      water.push(new Sprite(i * platformWidth, platformBase, 'water'));
    }

    background.reset();

    animate();
  }

  
   //Terminer le jeu et redémarrer.
   
  function gameOver() {
    stop = true;

    //Afficher score et score total.
   
    alert('Félicitations ! Vous avez couru '+score+' m ! Votre score total est de '+ scoretotal +' m!');

    document.getElementById('game-over').style.display = 'block';

    //Flou progressif de l'image.
                  
    document.getElementById('floue').style.filter = 'blur('+999999/scoretotal+'px)';
                  
  };

  //Redémarrer
    
  document.getElementById('restart').addEventListener('click', startGame);

  assetLoader.downloadAll();


  
})();



