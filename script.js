(function() {
	var WIN_MESSAGE = 'victory',
		LOSE_MESSAGE = 'defeat',
		STORAGE_NAME = 'minesweeper',
		SIZE,
		MINES,
		TOTALCELLS,
        
		clickablecells = [], // cells that can be clicked
		clickedcells = [], // cells that have been clicked
		cells = [], // values of all cells
		minecells = [], // locations of mines
		timerId,
		isTimerSet = false,
		time = 0,
		clicks = 0,
        
		sizeInput = $('#size-input'),
		minesInput = $('#mines-input'),
		density = $('#density-display'),
		boardDiv = $('#board'),
		messageDiv = $('#message'),
		timerDiv = $('#timer'),
		clicksDiv = $('#clicks'),
		loadButton = $('#loadButton');
		
	// Helper function to get id from element
	function getId(cell) {
		return parseInt(cell.attr('id'), 10);
	}
		
	// Validate and get inputs
	function getInputs() {
		var sizeval = $.trim(sizeInput.val()),
			minesval = $.trim(minesInput.val()),
			sizeint = parseInt(sizeval, 10), // base 10 to remove leading 0s
			minesint = parseInt(minesval, 10),
			re = /^[0-9]+$/,
			errorText;
		if (!re.test(sizeval)) {
			errorText = 'invalid size';
		} else if (!re.test(minesval)) {
			errorText = 'invalid number of mines';
		} else if (sizeint < 2) {
			errorText = 'size cannot be less than 2';
		} else if (sizeint > 50) {
			errorText = 'size cannot be greater than 50';
		} else if (minesint == 0) {
			errorText = 'must have at least 1 mine';
		} else if (minesint >= sizeint*sizeint) {
			errorText = 'too many mines';
		} else {
			messageDiv.html('');
			SIZE = sizeint;
			TOTALCELLS = SIZE*SIZE;
			MINES = minesint;
			return true;
		}
		messageDiv.addClass('error').text(errorText);
	}
	
	// Creates board with cells and initializes cells array
	function createBoard(fromLoad, loadedBoard, condition) {
		// If new game, randomly add mines
		if (!fromLoad) {
			for (var x = 0; x < MINES; x++) {
				var rand = Math.floor(Math.random()*TOTALCELLS);
				if (cells[rand] == 'x') {
					while (cells[rand] == 'x') {
						rand = Math.floor(Math.random()*TOTALCELLS);
					}
				}
				cells[rand] = 'x';
				minecells.push(rand);
			}
		}
	
		// Resize board and add cells
		var dimension = SIZE * 25 + 'px';
		boardDiv.html('').css('width', dimension).css('height', dimension);
		for (var x = 0; x < TOTALCELLS; x++) {
			boardDiv.append('<div class="cell clickable" id="' + x + '"></div>');
			
			clickablecells.push(x);
			
			if (!fromLoad) {
				// Calculate nearby mines
				if (cells[x] != 'x') {
					var surrounding = 0;
					if (x % SIZE > 0) {
						if (cells[x - SIZE - 1] == 'x') surrounding++;
						if (cells[x - 1] == 'x') surrounding++;
						if (cells[x + SIZE - 1] == 'x') surrounding++;
					}
					if (x % SIZE < SIZE - 1) {
						if (cells[x - SIZE + 1] == 'x') surrounding++;
						if (cells[x + 1] == 'x') surrounding++;
						if (cells[x + SIZE + 1] == 'x') surrounding++;
					}
					if (cells[x - SIZE] == 'x') surrounding++;
					if (cells[x + SIZE] == 'x') surrounding++;
					cells[x] = surrounding;
				}
			} else { // If loading game, fill in board
				var c = $('#' + x);
				if (loadedBoard[x] == 'c') {
					showCell(x, c, cells[x], condition == 'w');
				} else {
					c.html(loadedBoard[x]);
				}
			}
		}	
	}
	
	// Binds click handlers for cells
	function bindCells() {
		$('.clickable').on('mousedown', function(e) {
			var clicked = $(this);
			if (clicked.hasClass('clickable')) {
				startTimer();
				if (e.which == 1) { // On left click, reveal cell
					// Increment click count
					clicks++;
					clicksDiv.html(clicks);
				
					var cellid = getId(clicked),
						value = cells[cellid];
				
					showCell(cellid, clicked, value);
					if (value == 0) { // If 0, reveals neighboring cells
						$.each(findNeighboringZeroes(cellid), function(i, loc) {
							showCell(loc, $('#' + loc), cells[loc]);
						});
					} else if (value == 'x') { // If mine, ends game
						lose();
						return;
					}
					
					// Validates on every successful click
					validate();
				} else { // On right click, flag cell
					var clickedText = clicked.text();
					if (clickedText != 'o' && clickedText != '?') {
						clicked.html('o');
					} else if (clickedText == 'o') {
						clicked.html('?');
					} else if (clickedText == '?') {
						clicked.html('');
					}
				}
			}
		}).on('contextmenu', function(e) { // Prevent right click menu
			return false;
		});
	}
	
	// Reveals the cell with id cellid
	function showCell(cellid, cell, value, isWin) {
		if (cell.hasClass('clickable')) {
			cell.removeClass('clickable').addClass('clicked').html('');
			
			if (value != 0) {
				if (isWin && value == 'x') {
					cell.html(value).addClass('cleared');
				} else {
					cell.html(value).addClass('near' + value);
				}
			}
			
			clickedcells.push(cellid);
			clickablecells.splice(clickablecells.indexOf(cellid), 1);
		}
	}
	
	function findNeighboringZeroes(id) {
		connected = [];
		dfs(id);
	
		// Depth first search for getting connected component
		function dfs(id) {
			// Dont't include cells off the board
			if (cells[id] == undefined || id > TOTALCELLS) return;
		
			var nw = id - SIZE - 1,
				n = id - SIZE,
				ne = id - SIZE + 1,
				w = id - 1,
				e = id + 1,
				sw = id + SIZE - 1,
				s = id + SIZE,
				se = id + SIZE + 1;
			connected.push(id);
			
			// Don't dfs if nonzero
			if (cells[id] != 0) return;
			
			if (id%SIZE > 0) { // west
				if (connected.indexOf(nw) < 0) {
					dfs(nw);
				}
				if (connected.indexOf(w) < 0) {
					dfs(w);
				}
				if (connected.indexOf(sw) < 0) {
					dfs(sw);
				}
			} 
			if (id%SIZE < SIZE - 1) { // east
				if (connected.indexOf(ne) < 0) {
					dfs(ne);
				}
				if (connected.indexOf(e) < 0) {
					dfs(e);
				}
				if (connected.indexOf(se) < 0) {
					dfs(se);
				}
			}
			if (connected.indexOf(n) < 0) {
				dfs(n);
			}
			if (connected.indexOf(s) < 0) {
				dfs(s);
			}
		}
		return connected;
	}
	
	// When player clicks on mine, loses game
	function lose() {
		stopTimer();
						
		// Reveal all cells
		$('.clickable').each(function() {
			var cell = $(this),
				cellid = getId(cell),
				surrounding = cells[cellid];
			
			showCell(cellid, cell, surrounding);
		});
		
		messageDiv.addClass('loseMessage').html(LOSE_MESSAGE);
	}
	
	// Checks if all non-mines have been clicked, if so, wins game
	function validate() {
		if (clickablecells.length == MINES) {
			stopTimer();
			messageDiv.addClass('winMessage').html(WIN_MESSAGE);
			
			// Show mines
			$('.clickable').each(function() {
				var cell = $(this);
				showCell(getId(cell), cell, 'x', true);
			});
		}
	}
	
	// Cheat function, displays all mines without ending game
	function showmines() {
		$.each(minecells, function(i, val) {
			$('#' + val).html('x');
		});
	}
	
	// Toggles gameplay timer
	function startTimer() {
		if (!isTimerSet) {
			timerId = setInterval(timerTick, 1000);
			isTimerSet = true;
		}
	}
	function stopTimer() {
		clearInterval(timerId);
		isTimerSet = false;
	}
	
	// Updates and displays time
	function timerTick() {
		time++;
		timerDiv.html(time);
	}
	
	// Save game data to localStorage
	function save() {
		var date = new Date(),
			all = $('.cell'),
			saveboard = [],
			condition;
		
		// saves current state of board
		for (var i = 0; i < TOTALCELLS; i++) {
			saveboard[i] = ($(all[i]).hasClass('clicked')) ? 'c' : $(all[i]).text();
		}
	
		if (messageDiv.hasClass('loseMessage')) {
			condition = 'l';
		} else if (messageDiv.hasClass('winMessage')) {
			condition = 'w';
		}

		var value = { 
            size: SIZE,
            condition: condition,
            time: time,
            clicks: clicks,
            board: saveboard,
            cells: cells,
            minecells: minecells
        };
		
		localStorage.setItem(STORAGE_NAME, JSON.stringify(value));
		loadButton.removeClass('noload');
		messageDiv.removeClass().addClass('notice').html('saved!');
	}
	
	// Load game data from cookie
	function load() {
		var loaded = $.parseJSON(localStorage.getItem(STORAGE_NAME)),
			condition = loaded.condition;
		SIZE = loaded.size;
		TOTALCELLS = SIZE*SIZE;
		MINES = loaded.minecells.length;
		cells = loaded.cells;
		minecells = loaded.minecells;
		time = loaded.time;
		clicks = loaded.clicks;
		newGame(true, loaded.board, condition);
	}
	
	function newGame(fromLoad, loadedBoard, condition) {
		if (fromLoad || getInputs()) {
			var fadeTime = 'fast';
			boardDiv.animate({opacity: '0'}, fadeTime, function() {
				// If new game, reset everything
				if (!fromLoad) {
					cells = [];
					minecells = [];
					clicks = 0;
					time = 0;
				}
				
				clickablecells = [];
				clickedcells = [];
			
				sizeInput.val(SIZE);
				minesInput.val(MINES);
				density.html((MINES/TOTALCELLS*100).toFixed(1));
				createBoard(fromLoad, loadedBoard, condition);
				bindCells();
				messageDiv.removeClass().html('');
				clicksDiv.html(clicks);
				timerDiv.html(time);
				stopTimer();
				if (condition == 'w') {
					messageDiv.addClass('winMessage').html(WIN_MESSAGE);
				} else if (condition == 'l') {
					messageDiv.addClass('loseMessage').html(LOSE_MESSAGE);
				}
			}).animate({opacity: '1'}, fadeTime);
		}
	}
	
	// Attempts to solve the board
	function solve() {
//		var stepId = setInterval(function() {
//			solvealgo();			
//			
//			if (clickablecells.length == 0) {
//				clearInterval(stepId);
//			}
//		}, 1000);
			
		function clickRandom(cells) {
			var rand = Math.floor(Math.random()*cells.length);
			$(cells[rand]).trigger({ type: 'mousedown', which: 1});
		}
		
		function clickCell(cellid) {
			$('#' + cellid).trigger({ type: 'mousedown', which: 1});
		}
		
		function flagCell(cellid) {
			var cell = $('#' + cellid);
			
			if (cell.text().length == 0) {
				cell.trigger({ type: 'mousedown', which: 3});
			}
		}
		
		var added = [],
			ones = [], // Array of cells with value 1
			foundmines = [],
			solvedmines = []; // Completed cells
		
		solvealgo();
		function solvealgo() {
			if (ones.length <= 1) {
				clickRandom($('.clickable'));
			}
			
			for (var i = 0; i < clickedcells.length; i++) {
				var cellId = clickedcells[i],
					cellValue = cells[cellId];
				
				if (added.indexOf(cellId) < 0) {
					if (cellValue == 1) {
						ones.push(cellId);
						added.push(cellId);
					}
				}
			}
			
			for (var i = 0; i < ones.length; i++) {
				var mineNearby = searchNearby(ones[i], 1, 'mine');
				if (mineNearby != null) {
					console.log('mine' + ' search near ' + ones[i] + ', found ' + mineNearby);
					foundmines.push(mineNearby);
					flagCell(mineNearby);
				}
			}
			
			for (var i = 0; i < foundmines.length; i++) {
				var oneNearby = searchNearby(foundmines[i], 1, 'val');
				console.log('val' + ' search near ' + foundmines[i] + ', found ' + oneNearby);
				for (var m = 0; m < mineNearby.length; m++) {
//					clickCell(mineNearby[m]);
				}
			}
			
			function searchNearby(id, num, type) {
				var searchForUnclicked = 'mine',
					searchForValue = 'val',
					lookingfor = 'clickable',
					found = [],
					nw = id - SIZE - 1, nwcell = $('#' + nw),
					n = id - SIZE, ncell = $('#' + n),
					ne = id - SIZE + 1, necell = $('#' + ne),
					w = id - 1, wcell = $('#' + w),
					e = id + 1, ecell = $('#' + e),
					sw = id + SIZE - 1, swcell = $('#' + sw),
					s = id + SIZE, scell = $('#' + s),
					se = id + SIZE + 1, secell = $('#' + se);
				
				if (id % SIZE > 0) { // west
					if (type == searchForUnclicked && nwcell.hasClass(lookingfor) ||
						type == searchForValue && nwcell.text() == num) found.push(nw);
					if (type == searchForUnclicked && wcell.hasClass(lookingfor) ||
						type == searchForValue && wcell.text() == num) found.push(w);
					if (type == searchForUnclicked && swcell.hasClass(lookingfor) ||
						type == searchForValue && swcell.text() == num) found.push(sw);
				} 
				if (id % SIZE < SIZE - 1) { // east
					if (type == searchForUnclicked && necell.hasClass(lookingfor) ||
						type == searchForValue && necell.text() == num) found.push(ne);
					if (type == searchForUnclicked && ecell.hasClass(lookingfor) ||
						type == searchForValue && ecell.text() == num) found.push(e);
					if (type == searchForUnclicked && secell.hasClass(lookingfor) ||
						type == searchForValue && secell.text() == num) found.push(se);
				}
				if (type == searchForUnclicked && ncell.hasClass(lookingfor) ||
						type == searchForValue && ncell.text() == num) found.push(n);
				if (type == searchForUnclicked && scell.hasClass(lookingfor) ||
						type == searchForValue && scell.text() == num) found.push(s);
				
				return (type == searchForUnclicked && found.length == num ||
						type == searchForValue) ? found : null;
			}
		}
	}
	
	// One time event binding
	function bind() {
		$('#validate').on('click', function() {
			validate();
		});
		
		$('#cheat').on('click', function() {
			showmines();
		});
	
		$('#reset').on('click', function() {
			newGame();
		});
		
		$('#saveButton').on('click', function() {
			save();
		});
		
		loadButton.on('click', function() {
			if (!$(this).hasClass('noload')) load();
		});
		
		//$('#solve').on('click', function() {
		//	solve();
		//});
	}
	
	function init() {
		// Allow load game if games are available
		if (localStorage.getItem(STORAGE_NAME)) {
			loadButton.removeClass('noload');
		}
		
		newGame();
        bind();
	}
	
	init();
})();

