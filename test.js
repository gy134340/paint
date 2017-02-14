var container, stats, logoTextCanvas;
			var camera, scene, renderer, dirLight, hemiLight;
			var isInteractable = false;		// 全局是否允许交互

			var cubes = [];		// 存储所有小方块

			var mouse = new THREE.Vector2();
			var intersects, intersected = [];
			
			//var controls;

			var windowHalfX = window.innerWidth / 2;
			var windowHalfY = window.innerHeight / 2;
			
			var cx = 1420 , cy = 600;		// cx = camera.z * Math.tan(camera.fov/2)
			var formatFlag = 1;		// 变化的模式
			var xStep;			// 相机每帧移动位置

			// for font
			// var cameraTarget;
			var textMaterial;
			var height = 20, size = 15, hover = 30,
			curveSegments = 4, bevelThickness = 0.1, bevelSize = 1.5,
			bevelEnabled = true, font, fontName = "optimer",
			fontWeight = "regular"; 	// normal bold

			var lipStick = {
				"1": "Ruby Copper",
				"2": "Real Ruby",
				"3": "Bloodstone",
				"4": "Rouge Rum Punch",
				"5": "Murrey",
				"6": "Liaison",
				"7": "First Bite",
				"8": "Toffee Apple",
				"9": "Coral Shore",
				"10": "Burning Up",
				"11": "Crime of Passion",
				"12": "Poppy",
				"13": "Hushed Tones",
				"14": "Sweet Desire",
				"15": "Rose Crush",
				"16": "Red Queen"
			};

			// 存储所有texture的数组，避免卡顿
			var cubeTextures = [];			
			setCubeTextures();
			function setCubeTextures(){
				for(var i = 1; i < 97; i++){
					var texture= 'pink/'+i+'.jpg';
					cubeTextures[i] = new THREE.TextureLoader().load( texture );
				}
			}

			// 添加所有存储子块texture的数组
			var subCubeTextures = [];
			setSubCubeTextures();
			function setSubCubeTextures(){
				for(var i = 1; i < 97; i++){
					var texture= 'pink/'+i+'.jpg';
					subCubeTextures[i] = new THREE.TextureLoader().load( texture );
				}
			}

			// 存储口红material的数组
			var subLipTexture = [];
			setSubLipTexture();
			function setSubLipTexture(){
				for(var i = 1; i < 17; i++){
					var texture= 'img/rouge/'+i+'.jpg';
					subLipTexture[i] = new THREE.TextureLoader().load( texture );
				}
			}

			// 存储二维码
			var qrCodeTexture = [];
			setQRCodeTexture();
			function setQRCodeTexture(){
				for(var i = 1; i <= 192; i++){
					var texture= 'img/qrcode/'+i+'.jpg';
					qrCodeTexture[i] = new THREE.TextureLoader().load( texture );
				}
			}
			// 存储星座
			var starTexture = [];
			setStarTexture();
			function setStarTexture(){
				for(var i = 1; i <= 24; i++){
					var texture= 'img/star/'+ i + '.png';
					starTexture[i] = new THREE.TextureLoader().load(texture);
				}
			}

			// 存储口红icon
			var lipIcon = new THREE.TextureLoader().load('img/icon/lip.png');

			// 整个logo
			var logoTexture = [];		// 页面显示logo在头部20*9区域
			setLogoTexture();
			function setLogoTexture(){
				var img = new Image();
				img.src = 'img/logo.jpg';
				img.onload = function () {
					var xOffset = parseInt(img.naturalWidth / 20);
					var yOffset = parseInt(img.naturalHeight / 9);
					
					for(var j = 8; j >= 0; j--){		// 数据,从相同坐标起点获取
						for(var i = 0; i < 20; i++){
							var canvas = document.createElement('canvas');
							var ctx = canvas.getContext('2d');
							canvas.width = xOffset;	
							canvas.height = yOffset;

							ctx.drawImage(img, xOffset*i, yOffset*j, xOffset, yOffset, 0, 0, xOffset, yOffset);
							var dataURL = canvas.toDataURL("image/jpeg");
							var subImg = new Image();
							subImg.src = dataURL;

							var texture = new THREE.Texture(subImg);
							texture.needsUpdate = true;
							logoTexture.push(texture);
						}
					}

					// 此时初始化
					init();
				};
			}

			// 口红与星座点击
			var detailId = 1; // 区分详情
			var lipCenter = []; // 中间的口红方块
			var clothesAround = []; //四周围绕的衣服方块
			var lipLists = []; // 口红icon, 点击出现口红列表
			var starLists = []; // 星座icon, 点击出现星座列表
			var lipDetails = []; // 口红列表中的单个口红
			var starDetails = [];// 星座列表中的单个星座
			var textDetails = []; // 文字
			var qrDetail = []; // 二维码

			var tmpOffset = 100; // 为居中设定的偏移量, camera移动越慢偏移应越小
			// init();
			// animate();	note: move to detect.js

			function init() {
				container = document.createElement( 'div' );
				document.body.appendChild( container );

				scene = new THREE.Scene();

				camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 15000 );
				camera.position.set( cx, cy, 1200 );
				camera.lookAt(cx, cy, 0);
				// scene.add( camera );
				
				setCubes(576);
			
				/************************ for font ******************************/

				textMaterial = new THREE.MultiMaterial( [
					new THREE.MeshPhongMaterial( { color: 0xbb1928, shading: THREE.FlatShading } ), 
					new THREE.MeshPhongMaterial( { color: 0xbb1928, shading: THREE.SmoothShading } ) 
				] );

				var loader = new THREE.FontLoader();
				loader.load( 'fonts/' + fontName + '_' + fontWeight + '.typeface.json', function ( response ) {
					font = response;
				} );
				
				hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.5 );
				//hemiLight.color.setHSL( 0.6, 1, 0.6 );
				//hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
				hemiLight.position.set( 0, 0, 1 );
				hemiLight.position.multiplyScalar( 500 );
				scene.add( hemiLight );

				dirLight = new THREE.DirectionalLight( 0xcccccc, 0.5 );
				//dirLight.color.setHSL( 0.1, 1, 0.95 );
				dirLight.position.set( 0, 0, 1 );
				dirLight.position.multiplyScalar( 5000 );
				scene.add( dirLight );
				
				renderer = new THREE.WebGLRenderer({ antialias: true });
				renderer.setClearColor( 0xffffff );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				renderer.sortObjects = false;
				container.appendChild( renderer.domElement );

				stats = new Stats();
				container.appendChild( stats.dom );

				// controls = new THREE.TrackballControls( camera, renderer.domElement );
				// controls.rotateSpeed = 0.5;
				document.addEventListener( 'touchstart', onDocumentTouchStart, false );
				document.addEventListener( 'click', onDocumentMouseDown, false );
				window.addEventListener( 'resize', onWindowResize, false );
			}

			function onDocumentTouchStart( event ) {
				event.preventDefault();
				event.clientX = event.touches[0].clientX;
				event.clientY = event.touches[0].clientY;
				onDocumentMouseDown( event );
			}

			function onDocumentMouseDown( event ) {
				event.preventDefault();				
				mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
				mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
				
				var raycaster = new THREE.Raycaster();
				raycaster.setFromCamera( mouse, camera );		
				intersects = raycaster.intersectObjects( scene.children );
				
				if ( intersects.length > 0 && isInteractable == true) {
					var obj  = intersects[0].object;
					var zDepth = 150;
					if(obj.type == 'Mesh' && obj.userData.isProduct && obj.userData.isInteracted == false){		// cube
						// var id = obj.userData.id;
						var lipId = obj.userData.lipId;
						obj.userData.isInteracted = true;

						obj.userData.detailId = detailId; // 点击存储数组的ID
						obj.userData.starId = 1; // 默认第一个星座
						lipCenter[detailId] = obj;
						detailId++;

						var springPosition = getSpringPosition(zDepth, event);
						obj.position = springPosition;
						obj.scale.z = 0.01;
						new TWEEN.Tween( obj.position )
							.to(springPosition, 1500)
						    .easing( TWEEN.Easing.Elastic.Out ).start();

						intersected.push(obj);		// 所有点击的商品

						springSubCubes(lipId, obj, zDepth);
						showText(obj, zDepth);
						springQRCode(obj);
					}else if(obj.type == 'Sprite'){					// sprite
						if (obj.userData.list == "lip" && !lipDetails[obj.userData.detailId]) {
							showLipstickList(obj);
						} else if (obj.userData.list == "star" && !starDetails[obj.userData.detailId]) {
							showStarList(obj);
						} else if(obj.userData.change == "lip" ) {
							changeLipstick(obj);
							changeClothes(obj);
						} else if(obj.userData.change == "star" ) {
							changeStar(obj);
							changeClothes(obj);
						}
					}
				}
			}

			function onWindowResize(){
				windowHalfX = window.innerWidth / 2;
				windowHalfY = window.innerHeight / 2;

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );
			}

			//@todo 调整阈值
			function getSpringPosition(zDepth, event){
				var eventX = event.clientX;
				var winX = window.innerWidth;
				var cameraX = camera.position.x;
				var poiX;		// default

				var xRange = camera.position.z * Math.tan(THREE.Math.degToRad(camera.fov / 2));
				var x0 = cameraX - xRange * 2;
				var x1 = cameraX - xRange;
				var x2 = cameraX;
				var x3 = cameraX + xRange;

//				if(cubeX <= x1){
//					poiX = x0 + xRange / 2;
//					// poiX = x0 + xRange / 5;
//				}else if(cubeX > x1 && cubeX <= x2 ){
//					poiX = x1 + xRange / 2;
//					// poiX = x1 + xRange / 6;
//				}else if(cubeX > x2 && cubeX <= x3){
//					poiX = x2 + xRange / 2;
//					// poiX = x2 + xRange / 6;
//				}else if(cubeX > x3 ){
//					poiX = x3 + xRange / 2;
//					// poiX = x3 + xRange / 9;
//				}
				if(eventX < winX / 4){
					poiX = x0 + xRange / 2 + tmpOffset;// tmpOffset是为居中设定的偏移量, camera移动越慢偏移应越小
				}else if(eventX < winX / 2){
					poiX = x1 + xRange / 2 + tmpOffset;
				}else if(eventX < winX / 4 * 3){
					poiX = x2 + xRange / 2 + tmpOffset;
				}else {
					poiX = x3 + xRange / 2 + (tmpOffset - 10);
				}

				return {
					x:poiX,			// 在效果时间内相机移动距离,根据不同xStep值改变
					y:cy,
					z:zDepth
				}
			}

			function setCubes(amount){
				var geometry = new THREE.BoxGeometry(100, 100, 100);
				// geometry.dynamic = true;

				for (var i = 0; i < amount; i++) {
					var textures = [];

					for(var j = 0; j < 6; j++){
						var rand = Math.ceil(Math.random() * 96);
						textures[j] = cubeTextures[rand];
					}
					
					var materials = [
					    new THREE.MeshPhongMaterial( { map: textures[0] } ), // right
					    new THREE.MeshPhongMaterial( { map: textures[1] } ), // left
					    new THREE.MeshPhongMaterial( { map: textures[2] } ), // top
					    new THREE.MeshPhongMaterial( { map: textures[3] } ), // bottom
					    new THREE.MeshPhongMaterial( { map: textures[4] } ), // back
					    new THREE.MeshPhongMaterial( { map: textures[5] } )  // front
					];
					
					var cubeMaterial = new THREE.MultiMaterial( materials );
					var object = new THREE.Mesh( geometry, cubeMaterial );
					object.userData.id = i;
					object.userData.lipId = Math.ceil(Math.random() * 16);	
					object.userData.originMaterial = cubeMaterial;
					object.userData.isProduct = true;
					object.userData.isInteracted = false;
					cubes.push( object );
					scene.add( object );
				}
				
				initAndCubeFormation();				// 开始 && 进入大的进入效果
			}
			
			// 每个口红详细地搭配
			function springSubCubes(lipId, cube, zDepth){
				var subNumber = 8;
				var x = cube.position.x;
				var y = cube.position.y;
				var geometry = new THREE.BoxGeometry(30, 30, 30);
				var textures = [];
				clothesAround[cube.userData.detailId] = [];

				for(var i = 0; i < subNumber; i++){
					for(var j = 0; j < 6; j++){
						var rand = Math.ceil(Math.random() * 96);
						textures[j] = subCubeTextures[rand];	// @change2 function
					}
					var materials = [
						new THREE.MeshPhongMaterial( { map: textures[0] } ), // right
					    new THREE.MeshPhongMaterial( { map: textures[1] } ), // left
					    new THREE.MeshPhongMaterial( { map: textures[2] } ), // top
					    new THREE.MeshPhongMaterial( { map: textures[3] } ), // bottom
					    new THREE.MeshPhongMaterial( { map: textures[4] } ), // back
					    new THREE.MeshPhongMaterial( { map: textures[5] } )  // front
					];
					
					var subCubeMaterial = new THREE.MultiMaterial( materials );
					var sub = new THREE.Mesh(geometry, subCubeMaterial);
					var degree = i * 45;
					sub.userData.degree = i * 45;
					sub.userData.zDepth = zDepth;
					// sub.userData.id = id;
					sub.position.set(x, y, zDepth);
					sub.userData.detailId = cube.userData.detailId; // detail id
					clothesAround[sub.userData.detailId][i] = sub;
					scene.add( sub );
					tweenCircleSub(cube, degree, sub);
				}

				changeSubMaterial( cube  );
				springLip(cube, zDepth, lipId);
				springStar(cube, zDepth, lipId);
			}	

			// 改变当前选择口红的material
			function changeSubMaterial( cube ) {
				var lipId = cube.userData.lipId;
				var rougeTexure = subLipTexture[lipId];			// fake
				var rougeMaterial = new THREE.MeshPhongMaterial({ map: rougeTexure });
				cube.material = rougeMaterial;
			}

			// lip sprite
			function springLip(cube, z, lipId) {
//				var spriteMapLip = new THREE.TextureLoader().load("img/icon/lip.png");
				var spriteMaterialLip = new THREE.SpriteMaterial({ map:lipIcon});
//				var spriteMaterialLip = new THREE.SpriteMaterial({ map:spriteMapLip});
				var spriteLip = new THREE.Sprite( spriteMaterialLip );
				var updateLip = function(){
					this.position.x = cube.position.x - 40;
					this.position.y = cube.position.y + 50;
					this.position.z = z+5;
				};
				var tweenLip = new TWEEN.Tween(spriteLip).to().onUpdate(updateLip).start();
				spriteLip.scale.x = spriteLip.scale.y = spriteLip.scale.z = 30;
				spriteLip.userData.lipId = lipId;
				// spriteLip.userData.id = cube.userData.id;
				spriteLip.userData.list = "lip";
				spriteLip.userData.detailId = cube.userData.detailId;
				lipLists[cube.userData.detailId] = spriteLip;
				scene.add(spriteLip);		
			}

			// star sprite
			function springStar(cube, z, lipId){
				var spriteMaterialStar = new THREE.SpriteMaterial({ map:starTexture[13]});
				var spriteStar = new THREE.Sprite( spriteMaterialStar );
				var updateStar = function(){
					this.position.x = cube.position.x + 50;
					this.position.y = cube.position.y + 50;
					this.position.z = z + 5;
				};

				var tweenStar = new TWEEN.Tween(spriteStar).to().onUpdate(updateStar).start();
				spriteStar.scale.x = spriteStar.scale.y = spriteStar.scale.z = 30;
				spriteStar.userData.lipId = lipId;
				// spriteStar.userData.id = cube.userData.id;
				spriteStar.userData.starId = 1; // 用于切换星座, 默认1

				spriteStar.userData.list = "star";
				spriteStar.userData.detailId = cube.userData.detailId;
				starLists[cube.userData.detailId] = spriteStar;
				scene.add(spriteStar);
			}
			function springQRCode(obj) { // 弹出二维码 传入的参数为被点击的原始方块,
				var tmpDetailId = obj.userData.detailId;
				var tmpLip = lipCenter[tmpDetailId];
				var picIndex = tmpLip.userData.lipId + 16 * (tmpLip.userData.starId - 1); // 图片名
				var spriteMapQR = qrCodeTexture[picIndex];
				var spriteMaterialQR = new THREE.SpriteMaterial({ map:spriteMapQR});
				var spriteQR = new THREE.Sprite( spriteMaterialQR );
				var updateQR = function(){
					this.position.x = tmpLip.position.x + 95;
					this.position.y = tmpLip.position.y - 10;
					this.position.z = tmpLip.position.z;
				};
				var tweenQR = new TWEEN.Tween(spriteQR).to().onUpdate(updateQR).start();
				spriteQR.scale.x = spriteQR.scale.y = spriteQR.scale.z = 60;

				spriteQR.userData.lipId = tmpLip.lipId ;
				spriteQR.userData.detailId = tmpDetailId;
				qrDetail[tmpDetailId] = spriteQR;
				scene.add(spriteQR);
			}
			// 圆周边上小方块转动
			function tweenCircleSub(cube, degree, sub) {

				var updateCircle = function(){
					var radius = 150;
					var radian = THREE.Math.degToRad( this.degree );
					var zDepth = this.domElement.userData.zDepth
					this.domElement.position.x = cube.position.x + radius * Math.cos(radian);
					this.domElement.position.y = cube.position.y + radius * Math.sin(radian);
					this.domElement.position.z =  zDepth + Math.round(Math.cos(radian * 20) * 5) - 25;

					this.domElement.rotation.x += Math.random() * 0.01;
					this.domElement.rotation.y += Math.random() * 0.01;
					this.domElement.rotation.z += Math.random() * 0.01;
				};

				var elem = {
					degree:degree,
					domElement:sub
				};
				var tween = new TWEEN.Tween(elem)
					.to({degree: degree - 360}, 18000)
					.onUpdate(updateCircle)
					.onComplete(function(){
						this.degree = this.degree + 360;
					});

				tween.chain(tween);
				tween.start();
			}

			// 清除用户点击出来的商品详情objects
			function clearPage(){
				var len = scene.children.length - 1;
				for(var i = len; i >= 0; i--){		// note: put upside down		
					var obj = scene.children[i];
					if(obj.userData && obj.userData.detailId && obj.userData.isProduct === undefined ){		// @todo do more here
						scene.remove(obj);
					}
				}
			}

			// 恢复商品material
			function restoreMaterial(){
				
				for(var i = 0; i < cubes.length; i++){
					var tmpChild = cubes[i];

					if(tmpChild.userData.isInteracted === false){
						// var material = new THREE.MultiMaterial(tmpChild.userData.originMaterial);
						// note: originMaterial is object ,can not change
						tmpChild.material = tmpChild.userData.originMaterial.clone();
				
						// console.log('i', i);
						// console.log('material',i,tmpChild.material);
					}
				}
			}

			function initAndCubeFormation(){
				xStep = 0;

				// 5s, 3s
				flowIn(5000).then(function(){

					return flowOut(3000);
				}).then(function(){

					xStep = 20;
					isInteractable = true;
					restoreMaterial();
					cubeFormation();
				}).catch(function(error){

					console.log('callback error',error);
				});

			}

			function flowIn(time) {
				var separation = 150;		// 四块屏幕大致块数 20*9
				for(var j = 0; j < 9; j++){
					for(var i = 0; i < 64; i++){
						var x = i * separation;
						var y = j * separation;
						var num = i + j * 64;
						if(cubes[num].userData.isInteracted === false){
							if(i < 20){
								var numLogo = i + j * 20;
								cubes[num].position.x = x;
								cubes[num].position.y = 1500;
								cubes[num].position.z = 0;

								var flowTexture = logoTexture[numLogo];
								var flowMaterial = new THREE.MeshPhongMaterial({ map: flowTexture });
								cubes[num].material = flowMaterial;
								new TWEEN.Tween(cubes[num].position)
									.to({x:x,y:y,z:0}, 100 * Math.sqrt(2 * y / 10) + Math.random() * 2000)
									.start();
							}else{
								cubes[num].position.x = x;
								cubes[num].position.y = -600;
								cubes[num].position.z = 0; 
							}
						}else{
							cubes[num].position.x = cubes[num].position.x - 4050;
						}	
					}
				}

				return new Promise(function(resolve,reject){
					setTimeout(function(){
						resolve();
					}, time);
				});	
			}

			function flowOut(time) {
				var separation = 150;
				for(var j = 0; j < 9; j++){
					for(var i = 0; i < 64; i++){
						var x = i * separation;
						var y = j * separation;
						var num = i + j * 64; 

						if(cubes[num].userData.isInteracted === false){
							cubes[num].position.x = x;
						
							if(i < 20){
								new TWEEN.Tween(cubes[num].position)
								.to({x:x,y:-300,z:0}, 2000-100 * Math.sqrt(2 * y / 10) + Math.random() * 2000)
								.start();
							}
						}
					}
				}
				return new Promise(function(resolve,reject){
					setTimeout(function(){
						resolve();
					}, time);
				});	
			}
			
			function cubeFormation(){
				var separation = 150;
				for(var j = 0; j < 9; j++){
					for(var i = 0; i < 64; i++){
						var x = i * separation;
						var y = j * separation;
						var num = j * 64 + i; 
						if(cubes[num].userData.isInteracted === false){
							if(i < 20){
								var materials = [];
								var backTexture = logoTexture[i + j * 20];
								var backMaterial = new THREE.MeshPhongMaterial({map:backTexture});
								
								cubes[num].material = cubes[num].userData.originMaterial.clone();
								cubes[num].material.materials[5] = backMaterial;
							}

							// cubes[num].rotateY(Math.PI);

							new TWEEN.Tween( cubes[num].position )
							.to( {x: x, y: y, z: 0}, Math.random() * 2000 + 2000 )
							.easing( TWEEN.Easing.Exponential.InOut )
							.start();

						}else{
							var xTmp = cubes[num].position.x;
							cubes[num].position.x = xTmp;
							new TWEEN.Tween( cubes[num].position )
								.to({x:xTmp}, 0)
							    .easing( TWEEN.Easing.Elastic.Out ).start();
						}	
					}
				}
			}

			function rotateCubeFormation(time,flag){
				xStep = 0;
				isInteractable = false;
				for(var j = 0; j < 9; j++){
					for(var i = 0; i < 64; i++){
						var num = j * 64 + i;
						if(cubes[num].userData.isInteracted === false){
							if(i < 20){	
								var rotateCube = function(){
									if(this.domElement.rotation.y < Math.PI && this.flag == 0){
										this.domElement.rotation.y = this.domElement.rotation.y + 0.075;
									}else if(this.flag == 1){
										this.domElement.rotation.y = 0;
									}	
								};
								
								new TWEEN.Tween({domElement:cubes[num],flag:flag})
										.to({},time)
										.onUpdate(rotateCube)
										.easing( TWEEN.Easing.Exponential.InOut )
										.start();
							}
						}else{
							if(flag == 0){
								cubes[num].position.x = cubes[num].position.x - 4050;
							}	
						}
						
					}
				}

				return new Promise(function(resolve,reject){
					setTimeout(function(){
						resolve();
					},time);
				});	
			}

			// rouge rouge canvas data
			function getLogoData(){
				var canvas = document.createElement('canvas');
				canvas.width = 90;
				canvas.height = 40;
				canvas.style.zIndex  = 8;
				canvas.style.border  = "1px solid #000";
				canvas.style.position = "absolute";
				canvas.style.left = "200px";
				canvas.style.top = '0px';
				var ctx = canvas.getContext("2d");
				ctx.font = '12px helvetica';
				ctx.fontWeight = 'bold';
				ctx.fillText('Rouge Rouge',10,25);

				var imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
				// console.log('imgData',imgData);
				document.body.appendChild(canvas);
				return imgData;
			}

			// processed text data
			function getTextData(func){
				var imgData = func();
				var data = imgData.data;
				var dt = {
					data:[],
					num:0,
					width:imgData.width,
					height:imgData.height
				};
				var num = 0;
				for(var i = 0; i < data.length; i+=4){
					var tmp = 0;
					if(data[i] || data[i+1] || data[i+2] || data[i+3]){
						tmp = 1;
						num++;
					}

					dt.data.push(tmp);
				}
				dt.num = num;
				console.log('data',dt);
				return dt;
			}

			// 方块不够组成文字，添加额外的方块
			function addExtraCubes(num){

			}

			function textCubesLocation(dt){
				var cWidth = dt.width;
				var cHeight = dt.height;
				var num = dt.num;
				var data = dt.data;
				var xSpace = Math.round( 3000 / cWidth );
				var ySpace = Math.round( 1350 / cHeight );
				var cubeIndex = 0;

				if(cubes.length < num){
					var extra = num - cubes.length;
					addExtraCubes(extra);
				}else{
					for(var j = 0; j < cHeight; j++){
						for(var i = 0; i < cWidth; i++){
							var index = j * cWidth + i;
							if(data[index] === 1){
								var poiX = i * xSpace;
								var poiY = 1350 - j * ySpace;
						
								new TWEEN.Tween( cubes[cubeIndex].position )
								.to( {
									x: poiX,
									Y: poiY,
									z: -200
								}, Math.random() * 500 + 500 )
								.easing( TWEEN.Easing.Exponential.InOut )
								.start(); 

								cubeIndex++;
							}
						}
					}
				}
			}

			function textFormation(time){
				var dt = getTextData(getLogoData);
				cubesLocation(dt);

				return new Promise(function(resolve,reject){
					setTimeout(function(){
						resolve();
					},time);
				});
			}

			function planeFormation(){
				var amountX = 9;
				var amountZ = 64;
				var separation = 150;
				var offsetX = ( ( amountX - 1 ) * separation ) / 2;
				var offsetZ = ( ( amountZ - 1 ) * separation ) / 2;

				for ( var i = 0, len = cubes.length; i < len ; i ++ ) {
					var x = ( i % amountX ) * separation;
					var z = Math.floor( i / amountX ) * separation;
					var y = ( Math.sin( x * 0.5 ) + Math.sin( z * 0.5 ) ) * 200;

					if(cubes[i].userData.isInteracted === false){	

						new TWEEN.Tween( cubes[i].position )
						.to( {
							y: x - offsetX + cy,
							z: y - 200,
							x: z - offsetZ + 2 * cx
						}, Math.random() * 2000 + 2000 )
						.easing( TWEEN.Easing.Exponential.InOut )
						.start();
					}else{
						var xTmp = cubes[i].position.x;
						cubes[i].position.x = xTmp;
						new TWEEN.Tween( cubes[i].position )
							.to({x:xTmp}, 0)
						    .easing( TWEEN.Easing.Elastic.Out ).start();
					}	
				}
			}

			// 螺旋
			function helixFormation(){
				var vector = new THREE.Vector3();
				var cylindrical = new THREE.Cylindrical();

				for ( var i = 0, len = cubes.length; i < len; i++ ) {
					var theta = i * 0.175 + Math.PI;
					var y = - ( i * 8 ) + 450;
					var object = new THREE.Object3D();

					cylindrical.set( 900, theta, y );
					object.position.setFromCylindrical( cylindrical );

					vector.x = object.position.x * 2;
					vector.y = object.position.y;
					vector.z = object.position.z * 2;
					object.lookAt( vector );

					if(cubes[i].userData.isInteracted == false){
						new TWEEN.Tween( cubes[i].position )
						.to( { z: object.position.x-800, x: object.position.y+cx*2, y: object.position.z+600 }, Math.random() * 2000 + 2000 )
						.easing( TWEEN.Easing.Exponential.InOut )
						.start();
					}else{
						var xTmp = cubes[i].position.x;
						new TWEEN.Tween( cubes[i].position )
							.to({x:xTmp - 4050}, 0)
						    .easing( TWEEN.Easing.Elastic.Out ).start();
					}
				}	
			}

			function animate() {
				ANIMATION = window.requestAnimationFrame( animate );

				if(cx >= 5470){
					cx = 1420;

					// loop
					if(formatFlag === 1){

						tmpOffset = 90;
						isInteractable = false;

						var logoShow = rotateCubeFormation(5000,0);	// rotate 180deg
						logoShow.then(function(){

							return rotateCubeFormation(50,1);		// rotate  360deg
						}).then(function(){

							restoreMaterial();
							return textFormation(4000);	
						}).then(function(){

							planeFormation();
							isInteractable = true;
							formatFlag = 2;
							xStep = 10;
						}).catch(function(error){
							console.log('cube logo show error');
						});	
					}else if(formatFlag === 2){
						tmpOffset = 20;

						helixFormation();
						formatFlag = 0;
						// xStep = 5;
					}else if(formatFlag === 0){
						tmpOffset = 100;
						initAndCubeFormation();
						formatFlag = 1;
						// xStep = 5;
					}
					
				}

				if(isInteractable == true){
					cx += xStep;
				}	
				// controls.update();
				camera.position.set(cx, cy, 1200);
				camera.lookAt(cx, cy, 0);
				TWEEN.update();
				
				render();
				stats.update();
			}

			function render() {
				if(intersected.length > 0){
					for(var i = 0; i < intersected.length; i++){
						var cube = intersected[i];
						cube.position.x += xStep;
					}
				}
				// for detect 
				update();
				detectRender();
				renderer.render( scene, camera );
			}

			/*******************  text  **************************/

			function showText(obj, zDepth) {
				scene.remove(textDetails[obj.userData.detailId]);
				textDetails[obj.userData.detailId] = undefined;
				var index = obj.userData.lipId;
				var text = lipStick[index];
				var group = new THREE.Group();
				var textUpdate = function(){
					this.position.x = obj.position.x;
					this.position.y = obj.position.y - 80;
					this.position.z = 0;
				};
				var textTween = new TWEEN.Tween(group).to().onUpdate(textUpdate).start();
				group.position.x = obj.position.x;
				group.position.y = obj.position.y - 80;
				group.position.z = 50;
				group.userData.detailId = obj.userData.detailId;
				textDetails[group.userData.detailId] = group;
				scene.add(group);

				createText(group, text, zDepth);
			}

			// 正常出现的文字
			function createText( group, text, zDepth ) {
				var textGeo = new THREE.TextGeometry( text, {
					font: font,
					size: size,
					height: height,
					curveSegments: curveSegments,
					bevelThickness: bevelThickness,
					bevelSize: bevelSize,
					bevelEnabled: bevelEnabled,
					material: 0,
					extrudeMaterial: 1
				});

				textGeo.computeBoundingBox();
				textGeo.computeVertexNormals();

				var centerOffset = -0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

				var cubeText = new THREE.Mesh( textGeo, textMaterial );
				cubeText.position.x = centerOffset;
				cubeText.position.y = hover;
				cubeText.position.z = zDepth;
				cubeText.rotation.x = 0;
				cubeText.rotation.y = Math.PI * 2;

				group.add( cubeText );
			}

			// 口红和星座点击后的update, 每次切换退回起点
			var spriteUpdate = function(){
				if(this.originFormat === undefined){
					this.originFormat = formatFlag;
				}

				if(this.originFormat === formatFlag){
					this.position.x = this.position.x + xStep;	
				}else{
					this.position.x = this.position.x - 4050;
					this.originFormat = formatFlag
				}
			};

			function showLipstickList(lip) { // 口红列表
				var subNumber = 16;
				var x = lip.position.x;
				var y = lip.position.y;
				var z = lip.position.z;
				lipDetails[lip.userData.detailId] = [];

				for(var i = 1; i <= subNumber; i++){

					var spriteMaterialLip = new THREE.SpriteMaterial({map:subLipTexture[i]});
					var spriteLip = new THREE.Sprite( spriteMaterialLip );

					spriteLip.position.set(x - 40 * (i % 6), y + 40 * parseInt(i / 6), z);
					new TWEEN.Tween(spriteLip).to().onUpdate(spriteUpdate).start();

					spriteLip.scale.x = spriteLip.scale.y = spriteLip.scale.z = 30;
					spriteLip.userData.lipId = i;
					spriteLip.userData.change = "lip";
					spriteLip.userData.detailId = lip.userData.detailId;
					lipDetails[spriteLip.userData.detailId][i] = spriteLip;
					scene.add(spriteLip);
				}
			}

			function showStarList(star) { // 星座列表
				var subNumber = 12;
				var x = star.position.x;
				var y = star.position.y;
				var z = star.position.z;
				var currentStarIndex = lipCenter[star.userData.detailId].userData.starId;
				starDetails[star.userData.detailId] = [];
				var loop = 1;
				var picIndex = 1;
				while(loop < subNumber) {
					if(picIndex != currentStarIndex) {
						var spriteMaterialStar = new THREE.SpriteMaterial({map:starTexture[picIndex]});
						var spriteStar = new THREE.Sprite(spriteMaterialStar);
						spriteStar.position.set(x+ 40 * (loop % 6), y + 40 * parseInt(loop / 6), z);
						new TWEEN.Tween(spriteStar).to().onUpdate(spriteUpdate).start();
						spriteStar.scale.x = spriteStar.scale.y = spriteStar.scale.z = 30;
						spriteStar.userData.starId = picIndex;
						spriteStar.userData.change = "star";
						spriteStar.userData.detailId = star.userData.detailId;
						starDetails[star.userData.detailId][picIndex] = spriteStar;

						scene.add(spriteStar);
						loop++;
						picIndex++;
					} else {
						picIndex++;
					}
				}
			}
			function changeStar(obj) { // 切换星座 参数为列表中星座
				var tmpDetailId =obj.userData.detailId;
				var picIndex = obj.userData.starId + 12;
				var star = starLists[tmpDetailId];
				var starTexure = starTexture[picIndex];
				star.material = new THREE.SpriteMaterial({ map:starTexure});
				star.userData.starId = obj.userData.starId;
				lipCenter[tmpDetailId].userData.starId = obj.userData.starId;
				for(var i = 0; i < starDetails[tmpDetailId].length; i++) {
					scene.remove(starDetails[tmpDetailId][i]);
				}
				starDetails[tmpDetailId] = undefined;
				changeQRCode(lipCenter[tmpDetailId]);
			}
			function changeLipstick(lip) { // 切换口红
				var zDepth = lip.position.z;
				var tmpDetailId = lip.userData.detailId;
				var rougeTexure = subLipTexture[lip.userData.lipId];			// fake
				var rougeMaterial = new THREE.MeshBasicMaterial({ map: rougeTexure });
				lipCenter[tmpDetailId].userData.lipId = lip.userData.lipId;
				lipCenter[tmpDetailId].material = rougeMaterial;
				for(var i = 0; i < lipDetails[tmpDetailId].length; i++) {
					scene.remove(lipDetails[tmpDetailId][i]);
				}
				lipDetails[tmpDetailId] = undefined;
				changeQRCode(lipCenter[lip.userData.detailId]);
				showText(lipCenter[lip.userData.detailId], zDepth);

			}

			function changeClothes(obj) { // 切换星座, 参数为列表中口红或星座
				var textures = [];
				for(var i = 0; i < clothesAround[obj.userData.detailId].length; i++) {
					for (var j = 0; j < 6; j++) {
						var rand = parseInt(Math.random() * 96) + 1;
						textures[j] = subCubeTextures[rand];	// @change2 submaterial
					}
					var materials = [
						new THREE.MeshPhongMaterial({map: textures[0]}), // right
						new THREE.MeshPhongMaterial({map: textures[1]}), // left
						new THREE.MeshPhongMaterial({map: textures[2]}), // top
						new THREE.MeshPhongMaterial({map: textures[3]}), // bottom
						new THREE.MeshPhongMaterial({map: textures[4]}), // back
						new THREE.MeshPhongMaterial({map: textures[5]})  // front
					];
					clothesAround[obj.userData.detailId][i].material = new THREE.MultiMaterial( materials );
				}
			}
			function changeQRCode(lipCenter) { // 切换二维码  传入的参数为中间的口红
				var tmpDetailId = lipCenter.userData.detailId;
				var tmpQR = qrDetail[tmpDetailId];
				var picIndex = lipCenter.userData.lipId + 16 * (lipCenter.userData.starId - 1); // 图片名
				var qrTexure = qrCodeTexture[picIndex];			// fake
				tmpQR.material = new THREE.SpriteMaterial({ map:qrTexure});
			}