/**
 * Оптимизатор раскроя
 * @module cutting
 * Created 15.06.2016
 */

(function () {

	//var Genetic = Genetic || require('./genetic');


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
		this.fitness = function(entity) {

			var fitness = 0,
				len = entity.length,
				res = new Int16Array(len),
				products = this.userData.products,
				workpieces = this.userData.workpieces,
				lengths = Array.from(workpieces),
				scraps = lengths.length,
				workpiece_index, scrap_len, min_len, i;

			for (i=0; i<entity.length; ++i) {

				min_len = Infinity;
				workpiece_index = -1;

				lengths.some(function (val, index) {

					scrap_len = val - products[entity[i]];
					if(scrap_len > 0 && scrap_len < min_len){
						min_len = scrap_len;
						workpiece_index = index;

						if(min_len == 0)
							return true;
					}
				});

				if(workpiece_index >=0){
					lengths[workpiece_index] = min_len;
					res[i] = workpiece_index;

				}else{
					lengths.push(6000 - products[entity[i]]);
					res[i] = lengths.length - 1;

				}
			}

			lengths.forEach(function (val, index) {
				fitness += 10e12;
				// if(index < scraps)
				// 	fitness -= workpieces[index];
				fitness -= val * val;
			});

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
			return true;
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
	Cutting["Pyramid"] = function Pyramid() {

	};

	Genetic.Cutting = Cutting;

})();


