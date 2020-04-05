/**
 * Код демо-примера линейного раскроя
 * &copy; Evgeniy Malyarov http://www.oknosoft.ru 2014-2016
 * @module linear-solver
 * Created 19.06.2016
 */


$(document).ready(function () {

	var visualization;

	var cutting = new Genetic.Cutting("1D");

	cutting.genetic.notification = function(pop, generation, stats, isFinished) {

    if(generation == 0) {
      return;
    }

    var decision = this.fitness(pop[0].entity, true), row;

		if(isFinished){
			$("#linear-solver-solve").prop( "disabled", false );
			if(this.progressbar){
				setTimeout(function () {
					this.destroy()
				}.bind(this.progressbar), 1000);
				delete this.progressbar;
			}
		}

		if(this.progressbar){
			this.progressbar.animate(generation / this.configuration.iterations);
		}

		if(this.last == decision.scraps_percent){
			row = $("#linear-solver-results tbody tr")[0];
			row.cells[1].innerHTML = generation;
			return;
		}

		this.last = decision.scraps_percent;

		visualization.draw(this.userData, decision);

		var buf = "";
		buf += "<tr><td></td>";
		buf += "<td align='center'>" + generation + "</td>";
		buf += "<td align='center'>" + (pop[0].fitness / 10e8).toFixed(5) + " " + decision.workpieces.length + "</td>";
		buf += "<td align='center'>" + decision.scraps_percent.toFixed(3) + "</td>";
		buf += "</tr>";
		$("#linear-solver-results tbody").prepend(buf);

		if(!isFinished){

			row = $("#linear-solver-results tbody tr")[0];

			if(this.progressbar){
				if(this.progressbar._container.parentElement != row.cells[0]){
					this.progressbar._container.parentElement.removeChild(this.progressbar._container);
					row.cells[0].appendChild(this.progressbar._container);
				}


			}else{
				row.cells[0].innerHTML = "<div style='margin: 0px; width: " + row.cells[0].offsetWidth + "px; height: 20px; position: relative;'></div>";
				this.progressbar = new ProgressBar.Line(row.cells[0].firstChild, {
					strokeWidth: 1,
					easing: 'easeInOut',
					duration: 200,
					color: '#ddd',
					trailColor: '#eee',
					trailWidth: 1,
					svgStyle: {width: '100%', height: '100%'},
					text: {
						style: {
							// Text color.
							// Default: same as stroke color (options.color)
							color: '#333',
							position: 'absolute',
							left: '50%',
							top: '0px',
							padding: 0,
							margin: 0,
							transform: null
						},
						autoStyleContainer: false
					},
					from: {color: '#FFEA82'},
					to: {color: '#ED6A5A'},
					step: function (state, bar) {
						bar.setText(Math.round(bar.value() * 100) + ' %');
					}
				});
			}
		}

	};

	function run_solve() {
		$("#linear-solver-results tbody").html("");

		$("#linear-solver-solve").prop( "disabled", true );

		var config = {
			iterations: 3000,
			size: 200,
			crossover: 0.2,
			mutation: 0.3,
			random: 0.1,
			skip: 60,
			webWorkers: true
		};

		var userData = {
			products: [],
			workpieces: [],
			knifewidth: 6,
			overmeasure: 0,
			sticklength: 6000,
			wrongsnipmin: 0,
			wrongsnipmax: 0,
			usefulscrap: 600
		};

		$("#linear-solver-products").val().split("\n").forEach(function(v){
			v = parseInt(v);
			if(!isNaN(v) && v > 0)
				userData.products.push(v);
		});

		$("#linear-solver-workpieces").val().split("\n").forEach(function(v){
			v = parseInt(v);
			if(!isNaN(v) && v > 0)
				userData.workpieces.push(v);
		});

		$("#linear-solver-params").val().split("\n").forEach(function (v) {

			var prm = v.split(" ");

			if(config.hasOwnProperty(prm[0]))
				config[prm[0]] = parseFloat(prm[1]);

			else if(userData.hasOwnProperty(prm[0]))
				userData[prm[0]] = parseFloat(prm[1]);
		});

		if(config.skip < 40)
			config.skip = 40;

		if(config.size < 80)
			config.size = 80;

		cutting.genetic.evolve(config, userData);
	}

	var config = {
		settings:{
			showPopoutIcon: false,
			showCloseIcon: false
		},
		content: [{
			type: 'column',
			content:[{
				type: 'row',
				content:[{
					type: 'component',
					componentName: 'input',
					title: 'Исходные данные',
					tooltip: 'Размеры изделий и заготовок',
					componentState: { label: 'A' },
					width: 20
				},{
					type: 'component',
					componentName: 'results',
					title: 'Оптимизация',
					tooltip: 'Запуск и ход оптимизации',
					componentState: { label: 'B' },
					width: 30
				}],
				height: 40
			},{
				type: 'row',
				content:[{
					type: 'component',
					componentName: 'visualization',
					title: 'Визуализация',
					tooltip: 'Расположение изделий на заготовках',
					componentState: { label: 'C' }
				}]
			}]
		}]
	};

	var myLayout = new GoldenLayout( config, document.querySelector("#linear-solver-layout") );

	// подключаем всплывающие подсказки
	myLayout.on( 'tabCreated', function( tab ){
		tab.element.attr('title', tab.contentItem.config.tooltip);
	});

	// закладка визуализации
	myLayout.registerComponent( 'visualization', function( container, componentState ){
		//container.getElement().html( '<div id="scheme"></div>' );
		visualization = new Genetic.Visualization("1D", container.getElement()[0]);

		container.on('resize', function () {
			visualization.scheme.resize_canvas();
		});

	});

	// закладка результатов
	myLayout.registerComponent( 'results', function( container, componentState ){
		container.getElement().html( '<table id="linear-solver-results" style="width: 100%; background-color: whitesmoke; font: 90% Arial,sans-serif;"><thead><tr>\
        <th width="30%" style="text-align: left"><button id="linear-solver-solve" style="font-weight: bold; padding: 2px 12px; margin: 0px 20px;">Старт</button></th>\
                <th width="20%" style="font-weight: normal">Поколение</th><th width="30%" style="font-weight: normal">Качество</th>\
                <th width="20%" style="font-weight: normal">% Обрези</th></tr></thead><tbody></tbody></table>' );

		setTimeout(function () {
			$("#linear-solver-solve").click(run_solve);
		});
	});

	// закладка исходных данных
	myLayout.registerComponent( 'input', function( container, componentState ){
		container.getElement().html('<table style="width: 100%; height: 100%; background-color: whitesmoke; font: 90% Arial,sans-serif;"><thead>\
        <tr><th style="font-weight: normal">Изделия</th><th style="font-weight: normal">Заготовки</th>\
        <th style="font-weight: normal">Параметры</th></tr></thead><tbody><tr style="height: 92%;"><td style="width: 25%;">\
            <textarea id="linear-solver-products">1356\n1436\n646\n2260\n1086\n1626\n1086\n1626\n1086\n1626\n1086\n1626\n\
1086\n1626\n586\n1626\n586\n1626\n1746\n2666\n1746\n2666\n1746\n2666\n1766\n2666\n1766\n2666\n1746\n2660\n1166\n1746\n1166\n1746\n1746\n\
2666\n1746\n2656\n1746\n2656\n1746\n2666\n1746\n2666\n1746\n2666\n1166\n1746\n1166\n1746\n686\n1056\n686\n1056\n666\n1056\n666\n1056\n\
666\n1056\n666\n1056\n646\n1076</textarea></td><td style="width: 25%;">\
        <textarea id="linear-solver-workpieces">1211\n1711\n1920\n2058\n4768</textarea></td><td>\
        <textarea id="linear-solver-params">knifewidth 6\nsticklength 6000\nwrongsnipmin 0\nwrongsnipmax 0\n\
usefulscrap 600\novermeasure 0\niterations 12000\nsize 120\ncrossover 0.2\nmutation 0.3\nrandom 0.15\nskip 50\nwebWorkers 1</textarea></td></tr></tbody></table>' );
	});

	myLayout.init();


});