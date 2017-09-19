"use strict";

let REVERSI = REVERSI || {};
$(function () {
	REVERSI = {
		val: {
			event: "click",
			turn: 0,//ターン番号
			undoBoard: [],//一手戻し用盤状態記憶
			undoTurn: 0,//一手戻し用ターン番号
			auto: 0,//自動処理のタイマー番号
			cpu: [],//自動処理の手順
			vsCpu: false//CPU対戦フラグ
		},
		//現在は誰のターンか
		getTurn: function() {
			let turn = "";
			return REVERSI.val.turn % 2 == 0 ? turn = "w" : turn = "b";
		},
		//ターンを進める
		setTurn: function() {
			REVERSI.val.turn = REVERSI.val.turn + 1;
		},
		//ターンをリセット
		resetTurn: function() {
			REVERSI.val.turn = 0;
			REVERSI.val.undoBoard = [];
		},
		//指定したセルのオブジェクトを返す
		getCellObj: function() {
			const x = arguments[0] === undefined ? 0 : arguments[0];
			const y = arguments[1] === undefined ? 0 : arguments[1];
			return $(".cell").eq(y * 8 + x);
		},
		//指定したセルの色を返す
		getCellColor: function() {
			const x = arguments[0] === undefined ? 0 : arguments[0];
			const y = arguments[1] === undefined ? 0 : arguments[1];
			return $(".cell").eq(y * 8 + x).attr("class").replace(/cell/, "").replace(/\s/, "");
		},
		//指定したセルの座標を返す
		getXy: function(cellObj) {
			const t = cellObj.index();
			const x = t % 8;
			const y = Math.floor(t / 8);
			return { "x": x, "y": y };
		},
		//石を置く、反転する
		setStone: function() {
			const x = arguments[0] === undefined ? 0 : arguments[0];
			const y = arguments[1] === undefined ? 0 : arguments[1];
			const cell = REVERSI.getCellObj(x, y);
			const result = REVERSI.checkCell(x, y);
			//指定したセルに何もない
			if (result.length > 0) {
				//取り消し用情報
				REVERSI.val.undoBoard.push([$("#board").clone(), REVERSI.val.turn]);
				REVERSI.val.undoTurn = REVERSI.val.turn;
				$("#undo").removeClass("disable");
				cell.removeClass().addClass("cell " + REVERSI.getTurn());
				const l = result.length;
				for (let i = 0; i < l; i++) {
					result[i].removeClass().addClass("cell " + REVERSI.getTurn());
				}
				REVERSI.setTurn();
				REVERSI.writeMessage();
			}
			return Boolean(result.length > 0);
		},
		//セルの状態をセットする
		setCell: function(x, y, c) {
			const $cell = REVERSI.getCellObj(x, y);
			let result = false;
			if (typeof c === "undefined") {
				if (REVERSI.checkSettable()) {
					//色の指定がない
					//石をセット
					result = REVERSI.setStone(x, y);
				} else {
					//手番をスキップ
					let turn = "白";
					if (REVERSI.getTurn() === "b") {
						turn = "黒";
					}
					alert(`石を置ける場所がないので、「${turn}」の順番をスキップします`);
					REVERSI.setTurn();
				}
			} else {
				//色指定がある場合はそのまま設定（初期配置用）
				$cell.addClass(c);
				result = true;
			}
			return result;
		},
		//指定したセルの周囲を確認する
		checkCell: function() {
			const x = arguments[0] === undefined ? 0 : arguments[0];
			const y = arguments[1] === undefined ? 0 : arguments[1];
			const turn = REVERSI.getTurn();
			const $me = REVERSI.getCellObj(x, y);
			let success = false;
			let arr = [[[], []], [[], []], [[], []], [[], []]];
			let result = [];
			//指定のセルを中心にタテ・ヨコ・ナナメ一直線のセル取得
			for (let i = 0; i < 8; i++) {
				arr[0][0].push(REVERSI.getCellObj(i, y)); //横
				arr[0][1].push(REVERSI.getCellColor(i, y)); //横
				arr[1][0].push(REVERSI.getCellObj(x, i)); //縦
				arr[1][1].push(REVERSI.getCellColor(x, i)); //縦
				const ly = i - x + y;
				const ry = (i - x) * -1 + y;
				if (ly >= 0 && ly < 8) {
					//左上がり
					arr[2][0].push(REVERSI.getCellObj(i, ly));
					arr[2][1].push(REVERSI.getCellColor(i, ly));
				}
				if (ry >= 0 && ry < 8) {
					//右上がり
					arr[3][0].push(REVERSI.getCellObj(i, ry));
					arr[3][1].push(REVERSI.getCellColor(i, ry));
				}
			}
			//各方向について
			for (let n = 0; n <= 3; n++) {
				const len = arr[n][0].length;//取得した列のセルの数
				let sIdx = 0;
				for (let l = 0; l < len; l++) {
					if (arr[n][0][l].index() == $me.index()) {
						sIdx = l;//置いた石の順番
						break;
					}
				}
				//ひっくり返せるか判定
				let fIdx = -1;
				let bIdx = -1;
				if (arr[n][1][sIdx - 1] != turn && arr[n][1][sIdx - 1] != "") {
					for (let _l = sIdx - 2; _l >= 0; _l--) {
						//前にひっくり返せるか
						if (arr[n][1][_l] === turn) {
							fIdx = _l;
							break;
						}
						if (arr[n][1][_l] === "") {
							break;
						}
					}
				}
				if (arr[n][1][sIdx + 1] != turn && arr[n][1][sIdx + 1] != "") {
					for (let _l2 = sIdx + 2; _l2 < len; _l2++) {
						//後ろにひっくり返せるか
						if (arr[n][1][_l2] === turn) {
							bIdx = _l2;
							break;
						}
						if (arr[n][1][_l2] === "") {
							break;
						}
					}
				}
				if (fIdx >= 0) {
					for (let i = fIdx + 1; i < sIdx; i++) {
						result.push(arr[n][0][i]);
					}
				}
				if (bIdx >= 0) {
					for (let i = sIdx + 1; i < bIdx; i++) {
						result.push(arr[n][0][i]);
					}
				}
			}
			//置けるセルを返す
			return result;
		},
		//置けるセルがあるかどうか
		checkSettable: function() {
			const length = REVERSI.val.cpu.length;
			let result = false;
			for (let i=0; i<length; i++) {
				const cellObj = $(".cell")[REVERSI.val.cpu[i]];
				const xy = REVERSI.getXy($(cellObj));
				if (REVERSI.checkCell(xy.x, xy.y).length > 0) {
					result = true;
					break;
				};
			}
			return result;
		},
		//自動で打たせる
		doCpu: function() {
			const cellObj = $(".cell")[REVERSI.val.cpu[0]];
			const xy = REVERSI.getXy($(cellObj));
			const $cell = REVERSI.getCellObj(xy.x, xy.y);
			let done = false;
			if (!$cell.hasClass("b") && !$cell.hasClass("w")) {
				done = REVERSI.setCell(xy.x, xy.y);
			}
			if (done) {//石を置けたら、手順から置いたセル番号を削除
				REVERSI.val.cpu.shift();
			} else {//石が置けなかったら、セル番号を手順の最後に回す
				REVERSI.val.cpu.push(REVERSI.val.cpu.shift());
			}
			return done;
		},
		makeCpuStep: function() {
			//自動の手を決める
			const numTable = [];
			for (let i=0; i<64; i++) {
				numTable.push(i);
			}
			REVERSI.val.cpu = numTable.filter(function(i) {//初期配置のセル番号を除外する
				return (i!==27 && i!==28 && i!==35 && i!==36)
			});
			const n = REVERSI.val.cpu.length;
			for(let i=n-1; i>=0; i--){//セル番号をシャッフルする
				const rnd = Math.floor(Math.random() * (i + 1));
				let tmp = REVERSI.val.cpu[i];
				REVERSI.val.cpu[i] = REVERSI.val.cpu[rnd];
				REVERSI.val.cpu[rnd] = tmp;
			}
		},
		createBoard: function() {
			//盤をつくる
			$("#board .cell").remove();
			for (let i = 0; i < 64; i++) {
				$("#board").append("<div class='cell'></div>");
			}
			$("#board .cell").on(REVERSI.val.event, function () {
				const $this = $(this);
				if (!$this.hasClass("b") && !$this.hasClass("w")) {
					const xy = REVERSI.getXy($this);
					REVERSI.setCell(xy["x"], xy["y"]);
				}
				if (REVERSI.val.vsCpu) {
					do {
						const cpu = REVERSI.doCpu();
					} while (cpu);
				}
			});
		},
		//その時の状態でメッセージを表示する
		writeMessage: function() {
			const $mes = $("#message");
			const b = $(".b").length;
			const w = $(".w").length;
			const usedCell = b + w;
			let msg = "";
			if (usedCell < 64) {
				REVERSI.getTurn() == "w" ? msg = "白" : msg = "黒";
				$mes.text(`${msg}のターン 白：${w}／黒：${b}`);
			} else {
				if (b>w) msg = "黒の勝ち！";
				if (b<w) msg = "白の勝ち！";
				if (b===w) msg = "引き分け！";
				$mes.html(`白：${w}／黒：${b}で、<br>${msg}`);
				REVERSI.resetTurn();
				if (REVERSI.val.auto !== 0) {
					clearInterval(REVERSI.val.auto);
					REVERSI.val.auto = 0;
				}
			}
		},
		//全セルを初期化する
		cellInit: function() {
			//ターンをリセット
			REVERSI.resetTurn();
			//自動の手を決める
			REVERSI.makeCpuStep();
			//盤をつくる
			REVERSI.createBoard();
			//初期の石を置く
			REVERSI.setCell(3, 3, "w");
			REVERSI.setCell(4, 4, "w");
			REVERSI.setCell(3, 4, "b");
			REVERSI.setCell(4, 3, "b");
			if (REVERSI.val.auto !== 0) {
				clearInterval(REVERSI.val.auto);
				REVERSI.val.auto = 0;
			}
		},
		//ゲーム初期化
		init: function() {
			document.addEventListener("touchstart", function () {}, false);
			
			$("body").append("<div id='container'></div>");
			$("#container").append("<div id='board'></div>");
			$("#container").append("<div id='info'></div>");
			$("#info").append("<div id='message'></div>");

			REVERSI.cellInit();
			REVERSI.writeMessage();
			
			//アンドゥボタン
			$("#info").append("<button id='undo'>一手戻し</button>");
			$("#undo").addClass("disable");
			$("#undo").on(REVERSI.val.event, function () {
				if (!$(this).hasClass("disable")) {
					const undo = REVERSI.val.undoBoard.pop();
					const board = undo[0].children();
					const turn = undo[1];
					$("#board").empty().append(board);
					REVERSI.val.turn = turn;
					//REVERSI.cellInit();
					$(this).addClass("disable");
					REVERSI.writeMessage();
				}
			});
			
			//自動ボタン
			$("#info").append("<button id='auto'>全自動</button>");
			$("#auto").on(REVERSI.val.event, function () {
				REVERSI.cellInit();
				REVERSI.resetTurn();
				REVERSI.val.auto = setInterval(function() {
					REVERSI.doCpu();
				}, 1)
			});
		}
	};
	REVERSI.init();
});