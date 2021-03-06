var Bomberman = Bomberman || {};

Bomberman.MultiplayerGame = function(){};

//object created for namespace purposes
var mpg = {
	keyboard: {},
	map: {
		initialBombRange: 1,
		bombCounter: 0
	},
	defaultVelocity: 130,
	sendInterval: 20, //in milliseconds

	num: 0,
	aliveNum: 0,
	tempNum: 0,
	gameOverState: false,
	winner: 0
};

//information (mainly about sprites) for the 4 players in the game defined clockwise
//starting from the upper left corner
var characterSprites = [
	{
		up0: "blue_bomberman_up0.png", up1: "blue_bomberman_up1.png", up2: "blue_bomberman_up2.png",
		down0: "blue_bomberman_down0.png", down1: "blue_bomberman_down1.png", down2: "blue_bomberman_down2.png",
		right0: "blue_bomberman_right0.png", right1: "blue_bomberman_right1.png", right2: "blue_bomberman_right2.png",
		left0: "blue_bomberman_left0.png", left1: "blue_bomberman_left1.png", left2: "blue_bomberman_left2.png",
		initialStandingFrame: "blue_bomberman_right0.png",
		initialOrientation: "right"
	},
	{
		up0: "black_bomberman_up0.png", up1: "black_bomberman_up1.png", up2: "black_bomberman_up2.png",
		down0: "black_bomberman_down0.png", down1: "black_bomberman_down1.png", down2: "black_bomberman_down2.png",
		right0: "black_bomberman_right0.png", right1: "black_bomberman_right1.png", right2: "black_bomberman_right2.png",
		left0: "black_bomberman_left0.png", left1: "black_bomberman_left1.png", left2: "black_bomberman_left2.png",
		initialStandingFrame: "black_bomberman_left0.png",
		initialOrientation: "left"
	},
	{
		up0: "red_bomberman_up0.png", up1: "red_bomberman_up1.png", up2: "red_bomberman_up2.png",
		down0: "red_bomberman_down0.png", down1: "red_bomberman_down1.png", down2: "red_bomberman_down2.png",
		right0: "red_bomberman_right0.png", right1: "red_bomberman_right1.png", right2: "red_bomberman_right2.png",
		left0: "red_bomberman_left0.png", left1: "red_bomberman_left1.png", left2: "red_bomberman_left2.png",
		initialStandingFrame: "red_bomberman_left0.png",
		initialOrientation: "left"
	},
	{
		up0: "white_bomberman_up0.png", up1: "white_bomberman_up1.png", up2: "white_bomberman_up2.png",
		down0: "white_bomberman_down0.png", down1: "white_bomberman_down1.png", down2: "white_bomberman_down2.png",
		right0: "white_bomberman_right0.png", right1: "white_bomberman_right1.png", right2: "white_bomberman_right2.png",
		left0: "white_bomberman_left0.png", left1: "white_bomberman_left1.png", left2: "white_bomberman_left2.png",
		initialStandingFrame: "white_bomberman_right0.png",
		initialOrientation: "right"
	}
];

Bomberman.MultiplayerGame.prototype = {

	create: function() {

  		//set up the keyboard
  		mpg.keyboard.cursors = this.game.input.keyboard.createCursorKeys();
  		mpg.keyboard.alt = this.game.input.keyboard.addKey(Phaser.Keyboard.ALT);

  		//score table
		var scoreTable;
		var graphics;

  		//generate map
		this.generateMap();

		//register callbacks fucntions in the socket
		socket.on('receive game loop update data', this.storeLastUpdatePackaged);		
		socket.on('bomb dropped', this.handleBombDroppedFromServer.bind(this));
		socket.on('player disconnected', this.handlePlayerDisconnection.bind(this));

	},

	generateMap: function() {
		var audio = new Audio('Client/assets/music/Bomberman Theme.mp3');
		audio.play();

		//create map as a bidimensional array
		mpg.map.offsetX = 100;
		mpg.map.offsetY = 50;
		mpg.map.terrainBlockSize = 35;
		mpg.map.playerBlockSize = 20;
		mpg.map.board = Utils.create_2D_array(mpg.map.width, mpg.map.height);	
		mpg.nextSendTime = mpg.sendInterval;
		mpg.initialTime = this.game.time.now;

		// Player 1 Score
		graphics1 = this.game.add.graphics(650, 40);
    	graphics1.lineStyle(2, 0x000000, 1);
    	graphics1.drawRect(0, 0, 300, 30);

		scoreTable1 = this.game.add.text(660, 40);
		scoreTable1.font = "Carter One";
		scoreTable1.fill = "blue";
		scoreTable1.fontSize = 30;

		// Player 2 Score
		graphics2 = this.game.add.graphics(650, 40 + 31);
    	graphics2.lineStyle(2, 0x000000, 1);
    	graphics2.drawRect(0, 0, 300, 30);

		scoreTable2 = this.game.add.text(660, 40 + 31);
		scoreTable2.font = "Carter One";
		scoreTable2.fill = "blue";
		scoreTable2.fontSize = 30;

		// Player 3 Score
		graphics3 = this.game.add.graphics(650, 40 + 2*31);
    	graphics3.lineStyle(2, 0x000000, 1);
    	graphics3.drawRect(0, 0, 300, 30);

		scoreTable3 = this.game.add.text(660, 40 + 2*31);
		scoreTable3.font = "Carter One";
		scoreTable3.fill = "blue";
		scoreTable3.fontSize = 30;

		// Player 4 Score
		graphics4 = this.game.add.graphics(650, 40 + 3*31);
    	graphics4.lineStyle(2, 0x000000, 1);
    	graphics4.drawRect(0, 0, 300, 30);

		scoreTable4 = this.game.add.text(660, 40 + 3*31);
		scoreTable4.font = "Carter One";
		scoreTable4.fill = "blue";
		scoreTable4.fontSize = 30;

		///////////////////////////
		////  CREATING PLAYERS ////
		///////////////////////////
		for(var i = 0; i < 4; ++i) {

			var player = mpg.players[i];

			if(player == null)
				continue;

			mpg.aliveNum++;
			
			///set initial velocity
			player.vel = mpg.defaultVelocity;
			//set initial orientation
			player.orientation = characterSprites[i].initialOrientation;
			player.alive = true;
			mpg.myPlayer.alive = true;
			player.score = 0;
			mpg.myPlayer.score = 0;

			//computing initial coordinates
			if(i == 0) { //upper left
				player.x = mpg.map.offsetX + mpg.map.terrainBlockSize;
				player.y = mpg.map.offsetY + mpg.map.terrainBlockSize;		

			} else if(i == 1) { //upper right
				player.x = mpg.map.offsetX + mpg.map.terrainBlockSize * (mpg.map.width-2);
				player.y = mpg.map.offsetY + mpg.map.terrainBlockSize;		

			} else if(i == 2) { //lower right
				player.x = mpg.map.offsetX + mpg.map.terrainBlockSize * (mpg.map.width-2);
				player.y = mpg.map.offsetY + mpg.map.terrainBlockSize * (mpg.map.height-2);		

			} else { //lower left
				player.x = mpg.map.offsetX + mpg.map.terrainBlockSize;
				player.y = mpg.map.offsetY + mpg.map.terrainBlockSize * (mpg.map.height-2);		

			}

			//creating the sprite
			player.sprite = this.game.add.sprite(player.x,player.y, 'global_spritesheet');	

			//movement animations
			player.sprite.animations.add('down',[
				characterSprites[i].down1,
				characterSprites[i].down2
				],8,true);
			player.sprite.animations.add('up',[
				characterSprites[i].up1,
				characterSprites[i].up2
				],8,true);
			player.sprite.animations.add('right',[
				characterSprites[i].right1,
				characterSprites[i].right2
				],8,true);
			player.sprite.animations.add('left',[
				characterSprites[i].left1,
				characterSprites[i].left2
				],8,true);	

			//storing the default standing position frame 
			player.standingFrame = characterSprites[i].initialStandingFrame;
			player.standingLeft = characterSprites[i].left0;
			player.standingRight = characterSprites[i].right0;
			player.standingUp = characterSprites[i].up0;
			player.standingDown = characterSprites[i].down0;
			player.sprite.frameName = player.standingFrame;

			// scaling the srpite to fit inside a block of the board
			Utils.updateFrameDimensions(player,this.game.cache);
			player.sprite.anchor.x = 0.5;
			player.sprite.anchor.y = 0.5;
			player.sprite.scale.set( mpg.map.playerBlockSize / player.frameWidth,
											  mpg.map.playerBlockSize / player.frameHeight);

			//enabling physics
			this.game.physics.arcade.enable(player.sprite);
		}		


		///////////////////////////////////////////////
		//// CREATING STATIC ELEMENTS ON THE BOARD ////
		///////////////////////////////////////////////

		//define rock blocks group
		mpg.map.rockBlocks = this.game.add.group();
		mpg.map.rockBlocks.enableBody = true;
		mpg.map.rockBlocks.physicsBodyType = Phaser.Physics.ARCADE;

		//define grass blocks group
		mpg.map.grassBlocks = this.game.add.group();
		mpg.map.grassBlocks.enableBody = true;
		mpg.map.grassBlocks.physicsBodyType = Phaser.Physics.ARCADE;

		//define bombs group
		mpg.map.bombs = this.game.add.group();
		mpg.map.bombs.enableBody = true;
		mpg.map.bombs.physicsBodyType = Phaser.Physics.ARCADE;

		//define powerups group
		mpg.map.powerups = this.game.add.group();
		mpg.map.powerups.enableBody = true;
		mpg.map.powerups.physicsBodyType = Phaser.Physics.ARCADE;

		//define explosions group
		mpg.map.explosions = this.game.add.group();
		mpg.map.explosions.enableBody = true;
		mpg.map.explosions.physicsBodyType = Phaser.Physics.ARCADE;

		//define enemies group
		mpg.map.enemies = this.game.add.group();
		mpg.map.enemies.enableBody = true;
		mpg.map.enemies.physicsBodyType = Phaser.Physics.ARCADE;

		//place the rocks and the grass on the map
		var rockBlock;
		var grassBlock;
		var x;
		var y;

		//first, we retrieve the dimensions of the sprites stored in the global atlas
		//to rescale them in order to fit in a cell/block of the board
		var rockFrameDimensions = Utils.getFrameDimensions("rock.png",this.game.cache);
		var grassFrameDimensions = Utils.getFrameDimensions("Grass.png",this.game.cache);

		//we compute the transformation scales
		var rockScaleX = mpg.map.terrainBlockSize / rockFrameDimensions.width;
		var rockScaleY = mpg.map.terrainBlockSize / rockFrameDimensions.height;
		var grassScaleX = mpg.map.terrainBlockSize / grassFrameDimensions.width;
		var grassScaleY = mpg.map.terrainBlockSize / grassFrameDimensions.height;

		for(var i = 0; i < mpg.map.width; ++i) {
			for(var j = 0; j <  mpg.map.height; ++j) {
				x = mpg.map.offsetX + i*mpg.map.terrainBlockSize;
				y = mpg.map.offsetY + j*mpg.map.terrainBlockSize;
				if(i == 0 || i == mpg.map.width -1 || j ==0 || j == mpg.map.height -1
				  || (i%2 == 0 && j%2 == 0)) {

					rockBlock = mpg.map.rockBlocks.create(x,y,'global_spritesheet');
					rockBlock.frameName = 'rock.png';
					rockBlock.anchor.x = 0.5;
					rockBlock.anchor.y = 0.5;
					rockBlock.scale.set(rockScaleX,rockScaleY);
					rockBlock.body.immovable = true;
					mpg.map.board[i][j].terrain = TerrainType.ROCK;

				} else if(!Utils.isInRangeOfSomePlayer(x,y, mpg.map.initialBombRange,mpg.players,mpg.map)) {

					grassBlock = mpg.map.grassBlocks.create(x,y,'global_spritesheet');
					grassBlock.frameName = 'Grass.png';
					grassBlock.anchor.x = 0.5;
					grassBlock.anchor.y = 0.5;
					grassBlock.scale.set(grassScaleX,grassScaleY);
					grassBlock.body.immovable = true;
					mpg.map.board[i][j].terrain = TerrainType.GRASS;
					mpg.map.board[i][j].grassBlock = grassBlock;

				} else {

					mpg.map.board[i][j].terrain = TerrainType.EMPTY;

				}
			}
		}	
	},


	update: function() {		

		//check for coordinates updates from the server
		//if (mpg.updateDataQueue.getLength() > 0) {
		if(mpg.lastDataPackage) {
			
			var data = mpg.lastDataPackage;

			mpg.lastDataPackage = null;

			//console.log("from the update loop: we are dequeueing the following data");
			//console.log(data);

			for(var i = 0; i < data.length; ++i) {
				var playerData = data[i];

				if (playerData.playerNum == mpg.myPlayerNumber && playerData.alive && mpg.aliveNum == 1 && !mpg.gameOverState)
				{
					var audio = new Audio('Client/assets/music/P1UP.wav');
					audio.play();

					this.game.add.sprite(0,28, 'you_win');
					mpg.gameOverState = true;
					winner = playerData.playerNum;
				}
				else if (!playerData.alive && mpg.gameOverState && mpg.tempNum == 0)
				{
					var audio = new Audio('Client/assets/music/PLAYER_OUT.wav');
					audio.play();

					this.game.add.sprite(0,28, 'you_lose');
					mpg.tempNum = 1;					
				}

				if (playerData.playerNum == 0)
					scoreTable1.text = "Blue Bomberman: "+ playerData.score;
				if (playerData.playerNum == 1)
					scoreTable2.text = "Grey Bomberman: "+ playerData.score;
				if (playerData.playerNum == 2)
					scoreTable3.text = "Pink Bomberman: "+ playerData.score;
				if (playerData.playerNum == 3)
					scoreTable4.text = "White Bomberman: "+ playerData.score;


				if(playerData.playerNum == mpg.myPlayerNumber) continue; //skip updates for our own player
				
				var player = mpg.players[playerData.playerNum];

				player.sprite.x = playerData.x;
				player.sprite.y = playerData.y;
				player.sprite.body.velocity.x = playerData.velX;
				player.sprite.body.velocity.y = playerData.velY;
				player.orientation = playerData.orientation;
				player.alive = playerData.alive;

				if (player.sprite.body.velocity.x != 0 || player.sprite.body.velocity.y != 0)
				{
					switch(player.orientation)
					{
						case "left": 
							player.sprite.animations.play('left');
							player.standingFrame = player.standingLeft ;
							break;
						case "right":
							player.sprite.animations.play('right');
							player.standingFrame = player.standingRight ;
							break;
						case "up":
							player.sprite.animations.play('up');
							player.standingFrame = player.standingUp ;
							break;
						case "down": 
							player.sprite.animations.play('down');
							player.standingFrame = player.standingDown ;
							break;
					}
				}
				else
				{
					player.sprite.animations.stop();
					player.sprite.frameName = player.standingFrame;
				}
			}
		}	


		//check collisions for our player	
		//against rocks
		this.game.physics.arcade.collide(mpg.myPlayer.sprite, mpg.map.rockBlocks);
		//against grass
		this.game.physics.arcade.collide(mpg.myPlayer.sprite, mpg.map.grassBlocks);			
		
		this.game.physics.arcade.collide(mpg.myPlayer.sprite, mpg.map.bombs);		
//		this.game.physics.arcade.overlap(players[i].sprite, map.powerups, this.handlePowerUps, null, players[i]);
		this.game.physics.arcade.overlap(mpg.myPlayer.sprite, mpg.map.explosions, this.destroyPlayer, null, mpg.myPlayer.sprite);
//		this.game.physics.arcade.overlap(players[i].sprite, map.enemies, this.destroyPlayer, null, players[i]);	
		
		if (mpg.myPlayer.alive)
		{
			mpg.myPlayer.dropBomb = false;

			//handle our player's movement and animations
			mpg.myPlayer.sprite.body.velocity.x = 0;
			mpg.myPlayer.sprite.body.velocity.y = 0;

			if(mpg.keyboard.cursors.left.isDown) {
				mpg.myPlayer.sprite.body.velocity.x = -mpg.myPlayer.vel;
				mpg.myPlayer.standingFrame = mpg.myPlayer.standingLeft ;
				mpg.myPlayer.sprite.animations.play('left');
				mpg.myPlayer.orientation = "left";

			} else if(mpg.keyboard.cursors.right.isDown) {
				mpg.myPlayer.sprite.body.velocity.x = mpg.myPlayer.vel;
				mpg.myPlayer.standingFrame = mpg.myPlayer.standingRight;
				mpg.myPlayer.sprite.animations.play('right');
				mpg.myPlayer.orientation = "right";

			} else if(mpg.keyboard.cursors.up.isDown) {
				mpg.myPlayer.sprite.body.velocity.y = -mpg.myPlayer.vel;
				mpg.myPlayer.standingFrame = mpg.myPlayer.standingUp;
				mpg.myPlayer.sprite.animations.play('up');
				mpg.myPlayer.orientation = "up";

			} else if(mpg.keyboard.cursors.down.isDown) {
				mpg.myPlayer.sprite.body.velocity.y = mpg.myPlayer.vel;
				mpg.myPlayer.standingFrame = mpg.myPlayer.standingDown;
				mpg.myPlayer.sprite.animations.play('down');
				mpg.myPlayer.orientation = "down";

			} else {
				mpg.myPlayer.sprite.animations.stop();
				mpg.myPlayer.sprite.frameName = mpg.myPlayer.standingFrame;
			}
			if(mpg.keyboard.alt.isDown && mpg.map.bombCounter == 0) {
				console.log("MY PLAYER~~~~~~~~~~~");
				var bcoords = Utils.worldCoords2BlockCoords(mpg.myPlayer.sprite.x, mpg.myPlayer.sprite.y,
								mpg.map.height, mpg.map.width, mpg.map);
				var bx = bcoords.x;
				var by = bcoords.y;
				var wcoords = Utils.blockCoords2WorldCoords(bx, by, mpg.map);
				var wx = wcoords.x;
				var wy = wcoords.y;

				if (mpg.map.board[bx][by].hasBomb)
					return;
				mpg.myPlayer.dropBomb = true;
				var audio = new Audio('Client/assets/music/BOM_SET.wav');
				audio.play();
				mpg.map.board[bx][by].hasBomb = true;
				var bomb = new Bomb();

				bomb.explosionFragments = [];
				bomb.bx = bx;
				bomb.by = by;
				bomb.wx = wx;
				bomb.wy = wy;

				bomb.sprite = mpg.map.bombs.create(wx, wy, 'global_spritesheet');
				bomb.sprite.frameName = 'bomb0.png';

				Utils.updateFrameDimensions(bomb,this.game.cache);
				bomb.sprite.anchor.x = 0.5;
				bomb.sprite.anchor.y = 0.5;
				bomb.sprite.scale.set(mpg.map.terrainBlockSize / bomb.frameWidth,
											 mpg.map.terrainBlockSize / bomb.frameHeight);
				bomb.sprite.animations.add('bomb',[
					'bomb0.png',
					'bomb1.png',
					'bomb2.png',
					'bomb3.png'
					],2,false);
				bomb.sprite.animations.play('bomb');

				this.game.physics.arcade.enable(bomb.sprite);
				bomb.sprite.body.immovable = true;

				mpg.map.board[bx][by].bomb = bomb;
				mpg.map.bombCounter = 1;

				this.game.time.events.add(2000,this.explodeBomb,this,bomb, mpg.myPlayerNumber);

				socket.emit("dropped a bomb", {bx: bx, by: by});

			}

			//check if it's time to send our coordinates to the server			
			if(this.game.time.now - mpg.initialTime >= mpg.sendInterval) {
				mpg.mpgInitialTime = this.game.time.now;

				var data = {				
						x: mpg.myPlayer.sprite.x,
						y: mpg.myPlayer.sprite.y,
						velX: mpg.myPlayer.sprite.body.velocity.x,
						velY: mpg.myPlayer.sprite.body.velocity.y,
						orientation: mpg.myPlayer.orientation,
						alive: mpg.myPlayer.alive,
						score: mpg.myPlayer.score
					};
				socket.emit("my coordinates and such", data);
				//console.log("we are sending information to the server");
				//console.log(data);

				for(var i = 0; i < mpg.players.length; ++i) {

					var player = mpg.players[i];
					if(player == null || playerNumber == i)
						continue;

					player.sprite.body.velocity.x = 0;
					player.sprite.body.velocity.y = 0;

				}

			}
		}
		else
		{
			mpg.myPlayer.sprite.destroy();

			//var audio = new Audio('Client/assets/music/PLAYER_OUT.wav');
			//audio.play();
		}
	},
	explodeBomb: function(bomb, playerNum) {

		//add the central explosion fragment at the position of the bomb by default
		this.addNewExplosionFragmentToBomb(bomb,"explosion_center.png",bomb.wx,bomb.wy);

		var bx, by, next_bx, next_by;		
		var frnameMiddle;
		var frnameEnd;
		var maxRangeReached;

		//upwards
		bx = bomb.bx;
		next_bx = bx;
		frnameMiddle = "explosion_up1.png";
		frnameEnd = "explosion_up2.png"
		for(var i = 1; i <= mpg.map.initialBombRange; ++i) {
			by = bomb.by - i;
			next_by = by - 1;
			maxRangeReached = (i == mpg.map.initialBombRange);
			if(this.handleExplosionEffectOnBlock(frnameMiddle,frnameEnd,bomb,bx,by,next_bx,next_by, maxRangeReached, playerNum))
				break;	
		}
		//downwards
		bx = bomb.bx;
		next_bx = bx;
		frnameMiddle = "explosion_down1.png";
		frnameEnd = "explosion_down2.png"
		for(var i = 1; i <= mpg.map.initialBombRange; ++i) {
			by = bomb.by + i;
			next_by = by + 1;
			maxRangeReached = (i == mpg.map.initialBombRange);
			if(this.handleExplosionEffectOnBlock(frnameMiddle,frnameEnd,bomb,bx,by,next_bx,next_by, maxRangeReached, playerNum))
				break;	
		}
		//rightwards
		by = bomb.by;
		next_by = by;
		frnameMiddle = "explosion_right1.png";
		frnameEnd = "explosion_right2.png"
		for(var i = 1; i <= mpg.map.initialBombRange; ++i) {
			bx = bomb.bx + i;
			next_bx = bx + 1;
			maxRangeReached = (i == mpg.map.initialBombRange);
			if(this.handleExplosionEffectOnBlock(frnameMiddle,frnameEnd,bomb,bx,by,next_bx,next_by, maxRangeReached, playerNum))
				break;	
		}
		//leftwards
		by = bomb.by;
		next_by = by;
		frnameMiddle = "explosion_left1.png";
		frnameEnd = "explosion_left2.png"
		for(var i = 1; i <= mpg.map.initialBombRange; ++i) {
			bx = bomb.bx - i;
			next_bx = bx - 1;
			maxRangeReached = (i == mpg.map.initialBombRange);
			if(this.handleExplosionEffectOnBlock(frnameMiddle,frnameEnd,bomb,bx,by,next_bx,next_by, maxRangeReached, playerNum))
				break;	
		}

		this.game.time.events.add(500,this.removeExplosion,this,bomb);

		//remove bomb from the place
		bomb.sprite.destroy();
		mpg.map.board[bomb.bx][bomb.by].hasBomb = false;

		var audio = new Audio('Client/assets/music/BOM_11_S.wav');
		audio.play();
		mpg.map.bombCounter = 0;
	},
	handleExplosionEffectOnBlock: function(frnameMiddle, frnameEnd, bomb, bx, by, next_bx, next_by, maxRangeReached, playerNum) {

		//check that we are not beyond the allowed dimensions
		if(Utils.outsideBoard(bx,by))
			return true;

		var cell = mpg.map.board[bx][by];

		var output = true;

		if(cell.terrain == TerrainType.GRASS) {
			if(playerNum == mpg.myPlayerNumber)
			{
				mpg.myPlayer.score++;
			}
			//mpg.Players[playerNum].score++;

			//destroy the grass block
			cell.grassBlock.destroy();
			cell.terrain = TerrainType.EMPTY;

			/*
			numberOfGrass--;
			var randomValue = Math.floor(Math.random()*10);
			if (randomValue == 0 && switchCount == 0 && numberOfGrass != 0)
			{
				var wcoords = Utils.blockCoords2WorldCoords(bx, by, mpg.map);
				var powerup = mpg.map.powerups.create(wcoords.x, wcoords.y, "global_spritesheet");
				mpg.map.board[bx][by].hasPowerUp = true;
				mpg.map.board[bx][by].powerup = powerup;
				var randomPowerUp = powerups[Math.floor(Math.random() * powerups.length)];
				powerup.frameName = randomPowerUp;
				powerup.anchor.x = 0.5;
				powerup.anchor.y = 0.5;
				var dim = Utils.getFrameDimensions(randomPowerUp, this.game.cache);
				var scaleX = mpg.map.terrainBlockSize / dim.width;
				var scaleY = mpg.map.terrainBlockSize / dim.height;
				powerup.scale.set(scaleX,scaleY);
				switchCount = 1;	
			}

			var randomValue2 = Math.floor(Math.random()*10);
			if (((randomValue2 == 0 && doorCount == 0) || (numberOfGrass == 0 && doorCount == 0)) && switchCount == 0)
			{
				door.blockCoords.x = bx;
				door.blockCoords.y = by;

				var wcoords = Utils.blockCoords2WorldCoords(bx, by, mpg.map);
				/////////////////////
				// CREATING A DOOR //
				/////////////////////

				//computing initial coordinates
				door.x = wcoords.x;
				door.y = wcoords.y;

				//creating the sprite
				door.sprite = this.game.add.sprite(door.x,door.y, 'Door_spritesheet');	

				//movement animations
				door.sprite.animations.add('move',[
					'door1.png',
					'door2.png',
					'door3.png',
					'door4.png',
					],8,true);

				door.sprite.frameName = 'door1.png';

				var frame = this.game.cache.getFrameData("Door_spritesheet").getFrameByName(door.sprite.frameName);

				door.frameWidth = frame.width;
				door.frameHeight = frame.height;

				door.sprite.anchor.x = 0.5;
				door.sprite.anchor.y = 0.5;
				door.sprite.scale.set( (mpg.map.playerBlockSize / door.frameWidth)*1.5,
												  (mpg.map.playerBlockSize / door.frameHeight)*1.5);
				//enabling physics		
				this.game.physics.arcade.enable(door.sprite);

				doorCount = 1;

				door.sprite.animations.play('move');
			}
			switchCount = 0;
*/
			output = false;

		} else if(cell.terrain == TerrainType.EMPTY) {
			if (mpg.map.board[bx][by].hasPowerUp)
			{
				mpg.map.board[bx][by].powerup.destroy();
				mpg.map.board[bx][by].hasPowerUp = false;
			}
			output = false;
		}

		if(output == false) {

			//add a new explosion fragment in the place.
			//first, check the lookahead coords to know whether
			//we have to use the middle sprite or the end sprite
			var frameName;
			if( Utils.outsideBoard(next_bx,next_by) || maxRangeReached)
				frameName = frnameEnd;
			else {
				var nextTerrain = mpg.map.board[next_bx][next_by].terrain;
				if(nextTerrain == TerrainType.EMPTY || nextTerrain == TerrainType.GRASS)
					frameName = frnameMiddle;
				else 
					frameName = frnameEnd;
			}

			var wcoords = Utils.blockCoords2WorldCoords(bx,by, mpg.map);
			this.addNewExplosionFragmentToBomb(bomb,frameName,wcoords.x,wcoords.y);
		}

		return output;
	},
	addNewExplosionFragmentToBomb: function(bomb,frameName,x,y){
		var explosion;

		explosion = mpg.map.explosions.create(x, y, 'global_spritesheet');
		explosion.frameName =  frameName;

		explosion.anchor.x = 0.5;
		explosion.anchor.y = 0.5;

		var dims = Utils.getFrameDimensions(explosion.frameName,this.game.cache);
		var scaleX = mpg.map.terrainBlockSize / dims.width;
		var scaleY = mpg.map.terrainBlockSize / dims.height;
		explosion.scale.set(scaleX,scaleY);	

		explosion.body.immovable = true;
		this.game.physics.arcade.enable(explosion);

		//add the explosion to the explosion fragments of the source bomb
		bomb.explosionFragments.push(explosion);
	},

	removeExplosion: function(bomb) {
		for(var i = 0; i < bomb.explosionFragments.length; ++i) {
			bomb.explosionFragments[i].destroy();
		}
		bomb.explosionFragments.length = 0;
	},

	destroyPlayer: function() {
		mpg.myPlayer.alive = false;
		if(this.game.time.now - mpg.initialTime >= mpg.nextSendTime) {
			mpg.nextSendTime += mpg.sendInterval;
			var data = {				
				x: mpg.myPlayer.sprite.x,
				y: mpg.myPlayer.sprite.y,
				velX: mpg.myPlayer.sprite.body.velocity.x,
				velY: mpg.myPlayer.sprite.body.velocity.y,
				orientation: mpg.myPlayer.orientation,
				dropBomb: mpg.myPlayer.dropBomb,
				alive: mpg.myPlayer.alive,
				score: mpg.myPlayer.score
			};
			socket.emit("my coordinates and such", data);
		}
	},

	storeLastUpdatePackaged: function(data) {
		//console.log("from storeLastUpdatePackaged: we are receiving following data from the server");
		//console.log(data);

		mpg.lastDataPackage = data;
		//mpg.updateDataQueue.enqueue(data);
		//console.log(mpg.updateDataQueue.getLength());

	},

	handleBombDroppedFromServer: function(data) {
		// this is the expected format {bx: bx, by: by} 

		this.dropBombAtBlock(data.bx, data.by);

	},

	dropBombAtBlock: function(bx, by) {

		var wcoords = Utils.blockCoords2WorldCoords(bx, by, mpg.map);
		var wx = wcoords.x;
		var wy = wcoords.y;

		if (mpg.map.board[bx][by].hasBomb)
			return;
		var audio = new Audio('Client/assets/music/BOM_SET.wav');
		audio.play();
		mpg.map.board[bx][by].hasBomb = true;
		var bomb = new Bomb();

		bomb.explosionFragments = [];
		bomb.bx = bx;
		bomb.by = by;
		bomb.wx = wx;
		bomb.wy = wy;

		bomb.sprite = mpg.map.bombs.create(wx, wy, 'global_spritesheet');
		bomb.sprite.frameName = 'bomb0.png';

		Utils.updateFrameDimensions(bomb,this.game.cache);
		bomb.sprite.anchor.x = 0.5;
		bomb.sprite.anchor.y = 0.5;
		bomb.sprite.scale.set(mpg.map.terrainBlockSize / bomb.frameWidth,
									 mpg.map.terrainBlockSize / bomb.frameHeight);
		bomb.sprite.animations.add('bomb',[
			'bomb0.png',
			'bomb1.png',
			'bomb2.png',
			'bomb3.png'
			],2,false);
		bomb.sprite.animations.play('bomb');

		this.game.physics.arcade.enable(bomb.sprite);
		bomb.sprite.body.immovable = true;

		mpg.map.board[bx][by].bomb = bomb;

		this.game.time.events.add(2000,this.explodeBomb,this,bomb);
	},

	handlePlayerDisconnection: function(data) {

		console.log("===> handlePlayerDisconnection()");

		console.log(data);

		mpg.players[data.playerNumber].sprite.destroy();
		mpg.players[data.playerNumber] = null;
		mpg.aliveNum--;
	}

};
