/*******************************************
* Chip-8 interpreter                       *
* Copyright (c) 2017 by ir. Marc Dendooven *
* Version 0.1 DEV                          *
*******************************************/

const start = 0x200;
const fonts = start-80;
var mem = new Uint8Array(0x1000);
var V = new Uint8Array(0x10);
var S = new Uint16Array(0x10);
var PC = start;
var SP = 0;
var I = 0;
var key = 255;
var shxy = true;
var DT = 0;
var ST = 0;
var tick;

var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');

var vid = Array(64*32); cls(); 

function setShift(sh){shxy = sh; reset()};

function reset(){
	PC = start;
	SP = 0;
	I=0;
	key=255;
	for (var j = 0; j<0x10; j++){V[j]=S[j]=0};
	cls()}

function push(button){key = button};

function cls(){
	for (var i = vid.length-1; i >= 0; -- i) vid[i] = false;
	ctx.fillStyle = "#000000";
	for (var y = 31; y>=0; --y) 
		for (var x = 63; x>=0; --x)
			ctx.fillRect(x*5,y*5,5,5); 
	}
	
function drw() {


//	writeln('draw sprite'); 
	V[0xF]=0;
//	console.log(n);
	for (var sy = 0; sy < n; ++sy) {
//			console.log(sy);
			gy = (V[y]+sy) % 32;
			for (var sx = 0; sx < 8; ++sx) {
				gx = (V[x]+sx) % 64;
			//	gotoxy(2*gx+1,gy+1); 
				if (((mem[I+sy] & (0x80 >>> sx)) != 0) && vid[gx+64*gy]) {V[0xF]=1};
				if (((mem[I+sy] & (0x80 >>> sx)) != 0) ^ vid[gx+64*gy]) 
					{vid[gx+64*gy] = true; ctx.fillStyle = "#FFFFFF";} 
					else {vid[gx+64*gy] = false; ctx.fillStyle = "#000000";};
				ctx.fillRect(gx*5,gy*5,5,5); 	   
			}
	}
}


mem.set([	0xF0,0x90,0x90,0x90,0xF0,
			0x20,0x60,0x20,0x20,0x70,
			0xF0,0x10,0xF0,0x80,0xF0,
			0xF0,0x10,0xF0,0x10,0xF0,
			0x90,0x90,0xF0,0x10,0x10,
			0xF0,0x80,0xF0,0x10,0xF0,
			0xF0,0x80,0xF0,0x90,0xF0,
			0xF0,0x10,0x20,0x40,0x40,
			0xF0,0x90,0xF0,0x90,0xF0,
			0xF0,0x90,0xF0,0x10,0xF0,
			0xF0,0x90,0xF0,0x90,0x90,
			0xE0,0x90,0xE0,0x90,0xE0,
			0xF0,0x80,0x80,0x80,0xF0,
			0xE0,0x90,0x90,0x90,0xE0,
			0xF0,0x80,0xF0,0x80,0xF0,
			0xF0,0x80,0xF0,0x80,0x80],fonts);
			
function error(s){alert(s); stop};
			
function oneCycle(){
	
	opcH = mem[PC++]; opcL = mem[PC++];
	o = opcH >>> 4; x = opcH & 0x0F; y = opcL >>> 4; n=opcL & 0x0F;
	nnn = x*256+opcL;
//	console.log(PC,opcH,opcL,o,x,y,n,nnn);
//	console.log(vid); 
	switch (o) {
		case 0: switch (nnn) {
					case 0x0E0: cls(); break; // 00E0 - CLS
					case 0x0EE: PC = S[--SP]; break; // 00EE - RET
					default: error('SYS addr not possible in this emulator') 
				}; break;
		case 1: PC = nnn; break; // 1nnn - JMP nnn
		case 2: S[SP++] = PC; PC = nnn; break; // 2nnn - CALL nnn
		case 3: if (V[x] == opcL) {PC += 2}; break; // 3xkk - SE Vx, byte (Skip if equal) 
		case 4: if (V[x] != opcL) {PC += 2}; break; // 4xkk - SNE Vx, byte (Skip if not equal)
		case 5: if (V[x] == V[y]) {PC += 2}; break; // 5xy0 - SE Vx, Vy (Skip if equal) what if last nibble != 0 ??
		case 6: V[x] = opcL; break; // 6xkk - LD Vx, byte
		case 7: V[x] += opcL; break; // 7xkk - ADD Vx, byte
		case 8: switch (n) {
				case 0: V[x] = V[y]; break; // 8xy0 - LD Vx, Vy
				case 1: V[x] |= V[y]; break; // 8xy1 - OR Vx, Vy
				case 2: V[x] &= V[y]; break; // 8xy2 - AND Vx, Vy
				case 3: V[x] ^= V[y]; break; // 8xy3 - XOR Vx, Vy
				case 4: V[x] = H = V[x] + V[y]; if (H > 255) {V[15] = 1} else {V[15] = 0}; break; // 8xy4 - ADD Vx, Vy - Vf <- CARRY 
				case 5: if (V[y] > V[x]) {V[15] = 0} else {V[15] = 1};V[x] = V[x] - V[y]; break; // 8xy5 - SUB Vx, Vy - Vf <- NOT BORROW
				case 6: if (shxy) {V[15] = V[y] & 1; V[x] = V[y]>>>1}
							else {V[15] = V[x] & 1; V[x] = V[x]>>>1}; break; // 8xy6 - SHR Vx[,Vy]				
				case 7: if (V[x] > V[y]) {V[15] = 0} else {V[15] = 1};V[x] = V[y] - V[x]; break; // 8xy7 - SUBN Vx, Vy - Vf <- NOT BORROW
				case 0xE: if (shxy) {V[15] = V[y]>>>7; V[x] = V[y]<<1}
							else {V[15] = V[x]>>>7; V[x] = V[x]<<1}; break; // 8xyE - SHL Vx[,Vy]
				default: error('o=8, value for n not implemented: '+n);
				}; break;
		case 9: if (V[x] != V[y]) {PC += 2}; break; // 9xy0 - SNE Vx, Vy (Skip if not equal)
		case 0xA: I = nnn; break; // Annn - LD I, nnn
		case 0xB: PC = nnn + V[0]; break; // Bnnn - JP V0, addr
		case 0xC: V[x] = Math.floor(Math.random() * 256) & opcL; break; // Cxkk - RND Vx, byte
		case 0xD: drw(); break; // Dxyn - DRW Vx, Vy, nibble')
		case 0xE: switch(opcL) {
					case 0x9E: if (key == V[x]) {PC+=2}; break;
					case 0xA1: if (key != V[x] && key != 255) {PC+=2}; break;
					default: error('o=E, value for opcL not implemented: '+opcL);
					}; break;
		case 0xF: switch (opcL) {
					case 0x07: V[x] = DT; break; //Fx07 - LD Vx, DT
					case 0x0A: if(key == 255) {PC -= 2} else V[x] = key; break; //Fx0A - LD Vx, K  
					case 0x15: DT = V[x]; break; //Fx15 - LD DT, Vx  
					case 0x18: ST = V[x]; break; //Fx15 - LD ST, Vx
					case 0x1E: I = I + V[x]; break; // Fx1E - ADD I, Vx
					case 0x29: I = fonts + 5*V[x]; break; // Fx29 - LD F, Vx
					case 0x33: mem[I] = V[x] / 100; mem[I+1]=(V[x] % 100) / 10; mem[I+2] = V[x] % 10; break; // Fx33 - LD B, Vx
					case 0x55: for (var j = 0; j<=x; j++) {mem[I+j] = V[j]}; I=I+x+1; break; // Fx55 - LD [I], Vx
					case 0x65: for (var j = 0; j<=x; j++) {V[j] = mem[I+j]}; I=I+x+1; break; //Fx65 - LD Vx, [I]
					default: error('o=F, value for opcL not implemented: '+opcL);
					}; break;
		default: error('value for o not implemented: '+o);
		};
		if (DT > 0) {DT-=0.2};
		if (ST > 0) {ST-=0.2};
};
var fs = document.getElementById("myFile");
var fr = new FileReader();
	fr.onload = function(){ mem.set (new Uint8Array(fr.result),0x200);
							reset(); run()};

function readFile(){
				fr.readAsArrayBuffer(fs.files[0])
					};
					
function run(){tick = setInterval(oneCycle, 1000/300)};
function stop(){clearInterval(tick)};
