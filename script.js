(function() {
	var WIN_MESSAGE = 'victory',
		LOSE_MESSAGE = 'defeat',
		STORAGE_NAME = 'minesweeper',
		CHUNK_SIZE = 256,
		SIZE,
		MINES,
		TOTALCELLS,
		cells = [],
		minecells = [],
		timerId,
		isTimerSet = false,
		time = 0,
		clicks = 0,
		sizeInput = $('input#size'),
		minesInput = $('input#mines'),
		density = $('span#density'),
		board = $('div#board'),
		messageDiv = $('div#message'),
		errorDiv = $('div#message'),
		timerDiv = $('div#timer'),
		clicksDiv = $('div#clicks'),
		loadButton = $('div#loadButton');
		
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
			errorDiv.html('');
			SIZE = sizeint;
			TOTALCELLS = SIZE*SIZE;
			MINES = minesint;
			return true;
		}
		errorDiv.addClass('error').text(errorText);
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
		board.html('').css('width', dimension).css('height', dimension);
		for (var x = 0; x < TOTALCELLS; x++) {
			board.append(
				'<div class="cell clickable" id="' + x + '">' +
				'</div>'
			);
			
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
				var c = $('div#' + x);
				if (loadedBoard[x] == 'c') {
					showCell(c, cells[x], condition == 'w');
				} else {
					c.html(loadedBoard[x]);
				}
			}
		}	
	}
	
	// Binds click handlers
	function bindCells() {
		$('div.clickable').on('mousedown', function(e) {
			var clicked = $(this);
			if (clicked.hasClass('clickable')) {
				startTimer();
				if (e.which == 1) { // On left click, reveal cell
					// Increment click count
					clicks++;
					clicksDiv.html(clicks);
				
					var id = parseInt(clicked.attr('id'), 10),
						surrounding = cells[id];
				
					clicked.removeClass('clickable').addClass('clicked');
					if (surrounding == 0) {
						clicked.html('');
						
						// Reveals neighboring cells if a 0 is clicked
						$.each(findNeighboringZeroes(id), function(i, val) {
							var toShow = $('div#' + val),
								toShowSurrounding = cells[val];
							
							showCell(toShow, toShowSurrounding);
						});
					} else if (surrounding == 'x') {
						clicked.html(surrounding).addClass('near' + surrounding);
						lose();
						return;
					} else {
						clicked.html(surrounding).addClass('near' + surrounding);
					}
					
					// Validates on every successful click
					validate();
				} else { // On right click, flag cell
					if (clicked.text() != 'o' && clicked.text() != '?') {
						clicked.html('o');
					} else if (clicked.text() == 'o') {
						clicked.html('?');
					} else if (clicked.text() == '?') {
						clicked.html('');
					}
				}
			}
		}).on('contextmenu', function(e) { // Prevent right click menu
			return false;
		});
	}
	
	function showCell(cell, value, isWin) {
		if (cell.hasClass('clickable')) {
			cell.removeClass('clickable').addClass('clicked').html('');
			
			if (value != 0) {
				if (isWin && value == 'x') {
					cell.html(value).addClass('cleared');
				} else {
					cell.html(value).addClass('near' + value);
				}
			}
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
		$('div.clickable').each(function() {
			var cell = $(this),
				surrounding = cells[cell.attr('id')];
			
			showCell(cell, surrounding);
		});
		
		messageDiv.addClass('loseMessage').html(LOSE_MESSAGE);
	}
	
	// Checks if all non-mines have been clicked, if so, wins game
	function validate() {
		var remaining = $('div.clickable');
		if (remaining.length == MINES) {
			stopTimer();
			messageDiv.addClass('winMessage').html(WIN_MESSAGE);
			
			// Show mines
			remaining.each(function() {
				showCell($(this), 'x', true);
			});
		}
	}
	
	// Cheat function, displays all mines without ending game
	function showmines() {
		$.each(minecells, function(i, val) {
			$('div#' + val).html('x');
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
			all = $('div.cell'),
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
			$('div#board').animate({opacity: '0'}, fadeTime, function() {
				// If new game, reset everything
				if (!fromLoad) {
					cells = [];
					minecells = [];
					clicks = 0;
					time = 0;
				}
			
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
	
	// One time event binding
	function bind() {
		$('input#validate').on('click', function() {
			validate();
		});
		
		$('input#cheat').on('click', function() {
			showmines();
		});
	
		$('input#reset').on('click', function() {
			newGame();
		});
		
		$('div#saveButton').on('click', function() {
			save();
		});
		
		loadButton.on('click', function() {
			if (!$(this).hasClass('noload'))
				load();
		});
	}
	
	function init() {
		// Allow load game if games are available
		if (localStorage.getItem(STORAGE_NAME)) {
			loadButton.removeClass('noload');
		}
		
		newGame();
	}
	
	init();
	bind();
})();

