
var Genetic = Genetic || (function(){
	
	'use strict';
	
	// facilitates communcation between web workers
	var Serialization = {
		"stringify": function (obj) {
			return JSON.stringify(obj, function (key, value) {
				if (value instanceof Function || typeof value == "function") return "__func__:" + value.toString();
				if (value instanceof RegExp) return "__regex__:" + value;
				if (typeof value == "object" && typeof value.constructor.from == "function")
					return "__" + value.constructor.name + "__:" + value.join();
				return value;
			});
		}, "parse": function (str) {
			return JSON.parse(str, function (key, value) {
				if (typeof value != "string") return value;
				if (value.lastIndexOf("__func__:", 0) === 0) return eval('(' + value.slice(9) + ')');
				if (value.lastIndexOf("__regex__:", 0) === 0) return eval('(' + value.slice(10) + ')');
				if (value.indexOf("Array__:") != -1){
					var akey = value.split("__:");
					return eval(akey[0].substr(2) + '.from([' + akey[1] + '])');
				}
				return value;
			});
		}
	};
	
	var Clone = function(obj) {

		if (obj == null || typeof obj != "object")
			return obj;

		if(typeof obj.constructor.from == "function")
			return obj.constructor.from(obj);
		
		return JSON.parse(JSON.stringify(obj));
	};
	
	var Optimize = {
		"Maximize": function (a, b) { return a >= b; }
		, "Minimize": function (a, b) { return a < b; }
	};
	
	var Select1 = {
		"Tournament2": function(pop) {
			var n = pop.length;
			var a = pop[Math.floor(Math.random()*n)];
			var b = pop[Math.floor(Math.random()*n)];
			return this.optimize(a.fitness, b.fitness) ? a.entity : b.entity;
		}, "Tournament3": function(pop) {
			var n = pop.length;
			var a = pop[Math.floor(Math.random()*n)];
			var b = pop[Math.floor(Math.random()*n)];
			var c = pop[Math.floor(Math.random()*n)];
			var best = this.optimize(a.fitness, b.fitness) ? a : b;
			best = this.optimize(best.fitness, c.fitness) ? best : c;
			return best.entity;
		}, "Fittest": function (pop) {
			return pop[0].entity;
		}, "Random": function (pop) {
			return pop[Math.floor(Math.random()*pop.length)].entity;
		}, "RandomLinearRank": function (pop) {
			this.internalGenState["rlr"] = this.internalGenState["rlr"]||0;
			return pop[Math.floor(Math.random()*Math.min(pop.length,(this.internalGenState["rlr"]++)))].entity;
		}, "Sequential": function (pop) {
			this.internalGenState["seq"] = this.internalGenState["seq"]||0;
			return pop[(this.internalGenState["seq"]++)%pop.length].entity;
		}
	};
	
	var Select2 = {
		"Tournament2": function(pop) {
			return [Select1.Tournament2.call(this, pop), Select1.Tournament2.call(this, pop)];
		}, "Tournament3": function(pop) {
			return [Select1.Tournament3.call(this, pop), Select1.Tournament3.call(this, pop)];
		}, "Random": function (pop) {
			return [Select1.Random.call(this, pop), Select1.Random.call(this, pop)];
		}, "RandomLinearRank": function (pop) {
			return [Select1.RandomLinearRank.call(this, pop), Select1.RandomLinearRank.call(this, pop)];
		}, "Sequential": function (pop) {
			return [Select1.Sequential.call(this, pop), Select1.Sequential.call(this, pop)];
		}, "FittestRandom": function (pop) {
			return [Select1.Fittest.call(this, pop), Select1.Random.call(this, pop)];
		}
	};
	
	function Genetic() {
		
		// population
		this.fitness = null;
		this.seed = null;
		this.mutate = null;
		this.crossover = null;
		this.select1 = null;
		this.select2 = null;
		this.optimize = null;
		this.generation = null;
		this.notification = null;
		
		this.configuration = {
			"size": 250
			, "crossover": 0.8
			, "mutation": 0.2
			, "random": 0.1
			, "iterations": 100
			, "fittestAlwaysSurvives": true
			, "maxResults": 100
			, "webWorkers": true
			, "skip": 0
		};
		
		this.userData = {};
		this.internalGenState = {};
		
		this.entities = [];
		
		this.usingWebWorker = false;
		
		this.start = function(message) {
			
			var parents, children;
			var self = this;
			
			function mutateOrNot(entity) {
				// applies mutation based on mutation probability
				return Math.random() <= self.configuration.mutation && self.mutate ? self.mutate(Clone(entity)) : entity;
			}
			
			// seed the population
			if(message && message.data){
				// {entities: "__Int16Array__:"}
				this.entities = Serialization.parse(message.data).entities;
			}			
			while (this.entities.length < this.configuration.size)
				this.entities.push(this.seed());
			
			
			for (var i=0; i<this.configuration.iterations; ++i) {
				// reset for each generation
				this.internalGenState = {};
				
				// score and sort
				var pop = this.entities
					.map(function (entity) {
						return {"fitness": self.fitness(entity), "entity": entity };
					})
					.sort(function (a, b) {
						return self.optimize(a.fitness, b.fitness) ? -1 : 1;
					});
				
				// generation notification
				var mean = pop.reduce(function (a, b) { return a + b.fitness; }, 0)/pop.length;
				var stdev = Math.sqrt(pop
					.map(function (a) { return (a.fitness - mean) * (a.fitness - mean); })
					.reduce(function (a, b) { return a+b; }, 0)/pop.length);
					
				var stats = {
					"maximum": pop[0].fitness
					, "minimum": pop[pop.length-1].fitness
					, "mean": mean
					, "stdev": stdev
				};

				var r = this.generation ? this.generation(pop, i, stats) : true;
				var isFinished = (typeof r != "undefined" && !r) || (i == this.configuration.iterations-1);
				
				if (
					this.notification
					&& (isFinished || this.configuration["skip"] == 0 || i%this.configuration["skip"] == 0)
				) {
					this.sendNotification(pop.slice(0, this.maxResults), i, stats, isFinished);
				}
					
				if (isFinished)
					break;
				
				// crossover and mutate
				var newPop = [];
				
				if (this.configuration.fittestAlwaysSurvives){  // lets the best solution fall through
					newPop.push(Clone(pop[0].entity));
					newPop.push(Clone(pop[1].entity));
					if (this.crossover) {   // if there is a crossover function
						children = this.crossover(newPop[0], this.select1(pop));
						newPop.push(children[0], children[1]);
						children = this.crossover(newPop[1], this.select1(pop));
						newPop.push(children[0], children[1]);
					}
					newPop.push(this.mutate(Clone(newPop[0])));
				}
				
				while (newPop.length < self.configuration.size) {

					if(Math.random() <= this.configuration.random)
						newPop.push(this.seed());   // add a random child

					else if (
						this.crossover // if there is a crossover function
						&& Math.random() <= this.configuration.crossover // base crossover on specified probability
						&& newPop.length+1 < self.configuration.size // keeps us from going 1 over the max population size
					) {
						parents = this.select2(pop);
						children = this.crossover(parents[0], parents[1]).map(mutateOrNot);
						newPop.push(children[0], children[1]);
					} else {
						newPop.push(mutateOrNot(self.select1(pop)));
					}
				}
				
				this.entities = newPop;
			}
		};
		
		this.sendNotification = function(pop, generation, stats, isFinished) {
			var response = {
				"pop": pop.map(Serialization.stringify)
				, "generation": generation
				, "stats": stats
				, "isFinished": isFinished
			};
			
			
			if (this.usingWebWorker) {
				postMessage(response);
			} else {
				// self declared outside of scope
				self.notification(response.pop.map(Serialization.parse), response.generation, response.stats, response.isFinished);
			}
			
		};
	}
	
	Genetic.prototype.evolve = function(config, userData) {
		
		var k;
		for (k in config) {
			this.configuration[k] = config[k];
		}
		
		for (k in userData) {
			this.userData[k] = userData[k];
		}
		
		// determine if we can use webworkers
		this.usingWebWorker = this.configuration.webWorkers
			&& typeof Blob != "undefined"
			&& typeof Worker != "undefined"
			&& typeof window.URL != "undefined"
			&& typeof window.URL.createObjectURL != "undefined";
		
		function addslashes(str) {
			return str.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
		}
			
		// bootstrap webworker script
		var blobScript = "'use strict'\n";
		blobScript += "var Serialization = {'stringify': " + Serialization.stringify.toString() + ", 'parse': " + Serialization.parse.toString() + "};\n";
		blobScript += "var Clone = " + Clone.toString() + ";\n";
		
		// make available in webworker
		blobScript += "var Optimize = Serialization.parse(\"" + addslashes(Serialization.stringify(Optimize)) + "\");\n";
		blobScript += "var Select1 = Serialization.parse(\"" + addslashes(Serialization.stringify(Select1)) + "\");\n";
		blobScript += "var Select2 = Serialization.parse(\"" + addslashes(Serialization.stringify(Select2)) + "\");\n";
		
		// materialize our ga instance in the worker
		blobScript += "var genetic = Serialization.parse(\"" + addslashes(Serialization.stringify(this)) + "\");\n";
		blobScript += "onmessage = function(e) { genetic.start(e); }\n";
		
		var self = this;
		
		if (this.usingWebWorker) {
			// webworker
			var blob = new Blob([blobScript]);
			var worker = new Worker(window.URL.createObjectURL(blob));
			worker.onmessage = function(e) {
			  var response = e.data;
			  self.notification(response.pop.map(Serialization.parse), response.generation, response.stats, response.isFinished);
			};
			worker.onerror = function(e) {
				alert('ERROR: Line ' + e.lineno + ' in ' + e.filename + ': ' + e.message);
			};
			worker.postMessage("");
		} else {
			// simulate webworker
			(function(){
				var onmessage;
				eval(blobScript);
				onmessage(null);
			})();
		}
	}
	
	return {
		"create": function() {
			return new Genetic();
		}, "Select1": Select1
		, "Select2": Select2
		, "Optimize": Optimize
		, "Clone": Clone
	};
	
})();


// so we don't have to build to run in the browser
if (typeof module != "undefined") {
	module.exports = Genetic;
}

/**
 * Оптимизатор раскроя
 * &copy; Evgeniy Malyarov http://www.oknosoft.ru 2014-2016
 * @module cutting
 * Created 15.06.2016
 */

(function () {

	function Cutting(engine) {

		this.engine = new Cutting[engine];

		this.genetic = Genetic.create();
		this.genetic.optimize = Genetic.Optimize.Minimize;
		this.genetic.select1 = Genetic.Select1.Tournament2;
		this.genetic.select2 = Genetic.Select2.Tournament2;

		this.genetic.seed = this.engine.seed;
		this.genetic.mutate = this.engine.mutate;
		this.genetic.crossover = this.engine.crossover;
		this.genetic.fitness = this.engine.fitness;
		this.genetic.generation = this.engine.generation;

	}

	/**
	 * Движок линейного раскроя
	 * @constructor
	 */
	Cutting["1D"] = function C1D() {

		/*
		 this.userData: {
			 workpieces, // заготовки - массив длин
			 products,   // изделия - массив длин
			 decision;   // решение - массив номеров заготовок в порядке изделий
		 }
		 */


		/**
		 * Случайный массив индексов
		 * @return {Int16Array}
		 */
		this.seed = function() {

			if(!Int16Array.prototype.fill){
				throw new Error("Unsupported browser. Use Chrome, FireFox or MS EDGE\n\nУстаревший браузер. Используйте Chrome, FireFox или MS EDGE\n");
			}


			var len = this.userData.products.length,
				decision = new Int16Array(len).fill(-1),
				ind, i2;

			for(var i=0; i<len; i++){

				ind = Math.floor(Math.random() * (len - i));

				i2 = 0;
				while((i2<ind) || (decision[ind]>=0)){
					if(decision[i2]>=0)
						ind++;
					i2++;
				}
				decision[ind] = i;
			}

			// create random strings that are equal in length to solution
			return decision;
		};

		/**
		 * Мутация - перестановка двух случайных генов
		 * @param entity {Int16Array}
		 * @return {Int16Array}
		 */
		this.mutate = function(entity) {

			// chromosomal drift
			var len = entity.length,
				i = Math.floor(Math.random()*len),
				j = Math.floor(Math.random()*len);

			while (i == j && len > 1)
				j = Math.floor(Math.random()*entity.length);

			var k = entity[j];
			entity[j] = entity[i];
			entity[i] = k;

			return entity;
		};


		/**
		 * Смешивает гены родителей
		 * @param mother
		 * @param father
		 * @return {Int16Array[]}
		 */
		this.crossover = function(mother, father) {

			// single-point crossover
			var len = mother.length,
				ca = Math.floor(Math.random()*len),
				son = new Int16Array(len).fill(-1),
				daughter = new Int16Array(len).fill(-1),
				tmp = new Int16Array(len),
				tmp_len, i;


			// начальные кусочки от родителей заполняем без хитростей, но запоминаем индексы второго родителя
			tmp.fill(-1);
			tmp_len = 0;
			for(i=0; i<ca; i++){
				son[i] = father[i];

				tmp[tmp_len] = mother.indexOf(son[i]);
				tmp_len++;
			}

			tmp_len = ca;
			for(i=0; i<len; i++){
				if(tmp.indexOf(i) == -1){
					son[tmp_len] = mother[i];
					tmp_len++;
				}
			}


			tmp.fill(-1);
			tmp_len = 0;
			for(i=0; i<ca; i++){
				daughter[i] = mother[i];

				tmp[tmp_len] = father.indexOf(daughter[i]);
				tmp_len++;
			}

			tmp_len = ca;
			for(i=0; i<len; i++){
				if(tmp.indexOf(i) == -1){
					daughter[tmp_len] = father[i];
					tmp_len++;
				}
			}

			return [son, daughter];
		};

		/**
		 * Осуществляет укладку заготовок и оценку решения
		 * @param entity {Int16Array}
		 * @return {number}
		 */
		this.fitness = function(entity, decision) {

			var fitness = 0,
				len = entity.length,
				res,
				userData = this.userData,
				workpieces = Array.from(userData.workpieces),
				scraps = workpieces.length,
				workpiece_index, scrap_len, min_len, i;

			if(decision)
				res = new Int16Array(len);

			for (i=0; i<entity.length; ++i) {

				min_len = Infinity;
				workpiece_index = -1;

				// бежим по заготовкам, ищем самую короткую, на которую можно уложить
				workpieces.some(function (val, index) {

					// получаем длину остатка
					scrap_len = val - userData.products[entity[i]] - userData.knifewidth;

					// укорачиваем заготовку на припуск
					if(index < scraps && userData.workpieces[index] == val && userData.overmeasure)
						scrap_len -= userData.overmeasure;

					// анализируем остаток
					if(scrap_len >= 0 && scrap_len < min_len){

						if(scrap_len > userData.wrongsnipmin && userData.wrongsnipmax && scrap_len < userData.wrongsnipmax){
							return;
						}
						
						min_len = scrap_len;
						workpiece_index = index;

						if(min_len == 0)
							return true;
					}
				});

				// если найдено - укладываем, иначе - добавляем палку
				if(workpiece_index >=0){
					workpieces[workpiece_index] = min_len;
					if(decision)
						res[entity[i]] = workpiece_index;

				}else{
					workpieces.push(userData.sticklength - userData.products[entity[i]] - userData.overmeasure);
					if(decision)
						res[entity[i]] = workpieces.length - 1;

				}
			}


			// в зависимости от признака decision, возвращаем оценку решения или полное решение
			if(!decision){
				workpieces.forEach(function (val, index) {
					fitness += 10e12;
					// форсируем использование обрези, уменьшая её цену
					// if(index < scraps)
					// 	fitness -= 10000;
					fitness -= val * val;
				});

			}else{
				fitness = {
					workpieces: workpieces,
					res: res,
					workpieces_len: 0,
					products_len: userData.products.reduce(function(a, b) { return a + b; }, 0),
					scraps_len: 0
				};

				workpieces.forEach(function (val, index) {

					if(index < scraps)
						fitness.workpieces_len += userData.workpieces[index];
					else
						fitness.workpieces_len += userData.sticklength;

					if(val >= userData.usefulscrap)
						fitness.scraps_len += val;
				});

				fitness.scraps_percent = (
					fitness.workpieces_len
					- fitness.products_len
					- fitness.scraps_len
					- userData.products.length * userData.knifewidth) * 100 / fitness.workpieces_len;
			}

			return fitness;
		};

		/**
		 * Принимает решение о целесообразности дальнейшей эволюции
		 * @param pop
		 * @param generation
		 * @param stats
		 * @return {boolean}
		 */
		this.generation = function(pop, generation, stats) {
			// stop running once we've reached the solution
			if(generation < this.configuration.skip || generation % this.configuration.skip !=0)
				return true;

			var decision = this.fitness(pop[0].entity, true),
				usefulscrap = this.userData.usefulscrap;
			// останавливаем эволюцию, если обрезь < 1% и нет длинных обрезков
			if((decision.scraps_percent < 0.5 && generation > this.configuration.iterations / 3) ||
				(decision.scraps_percent < 1 && decision.workpieces.every(function (val) {
					return val < usefulscrap
				})))
				return false;
		};

	};

	/**
	 * Движок раскроя полубесконечной полосы
	 * @constructor
	 */
	Cutting["15D"] = function C15D() {

	};

	/**
	 * Движок двумерного раскроя
	 * @constructor
	 */
	Cutting["2D"] = function C2D() {

	};

	/**
	 * Движок укладки  в пирамиды
	 * @constructor
	 */
	Cutting["Pyramid"] = function CPyramid() {

	};

	Genetic.Cutting = Cutting;
	
})();



/**
 * Визуализация раскроя
 * &copy; Evgeniy Malyarov http://www.oknosoft.ru 2014-2016
 * @module visualization
 * Created 18.06.2016
 */

(function () {

	function Visualization(engine, element) {

		this.canvas = document.createElement('canvas');
		this.canvas.style.width = "100%";
		this.canvas.style.height = "100%";
		this.canvas.style.backgroundColor = "whitesmoke";
		element.appendChild(this.canvas);
		this.scope = new paper.constructor();
		this.scheme = new paper.Project(this.canvas);

		this.engine = new Visualization[engine](this);

		this.scheme.resize_canvas = function(){

			this.view.viewSize.width = element.offsetWidth;
			this.view.viewSize.height = element.offsetHeight;

			this.zoom_fit();
		};

		this.scheme.zoom_fit = function () {

			var bounds = this.activeLayer && this.activeLayer.strokeBounds;

			if(bounds && bounds.height && bounds.width){
				this.view.zoom = Math.min((this.view.viewSize.height - 8) / bounds.height, (this.view.viewSize.width - 8) / bounds.width);
				this.view.center = bounds.center;
			}
		};


		this.draw = function (userData, decision) {

			this.scheme.clear();

			this.engine.draw(userData, decision);

			this.scheme.zoom_fit();
			this.scheme.view.update();
		};
		
	}

	/**
	 * Визуализация линейного раскроя
	 * @constructor
	 */
	Visualization["1D"] = function V1D(visualization) {

		this.draw = function (userData, decision) {

			var x=0, y, w, h=88,
				path;

			for(var i=0; i<decision.workpieces.length; i++){

				if(i<userData.workpieces.length)
					w = userData.workpieces[i];
				else
					w = userData.sticklength;

				y = Math.round(h * 1.3) * i;

				path = new paper.Path({
					segments: [[x, y], [x+w, y], [x+w, y+h], [x, y+h]],
					strokeColor: 'grey',
					strokeScaling: false,
					strokeWidth: 1,
					closed: true
				});

				var res = [];
				decision.res.forEach(function (val, index) {
					if(val == i){
						res.push(userData.products[index]);
					}
				});
				res.sort(function (a,b) {
					return b-a
				});
				res.reduce(function (sum, curr) {
					new paper.Path({
						segments: [[x+sum+h/2, y+4], [x+sum+curr-h/2, y+4], [x+sum+curr, y+h-4], [x+sum, y+h-4]],
						fillColor: new paper.Color(Math.random() * 0.1 + 0.7, Math.random() * 0.3 + 0.66, Math.random() * 0.2 + 0.77),
						closed: true
					});
					new paper.PointText({
						point: [x+sum+curr/2, y+24+h/2],
						content: curr,
						fillColor: 'black',
						justification: 'center',
						fontSize: 72
					});
					return sum + curr + userData.knifewidth;
				}, 0);

			}
		};

	};

	/**
	 * Визуализация двумерного раскроя
	 * @constructor
	 */
	Visualization["2D"] = function V1D() {

		this.draw = function (userData, decision) {

		}
	};

	/**
	 * Визуализация укладки  в пирамиды
	 * @constructor
	 */
	Visualization["Pyramid"] = function VPyramid() {

		this.draw = function (userData, decision) {

		}

	};

	Genetic.Visualization = Visualization;

})();
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

		if (generation == 0)
			return;

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